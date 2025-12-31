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
import { useTranslation } from '../../hooks/useTranslation';

interface LoginProps {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login({ onNavigateToRegister, onLoginSuccess }: LoginProps) {
  const { t } = useTranslation('Login');
  const { t: tCommon } = useTranslation('Common');
  
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
      setError(tCommon('ALL_FIELDS_REQUIRED'));
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(tCommon('INVALID_EMAIL'));
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
      let errorMessage = t('LOGIN_ERROR');
      
      // Handle ApiError structure
      if (err && typeof err === 'object' && 'errors' in err) {
        const apiError = err as { errors: string[] };
        errorMessage = apiError.errors[0] || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Check if this is a pending confirmation error
      if (errorMessage.includes('confirm your email') || errorMessage.includes('Email confirmation required')) {
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
        setResendMessage(t('FAILED_RESEND'));
      }
    } catch (err) {
      setResendMessage(t('RESEND_ERROR'));
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
                {t('TITLE')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('LOGIN_SUCCESS')}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label={t('EMAIL_ADDRESS')}
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
                label={t('PASSWORD')}
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
                {loading ? t('LOGGING_IN') : t('LOGIN_BUTTON')}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('DONT_HAVE_ACCOUNT')}{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToRegister?.();
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    {t('SIGN_UP_HERE')}
                  </Link>
                </Typography>
              </Box>
            </form>

            {/* Resend Confirmation Dialog */}
            <Dialog open={showResendDialog} onClose={handleCloseResendDialog} maxWidth="sm" fullWidth>
              <DialogTitle>
                <Typography variant="h6" component="div">
                  📧 {t('EMAIL_CONFIRMATION_REQUIRED')}
                </Typography>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {t('CHECK_INBOX_MESSAGE')}
                </Typography>
                
                {resendMessage && (
                  <Alert severity={resendMessage.includes('sent') ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {resendMessage}
                  </Alert>
                )}
                
                {!resendMessage && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {t('RESEND_CONFIRMATION_TO')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      {resendEmail}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleCloseResendDialog} disabled={resendLoading}>
                  {resendMessage ? tCommon('CLOSE') : tCommon('CANCEL')}
                </Button>
                {!resendMessage && (
                  <Button 
                    onClick={handleResendConfirmation} 
                    variant="contained" 
                    disabled={resendLoading}
                    startIcon={resendLoading ? <CircularProgress size={20} /> : null}
                  >
                    {resendLoading ? t('SENDING') : t('RESEND_EMAIL')}
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
