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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import { DataGrid, type GridRenderCellParams } from '@mui/x-data-grid';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import SearchIcon from '@mui/icons-material/Search';
import { productService, type ProductUrl, type CreateProductData, type UrlType, type ProductFilters } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductForm from './ProductForm';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoryId: undefined,
    brand: '',
    manufacturer: '',
    isActive: undefined,
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProducts = async (appliedFilters?: ProductFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getAll(appliedFilters);
      setProducts(response.data);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Clean up filters - remove empty strings and undefined values
    const cleanFilters: ProductFilters = {};
    if (filters.search?.trim()) cleanFilters.search = filters.search.trim();
    if (filters.categoryId) cleanFilters.categoryId = filters.categoryId;
    if (filters.brand?.trim()) cleanFilters.brand = filters.brand.trim();
    if (filters.manufacturer?.trim()) cleanFilters.manufacturer = filters.manufacturer.trim();
    if (filters.isActive !== undefined) cleanFilters.isActive = filters.isActive;
    
    loadProducts(cleanFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categoryId: undefined,
      brand: '',
      manufacturer: '',
      isActive: undefined,
    });
    loadProducts();
  };

  const handleFilterChange = (field: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
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
      setError('Failed to delete product');
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Products
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenForm}>
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Search Filters</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search (Name, SKU, Description)"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.categoryId || ''}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                label="Brand"
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                  onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                  Clear Filters
                </Button>
                {hasMoreRecords && (
                  <Alert severity="warning" sx={{ ml: 2, py: 0.5, flexGrow: 1 }}>
                    Showing {products.length} of {totalCount} results. Please refine your filters.
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Product Inventory</Typography>
            <Chip label={`${products.length} products`} color="primary" />
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No products found. Start by adding your first product.
            </Typography>
          ) : (
            <Box sx={{ width: '100%', mt: 2 }}>
              <DataGrid
                rows={products}
                columns={[
                  {
                    field: 'sku',
                    headerName: 'SKU',
                    width: 120,
                  },
                  {
                    field: 'name',
                    headerName: 'Name',
                    flex: 1,
                    minWidth: 200,
                  },
                  {
                    field: 'categoryName',
                    headerName: 'Category',
                    width: 150,
                    valueGetter: (value) => value || '-',
                  },
                  {
                    field: 'brand',
                    headerName: 'Brand',
                    width: 130,
                    valueGetter: (value) => value || '-',
                  },
                  {
                    field: 'price',
                    headerName: 'Price',
                    width: 120,
                    type: 'number',
                    renderCell: (params: GridRenderCellParams) => (
                      <Typography>${params.row.price.toFixed(2)}</Typography>
                    ),
                  },
                  {
                    field: 'stockQuantity',
                    headerName: 'Stock',
                    width: 100,
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
                    field: 'isActive',
                    headerName: 'Status',
                    width: 120,
                    type: 'boolean',
                    renderCell: (params: GridRenderCellParams) => (
                      <Chip
                        label={params.row.isActive ? 'Active' : 'Inactive'}
                        color={params.row.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    ),
                  },
                  {
                    field: 'actions',
                    headerName: 'Actions',
                    width: 120,
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
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
                disableColumnFilter
                autoHeight
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
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
        categories={categories}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
