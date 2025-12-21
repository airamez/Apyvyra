import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import YouTubeIcon from '@mui/icons-material/YouTube';
import GitHubIcon from '@mui/icons-material/GitHub';

interface WelcomePageProps {
  isAuthenticated: boolean;
}

export default function WelcomePage({ isAuthenticated }: WelcomePageProps) {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Welcome to Apyvyra ERP
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            "Given freely" in tupi-guarani
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
            A comprehensive full-stack ERP application built with modern technologies, designed to help organizations
            manage their core business processes efficiently.
          </Typography>
        </Box>

        {/* Project Links */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<LaunchIcon />}
            href="https://apyvyra"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mr: 2, mb: 1 }}
          >
            Visit Apyvyra
          </Button>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            href="https://github.com/airamez/Apyvyra"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mr: 2, mb: 1 }}
          >
            GitHub Repository
          </Button>
          <Button
            variant="outlined"
            startIcon={<YouTubeIcon />}
            href="https://www.youtube.com/playlist?list=PLBQmBWUPdMJTchLEOOp1tfEFsyHQI_Da5"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mb: 1 }}
          >
            YouTube Playlist
          </Button>
        </Box>

        {/* Key Features Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Full-Stack Architecture
                </Typography>
                <Typography variant="body2">
                  Built with ASP.NET Core Web API backend, React frontend, PostgreSQL database,
                  and Docker containerization for easy deployment.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  ERP Functionality
                </Typography>
                <Typography variant="body2">
                  Complete Enterprise Resource Planning system with product management,
                  user authentication, categories, and customer relationship management.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Learning Platform
                </Typography>
                <Typography variant="body2">
                  Educational project demonstrating real-world software development practices,
                  live coding sessions, and AI-assisted development techniques.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tech Stack */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Technology Stack
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
            {['React', 'TypeScript', 'ASP.NET Core', 'C#', 'PostgreSQL', 'Entity Framework', 'Docker', 'Material-UI'].map((tech) => (
              <Box
                key={tech}
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: 'medium'
                }}
              >
                {tech}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Call to Action */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            {isAuthenticated
              ? 'Use the menu above to navigate to different sections of the application.'
              : 'Please log in to access the ERP system.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visit <a href="https://apyvyra" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>https://apyvyra</a> for more information
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}