import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { cartService, type CartSummary } from '../../services/cartService';
import { orderService, type CreateOrderRequest } from '../../services/orderService';

interface CheckoutProps {
  onBackToCart: () => void;
  onOrderComplete: (orderId: number) => void;
}

export default function Checkout({ onBackToCart, onOrderComplete }: CheckoutProps) {
  const [cartSummary, setCartSummary] = useState<CartSummary>({ items: [], subtotal: 0, taxAmount: 0, total: 0, itemCount: 0 });
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    const summary = cartService.getCartSummary();
    setCartSummary(summary);
    
    if (summary.items.length === 0) {
      onBackToCart();
    }
  }, [onBackToCart]);

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      setError('Please enter a shipping address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateOrderRequest = {
        items: cartSummary.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: shippingAddress.trim(),
        notes: notes.trim() || undefined,
      };

      const order = await orderService.create(request);
      
      // Clear the cart after successful order
      cartService.clearCart();
      
      setOrderId(order.id);
      setOrderNumber(order.orderNumber);
      setOrderPlaced(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const { items, subtotal, taxAmount, total } = cartSummary;

  // Order Success View
  if (orderPlaced && orderId) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Order Placed Successfully!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Order Number: {orderNumber}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Thank you for your purchase! You will receive a confirmation email shortly with your order details.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => onOrderComplete(orderId)}
        >
          View My Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToCart}
          variant="outlined"
          size="small"
        >
          Back to Cart
        </Button>
        <Typography variant="h5">
          Checkout
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Left: Shipping & Order Items */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          {/* Shipping Address */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Shipping Address
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your complete shipping address (street, city, state, zip code, country)"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />
          </Paper>

          {/* Order Notes */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Order Notes (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Any special instructions for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Order Items ({items.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const lineSubtotal = item.price * item.quantity;
                    const lineTax = lineSubtotal * (item.taxRate / 100);
                    const lineTotal = lineSubtotal + lineTax;

                    return (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <Typography variant="body2">{item.productName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatPrice(item.price)} each
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatPrice(lineTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Right: Order Summary */}
        <Paper sx={{ p: 2, width: 300, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Subtotal:</Typography>
            <Typography>{formatPrice(subtotal)}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Tax:</Typography>
            <Typography>{formatPrice(taxAmount)}</Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" color="primary">
              {formatPrice(total)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handlePlaceOrder}
            disabled={loading || !shippingAddress.trim()}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Place Order'
            )}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
