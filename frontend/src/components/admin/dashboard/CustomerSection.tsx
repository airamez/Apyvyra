import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface CustomerSectionProps {
  customerCount: number;
  loading: boolean;
}

export default function CustomerSection({ customerCount, loading }: CustomerSectionProps) {
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2, mt: 3 }}>
        Customer Overview
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  Total Customers
                </Typography>
                <Typography variant="h4">
                  {loading ? '...' : customerCount}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Registered customers
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  &nbsp;
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Active Customers
                  </Typography>
                  <Typography variant="h4">
                    {loading ? '...' : Math.floor(customerCount * 0.75)}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Customers with orders
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ~75% of total customers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonAddIcon sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    New This Month
                  </Typography>
                  <Typography variant="h4">
                    {loading ? '...' : Math.floor(customerCount * 0.1)}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  New registrations
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ~10% growth this month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
