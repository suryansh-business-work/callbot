import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import CardActionArea from '@mui/material/CardActionArea';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContactsIcon from '@mui/icons-material/Contacts';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import AppBreadcrumb from '../../components/AppBreadcrumb';
import { fetchAgents } from '../agents/agents.api';
import { fetchCallLogs } from '../calls/calls.api';
import { CallLogItem } from '../calls/calls.types';

const breadcrumbItems = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Dashboard' },
];

interface MetricItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    totalCalls: 0,
    completedCalls: 0,
    avgDuration: '0s',
  });
  const [recentCalls, setRecentCalls] = useState<CallLogItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, callsRes] = await Promise.all([
        fetchAgents({ page: 1, pageSize: 1 }),
        fetchCallLogs({ page: 1, pageSize: 10 }),
      ]);

      const totalAgents = agentsRes.success ? agentsRes.pagination.total : 0;
      const totalCalls = callsRes.success ? callsRes.pagination.total : 0;
      const calls = callsRes.success ? callsRes.data : [];
      const completed = calls.filter((c) => c.status === 'completed').length;

      const totalDuration = calls.reduce((sum, c) => sum + parseInt(c.duration || '0', 10), 0);
      const avg = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;
      const avgStr = avg >= 60 ? `${Math.floor(avg / 60)}m ${avg % 60}s` : `${avg}s`;

      setMetrics({ totalAgents, totalCalls, completedCalls: completed, avgDuration: avgStr });
      setRecentCalls(calls);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const metricCards: MetricItem[] = [
    { label: 'TOTAL AGENTS', value: metrics.totalAgents, icon: <SmartToyIcon />, color: '#1337EC', sub: 'Active agents' },
    { label: 'TOTAL CALLS', value: metrics.totalCalls, icon: <PhoneIcon />, color: '#3B82F6', sub: 'All time' },
    { label: 'COMPLETED', value: metrics.completedCalls, icon: <CheckCircleIcon />, color: '#10B981', sub: 'Successfully ended' },
    { label: 'AVG DURATION', value: metrics.avgDuration, icon: <TrendingUpIcon />, color: '#F59E0B', sub: 'Per call' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'failed': return '#F43F5E';
      default: return '#F59E0B';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={32} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 0.5, md: 1 }, py: 1 }}>
      <AppBreadcrumb items={breadcrumbItems} />

      {/* ── Page header ──────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Overview of your call center operations
        </Typography>
      </Box>

      {/* ── Metric cards ─────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metricCards.map((m) => (
          <Grid item xs={6} sm={3} key={m.label}>
            <Card
              sx={{
                height: '100%',
                minHeight: 120,
                borderLeft: `3px solid ${m.color}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: m.color,
                  boxShadow: `0 0 20px ${alpha(m.color, 0.12)}`,
                },
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        fontSize: '0.62rem',
                      }}
                    >
                      {m.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mt: 0.5,
                        color: 'text.primary',
                        fontFamily: '"Inter", monospace',
                      }}
                    >
                      {m.value}
                    </Typography>
                    {m.sub && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {m.sub}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      color: m.color,
                      bgcolor: alpha(m.color, 0.08),
                      boxShadow: `0 0 12px ${alpha(m.color, 0.1)}`,
                    }}
                  >
                    {m.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Quick Access ─────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Quick Access</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Agents', icon: <SmartToyIcon />, path: '/agents', color: '#1337EC' },
            { label: 'Contacts', icon: <ContactsIcon />, path: '/contacts', color: '#3B82F6' },
            { label: 'Scheduler', icon: <ScheduleIcon />, path: '/scheduler', color: '#8B5CF6' },
            { label: 'Prompt Library', icon: <LibraryBooksIcon />, path: '/prompt-library', color: '#F59E0B' },
            { label: 'Settings', icon: <SettingsIcon />, path: '/settings', color: '#6B7280' },
          ].map((item) => (
            <Grid item xs={6} sm={4} md key={item.label}>
              <Card
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: item.color,
                    boxShadow: `0 0 16px ${alpha(item.color, 0.15)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(item.path)} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        color: item.color,
                        bgcolor: alpha(item.color, 0.08),
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Recent calls table ────────────── */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Calls</Typography>
              <Typography variant="caption" color="text.secondary">Last 10 call records</Typography>
            </Box>
            <Chip
              label={`${recentCalls.length} records`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.65rem' }}
            />
          </Box>

          {recentCalls.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <PhoneIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No calls yet. Start by creating an agent and making a call.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Box
                component="table"
                sx={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  '& th': {
                    px: 2,
                    py: 1.5,
                    textAlign: 'left',
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                  },
                  '& td': {
                    px: 2,
                    py: 1.5,
                    textAlign: 'left',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    fontSize: '0.82rem',
                  },
                  '& tr': {
                    transition: 'background-color 0.15s ease',
                    '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.03) },
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>To</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((call) => (
                    <tr key={call.callSid}>
                      <td>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: 'primary.dark',
                            }}
                          >
                            {(call.to || '?').replace(/\D/g, '').slice(-2, -1) || '?'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '0.82rem' }}>
                            {call.to}
                          </Typography>
                        </Box>
                      </td>
                      <td>
                        <Chip
                          label={call.status}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            bgcolor: alpha(getStatusColor(call.status), 0.12),
                            color: getStatusColor(call.status),
                            border: `1px solid ${alpha(getStatusColor(call.status), 0.3)}`,
                          }}
                        />
                      </td>
                      <td>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{call.duration}s</Typography>
                      </td>
                      <td>
                        <Typography variant="body2" color="text.secondary">
                          {call.startTime ? new Date(call.startTime).toLocaleString() : '-'}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
