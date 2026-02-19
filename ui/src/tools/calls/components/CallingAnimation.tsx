import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material/styles';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';

const ripple = keyframes`
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.4); opacity: 0; }
`;

const breathe = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

const wave = keyframes`
  0% { height: 8px; }
  50% { height: 22px; }
  100% { height: 8px; }
`;

interface CallingAnimationProps {
  status: 'ringing' | 'connected' | 'ended';
  phoneNumber: string;
  duration?: string;
}

const CallingAnimation = ({ status, phoneNumber, duration }: CallingAnimationProps) => {
  const isRinging = status === 'ringing';
  const isConnected = status === 'connected';
  const color = isConnected ? '#4caf50' : isRinging ? '#ff9800' : '#f44336';

  return (
    <Box
      role="status"
      aria-label={`Call ${status} with ${phoneNumber}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        py: 2,
      }}
    >
      {/* Ripple circle */}
      <Box sx={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(isRinging || isConnected) && (
          <>
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                bgcolor: color,
                opacity: 0.2,
                animation: `${ripple} 1.8s ease-out infinite`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                bgcolor: color,
                opacity: 0.15,
                animation: `${ripple} 1.8s ease-out infinite 0.6s`,
              }}
            />
          </>
        )}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            animation: isRinging ? `${breathe} 1.2s ease-in-out infinite` : undefined,
            boxShadow: `0 0 20px ${color}40`,
            transition: 'all 0.3s ease',
          }}
        >
          <PhoneInTalkIcon sx={{ color: '#fff', fontSize: 26 }} />
        </Box>
      </Box>

      {/* Phone number */}
      <Typography
        variant="body2"
        sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, color: 'text.primary', fontSize: '0.9rem' }}
      >
        {phoneNumber || 'Unknown'}
      </Typography>

      {/* Status */}
      <Typography
        variant="caption"
        sx={{
          color,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontSize: '0.65rem',
        }}
      >
        {status === 'ringing' ? 'Ringing...' : status === 'connected' ? 'Connected' : 'Call Ended'}
      </Typography>

      {/* Duration */}
      {duration && isConnected && (
        <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.primary' }}>
          {duration}
        </Typography>
      )}

      {/* Sound waves */}
      {isConnected && (
        <Box
          aria-hidden="true"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.4,
            height: 24,
          }}
        >
          {[0, 0.15, 0.3, 0.45, 0.6, 0.45, 0.3, 0.15, 0].map((delay, i) => (
            <Box
              key={i}
              sx={{
                width: 3,
                height: 8,
                bgcolor: color,
                borderRadius: 1,
                animation: `${wave} 1s ease-in-out infinite ${delay}s`,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CallingAnimation;
