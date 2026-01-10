import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentService } from '../../../services/paymentService';
import { type Order } from '../../../services/orderService';
import { getErrorMessages } from '../../../utils/apiErrorHandler';
import { PaymentSuccess, OrderSummary } from './PaymentShared';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFormatting } from '../../../hooks/useFormatting';

interface StripePaymentFormProps {
  order: Order;
  onPaymentComplete: (orderId: number) => void;
}

export default function StripePaymentForm({ order, onPaymentComplete }: StripePaymentFormProps) {
  const { t } = useTranslation('Payment');
  const { formatCurrency } = useFormatting();
  
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || t('PAYMENT_FAILED'));
        setLoading(false);
        return;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const confirmation = await paymentService.confirmPayment(order.id);
        
        if (confirmation.success) {
          setPaymentSucceeded(true);
        } else {
          setError(confirmation.message || t('PAYMENT_CONFIRMATION_FAILED'));
        }
      }
    } catch (err) {
      const errorMessages = getErrorMessages(err);
      setError(errorMessages[0] || t('PAYMENT_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  if (paymentSucceeded) {
    return <PaymentSuccess order={order} onPaymentComplete={onPaymentComplete} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockIcon color="primary" />
          <Typography variant="h6">{t('SECURE_PAYMENT')}</Typography>
        </Box>
        
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </Paper>

      <OrderSummary order={order} />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={!stripe || !elements || loading}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          `${t('PAY_AMOUNT', { amount: formatCurrency(order.totalAmount) })}`
        )}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
        {t('PAYMENT_SECURITY_MESSAGE')}
      </Typography>
    </form>
  );
}
