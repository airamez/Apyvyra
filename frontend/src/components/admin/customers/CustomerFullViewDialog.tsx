import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams, type GridSortModel } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import { customerService } from '../../../services/customerService';
import { validateAddress } from '../../../utils/addressValidation';
import { getErrorMessages } from '../../../utils/apiErrorHandler';
import FilterComponent, { type FilterValues, type FilterFieldConfig } from '../FilterComponent';
import type { Customer, CustomerOrder, PhoneCall, UpdateCustomerData, CreatePhoneCallData, AddressValidationState, CustomerFullViewDialogProps } from './types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const MAX_RECORDS = 100;

export default function CustomerFullViewDialog({
  open,
  onClose,
  onSuccess,
  onDelete,
  customer,
  t,
  formatDateTime,
  formatCurrency,
}: CustomerFullViewDialogProps) {
  const [formData, setFormData] = useState<UpdateCustomerData>({});
  const [addressValidation, setAddressValidation] = useState<AddressValidationState>({
    result: null,
    isValidating: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Orders state
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersSortModel, setOrdersSortModel] = useState<GridSortModel>([{ field: 'orderDate', sort: 'desc' }]);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);

  // Phone calls state
  const [phoneCalls, setPhoneCalls] = useState<PhoneCall[]>([]);
  const [phoneCallsLoading, setPhoneCallsLoading] = useState(false);
  const [phoneCallsSortModel, setPhoneCallsSortModel] = useState<GridSortModel>([{ field: 'callDate', sort: 'desc' }]);
  const [phoneCallsHasMore, setPhoneCallsHasMore] = useState(false);
  const [phoneCallsTotalCount, setPhoneCallsTotalCount] = useState(0);

  // Add phone call dialog state
  const [addPhoneCallOpen, setAddPhoneCallOpen] = useState(false);
  const [phoneCallFormData, setPhoneCallFormData] = useState<CreatePhoneCallData>({
    callType: 0,
    durationMinutes: undefined,
    notes: '',
  });
  const [phoneCallFormLoading, setPhoneCallFormLoading] = useState(false);
  const [phoneCallError, setPhoneCallError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (customer && open) {
      setFormData({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        address: customer.address?.addressLine || '',
        status: customer.status,
        bypassAddressValidation: false,
        notes: customer.notes || '',
      });
      setAddressValidation({
        result: customer.address?.isValidated ? { isValid: true, address: null } : null,
        isValidating: false,
      });
      setError(null);
      setTabValue(0);
      loadOrders();
      loadPhoneCalls();
    }
  }, [customer, open]);

  const loadOrders = useCallback(async (filters?: FilterValues) => {
    if (!customer) return;
    try {
      setOrdersLoading(true);
      const data = await customerService.getOrders(customer.id);
      
      // Apply client-side filtering if filters provided
      let filteredData = data;
      if (filters && filters.length > 0) {
        filteredData = data.filter(order => {
          return filters.every(filter => {
            const value = order[filter.field as keyof CustomerOrder];
            if (value === undefined || value === null) return false;
            
            const strValue = String(value).toLowerCase();
            const filterValue = String(filter.value).toLowerCase();
            
            switch (filter.operator) {
              case 'contains': return strValue.includes(filterValue);
              case 'eq': return strValue === filterValue;
              case 'startsWith': return strValue.startsWith(filterValue);
              default: return true;
            }
          });
        });
      }
      
      // Sort by date descending by default
      filteredData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      
      const totalCount = filteredData.length;
      const hasMore = totalCount > MAX_RECORDS;
      setOrdersTotalCount(totalCount);
      setOrdersHasMore(hasMore);
      setOrders(filteredData.slice(0, MAX_RECORDS));
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [customer]);

  const loadPhoneCalls = useCallback(async (filters?: FilterValues) => {
    if (!customer) return;
    try {
      setPhoneCallsLoading(true);
      const data = await customerService.getPhoneCalls(customer.id);
      
      // Apply client-side filtering if filters provided
      let filteredData = data;
      if (filters && filters.length > 0) {
        filteredData = data.filter(call => {
          return filters.every(filter => {
            const value = call[filter.field as keyof PhoneCall];
            if (value === undefined || value === null) return false;
            
            const strValue = String(value).toLowerCase();
            const filterValue = String(filter.value).toLowerCase();
            
            switch (filter.operator) {
              case 'contains': return strValue.includes(filterValue);
              case 'eq': return strValue === filterValue;
              case 'startsWith': return strValue.startsWith(filterValue);
              default: return true;
            }
          });
        });
      }
      
      // Sort by date descending by default
      filteredData.sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime());
      
      const totalCount = filteredData.length;
      const hasMore = totalCount > MAX_RECORDS;
      setPhoneCallsTotalCount(totalCount);
      setPhoneCallsHasMore(hasMore);
      setPhoneCalls(filteredData.slice(0, MAX_RECORDS));
    } catch {
      setPhoneCalls([]);
    } finally {
      setPhoneCallsLoading(false);
    }
  }, [customer]);

  const handleClose = () => {
    setFormData({});
    setAddressValidation({ result: null, isValidating: false });
    setError(null);
    setOrders([]);
    setPhoneCalls([]);
    setTabValue(0);
    onClose();
  };

  const handleValidateAddress = async () => {
    if (!formData.address?.trim()) return;
    
    setAddressValidation({ ...addressValidation, isValidating: true });
    try {
      const result = await validateAddress(formData.address);
      setAddressValidation({ result, isValidating: false });
    } catch {
      setAddressValidation({
        result: { isValid: false, address: null, errorMessage: t('ADDRESS_VALIDATION_FAILED') },
        isValidating: false,
      });
    }
  };

  const handleSubmit = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      setError(null);
      await customerService.update(customer.id, formData);
      onSuccess(t('CUSTOMER_UPDATED'));
    } catch (err) {
      const errors = getErrorMessages(err);
      setError(errors[0] || t('ERROR_UPDATING_CUSTOMER'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendWelcomeEmail = async () => {
    if (!customer) return;
    try {
      await customerService.resendWelcomeEmail(customer.id);
      onSuccess(t('WELCOME_EMAIL_SENT'));
    } catch {
      setError(t('FAILED_SEND_WELCOME_EMAIL'));
    }
  };

  // Phone call handlers
  const handleOpenAddPhoneCall = () => {
    setPhoneCallFormData({ callType: 0, durationMinutes: undefined, notes: '' });
    setPhoneCallError(null);
    setAddPhoneCallOpen(true);
  };

  const handleCloseAddPhoneCall = () => {
    setPhoneCallFormData({ callType: 0, durationMinutes: undefined, notes: '' });
    setPhoneCallError(null);
    setAddPhoneCallOpen(false);
  };

  const handleCreatePhoneCall = async () => {
    if (!customer) return;
    try {
      setPhoneCallFormLoading(true);
      setPhoneCallError(null);
      await customerService.createPhoneCall(customer.id, phoneCallFormData);
      handleCloseAddPhoneCall();
      await loadPhoneCalls();
      onSuccess(t('PHONE_CALL_CREATED'));
    } catch (err) {
      const errors = getErrorMessages(err);
      setPhoneCallError(errors[0] || t('ERROR_CREATING_PHONE_CALL'));
    } finally {
      setPhoneCallFormLoading(false);
    }
  };

  const handleDeletePhoneCall = async (callId: number) => {
    if (!customer) return;
    try {
      await customerService.deletePhoneCall(customer.id, callId);
      await loadPhoneCalls();
      onSuccess(t('PHONE_CALL_DELETED'));
    } catch (err) {
      const errors = getErrorMessages(err);
      setError(errors[0] || t('ERROR_DELETING_PHONE_CALL'));
    }
  };

  // Delete customer handlers
  const handleOpenDeleteConfirm = () => {
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteError(null);
    setDeleteConfirmOpen(false);
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await customerService.delete(customer.id);
      handleCloseDeleteConfirm();
      handleClose();
      onDelete();
    } catch (err) {
      const errors = getErrorMessages(err);
      setDeleteError(errors[0] || t('ERROR_DELETING_CUSTOMER'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Orders columns
  const ordersColumns: GridColDef[] = [
    { field: 'orderNumber', headerName: t('ORDER_NUMBER'), width: 120, sortable: true },
    {
      field: 'orderDate',
      headerName: t('ORDER_DATE'),
      width: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value),
    },
    {
      field: 'statusName',
      headerName: t('ORDER_STATUS'),
      width: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => <Chip label={params.value} size="small" />,
    },
    {
      field: 'paymentStatusName',
      headerName: t('PAYMENT_STATUS'),
      width: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => <Chip label={params.value} size="small" />,
    },
    {
      field: 'totalAmount',
      headerName: t('TOTAL_AMOUNT'),
      width: 120,
      sortable: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => formatCurrency(params.value),
    },
    { field: 'itemCount', headerName: t('ITEMS'), width: 80, sortable: true, align: 'center', headerAlign: 'center' },
  ];

  // Phone calls columns
  const phoneCallsColumns: GridColDef[] = [
    {
      field: 'callDate',
      headerName: t('CALL_DATE'),
      width: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value),
    },
    {
      field: 'callTypeName',
      headerName: t('CALL_TYPE'),
      width: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => <Chip label={params.value} size="small" />,
    },
    {
      field: 'durationMinutes',
      headerName: t('DURATION'),
      width: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => params.value ? `${params.value} min` : '-',
    },
    {
      field: 'notes',
      headerName: t('NOTES'),
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {params.value || '-'}
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: t('ACTIONS'),
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton size="small" color="error" onClick={() => handleDeletePhoneCall(params.row.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // Filter configs
  const ordersFilterFields: FilterFieldConfig[] = [
    { name: 'orderNumber', label: t('ORDER_NUMBER'), type: 'string', operators: ['contains', 'eq'], defaultOperator: 'contains' },
    { name: 'statusName', label: t('ORDER_STATUS'), type: 'string', operators: ['contains', 'eq'], defaultOperator: 'contains' },
    { name: 'orderDate', label: t('ORDER_DATE'), type: 'date', operators: ['eq', 'gte', 'lte'], defaultOperator: 'gte' },
  ];

  const phoneCallsFilterFields: FilterFieldConfig[] = [
    { name: 'callTypeName', label: t('CALL_TYPE'), type: 'string', operators: ['contains', 'eq'], defaultOperator: 'contains' },
    { name: 'notes', label: t('NOTES'), type: 'string', operators: ['contains'], defaultOperator: 'contains' },
    { name: 'callDate', label: t('CALL_DATE'), type: 'date', operators: ['eq', 'gte', 'lte'], defaultOperator: 'gte' },
  ];

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { minHeight: '80vh', maxHeight: '80vh' } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('CUSTOMER_DETAILS')} - {customer?.fullName || customer?.email}</Typography>
            <IconButton onClick={handleClose}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={t('CUSTOMER_INFORMATION')} />
            <Tab label={`${t('ORDERS_SECTION')} (${customer?.orderCount || 0})`} />
            <Tab label={`${t('PHONE_CALLS_SECTION')} (${customer?.phoneCallCount || 0})`} />
          </Tabs>

          {/* Customer Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={t('EMAIL')}
                value={customer?.email || ''}
                disabled
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('FULL_NAME')}
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('PHONE')}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('ADDRESS')}
                value={formData.address || ''}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  setAddressValidation({ result: null, isValidating: false });
                }}
                multiline
                rows={2}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText={
                  addressValidation.isValidating ? t('VALIDATING_ADDRESS') :
                  addressValidation.result ? (addressValidation.result.isValid ? t('ADDRESS_VALID') : addressValidation.result.errorMessage) : ''
                }
                error={addressValidation.result ? !addressValidation.result.isValid && !formData.bypassAddressValidation : false}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleValidateAddress}
                  disabled={addressValidation.isValidating || !formData.address?.trim()}
                >
                  {addressValidation.isValidating ? t('VALIDATING_ADDRESS') : t('VALIDATE_ADDRESS')}
                </Button>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.bypassAddressValidation || false}
                      onChange={(e) => setFormData({ ...formData, bypassAddressValidation: e.target.checked })}
                    />
                  }
                  label={t('BYPASS_ADDRESS_VALIDATION')}
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>{t('STATUS')}</InputLabel>
                <Select
                  value={formData.status ?? 0}
                  label={t('STATUS')}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as number })}
                >
                  <MenuItem value={0}>{t('PENDING_CONFIRMATION')}</MenuItem>
                  <MenuItem value={1}>{t('ACTIVE')}</MenuItem>
                  <MenuItem value={2}>{t('INACTIVE')}</MenuItem>
                </Select>
              </FormControl>

              {/* Notes Section - Collapsible but expanded by default */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">{t('CUSTOMER_NOTES')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    multiline
                    rows={4}
                    fullWidth
                    placeholder={t('NOTES')}
                  />
                </AccordionDetails>
              </Accordion>

              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {customer?.status === 0 && (
                    <Button
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={handleResendWelcomeEmail}
                    >
                      {t('RESEND_WELCOME_EMAIL')}
                    </Button>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleOpenDeleteConfirm}
                  >
                    {t('DELETE_CUSTOMER')}
                  </Button>
                  <Button onClick={handleClose}>{t('CANCEL')}</Button>
                  <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : t('SAVE')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </TabPanel>

          {/* Orders Tab */}
          <TabPanel value={tabValue} index={1}>
            <FilterComponent
              config={{
                fields: ordersFilterFields,
                onSearch: loadOrders,
                onClear: () => loadOrders(),
                collapsible: true,
              }}
              hasMoreRecords={ordersHasMore}
              totalCount={ordersTotalCount}
              currentCount={orders.length}
            />
            
            {ordersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : orders.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {t('NO_ORDERS')}
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 400 }}>
                <DataGrid
                  rows={orders}
                  columns={ordersColumns}
                  sortModel={ordersSortModel}
                  onSortModelChange={setOrdersSortModel}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  disableRowSelectionOnClick
                  density="compact"
                />
              </Box>
            )}
          </TabPanel>

          {/* Phone Calls Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button startIcon={<AddIcon />} variant="contained" onClick={handleOpenAddPhoneCall}>
                {t('ADD_PHONE_CALL')}
              </Button>
            </Box>
            
            <FilterComponent
              config={{
                fields: phoneCallsFilterFields,
                onSearch: loadPhoneCalls,
                onClear: () => loadPhoneCalls(),
                collapsible: true,
              }}
              hasMoreRecords={phoneCallsHasMore}
              totalCount={phoneCallsTotalCount}
              currentCount={phoneCalls.length}
            />
            
            {phoneCallsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : phoneCalls.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {t('NO_PHONE_CALLS')}
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 400 }}>
                <DataGrid
                  rows={phoneCalls}
                  columns={phoneCallsColumns}
                  sortModel={phoneCallsSortModel}
                  onSortModelChange={setPhoneCallsSortModel}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  disableRowSelectionOnClick
                  density="compact"
                />
              </Box>
            )}
          </TabPanel>
        </DialogContent>
      </Dialog>

      {/* Add Phone Call Dialog */}
      <Dialog open={addPhoneCallOpen} onClose={handleCloseAddPhoneCall} maxWidth="sm" fullWidth>
        <DialogTitle>{t('ADD_PHONE_CALL')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{t('CALL_TYPE')}</InputLabel>
              <Select
                value={phoneCallFormData.callType}
                label={t('CALL_TYPE')}
                onChange={(e) => setPhoneCallFormData({ ...phoneCallFormData, callType: e.target.value as number })}
              >
                <MenuItem value={0}>{t('CALL_TYPE_INBOUND')}</MenuItem>
                <MenuItem value={1}>{t('CALL_TYPE_OUTBOUND')}</MenuItem>
                <MenuItem value={2}>{t('CALL_TYPE_MISSED')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('DURATION')}
              type="number"
              value={phoneCallFormData.durationMinutes || ''}
              onChange={(e) => setPhoneCallFormData({
                ...phoneCallFormData,
                durationMinutes: e.target.value ? parseInt(e.target.value) : undefined,
              })}
              fullWidth
            />
            <TextField
              label={t('NOTES')}
              value={phoneCallFormData.notes || ''}
              onChange={(e) => setPhoneCallFormData({ ...phoneCallFormData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            {phoneCallError && (
              <Alert severity="error">{phoneCallError}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddPhoneCall}>{t('CANCEL')}</Button>
          <Button onClick={handleCreatePhoneCall} variant="contained" disabled={phoneCallFormLoading}>
            {phoneCallFormLoading ? <CircularProgress size={20} /> : t('SAVE')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>{t('DELETE_CUSTOMER')}</DialogTitle>
        <DialogContent>
          <Typography>{t('CONFIRM_DELETE_CUSTOMER')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {customer?.fullName} ({customer?.email})
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>{t('CANCEL')}</Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={20} /> : t('DELETE_CUSTOMER')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
