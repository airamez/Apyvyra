import { useState, useEffect } from 'react';
import { 
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Alert, Card, CardContent 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { categoryService, type CategoryFilters } from '../services/categoryService';

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
  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    isActive: undefined,
  });

  const loadCategories = async (appliedFilters?: CategoryFilters) => {
    try {
      const response = await categoryService.getAll(appliedFilters);
      setCategories(response.data);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (err) {
      setError('Failed to load categories');
    }
  };

  const handleSearch = () => {
    const cleanFilters: CategoryFilters = {};
    if (filters.search?.trim()) cleanFilters.search = filters.search.trim();
    if (filters.isActive !== undefined) cleanFilters.isActive = filters.isActive;
    
    loadCategories(cleanFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      isActive: undefined,
    });
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
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Product Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Add Category</Button>
      </Box>
      
      {hasMoreRecords && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Showing {categories.length} of {totalCount} results. Please refine your filters to narrow down the search for better results.
        </Alert>
      )}
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Search Filters</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="Search (Name, Description)"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterAltOffIcon />}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.description}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpen(cat)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => handleDelete(cat.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
    </Box>
  );
}
