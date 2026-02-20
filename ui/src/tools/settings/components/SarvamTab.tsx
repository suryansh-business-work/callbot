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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { alpha } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { TtsConfig, SarvamValidation } from '../settings.types';
import { updateSettings, validateSarvamApi } from '../settings.api';

interface SarvamTabProps {
  config: TtsConfig;
  disabled: boolean;
  onSaved: () => void;
}

const validationSchema = Yup.object().shape({
  sarvamApiKey: Yup.string().max(200, 'Max 200 characters'),
});

const SarvamTab = ({ config, disabled, onSaved }: SarvamTabProps) => {
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<SarvamValidation | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await validateSarvamApi();
      setValidationResult(res.data);
      if (res.data.valid) {
        toast.success('Sarvam API key is valid!');
      } else {
        toast.error(res.data.message || 'Validation failed');
      }
    } catch {
      toast.error('Failed to validate Sarvam API key');
    } finally {
      setValidating(false);
    }
  };

  // Auto-fetch on mount when key exists
  useEffect(() => {
    if (config.sarvamApiKey) {
      setValidating(true);
      validateSarvamApi()
        .then((res) => setValidationResult(res.data))
        .catch(() => {/* silent */})
        .finally(() => setValidating(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formik = useFormik({
    initialValues: {
      sarvamApiKey: config.sarvamApiKey || '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      try {
        await updateSettings({ ttsConfig: values });
        toast.success('Sarvam API configuration saved');
        onSaved();
      } catch {
        toast.error('Failed to save Sarvam API configuration');
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Configure your Sarvam.ai API key for Text-to-Speech services.
      </Typography>
      <TextField
        fullWidth
        label="API Key"
        name="sarvamApiKey"
        placeholder="Enter your Sarvam.ai API key"
        type={showKey ? 'text' : 'password'}
        value={formik.values.sarvamApiKey}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.sarvamApiKey && Boolean(formik.errors.sarvamApiKey)}
        helperText={formik.touched.sarvamApiKey && formik.errors.sarvamApiKey}
        disabled={disabled}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowKey((v) => !v)} edge="end">
                  {showKey ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {validationResult && (
        validationResult.valid ? (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
            border: '1px solid', borderColor: (t) => alpha(t.palette.success.main, 0.3),
            bgcolor: (t) => alpha(t.palette.success.main, 0.06), borderRadius: '4px',
          }}>
            <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600} color="success.main">
                API key is valid and working
              </Typography>
            </Box>
            <Chip label="Active" size="small" color="success" variant="outlined" />
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

export default SarvamTab;
