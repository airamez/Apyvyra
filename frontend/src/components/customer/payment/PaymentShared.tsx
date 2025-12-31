import { Box, Typography, Button, Paper, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { type Order } from '../../../services/orderService';
import { useFormatting } from '../../../hooks/useFormatting';

interface PaymentSuccessProps {
  order: Order;
  onPaymentComplete: (orderId: number) => void;
}

interface OrderSummaryProps {
  order: Order;
}

export function PaymentSuccess({ order, onPaymentComplete }: PaymentSuccessProps) {
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

export function OrderSummary({ order }: OrderSummaryProps) {
  const { formatCurrency } = useFormatting();
  
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Order Summary
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="text.secondary">Subtotal:</Typography>
        <Typography>{formatCurrency(order.subtotal)}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="text.secondary">Tax:</Typography>
        <Typography>{formatCurrency(order.taxAmount)}</Typography>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Total:</Typography>
        <Typography variant="h6" color="primary">
          {formatCurrency(order.totalAmount)}
        </Typography>
      </Box>
    </Paper>
  );
}
