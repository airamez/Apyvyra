import { useState, useEffect, useCallback, memo } from 'react';
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
  Collapse,
  Link,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  const [searchBrand, setSearchBrand] = useState('');
  const [searchManufacturer, setSearchManufacturer] = useState('');
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [cartItemCount, setCartItemCount] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    loadData();
    // Set initial cart count directly to avoid extra localStorage read
    const initialCount = cartService.getItemCount();
    setCartItemCount(initialCount);
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
      if (searchBrand) {
        filters.brand = searchBrand;
      }
      if (searchManufacturer) {
        filters.manufacturer = searchManufacturer;
      }
      
      const response = await productService.getAll(filters);
      setProducts(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setSearchTerm('');
      setSelectedCategory('');
      setSearchBrand('');
      setSearchManufacturer('');
      
      const response = await productService.getAll({ isActive: true });
      setProducts(response.data);
    } catch (error) {
      console.error('Error resetting search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleExpanded = useCallback((productId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  }, []);

  const getQuantity = useCallback((productId: number) => quantities[productId] || 1, [quantities]);

  const setQuantity = useCallback((productId: number, qty: number) => {
    if (qty >= 1) {
      setQuantities(prev => ({ ...prev, [productId]: qty }));
    }
  }, []);

  const addToCart = useCallback((product: Product) => {
    const qty = quantities[product.id] || 1;
    
    const cartItem = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      price: product.price,
      taxRate: product.taxRate || 0,
      imageUrl: product.productUrls?.find(u => u.isPrimary && u.urlType === 0)?.url,
    };

    cartService.addItem(cartItem, qty);
    setCartItemCount(prev => prev + qty);
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
    setSnackbar({ open: true, message: `Added ${qty} x ${product.name} to cart` });
  }, [quantities]);

  const getProductImage = useCallback((product: Product) => {
    const primaryImage = product.productUrls?.find(u => u.isPrimary && u.urlType === 0);
    const anyImage = product.productUrls?.find(u => u.urlType === 0);
    return primaryImage?.url || anyImage?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDIwMCAxNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04NSA1MEgxMTVWOTBIOjVWNTBaIiBmaWxsPSIjOTk5OTk5Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4K';
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  }, []);

  // Memoized ProductCard component to prevent unnecessary re-renders
  const ProductCard = memo(({ product }: { product: Product }) => {
    const currentQuantity = quantities[product.id] || 1;
    return (
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

          {/* Price, Quantity and Add to Cart */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="h6" color="primary" sx={{ fontSize: '1rem', fontWeight: 'bold', minWidth: '80px' }}>
              {formatPrice(product.price)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
              <IconButton
                size="small"
                onClick={() => setQuantity(product.id, currentQuantity - 1)}
                disabled={currentQuantity <= 1}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography sx={{ px: 1, minWidth: 24, textAlign: 'center' }}>
                {currentQuantity}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setQuantity(product.id, currentQuantity + 1)}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => addToCart(product)}
              sx={{ minWidth: '60px', fontSize: '0.75rem', px: 1 }}
            >
              Add
            </Button>
          </Box>
        </CardContent>

        {/* Product Details Section */}
        {(product.brand || product.manufacturer || product.weight || product.dimensions) && (
          <Box sx={{ px: 1.5, pb: 1 }}>
            {product.brand && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                <strong>Brand:</strong> {product.brand}
              </Typography>
            )}
            
            {product.manufacturer && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                <strong>Manufacturer:</strong> {product.manufacturer}
              </Typography>
            )}
            
            {product.dimensions && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                <strong>Dimensions:</strong> {product.dimensions}
              </Typography>
            )}
            
            {product.weight && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
                <strong>Weight:</strong> {product.weight}
              </Typography>
            )}
          </Box>
        )}

        {/* Resources Section */}
        {product.productUrls && product.productUrls.length > 0 && (
          <Box sx={{ px: 1.5, pb: 1.5, pt: 1, borderTop: '1px solid #eee' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              Resources:
            </Typography>
            {product.productUrls.map((url, index) => (
              <Box key={url.id} sx={{ mb: 0.3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  <strong>{url.urlType === 0 ? 'Image' : url.urlType === 1 ? 'Video' : 'Manual'}:</strong>{' '}
                  <Link 
                    href={url.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'primary.main', 
                      textDecoration: 'underline',
                      '&:hover': { color: 'primary.dark' }
                    }}
                  >
                    {url.altText || `Resource ${index + 1}`}
                  </Link>
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    );
  });

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

        <TextField
          size="small"
          placeholder="Brand..."
          value={searchBrand}
          onChange={(e) => setSearchBrand(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ minWidth: 120, maxWidth: 150 }}
        />

        <TextField
          size="small"
          placeholder="Manufacturer..."
          value={searchManufacturer}
          onChange={(e) => setSearchManufacturer(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ minWidth: 140, maxWidth: 170 }}
        />

        <Button
          variant="contained"
          size="small"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={handleReset}
          startIcon={<ClearIcon />}
        >
          Reset
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
              <ProductCard product={product} />
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
