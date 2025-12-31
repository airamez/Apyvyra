import { Card, CardContent, Typography } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useTranslation } from '../../hooks/useTranslation';

export default function Cart() {
  const { t } = useTranslation('Cart');
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <ShoppingCartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('TITLE')}
        </Typography>
        <Typography variant="body1">
          {t('EMPTY_MESSAGE')}
        </Typography>
      </CardContent>
    </Card>
  );
}