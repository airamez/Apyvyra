import { useState, useEffect } from 'react';
import { 
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Tooltip, Alert, Container, Card, CardContent 
} from '@mui/material';
import { DataGrid, type GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';
import { categoryService } from '../../services/categoryService';
import FilterComponent, { type FilterValues } from '../FilterComponent';
import { categoryFilterConfig } from '../../config/filterConfigs';

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadCategories = async (appliedFilters?: FilterValues) => {
    try {
      const response = await categoryService.getAll(appliedFilters);
      setCategories(response.data);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (err) {
      setError('Failed to load categories');
    }
  };

  const handleSearch = (filters: FilterValues) => {
    loadCategories(filters);
  };

  const handleClearFilters = () => {
    loadCategories();
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpen = (cat?: ProductCategory) => {
    setEditing(cat || null);
    setForm(cat ? { name: cat.name, description: cat.description || '' } : { name: '', description: '' });
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '' });
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      if (editing) {
        await categoryService.update(editing.id, form);
      } else {
        await categoryService.create(form);
      }
      await loadCategories();
      handleClose();
    } catch (err) {
      setError('Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    if (deleteDialog.id == null) return;
    try {
      await categoryService.delete(deleteDialog.id);
      setCategories(categories.filter(c => c.id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: null });
    } catch (err) {
      setError('Failed to delete category');
      setDeleteDialog({ open: false, id: null });
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Product Categories
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <FilterComponent
        config={{
          ...categoryFilterConfig,
          onSearch: handleSearch,
          onClear: handleClearFilters,
        }}
        hasMoreRecords={hasMoreRecords}
        totalCount={totalCount}
        currentCount={categories.length}
      />
      
      <Card>
        <CardContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            <DataGrid
              rows={categories}
              columns={[
                {
                  field: 'name',
                  headerName: 'Name',
                  flex: 1,
                  minWidth: 200,
                },
                {
                  field: 'description',
                  headerName: 'Description',
                  flex: 2,
                  minWidth: 300,
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 120,
                  sortable: false,
                  filterable: false,
                  renderCell: (params: GridRenderCellParams) => (
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpen(params.row as ProductCategory)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(params.row.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ),
                },
              ]}
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
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            fullWidth
            value={form.name}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            value={form.description}
            onChange={handleChange}
          />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this category?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
