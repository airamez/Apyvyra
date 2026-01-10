import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import { paymentService } from '../../../services/paymentService';
import { type Order } from '../../../services/orderService';
import { getErrorMessages } from '../../../utils/apiErrorHandler';
import { PaymentSuccess, OrderSummary } from './PaymentShared';
import { useFormatting } from '../../../hooks/useFormatting';
import { useTranslation } from '../../../hooks/useTranslation';

interface MockPaymentFormProps {
  order: Order;
  onBackToCheckout: () => void;
  onPaymentComplete: (orderId: number) => void;
}

export default function MockPaymentForm({ order, onBackToCheckout, onPaymentComplete }: MockPaymentFormProps) {
  const { t } = useTranslation('Payment');
  const { formatCurrency } = useFormatting();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  const handleMockPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const confirmation = await paymentService.confirmPayment(order.id);
      
      if (confirmation.success) {
        setPaymentSucceeded(true);
      } else {
        setError(confirmation.message || t('PAYMENT_CONFIRMATION_FAILED'));
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
    <Box sx={{ p: 2, maxWidth: 500, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToCheckout}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5">Payment</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Mock Mode:</strong> Payment simulation is enabled for testing. No real charges will be made.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockIcon color="primary" />
          <Typography variant="h6">Mock Payment</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Click the button below to simulate a successful payment.
        </Typography>
      </Paper>

      <OrderSummary order={order} />

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleMockPayment}
        disabled={loading}
        color="success"
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          `Complete Payment - ${formatCurrency(order.totalAmount)}`
        )}
      </Button>
    </Box>
  );
}
