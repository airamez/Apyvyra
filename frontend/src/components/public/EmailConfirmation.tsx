import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmailIcon from '@mui/icons-material/Email';

export default function EmailConfirmation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed' | 'expired' | 'invalid'>('loading');
  const [message, setMessage] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Handle status-based routes - these are redirects from the backend
    if (token === 'success') {
      setStatus('success');
      setMessage('Your account has been successfully activated!');
      return;
    }
    if (token === 'already-confirmed') {
      setStatus('already_confirmed');
      setMessage('Your email was already confirmed!');
      return;
    }
    if (token === 'expired') {
      setStatus('expired');
      setMessage('Your confirmation link has expired. Please request a new confirmation email.');
      return;
    }
    if (token === 'invalid') {
      setStatus('invalid');
      setMessage('Invalid confirmation link. Please check your email or request a new confirmation.');
      return;
    }
    if (token === 'error') {
      setStatus('error');
      setMessage('An error occurred while confirming your email. Please try again later.');
      return;
    }

    // If it's a real token, we need to call the backend API to confirm it
    if (token && token.length > 10 && !isProcessing) {
      setIsProcessing(true);
      confirmEmail();
    } else {
      setStatus('invalid');
      setMessage('Invalid confirmation link.');
    }
  }, [token, isProcessing]);

  const confirmEmail = async () => {
    console.log('Starting confirmation for token:', token);
    try {
      const response = await fetch(`http://localhost:5000/api/app_user/confirm?token=${token}`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // If backend returns success, show success
      if (response.ok) {
        console.log('Setting success status');
        if (data.message && data.message.includes('already confirmed')) {
          setStatus('already_confirmed');
          setMessage(data.message);
        } else {
          setStatus('success');
          setMessage(data.message || 'Email confirmed successfully! Your account is now active.');
        }
      } else {
        // Handle standardized error responses with headers
        const errorMessage = data.message || 'Confirmation failed';
        
        console.log('Setting error status based on:', errorMessage);
        
        if (errorMessage.includes('expired')) {
          setStatus('expired');
          setMessage(errorMessage);
        } else if (errorMessage.includes('Invalid confirmation token')) {
          // This likely means the confirmation already worked but token was consumed
          setStatus('success');
          setMessage('Your email has been confirmed! Your account is now active. You can log in.');
        } else {
          setStatus('error');
          setMessage(errorMessage);
        }
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      setStatus('error');
      setMessage('An error occurred while confirming your email. Please try again later.');
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleRequestNewEmail = () => {
    navigate('/login');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Confirming your email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we activate your account.
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom color="success.main">
              Welcome to Apyvyra! 🎉
            </Typography>
            <Typography variant="h6" gutterBottom>
              Your account has been successfully activated!
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Thank you for confirming your email address. Your account is now active and ready to use. 
              You can now log in and start managing your inventory with Apyvyra's powerful tools.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGoToLogin}
              sx={{ px: 4, py: 1.5 }}
            >
              Go to Login
            </Button>
          </Box>
        );

      case 'already_confirmed':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'info.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <EmailIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom color="info.main">
              Already Confirmed
            </Typography>
            <Typography variant="h6" gutterBottom>
              Your email was already confirmed!
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGoToLogin}
              sx={{ px: 4, py: 1.5 }}
            >
              Go to Login
            </Button>
          </Box>
        );

      case 'expired':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom color="warning.main">
              Link Expired
            </Typography>
            <Typography variant="h6" gutterBottom>
              Your confirmation link has expired
            </Typography>
            <Alert severity="warning" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleRequestNewEmail}
              >
                Request New Email
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToLogin}
              >
                Go to Login
              </Button>
            </Box>
          </Box>
        );

      case 'invalid':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'error.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom color="error.main">
              Invalid Link
            </Typography>
            <Typography variant="h6" gutterBottom>
              We couldn't validate your confirmation link
            </Typography>
            <Alert severity="error" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/register')}
              >
                Create New Account
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToLogin}
              >
                Go to Login
              </Button>
            </Box>
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'error.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom color="error.main">
              Confirmation Failed
            </Typography>
            <Typography variant="h6" gutterBottom>
              We couldn't confirm your email
            </Typography>
            <Alert severity="error" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/register')}
              >
                Create New Account
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToLogin}
              >
                Go to Login
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {renderContent()}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
