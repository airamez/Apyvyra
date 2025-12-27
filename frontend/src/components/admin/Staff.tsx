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

export default function Staff() {
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
      setError('Failed to load staff. Please try again.');
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
      setError('Email and Full Name are required');
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      await staffService.create(formData);
      setSuccessMessage('Staff member added successfully. An invitation email has been sent.');
      handleCloseAddDialog();
      await loadStaff();
      setTimeout(() => setSuccessMessage(null), 5000);
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
      setError('Full Name is required');
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      await staffService.update(selectedStaff.id, editFormData);
      setSuccessMessage('Staff member updated successfully.');
      handleCloseEditDialog();
      await loadStaff();
      setTimeout(() => setSuccessMessage(null), 5000);
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
      setSuccessMessage('Staff member deleted successfully.');
      handleCloseDeleteDialog();
      await loadStaff();
      setTimeout(() => setSuccessMessage(null), 5000);
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
      setTimeout(() => setSuccessMessage(null), 5000);
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
      headerName: 'Full Name',
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
      headerName: 'Confirmed At',
      width: 180,
      valueGetter: (value: string | null) => 
        value ? new Date(value).toLocaleString() : 'Not confirmed',
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (value: string) => new Date(value).toLocaleString(),
    },
    {
      field: 'createdByName',
      headerName: 'Created By',
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
            <Tooltip title="Resend Invitation">
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
            Staff
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenAddDialog}>
          Add Staff
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
            <Typography variant="h6">Staff Members</Typography>
            <Chip label={`${staff.length} staff`} color="primary" />
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : staff.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No staff members found. Start by adding your first staff member.
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
        <DialogTitle>Add New Staff Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the staff member's details. They will receive an invitation email to set up their password.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            type="text"
            fullWidth
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} disabled={formLoading}>Cancel</Button>
          <Button onClick={handleAddStaff} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : 'Add & Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff Member</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            disabled
            value={selectedStaff?.email || ''}
            sx={{ mb: 2 }}
          />
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            type="text"
            fullWidth
            required
            value={editFormData.fullName}
            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              value={editFormData.status}
              label="Status"
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as number })}
            >
              <MenuItem value={0}>Pending Confirmation</MenuItem>
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={2}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={formLoading}>Cancel</Button>
          <Button onClick={handleUpdateStaff} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Staff Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedStaff?.fullName || selectedStaff?.email}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={formLoading}>Cancel</Button>
          <Button onClick={handleDeleteStaff} color="error" variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
