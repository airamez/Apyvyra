import { useState, useEffect, memo } from 'react';
import { Container, Typography, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { userService } from '../../services/userService';
import { orderService, type OrderStats } from '../../services/orderService';
import OrderSection from './dashboard/OrderSection';
import CustomerSection from './dashboard/CustomerSection';
import { useTranslation } from '../../hooks/useTranslation';

function Dashboard() {
  const { t } = useTranslation('Dashboard');
  
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [count, stats] = await Promise.all([
          userService.getCustomerCount(),
          orderService.getStats(),
        ]);
        setCustomerCount(count);
        setOrderStats(stats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DashboardIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {t('TITLE')}
          </Typography>
        </Box>
        <Typography>{t('LOADING')}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DashboardIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          {t('TITLE')}
        </Typography>
      </Box>

      <OrderSection 
        orderStats={orderStats} 
        loading={loading} 
        formatCurrency={formatCurrency} 
      />

      <CustomerSection 
        customerCount={customerCount} 
        loading={loading} 
      />
    </Container>
  );
}

export default memo(Dashboard);
