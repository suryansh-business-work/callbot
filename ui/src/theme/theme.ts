import { createTheme, alpha, PaletteMode } from '@mui/material/styles';

/* ─── Design tokens ─────────────────────────────────────────────── */
const LIGHT = {
  primary: '#00BFA6',
  primaryLight: '#33CCBB',
  primaryDark: '#009688',
  accent: '#6366F1',
  bg: '#F8FAFB',
  paper: '#FFFFFF',
  surface: '#F1F4F8',
  border: '#E0E5EC',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  glow: 'rgba(0, 191, 166, 0.12)',
  cardHover: 'rgba(0, 191, 166, 0.04)',
};

const DARK = {
  primary: '#00E5CC',
  primaryLight: '#33EED9',
  primaryDark: '#00BFA6',
  accent: '#818CF8',
  bg: '#060A13',
  paper: '#0C1220',
  surface: '#131B2E',
  border: '#1C2640',
  textPrimary: '#EDF2F7',
  textSecondary: '#8896AB',
  glow: 'rgba(0, 229, 204, 0.08)',
  cardHover: 'rgba(0, 229, 204, 0.03)',
};

/* ─── Shared shadow factories ────────────────────────────────────── */
const glowShadow = (color: string, spread = 0.15) =>
  `0 0 20px ${alpha(color, spread)}, 0 0 4px ${alpha(color, 0.08)}`;

const subtleGlow = (color: string) =>
  `0 0 12px ${alpha(color, 0.06)}`;

export const createAppTheme = (mode: PaletteMode) => {
  const c = mode === 'light' ? LIGHT : DARK;

  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary, light: c.primaryLight, dark: c.primaryDark, contrastText: '#fff' },
      secondary: { main: c.accent, light: '#A5B4FC', dark: '#4338CA' },
      background: { default: c.bg, paper: c.paper },
      text: { primary: c.textPrimary, secondary: c.textSecondary },
      error: { main: '#F43F5E' },
      warning: { main: '#F59E0B' },
      success: { main: '#10B981' },
      info: { main: '#3B82F6' },
      divider: c.border,
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", "Segoe UI", sans-serif',
      h3: { fontWeight: 800, letterSpacing: '-0.03em' },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const },
      body2: { fontSize: '0.85rem' },
      button: { fontWeight: 600, letterSpacing: '0.03em' },
      caption: { fontSize: '0.72rem', letterSpacing: '0.02em' },
    },
    shape: { borderRadius: 4 },
    components: {
      /* ── Global baseline ─────────────────────────────────── */
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': { boxSizing: 'border-box' },
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: `${c.surface} transparent`,
            '&::-webkit-scrollbar': { width: 5 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: c.border,
              border: 'none',
              '&:hover': { backgroundColor: c.primary },
            },
          },
          '::selection': {
            background: alpha(c.primary, 0.25),
            color: c.textPrimary,
          },
        },
      },

      /* ── Buttons ─────────────────────────────────────────── */
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 4,
            padding: '8px 22px',
            fontSize: '0.85rem',
            position: 'relative' as const,
            transition: 'all 0.2s ease',
          },
          contained: {
            boxShadow: subtleGlow(c.primary),
            '&:hover': {
              boxShadow: glowShadow(c.primary, 0.25),
              transform: 'translateY(-1px)',
            },
          },
          outlined: {
            borderColor: c.border,
            '&:hover': {
              borderColor: c.primary,
              backgroundColor: alpha(c.primary, 0.06),
              boxShadow: subtleGlow(c.primary),
            },
          },
          text: {
            '&:hover': { backgroundColor: alpha(c.primary, 0.06) },
          },
        },
      },

      /* ── Cards ───────────────────────────────────────────── */
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 4,
            border: `1px solid ${c.border}`,
            backgroundImage: 'none',
            backgroundColor: c.paper,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              borderColor: alpha(c.primary, 0.3),
              boxShadow: `0 0 16px ${alpha(c.primary, 0.06)}`,
            },
          },
        },
      },

      /* ── Paper ───────────────────────────────────────────── */
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 4, backgroundImage: 'none' },
        },
      },

      /* ── Text fields ─────────────────────────────────────── */
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              backgroundColor: mode === 'light' ? '#fff' : alpha(c.surface, 0.6),
              transition: 'box-shadow 0.2s ease',
              '& fieldset': { borderColor: c.border, transition: 'border-color 0.2s ease' },
              '&:hover fieldset': { borderColor: alpha(c.primary, 0.5) },
              '&.Mui-focused fieldset': { borderColor: c.primary },
              '&.Mui-focused': { boxShadow: `0 0 0 2px ${alpha(c.primary, 0.12)}` },
            },
            '& .MuiInputLabel-root': { fontSize: '0.82rem' },
          },
        },
      },

      /* ── Chips ───────────────────────────────────────────── */
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            fontWeight: 500,
            fontSize: '0.72rem',
            letterSpacing: '0.02em',
          },
          outlined: { borderColor: c.border },
        },
      },

      /* ── AppBar ──────────────────────────────────────────── */
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: `1px solid ${c.border}`,
            boxShadow: `0 1px 12px ${alpha(c.primary, 0.04)}`,
          },
        },
      },

      /* ── Table ───────────────────────────────────────────── */
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: c.border,
            fontSize: '0.82rem',
            padding: '12px 16px',
          },
          head: {
            fontWeight: 700,
            fontSize: '0.68rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            color: c.textSecondary,
            backgroundColor: mode === 'light' ? c.surface : alpha(c.surface, 0.5),
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease',
            '&:hover': { backgroundColor: `${c.cardHover} !important` },
          },
        },
      },

      /* ── Dialog ──────────────────────────────────────────── */
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 4,
            border: `1px solid ${c.border}`,
            backgroundImage: 'none',
            boxShadow: glowShadow(c.primary, 0.1),
          },
        },
      },

      /* ── Menu ────────────────────────────────────────────── */
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 4,
            border: `1px solid ${c.border}`,
            backgroundImage: 'none',
            boxShadow: `0 8px 32px ${alpha('#000', 0.15)}`,
          },
        },
      },

      /* ── Tabs ────────────────────────────────────────────── */
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 40,
            padding: '6px 16px',
            transition: 'color 0.2s ease',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 2, borderRadius: 4 },
        },
      },

      /* ── Alert ───────────────────────────────────────────── */
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 4, border: '1px solid' },
        },
      },

      /* ── Avatar ──────────────────────────────────────────── */
      MuiAvatar: {
        styleOverrides: { root: { borderRadius: 4 } },
      },

      /* ── Skeleton ────────────────────────────────────────── */
      MuiSkeleton: {
        styleOverrides: { root: { borderRadius: 4 } },
      },

      /* ── Tooltip ─────────────────────────────────────────── */
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 4,
            fontSize: '0.72rem',
            fontWeight: 500,
            backgroundColor: mode === 'dark' ? c.surface : c.textPrimary,
            border: `1px solid ${c.border}`,
          },
        },
      },

      /* ── Table Pagination ────────────────────────────────── */
      MuiTablePagination: {
        styleOverrides: {
          root: { fontSize: '0.8rem' },
          selectLabel: { fontSize: '0.78rem' },
          displayedRows: { fontSize: '0.78rem' },
        },
      },

      /* ── Icon Button ─────────────────────────────────────── */
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(c.primary, 0.08),
            },
          },
        },
      },

      /* ── Divider ─────────────────────────────────────────── */
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: c.border },
        },
      },

      /* ── Breadcrumbs ─────────────────────────────────────── */
      MuiBreadcrumbs: {
        styleOverrides: {
          root: { fontSize: '0.78rem' },
        },
      },
    },
  });
};

export default createAppTheme('light');

