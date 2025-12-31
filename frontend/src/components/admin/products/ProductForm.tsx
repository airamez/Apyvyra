import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Grid,
  IconButton,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import { DataGrid, type GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { type CreateProductData, type ProductUrl, type UrlType, productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import ProductUrlDialog from './ProductUrlDialog';
import { useTranslation } from '../../../hooks/useTranslation';

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  price: number;
  costPrice?: number;
  taxRate?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  brand?: string;
  manufacturer?: string;
  weight?: string;
  dimensions?: string;
  isActive: boolean;
  urls?: ProductUrl[];
}

interface ProductFormProps {
  open: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSubmit: (formData: CreateProductData, newUrls: { url: string; type: UrlType }[], urlsToDelete: number[]) => Promise<void>;
}

export default function ProductForm({ open, editingProduct, onClose, onSubmit }: ProductFormProps) {
  const { t } = useTranslation('ProductForm');
  const { t: tCommon } = useTranslation('Common');
  
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [formData, setFormData] = useState<CreateProductData>({
    sku: '',
    name: '',
    description: '',
    categoryId: undefined,
    price: undefined,
    costPrice: undefined,
    taxRate: undefined,
    stockQuantity: undefined,
    lowStockThreshold: undefined,
    brand: '',
    manufacturer: '',
    weight: '',
    dimensions: '',
    isActive: true
  });
  const [newUrls, setNewUrls] = useState<{ url: string; type: UrlType }[]>([]);
  const [existingUrls, setExistingUrls] = useState<ProductUrl[]>([]);
  const [urlsToDelete, setUrlsToDelete] = useState<number[]>([]);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [urlFilter, setUrlFilter] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        sku: editingProduct.sku,
        name: editingProduct.name,
        description: editingProduct.description || '',
        categoryId: editingProduct.categoryId,
        price: editingProduct.price,
        costPrice: editingProduct.costPrice || 0,
        taxRate: editingProduct.taxRate || 0,
        stockQuantity: editingProduct.stockQuantity,
        lowStockThreshold: editingProduct.lowStockThreshold || 10,
        brand: editingProduct.brand || '',
        manufacturer: editingProduct.manufacturer || '',
        weight: editingProduct.weight || '',
        dimensions: editingProduct.dimensions || '',
        isActive: editingProduct.isActive
      });
      loadProductUrls(editingProduct.id);
      setNewUrls([]);
      setUrlsToDelete([]);
    } else {
      setFormData({
        sku: '',
        name: '',
        description: '',
        categoryId: undefined,
        price: undefined,
        costPrice: undefined,
        taxRate: undefined,
        stockQuantity: undefined,
        lowStockThreshold: undefined,
        brand: '',
        manufacturer: '',
        weight: '',
        dimensions: '',
        isActive: true
      });
      setExistingUrls([]);
      setNewUrls([]);
      setUrlsToDelete([]);
    }
    setUrlFilter('');
  }, [editingProduct, open]);

  const loadProductUrls = async (productId: number) => {
    setIsLoadingUrls(true);
    try {
      const urls = await productService.getProductUrls(productId);
      setExistingUrls(urls);
    } catch (error) {
      console.error('Error loading product URLs:', error);
    } finally {
      setIsLoadingUrls(false);
    }
  };

  const handleFormChange = (field: keyof CreateProductData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddUrlClick = () => {
    setUrlDialogOpen(true);
  };

  const handleUrlDialogSubmit = async (url: string, type: UrlType) => {
    if (!editingProduct) return;

    try {
      await productService.addUrl(editingProduct.id, {
        url,
        urlType: type,
        displayOrder: existingUrls.length,
        isPrimary: existingUrls.length === 0,
      });
      await loadProductUrls(editingProduct.id);
    } catch (error) {
      console.error('Error adding URL:', error);
      throw error;
    }
  };

  const handleDeleteUrl = async (urlId: number) => {
    if (!editingProduct) return;

    try {
      await productService.deleteUrl(urlId);
      await loadProductUrls(editingProduct.id);
    } catch (error) {
      console.error('Error deleting URL:', error);
    }
  };

  const handleSubmit = async () => {
    await onSubmit(formData, newUrls, urlsToDelete);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{editingProduct ? 'Edit Product' : 'Add New Product'}</Typography>
            {editingProduct && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  />
                }
                label={t('ACTIVE')}
              />
            )}
          </Box>
        </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={3}>
            <TextField
              label={t('SKU')}
              fullWidth
              required
              value={formData.sku}
              onChange={(e) => handleFormChange('sku', e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid size={9}>
            <TextField
              label={t('PRODUCT_NAME')}
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid size={4}>
            <TextField
              label={t('BRAND')}
              fullWidth
              value={formData.brand}
              onChange={(e) => handleFormChange('brand', e.target.value)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>
          <Grid size={4}>
            <TextField
              label={t('MANUFACTURER')}
              fullWidth
              value={formData.manufacturer}
              onChange={(e) => handleFormChange('manufacturer', e.target.value)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>
          <Grid size={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                label={t('CATEGORY')}
                value={formData.categoryId ?? ''}
                onChange={(e) => handleFormChange('categoryId', !e.target.value ? undefined : Number(e.target.value))}
                variant="outlined"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12}>
            <TextField
              label={t('FULL_DESCRIPTION')}
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>
                    <Grid size={4}>
            <Tooltip title="Maximum 4 decimal places supported">
              <TextField
                label={t('PRICE')}
                fullWidth
                required
                type="text"
                value={formData.price ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleFormChange('price', undefined);
                    return;
                  }
                  if (!/^\d*\.?\d*$/.test(value)) {
                    return;
                  }
                  const parts = value.split('.');
                  if (parts.length === 2 && parts[1].length > 4) {
                    return;
                  }
                  handleFormChange('price', value);
                }}
                onBlur={() => {
                  const value = formData.price;
                  if (value !== undefined && value !== null) {
                    const num = typeof value === 'string' ? parseFloat(value) : value;
                    if (!isNaN(num)) {
                      const rounded = Math.round(num * 10000) / 10000;
                      handleFormChange('price', rounded);
                    }
                  }
                }}
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*\.?[0-9]{0,4]'
                }}
                variant="outlined"
                size="small"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Tooltip>
          </Grid>
          <Grid size={4}>
            <Tooltip title={t('MAX_DECIMAL_PLACES_TOOLTIP')}>
              <TextField
                label={t('COST_PRICE')}
                fullWidth
                type="text"
                value={formData.costPrice ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleFormChange('costPrice', undefined);
                    return;
                  }
                  if (!/^\d*\.?\d*$/.test(value)) {
                    return;
                  }
                  const parts = value.split('.');
                  if (parts.length === 2 && parts[1].length > 4) {
                    return;
                  }
                  handleFormChange('costPrice', value);
                }}
                onBlur={() => {
                  const value = formData.costPrice;
                  if (value !== undefined && value !== null) {
                    const num = typeof value === 'string' ? parseFloat(value) : value;
                    if (!isNaN(num)) {
                      const rounded = Math.round(num * 10000) / 10000;
                      handleFormChange('costPrice', rounded);
                    }
                  }
                }}
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*\.?[0-9]{0,4]'
                }}
                variant="outlined"
                size="small"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Tooltip>
          </Grid>
          <Grid size={4}>
            <Tooltip title="Tax rate as percentage (e.g., 8.25)">
              <TextField
                label={t('TAX_RATE')}
                fullWidth
                type="text"
                value={formData.taxRate ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleFormChange('taxRate', undefined);
                    return;
                  }
                  if (!/^\d*\.?\d*$/.test(value)) {
                    return;
                  }
                  const parts = value.split('.');
                  if (parts.length === 2 && parts[1].length > 2) {
                    return;
                  }
                  handleFormChange('taxRate', value);
                }}
                onBlur={() => {
                  const value = formData.taxRate;
                  if (value !== undefined && value !== null) {
                    const num = typeof value === 'string' ? parseFloat(value) : value;
                    if (!isNaN(num)) {
                      const rounded = Math.round(num * 100) / 100;
                      handleFormChange('taxRate', rounded);
                    }
                  }
                }}
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*\.?[0-9]{0,2}',
                  min: 0,
                  max: 100
                }}
                variant="outlined"
                size="small"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Tooltip>
          </Grid>
                    <Grid size={3}>
            <TextField
              label={t('STOCK')}
              fullWidth
              required
              type="number"
              value={formData.stockQuantity ?? ''}
              onChange={(e) => handleFormChange('stockQuantity', e.target.value === '' ? undefined : parseInt(e.target.value) || 0)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                  display: 'none',
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
              }}
            />
          </Grid>
          <Grid size={3}>
            <TextField
              label={t('LOW_STOCK_THRESHOLD')}
              fullWidth
              type="number"
              value={formData.lowStockThreshold ?? ''}
              onChange={(e) => handleFormChange('lowStockThreshold', e.target.value === '' ? undefined : parseInt(e.target.value) || 10)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                  display: 'none',
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
              }}
            />
          </Grid>
          <Grid size={3}>
            <TextField
              label={t('WEIGHT')}
              fullWidth
              value={formData.weight}
              onChange={(e) => handleFormChange('weight', e.target.value)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>
          <Grid size={3}>
            <TextField
              label={t('DIMENSIONS')}
              fullWidth
              value={formData.dimensions}
              onChange={(e) => handleFormChange('dimensions', e.target.value)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>

          {/* Product URLs Section */}
          <Grid size={12}>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">
                  Product URLs {!editingProduct && '(Save product first to add URLs)'}
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddUrlClick}
                  size="small"
                  variant="contained"
                  disabled={!editingProduct}
                >
                  Add URL
                </Button>
              </Box>
              
              {!editingProduct && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  URLs can only be added after the product is saved.
                </Typography>
              )}

              {editingProduct && (
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={existingUrls}
                    columns={[
                      {
                        field: 'url',
                        headerName: 'URL',
                        flex: 1,
                        minWidth: 200,
                      },
                      {
                        field: 'urlType',
                        headerName: 'Type',
                        width: 120,
                      },
                      {
                        field: 'actions',
                        headerName: 'Actions',
                        width: 100,
                        sortable: false,
                        filterable: false,
                        renderCell: (params: GridRenderCellParams) => (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUrl(params.row.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        ),
                      },
                    ]}
                    loading={isLoadingUrls}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 5 } },
                    }}
                    filterModel={{
                      items: urlFilter
                        ? [
                            {
                              field: 'url',
                              operator: 'contains',
                              value: urlFilter,
                            },
                          ]
                        : [],
                    }}
                    slotProps={{
                      toolbar: {
                        showQuickFilter: true,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
      <ProductUrlDialog
        open={urlDialogOpen}
        onClose={() => setUrlDialogOpen(false)}
        onSubmit={handleUrlDialogSubmit}
      />
    </Dialog>
  );
}
