import { Card, CardContent, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

export default function Profile() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Your Profile
        </Typography>
        <Typography variant="body1">
          Manage your account details here. (Placeholder content - implement profile functionality here)
        </Typography>
      </CardContent>
    </Card>
  );
}