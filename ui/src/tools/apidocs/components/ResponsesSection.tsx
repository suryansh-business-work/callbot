import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { ApiResponse } from '../apidocs.constants';

interface ResponsesSectionProps {
  responses: ApiResponse[];
}

const ResponsesSection = ({ responses }: ResponsesSectionProps) => {
  const getColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.85rem' }}>
        Responses
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {responses.map((resp) => (
          <Paper key={resp.status} variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                bgcolor: 'action.hover',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Chip
                label={resp.status}
                size="small"
                color={getColor(resp.status)}
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' }}
              />
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                {resp.description}
              </Typography>
            </Box>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                lineHeight: 1.5,
                bgcolor: (t) => (t.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'),
                color: 'text.primary',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(resp.example, null, 2)}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default ResponsesSection;
