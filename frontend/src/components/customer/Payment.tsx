import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentService } from '../../services/paymentService';
import { type Order } from '../../services/orderService';

interface PaymentProps {
  order: Order;
  onBackToCheckout: () => void;
  onPaymentComplete: (orderId: number) => void;
}

interface PaymentFormProps {
  order: Order;
  onPaymentComplete: (orderId: number) => void;
}

function PaymentForm({ order, onPaymentComplete }: PaymentFormProps) {
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
        setError(submitError.message || 'Payment failed');
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
        // Confirm payment on backend
        const confirmation = await paymentService.confirmPayment(order.id);
        
        if (confirmation.success) {
          setPaymentSucceeded(true);
        } else {
          setError(confirmation.message || 'Payment confirmation failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  if (paymentSucceeded) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Order Number: {order.orderNumber}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Thank you for your purchase! Your order is now being processed.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => onPaymentComplete(order.id)}
        >
          View My Orders
        </Button>
      </Box>
    );
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
          <Typography variant="h6">
            Secure Payment
          </Typography>
        </Box>
        
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography color="text.secondary">Subtotal:</Typography>
          <Typography>{formatPrice(order.subtotal)}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography color="text.secondary">Tax:</Typography>
          <Typography>{formatPrice(order.taxAmount)}</Typography>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Total:</Typography>
          <Typography variant="h6" color="primary">
            {formatPrice(order.totalAmount)}
          </Typography>
        </Box>
      </Paper>

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
          `Pay ${formatPrice(order.totalAmount)}`
        )}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
        Your payment is secured by Stripe. We never store your card details.
      </Typography>
    </form>
  );
}

export default function Payment({ order, onBackToCheckout, onPaymentComplete }: PaymentProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get Stripe config
        const config = await paymentService.getConfig();
        setTestMode(config.testMode);
        setStripePromise(loadStripe(config.publishableKey));

        // Create payment intent
        const paymentIntent = await paymentService.createPaymentIntent(order.id);
        setClientSecret(paymentIntent.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
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
        <Typography>Initializing payment...</Typography>
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
          Back to Checkout
        </Button>
      </Box>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Payment system is not configured. Please contact support.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 500, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToCheckout}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5">
          Payment
        </Typography>
      </Box>

      {testMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future expiry date and any CVC.
        </Alert>
      )}

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#1976d2',
            },
          },
        }}
      >
        <PaymentForm order={order} onPaymentComplete={onPaymentComplete} />
      </Elements>
    </Box>
  );
}
