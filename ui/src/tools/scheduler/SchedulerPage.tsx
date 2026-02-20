import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import { alpha } from '@mui/material/styles';
import toast from 'react-hot-toast';
import AppBreadcrumb from '../../components/AppBreadcrumb';
import { useSocket } from '../../context/SocketContext';
import { fetchScheduledCalls } from './scheduler.api';
import { ScheduledCall, ScheduledCallListParams } from './scheduler.types';
import SchedulerTable from './components/SchedulerTable';
import CreateScheduleDialog from './components/CreateScheduleDialog';

const SchedulerPage = () => {
  const [calls, setCalls] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'scheduledAt' | 'createdAt' | 'status'>('scheduledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { socket } = useSocket();

  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params: ScheduledCallListParams = {
        page: page + 1,
        pageSize: rowsPerPage,
        sortBy,
        sortOrder,
      };
      if (statusFilter) params.status = statusFilter as ScheduledCallListParams['status'];
      if (search.trim()) params.search = search.trim();
      const res = await fetchScheduledCalls(params);
      if (res.success) {
        setCalls(res.data);
        setTotal(res.pagination.total);
      }
    } catch {
      toast.error('Failed to load scheduled calls');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, search, sortBy, sortOrder]);

  useEffect(() => { loadCalls(); }, [loadCalls]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => { loadCalls(); };

    socket.on('scheduledcall:created', handleRefresh);
    socket.on('scheduledcall:executed', handleRefresh);
    socket.on('scheduledcall:in_progress', handleRefresh);
    socket.on('scheduledcall:manual_required', handleRefresh);
    socket.on('schedule:executed', handleRefresh);

    return () => {
      socket.off('scheduledcall:created', handleRefresh);
      socket.off('scheduledcall:executed', handleRefresh);
      socket.off('scheduledcall:in_progress', handleRefresh);
      socket.off('scheduledcall:manual_required', handleRefresh);
      socket.off('schedule:executed', handleRefresh);
    };
  }, [socket, loadCalls]);

  return (
    <Box>
      <AppBreadcrumb items={[{ label: 'Scheduler' }]} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1), borderRadius: '4px', color: 'primary.main',
          }}>
            <ScheduleIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
              Call Scheduler
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage scheduled and upcoming calls
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Schedule Call
        </Button>
      </Box>

      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <SchedulerTable
            calls={calls}
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            statusFilter={statusFilter}
            search={search}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onPageChange={setPage}
            onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
            onStatusFilterChange={(v) => { setStatusFilter(v); setPage(0); }}
            onSearchChange={(v) => { setSearch(v); setPage(0); }}
            onSortChange={(field, order) => { setSortBy(field); setSortOrder(order); }}
            onRefresh={loadCalls}
          />
        )}
      </Card>

      <CreateScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => { setDialogOpen(false); loadCalls(); }}
      />
    </Box>
  );
};

export default SchedulerPage;
