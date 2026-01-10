import { useState, useEffect } from 'react';
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
import OrderManagement from './orders/OrderManagement';
import EmailClient from './EmailClient';
import UserProfile from '../common/UserProfile';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

interface AdminAppProps {
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export default function AdminApp({ toggleTheme, mode }: AdminAppProps) {
  const { logout } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'categories' | 'customers' | 'staff' | 'orders' | 'email'>('dashboard');
  const [productsMenuAnchor, setProductsMenuAnchor] = useState<null | HTMLElement>(null);
  const [userType, setUserType] = useState<'Admin' | 'Staff' | 'Customer'>('Admin');

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
        setUserType('Admin');
    }
  }, []);

  const handleNavigateToView = (view: 'dashboard' | 'products' | 'categories' | 'customers' | 'staff' | 'orders' | 'email') => {
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
      case 'orders':
        return <OrderManagement />;
      case 'email':
        return <EmailClient />;
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
            Apyvyra ERP - {userType}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              variant={activeView === 'dashboard' ? 'outlined' : 'text'}
              onClick={() => handleNavigateToView('dashboard')}
            >
              Dashboard
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
            <Button
              color="inherit"
              variant={activeView === 'orders' ? 'outlined' : 'text'}
              onClick={() => handleNavigateToView('orders')}
            >
              Orders
            </Button>
            <Button
              color="inherit"
              variant={activeView === 'email' ? 'outlined' : 'text'}
              onClick={() => handleNavigateToView('email')}
            >
              Email
            </Button>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <UserProfile />

          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {renderContent()}
    </Box>
  );
}