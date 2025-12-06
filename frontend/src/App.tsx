import { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import './App.css'

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <DashboardIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Apyvyra ERP
            </Typography>
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <Button color="inherit">Login</Button>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Apyvyra ERP
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Material-UI successfully integrated. Ready to build your enterprise application.
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <Card>
                <CardContent>
                  <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h5" component="div" gutterBottom>
                    Users
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage user accounts and permissions
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    View Users
                  </Button>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <Card>
                <CardContent>
                  <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h5" component="div" gutterBottom>
                    Inventory
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track and manage inventory items
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    View Inventory
                  </Button>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <Card>
                <CardContent>
                  <DashboardIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h5" component="div" gutterBottom>
                    Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View analytics and reports
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    View Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
