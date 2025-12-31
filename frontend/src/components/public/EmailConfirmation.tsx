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
import { useTranslation } from '../../hooks/useTranslation';

export default function EmailConfirmation() {
  const { t } = useTranslation('EmailConfirmation');
  
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed' | 'expired' | 'invalid'>('loading');
  const [message, setMessage] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Handle status-based routes - these are redirects from the backend
    if (token === 'success') {
      setStatus('success');
      setMessage(t('ACCOUNT_ACTIVATED'));
      return;
    }
    if (token === 'already-confirmed') {
      setStatus('already_confirmed');
      setMessage(t('EMAIL_ALREADY_CONFIRMED'));
      return;
    }
    if (token === 'expired') {
      setStatus('expired');
      setMessage(t('LINK_EXPIRED_DESCRIPTION'));
      return;
    }
    if (token === 'invalid') {
      setStatus('invalid');
      setMessage(t('INVALID_LINK_DESCRIPTION'));
      return;
    }
    if (token === 'error') {
      setStatus('error');
      setMessage(t('CONFIRMATION_ERROR'));
      return;
    }

    // If it's a real token, we need to call the backend API to confirm it
    if (token && token.length > 10 && !isProcessing) {
      setIsProcessing(true);
      confirmEmail();
    } else {
      setStatus('invalid');
      setMessage(t('INVALID_LINK_DESCRIPTION'));
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
          setMessage(data.message || t('EMAIL_CONFIRMED_SUCCESS'));
        }
      } else {
        // Handle standardized error responses with headers
        const errorMessage = data.message || t('CONFIRMATION_FAILED_MESSAGE');
        
        console.log('Setting error status based on:', errorMessage);
        
        if (errorMessage.includes('expired')) {
          setStatus('expired');
          setMessage(errorMessage);
        } else if (errorMessage.includes('Invalid confirmation token')) {
          // This likely means the confirmation already worked but token was consumed
          setStatus('success');
          setMessage(t('EMAIL_CONFIRMED_SUCCESS'));
        } else {
          setStatus('error');
          setMessage(errorMessage);
        }
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      setStatus('error');
      setMessage(t('CONFIRMATION_ERROR'));
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
              {t('CONFIRMING_EMAIL')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('PLEASE_WAIT')}
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
              {t('WELCOME_TITLE')}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {t('ACCOUNT_ACTIVATED')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {t('THANK_YOU_MESSAGE')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGoToLogin}
              sx={{ px: 4, py: 1.5 }}
            >
              {t('GO_TO_LOGIN')}
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
              {t('ALREADY_CONFIRMED_TITLE')}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {t('EMAIL_ALREADY_CONFIRMED')}
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
              {t('GO_TO_LOGIN')}
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
              {t('LINK_EXPIRED_TITLE')}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {t('LINK_EXPIRED_MESSAGE')}
            </Typography>
            <Alert severity="warning" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleRequestNewEmail}
              >
                {t('REQUEST_NEW_EMAIL')}
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToLogin}
              >
                {t('GO_TO_LOGIN')}
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
              {t('INVALID_LINK_TITLE')}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {t('INVALID_LINK_MESSAGE')}
            </Typography>
            <Alert severity="error" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/register')}
              >
                {t('CREATE_NEW_ACCOUNT')}
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToLogin}
              >
                {t('GO_TO_LOGIN')}
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
              {t('CONFIRMATION_FAILED_TITLE')}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {t('CONFIRMATION_FAILED_MESSAGE')}
            </Typography>
            <Alert severity="error" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/register')}
              >
                {t('CREATE_NEW_ACCOUNT')}
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToLogin}
              >
                {t('GO_TO_LOGIN')}
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
