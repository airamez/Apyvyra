import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Grid,
  Chip,
  InputAdornment,
  Badge,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { productService, type Product } from '../../services/productService';
import { categoryService, type ProductCategory } from '../../services/categoryService';
import { cartService, type CartItem } from '../../services/cartService';

interface StoreProps {
  onViewCart: () => void;
}

export default function Store({ onViewCart }: StoreProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    loadData();
    updateCartCount();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAll({ isActive: true }),
        categoryService.getAll({ isActive: true }),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCartCount = () => {
    setCartItemCount(cartService.getItemCount());
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters: Record<string, unknown> = { isActive: true };
      
      if (searchTerm) {
        filters.name = searchTerm;
      }
      if (selectedCategory) {
        filters.categoryId = selectedCategory;
      }

      const response = await productService.getAll(filters);
      setProducts(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getQuantity = (productId: number) => quantities[productId] || 1;

  const setQuantity = (productId: number, qty: number) => {
    if (qty >= 1) {
      setQuantities(prev => ({ ...prev, [productId]: qty }));
    }
  };

  const addToCart = (product: Product) => {
    const qty = getQuantity(product.id);
    const primaryImage = product.productUrls?.find(u => u.isPrimary && u.urlType === 0);
    
    const cartItem: Omit<CartItem, 'quantity'> = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      price: product.price,
      taxRate: product.taxRate || 0,
      imageUrl: primaryImage?.url,
    };

    cartService.addItem(cartItem, qty);
    updateCartCount();
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
    setSnackbar({ open: true, message: `Added ${qty} x ${product.name} to cart` });
  };

  const getProductImage = (product: Product) => {
    const primaryImage = product.productUrls?.find(u => u.isPrimary && u.urlType === 0);
    const anyImage = product.productUrls?.find(u => u.urlType === 0);
    return primaryImage?.url || anyImage?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDIwMCAxNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04NSA1MEgxMTVWOTBIOjVWNTBaIiBmaWxsPSIjOTk5OTk5Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4K';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Search and Cart */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ minWidth: 200, flex: 1, maxWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Category"
            onChange={(e) => setSelectedCategory(e.target.value as number | '')}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          size="small"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="outlined"
          onClick={onViewCart}
          startIcon={
            <Badge badgeContent={cartItemCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          }
        >
          Cart
        </Button>
      </Box>

      {/* Products Grid */}
      {loading ? (
        <Typography>Loading products...</Typography>
      ) : products.length === 0 ? (
        <Typography color="text.secondary">No products found. Try adjusting your search.</Typography>
      ) : (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={getProductImage(product)}
                  alt={product.name}
                  sx={{ objectFit: 'contain', bgcolor: '#f5f5f5', p: 1 }}
                />
                <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" noWrap title={product.name}>
                    {product.name}
                  </Typography>
                  
                  {product.category && (
                    <Chip
                      label={product.category.name}
                      size="small"
                      sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                    />
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.75rem' }} noWrap>
                    {product.description || 'No description'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Box>
                      <Typography variant="h6" color="primary" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {formatPrice(product.price)}
                      </Typography>
                      {product.taxRate > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          +{product.taxRate}% tax
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Quantity and Add to Cart */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setQuantity(product.id, getQuantity(product.id) - 1)}
                        disabled={getQuantity(product.id) <= 1}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ px: 1, minWidth: 24, textAlign: 'center' }}>
                        {getQuantity(product.id)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setQuantity(product.id, getQuantity(product.id) + 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => addToCart(product)}
                      startIcon={<AddShoppingCartIcon />}
                      sx={{ flex: 1, fontSize: '0.75rem' }}
                    >
                      Add
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
