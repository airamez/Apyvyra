import { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Grid } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { userService } from '../../services/userService';

export default function Dashboard() {
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCustomerCount = async () => {
      try {
        const count = await userService.getCustomerCount();
        setCustomerCount(count);
      } catch (error) {
        console.error('Error loading customer count:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerCount();
  }, []);
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DashboardIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Sales
              </Typography>
              <Typography variant="h3">$0</Typography>
              <Typography variant="body2" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Active Orders
              </Typography>
              <Typography variant="h3">0</Typography>
              <Typography variant="body2" color="text.secondary">
                Pending fulfillment
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Customers
              </Typography>
              <Typography variant="h3">
                {loading ? '...' : customerCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered customers (user_type = 2)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No recent activity to display
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
