import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import App from './App';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <App />
      </CartProvider>
    </ThemeProvider>
  </StrictMode>,
);
