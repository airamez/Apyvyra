import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { customerService } from '../../../services/customerService';
import type { CustomerOrdersDialogProps, CustomerOrder } from './types';

export default function CustomerOrdersDialog({ 
  open, 
  onClose, 
  customer, 
  t, 
  formatDateTime, 
  formatCurrency 
}: CustomerOrdersDialogProps) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      loadOrders();
    }
  }, [open, customer]);

  const loadOrders = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      const data = await customerService.getOrders(customer.id);
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOrders([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{t('CUSTOMER_ORDERS')} - {customer?.fullName}</Typography>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('NO_ORDERS')}
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('ORDER_NUMBER')}</TableCell>
                  <TableCell>{t('ORDER_DATE')}</TableCell>
                  <TableCell>{t('ORDER_STATUS')}</TableCell>
                  <TableCell>{t('PAYMENT_STATUS')}</TableCell>
                  <TableCell align="right">{t('TOTAL_AMOUNT')}</TableCell>
                  <TableCell align="center">{t('ITEMS')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{formatDateTime(order.orderDate)}</TableCell>
                    <TableCell><Chip label={order.statusName} size="small" /></TableCell>
                    <TableCell><Chip label={order.paymentStatusName} size="small" /></TableCell>
                    <TableCell align="right">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell align="center">{order.itemCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
