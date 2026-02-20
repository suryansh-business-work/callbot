import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import CallIcon from '@mui/icons-material/Call';
import { alpha } from '@mui/material/styles';
import { Contact } from '../contacts.types';

interface ContactInfoCardProps {
  contact: Contact;
  pendingScheduledCount: number;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const ContactInfoCard = ({ contact, pendingScheduledCount }: ContactInfoCardProps) => {
  const navigate = useNavigate();
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{
            width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1), borderRadius: '4px', color: 'primary.main',
          }}>
            <PersonIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
            <Typography variant="caption" color="text.secondary">Scheduled</Typography>
            <Typography variant="body2" fontWeight={600}>{pendingScheduledCount} pending</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ContactInfoCard;
