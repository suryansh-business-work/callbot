import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MicIcon from '@mui/icons-material/Mic';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import toast from 'react-hot-toast';
import { fetchCallLogs } from '../../calls/calls.api';
import { CallLogItem } from '../../calls/calls.types';

interface CallHistoryTabProps {
  phone: string;
}

type Order = 'asc' | 'desc';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  completed: 'success', busy: 'warning', 'no-answer': 'error', failed: 'error',
  canceled: 'default', queued: 'info', ringing: 'info', 'in-progress': 'warning',
};

const formatDate = (d: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ConversationMessages = ({ messages }: { messages: { role: string; content: string; timestamp: string }[] }) => (
  <Box sx={{ pl: 1, py: 1, maxHeight: 260, overflow: 'auto' }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
      Conversation ({messages.length} messages)
    </Typography>
    {messages.map((m, i) => (
      <Box key={i} sx={{
        display: 'flex', gap: 1, mb: 0.5, flexDirection: m.role === 'assistant' ? 'row' : 'row-reverse',
      }}>
        <Chip
          label={m.role === 'assistant' ? 'AI' : 'User'}
          size="small"
          color={m.role === 'assistant' ? 'primary' : 'default'}
          sx={{ fontSize: '0.65rem', height: 18, minWidth: 32 }}
        />
        <Box sx={{
          bgcolor: m.role === 'assistant' ? 'action.hover' : 'primary.main',
          color: m.role === 'assistant' ? 'text.primary' : '#fff',
          px: 1.2, py: 0.5, borderRadius: 1, maxWidth: '75%', fontSize: '0.78rem',
        }}>
          {m.content}
        </Box>
      </Box>
    ))}
  </Box>
);

const ExpandableCallRow = ({ log }: { log: CallLogItem }) => {
  const [open, setOpen] = useState(false);
  const hasMessages = log.conversationMessages && log.conversationMessages.length > 0;
  const hasRecording = Boolean(log.recordingUrl);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'unset' : undefined } }}>
        <TableCell sx={{ width: 32, p: 0.3 }}>
          {(hasMessages || hasRecording) && (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
        <TableCell sx={{ py: 0.5, fontSize: '0.78rem' }}>
          <Chip label={log.status} size="small" color={STATUS_COLORS[log.status] || 'default'} />
        </TableCell>
        <TableCell sx={{ py: 0.5, fontSize: '0.78rem' }}>{log.duration || '0'}s</TableCell>
        <TableCell sx={{ py: 0.5, fontSize: '0.78rem' }}>{log.voice || '-'}</TableCell>
        <TableCell sx={{ py: 0.5, fontSize: '0.78rem' }}>{log.language || '-'}</TableCell>
        <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>{formatDate(log.startTime)}</TableCell>
        <TableCell sx={{ width: 60, py: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 0.3 }}>
            {hasRecording && (
              <Tooltip title="Has recording">
                <MicIcon sx={{ fontSize: 14 }} color="primary" />
              </Tooltip>
            )}
            {hasMessages && (
              <Tooltip title="Has conversation">
                <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} color="secondary" />
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </TableRow>
      {(hasMessages || hasRecording) && (
        <TableRow>
          <TableCell sx={{ py: 0 }} colSpan={7}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              {hasMessages && <ConversationMessages messages={log.conversationMessages!} />}
              {hasRecording && (
                <Box sx={{ px: 1, py: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                    Recording
                  </Typography>
                  <audio controls src={log.recordingUrl!} style={{ width: '100%', height: 32 }} />
                </Box>
              )}
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const headCells: { id: keyof CallLogItem; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'duration', label: 'Duration' },
  { id: 'voice', label: 'Voice' },
  { id: 'language', label: 'Language' },
  { id: 'startTime', label: 'Time' },
];

const CallHistoryTab = ({ phone }: CallHistoryTabProps) => {
  const [logs, setLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof CallLogItem>('startTime');

  const load = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const res = await fetchCallLogs({ to: phone, page: page + 1, pageSize: rowsPerPage });
      if (res.success) { setLogs(res.data); setTotal(res.pagination.total); }
    } catch { toast.error('Failed to load call history'); }
    finally { setLoading(false); }
  }, [phone, page, rowsPerPage]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => {
      const av = a[orderBy] || '';
      const bv = b[orderBy] || '';
      if (av < bv) return order === 'asc' ? -1 : 1;
      if (av > bv) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, order, orderBy]);

  const handleSort = (prop: keyof CallLogItem) => {
    setOrder(orderBy === prop && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(prop);
  };

  if (loading && logs.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>;
  }

  return (
    <Box>
      {total === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No call history found for this contact.
        </Typography>
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 32, p: 0.3 }} />
                {headCells.map((cell) => (
                  <TableCell key={cell.id} sx={{ py: 0.5, fontSize: '0.75rem' }}>
                    <TableSortLabel
                      active={orderBy === cell.id}
                      direction={orderBy === cell.id ? order : 'asc'}
                      onClick={() => handleSort(cell.id)}
                    >
                      {cell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell sx={{ width: 60, py: 0.5, fontSize: '0.75rem' }}>Media</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((log) => (
                <ExpandableCallRow key={log.callSid} log={log} />
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </>
      )}
    </Box>
  );
};

export default CallHistoryTab;
