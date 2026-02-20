import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import WifiIcon from '@mui/icons-material/Wifi';
import toast from 'react-hot-toast';
import { SettingsData } from '../settings.types';
import { updateSettings } from '../settings.api';
import apiClient from '../../../api/apiClient';

interface EmailConfigPanelProps {
  settings: SettingsData;
  disabled: boolean;
  onSaved: () => void;
}

const validationSchema = Yup.object().shape({
  smtpHost: Yup.string().max(200),
  smtpPort: Yup.number().integer().min(1).max(65535),
  smtpUser: Yup.string().max(200),
  smtpPass: Yup.string().max(200),
  smtpFrom: Yup.string().email('Invalid email').max(200),
});

const EmailConfigPanel = ({ settings, disabled, onSaved }: EmailConfigPanelProps) => {
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data } = await apiClient.post<{ success: boolean; data: { valid: boolean; message: string } }>('/emails/validate');
      if (data.success && data.data.valid) {
        toast.success(data.data.message || 'SMTP connection successful');
      } else {
        toast.error(data.data?.message || 'SMTP validation failed');
      }
    } catch {
      toast.error('Failed to test SMTP connection');
    } finally {
      setTesting(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      smtpHost: settings.emailConfig?.smtpHost || '',
      smtpPort: settings.emailConfig?.smtpPort || 587,
      smtpUser: settings.emailConfig?.smtpUser || '',
      smtpPass: settings.emailConfig?.smtpPass || '',
      smtpFrom: settings.emailConfig?.smtpFrom || '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      try {
        await updateSettings({
          emailConfig: {
            smtpHost: values.smtpHost,
            smtpPort: values.smtpPort,
            smtpUser: values.smtpUser,
            smtpPass: values.smtpPass,
            smtpFrom: values.smtpFrom,
          },
        });
        toast.success('Email configuration saved');
        onSaved();
      } catch {
        toast.error('Failed to save email configuration');
      }
    },
  });

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Email (SMTP) Configuration
      </Typography>
      <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
        Configure SMTP settings to send emails from the contact details page.
        Uses Gmail SMTP by default if left empty.
      </Alert>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <TextField
          label="SMTP Host"
          name="smtpHost"
          value={formik.values.smtpHost}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.smtpHost && Boolean(formik.errors.smtpHost)}
          helperText={formik.touched.smtpHost && formik.errors.smtpHost}
          disabled={disabled}
          size="small"
          placeholder="smtp.gmail.com"
        />
        <TextField
          label="SMTP Port"
          name="smtpPort"
          type="number"
          value={formik.values.smtpPort}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.smtpPort && Boolean(formik.errors.smtpPort)}
          helperText={formik.touched.smtpPort && formik.errors.smtpPort}
          disabled={disabled}
          size="small"
        />
        <TextField
          label="SMTP User"
          name="smtpUser"
          value={formik.values.smtpUser}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.smtpUser && Boolean(formik.errors.smtpUser)}
          helperText={formik.touched.smtpUser && formik.errors.smtpUser}
          disabled={disabled}
          size="small"
          placeholder="your-email@gmail.com"
        />
        <TextField
          label="SMTP Password"
          name="smtpPass"
          type="password"
          value={formik.values.smtpPass}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.smtpPass && Boolean(formik.errors.smtpPass)}
          helperText={formik.touched.smtpPass && formik.errors.smtpPass}
          disabled={disabled}
          size="small"
          placeholder="App password or SMTP password"
        />
        <TextField
          label="From Email"
          name="smtpFrom"
          value={formik.values.smtpFrom}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.smtpFrom && Boolean(formik.errors.smtpFrom)}
          helperText={formik.touched.smtpFrom && formik.errors.smtpFrom}
          disabled={disabled}
          size="small"
          placeholder="noreply@yourcompany.com"
        />
        <Box sx={{ display: 'flex', gap: 1.5, alignSelf: 'flex-start' }}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            disabled={disabled || formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={testing ? <CircularProgress size={14} /> : <WifiIcon />}
            disabled={disabled || testing}
            onClick={handleTestConnection}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EmailConfigPanel;
