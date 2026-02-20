import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/Cancel';
import toast from 'react-hot-toast';
import { ScheduledCall, ScheduledCallAgent } from '../../scheduler/scheduler.types';
import { executeScheduledCallNow, updateScheduledCall } from '../../scheduler/scheduler.api';

interface ScheduledCallsTabProps {
  scheduled: ScheduledCall[];
  onRefresh: () => void;
  onOpenDialog: () => void;
}

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'info', completed: 'success', cancelled: 'default', failed: 'error',
  manual_required: 'warning', in_progress: 'warning',
};

const formatDate = (d: string) =>
  new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const getAgentName = (a: ScheduledCallAgent | string | null) => {
  if (!a) return '-';
  return typeof a === 'string' ? a : a.name;
};

const ScheduledCallsTab = ({ scheduled, onRefresh, onOpenDialog }: ScheduledCallsTabProps) => {
  const handleExecute = async (id: string) => {
    try { await executeScheduledCallNow(id); toast.success('Call executed'); onRefresh(); }
    catch { toast.error('Failed'); }
  };

  const handleCancel = async (id: string) => {
    try { await updateScheduledCall(id, { status: 'cancelled' }); toast.success('Cancelled'); onRefresh(); }
    catch { toast.error('Failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {scheduled.length} scheduled call{scheduled.length !== 1 ? 's' : ''}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={onOpenDialog}>Schedule</Button>
      </Box>

      {scheduled.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No scheduled calls for this contact.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.75rem' }}>Scheduled At</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Agent</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Source</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Reason</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduled.map((sc) => (
              <TableRow key={sc._id} hover>
                <TableCell sx={{ fontSize: '0.78rem' }}>{formatDate(sc.scheduledAt)}</TableCell>
                <TableCell sx={{ fontSize: '0.78rem' }}>{getAgentName(sc.agentId)}</TableCell>
                <TableCell>
                  <Chip label={sc.source.replace('_', ' ')} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={sc.status.replace('_', ' ')} size="small" color={STATUS_COLORS[sc.status] || 'default'} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{
                    maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
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
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default ScheduledCallsTab;
