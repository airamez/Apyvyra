import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
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
  Pagination,
  Divider,
  Grid
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { productService, type ProductDocument, type CreateProductData, type DocumentType } from '../services/productService';
import { categoryService } from '../services/categoryService';

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
  shortDescription?: string;
  categoryId?: number;
  categoryName?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  brand?: string;
  manufacturer?: string;
  isActive: boolean;
  documents?: ProductDocument[];
}


export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newDocuments, setNewDocuments] = useState<{ url: string; type: DocumentType }[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<ProductDocument[]>([]);
  const [documentsToDelete, setDocumentsToDelete] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductData>({
    sku: '',
    name: '',
    description: '',
    shortDescription: '',
    categoryId: undefined,
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 10,
    brand: '',
    manufacturer: '',
    isActive: true
  });
  // UI state for two-column layout
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
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
    setNewDocuments([]);
    setExistingDocuments([]);
    setDocumentsToDelete([]);
    setFormData({
      sku: '',
      name: '',
      description: '',
      shortDescription: '',
      categoryId: undefined,
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 10,
      brand: '',
      manufacturer: '',
      isActive: true
    });
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewDocuments([]);
    setExistingDocuments(product.documents || []);
    setDocumentsToDelete([]);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      categoryId: product.categoryId,
      price: product.price,
      costPrice: product.costPrice || 0,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold || 10,
      brand: product.brand || '',
      manufacturer: product.manufacturer || '',
      isActive: product.isActive
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setNewDocuments([]);
    setExistingDocuments([]);
    setDocumentsToDelete([]);
    setError(null);
  };

  const handleFormChange = (field: keyof CreateProductData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUrlChange = (index: number, value: string) => {
    const updated = [...newDocuments];
    updated[index] = { ...updated[index], url: value };
    setNewDocuments(updated);
  };

  const handleDocumentTypeChange = (index: number, value: DocumentType) => {
    const updated = [...newDocuments];
    updated[index] = { ...updated[index], type: value };
    setNewDocuments(updated);
  };

  const handleAddDocument = () => {
    setNewDocuments([...newDocuments, { url: '', type: 'image' }]);
  };

  const handleRemoveDocument = (index: number) => {
    setNewDocuments(newDocuments.filter((_, i) => i !== index));
  };

  const handleDeleteExistingDocument = (documentId: number) => {
    setDocumentsToDelete([...documentsToDelete, documentId]);
    setExistingDocuments(existingDocuments.filter(doc => doc.id !== documentId));
  };

  const handleSubmit = async () => {
    try {
      let productId: number;

      if (editingProduct) {
        // Update existing product
        const updatedProduct = await productService.update(editingProduct.id, formData);
        setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct as any : p));
        productId = editingProduct.id;

        // Delete documents marked for deletion
        if (documentsToDelete.length > 0) {
          try {
            for (const documentId of documentsToDelete) {
              await productService.deleteDocument(documentId);
            }
          } catch (docErr) {
            console.error('Error deleting product documents:', docErr);
          }
        }
      } else {
        // Create new product
        const newProduct = await productService.create(formData);
        setProducts([...products, newProduct as any]);
        productId = newProduct.id;
      }

      // Add new documents if URLs are provided
      const validDocuments = newDocuments.filter(doc => doc.url.trim());
      if (validDocuments.length > 0) {
        try {
          const startDisplayOrder = existingDocuments.length;
          const hasPrimaryDocument = existingDocuments.some(doc => doc.isPrimary);
          for (let i = 0; i < validDocuments.length; i++) {
            await productService.addDocument(productId, {
              documentUrl: validDocuments[i].url.trim(),
              documentType: validDocuments[i].type,
              altText: formData.name,
              displayOrder: startDisplayOrder + i,
              isPrimary: !hasPrimaryDocument && i === 0,
              userId: undefined
            });
          }
        } catch (docErr) {
          console.error('Error adding product documents:', docErr);
        }
      }

      setShowForm(false);
      setEditingProduct(null);
      setNewDocuments([]);
      setExistingDocuments([]);
      setDocumentsToDelete([]);
      setError(null);

      // Reload products to get updated document data
      await loadProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product');
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

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Product Inventory</Typography>
            <Chip label={`${products.length} items`} color="primary" />
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
            <>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          {product.shortDescription && (
                            <Typography variant="caption" color="text.secondary">
                              {product.shortDescription}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{product.categoryName || '-'}</TableCell>
                        <TableCell>{product.brand || '-'}</TableCell>
                        <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={product.stockQuantity}
                            color={product.stockQuantity > 10 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={product.isActive ? 'Active' : 'Inactive'}
                            color={product.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditProduct(product)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={Math.ceil(products.length / rowsPerPage)}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Form (Add/Edit) as Dialog */}
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid size={6}>
              <TextField
                label="SKU"
                fullWidth
                required
                value={formData.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Product Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.categoryId ?? ''}
                  onChange={(e) => handleFormChange('categoryId', !e.target.value ? undefined : Number(e.target.value))}
                  displayEmpty
                  variant="outlined"
                  renderValue={selected => {
                    if (!selected) return <em>Category</em>;
                    const cat = categories.find(c => c.id === selected);
                    return cat ? cat.name : '';
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Category</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TextField
                label="Brand"
                fullWidth
                value={formData.brand}
                onChange={(e) => handleFormChange('brand', e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Short Description"
                fullWidth
                value={formData.shortDescription}
                onChange={(e) => handleFormChange('shortDescription', e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Full Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>

            {/* Pricing */}
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Pricing</Typography>
            </Grid>
            <Grid size={6}>
              <TextField
                label="Price"
                fullWidth
                required
                type="number"
                value={formData.price}
                onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '$' }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Cost Price"
                fullWidth
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleFormChange('costPrice', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '$' }}
                variant="outlined"
                size="small"
              />
            </Grid>

            {/* Inventory */}
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Inventory</Typography>
            </Grid>
            <Grid size={6}>
              <TextField
                label="Stock Quantity"
                fullWidth
                required
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleFormChange('stockQuantity', parseInt(e.target.value) || 0)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Low Stock Threshold"
                fullWidth
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => handleFormChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                variant="outlined"
                size="small"
              />
            </Grid>

            {/* Additional Info */}
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Additional Information</Typography>
            </Grid>
            <Grid size={6}>
              <TextField
                label="Manufacturer"
                fullWidth
                value={formData.manufacturer}
                onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  />
                }
                label="Active"
                sx={{ ml: 0, mt: 0.5 }}
              />
            </Grid>

            {/* Product Documents */}
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Product Documents
              </Typography>
              {/* Existing Documents */}
              {existingDocuments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Current Documents:
                  </Typography>
                  <Grid container spacing={1}>
                    {existingDocuments.map((doc) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={doc.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          {doc.documentType === 'image' && (
                            <Box
                              component="img"
                              src={doc.documentUrl}
                              alt={doc.altText || 'Product image'}
                              sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                              <Chip
                                label={doc.documentType}
                                size="small"
                                color={doc.documentType === 'image' ? 'info' : doc.documentType === 'video' ? 'secondary' : 'default'}
                              />
                              {doc.isPrimary && (
                                <Chip label="Primary" size="small" color="primary" />
                              )}
                            </Box>
                            <Typography variant="body2" noWrap title={doc.documentUrl}>
                              {doc.documentUrl}
                            </Typography>
                          </Box>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteExistingDocument(doc.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              {/* New Documents */}
              {newDocuments.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    New Documents:
                  </Typography>
                  {newDocuments.map((doc, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={doc.type}
                          onChange={(e) => handleDocumentTypeChange(index, e.target.value as DocumentType)}
                        >
                          <MenuItem value="image">Image</MenuItem>
                          <MenuItem value="video">Video</MenuItem>
                          <MenuItem value="manual">Manual</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Document URL"
                        fullWidth
                        value={doc.url}
                        onChange={(e) => handleDocumentUrlChange(index, e.target.value)}
                        placeholder="https://example.com/document"
                        size="small"
                        autoFocus
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveDocument(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddDocument}
                variant="outlined"
                size="small"
              >
                Add Document
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.sku || !formData.name || formData.price <= 0}
          >
            {editingProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

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
