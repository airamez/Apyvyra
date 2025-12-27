import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import { cartService, type CartSummary } from '../../services/cartService';

interface ShoppingCartProps {
  onBackToStore: () => void;
  onCheckout: () => void;
}

export default function ShoppingCart({ onBackToStore, onCheckout }: ShoppingCartProps) {
  const [cartSummary, setCartSummary] = useState<CartSummary>({ items: [], subtotal: 0, taxAmount: 0, total: 0, itemCount: 0 });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    setCartSummary(cartService.getCartSummary());
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity >= 1) {
      cartService.updateQuantity(productId, newQuantity);
      loadCart();
    }
  };

  const handleRemoveItem = (productId: number) => {
    cartService.removeItem(productId);
    loadCart();
  };

  const handleClearCart = () => {
    cartService.clearCart();
    loadCart();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const { items, subtotal, taxAmount, total } = cartSummary;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToStore}
          variant="outlined"
          size="small"
        >
          Continue Shopping
        </Button>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Shopping Cart
        </Typography>
        {items.length > 0 && (
          <Button
            startIcon={<RemoveShoppingCartIcon />}
            onClick={handleClearCart}
            color="error"
            variant="outlined"
            size="small"
          >
            Clear Cart
          </Button>
        )}
      </Box>

      {items.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Your cart is empty. Start shopping to add items!
        </Alert>
      ) : (
        <>
          {/* Cart Items Table */}
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center" width={50}></TableCell>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.imageUrl && (
                            <Box
                              component="img"
                              src={item.imageUrl}
                              alt={item.productName}
                              sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1 }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              SKU: {item.productSku}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatPrice(item.price)}
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, style: { textAlign: 'center', width: 50 } }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatPrice(lineTax)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({item.taxRate}%)
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="medium">
                          {formatPrice(lineTotal)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Cart Summary */}
          <Paper sx={{ p: 2, maxWidth: 350, ml: 'auto' }}>
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
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                {formatPrice(total)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<ShoppingCartCheckoutIcon />}
              onClick={onCheckout}
            >
              Proceed to Checkout
            </Button>
          </Paper>
        </>
      )}
    </Box>
  );
}
