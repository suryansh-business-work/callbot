import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCallCustomer: () => void;
}

const formatPrice = (p: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

const CartDrawer = ({ open, onClose, onCallCustomer }: CartDrawerProps) => {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Cart ({totalItems})</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
        </Box>

        {/* Call Button — top of cart */}
        {items.length > 0 && (
          <Box sx={{ px: 2, pt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PhoneInTalkIcon />}
              onClick={onCallCustomer}
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                fontWeight: 700,
                fontSize: '0.88rem',
                py: 1.3,
                borderRadius: 3,
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  boxShadow: '0 6px 20px rgba(99,102,241,0.5)',
                },
              }}
            >
              Call the Customer
            </Button>
          </Box>
        )}

        {/* Items */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingCartIcon sx={{ fontSize: 48, color: 'divider', mb: 1 }} />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem' }}>Your cart is empty</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', mt: 0.5 }}>
                Add products to see them here
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {items.map(({ product, quantity }) => (
                <Box
                  key={product.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    component="img"
                    src={product.image}
                    alt={product.name}
                    sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, mb: 0.3 }} noWrap>
                      {product.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mb: 0.5 }}>
                      {product.brand}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{formatPrice(product.price)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <IconButton size="small" onClick={() => removeFromCart(product.id)} sx={{ color: 'error.main' }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#fff', borderRadius: 1, border: '1px solid', borderColor: 'divider', px: 0.3 }}>
                      <IconButton size="small" onClick={() => updateQuantity(product.id, quantity - 1)} sx={{ p: 0.2 }}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                        {quantity}
                      </Typography>
                      <IconButton size="small" onClick={() => updateQuantity(product.id, quantity + 1)} sx={{ p: 0.2 }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Footer total */}
        {items.length > 0 && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Subtotal ({totalItems} items)</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>{formatPrice(totalPrice)}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>Free delivery on all orders</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
