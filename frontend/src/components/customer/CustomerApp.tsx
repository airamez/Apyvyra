import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Store from './Store';
import ShoppingCart from './ShoppingCart';
import Checkout from './Checkout';
import MyOrders from './MyOrders';
import { cartService } from '../../services/cartService';

interface CustomerAppProps {
  onLogout: () => void;
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export default function CustomerApp({ onLogout, toggleTheme, mode }: CustomerAppProps) {
  const [activeView, setActiveView] = useState<'store' | 'cart' | 'checkout' | 'orders'>('store');
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    updateCartCount();
  }, [activeView]);

  const updateCartCount = () => {
    setCartItemCount(cartService.getItemCount());
  };

  const handleViewCart = () => {
    setActiveView('cart');
    updateCartCount();
  };

  const handleCheckout = () => {
    setActiveView('checkout');
  };

  const handleOrderComplete = () => {
    setActiveView('orders');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <StoreIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            ApyVyra Web Store
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              variant={activeView === 'store' ? 'outlined' : 'text'}
              startIcon={<StoreIcon />}
              onClick={() => setActiveView('store')}
              size="small"
            >
              Store
            </Button>
            <Button
              color="inherit"
              variant={activeView === 'cart' || activeView === 'checkout' ? 'outlined' : 'text'}
              startIcon={
                <Badge badgeContent={cartItemCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              }
              onClick={handleViewCart}
              size="small"
            >
              Cart
            </Button>
            <Button
              color="inherit"
              variant={activeView === 'orders' ? 'outlined' : 'text'}
              startIcon={<ReceiptLongIcon />}
              onClick={() => setActiveView('orders')}
              size="small"
            >
              Orders
            </Button>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {activeView === 'store' && (
          <Store onViewCart={handleViewCart} />
        )}

        {activeView === 'cart' && (
          <ShoppingCart
            onBackToStore={() => setActiveView('store')}
            onCheckout={handleCheckout}
          />
        )}

        {activeView === 'checkout' && (
          <Checkout
            onBackToCart={handleViewCart}
            onOrderComplete={handleOrderComplete}
          />
        )}

        {activeView === 'orders' && <MyOrders />}
      </Container>
    </Box>
  );
}