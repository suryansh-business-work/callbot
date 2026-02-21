import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import ProductCard from './ProductCard';
import products from '../data/products';

const ProductGrid = () => {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' }, fontWeight: 800 }}>
            Featured Products
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.3 }}>
            {products.length} premium electronics handpicked for you
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProductGrid;
