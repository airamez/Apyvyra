import { useState, useEffect } from 'react';
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
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { staffService, type StaffSetupInfo } from '../../services/staffService';
import { useTranslation } from '../../hooks/useTranslation';

export default function StaffSetup() {
  const { t } = useTranslation('StaffSetup');
  const { t: tCommon } = useTranslation('Common');
  
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupInfo, setSetupInfo] = useState<StaffSetupInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (token) {
      loadSetupInfo();
    }
  }, [token]);

  const loadSetupInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await staffService.getSetupInfo(token!);
      setSetupInfo(info);
      if (!info.isValid && info.errorMessage) {
        setError(info.errorMessage);
      }
    } catch (err: any) {
      setError(err.message || t('FAILED_LOAD_INFO'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!password || !confirmPassword) {
      setError(tCommon('ALL_FIELDS_REQUIRED'));
      return false;
    }

    if (password.length < 6) {
      setError(tCommon('PASSWORD_MIN_LENGTH'));
      return false;
    }

    if (password !== confirmPassword) {
      setError(tCommon('PASSWORDS_NOT_MATCH'));
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
      setSubmitting(true);
      setError(null);
      await staffService.completeSetup({ token: token!, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t('FAILED_COMPLETE_SETUP'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
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
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {success ? (
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
              ) : (
                <BadgeIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              )}
              <Typography variant="h4" component="h1">
                {success ? t('TITLE_SUCCESS') : t('TITLE')}
              </Typography>
            </Box>

            {error && !success && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success ? (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {t('SETUP_SUCCESS')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {t('LOGIN_ACCESS_MESSAGE')}
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
            ) : setupInfo?.isValid ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {t('WELCOME_MESSAGE', { fullName: setupInfo.fullName || '' })}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="dense"
                    fullWidth
                    label={t('EMAIL_ADDRESS')}
                    type="email"
                    value={setupInfo.email}
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
                    }}
                    disabled={submitting}
                    helperText={t('PASSWORD_HELPER')}
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
                    disabled={submitting}
                  >
                    {submitting ? <CircularProgress size={24} /> : t('COMPLETE_SETUP')}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  {error || t('INVALID_LINK')}
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('CONTACT_ADMIN')}
                </Typography>
                <Link
                  component="button"
                  variant="body1"
                  onClick={handleNavigateToLogin}
                  sx={{ cursor: 'pointer' }}
                >
                  {t('GO_TO_LOGIN')}
                </Link>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
