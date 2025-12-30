import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterComponent, { type FilterValues } from './FilterComponent';
import { userService, type UserList } from '../../services/userService';

export default function Customers() {
  const [customers, setCustomers] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (appliedFilters?: FilterValues) => {
    try {
      setLoading(true);
      setError(null);
      
      // Always filter for customers (userType = 2)
      const filters = { userType: 2, ...appliedFilters };
      const response = await userService.getAll(filters);
      setCustomers(response.data || []);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: FilterValues) => {
    loadCustomers(filters);
  };

  const handleClearFilters = () => {
    loadCustomers();
  };

  const getUserTypeLabel = (userType: number): string => {
    switch (userType) {
      case 0: return 'Admin';
      case 1: return 'Staff';
      case 2: return 'Customer';
      default: return 'Unknown';
    }
  };

  const getUserTypeColor = (userType: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (userType) {
      case 0: return 'error';
      case 1: return 'info';
      case 2: return 'success';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'userType',
      headerName: 'User Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getUserTypeLabel(params.row.userType)}
          color={getUserTypeColor(params.row.userType)}
          size="small"
        />
      ),
    },
  ];

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Customers
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => loadCustomers()}
          disabled={loading}
          sx={{ minWidth: '120px' }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <FilterComponent
        config={{
          fields: [
            {
              name: 'username',
              label: 'Username',
              type: 'string',
              operators: ['contains', 'eq', 'startsWith'],
              defaultOperator: 'contains',
              placeholder: 'Search by username...',
            },
            {
              name: 'email',
              label: 'Email',
              type: 'string',
              operators: ['contains', 'eq', 'startsWith'],
              defaultOperator: 'contains',
              placeholder: 'Search by email...',
            },
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
            <Typography variant="h6">Customer List</Typography>
            <Chip label={`${customers.length} customers`} color="primary" />
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : customers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No customers found. Customers will appear here once they register on the platform.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={customers}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
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
                border: 'none',
              }}
            />
          </Box>
        )}
      </Box>
    </Container>
  );
}
