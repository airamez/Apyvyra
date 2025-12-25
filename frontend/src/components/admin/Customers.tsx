import { Container, Typography, Box, Card, CardContent, Button, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Customers() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Customers
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />}>
          Add Customer
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Customer List</Typography>
            <Chip label="0 customers" color="primary" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            No customers found. Your customer base will appear here.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
