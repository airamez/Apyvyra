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
import { useTranslation } from '../../hooks/useTranslation';

interface WelcomePageProps {
  isAuthenticated: boolean;
}

export default function WelcomePage({ isAuthenticated }: WelcomePageProps) {
  const { t } = useTranslation('WelcomePage');
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {t('TITLE')}
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            {t('SUBTITLE')}
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
            {t('DESCRIPTION')}
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
            {t('VISIT_APYVYRA')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            href="https://github.com/airamez/Apyvyra"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mr: 2, mb: 1 }}
          >
            {t('GITHUB_REPOSITORY')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<YouTubeIcon />}
            href="https://www.youtube.com/playlist?list=PLBQmBWUPdMJTchLEOOp1tfEFsyHQI_Da5"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mb: 1 }}
          >
            {t('YOUTUBE_PLAYLIST')}
          </Button>
        </Box>

        {/* Key Features Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('FULL_STACK_ARCHITECTURE')}
                </Typography>
                <Typography variant="body2">
                  {t('FULL_STACK_DESCRIPTION')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('ERP_FUNCTIONALITY')}
                </Typography>
                <Typography variant="body2">
                  {t('ERP_DESCRIPTION')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('LEARNING_PLATFORM')}
                </Typography>
                <Typography variant="body2">
                  {t('LEARNING_DESCRIPTION')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tech Stack */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            {t('TECHNOLOGY_STACK')}
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
              ? t('AUTHENTICATED_MESSAGE')
              : t('NOT_AUTHENTICATED_MESSAGE')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('MORE_INFO', { url: 'https://apyvyra' })}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}