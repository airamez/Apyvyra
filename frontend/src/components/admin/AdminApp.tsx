import { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';

import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Dashboard from './Dashboard';
import Products from './products/Products';
import Categories from './products/Categories';
import Customers from './Customers';
import Staff from './Staff';
import { authService } from '../../services/authService';

interface AdminAppProps {
  onLogout: () => void;
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export default function AdminApp({ onLogout, toggleTheme, mode }: AdminAppProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'categories' | 'customers' | 'staff'>('dashboard');
  const [productsMenuAnchor, setProductsMenuAnchor] = useState<null | HTMLElement>(null);

  const handleNavigateToView = (view: 'dashboard' | 'products' | 'categories' | 'customers' | 'staff') => {
    setActiveView(view);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'categories':
        return <Categories />;
      case 'customers':
        return <Customers />;
      case 'staff':
        return <Staff />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Apyvyra ERP - Admin
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              variant={activeView === 'dashboard' ? 'outlined' : 'text'}
              onClick={() => handleNavigateToView('dashboard')}
            >
              Dashboard
            </Button>
            <Box>
              <Button
                color="inherit"
                variant={activeView === 'products' || activeView === 'categories' ? 'outlined' : 'text'}
                id="products-menu-button"
                aria-controls="products-menu"
                aria-haspopup="true"
                onClick={e => setProductsMenuAnchor(e.currentTarget)}
              >
                Products
              </Button>
              <Menu
                id="products-menu"
                anchorEl={productsMenuAnchor}
                open={Boolean(productsMenuAnchor)}
                onClose={() => setProductsMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setProductsMenuAnchor(null);
                    handleNavigateToView('products');
                  }}
                  selected={activeView === 'products'}
                >
                  Products
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setProductsMenuAnchor(null);
                    handleNavigateToView('categories');
                  }}
                  selected={activeView === 'categories'}
                >
                  Categories
                </MenuItem>
              </Menu>
            </Box>
            <Button
              color="inherit"
              variant={activeView === 'customers' ? 'outlined' : 'text'}
              onClick={() => handleNavigateToView('customers')}
            >
              Customers
            </Button>
            {authService.isAdmin() && (
              <Button
                color="inherit"
                variant={activeView === 'staff' ? 'outlined' : 'text'}
                onClick={() => handleNavigateToView('staff')}
              >
                Staff
              </Button>
            )}
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

      {renderContent()}
    </Box>
  );
}