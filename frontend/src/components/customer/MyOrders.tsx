import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { orderService, type Order, ORDER_STATUS } from '../../services/orderService';

interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  const [open, setOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: number): 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case ORDER_STATUS.PENDING_PAYMENT: return 'warning';
      case ORDER_STATUS.PAID: return 'info';
      case ORDER_STATUS.CONFIRMED: return 'info';
      case ORDER_STATUS.PROCESSING: return 'primary';
      case ORDER_STATUS.SHIPPED: return 'primary';
      case ORDER_STATUS.COMPLETED: return 'success';
      case ORDER_STATUS.CANCELLED: return 'error';
      case ORDER_STATUS.ON_HOLD: return 'warning';
      default: return 'default';
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            {order.orderNumber}
          </Typography>
        </TableCell>
        <TableCell>{formatDate(order.orderDate)}</TableCell>
        <TableCell>
          <Chip
            label={order.statusName}
            color={getStatusColor(order.status)}
            size="small"
          />
        </TableCell>
        <TableCell align="right">{order.items.length}</TableCell>
        <TableCell align="right">
          <Typography fontWeight="medium" color="primary">
            {formatPrice(order.totalAmount)}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              {/* Order Items */}
              <Typography variant="subtitle2" gutterBottom>
                Order Items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Tax</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2">{item.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {item.productSku}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell align="right">
                        {formatPrice(item.taxAmount)}
                        <Typography variant="caption" color="text.secondary" display="block">
                          ({item.taxRate}%)
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatPrice(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Order Summary */}
              <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {order.shippingAddress}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
                    <Typography color="text.secondary">Subtotal:</Typography>
                    <Typography>{formatPrice(order.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
                    <Typography color="text.secondary">Tax:</Typography>
                    <Typography>{formatPrice(order.taxAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, mt: 1 }}>
                    <Typography fontWeight="bold">Total:</Typography>
                    <Typography fontWeight="bold" color="primary">
                      {formatPrice(order.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {order.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll();
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        My Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Alert severity="info">
          You haven't placed any orders yet.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell width={50} />
                <TableCell>Order #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
