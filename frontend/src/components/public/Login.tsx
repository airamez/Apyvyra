import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { authService } from '../../services/authService';
import { API_ENDPOINTS } from '../../config/api';

interface LoginProps {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login({ onNavigateToRegister, onLoginSuccess }: LoginProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use authService to handle login and JWT token storage
      await authService.login(formData.email, formData.password);
      
      setSuccess(true);
      setFormData({ email: '', password: '' });
      
      // Trigger parent component's login success handler immediately
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      
      // Check if this is a pending confirmation error
      if (errorMessage.includes('confirm your email')) {
        setError(errorMessage);
        setResendEmail(formData.email);
        setShowResendDialog(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    setResendMessage(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.APP_USER.RESEND_CONFIRMATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });
      
      const data = await response.text();
      
      if (response.ok) {
        setResendMessage(data);
      } else {
        setResendMessage('Failed to resend confirmation email. Please try again.');
      }
    } catch (err) {
      setResendMessage('An error occurred. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCloseResendDialog = () => {
    setShowResendDialog(false);
    setResendMessage(null);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <LoginIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography component="h1" variant="h4">
                Login
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Login successful! Welcome back.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                disabled={loading || success}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading || success}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || success}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToRegister?.();
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    Sign up here
                  </Link>
                </Typography>
              </Box>
            </form>

            {/* Resend Confirmation Dialog */}
            <Dialog open={showResendDialog} onClose={handleCloseResendDialog} maxWidth="sm" fullWidth>
              <DialogTitle>
                <Typography variant="h6" component="div">
                  📧 Email Confirmation Required
                </Typography>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Please confirm your email address before logging in.
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Check your inbox for the confirmation email. If you don't see it, you can request a new one below.
                </Typography>
                
                {resendMessage && (
                  <Alert severity={resendMessage.includes('sent') ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {resendMessage}
                  </Alert>
                )}
                
                {!resendMessage && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Resend confirmation email to:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      {resendEmail}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleCloseResendDialog} disabled={resendLoading}>
                  {resendMessage ? 'Close' : 'Cancel'}
                </Button>
                {!resendMessage && (
                  <Button 
                    onClick={handleResendConfirmation} 
                    variant="contained" 
                    disabled={resendLoading}
                    startIcon={resendLoading ? <CircularProgress size={20} /> : null}
                  >
                    {resendLoading ? 'Sending...' : 'Resend Email'}
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
