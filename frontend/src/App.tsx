import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PublicApp from './components/public/PublicApp';
import AdminApp from './components/admin/AdminApp';
import CustomerApp from './components/customer/CustomerApp';
import { authService } from './services/authService';
import { AppSettingsProvider } from './contexts/AppSettingsContext';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const renderApp = () => {
    if (!isAuthenticated) {
      return <PublicApp onLoginSuccess={handleLoginSuccess} toggleTheme={toggleTheme} mode={mode} />;
    }

    const role = authService.getUserRole();
    if (role === 0 || role === 1) { // Admin or Staff
      return <AdminApp onLogout={handleLogout} toggleTheme={toggleTheme} mode={mode} />;
    } else { // Customer
      return <CustomerApp onLogout={handleLogout} toggleTheme={toggleTheme} mode={mode} />;
    }
  };

  return (
    <AppSettingsProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {renderApp()}
      </ThemeProvider>
    </AppSettingsProvider>
  );
}

export default App
