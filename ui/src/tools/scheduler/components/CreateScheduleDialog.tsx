import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import MenuItem from '@mui/material/MenuItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { fetchContacts } from '../../contacts/contacts.api';
import { Contact } from '../../contacts/contacts.types';
import { fetchAgents } from '../../agents/agents.api';
import { Agent } from '../../agents/agents.types';
import { createScheduledCall } from '../scheduler.api';
import { ALL_VOICES, SUPPORTED_LANGUAGES } from '../../voices/voices.data';

interface CreateScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Pre-filled contact ID (e.g. from contact details page) */
  prefillContactId?: string;
}

const validationSchema = Yup.object().shape({
  contactId: Yup.string().required('Contact is required'),
  agentId: Yup.string().nullable(),
  scheduledAt: Yup.string().required('Scheduled time is required'),
  reason: Yup.string().max(500),
  note: Yup.string().max(1000),
  isRecurring: Yup.boolean(),
  cronExpression: Yup.string().max(100),
  voice: Yup.string(),
  language: Yup.string(),
  systemPrompt: Yup.string().max(5000),
  message: Yup.string().max(2000),
  aiEnabled: Yup.boolean(),
});

const CreateScheduleDialog = ({ open, onClose, onCreated, prefillContactId }: CreateScheduleDialogProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoadingContacts(true);
      try {
        const [cRes, aRes] = await Promise.all([
          fetchContacts({ pageSize: 500, sortBy: 'firstName', sortOrder: 'asc' }),
          fetchAgents({ pageSize: 500 }),
        ]);
        if (cRes.success) setContacts(cRes.data);
        if (aRes.success) setAgents(aRes.data);
      } catch (err) {
        console.error('Failed to load contacts/agents:', err);
        toast.error('Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };
    load();
  }, [open]);

  const formik = useFormik({
    initialValues: {
      contactId: prefillContactId || '',
      agentId: '',
      scheduledAt: '',
      reason: '',
      note: '',
      isRecurring: false,
      cronExpression: '',
      voice: 'shubh',
      language: 'en-IN',
      systemPrompt: '',
      message: '',
      aiEnabled: true,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await createScheduledCall({
          contactId: values.contactId,
          agentId: values.agentId || null,
          scheduledAt: new Date(values.scheduledAt).toISOString(),
          reason: values.reason,
          note: values.note,
          isRecurring: values.isRecurring,
          cronExpression: values.isRecurring ? values.cronExpression : '',
          voice: values.voice,
          language: values.language,
          systemPrompt: values.systemPrompt,
          message: values.message,
          aiEnabled: values.aiEnabled,
        });
        if (res.success) {
          toast.success(res.message || 'Scheduled call created');
          resetForm();
          onCreated();
        }
      } catch {
        toast.error('Failed to create scheduled call');
      }
    },
  });

  const selectedContact = contacts.find((c) => c._id === formik.values.contactId) || null;
  const selectedAgent = agents.find((a) => a._id === formik.values.agentId) || null;

  /* When agent changes, pre-fill call config from agent defaults */
  const handleAgentChange = (agent: Agent | null) => {
    formik.setFieldValue('agentId', agent?._id || '');
    if (agent) {
      if (agent.voice) formik.setFieldValue('voice', agent.voice);
      if (agent.systemPrompt) formik.setFieldValue('systemPrompt', agent.systemPrompt);
      if (agent.greeting) formik.setFieldValue('message', agent.greeting);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Schedule a Call</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <Autocomplete
            options={contacts}
            getOptionLabel={(c) => `${c.firstName} ${c.lastName} (${c.phone})`}
            value={selectedContact}
            onChange={(_, val) => formik.setFieldValue('contactId', val?._id || '')}
            loading={loadingContacts}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Contact *"
                error={formik.touched.contactId && Boolean(formik.errors.contactId)}
                helperText={formik.touched.contactId && formik.errors.contactId}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingContacts ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

          <Autocomplete
            options={agents}
            getOptionLabel={(a) => a.name}
            value={selectedAgent}
            onChange={(_, val) => handleAgentChange(val)}
            renderInput={(params) => <TextField {...params} label="Agent (optional)" />}
          />

          <TextField
            label="Scheduled At *"
            type="datetime-local"
            name="scheduledAt"
            value={formik.values.scheduledAt}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.scheduledAt && Boolean(formik.errors.scheduledAt)}
            helperText={formik.touched.scheduledAt && formik.errors.scheduledAt}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Reason"
            name="reason"
            multiline
            rows={2}
            value={formik.values.reason}
            onChange={formik.handleChange}
            placeholder="e.g. User requested callback at this time"
          />

          <TextField
            label="Note"
            name="note"
            value={formik.values.note}
            onChange={formik.handleChange}
            placeholder="Additional notes"
          />

          <FormControlLabel
            control={
              <Switch
                checked={formik.values.isRecurring}
                onChange={(e) => formik.setFieldValue('isRecurring', e.target.checked)}
                size="small"
              />
            }
            label="Recurring call"
          />
          {formik.values.isRecurring && (
            <TextField
              label="CRON Expression"
              name="cronExpression"
              value={formik.values.cronExpression}
              onChange={formik.handleChange}
              placeholder="e.g. 0 9 * * 1-5 (Mon-Fri 9 AM)"
              helperText="Standard CRON format: min hour day month weekday"
            />
          )}

          <Divider sx={{ my: 0.5 }} />

          <Accordion
            disableGutters
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', '&::before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>Call Configuration</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.aiEnabled}
                    onChange={(e) => formik.setFieldValue('aiEnabled', e.target.checked)}
                    size="small"
                  />
                }
                label="AI Enabled"
              />

              <TextField
                select
                label="Voice"
                name="voice"
                value={formik.values.voice}
                onChange={formik.handleChange}
                size="small"
              >
                {ALL_VOICES.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.name} ({v.gender})</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Language"
                name="language"
                value={formik.values.language}
                onChange={formik.handleChange}
                size="small"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <MenuItem key={l.code} value={l.code}>{l.flag} {l.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Greeting Message"
                name="message"
                multiline
                rows={2}
                value={formik.values.message}
                onChange={formik.handleChange}
                placeholder="First message the AI will say when the call connects"
              />

              {formik.values.aiEnabled && (
                <TextField
                  label="System Prompt"
                  name="systemPrompt"
                  multiline
                  rows={3}
                  value={formik.values.systemPrompt}
                  onChange={formik.handleChange}
                  placeholder="Instructions for the AI agent during the call"
                />
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? 'Creating...' : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateScheduleDialog;
