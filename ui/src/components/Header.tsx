import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useModel, AI_MODELS } from '../context/ModelContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { connected } = useSocket();
  const { aiModel, setAiModel } = useModel();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
    { label: 'Agents', path: '/agents', icon: <SmartToyIcon sx={{ fontSize: 18 }} /> },
    { label: 'Contacts', path: '/contacts', icon: <BusinessIcon sx={{ fontSize: 18 }} /> },
    { label: 'Scheduler', path: '/scheduler', icon: <ScheduleIcon sx={{ fontSize: 18 }} /> },
    { label: 'Prompts', path: '/prompt-library', icon: <LibraryBooksIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', zIndex: 1200 }}>
      <Toolbar
        sx={{
          gap: 1,
          minHeight: { xs: 52, md: 56 },
          px: { xs: 1.5, md: 3 },
        }}
      >
        {/* ── Brand ─────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            mr: { xs: 1, md: 3 },
            '&:hover .brand-icon': {
              boxShadow: (t) => `0 0 12px ${alpha(t.palette.primary.main, 0.3)}`,
            },
          }}
          onClick={() => navigate('/dashboard')}
        >
          <Box
            className="brand-icon"
            sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: '#fff',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <HeadsetMicIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex', flexDirection: 'column', justifyContent: 'center' } }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                fontSize: '0.78rem',
                letterSpacing: '0.06em',
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              Auto
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.04em' }}>
              Calling Agents
            </Typography>
          </Box>
        </Box>

        {/* ── Navigation ───────────────────── */}
        {isAuthenticated && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flex: 1 }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Button
                  key={item.path}
                  size="small"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: active ? 'primary.main' : 'text.secondary',
                    bgcolor: active ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent',
                    borderBottom: active ? '2px solid' : '2px solid transparent',
                    borderColor: active ? 'primary.main' : 'transparent',
                    px: 2,
                    py: 0.8,
                    fontSize: '0.8rem',
                    minHeight: 36,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
        )}

        {!isAuthenticated && <Box sx={{ flex: 1 }} />}

        {/* ── AI Model selector ────────────── */}
        {isAuthenticated && (
          <TextField
            select
            size="small"
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            sx={{
              minWidth: 130,
              '& .MuiInputBase-root': { fontSize: '0.72rem', height: 30 },
              '& .MuiSelect-select': { py: '4px' },
            }}
          >
            {AI_MODELS.map((m) => (
              <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.72rem' }}>
                {m.label}
                <Chip
                  label={m.tier}
                  size="small"
                  sx={{
                    ml: 0.5,
                    height: 16,
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                />
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* ── Status indicator ─────────────── */}
        {isAuthenticated && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.3,
              border: '1px solid',
              borderColor: connected ? (t) => alpha(t.palette.success.main, 0.3) : (t) => alpha(t.palette.error.main, 0.3),
              bgcolor: connected ? (t) => alpha(t.palette.success.main, 0.06) : (t) => alpha(t.palette.error.main, 0.06),
              flexShrink: 0,
            }}
          >
            <FiberManualRecordIcon
              sx={{
                fontSize: 8,
                color: connected ? '#10B981' : '#F43F5E',
                animation: connected ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 600, color: connected ? 'success.main' : 'error.main', whiteSpace: 'nowrap' }}>
              {connected ? 'Connected with live server' : 'Disconnected'}
            </Typography>
          </Box>
        )}

        {/* ── Theme toggle ─────────────────── */}
        <IconButton
          size="small"
          onClick={toggleTheme}
          sx={{
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
            width: 32,
            height: 32,
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        >
          {mode === 'light' ? <DarkModeIcon sx={{ fontSize: 16 }} /> : <LightModeIcon sx={{ fontSize: 16 }} />}
        </IconButton>

        {/* ── User menu ────────────────────── */}
        {isAuthenticated && user ? (
          <Box>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                p: 0.3,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Avatar
                src={user.profilePhoto || undefined}
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: 'primary.dark',
                  color: '#fff',
                }}
              >
                {user.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" fontWeight={700}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>{user.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.2, fontSize: '0.82rem' }}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }} sx={{ py: 1.2, fontSize: '0.82rem' }}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main', py: 1.2, fontSize: '0.82rem' }}>
                <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : null}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
