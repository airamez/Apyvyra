import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
import { type OrderStats } from '../../../services/orderService';

interface OrderSectionProps {
  orderStats: OrderStats | null;
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

export default function OrderSection({ orderStats, loading, formatCurrency }: OrderSectionProps) {
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2, mt: 3 }}>
        Order Overview
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : formatCurrency(orderStats?.totalRevenue || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  All completed orders
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  &nbsp;
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.totalOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  All time orders
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  &nbsp;
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  Pending Payment
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.pendingOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Awaiting payment
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue: {formatCurrency(orderStats?.pendingRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="info.main" gutterBottom>
                  Paid
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.paidOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Payment received
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue: {formatCurrency(orderStats?.paidRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="info.main" gutterBottom>
                  Confirmed
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.confirmedOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ready to process
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue: {formatCurrency(orderStats?.confirmedRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="secondary.main" gutterBottom>
                  Processing
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.processingOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Being prepared
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue: {formatCurrency(orderStats?.processingRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="primary.main" gutterBottom>
                  Shipped
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.shippedOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  In transit
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue: {formatCurrency(orderStats?.shippedRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.completedOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Completed orders
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Revenue: {formatCurrency(orderStats?.completedRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="error.main" gutterBottom>
                  Cancelled
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.cancelledOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Cancelled orders
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lost revenue: {formatCurrency(orderStats?.cancelledRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  On Hold
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : orderStats?.onHoldOrders || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Inventory issues
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue: {formatCurrency(orderStats?.onHoldRevenue || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
