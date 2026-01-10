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
} from '@mui/material';
import { DataGrid, type GridRenderCellParams } from '@mui/x-data-grid';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { productService, type ProductUrl, type CreateProductData, type UrlType } from '../../../services/productService';
import ProductForm from './ProductForm';
import FilterComponent, { type FilterValues } from '../FilterComponent';
import { productFilterConfig } from '../../../config/filterConfigs';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFormatting } from '../../../hooks/useFormatting';

interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  brand?: string;
  manufacturer?: string;
  weight?: string;
  dimensions?: string;
  isActive: boolean;
  urls?: ProductUrl[];
}

export default function Products() {
  const { t } = useTranslation('Products');
  const { formatCurrencyWithSymbol } = useFormatting();
  const { t: tCommon } = useTranslation('Common');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (appliedFilters?: FilterValues) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getAll(appliedFilters);
      setProducts(response.data);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('FAILED_LOAD_PRODUCTS'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: FilterValues) => {
    loadProducts(filters);
  };

  const handleClearFilters = () => {
    loadProducts();
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await productService.delete(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(t('FAILED_DELETE_PRODUCT'));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleOpenForm = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setError(null);
  };

  const handleFormSubmit = async (formData: CreateProductData, newUrls: { url: string; type: UrlType }[], urlsToDelete: number[]) => {
    try {
      const normalizedData = {
        ...formData,
        price: formData.price ?? 0,
        costPrice: formData.costPrice ?? 0,
        stockQuantity: formData.stockQuantity ?? 0,
        lowStockThreshold: formData.lowStockThreshold ?? 10,
      };

      let productId: number;

      if (editingProduct) {
        const updatedProduct = await productService.update(editingProduct.id, normalizedData);
        setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct as any : p));
        productId = editingProduct.id;

        if (urlsToDelete.length > 0) {
          try {
            for (const urlId of urlsToDelete) {
              await productService.deleteUrl(urlId);
            }
          } catch (urlErr) {
            console.error('Error deleting product URLs:', urlErr);
          }
        }
      } else {
        const newProduct = await productService.create(normalizedData);
        setProducts([...products, newProduct as any]);
        productId = newProduct.id;
      }

      const validUrls = newUrls.filter(url => url.url.trim());
      if (validUrls.length > 0) {
        try {
          const existingUrls = editingProduct?.urls || [];
          const startDisplayOrder = existingUrls.length;
          const hasPrimaryUrl = existingUrls.some(url => url.isPrimary);
          for (let i = 0; i < validUrls.length; i++) {
            await productService.addUrl(productId, {
              url: validUrls[i].url.trim(),
              urlType: validUrls[i].type,
              altText: formData.name,
              displayOrder: startDisplayOrder + i,
              isPrimary: !hasPrimaryUrl && i === 0,
              userId: undefined
            });
          }
        } catch (urlErr) {
          console.error('Error adding product URLs:', urlErr);
        }
      }

      setShowForm(false);
      setEditingProduct(null);
      setError(null);
      await loadProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product');
      throw err;
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {t('TITLE')}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenForm}>
          {t('ADD_PRODUCT')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <FilterComponent
        config={{
          ...productFilterConfig,
          onSearch: handleSearch,
          onClear: handleClearFilters,
        }}
        hasMoreRecords={hasMoreRecords}
        totalCount={totalCount}
        currentCount={products.length}
      />

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{t('PRODUCT_INVENTORY')}</Typography>
            <Chip label={`${products.length} ${t('PRODUCT_COUNT')}`} color="primary" />
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('NO_PRODUCTS')}
            </Typography>
          ) : (
            <Box sx={{ width: '100%', mt: 2 }}>
              <DataGrid
                rows={products}
                columns={[
                  {
                    field: 'sku',
                    headerName: t('SKU'),
                    width: 100,
                  },
                  {
                    field: 'name',
                    headerName: t('NAME'),
                    flex: 1,
                    minWidth: 180,
                  },
                  {
                    field: 'categoryName',
                    headerName: t('CATEGORY'),
                    width: 120,
                    valueGetter: (value) => value || '-',
                  },
                  {
                    field: 'brand',
                    headerName: t('BRAND'),
                    width: 110,
                    valueGetter: (value) => value || '-',
                  },
                  {
                    field: 'manufacturer',
                    headerName: t('MANUFACTURER'),
                    width: 130,
                    valueGetter: (value) => value || '-',
                  },
                  {
                    field: 'price',
                    headerName: t('PRICE'),
                    width: 100,
                    type: 'number',
                    renderCell: (params: GridRenderCellParams) => (
                      <Typography>{formatCurrencyWithSymbol(params.row.price)}</Typography>
                    ),
                  },
                  {
                    field: 'taxRate',
                    headerName: t('TAX_RATE'),
                    width: 90,
                    type: 'number',
                    valueGetter: (value) => value || 0,
                    renderCell: (params: GridRenderCellParams) => (
                      <Typography>{params.row.taxRate ? `${params.row.taxRate}%` : '-'}</Typography>
                    ),
                  },
                  {
                    field: 'stockQuantity',
                    headerName: t('STOCK'),
                    width: 80,
                    type: 'number',
                    renderCell: (params: GridRenderCellParams) => (
                      <Chip
                        label={params.row.stockQuantity}
                        color={params.row.stockQuantity > 10 ? 'success' : 'warning'}
                        size="small"
                      />
                    ),
                  },
                  {
                    field: 'lowStockThreshold',
                    headerName: t('LOW_STOCK_THRESHOLD'),
                    width: 130,
                    type: 'number',
                    valueGetter: (value) => value || 0,
                  },
                  {
                    field: 'isActive',
                    headerName: t('STATUS'),
                    width: 100,
                    type: 'boolean',
                    renderCell: (params: GridRenderCellParams) => (
                      <Chip
                        label={params.row.isActive ? t('ACTIVE') : t('INACTIVE')}
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
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditProduct(params.row as Product)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(params.row as Product)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
          )}
        </CardContent>
      </Card>

      {/* Product Form Component */}
      <ProductForm
        open={showForm}
        editingProduct={editingProduct}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>{t('DELETE_DIALOG_TITLE')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('DELETE_CONFIRM', { name: productToDelete?.name || '' })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {tCommon('THIS_ACTION_CANNOT_BE_UNDONE')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{tCommon('CANCEL')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {tCommon('DELETE')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
