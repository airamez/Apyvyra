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
import { useTranslation } from '../../hooks/useTranslation';

interface CheckoutProps {
  onBackToCart: () => void;
  onOrderComplete: (orderId: number) => void;
}

export default function Checkout({ onBackToCart, onOrderComplete }: CheckoutProps) {
  const { formatCurrency } = useFormatting();
  const { t } = useTranslation('Checkout');
  
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
      setError(t('ENTER_ADDRESS_FIRST'));
      return;
    }

    setIsValidatingAddress(true);
    setError(null);
    setAddressValidation(null);

    try {
      const result = await validateAddress(shippingAddress);
      setAddressValidation(result);
      
      if (!result.isValid) {
        setError(result.errorMessage || t('ADDRESS_VALIDATION_FAILED'));
        
        // If authentication is required, show a more user-friendly message
        if (result.errorMessage?.includes('logged in')) {
          setError(t('PLEASE_LOGIN_TO_VALIDATE'));
        }
      }
    } catch (error) {
      setError(t('FAILED_VALIDATE_ADDRESS'));
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
      setError(t('ENTER_SHIPPING_ADDRESS'));
      return;
    }

    // Check address validation unless bypassed
    if (!bypassValidation && addressValidation && !addressValidation.isValid) {
      setError(addressValidation.errorMessage || t('ENTER_VALID_ADDRESS'));
      return;
    }

    if (!bypassValidation && !addressValidation) {
      setError(t('WAIT_FOR_VALIDATION'));
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
      setError(errorMessages[0] || t('FAILED_CREATE_ORDER'));
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
          {t('BACK_TO_CART')}
        </Button>
        <Typography variant="h5">
          {t('TITLE')}
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
              {t('SHIPPING_ADDRESS')}
            </Typography>
            <TextField
              fullWidth
              placeholder={t('SHIPPING_ADDRESS_PLACEHOLDER')}
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
                  ? t('VALIDATING_ADDRESS')
                  : addressValidation && !bypassValidation
                    ? addressValidation.isValid 
                      ? `${t('ADDRESS_VALIDATED')}${addressValidation.isMockValidation ? ` ${t('ADDRESS_VALIDATED_MOCK')}` : ''}` 
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
                {isValidatingAddress ? t('VALIDATING_ADDRESS') : t('VALIDATE_ADDRESS')}
              </Button>
              
              {addressValidation?.isValid && (
                <Button
                  variant="text"
                  onClick={handleChangeAddress}
                  color="secondary"
                  size="small"
                >
                  {t('CHANGE_ADDRESS')}
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
                label={`${t('BYPASS_VALIDATION')}${addressValidation?.isMockValidation ? ` ${t('BYPASS_VALIDATION_MOCK')}` : ` ${t('BYPASS_VALIDATION_HELP')}`}`}
              />
            </Box>
          </Paper>

          {/* Order Notes */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('ORDER_NOTES')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder={t('ORDER_NOTES_PLACEHOLDER')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('ORDER_ITEMS')} ({items.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('PRODUCT')}</TableCell>
                    <TableCell align="center">{t('QTY')}</TableCell>
                    <TableCell align="right">{t('TOTAL')}</TableCell>
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
            {t('ORDER_SUMMARY')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">{t('SUBTOTAL')}:</Typography>
            <Typography>{formatCurrency(subtotal)}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">{t('TAX')}:</Typography>
            <Typography>{formatCurrency(taxAmount)}</Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">{t('TOTAL')}:</Typography>
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
              t('PROCEED_TO_PAYMENT')
            )}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
