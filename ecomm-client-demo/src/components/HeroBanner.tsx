import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';

const HeroBanner = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #111827 0%, #1E293B 50%, #312E81 100%)',
        color: '#fff',
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4 },
        mb: { xs: 3, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '60%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ maxWidth: 960, mx: 'auto', position: 'relative', zIndex: 1 }}>
        <Chip
          label="AI-Powered Shopping Experience"
          size="small"
          sx={{
            bgcolor: 'rgba(99,102,241,0.2)',
            color: '#A5B4FC',
            fontWeight: 700,
            fontSize: '0.68rem',
            mb: 2,
            height: 26,
            letterSpacing: '0.04em',
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
            fontWeight: 900,
            lineHeight: 1.15,
            mb: 1.5,
            maxWidth: 600,
          }}
        >
          Premium Electronics.<br />Delivered with Intelligence.
        </Typography>
        <Typography sx={{ fontSize: { xs: '0.82rem', md: '0.95rem' }, color: 'rgba(255,255,255,0.65)', maxWidth: 500, mb: 3, lineHeight: 1.6 }}>
          Add products to your cart and our AI assistant will call you to discuss your selections. A seamless, voice-first shopping experience.
        </Typography>

        {/* Trust badges */}
        <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 3 }, flexWrap: 'wrap' }}>
          {[
            { icon: <LocalShippingIcon sx={{ fontSize: 16 }} />, text: 'Free Delivery' },
            { icon: <VerifiedIcon sx={{ fontSize: 16 }} />, text: '1 Year Warranty' },
            { icon: <HeadsetMicIcon sx={{ fontSize: 16 }} />, text: 'AI Call Support' },
          ].map((badge) => (
            <Box key={badge.text} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ color: '#818CF8' }}>{badge.icon}</Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                {badge.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default HeroBanner;
