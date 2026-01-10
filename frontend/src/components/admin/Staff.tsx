import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { DataGrid, type GridRenderCellParams } from '@mui/x-data-grid';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { staffService, type Staff as StaffType, type CreateStaffData, type UpdateStaffData } from '../../services/staffService';
import FilterComponent, { type FilterValues } from './FilterComponent';
import { staffFilterConfig } from '../../config/filterConfigs';
import { useTranslation } from '../../hooks/useTranslation';
import { useFormatting } from '../../hooks/useFormatting';

export default function Staff() {
  const { t } = useTranslation('Staff');
  const { t: tCommon } = useTranslation('Common');
  const { formatDate } = useFormatting();
  
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateStaffData>({ email: '', fullName: '' });
  const [editFormData, setEditFormData] = useState<UpdateStaffData>({ fullName: '', status: 0 });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async (appliedFilters?: FilterValues) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert FilterValues to query params
      const filters: Record<string, any> = {};
      if (appliedFilters) {
        appliedFilters.forEach(filter => {
          if (filter.operator === 'between' && filter.valueTo) {
            filters[`${filter.field}_from`] = filter.value;
            filters[`${filter.field}_to`] = filter.valueTo;
          } else if (filter.operator === 'contains') {
            filters[filter.field] = filter.value;
          } else if (filter.operator === 'eq') {
            filters[filter.field] = filter.value;
          } else {
            filters[`${filter.field}_${filter.operator}`] = filter.value;
          }
        });
      }
      
      const response = await staffService.getAll(filters);
      setStaff(response.data);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(t('FAILED_LOAD_STAFF'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: FilterValues) => {
    loadStaff(filters);
  };

  const handleClearFilters = () => {
    loadStaff();
  };

  // Add Staff
  const handleOpenAddDialog = () => {
    setFormData({ email: '', fullName: '' });
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setFormData({ email: '', fullName: '' });
    setError(null);
  };

  const handleAddStaff = async () => {
    if (!formData.email.trim() || !formData.fullName.trim()) {
      setError(t('EMAIL_FULLNAME_REQUIRED'));
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      await staffService.create(formData);
      setSuccessMessage(t('ADD_SUCCESS'));
      handleCloseAddDialog();
      await loadStaff();
          } catch (err: any) {
      setError(err.message || 'Failed to add staff member');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Staff
  const handleOpenEditDialog = (staffMember: StaffType) => {
    setSelectedStaff(staffMember);
    setEditFormData({ fullName: staffMember.fullName || '', status: staffMember.status });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedStaff(null);
    setEditFormData({ fullName: '', status: 0 });
    setError(null);
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff || !editFormData.fullName.trim()) {
      setError(t('FULLNAME_REQUIRED'));
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      await staffService.update(selectedStaff.id, editFormData);
      setSuccessMessage(t('UPDATE_SUCCESS'));
      handleCloseEditDialog();
      await loadStaff();
          } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Staff
  const handleOpenDeleteDialog = (staffMember: StaffType) => {
    setSelectedStaff(staffMember);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedStaff(null);
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      setFormLoading(true);
      await staffService.delete(selectedStaff.id);
      setSuccessMessage(t('DELETE_SUCCESS'));
      handleCloseDeleteDialog();
      await loadStaff();
          } catch (err: any) {
      setError(err.message || 'Failed to delete staff member');
    } finally {
      setFormLoading(false);
    }
  };

  // Resend Invitation
  const handleResendInvitation = async (staffMember: StaffType) => {
    try {
      setError(null);
      await staffService.resendInvitation(staffMember.id);
      setSuccessMessage(`Invitation email resent to ${staffMember.email}`);
          } catch (err: any) {
      setError(err.message || 'Failed to resend invitation');
    }
  };

  const getStatusColor = (status: number): 'warning' | 'success' | 'default' => {
    switch (status) {
      case 0: return 'warning';
      case 1: return 'success';
      case 2: return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      field: 'fullName',
      headerName: t('FULL_NAME'),
      flex: 1,
      minWidth: 150,
      valueGetter: (value: string | null) => value || '-',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'statusName',
      headerName: 'Status',
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
      field: 'emailConfirmedAt',
      headerName: t('CONFIRMED_AT'),
      width: 180,
      valueGetter: (value: string | null) => 
        value ? formatDate(value) : tCommon('NOT_CONFIRMED'),
    },
    {
      field: 'createdAt',
      headerName: t('CREATED_AT'),
      width: 180,
      valueGetter: (value: string) => formatDate(value),
    },
    {
      field: 'createdByName',
      headerName: t('CREATED_BY'),
      width: 150,
      valueGetter: (value: string | null) => value || '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEditDialog(params.row as StaffType)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 0 && (
            <Tooltip title={t('RESEND_INVITATION')}>
              <IconButton
                size="small"
                color="info"
                onClick={() => handleResendInvitation(params.row as StaffType)}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleOpenDeleteDialog(params.row as StaffType)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BadgeIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {t('TITLE')}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenAddDialog}>
          {t('ADD_STAFF')}
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
        config={{
          ...staffFilterConfig,
          onSearch: handleSearch,
          onClear: handleClearFilters,
        }}
        hasMoreRecords={hasMoreRecords}
        totalCount={totalCount}
        currentCount={staff.length}
      />

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{t('STAFF_MEMBERS')}</Typography>
            <Chip label={`${staff.length} ${t('STAFF_COUNT')}`} color="primary" />
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : staff.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('NO_STAFF')}
            </Typography>
          ) : (
            <Box sx={{ width: '100%', mt: 2 }}>
              <DataGrid
                rows={staff}
                columns={columns}
                loading={loading}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableColumnFilter
                disableRowSelectionOnClick
                autoHeight
                density="compact"
                sx={{
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '36px !important',
                    maxHeight: '36px !important',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    minHeight: '40px !important',
                    maxHeight: '40px !important',
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('ADD_DIALOG_TITLE')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('ADD_DIALOG_MESSAGE')}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t('FULL_NAME')}
            type="text"
            fullWidth
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('EMAIL_ADDRESS')}
            type="email"
            fullWidth
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} disabled={formLoading}>{tCommon('CANCEL')}</Button>
          <Button onClick={handleAddStaff} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : t('ADD_SEND_INVITATION')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('EDIT_DIALOG_TITLE')}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label={t('EMAIL_ADDRESS')}
            type="email"
            fullWidth
            disabled
            value={selectedStaff?.email || ''}
            sx={{ mb: 2 }}
          />
          <TextField
            autoFocus
            margin="dense"
            label={t('FULL_NAME')}
            type="text"
            fullWidth
            required
            value={editFormData.fullName}
            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>{t('STATUS')}</InputLabel>
            <Select
              value={editFormData.status}
              label={t('STATUS')}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as number })}
            >
              <MenuItem value={0}>{t('PENDING_CONFIRMATION')}</MenuItem>
              <MenuItem value={1}>{t('ACTIVE')}</MenuItem>
              <MenuItem value={2}>{t('INACTIVE')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={formLoading}>{tCommon('CANCEL')}</Button>
          <Button onClick={handleUpdateStaff} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : t('SAVE_CHANGES')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('DELETE_DIALOG_TITLE')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('DELETE_CONFIRM', { name: selectedStaff?.fullName || selectedStaff?.email || '' })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {tCommon('THIS_ACTION_CANNOT_BE_UNDONE')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={formLoading}>{tCommon('CANCEL')}</Button>
          <Button onClick={handleDeleteStaff} color="error" variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : tCommon('DELETE')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
