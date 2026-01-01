import {
  Container,
  Typography,
  Box,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  Support,
  Security,
  Speed
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';

interface WelcomePageProps {}

export default function WelcomePage({}: WelcomePageProps) {
  const theme = useTheme();
  const { t } = useTranslation('WelcomePage');

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section with Why Choose Us */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.dark, 0.8)})`,
          color: 'white',
          py: { xs: 4, md: 6 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            {/* Left: Company Info */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <img
                  src={companyConfig.logo}
                  alt={companyConfig.name}
                  style={{ width: 120, height: 120, marginRight: 16 }}
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
              
              <Typography variant="h5" sx={{ mb: 2, maxWidth: 500 }}>
                {companyConfig.description}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {companyConfig.url && companyConfig.url.trim() !== '' && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    <strong>Website:</strong> {companyConfig.url}
                  </Typography>
                )}
                {companyConfig.contactEmail && companyConfig.contactEmail.trim() !== '' && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    <strong>Email:</strong> {companyConfig.contactEmail}
                  </Typography>
                )}
                {companyConfig.phone && companyConfig.phone.trim() !== '' && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    <strong>Phone:</strong> {companyConfig.phone}
                  </Typography>
                )}
                {companyConfig.address && companyConfig.address.trim() !== '' && (
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    <strong>Address:</strong> {companyConfig.address}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Right: Why Choose Us */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {t('WHY_CHOOSE_US_TITLE')}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
                  {t('WHY_CHOOSE_US_DESCRIPTION')}
                </Typography>
              </Box>

              {features.map((feature: any, index: number) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, bgcolor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mr: 2,
                    color: 'white'
                  }}>
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

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
