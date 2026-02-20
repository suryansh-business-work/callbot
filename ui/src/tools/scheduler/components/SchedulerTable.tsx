import { useState } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import toast from 'react-hot-toast';
import {
  ScheduledCall,
  ScheduledCallContact,
  ScheduledCallAgent,
} from '../scheduler.types';
import {
  executeScheduledCallNow,
  updateScheduledCall,
  deleteScheduledCall,
} from '../scheduler.api';
import { useNavigate } from 'react-router-dom';

type SortableField = 'scheduledAt' | 'createdAt' | 'status';

interface SchedulerTableProps {
  calls: ScheduledCall[];
  total: number;
  page: number;
  rowsPerPage: number;
  statusFilter: string;
  search: string;
  sortBy: SortableField;
  sortOrder: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onStatusFilterChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (field: SortableField, order: 'asc' | 'desc') => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'default',
  failed: 'error',
  manual_required: 'warning',
};

const STATUS_TOOLTIPS: Record<string, string> = {
  pending: 'Call is waiting to be executed at the scheduled time',
  in_progress: 'Call is currently in progress',
  completed: 'Call was successfully placed',
  cancelled: 'Call was cancelled by user',
  failed: 'Call failed — check the note for details',
  manual_required: 'The assigned agent does not allow auto-scheduling. Use "Execute Now" to override.',
};

const getContactName = (c: ScheduledCallContact | string) =>
  typeof c === 'string' ? c : `${c.firstName} ${c.lastName}`;

const getContactPhone = (c: ScheduledCallContact | string) =>
  typeof c === 'string' ? '' : c.phone;

const getAgentName = (a: ScheduledCallAgent | string | null) => {
  if (!a) return '-';
  return typeof a === 'string' ? a : a.name;
};

const formatDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const SchedulerTable = ({
  calls, total, page, rowsPerPage, statusFilter, search, sortBy, sortOrder,
  onPageChange, onRowsPerPageChange, onStatusFilterChange, onSearchChange, onSortChange, onRefresh,
}: SchedulerTableProps) => {
  const [searchInput, setSearchInput] = useState(search);
  const navigate = useNavigate();

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearchChange(searchInput);
  };

  const handleSearchBlur = () => {
    if (searchInput !== search) onSearchChange(searchInput);
  };

  const handleSort = (field: SortableField) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    onSortChange(field, isAsc ? 'desc' : 'asc');
  };

  const handleExecute = async (id: string) => {
    try {
      await executeScheduledCallNow(id);
      toast.success('Call executed');
      onRefresh();
    } catch { toast.error('Failed to execute call'); }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateScheduledCall(id, { status: 'cancelled' });
      toast.success('Call cancelled');
      onRefresh();
    } catch { toast.error('Failed to cancel call'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduledCall(id);
      toast.success('Deleted');
      onRefresh();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <Box>
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search contacts, reason..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onBlur={handleSearchBlur}
          sx={{ minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="manual_required">Manual Required</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {total} scheduled call{total !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell sortDirection={sortBy === 'scheduledAt' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'scheduledAt'}
                  direction={sortBy === 'scheduledAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('scheduledAt')}
                >
                  Scheduled At
                </TableSortLabel>
              </TableCell>
              <TableCell>Source</TableCell>
              <TableCell sortDirection={sortBy === 'status' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'status'}
                  direction={sortBy === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No scheduled calls found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              calls.map((sc) => (
                <TableRow key={sc._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {getContactName(sc.contactId)}
                  </TableCell>
                  <TableCell>{getContactPhone(sc.contactId)}</TableCell>
                  <TableCell>{getAgentName(sc.agentId)}</TableCell>
                  <TableCell>{formatDate(sc.scheduledAt)}</TableCell>
                  <TableCell>
                    <Chip label={sc.source.replace('_', ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={STATUS_TOOLTIPS[sc.status] || ''} arrow>
                      <Chip
                        label={sc.status.replace('_', ' ')}
                        size="small"
                        color={STATUS_COLORS[sc.status] || 'default'}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sc.reason || sc.note || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      {sc.status === 'in_progress' && sc.callSid && (
                        <Tooltip title="Jump to running call">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              const agentId = typeof sc.agentId === 'object' && sc.agentId ? sc.agentId._id : '';
                              navigate(agentId ? `/agents/${agentId}/call?callSid=${sc.callSid}` : `/call?callSid=${sc.callSid}`);
                            }}
                          >
                            <PhoneInTalkIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(sc.status === 'pending' || sc.status === 'manual_required' || sc.status === 'failed') && (
                        <Tooltip title={sc.status === 'manual_required' ? 'Force execute (overrides manual-only restriction)' : 'Execute now'}>
                          <IconButton size="small" color="primary" onClick={() => handleExecute(sc._id)}>
                            <PlayArrowIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(sc.status === 'pending' || sc.status === 'manual_required') && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="warning" onClick={() => handleCancel(sc._id)}>
                            <CancelIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(sc._id)}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Box>
  );
};

export default SchedulerTable;
