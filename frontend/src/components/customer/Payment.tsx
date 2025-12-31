import { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/paymentService';
import { type Order } from '../../services/orderService';
import { getErrorMessages } from '../../utils/apiErrorHandler';
import { MockPaymentForm, StripePaymentForm } from './payment';
import { useTranslation } from '../../hooks/useTranslation';

interface PaymentProps {
  order: Order;
  onBackToCheckout: () => void;
  onPaymentComplete: (orderId: number) => void;
}

export default function Payment({ order, onBackToCheckout, onPaymentComplete }: PaymentProps) {
  const { t } = useTranslation('Payment');
  
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [mockStripe, setMockStripe] = useState(false);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = await paymentService.getConfig();
        setTestMode(config.testMode);
        setMockStripe(config.mockStripe);

        const paymentIntent = await paymentService.createPaymentIntent(order.id);
        setClientSecret(paymentIntent.clientSecret);

        // Only load Stripe.js when not in mock mode
        if (!config.mockStripe && config.publishableKey) {
          setStripePromise(loadStripe(config.publishableKey));
        }
      } catch (err) {
        const errorMessages = getErrorMessages(err);
        setError(errorMessages[0] || t('FAILED_INITIALIZE'));
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [order.id]);

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>{t('INITIALIZING_PAYMENT')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToCheckout}
          variant="outlined"
        >
          {t('BACK_TO_CHECKOUT')}
        </Button>
      </Box>
    );
  }

  // Mock mode - use simple form without Stripe.js
  if (mockStripe) {
    return (
      <MockPaymentForm 
        order={order} 
        onBackToCheckout={onBackToCheckout}
        onPaymentComplete={onPaymentComplete}
      />
    );
  }

  // Real Stripe mode - requires stripePromise and clientSecret
  if (!stripePromise || !clientSecret) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          {t('PAYMENT_NOT_CONFIGURED')}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 500, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToCheckout}
          variant="outlined"
          size="small"
        >
          {t('BACK')}
        </Button>
        <Typography variant="h5">{t('TITLE')}</Typography>
      </Box>

      {testMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>{t('TEST_MODE_MESSAGE')}</strong>
        </Alert>
      )}

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
          },
        }}
      >
        <StripePaymentForm 
          order={order} 
          onBackToCheckout={onBackToCheckout}
          onPaymentComplete={onPaymentComplete}
        />
      </Elements>
    </Box>
  );
}
