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
  Grid,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { productService } from '../services/productService';
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
  categoryName?: string;
  price: number;
  costQuantity: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  brand?: string;
  manufacturer?: string;
  isActive: boolean;
}

interface CreateProductData {
  sku: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId?: number;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  skuBarcode?: string;
  brand?: string;
  manufacturer?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  isActive: boolean;
  userId?: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      await productService.delete(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const handleOpenDialog = () => {
    setEditingProduct(null);
    setImageUrls(['']);
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
    setOpenDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setImageUrls(['']);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      categoryId: (product as any).categoryId,
      price: product.price,
      costPrice: product.costQuantity || 0,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold || 10,
      brand: product.brand || '',
      manufacturer: product.manufacturer || '',
      isActive: product.isActive
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleFormChange = (field: keyof CreateProductData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleRemoveImageUrl = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    try {
      let productId: number;
      
      if (editingProduct) {
        // Update existing product
        const updatedProduct = await productService.update(editingProduct.id, formData);
        setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct as any : p));
        productId = editingProduct.id;
      } else {
        // Create new product
        const newProduct = await productService.create(formData);
        setProducts([...products, newProduct as any]);
        productId = newProduct.id;
      }

      // Add images if URLs are provided
      const validImageUrls = imageUrls.filter(url => url.trim());
      if (validImageUrls.length > 0) {
        try {
          for (let i = 0; i < validImageUrls.length; i++) {
            await productService.addImage(productId, {
              imageUrl: validImageUrls[i].trim(),
              altText: formData.name,
              displayOrder: i,
              isPrimary: i === 0,
              userId: undefined
            });
          }
        } catch (imgErr) {
          console.error('Error adding product images:', imgErr);
          // Don't fail the whole operation if image add fails
        }
      }

      setOpenDialog(false);
      setEditingProduct(null);
      setImageUrls(['']);
      setError(null);
      
      // Reload products to get updated image data
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
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
                  {products.map((product) => (
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
                          onClick={() => handleDelete(product.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Row 1: SKU and Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="SKU"
                fullWidth
                required
                value={formData.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Product Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </Grid>

            {/* Row 2: Category and Brand */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId ?? ''}
                  label="Category"
                  onChange={(e) => handleFormChange('categoryId', e.target.value === '' ? undefined : Number(e.target.value))}
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Brand"
                fullWidth
                value={formData.brand}
                onChange={(e) => handleFormChange('brand', e.target.value)}
              />
            </Grid>

            {/* Row 3: Short Description */}
            <Grid item xs={12}>
              <TextField
                label="Short Description"
                fullWidth
                value={formData.shortDescription}
                onChange={(e) => handleFormChange('shortDescription', e.target.value)}
              />
            </Grid>

            {/* Row 4: Full Description */}
            <Grid item xs={12}>
              <TextField
                label="Full Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </Grid>

            {/* Row 5: Price and Cost Price */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Price"
                fullWidth
                required
                type="number"
                value={formData.price}
                onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cost Price"
                fullWidth
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleFormChange('costPrice', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>

            {/* Row 6: Stock Quantity and Low Stock Threshold */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Stock Quantity"
                fullWidth
                required
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleFormChange('stockQuantity', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Low Stock Threshold"
                fullWidth
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => handleFormChange('lowStockThreshold', parseInt(e.target.value) || 10)}
              />
            </Grid>

            {/* Row 7: Manufacturer */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Manufacturer"
                fullWidth
                value={formData.manufacturer}
                onChange={(e) => handleFormChange('manufacturer', e.target.value)}
              />
            </Grid>

            {/* Row 8: Active Toggle */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>

            {/* Row 9: Product Images */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                Product Images
              </Typography>
              {imageUrls.map((url, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    label={`Image URL ${index + 1}`}
                    fullWidth
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    size="small"
                  />
                  <IconButton 
                    color="error" 
                    onClick={() => handleRemoveImageUrl(index)}
                    disabled={imageUrls.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<AddIcon />} 
                onClick={handleAddImageUrl}
                variant="outlined"
                size="small"
              >
                Add Image URL
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.sku || !formData.name || formData.price <= 0}
          >
            {editingProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
