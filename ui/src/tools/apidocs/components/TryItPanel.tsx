import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SendIcon from '@mui/icons-material/Send';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../../api/apiClient';

const validationSchema = Yup.object({
  phone: Yup.string()
    .matches(/^\+[1-9]\d{1,14}$/, 'E.164 format required (e.g., +911234567890)')
    .required('Phone is required'),
  firstMessage: Yup.string().max(500),
  voice: Yup.string(),
  model: Yup.string(),
  language: Yup.string(),
  streaming: Yup.boolean(),
  prompt: Yup.string().max(2000),
});

interface TryItFormValues {
  phone: string;
  firstMessage: string;
  voice: string;
  model: string;
  language: string;
  streaming: boolean;
  prompt: string;
}

const VOICES = ['meera', 'pavithra', 'maitreyi', 'arvind', 'karthik'];
const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const LANGUAGES = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'pa-IN', label: 'Punjabi' },
];

const initialValues: TryItFormValues = {
  phone: '',
  firstMessage: 'Hello! I am your AI assistant. How can I help you today?',
  voice: 'meera',
  model: 'gpt-4o-mini',
  language: 'en-IN',
  streaming: false,
  prompt: '',
};

const TryItPanel = () => {
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (values: TryItFormValues) => {
    setResponse(null);
    setError('');
    try {
      const { data } = await apiClient.post('/v1/call', values);
      setResponse(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Request failed');
      } else {
        setError('Request failed');
      }
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.85rem' }}>
        Try It
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  name="phone"
                  label="Phone *"
                  size="small"
                  placeholder="+911234567890"
                  value={values.phone}
                  onChange={handleChange}
                  error={touched.phone && Boolean(errors.phone)}
                  helperText={touched.phone && errors.phone}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  name="firstMessage"
                  label="First Message"
                  size="small"
                  multiline
                  rows={2}
                  value={values.firstMessage}
                  onChange={handleChange}
                  error={touched.firstMessage && Boolean(errors.firstMessage)}
                  helperText={touched.firstMessage && errors.firstMessage}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    name="voice"
                    label="Voice"
                    size="small"
                    select
                    value={values.voice}
                    onChange={handleChange}
                    sx={{ minWidth: 130, flex: 1 }}
                  >
                    {VOICES.map((v) => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    name="model"
                    label="Model"
                    size="small"
                    select
                    value={values.model}
                    onChange={handleChange}
                    sx={{ minWidth: 140, flex: 1 }}
                  >
                    {MODELS.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    name="language"
                    label="Language"
                    size="small"
                    select
                    value={values.language}
                    onChange={handleChange}
                    sx={{ minWidth: 130, flex: 1 }}
                  >
                    {LANGUAGES.map((l) => (
                      <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                    ))}
                  </TextField>
                </Box>
                <TextField
                  name="prompt"
                  label="System Prompt"
                  size="small"
                  multiline
                  rows={3}
                  value={values.prompt}
                  onChange={handleChange}
                  error={touched.prompt && Boolean(errors.prompt)}
                  helperText={touched.prompt && errors.prompt}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={values.streaming}
                        onChange={(e) => setFieldValue('streaming', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.78rem' }}>Streaming Mode</Typography>}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={14} /> : <SendIcon sx={{ fontSize: 16 }} />}
                    sx={{ fontSize: '0.78rem', textTransform: 'none' }}
                  >
                    {isSubmitting ? 'Calling...' : 'Initiate Call'}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>

        {error && <Alert severity="error" sx={{ mt: 1.5, fontSize: '0.75rem' }}>{error}</Alert>}

        {response && (
          <Box
            component="pre"
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 1,
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              lineHeight: 1.5,
              bgcolor: (t) => (t.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'),
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'auto',
              maxHeight: 200,
            }}
          >
            {JSON.stringify(response, null, 2)}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TryItPanel;
