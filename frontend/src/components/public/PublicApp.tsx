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
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import WelcomePage from './WelcomePage';
import EmailConfirmation from './EmailConfirmation';
import StaffSetup from './StaffSetup';

interface PublicAppProps {
  onLoginSuccess: () => void;
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

function PublicAppContent({ onLoginSuccess, toggleTheme, mode }: PublicAppProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  const handleLoginSuccessInternal = () => {
    onLoginSuccess();
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/confirm') || location.pathname.startsWith('/staff-setup');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Apyvyra ERP
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {!isAuthPage && (
            <>
              <Button color="inherit" onClick={handleNavigateToRegister} sx={{ mr: 1 }}>
                Sign Up
              </Button>
              <Button color="inherit" onClick={handleNavigateToLogin}>Login</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<WelcomePage isAuthenticated={false} />} />
        <Route path="/register" element={<Register onNavigateToLogin={handleNavigateToLogin} />} />
        <Route path="/login" element={<Login onNavigateToRegister={handleNavigateToRegister} onLoginSuccess={handleLoginSuccessInternal} />} />
        <Route path="/confirm/:token" element={<EmailConfirmation />} />
        <Route path="/staff-setup/:token" element={<StaffSetup />} />
      </Routes>
    </Box>
  );
}

export default function PublicApp({ onLoginSuccess, toggleTheme, mode }: PublicAppProps) {
  return (
    <Router>
      <PublicAppContent 
        onLoginSuccess={onLoginSuccess} 
        toggleTheme={toggleTheme} 
        mode={mode} 
      />
    </Router>
  );
}