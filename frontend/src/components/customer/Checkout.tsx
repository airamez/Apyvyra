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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { cartService, type CartSummary } from '../../services/cartService';
import { orderService, type CreateOrderRequest, type Order } from '../../services/orderService';
import Payment from './Payment';
import { getErrorMessages } from '../../utils/apiErrorHandler';
import { validateAddress, type AddressValidationResult } from '../../utils/addressValidation';
import { useFormatting } from '../../hooks/useFormatting';

interface CheckoutProps {
  onBackToCart: () => void;
  onOrderComplete: (orderId: number) => void;
}

export default function Checkout({ onBackToCart, onOrderComplete }: CheckoutProps) {
  const { formatCurrency } = useFormatting();
  
  const [cartSummary, setCartSummary] = useState<CartSummary>({ items: [], subtotal: 0, taxAmount: 0, total: 0, itemCount: 0 });
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [bypassValidation, setBypassValidation] = useState(false);

  useEffect(() => {
    const summary = cartService.getCartSummary();
    setCartSummary(summary);
    
    if (summary.items.length === 0 && !showPayment) {
      onBackToCart();
    }
  }, [onBackToCart, showPayment]);

  const handleValidateAddress = async () => {
    if (!shippingAddress.trim()) {
      setError('Please enter a shipping address first');
      return;
    }

    setIsValidatingAddress(true);
    setError(null);
    setAddressValidation(null);

    try {
      const result = await validateAddress(shippingAddress);
      setAddressValidation(result);
      
      if (!result.isValid) {
        setError(result.errorMessage || 'Address validation failed');
        
        // If authentication is required, show a more user-friendly message
        if (result.errorMessage?.includes('logged in')) {
          setError('Please log in to validate your address and proceed with checkout.');
        }
      }
    } catch (error) {
      setError('Failed to validate address. Please try again.');
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleChangeAddress = () => {
    // Reset everything to original state
    setShippingAddress('');
    setAddressValidation(null);
    setBypassValidation(false);
    setError(null);
    setIsValidatingAddress(false);
  };

  const handleProceedToPayment = async () => {
    if (!shippingAddress.trim()) {
      setError('Please enter a shipping address');
      return;
    }

    // Check address validation unless bypassed
    if (!bypassValidation && addressValidation && !addressValidation.isValid) {
      setError(addressValidation.errorMessage || 'Please enter a valid address');
      return;
    }

    if (!bypassValidation && !addressValidation) {
      setError('Please wait for address validation or check the bypass option');
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
        // Add Google Place ID if available
        googlePlaceId: addressValidation?.address?.place_id,
      };

      const order = await orderService.create(request);
      
      // Clear the cart after successful order creation
      cartService.clearCart();
      
      setCreatedOrder(order);
      setShowPayment(true);
    } catch (err) {
      const errorMessages = getErrorMessages(err);
      setError(errorMessages[0] || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCheckout = () => {
    setShowPayment(false);
    setCreatedOrder(null);
  };

  const { items, subtotal, taxAmount, total } = cartSummary;

  // Payment View
  if (showPayment && createdOrder) {
    return (
      <Payment
        order={createdOrder}
        onBackToCheckout={handleBackToCheckout}
        onPaymentComplete={onOrderComplete}
      />
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
              placeholder="Enter your complete shipping address (street, city, state, zip code)"
              value={shippingAddress}
              onChange={(e) => {
                setShippingAddress(e.target.value);
                // Clear validation when address changes
                if (addressValidation) {
                  setAddressValidation(null);
                }
              }}
              required
              disabled={addressValidation?.isValid === true}
              error={addressValidation ? !addressValidation.isValid && !bypassValidation : false}
              helperText={
                isValidatingAddress 
                  ? 'Validating address...' 
                  : addressValidation && !bypassValidation
                    ? addressValidation.isValid 
                      ? `Address validated successfully${addressValidation.isMockValidation ? ' (using mock validation)' : ''}` 
                      : addressValidation.errorMessage
                    : ''
              }
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleValidateAddress}
                disabled={isValidatingAddress || !shippingAddress.trim()}
                startIcon={isValidatingAddress ? <CircularProgress size={16} /> : null}
              >
                {isValidatingAddress ? 'Validating...' : 'Validate Address'}
              </Button>
              
              {addressValidation?.isValid && (
                <Button
                  variant="text"
                  onClick={handleChangeAddress}
                  color="secondary"
                  size="small"
                >
                  Change Address
                </Button>
              )}
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bypassValidation}
                    onChange={(e) => setBypassValidation(e.target.checked)}
                    color="primary"
                    disabled={addressValidation?.isValid === true}
                  />
                }
                label={`Bypass address validation${addressValidation?.isMockValidation ? ' (currently using mock validation)' : ' (for new addresses or validation issues)'}`}
              />
            </Box>
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
                            {formatCurrency(item.price)} each
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(lineTotal)}</TableCell>
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
            <Typography>{formatCurrency(subtotal)}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Tax:</Typography>
            <Typography>{formatCurrency(taxAmount)}</Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" color="primary">
              {formatCurrency(total)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleProceedToPayment}
            disabled={
              loading || 
              !shippingAddress.trim() || 
              (!bypassValidation && (!addressValidation || isValidatingAddress || !addressValidation.isValid))
            }
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
