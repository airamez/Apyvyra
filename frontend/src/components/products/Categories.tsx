import { useState, useEffect } from 'react';
import { 
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Tooltip, Alert, Container, Card, CardContent, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox 
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
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
  parentCategoryId?: number;
  parentCategoryName?: string;
  isActive: boolean;
}

export default function Categories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parentCategoryId: '', isActive: true });
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCategories = async (appliedFilters?: FilterValues) => {
    try {
      setLoading(true);
      const response = await categoryService.getAll(appliedFilters);
      setCategories(response.data);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
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
    setForm(cat ? { 
      name: cat.name, 
      description: cat.description || '',
      parentCategoryId: cat.parentCategoryId?.toString() || '',
      isActive: cat.isActive
    } : { name: '', description: '', parentCategoryId: '', isActive: true });
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', parentCategoryId: '', isActive: true });
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      const data = {
        name: form.name,
        description: form.description || undefined,
        parentCategoryId: form.parentCategoryId ? parseInt(form.parentCategoryId) : undefined,
        isActive: form.isActive
      };
      if (editing) {
        await categoryService.update(editing.id, data);
      } else {
        await categoryService.create(data);
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
                  field: 'parentCategoryName',
                  headerName: 'Parent Category',
                  flex: 1,
                  minWidth: 150,
                  renderCell: (params) => params.row?.parentCategoryName || 'None',
                },
                {
                  field: 'isActive',
                  headerName: 'Active',
                  width: 80,
                  type: 'boolean',
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
          <FormControl fullWidth margin="dense">
            <InputLabel>Parent Category</InputLabel>
            <Select
              name="parentCategoryId"
              value={form.parentCategoryId}
              onChange={handleChange}
              label="Parent Category"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {categories
                .filter(cat => !editing || cat.id !== editing.id) // Don't allow self-reference
                .map(cat => (
                <MenuItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                name="isActive"
              />
            }
            label="Active"
            sx={{ mt: 1 }}
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
