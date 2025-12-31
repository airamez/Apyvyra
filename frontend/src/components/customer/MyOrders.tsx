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
import { useTranslation } from '../../hooks/useTranslation';

interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  const { t } = useTranslation('MyOrders');
  const { t: tCommon } = useTranslation('Common');
  
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
      <TableRow>
        <TableCell>
          <Typography variant="body2" fontWeight="bold">
            #{order.id}
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
        <TableCell>{order.items?.length || 0}</TableCell>
        <TableCell align="right">
          <Typography fontWeight="bold">
            {formatPrice(order.totalAmount)}
          </Typography>
        </TableCell>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                {t('ORDER_ITEMS')}
              </Typography>
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('PRODUCT')}</TableCell>
                    <TableCell align="right">{t('QTY')}</TableCell>
                    <TableCell align="right">{t('UNIT_PRICE')}</TableCell>
                    <TableCell align="right">{t('TAX')}</TableCell>
                    <TableCell align="right">{t('TOTAL')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map((item) => {
                    const lineSubtotal = item.price * item.quantity;
                    const lineTax = lineSubtotal * (item.taxRate / 100);
                    const lineTotal = lineSubtotal + lineTax;
                    
                    return (
                      <TableRow key={item.productId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatPrice(item.price)}</TableCell>
                        <TableCell align="right">{formatPrice(lineTax)}</TableCell>
                        <TableCell align="right">{formatPrice(lineTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: 200 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{t('SUBTOTAL')}:</Typography>
                    <Typography>{formatPrice(order.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{t('TAX_LABEL')}:</Typography>
                    <Typography>{formatPrice(order.taxAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{t('TOTAL_LABEL')}:</Typography>
                    <Typography fontWeight="bold" color="primary">
                      {formatPrice(order.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('SHIPPING_ADDRESS')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress}
                </Typography>
              </Box>

              {order.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('NOTES')}
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
  const { t } = useTranslation('MyOrders');
  const { t: tCommon } = useTranslation('Common');
  
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
      setError(err instanceof Error ? err.message : t('FAILED_LOAD_ORDERS'));
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

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {t('TITLE')}
      </Typography>

      {orders.length === 0 ? (
        <Typography color="text.secondary">
          {t('NO_ORDERS')}
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('ORDER_NUMBER')}</TableCell>
                <TableCell>{t('DATE')}</TableCell>
                <TableCell>{t('STATUS')}</TableCell>
                <TableCell>{t('ITEMS')}</TableCell>
                <TableCell align="right">{t('TOTAL')}</TableCell>
                <TableCell></TableCell>
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
