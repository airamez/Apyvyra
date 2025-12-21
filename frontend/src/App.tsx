import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import CategoryManager from './components/CategoryManager';
import WelcomePage from './components/WelcomePage';
import { authService } from './services/authService';
import './App.css'

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'dashboard' | 'products' | 'categories' | 'customers'>('home');
  // Products menu state
  const [productsMenuAnchor, setProductsMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Check authentication on component mount
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [mode],
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const handleNavigateToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
    setActiveView('home');
  };

  const handleNavigateToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
    setActiveView('home');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setShowLogin(false);
    setShowRegister(false);
    setActiveView('home');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
    setActiveView('dashboard');
  };

  const handleNavigateToView = (view: 'home' | 'dashboard' | 'products' | 'categories' | 'customers') => {
    if (view === 'home') {
      setActiveView('home');
      setShowLogin(false);
      setShowRegister(false);
    } else if (isAuthenticated) {
      setActiveView(view);
      setShowLogin(false);
      setShowRegister(false);
    } else {
      // Redirect to login if not authenticated
      setShowLogin(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <DashboardIcon sx={{ mr: 2 }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleNavigateToView('home')}
            >
              Apyvyra ERP
            </Typography>
            
            {isAuthenticated && (
              <Box sx={{ ml: 4, display: 'flex', gap: 2 }}>
                <Button 
                  color="inherit" 
                  onClick={() => handleNavigateToView('dashboard')}
                >
                  Dashboard
                </Button>
                <Box>
                  <Button
                    color="inherit"
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
                    <MenuItem onClick={() => { setProductsMenuAnchor(null); handleNavigateToView('products'); }}>Products</MenuItem>
                    <MenuItem onClick={() => { setProductsMenuAnchor(null); handleNavigateToView('categories'); }}>Category</MenuItem>
                  </Menu>
                </Box>
                <Button 
                  color="inherit" 
                  onClick={() => handleNavigateToView('customers')}
                >
                  Customers
                </Button>
              </Box>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            
            {!isAuthenticated ? (
              <>
                {!showRegister && !showLogin && (
                  <Button color="inherit" onClick={() => setShowRegister(true)} sx={{ mr: 1 }}>
                    Sign Up
                  </Button>
                )}
                {!showLogin && !showRegister && (
                  <Button color="inherit" onClick={() => setShowLogin(true)}>Login</Button>
                )}
              </>
            ) : (
              <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>
        
        {showRegister ? (
          <Register onNavigateToLogin={handleNavigateToLogin} />
        ) : showLogin ? (
          <Login onNavigateToRegister={handleNavigateToRegister} onLoginSuccess={handleLoginSuccess} />
        ) : activeView === 'dashboard' && isAuthenticated ? (
          <Dashboard />
        ) : activeView === 'products' && isAuthenticated ? (
          <Products />
        ) : activeView === 'categories' && isAuthenticated ? (
          <CategoryManager />
        ) : activeView === 'customers' && isAuthenticated ? (
          <Customers />
        ) : activeView === 'home' ? (
          <WelcomePage isAuthenticated={isAuthenticated} />
        ) : (
          <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Apyvyra ERP
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {isAuthenticated 
              ? 'Use the menu above to navigate to different sections of the application.'
              : 'Please log in to access the ERP system.'}
          </Typography>
        </Container>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App
