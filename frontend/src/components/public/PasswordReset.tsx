import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from '../../hooks/useTranslation';
import { passwordValidationService, type PasswordRulesStatus } from '../../services/passwordValidationService';
import PasswordRequirements from '../common/PasswordRequirements';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

interface ResetInfo {
  email: string;
  isValid: boolean;
  errorMessage?: string;
}

export default function PasswordReset() {
  const { t } = useTranslation('PasswordReset');
  const { t: tCommon } = useTranslation('Common');
  const { logout } = useAuth();
  
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetInfo, setResetInfo] = useState<ResetInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [rulesStatus, setRulesStatus] = useState<PasswordRulesStatus>({
    isValid: false,
    hasMinLength: false,
    hasMaxLength: true,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    hasSpecialChar: false,
    hasNoSpaces: true,
    hasNoSequential: true
  });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debug logging for error state
  useEffect(() => {
    console.log('Error state changed:', { error, resetInfo });
  }, [error, resetInfo]);

  useEffect(() => {
    if (token) {
      validateResetToken();
    } else {
      setError('No reset token provided');
      setLoading(false);
    }
  }, [token]);

  // Real-time password rules check with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!password) {
      setRulesStatus({
        isValid: false,
        hasMinLength: false,
        hasMaxLength: true,
        hasUppercase: false,
        hasLowercase: false,
        hasDigit: false,
        hasSpecialChar: false,
        hasNoSpaces: true,
        hasNoSequential: true
      });
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const status = await passwordValidationService.getRulesStatus(password);
        setRulesStatus(status);
      } catch (err) {
        console.error('Error checking password rules:', err);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [password]);

  const validateResetToken = async () => {
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`[${callId}] validateResetToken called`);
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate the token with the backend and get the email
      const response = await fetch(`${API_ENDPOINTS.APP_USER.VALIDATE_RESET_TOKEN}?token=${encodeURIComponent(token!)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log(`[${callId}] Response status:`, response.status);
      console.log(`[${callId}] Response data:`, data);
      
      if (data.success && data.data.isValid) {
        // Success case
        console.log(`[${callId}] Token validation successful for:`, data.data.email);
        setResetInfo({
          email: data.data.email,
          isValid: true
        });
      } else {
        // Error case - success is false
        const errorMessage = data.message || data.errors?.[0] || t('INVALID_TOKEN');
        console.log(`[${callId}] Setting error message (success false):`, errorMessage);
        setError(errorMessage);
        setResetInfo({
          email: '',
          isValid: false,
          errorMessage: errorMessage
        });
      }
    } catch (err: any) {
      console.error(`[${callId}] Token validation failed:`, err);
      setError(err.message || t('INVALID_TOKEN'));
      setResetInfo({
        email: '',
        isValid: false,
        errorMessage: err.message || t('INVALID_TOKEN')
      });
    } finally {
      console.log(`[${callId}] validateResetToken finished`);
      setLoading(false);
    }
  };

  const validatePasswordOnBlur = useCallback(async () => {
    if (!password) {
      setPasswordErrors([]);
      setIsPasswordValid(false);
      return;
    }

    setIsValidatingPassword(true);
    try {
      const result = await passwordValidationService.validatePassword(password);
      setIsPasswordValid(result.isValid);
      setPasswordErrors(result.errors);
    } catch (err) {
      console.error('Password validation error:', err);
      setIsPasswordValid(false);
      setPasswordErrors([tCommon('ERROR')]);
    } finally {
      setIsValidatingPassword(false);
    }
  }, [password, tCommon]);

  const validateForm = (): boolean => {
    if (!password || !confirmPassword) {
      setError(tCommon('ALL_FIELDS_REQUIRED'));
      return false;
    }

    if (!rulesStatus.isValid) {
      setError(passwordErrors && passwordErrors.length > 0 ? passwordErrors[0] : tCommon('PASSWORD_MIN_LENGTH'));
      return false;
    }

    if (password !== confirmPassword) {
      setError(tCommon('PASSWORDS_NOT_MATCH'));
      return false;
    }

    return true;
  };

  const isFormValid = (): boolean => {
    return (
      password.length > 0 &&
      confirmPassword.length > 0 &&
      rulesStatus.isValid &&
      password === confirmPassword
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.APP_USER.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token!, 
          password 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Logout the user after successful password reset
        logout();
        setSuccess(true);
      } else {
        setError(data.error || data.message || t('FAILED_RESET'));
      }
    } catch (err: any) {
      setError(err.message || t('FAILED_RESET'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToForgot = () => {
    navigate('/forgot-password');
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {success ? (
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
              ) : (
                <LockResetIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              )}
              <Typography variant="h4" component="h1">
                {success ? t('TITLE_SUCCESS') : t('TITLE')}
              </Typography>
            </Box>

            {success ? (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {t('RESET_SUCCESS')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t('LOGGED_OUT')}
                  </Typography>
                  <Typography variant="body2">
                    {t('LOGIN_MESSAGE')}
                  </Typography>
                </Alert>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNavigateToLogin}
                  sx={{ mt: 2 }}
                >
                  {t('GO_TO_LOGIN')}
                </Button>
              </Box>
            ) : resetInfo?.isValid ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your new password below.
                </Typography>

                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box component="form" onSubmit={handleSubmit} noValidate sx={{ flex: 2, minWidth: 300 }}>
                    <TextField
                      margin="dense"
                      fullWidth
                      label={t('EMAIL_ADDRESS')}
                      type="email"
                      value={resetInfo?.email || ''}
                      disabled
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      margin="dense"
                      required
                      fullWidth
                      name="password"
                      label={t('PASSWORD')}
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                        setIsPasswordValid(false);
                        setPasswordErrors([]);
                      }}
                      onBlur={validatePasswordOnBlur}
                      disabled={submitting}
                      error={passwordErrors && passwordErrors.length > 0}
                    />
                    <TextField
                      margin="dense"
                      required
                      fullWidth
                      name="confirmPassword"
                      label={t('CONFIRM_PASSWORD')}
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={submitting}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      disabled={submitting || !isFormValid() || isValidatingPassword}
                    >
                      {submitting ? <CircularProgress size={24} /> : t('RESET_BUTTON')}
                    </Button>
                  </Box>
                  <PasswordRequirements rulesStatus={rulesStatus} />
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  {error || t('INVALID_TOKEN')}
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('REQUEST_NEW')}
                </Typography>
                <Link
                  component="button"
                  variant="body1"
                  onClick={handleNavigateToForgot}
                  sx={{ cursor: 'pointer' }}
                >
                  {t('REQUEST_NEW')}
                </Link>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
