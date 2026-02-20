import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SettingsIcon from '@mui/icons-material/Settings';
import PhoneIcon from '@mui/icons-material/Phone';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { alpha } from '@mui/material/styles';
import toast from 'react-hot-toast';
import AppBreadcrumb from '../../components/AppBreadcrumb';
import { fetchSettings, updateSettings } from './settings.api';
import { SettingsData } from './settings.types';
import CallConfigPanel from './components/CallConfigPanel';
import AiConfigPanel from './components/AiConfigPanel';
import TtsConfigPanel from './components/TtsConfigPanel';

const VERTICAL_TABS = [
  { label: 'Call Config', icon: <PhoneIcon sx={{ fontSize: 18 }} /> },
  { label: 'AI Config', icon: <SmartToyIcon sx={{ fontSize: 18 }} /> },
  { label: 'TTS Config', icon: <RecordVoiceOverIcon sx={{ fontSize: 18 }} /> },
];

const SettingsPage = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verticalTab, setVerticalTab] = useState(0);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetchSettings();
      if (res.success) setSettings(res.data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleGlobalToggle = async (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    try {
      const res = await updateSettings({ useGlobalConfig: checked });
      if (res.success) {
        setSettings(res.data);
        toast.success(checked ? 'Custom configuration enabled' : 'Using global (.env) configuration');
      }
    } catch {
      toast.error('Failed to update configuration mode');
    }
  };

  const isCustom = settings?.useGlobalConfig ?? false;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      <AppBreadcrumb items={[{ label: 'Settings' }]} />

      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: 'primary.main',
          }}>
            <SettingsIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>Settings</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 5.5 }}>
          Manage your API keys and service configurations
        </Typography>
      </Box>

      {/* Global config switch */}
      <Card sx={{ p: 2, mb: 2, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch checked={isCustom} onChange={handleGlobalToggle} color="primary" size="small" />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  Use Custom Configuration
                </Typography>
              }
            />
            <Tooltip title="When OFF, values from the server .env file are used. When ON, your custom configuration overrides the defaults.">
              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {isCustom ? 'Using custom user configuration' : 'Using global (.env) configuration'}
          </Typography>
        </Box>
      </Card>

      {!isCustom && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: '4px' }}>
          Custom configuration is disabled. Enable the switch above to enter your own API keys.
        </Alert>
      )}

      {/* Vertical tabs + content */}
      {settings && (
        <Card sx={{ display: 'flex', minHeight: 380, overflow: 'hidden' }}>
          <Tabs
            orientation="vertical"
            value={verticalTab}
            onChange={(_, v) => setVerticalTab(v)}
            sx={{
              borderRight: 1, borderColor: 'divider', minWidth: 160,
              '& .MuiTab-root': { alignItems: 'center', textAlign: 'left', fontSize: '0.78rem', minHeight: 48, px: 2 },
            }}
          >
            {VERTICAL_TABS.map((tab) => (
              <Tab key={tab.label} icon={tab.icon} iconPosition="start" label={tab.label} />
            ))}
          </Tabs>
          <Box sx={{ flex: 1, p: 3 }}>
            {verticalTab === 0 && <CallConfigPanel settings={settings} disabled={!isCustom} onSaved={loadSettings} />}
            {verticalTab === 1 && <AiConfigPanel settings={settings} disabled={!isCustom} onSaved={loadSettings} />}
            {verticalTab === 2 && <TtsConfigPanel settings={settings} disabled={!isCustom} onSaved={loadSettings} />}
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default SettingsPage;
