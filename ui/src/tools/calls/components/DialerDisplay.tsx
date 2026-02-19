import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PhoneIcon from '@mui/icons-material/Phone';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicOffIcon from '@mui/icons-material/MicOff';
import MicIcon from '@mui/icons-material/Mic';
import PauseIcon from '@mui/icons-material/Pause';
import CallingAnimation from './CallingAnimation';

interface DialerDisplayProps {
  phoneNumber: string;
  isActive: boolean;
  duration: number;
  onHangup: () => void;
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const DialerDisplay = ({ phoneNumber, isActive, duration, onHangup }: DialerDisplayProps) => {
  const [elapsed, setElapsed] = useState(duration);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <Card
      role="region"
      aria-label="Active call"
      sx={{
        background: (t) => `linear-gradient(135deg, ${t.palette.grey[900]} 0%, ${t.palette.grey[800]} 100%)`,
        color: '#fff',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
        <CallingAnimation
          status={isActive ? 'connected' : 'ringing'}
          phoneNumber={phoneNumber}
          duration={formatDuration(elapsed)}
        />

        {/* Call controls */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            mt: 1.5,
          }}
        >
          <Tooltip title={muted ? 'Unmute' : 'Mute'} arrow>
            <IconButton
              onClick={() => setMuted(!muted)}
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
              sx={{
                bgcolor: muted ? 'warning.main' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                width: 42,
                height: 42,
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: muted ? 'warning.dark' : 'rgba(255,255,255,0.2)' },
              }}
            >
              {muted ? <MicOffIcon sx={{ fontSize: 20 }} /> : <MicIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Hold" arrow>
            <IconButton
              aria-label="Hold call"
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                width: 42,
                height: 42,
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <PauseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="End Call" arrow>
            <IconButton
              onClick={onHangup}
              aria-label="End call"
              sx={{
                bgcolor: 'error.main',
                color: '#fff',
                width: 42,
                height: 42,
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'error.dark', transform: 'scale(1.08)' },
              }}
            >
              <CallEndIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

interface DialerIdleProps {
  phoneNumber: string;
}

export const DialerIdle = ({ phoneNumber }: DialerIdleProps) => {
  return (
    <Card
      role="status"
      aria-label="Ready to call"
      sx={{
        background: (t) => `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
        color: '#fff',
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 1, textAlign: 'center', '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            <PhoneIcon sx={{ fontSize: 20, opacity: 0.9 }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 1.5 }}>
              {phoneNumber || 'Enter a number'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>Ready to call</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DialerDisplay;
