import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid2';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/Cancel';
import CallIcon from '@mui/icons-material/Call';
import { alpha } from '@mui/material/styles';
import toast from 'react-hot-toast';
import AppBreadcrumb from '../../components/AppBreadcrumb';
import { fetchContactById } from './contacts.api';
import { Contact } from './contacts.types';
import { fetchScheduledCallsByContact, executeScheduledCallNow, updateScheduledCall } from '../scheduler/scheduler.api';
import { ScheduledCall, ScheduledCallAgent } from '../scheduler/scheduler.types';
import CreateScheduleDialog from '../scheduler/components/CreateScheduleDialog';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'info', completed: 'success', cancelled: 'default', failed: 'error', manual_required: 'warning',
};

const formatDate = (d: string) =>
  new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const getAgentName = (a: ScheduledCallAgent | string | null) => {
  if (!a) return '-';
  return typeof a === 'string' ? a : a.name;
};

const ContactDetailPage = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleExecute = async (id: string) => {
    try { await executeScheduledCallNow(id); toast.success('Call executed'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleCancel = async (id: string) => {
    try { await updateScheduledCall(id, { status: 'cancelled' }); toast.success('Cancelled'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!contact) {
    return <Typography color="error" sx={{ py: 4 }}>Contact not found</Typography>;
  }

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <Box>
      <AppBreadcrumb items={[
        { label: 'Contacts', href: '/contacts' },
        { label: fullName },
      ]} />

      {/* Contact Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1), borderRadius: '4px', color: 'primary.main',
            }}>
              <PersonIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>{fullName}</Typography>
              {contact.jobTitle && (
                <Typography variant="body2" color="text.secondary">{contact.jobTitle}</Typography>
              )}
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<CallIcon />}
              onClick={() => navigate(`/call?phone=${encodeURIComponent(contact.phone)}`)}
            >
              Call Now
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">{contact.phone || 'No phone'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">{contact.email || 'No email'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {contact.companyId && typeof contact.companyId === 'object'
                    ? contact.companyId.name : 'No company'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {contact.tags.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {contact.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}

          {contact.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {contact.notes}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Total Calls</Typography>
              <Typography variant="body2" fontWeight={600}>{contact.totalCalls}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Last Called</Typography>
              <Typography variant="body2" fontWeight={600}>
                {contact.lastCalledAt ? formatDate(contact.lastCalledAt) : 'Never'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2" fontWeight={600}>{formatDate(contact.createdAt)}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Scheduled Calls</Typography>
              <Typography variant="body2" fontWeight={600}>
                {scheduled.filter((s) => s.status === 'pending' || s.status === 'manual_required').length} pending
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Scheduled Calls Section */}
      <Card>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
              Scheduled Calls ({scheduled.length})
            </Typography>
          </Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Schedule
          </Button>
        </Box>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Scheduled At</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduled.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">No scheduled calls</Typography>
                </TableCell>
              </TableRow>
            ) : (
              scheduled.map((sc) => (
                <TableRow key={sc._id} hover>
                  <TableCell>{formatDate(sc.scheduledAt)}</TableCell>
                  <TableCell>{getAgentName(sc.agentId)}</TableCell>
                  <TableCell>
                    <Chip label={sc.source.replace('_', ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={sc.status.replace('_', ' ')} size="small" color={STATUS_COLORS[sc.status] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sc.reason || sc.note || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {(sc.status === 'pending' || sc.status === 'manual_required') && (
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Execute now">
                          <IconButton size="small" color="primary" onClick={() => handleExecute(sc._id)}>
                            <PlayArrowIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="warning" onClick={() => handleCancel(sc._id)}>
                            <CancelIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CreateScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => { setDialogOpen(false); load(); }}
        prefillContactId={contactId}
      />
    </Box>
  );
};

export default ContactDetailPage;
