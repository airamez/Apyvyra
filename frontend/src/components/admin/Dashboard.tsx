import { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Grid } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { userService } from '../../services/userService';
import { orderService, type OrderStats } from '../../services/orderService';

export default function Dashboard() {
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
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DashboardIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : formatCurrency(orderStats?.totalRevenue || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All completed orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : orderStats?.totalOrders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Pending Orders
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : orderStats?.pendingOrders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting confirmation
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Customers
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : customerCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status Breakdown */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main" gutterBottom>
                Confirmed
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : orderStats?.confirmedOrders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready to process
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary.main" gutterBottom>
                Processing
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : orderStats?.processingOrders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Being prepared
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary.main" gutterBottom>
                Shipped
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : orderStats?.shippedOrders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In transit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main" gutterBottom>
                Delivered
              </Typography>
              <Typography variant="h4">
                {loading ? '...' : orderStats?.deliveredOrders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
