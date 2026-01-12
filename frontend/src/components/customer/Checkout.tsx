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
import { userService } from '../../services/userService';
import Payment from './Payment';
import { getErrorMessages } from '../../utils/apiErrorHandler';
import { validateAddress, type AddressValidationResult } from '../../utils/addressValidation';
import AddressConfirmationDialog from '../common/AddressConfirmationDialog';
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
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  const [bypassValidation, setBypassValidation] = useState(false);
  const [useCustomerAddress, setUseCustomerAddress] = useState(false);
  const [customerAddress, setCustomerAddress] = useState<string | null>(null);
  const [loadingCustomerAddress, setLoadingCustomerAddress] = useState(true);

  useEffect(() => {
    const summary = cartService.getCartSummary();
    setCartSummary(summary);
    
    if (summary.items.length === 0 && !showPayment) {
      onBackToCart();
    }
  }, [onBackToCart, showPayment]);

  useEffect(() => {
    const loadCustomerAddress = async () => {
      try {
        const user = await userService.getCurrentUser();
        if (user.address) {
          setCustomerAddress(user.address);
        }
      } catch (err) {
        console.error('Failed to load customer address:', err);
      } finally {
        setLoadingCustomerAddress(false);
      }
    };
    loadCustomerAddress();
  }, []);

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
      
      // Show confirmation dialog if address is not an exact match but we have a suggested address
      if (!result.isExactMatch && (result.address || result.suggestions?.length)) {
        setShowAddressConfirmation(true);
        setError(null); // Clear any error since we're showing the modal
      } else if (!result.isValid) {
        setError(result.errorMessage || t('ADDRESS_VALIDATION_FAILED'));
        
        // If authentication is required, show a more user-friendly message
        if (result.errorMessage?.includes('logged in')) {
          setError(t('PLEASE_LOGIN_TO_VALIDATE'));
        }
      } else {
        setAddressValidated(true); // Mark as validated for exact matches
      }
    } catch (error) {
      setError(t('FAILED_VALIDATE_ADDRESS'));
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleAddressConfirm = (confirmedAddress: string) => {
    setShippingAddress(confirmedAddress);
    setShowAddressConfirmation(false);
    setAddressValidation({ 
      isValid: true, 
      isExactMatch: true, 
      address: null,
      errorMessage: undefined 
    });
    setAddressValidated(true); // Mark as validated
    setError(null);
  };

  const handleAddressReject = () => {
    setShowAddressConfirmation(false);
    // User can continue editing the original address
    setError(t('ADDRESS_REJECTED_PLEASE_EDIT'));
  };

  const handleChangeAddress = () => {
    // Reset validation state but keep the address content
    setAddressValidation(null);
    setBypassValidation(false);
    setError(null);
    setIsValidatingAddress(false);
    setShowAddressConfirmation(false);
    setAddressValidated(false); // Re-enable validation
  };

  const handleAddressChange = (newAddress: string) => {
    setShippingAddress(newAddress);
    // If user changes the address, re-enable validation
    if (addressValidated) {
      setAddressValidated(false);
      setAddressValidation(null);
      setError(null);
    }
  };

  const handleProceedToPayment = async () => {
    // If using customer address, validate that customer has an address
    if (useCustomerAddress) {
      if (!customerAddress) {
        setError(t('NO_SAVED_ADDRESS'));
        return;
      }
    } else {
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
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateOrderRequest = {
        items: cartSummary.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        notes: notes.trim() || undefined,
        useCustomerAddress: useCustomerAddress,
      };

      // Only include shippingAddress if not using customer address
      if (!useCustomerAddress) {
        request.shippingAddress = shippingAddress.trim();
        request.googlePlaceId = addressValidation?.address?.place_id;
      }

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
            
            {/* Use My Current Address checkbox */}
            {!loadingCustomerAddress && customerAddress && (
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useCustomerAddress}
                      onChange={(e) => {
                        setUseCustomerAddress(e.target.checked);
                        if (e.target.checked) {
                          setShippingAddress('');
                          setAddressValidation(null);
                          setBypassValidation(false);
                        }
                      }}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography component="span">{t('USE_MY_CURRENT_ADDRESS')}: </Typography>
                      <Typography component="span" color="text.secondary">{customerAddress}</Typography>
                    </Box>
                  }
                />
              </Box>
            )}
            
            {loadingCustomerAddress && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {t('LOADING_ADDRESS')}
                </Typography>
              </Box>
            )}
            
            {!useCustomerAddress && (
              <>
                <TextField
                  fullWidth
                  placeholder={t('SHIPPING_ADDRESS_PLACEHOLDER')}
                  value={shippingAddress}
                  onChange={(e) => {
                    handleAddressChange(e.target.value);
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
                    disabled={isValidatingAddress || !shippingAddress.trim() || addressValidated}
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
              </>
            )}
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
              loadingCustomerAddress ||
              (useCustomerAddress ? !customerAddress : (
                !shippingAddress.trim() || 
                (!bypassValidation && (!addressValidation || isValidatingAddress || !addressValidation.isValid))
              ))
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
      
      {/* Address Confirmation Dialog */}
      <AddressConfirmationDialog
        open={showAddressConfirmation}
        originalAddress={addressValidation?.originalAddress || ''}
        suggestedAddress={addressValidation?.address?.formatted_address || addressValidation?.suggestions?.[0] || ''}
        suggestions={addressValidation?.suggestions}
        onConfirm={handleAddressConfirm}
        onReject={handleAddressReject}
      />
    </Box>
  );
}
