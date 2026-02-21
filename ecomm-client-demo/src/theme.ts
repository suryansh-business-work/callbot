import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#111827', light: '#374151', dark: '#030712' },
    secondary: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    success: { main: '#059669' },
    background: { default: '#F9FAFB', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.85rem' },
    body2: { color: '#6B7280' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem' },
      },
    },
  },
});

export default theme;
