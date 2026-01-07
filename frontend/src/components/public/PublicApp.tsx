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
import ForgotPassword from './ForgotPassword';
import PasswordReset from './PasswordReset';
import { useTranslation } from '../../hooks/useTranslation';

interface PublicAppProps {
  onLoginSuccess: () => void;
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

function PublicAppContent({ onLoginSuccess, toggleTheme, mode }: PublicAppProps) {
  const { t } = useTranslation('Navigation');
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  const handleNavigateToForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleLoginSuccessInternal = () => {
    onLoginSuccess();
    navigate('/'); // Redirect to home/store page after login
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/confirm') || location.pathname.startsWith('/staff-setup') || location.pathname === '/forgot-password' || location.pathname.startsWith('/reset-password');

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
            {t('TITLE')}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={t('SWITCH_THEME', { mode: mode === 'light' ? 'dark' : 'light' })}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {!isAuthPage && (
            <>
              <Button color="inherit" onClick={handleNavigateToRegister} sx={{ mr: 1 }}>
                {t('SIGN_UP')}
              </Button>
              <Button color="inherit" onClick={handleNavigateToLogin}>{t('LOGIN')}</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<Register onNavigateToLogin={handleNavigateToLogin} />} />
        <Route path="/login" element={<Login onNavigateToRegister={handleNavigateToRegister} onLoginSuccess={handleLoginSuccessInternal} onNavigateToForgotPassword={handleNavigateToForgotPassword} />} />
        <Route path="/confirm/:token" element={<EmailConfirmation />} />
        <Route path="/staff-setup/:token" element={<StaffSetup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<PasswordReset />} />
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