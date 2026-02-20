import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { alpha } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { CallConfig, TwilioValidation } from '../settings.types';
import { updateSettings, validateTwilioApi } from '../settings.api';

interface TwilioTabProps {
  config: CallConfig;
  disabled: boolean;
  onSaved: () => void;
}

const validationSchema = Yup.object().shape({
  twilioAccountSid: Yup.string().max(100, 'Max 100 characters'),
  twilioAuthToken: Yup.string().max(100, 'Max 100 characters'),
  twilioPhoneNumber: Yup.string().max(20, 'Max 20 characters'),
});

const TwilioTab = ({ config, disabled, onSaved }: TwilioTabProps) => {
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<TwilioValidation | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await validateTwilioApi();
      setValidationResult(res.data);
      if (res.data.valid) {
        toast.success('Twilio credentials are valid!');
      } else {
        toast.error(res.data.message || 'Validation failed');
      }
    } catch {
      toast.error('Failed to validate Twilio credentials');
    } finally {
      setValidating(false);
    }
  };

  // Auto-fetch balance on mount when credentials exist
  useEffect(() => {
    if (config.twilioAccountSid && config.twilioAuthToken) {
      setValidating(true);
      validateTwilioApi()
        .then((res) => setValidationResult(res.data))
        .catch(() => {/* silent */})
        .finally(() => setValidating(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formik = useFormik({
    initialValues: {
      twilioAccountSid: config.twilioAccountSid || '',
      twilioAuthToken: config.twilioAuthToken || '',
      twilioPhoneNumber: config.twilioPhoneNumber || '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      try {
        await updateSettings({ callConfig: values });
        toast.success('Twilio configuration saved');
        onSaved();
      } catch {
        toast.error('Failed to save Twilio configuration');
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Configure your Twilio account credentials for making and receiving calls.
      </Typography>
      <TextField
        fullWidth
        label="Account SID"
        name="twilioAccountSid"
        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        value={formik.values.twilioAccountSid}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.twilioAccountSid && Boolean(formik.errors.twilioAccountSid)}
        helperText={formik.touched.twilioAccountSid && formik.errors.twilioAccountSid}
        disabled={disabled}
      />
      <TextField
        fullWidth
        label="Auth Token"
        name="twilioAuthToken"
        type={showToken ? 'text' : 'password'}
        value={formik.values.twilioAuthToken}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.twilioAuthToken && Boolean(formik.errors.twilioAuthToken)}
        helperText={formik.touched.twilioAuthToken && formik.errors.twilioAuthToken}
        disabled={disabled}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowToken((v) => !v)} edge="end">
                  {showToken ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        fullWidth
        label="Phone Number"
        name="twilioPhoneNumber"
        placeholder="+1234567890"
        value={formik.values.twilioPhoneNumber}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.twilioPhoneNumber && Boolean(formik.errors.twilioPhoneNumber)}
        helperText={formik.touched.twilioPhoneNumber && formik.errors.twilioPhoneNumber}
        disabled={disabled}
      />

      {validationResult && (
        validationResult.valid ? (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
            border: '1px solid', borderColor: (t) => alpha(t.palette.success.main, 0.3),
            bgcolor: (t) => alpha(t.palette.success.main, 0.06), borderRadius: '4px',
          }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 20, color: 'success.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Account Balance</Typography>
              <Typography variant="body2" fontWeight={700} color="success.main">
                {validationResult.currency} {Number(validationResult.balance).toFixed(2)}
              </Typography>
            </Box>
            <Chip label="Valid" size="small" color="success" variant="outlined" />
          </Box>
        ) : (
          <Alert severity="error" sx={{ borderRadius: '4px' }}>
            {validationResult.message || 'Validation failed'}
          </Alert>
        )
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={validating ? <CircularProgress size={16} /> : <VerifiedIcon />}
          onClick={handleValidate}
          disabled={validating}
        >
          {validating ? 'Validating...' : 'Validate'}
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="small"
          startIcon={<SaveIcon />}
          disabled={disabled || formik.isSubmitting}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default TwilioTab;
