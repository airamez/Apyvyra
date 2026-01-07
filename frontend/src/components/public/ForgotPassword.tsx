import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useTranslation } from '../../hooks/useTranslation';
import { API_ENDPOINTS } from '../../config/api';

export default function ForgotPassword() {
  const { t } = useTranslation('ForgotPassword');
  const { t: tCommon } = useTranslation('Common');
  
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (): boolean => {
    if (!email) {
      setError(tCommon('ALL_FIELDS_REQUIRED'));
      return false;
    }

    if (!validateEmail(email)) {
      setError(t('INVALID_EMAIL'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.APP_USER.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || data.message || t('SEND_ERROR'));
      }
    } catch (err: any) {
      setError(err.message || t('SEND_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <LockResetIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography component="h1" variant="h4">
                {t('TITLE')}
              </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success ? (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {t('SUCCESS_MESSAGE')}
                  </Typography>
                  <Typography variant="body2">
                    {t('CHECK_EMAIL')}
                  </Typography>
                </Alert>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleBackToLogin}
                  sx={{ mt: 2 }}
                >
                  {t('BACK_TO_LOGIN')}
                </Button>
              </Box>
            ) : (
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
                  value={email}
                  onChange={handleChange}
                  disabled={loading}
                  error={!!error}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LockResetIcon />}
                >
                  {loading ? t('SENDING') : t('SEND_RESET_LINK')}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleBackToLogin}
                    sx={{ cursor: 'pointer' }}
                  >
                    {t('BACK_TO_LOGIN')}
                  </Link>
                </Box>
              </form>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
