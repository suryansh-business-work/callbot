import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

const formatPrice = (p: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Badge */}
      {product.badge && (
        <Chip
          label={product.badge}
          size="small"
          color="secondary"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            height: 22,
            fontSize: '0.65rem',
            fontWeight: 700,
          }}
        />
      )}

      {/* Image */}
      <CardMedia
        component="img"
        image={product.image}
        alt={product.name}
        sx={{
          height: { xs: 180, sm: 200 },
          objectFit: 'cover',
          bgcolor: '#F3F4F6',
        }}
      />

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
        {/* Brand */}
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.06em', mb: 0.3 }}>
          {product.brand}
        </Typography>

        {/* Name */}
        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3, mb: 0.5, color: 'text.primary' }}>
          {product.name}
        </Typography>

        {/* Rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
          <Rating value={product.rating} precision={0.1} size="small" readOnly sx={{ fontSize: '0.85rem' }} />
          <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
            {product.rating} ({product.reviews.toLocaleString()})
          </Typography>
        </Box>

        {/* Description */}
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: 'text.secondary',
            lineHeight: 1.5,
            mb: 1,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.description}
        </Typography>

        {/* Highlights chips */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
          {product.highlights.slice(0, 3).map((h) => (
            <Chip
              key={h}
              label={h}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem', borderColor: 'divider' }}
            />
          ))}
        </Box>

        {/* Price + Add to cart */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary' }}>
              {formatPrice(product.price)}
            </Typography>
            {product.originalPrice && (
              <Typography
                component="span"
                sx={{ fontSize: '0.7rem', color: 'text.secondary', textDecoration: 'line-through', ml: 0.5 }}
              >
                {formatPrice(product.originalPrice)}
              </Typography>
            )}
          </Box>
          <Button
            variant={inCart ? 'outlined' : 'contained'}
            size="small"
            color={inCart ? 'secondary' : 'primary'}
            startIcon={inCart ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <AddShoppingCartIcon sx={{ fontSize: 16 }} />}
            onClick={() => addToCart(product)}
            sx={{
              fontSize: '0.72rem',
              px: 1.5,
              py: 0.6,
              minWidth: 0,
              bgcolor: inCart ? 'transparent' : '#111827',
              '&:hover': { bgcolor: inCart ? 'rgba(99,102,241,0.08)' : '#1F2937' },
            }}
          >
            {inCart ? 'Added' : 'Add'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
