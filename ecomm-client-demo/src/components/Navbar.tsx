import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';

interface NavbarProps {
  onCartClick: () => void;
  cartCount: number;
}

const Navbar = ({ onCartClick, cartCount }: NavbarProps) => {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid', borderColor: 'divider', zIndex: 1201 }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, md: 64 }, px: { xs: 2, md: 4 } }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'text.primary', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              TechStore
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Premium Electronics
            </Typography>
          </Box>
        </Box>

        {/* Center nav (desktop) */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
          {['New Arrivals', 'Best Sellers', 'Deals', 'Brands'].map((label) => (
            <Typography
              key={label}
              sx={{
                fontSize: '0.82rem',
                fontWeight: 500,
                color: 'text.secondary',
                cursor: 'pointer',
                transition: 'color 0.2s',
                '&:hover': { color: 'text.primary' },
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            avatar={<PersonIcon sx={{ fontSize: 16 }} />}
            label="Suryansh"
            size="small"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              bgcolor: '#F3F4F6',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 30,
            }}
          />
          <IconButton onClick={onCartClick} sx={{ color: 'text.primary' }}>
            <Badge
              badgeContent={cartCount}
              color="secondary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18 } }}
            >
              <ShoppingCartIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
