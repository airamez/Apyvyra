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
  CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { userService } from '../../services/userService';

interface RegisterProps {
  onNavigateToLogin?: () => void;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register({ onNavigateToLogin }: RegisterProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      await userService.register(formData.email, formData.password);

      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Remove automatic redirect - user will click the link to navigate to login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonAddIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h4" component="h1">
                {success ? 'Account Created!' : 'Create Account'}
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
                    Registration successful! Please check your email to confirm your account.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    We've sent a confirmation link to your email address. Click the link to activate your account.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    If you don't see the email, check your spam folder.
                  </Typography>
                  <Link
                    component="button"
                    variant="body1"
                    onClick={onNavigateToLogin}
                    sx={{ cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    After confirming, click here to log in
                  </Link>
                </Alert>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
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
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading || success}
                helperText="Minimum 6 characters"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
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
                disabled={loading || success}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    type="button"
                    onClick={onNavigateToLogin}
                    sx={{ cursor: 'pointer' }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
