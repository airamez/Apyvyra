import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  ShoppingBasket,
  Inventory,
  TrendingUp,
  Support,
  Security,
  Speed
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';

interface WelcomePageProps {
  isAuthenticated: boolean;
}

export default function WelcomePage({ isAuthenticated }: WelcomePageProps) {
  const theme = useTheme();
  const { t, translations, loading, error } = useTranslation('WelcomePage');

  // Debug: Log the translation state
  console.log('WelcomePage translations:', { translations, loading, error });

  // Company Configuration from translations
  const companyConfig = {
    name: t('COMPANY_NAME'),
    url: t('COMPANY_URL'),
    description: t('COMPANY_DESCRIPTION'),
    logo: "/images/apyvyra-logo.png",
    contactEmail: t('COMPANY_CONTACT_EMAIL'),
    phone: t('COMPANY_PHONE'),
    address: t('COMPANY_ADDRESS')
  };

  // Product Categories from translations
  const productCategories = [
    {
      title: t('ELECTRONICS_TITLE'),
      description: t('ELECTRONICS_DESCRIPTION'),
      icon: <ShoppingBasket />
    },
    {
      title: t('INDUSTRIAL_TITLE'),
      description: t('INDUSTRIAL_DESCRIPTION'),
      icon: <Inventory />
    },
    {
      title: t('OFFICE_TITLE'),
      description: t('OFFICE_DESCRIPTION'),
      icon: <TrendingUp />
    }
  ];

  // Features from translations
  const features = [
    {
      title: t('QUALITY_PRODUCTS_TITLE'),
      description: t('QUALITY_PRODUCTS_DESCRIPTION'),
      icon: <Security />
    },
    {
      title: t('FAST_DELIVERY_TITLE'),
      description: t('FAST_DELIVERY_DESCRIPTION'),
      icon: <Speed />
    },
    {
      title: t('EXPERT_SUPPORT_TITLE'),
      description: t('EXPERT_SUPPORT_DESCRIPTION'),
      icon: <Support />
    }
  ];

  // Show loading state while translations are loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Show error state if translations failed to load
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography color="error">Error loading translations: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.dark, 0.8)})`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={companyConfig.logo}
                  alt={companyConfig.name}
                  sx={{ width: 80, height: 80, mr: 3, bgcolor: 'white', p: 1 }}
                />
                <Box>
                  <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {companyConfig.name}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {companyConfig.url}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="h5" sx={{ mb: 3, maxWidth: 600 }}>
                {companyConfig.description}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  href={companyConfig.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  {t('VISIT_WEBSITE')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  {t('CONTACT_US')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Product Categories Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('PRODUCT_CATEGORIES_TITLE')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {t('PRODUCT_CATEGORIES_DESCRIPTION')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {productCategories.map((category: any, index: number) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 2,
                    color: 'primary.main'
                  }}>
                    {category.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {category.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('WHY_CHOOSE_US_TITLE')}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              {t('WHY_CHOOSE_US_DESCRIPTION')}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature: any, index: number) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 2,
                    color: 'primary.main'
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('CONTACT_TITLE')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {t('CONTACT_DESCRIPTION')}
          </Typography>
        </Box>

        <Card sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> {companyConfig.contactEmail}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Phone:</strong> {companyConfig.phone}
              </Typography>
              <Typography variant="body1">
                <strong>Address:</strong> {companyConfig.address}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                href={`mailto:${companyConfig.contactEmail}`}
                sx={{ mb: 2 }}
              >
                {t('SEND_EMAIL')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                href={`tel:${companyConfig.phone}`}
              >
                {t('CALL_US')}
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Container>

      {/* ERP System Access */}
      {isAuthenticated ? (
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
          <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('WELCOME_BACK_TITLE')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              {t('WELCOME_BACK_DESCRIPTION')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/dashboard"
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              {t('GO_TO_DASHBOARD')}
            </Button>
          </Container>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6 }}>
          <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('ERP_ACCESS_TITLE')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              {t('ERP_ACCESS_DESCRIPTION')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/login"
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              {t('LOGIN_TO_ERP')}
            </Button>
          </Container>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.100', py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('FOOTER_COPYRIGHT', { companyName: companyConfig.name })}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('FOOTER_POWERED_BY')}
        </Typography>
      </Box>
    </Box>
  );
}
