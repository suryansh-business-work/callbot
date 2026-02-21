import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import CallDialog from './components/CallDialog';
import { useCart } from './context/CartContext';

const App = () => {
  const { totalItems, items } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  const handleCallCustomer = useCallback(() => {
    setCartOpen(false);
    setCallOpen(true);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Toaster position="top-right" />
      <Navbar onCartClick={() => setCartOpen(true)} cartCount={totalItems} />
      <HeroBanner />
      <ProductGrid />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCallCustomer={handleCallCustomer} />
      <CallDialog open={callOpen} onClose={() => setCallOpen(false)} cartItems={items} />
    </Box>
  );
};

export default App;
