import { useState, useEffect } from 'react';
import { 
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Tooltip, Alert, Container, Card, CardContent, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Chip 
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { DataGrid, type GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';
import { categoryService } from '../../../services/categoryService';
import FilterComponent, { type FilterValues } from '../FilterComponent';
import { categoryFilterConfig } from '../../../config/filterConfigs';
import { useTranslation } from '../../../hooks/useTranslation';

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  isActive: boolean;
}

export default function Categories() {
  const { t } = useTranslation('Categories');
  const { t: tCommon } = useTranslation('Common');
  
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
      setError(t('FAILED_LOAD_CATEGORIES'));
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
    (document.activeElement as HTMLElement)?.blur();
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', parentCategoryId: '', isActive: true });
    setError('');
  };


  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError(t('NAME_REQUIRED'));
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
      setError(t('FAILED_SAVE_CATEGORY'));
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
      setError(t('FAILED_DELETE_CATEGORY'));
      setDeleteDialog({ open: false, id: null });
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {t('TITLE')}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          {t('ADD_CATEGORY')}
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
                  headerName: t('NAME'),
                  flex: 1,
                  minWidth: 200,
                },
                {
                  field: 'description',
                  headerName: t('DESCRIPTION'),
                  flex: 2,
                  minWidth: 300,
                },
                {
                  field: 'parentCategoryName',
                  headerName: t('PARENT_CATEGORY'),
                  flex: 1,
                  minWidth: 150,
                  renderCell: (params) => params.row?.parentCategoryName || t('NONE'),
                },
                {
                  field: 'isActive',
                  headerName: t('ACTIVE'),
                  width: 80,
                  type: 'boolean',
                  renderCell: (params: GridRenderCellParams) => (
                    <Chip
                      label={params.row.isActive ? t('YES') : t('NO')}
                      color={params.row.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  ),
                },
                {
                  field: 'actions',
                  headerName: t('ACTIONS'),
                  width: 100,
                  sortable: false,
                  filterable: false,
                  renderCell: (params: GridRenderCellParams) => (
                    <Box>
                      <Tooltip title={t('EDIT')}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpen(params.row as ProductCategory)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('DELETE')}>
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('EDIT_CATEGORY') : t('ADD_CATEGORY')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('NAME')}
            type="text"
            fullWidth
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('DESCRIPTION')}
            type="text"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>{t('PARENT_CATEGORY')}</InputLabel>
            <Select
              value={form.parentCategoryId}
              label={t('PARENT_CATEGORY')}
              onChange={(e: SelectChangeEvent) => setForm({ ...form, parentCategoryId: e.target.value })}
            >
              <MenuItem value="">{t('NONE')}</MenuItem>
              {categories
                .filter(cat => cat.id !== editing?.id)
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
              />
            }
            label={t('ACTIVE')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{tCommon('CANCEL')}</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? t('UPDATE') : t('CREATE')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{t('DELETE_CATEGORY')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('DELETE_CONFIRM')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {tCommon('THIS_ACTION_CANNOT_BE_UNDONE')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>{tCommon('CANCEL')}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {tCommon('DELETE')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
