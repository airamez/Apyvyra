import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FilterComponent, { type FilterValues } from './FilterComponent';
import {
  AddCustomerDialog,
  CustomerFullViewDialog,
  type Customer,
} from './customers';
import { customerService } from '../../services/customerService';
import { useTranslation } from '../../hooks/useTranslation';
import { useFormatting } from '../../hooks/useFormatting';

export default function Customers() {
  const { t } = useTranslation('Customers');
  const { formatCurrency, formatDate, formatTime } = useFormatting();
  
  const formatDateTime = useCallback(
    (dateString: string) => `${formatDate(dateString)} ${formatTime(dateString)}`,
    [formatDate, formatTime]
  );

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [fullViewDialogOpen, setFullViewDialogOpen] = useState(false);

  // Selected customer for dialogs
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadCustomers = useCallback(async (appliedFilters?: FilterValues) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getAll(appliedFilters);
      setCustomers(response.data || []);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch {
      setError(t('FAILED_LOAD_CUSTOMERS'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (filters: FilterValues) => loadCustomers(filters);
  const handleClearFilters = () => loadCustomers();

  const showSuccess = (message: string) => setSnackbar({ open: true, message, severity: 'success' });

  const getStatusColor = (status: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 0: return 'warning';
      case 1: return 'success';
      case 2: return 'error';
      default: return 'default';
    }
  };

  // Dialog handlers
  const handleOpenFullViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFullViewDialogOpen(true);
  };

  const handleCloseFullViewDialog = () => {
    setFullViewDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleDialogSuccess = (message: string) => {
    showSuccess(message);
    loadCustomers();
  };

  const handleCustomerDeleted = () => {
    showSuccess(t('CUSTOMER_DELETED'));
    loadCustomers();
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: t('ID'), width: 70 },
    { field: 'fullName', headerName: t('FULL_NAME'), flex: 1, minWidth: 150 },
    { field: 'email', headerName: t('EMAIL'), flex: 1, minWidth: 180 },
    { field: 'phone', headerName: t('PHONE'), width: 130 },
    {
      field: 'status',
      headerName: t('STATUS'),
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.row.statusName} color={getStatusColor(params.row.status)} size="small" />
      ),
    },
    {
      field: 'addressValidated',
      headerName: t('ADDRESS_VALIDATED'),
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        params.row.addressValidated ? 
          <CheckCircleIcon color="success" fontSize="small" /> : 
          <CancelIcon color="disabled" fontSize="small" />
      ),
    },
    {
      field: 'orderCount',
      headerName: t('ORDERS_COUNT'),
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.row.orderCount} size="small" variant="outlined" />
      ),
    },
    {
      field: 'phoneCallCount',
      headerName: t('CALLS_COUNT'),
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.row.phoneCallCount} size="small" variant="outlined" />
      ),
    },
    {
      field: 'actions',
      headerName: t('ACTIONS'),
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={t('EDIT_CUSTOMER')}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenFullViewDialog(params.row); }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">{t('TITLE')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
            {t('ADD_CUSTOMER')}
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadCustomers()} disabled={loading}>
            {loading ? t('LOADING') : t('REFRESH')}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <FilterComponent
        config={{
          fields: [
            { name: 'fullName', label: t('FULL_NAME'), type: 'string', operators: ['contains', 'eq', 'startsWith'], defaultOperator: 'contains', placeholder: t('SEARCH_NAME') },
            { name: 'email', label: t('EMAIL'), type: 'string', operators: ['contains', 'eq', 'startsWith'], defaultOperator: 'contains', placeholder: t('SEARCH_EMAIL') },
            { name: 'phone', label: t('PHONE'), type: 'string', operators: ['contains', 'eq', 'startsWith'], defaultOperator: 'contains', placeholder: t('SEARCH_PHONE') },
          ],
          onSearch: handleSearch,
          onClear: handleClearFilters,
          collapsible: true,
        }}
        hasMoreRecords={hasMoreRecords}
        totalCount={totalCount}
        currentCount={customers.length}
      />

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('CUSTOMER_LIST')}</Typography>
            <Chip label={`${customers.length} ${t('CUSTOMERS_COUNT')}`} color="primary" />
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : customers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">{t('NO_CUSTOMERS')}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={customers}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
              autoHeight
              density="compact"
              sx={{ border: 'none', cursor: 'pointer' }}
              onRowDoubleClick={(params) => handleOpenFullViewDialog(params.row as Customer)}
            />
          </Box>
        )}
      </Box>

      {/* Dialogs */}
      <AddCustomerDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => handleDialogSuccess(t('CUSTOMER_CREATED'))}
        t={t}
      />

      <CustomerFullViewDialog
        open={fullViewDialogOpen}
        onClose={handleCloseFullViewDialog}
        onSuccess={handleDialogSuccess}
        onDelete={handleCustomerDeleted}
        customer={selectedCustomer}
        t={t}
        formatDateTime={formatDateTime}
        formatCurrency={formatCurrency}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
