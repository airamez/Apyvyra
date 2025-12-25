import { Typography, Box } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';

export default function WebStore() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <StoreIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
      <Typography variant="h4" component="h1">
        ApyVyra Web Store
      </Typography>
    </Box>
  );
}