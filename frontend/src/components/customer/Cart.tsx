import { Card, CardContent, Typography } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function Cart() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <ShoppingCartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Your Shopping Cart
        </Typography>
        <Typography variant="body1">
          Your cart is empty. (Placeholder content - implement cart functionality here)
        </Typography>
      </CardContent>
    </Card>
  );
}