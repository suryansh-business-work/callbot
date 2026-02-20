import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useFormik } from 'formik';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppBreadcrumb from '../../../components/AppBreadcrumb';
import { createAgentValidationSchema } from '../agents.validation';
import { fetchAgentById, updateAgentApi } from '../agents.api';
import VoiceSelector from '../../voices/VoiceSelector';
import AgentPhotoUpload from '../components/AgentPhotoUpload';
import ScheduleSection from '../components/ScheduleSection';

const breadcrumbItems = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Agents', href: '/agents' },
  { label: 'Edit' },
];

const EditAgentPage = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [agentImage, setAgentImage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '', voice: 'Polly.Joanna-Neural', greeting: '', systemPrompt: '',
      schedule: { cronExpression: '', contactIds: [] as string[], isActive: false },
      allowScheduling: true,
    },
    validationSchema: createAgentValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!agentId) return;
      setLoading(true);
      try {
        const response = await updateAgentApi(agentId, values);
        if (response.success) {
          toast.success('Agent updated!');
          navigate('/agents');
        } else {
          toast.error(response.message);
        }
      } catch {
        toast.error('Failed to update agent');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (!agentId) return;
    const load = async () => {
      try {
        const res = await fetchAgentById(agentId);
        if (res.success && res.data) {
          const agentData = res.data;
          // Extract contact IDs from populated or plain array
          const contactIds = (agentData.schedule?.contactIds || []).map((c) =>
            typeof c === 'string' ? c : c._id
          );
          formik.setValues({
            name: agentData.name,
            voice: agentData.voice,
            greeting: agentData.greeting || '',
            systemPrompt: agentData.systemPrompt,
            schedule: {
              cronExpression: agentData.schedule?.cronExpression || '',
              contactIds,
              isActive: agentData.schedule?.isActive || false,
            },
            allowScheduling: agentData.allowScheduling !== false,
          });
          setAgentImage(agentData.image || null);
        } else {
          toast.error('Agent not found');
          navigate('/agents');
        }
      } catch {
        toast.error('Failed to load agent');
        navigate('/agents');
      } finally {
        setFetching(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  if (fetching) {
    return (
      <Box>
        <AppBreadcrumb items={breadcrumbItems} />
        <Card sx={{ maxWidth: 700, mx: 'auto' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[40, 56, 80, 140].map((h, i) => (
              <Skeleton key={i} variant="rounded" height={h} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, py: 1 }}>
      <AppBreadcrumb items={breadcrumbItems} />
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Edit Call Agent</Typography>

          <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
            <AgentPhotoUpload
              agentId={agentId}
              currentImage={agentImage}
              onImageUploaded={(url) => setAgentImage(url)}
              disabled={loading}
            />
          </Box>

          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Agent Name" name="name"
                value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={(formik.touched.name && formik.errors.name) || 'Give your agent a descriptive name'}
                disabled={loading}
              />
              <TextField
                fullWidth label="Greeting Message" name="greeting"
                value={formik.values.greeting} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.greeting && Boolean(formik.errors.greeting)}
                helperText={(formik.touched.greeting && formik.errors.greeting) || 'First message spoken when the call connects'}
                disabled={loading}
                multiline rows={2}
              />
              <TextField
                fullWidth label="System Prompt" name="systemPrompt"
                value={formik.values.systemPrompt} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.systemPrompt && Boolean(formik.errors.systemPrompt)}
                helperText={(formik.touched.systemPrompt && formik.errors.systemPrompt) || 'Instructions defining AI agent behavior during calls'}
                disabled={loading}
                multiline rows={4}
              />

              <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Choose Voice</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Select the text-to-speech voice. Click the play button to preview.
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditAgentPage;
