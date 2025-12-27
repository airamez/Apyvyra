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

export default function StaffSetup() {
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
      setError(err.message || 'Failed to load setup information');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
      setError(err.message || 'Failed to complete setup');
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
                {success ? 'Welcome to Apyvyra!' : 'Complete Your Account Setup'}
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
                    Your account has been set up successfully!
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    You can now log in with your email and password to access the Apyvyra admin panel.
                  </Typography>
                </Alert>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNavigateToLogin}
                  sx={{ mt: 2 }}
                >
                  Go to Login
                </Button>
              </Box>
            ) : setupInfo?.isValid ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Welcome, <strong>{setupInfo.fullName}</strong>! Please set your password to complete your account setup.
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={setupInfo.email}
                    disabled
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    disabled={submitting}
                    helperText="Minimum 6 characters"
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
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
                    {submitting ? <CircularProgress size={24} /> : 'Complete Setup'}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  {error || 'This invitation link is invalid or has expired.'}
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Please contact your administrator for a new invitation.
                </Typography>
                <Link
                  component="button"
                  variant="body1"
                  onClick={handleNavigateToLogin}
                  sx={{ cursor: 'pointer' }}
                >
                  Go to Login
                </Link>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
