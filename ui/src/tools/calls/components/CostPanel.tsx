import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhoneIcon from '@mui/icons-material/Phone';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { alpha } from '@mui/material/styles';
import { CreditsInfo } from '../../settings/settings.types';
import { fetchCreditsApi } from '../../settings/settings.api';

interface CostPanelProps {
  callDuration?: number; // seconds
  isCallActive: boolean;
}

const CostPanel = ({ callDuration = 0, isCallActive }: CostPanelProps) => {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCredits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCreditsApi();
      if (res.success) setCredits(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCredits(); }, [loadCredits]);

  const durationMin = callDuration / 60;
  const estimatedCost = credits
    ? (durationMin * credits.estimatedCostPerMinute.total).toFixed(4)
    : '0.0000';

  const StatusChip = ({ configured, valid }: { configured: boolean; valid?: boolean }) => {
    if (!configured) return <Chip label="Not configured" size="small" color="error" variant="outlined" sx={chipSx} />;
    if (valid === false) return <Chip label="Invalid" size="small" color="warning" variant="outlined" sx={chipSx} />;
    return <Chip label="Active" size="small" color="success" variant="outlined" sx={chipSx} />;
  };

  const chipSx = { height: 18, fontSize: '0.6rem', fontWeight: 600 };

  return (
    <Card sx={{ borderRadius: '4px', overflow: 'auto', height: '100%' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Cost & Credits
            </Typography>
          </Box>
          <Tooltip title="Refresh credits">
            <IconButton size="small" onClick={loadCredits} disabled={loading}>
              {loading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {!credits ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Twilio */}
            <Box sx={{ p: 1, bgcolor: (t) => alpha(t.palette.primary.main, 0.04), borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight={600}>Call Config (Twilio)</Typography>
                <Box sx={{ flex: 1 }} />
                <StatusChip configured={credits.twilio.configured} valid={credits.twilio.configured} />
              </Box>
              {credits.twilio.configured && credits.twilio.balance && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                  Balance: {credits.twilio.currency} {Number(credits.twilio.balance).toFixed(2)}
                  {' | ~$'}{credits.estimatedCostPerMinute.twilio}/min
                </Typography>
              )}
              {credits.twilio.configured && !credits.twilio.balance && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                  ~${credits.estimatedCostPerMinute.twilio}/min outbound
                </Typography>
              )}
            </Box>

            {/* OpenAI */}
            <Box sx={{ p: 1, bgcolor: (t) => alpha(t.palette.info.main, 0.04), borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <SmartToyIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight={600}>AI Config (OpenAI)</Typography>
                <Box sx={{ flex: 1 }} />
                <StatusChip configured={credits.openai.configured} valid={credits.openai.valid} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                ~${credits.estimatedCostPerMinute.openai}/min (GPT-4o-mini)
              </Typography>
            </Box>

            {/* Sarvam */}
            <Box sx={{ p: 1, bgcolor: (t) => alpha(t.palette.secondary.main, 0.04), borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <RecordVoiceOverIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight={600}>TTS Config (Sarvam)</Typography>
                <Box sx={{ flex: 1 }} />
                <StatusChip configured={credits.sarvam.configured} valid={credits.sarvam.valid} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                ~${credits.estimatedCostPerMinute.sarvam}/min TTS
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            {/* Total estimate */}
            <Box sx={{ p: 1, bgcolor: (t) => alpha(t.palette.warning.main, 0.06), borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                Estimated Cost / Minute: ${credits.estimatedCostPerMinute.total.toFixed(3)}
              </Typography>
              {isCallActive && callDuration > 0 && (
                <Typography variant="caption" display="block" color="warning.main" sx={{ fontSize: '0.68rem', mt: 0.3 }}>
                  Current call ({Math.floor(durationMin)}:{String(callDuration % 60).padStart(2, '0')}): ~${estimatedCost}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CostPanel;
