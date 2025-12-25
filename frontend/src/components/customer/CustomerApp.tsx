import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Cart from './Cart';
import Profile from './Profile';
import WebStore from './WebStore';

interface CustomerAppProps {
  onLogout: () => void;
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export default function CustomerApp({ onLogout, toggleTheme, mode }: CustomerAppProps) {
  const [activeView, setActiveView] = useState<'store' | 'cart' | 'profile'>('store');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <StoreIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            ApyVyra Web Store
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              variant={activeView === 'store' ? 'outlined' : 'text'}
              startIcon={<StoreIcon />}
              onClick={() => setActiveView('store')}
            >
              Store
            </Button>
            <Button
              color="inherit"
              variant={activeView === 'cart' ? 'outlined' : 'text'}
              startIcon={<ShoppingCartIcon />}
              onClick={() => setActiveView('cart')}
            >
              Cart
            </Button>
            <Button
              color="inherit"
              variant={activeView === 'profile' ? 'outlined' : 'text'}
              startIcon={<PersonIcon />}
              onClick={() => setActiveView('profile')}
            >
              Profile
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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {activeView === 'store' && <WebStore />}

        {activeView === 'cart' && <Cart />}

        {activeView === 'profile' && <Profile />}
      </Container>
    </Box>
  );
}