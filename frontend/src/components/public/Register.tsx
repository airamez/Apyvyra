import { useState, useCallback, useEffect, useRef } from 'react';
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
  CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { userService } from '../../services/userService';
import { getErrorMessages } from '../../utils/apiErrorHandler';
import { useTranslation } from '../../hooks/useTranslation';
import { passwordValidationService, type PasswordRulesStatus } from '../../services/passwordValidationService';
import PasswordRequirements from '../common/PasswordRequirements';

interface RegisterProps {
  onNavigateToLogin?: () => void;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register({ onNavigateToLogin }: RegisterProps) {
  const { t } = useTranslation('Register');
  const { t: tCommon } = useTranslation('Common');
  
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    
    // Reset password validation state when password changes
    if (name === 'password') {
      setIsPasswordValid(false);
      setPasswordErrors([]);
    }
  };

  // Real-time password rules check with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!formData.password) {
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
        const status = await passwordValidationService.getRulesStatus(formData.password);
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
  }, [formData.password]);

  const validatePasswordOnBlur = useCallback(async () => {
    if (!formData.password) {
      setPasswordErrors([]);
      setIsPasswordValid(false);
      return;
    }

    setIsValidatingPassword(true);
    try {
      const result = await passwordValidationService.validatePassword(formData.password);
      setIsPasswordValid(result.isValid);
      setPasswordErrors(result.errors);
    } catch (err) {
      console.error('Password validation error:', err);
      setIsPasswordValid(false);
      setPasswordErrors([tCommon('ERROR')]);
    } finally {
      setIsValidatingPassword(false);
    }
  }, [formData.password, tCommon]);

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError(tCommon('ALL_FIELDS_REQUIRED'));
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(tCommon('INVALID_EMAIL'));
      return false;
    }

    if (!rulesStatus.isValid) {
      setError(passwordErrors && passwordErrors.length > 0 ? passwordErrors[0] : tCommon('PASSWORD_MIN_LENGTH'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(tCommon('PASSWORDS_NOT_MATCH'));
      return false;
    }

    return true;
  };

  const isFormValid = (): boolean => {
    return (
      formData.email.length > 0 &&
      formData.password.length > 0 &&
      formData.confirmPassword.length > 0 &&
      rulesStatus.isValid &&
      formData.password === formData.confirmPassword
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await userService.register(formData.email, formData.password);

      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Remove automatic redirect - user will click the link to navigate to login
    } catch (err) {
      const errorMessages = getErrorMessages(err);
      setError(errorMessages[0] || t('REGISTRATION_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonAddIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h4" component="h1">
                {success ? t('TITLE_SUCCESS') : t('TITLE')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success ? (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {t('REGISTRATION_SUCCESS')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {t('CONFIRMATION_SENT')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {t('CHECK_SPAM')}
                  </Typography>
                  <Link
                    component="button"
                    variant="body1"
                    onClick={onNavigateToLogin}
                    sx={{ cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    {t('AFTER_CONFIRMING_LOGIN')}
                  </Link>
                </Alert>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ flex: 2, minWidth: 300 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label={t('EMAIL_ADDRESS')}
                    name="email"
                    type="email"
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={validatePasswordOnBlur}
                    disabled={loading || success}
                    error={passwordErrors && passwordErrors.length > 0}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label={t('CONFIRM_PASSWORD')}
                    type="password"
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading || success}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading || success || !isFormValid() || isValidatingPassword}
                  >
                    {loading ? <CircularProgress size={24} /> : t('SIGN_UP_BUTTON')}
                  </Button>

                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('ALREADY_HAVE_ACCOUNT')}{' '}
                      <Link
                        component="button"
                        variant="body2"
                        type="button"
                        onClick={onNavigateToLogin}
                        sx={{ cursor: 'pointer' }}
                      >
                        {t('SIGN_IN')}
                      </Link>
                    </Typography>
                  </Box>
                </Box>
                <PasswordRequirements rulesStatus={rulesStatus} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
