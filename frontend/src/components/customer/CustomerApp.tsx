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
import UserProfile from '../common/UserProfile';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { useTranslation } from '../../hooks/useTranslation';

interface CustomerAppProps {
  onLogout: () => void;
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export default function CustomerApp({ onLogout, toggleTheme, mode }: CustomerAppProps) {
  const { t } = useTranslation('Navigation');
  const [activeView, setActiveView] = useState<'store' | 'cart' | 'checkout' | 'orders'>('store');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [userType, setUserType] = useState<'Admin' | 'Staff' | 'Customer'>('Customer');

  useEffect(() => {
    const role = authService.getUserRole();
    switch (role) {
      case 0:
        setUserType('Admin');
        break;
      case 1:
        setUserType('Staff');
        break;
      case 2:
        setUserType('Customer');
        break;
      default:
        setUserType('Customer');
    }
  }, []);

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
            ApyVyra Web Store - {userType}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              variant={activeView === 'store' ? 'outlined' : 'text'}
              startIcon={<StoreIcon />}
              onClick={() => setActiveView('store')}
              size="small"
            >
              {t('STORE')}
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
              {t('CART')}
            </Button>
            <Button
              color="inherit"
              variant={activeView === 'orders' ? 'outlined' : 'text'}
              startIcon={<ReceiptLongIcon />}
              onClick={() => setActiveView('orders')}
              size="small"
            >
              {t('MY_ORDERS')}
            </Button>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={t('SWITCH_THEME', { mode: mode === 'light' ? 'dark' : 'light' })}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <UserProfile />

          <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
            {t('LOGOUT')}
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