import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterComponent, { type FilterConfig, type FilterValues } from '../FilterComponent';
import { orderService, type Order, ORDER_STATUS, ORDER_STATUS_NAMES } from '../../../services/orderService';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFormatting } from '../../../hooks/useFormatting';

export default function OrderManagement() {
  const { t } = useTranslation('OrderManagement');
  const { t: tCommon } = useTranslation('Common');
  const { formatCurrency, formatDate } = useFormatting();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [shippingDetails, setShippingDetails] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Pagination metadata
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadOrders = useCallback(async (filters?: FilterValues) => {
    try {
      setLoading(true);
      setError(null);

      const filterParams: Record<string, unknown> = {};
      
      if (filters) {
        filters.forEach(filter => {
          const paramName = `${filter.field}_${filter.operator}`;
          filterParams[paramName] = filter.value;
          if (filter.valueTo) {
            filterParams[`${filter.field}_${filter.operator}_to`] = filter.valueTo;
          }
        });
      }

      const response = await orderService.getAll(filterParams);
      setOrders(response.data || []);
      setHasMoreRecords(response.metadata?.hasMoreRecords || false);
      setTotalCount(response.metadata?.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearch = (filters: FilterValues) => {
    loadOrders(filters);
  };

  const handleClearFilters = () => {
    loadOrders();
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

  const getValidNextStatuses = (currentStatus: number): number[] => {
    // Define valid status transitions
    // At any point, order can be put on hold or cancelled
    const baseTransitions: Record<number, number[]> = {
      [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.PAID, ORDER_STATUS.ON_HOLD, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PAID]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.ON_HOLD, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.ON_HOLD, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.ON_HOLD, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.ON_HOLD, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.COMPLETED]: [], // Final state
      [ORDER_STATUS.CANCELLED]: [], // Final state
      [ORDER_STATUS.ON_HOLD]: [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    };
    return baseTransitions[currentStatus] || [];
  };

  const handleOpenEditDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShippingDetails('');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedOrder(null);
    setNewStatus(0);
    setShippingDetails('');
  };

  const handleOpenViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      setUpdateLoading(true);
      setError(null);

      await orderService.updateStatus(selectedOrder.id, newStatus, shippingDetails || undefined);
      
      setSuccessMessage(`Order ${selectedOrder.orderNumber} status updated successfully`);
      handleCloseEditDialog();
      loadOrders();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const filterConfig: FilterConfig = {
    fields: [
      {
        name: 'customerName',
        label: 'Customer Name',
        type: 'string',
        defaultOperator: 'contains',
      },
      {
        name: 'orderDate',
        label: 'Order Date',
        type: 'date',
        defaultOperator: 'between',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'dropdown',
        dropdownConfig: {
          endpoint: '',
          idField: 'id',
          nameField: 'name',
          staticOptions: Object.entries(ORDER_STATUS_NAMES).map(([id, name]) => ({
            id: parseInt(id),
            name,
          })),
        },
      },
    ],
    onSearch: handleSearch,
    onClear: handleClearFilters,
    collapsible: true,
  };

  const columns: GridColDef[] = [
    {
      field: 'orderNumber',
      headerName: t('ORDER_NUMBER'),
      width: 180,
    },
    {
      field: 'customerName',
      headerName: t('CUSTOMER'),
      width: 200,
    },
    {
      field: 'orderDate',
      headerName: t('ORDER_DATE'),
      width: 180,
      renderCell: (params: GridRenderCellParams) => formatDate(params.row.orderDate),
    },
    {
      field: 'totalAmount',
      headerName: t('TOTAL'),
      width: 120,
      renderCell: (params: GridRenderCellParams) => formatCurrency(params.row.totalAmount),
    },
    {
      field: 'statusName',
      headerName: t('STATUS'),
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.statusName}
          color={getStatusColor(params.row.status)}
          size="small"
        />
      ),
    },
    {
      field: 'paymentStatusName',
      headerName: 'Payment',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.paymentStatusName}
          color={params.row.paymentStatus === 1 ? 'success' : params.row.paymentStatus === 2 ? 'error' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('ACTIONS'),
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('VIEW_DETAILS')}>
            <IconButton
              size="small"
              onClick={() => handleOpenViewDialog(params.row as Order)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {getValidNextStatuses(params.row.status).length > 0 && (
            <Tooltip title={t('UPDATE_STATUS')}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleOpenEditDialog(params.row as Order)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {t('TITLE')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => loadOrders()}
          disabled={loading}
          sx={{ minWidth: '120px' }}
        >
          {loading ? t('LOADING') : t('REFRESH')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <FilterComponent
        config={filterConfig}
        hasMoreRecords={hasMoreRecords}
        totalCount={totalCount}
        currentCount={orders.length}
      />

      <DataGrid
        rows={orders}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        disableRowSelectionOnClick
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t('ORDER_DETAILS')}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Order: <strong>{selectedOrder.orderNumber}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer: {selectedOrder.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedOrder.customerEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status: <Chip label={selectedOrder.statusName} size="small" color={getStatusColor(selectedOrder.status)} />
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                <Typography>{selectedOrder.customerName}</Typography>
                <Typography variant="body2">{selectedOrder.customerEmail}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Shipping Address</Typography>
                <Typography style={{ whiteSpace: 'pre-line' }}>{selectedOrder.shippingAddress}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Order Items</Typography>
                {selectedOrder.items.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography>{item.productName}</Typography>
                      <Typography variant="body2" color="text.secondary">SKU: {item.productSku}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography>{item.quantity} x {formatCurrency(item.unitPrice)}</Typography>
                      <Typography variant="body2" color="text.secondary">{formatCurrency(item.lineTotal)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">Subtotal: {formatCurrency(selectedOrder.subtotal)}</Typography>
                  <Typography variant="body2">Tax: {formatCurrency(selectedOrder.taxAmount)}</Typography>
                  <Typography variant="h6">Total: {formatCurrency(selectedOrder.totalAmount)}</Typography>
                </Box>
              </Box>

              {selectedOrder.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography>{selectedOrder.notes}</Typography>
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Timeline</Typography>
                <Typography variant="body2">Order Date: {formatDate(selectedOrder.orderDate)}</Typography>
                {selectedOrder.paidAt && <Typography variant="body2">Paid: {formatDate(selectedOrder.paidAt)}</Typography>}
                {selectedOrder.confirmedAt && <Typography variant="body2">Confirmed: {formatDate(selectedOrder.confirmedAt)}</Typography>}
                {selectedOrder.shippedAt && <Typography variant="body2">Shipped: {formatDate(selectedOrder.shippedAt)}</Typography>}
                {selectedOrder.deliveredAt && <Typography variant="body2">Completed: {formatDate(selectedOrder.deliveredAt)}</Typography>}
                {selectedOrder.cancelledAt && <Typography variant="body2" color="error">Cancelled: {formatDate(selectedOrder.cancelledAt)}</Typography>}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>{tCommon('CLOSE')}</Button>
          {selectedOrder && getValidNextStatuses(selectedOrder.status).length > 0 && (
            <Button
              variant="contained"
              onClick={() => {
                handleCloseViewDialog();
                handleOpenEditDialog(selectedOrder);
              }}
              sx={{ ml: 1 }}
            >
              {t('UPDATE_STATUS')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('UPDATE_ORDER_STATUS')}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Order: <strong>{selectedOrder.orderNumber}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer: {selectedOrder.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status: <Chip label={selectedOrder.statusName} size="small" color={getStatusColor(selectedOrder.status)} />
              </Typography>

              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>{t('NEW_STATUS')}</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as number)}
                  label={t('NEW_STATUS')}
                >
                  {getValidNextStatuses(selectedOrder.status).map((status) => (
                    <MenuItem key={status} value={status}>
                      {ORDER_STATUS_NAMES[status]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {newStatus === ORDER_STATUS.SHIPPED && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t('SHIPPING_DETAILS')}
                  value={shippingDetails}
                  onChange={(e) => setShippingDetails(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>{tCommon('CANCEL')}</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={updateLoading || newStatus === selectedOrder?.status}
          >
            {updateLoading ? t('UPDATING') : t('UPDATE_STATUS')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
