import { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PublicApp from './components/public/PublicApp';
import CustomerApp from './components/customer/CustomerApp';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, checkAuth } = useAuth();
  const [mode, setMode] = useState<'light' | 'dark'>('light');

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

  const handleLoginSuccess = () => {
    // The Login component already stores the token via authService.login()
    // We just need to trigger a re-check of auth status
    checkAuth();
  };

  const renderApp = () => {
    if (!isAuthenticated) {
      return <PublicApp onLoginSuccess={handleLoginSuccess} toggleTheme={toggleTheme} mode={mode} />;
    }

    // For now, we'll just show CustomerApp since we don't have role info in AuthContext yet
    return <CustomerApp onLogout={() => {}} toggleTheme={toggleTheme} mode={mode} />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderApp()}
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <AppContent />
      </AppSettingsProvider>
    </AuthProvider>
  );
}

export default App
