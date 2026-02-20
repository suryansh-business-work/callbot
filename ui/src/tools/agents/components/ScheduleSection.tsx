import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { FormikProps } from 'formik';
import { fetchContacts } from '../../contacts/contacts.api';
import { Contact } from '../../contacts/contacts.types';

interface ScheduleFormValues {
  cronExpression: string;
  contactIds: string[];
  isActive: boolean;
}

interface FormValues {
  schedule: ScheduleFormValues;
  [key: string]: unknown;
}

interface ScheduleSectionProps {
  formik: FormikProps<FormValues>;
  disabled?: boolean;
}

const CRON_PRESETS = [
  { label: 'Every minute (testing)', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9 AM', value: '0 9 * * *' },
  { label: 'Every day at 6 PM', value: '0 18 * * *' },
  { label: 'Mon-Fri at 9 AM', value: '0 9 * * 1-5' },
  { label: 'Mon-Fri at 10 AM & 4 PM', value: '0 10,16 * * 1-5' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'First day of month 9 AM', value: '0 9 1 * *' },
];

const ScheduleSection = ({ formik, disabled }: ScheduleSectionProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [preset, setPreset] = useState('custom');

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await fetchContacts({ pageSize: 200 });
      if (res.success) setContacts(res.data);
    } catch { /* ignore */ }
    finally { setLoadingContacts(false); }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // Sync preset with current cron expression
  useEffect(() => {
    const match = CRON_PRESETS.find((p) => p.value === formik.values.schedule.cronExpression);
    setPreset(match ? match.value : 'custom');
  }, [formik.values.schedule.cronExpression]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value !== 'custom') {
      formik.setFieldValue('schedule.cronExpression', value);
    }
  };

  const selectedContactIds = formik.values.schedule.contactIds || [];
  const selectedContacts = contacts.filter((c) => selectedContactIds.includes(c._id));

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <ScheduleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={700}>
          Call Schedule
        </Typography>
        <Box sx={{ flex: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={formik.values.schedule.isActive}
              onChange={(e) => formik.setFieldValue('schedule.isActive', e.target.checked)}
              size="small"
              disabled={disabled}
            />
          }
          label={
            <Typography variant="caption" color={formik.values.schedule.isActive ? 'primary' : 'text.secondary'}>
              {formik.values.schedule.isActive ? 'Active' : 'Inactive'}
            </Typography>
          }
        />
      </Box>

      <Collapse in={formik.values.schedule.isActive}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Schedule Preset"
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={disabled}
          >
            {CRON_PRESETS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
            <MenuItem value="custom">Custom CRON Expression</MenuItem>
          </TextField>

          <TextField
            fullWidth
            size="small"
            label="CRON Expression"
            name="schedule.cronExpression"
            placeholder="* * * * * (min hour day month weekday)"
            value={formik.values.schedule.cronExpression}
            onChange={formik.handleChange}
            disabled={disabled}
            helperText="Format: minute hour day month weekday"
          />

          <Autocomplete
            multiple
            options={contacts}
            value={selectedContacts}
            loading={loadingContacts}
            getOptionLabel={(c) => `${c.firstName} ${c.lastName}${c.phone ? ` (${c.phone})` : ''}`}
            isOptionEqualToValue={(opt, val) => opt._id === val._id}
            onChange={(_, value) => {
              formik.setFieldValue(
                'schedule.contactIds',
                value.map((c) => c._id)
              );
            }}
            disabled={disabled}
            renderTags={(value, getTagProps) =>
              value.map((contact, index) => {
                const { key, ...rest } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    {...rest}
                    label={`${contact.firstName} ${contact.lastName}`}
                    size="small"
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Select Contacts to Call"
                placeholder="Search contacts..."
              />
            )}
          />

          {selectedContacts.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {selectedContacts.length} contact(s) will be called on schedule
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ScheduleSection;
