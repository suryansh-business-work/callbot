import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppBreadcrumb from '../../../components/AppBreadcrumb';
import { createAgentValidationSchema, createAgentInitialValues } from '../agents.validation';
import { createAgentApi } from '../agents.api';
import VoiceSelector from '../../voices/VoiceSelector';
import ScheduleSection from '../components/ScheduleSection';

const breadcrumbItems = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Agents', href: '/agents' },
  { label: 'Create' },
];

const CreateAgentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: createAgentInitialValues,
    validationSchema: createAgentValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await createAgentApi(values);
        if (response.success && response.data) {
          toast.success('Agent created!');
          navigate(`/agents/${response.data._id}/call`);
        } else {
          toast.error(response.message);
        }
      } catch {
        toast.error('Failed to create agent');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, py: 1 }}>
      <AppBreadcrumb items={breadcrumbItems} />
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Create Call Agent</Typography>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Agent Name" name="name"
                value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={(formik.touched.name && formik.errors.name) || 'Give your agent a descriptive name (e.g., Sales Bot, Support Agent)'}
                disabled={loading}
                placeholder="e.g., Customer Support Bot"
              />
              <TextField
                fullWidth label="Greeting Message" name="greeting"
                value={formik.values.greeting} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.greeting && Boolean(formik.errors.greeting)}
                helperText={(formik.touched.greeting && formik.errors.greeting) || 'First message the agent will speak when the call connects'}
                disabled={loading}
                multiline rows={2}
              />
              <TextField
                fullWidth label="System Prompt" name="systemPrompt"
                value={formik.values.systemPrompt} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.systemPrompt && Boolean(formik.errors.systemPrompt)}
                helperText={(formik.touched.systemPrompt && formik.errors.systemPrompt) || 'Instructions that define how the AI agent behaves during calls'}
                disabled={loading}
                multiline rows={4} placeholder="Describe how the AI agent should behave..."
              />

              <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Choose Voice</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Select the text-to-speech voice for your agent. Click the play button to preview.
                </Typography>
                <VoiceSelector
                  value={formik.values.voice}
                  onChange={(v) => formik.setFieldValue('voice', v)}
                  disabled={loading}
                />
              </Box>

              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ScheduleSection formik={formik as any} disabled={loading} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.allowScheduling}
                    onChange={(e) => formik.setFieldValue('allowScheduling', e.target.checked)}
                    disabled={loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Allow Scheduling</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Let this agent be used for scheduled / callback calls
                    </Typography>
                  </Box>
                }
                sx={{ ml: 0, alignItems: 'flex-start' }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/agents')} disabled={loading}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}>
                  {loading ? 'Creating...' : 'Create Agent'}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateAgentPage;
