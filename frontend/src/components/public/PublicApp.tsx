import { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Register from './Register';
import Login from './Login';
import WelcomePage from './WelcomePage';

interface PublicAppProps {
  onLoginSuccess: () => void;
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export default function PublicApp({ onLoginSuccess, toggleTheme, mode }: PublicAppProps) {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleNavigateToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleNavigateToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleLoginSuccessInternal = () => {
    onLoginSuccess();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ cursor: 'pointer' }}>
            Apyvyra ERP
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {!showRegister && !showLogin && (
            <Button color="inherit" onClick={() => setShowRegister(true)} sx={{ mr: 1 }}>
              Sign Up
            </Button>
          )}
          {!showLogin && !showRegister && (
            <Button color="inherit" onClick={() => setShowLogin(true)}>Login</Button>
          )}
        </Toolbar>
      </AppBar>

      {showRegister ? (
        <Register onNavigateToLogin={handleNavigateToLogin} />
      ) : showLogin ? (
        <Login onNavigateToRegister={handleNavigateToRegister} onLoginSuccess={handleLoginSuccessInternal} />
      ) : (
        <WelcomePage isAuthenticated={false} />
      )}
    </Box>
  );
}