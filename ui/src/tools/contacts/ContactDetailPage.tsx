import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import HistoryIcon from '@mui/icons-material/History';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EmailIcon from '@mui/icons-material/Email';
import toast from 'react-hot-toast';
import AppBreadcrumb from '../../components/AppBreadcrumb';
import { fetchContactById } from './contacts.api';
import { Contact } from './contacts.types';
import { fetchScheduledCallsByContact } from '../scheduler/scheduler.api';
import { ScheduledCall } from '../scheduler/scheduler.types';
import CreateScheduleDialog from '../scheduler/components/CreateScheduleDialog';
import ContactInfoCard from './components/ContactInfoCard';
import CallHistoryTab from './components/CallHistoryTab';
import ScheduledCallsTab from './components/ScheduledCallsTab';
import EmailComposerDialog from './components/EmailComposerDialog';

const ContactDetailPage = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetchContactById(contactId),
        fetchScheduledCallsByContact(contactId),
      ]);
      if (cRes.success && cRes.data) setContact(cRes.data);
      if (sRes.success) setScheduled(sRes.data);
    } catch { toast.error('Failed to load contact'); }
    finally { setLoading(false); }
  }, [contactId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!contact) {
    return <Typography color="error" sx={{ py: 4 }}>Contact not found</Typography>;
  }

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const pendingCount = scheduled.filter((s) => s.status === 'pending' || s.status === 'manual_required').length;

  return (
    <Box>
      <AppBreadcrumb items={[
        { label: 'Contacts', href: '/contacts' },
        { label: fullName },
      ]} />

      <ContactInfoCard contact={contact} pendingScheduledCount={pendingCount} />

      {/* Action buttons */}
      {contact.email && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<EmailIcon />} onClick={() => setEmailDialogOpen(true)}>
            Send Email
          </Button>
        </Box>
      )}

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Call History" sx={{ textTransform: 'none', minHeight: 48, fontSize: '0.82rem' }} />
          <Tab
            icon={<Badge badgeContent={pendingCount} color="warning" max={99}>
              <ScheduleIcon sx={{ fontSize: 16 }} />
            </Badge>}
            iconPosition="start"
            label="Scheduled Calls"
            sx={{ textTransform: 'none', minHeight: 48, fontSize: '0.82rem' }}
          />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tab === 0 && <CallHistoryTab phone={contact.phone} />}
          {tab === 1 && (
            <ScheduledCallsTab
              scheduled={scheduled}
              onRefresh={load}
              onOpenDialog={() => setScheduleDialogOpen(true)}
            />
          )}
        </Box>
      </Card>

      <CreateScheduleDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onCreated={() => { setScheduleDialogOpen(false); load(); }}
        prefillContactId={contactId}
      />

      <EmailComposerDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        prefillTo={contact.email}
        contactName={fullName}
      />
    </Box>
  );
};

export default ContactDetailPage;
