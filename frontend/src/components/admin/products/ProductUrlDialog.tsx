import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Grid
} from '@mui/material';
import { type UrlType } from '../../../services/productService';
import { useTranslation } from '../../../hooks/useTranslation';

interface ProductUrlDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string, type: UrlType) => Promise<void>;
}

const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export default function ProductUrlDialog({ open, onClose, onSubmit }: ProductUrlDialogProps) {
  const { t } = useTranslation('ProductUrlDialog');
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState<UrlType>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError(t('URL_REQUIRED'));
      return false;
    }
    if (!URL_REGEX.test(value)) {
      setUrlError(t('INVALID_URL_FORMAT'));
      return false;
    }
    setUrlError('');
    return true;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.trim()) {
      validateUrl(value);
    } else {
      setUrlError('');
    }
  };

  const handleSubmit = async () => {
    if (!validateUrl(url)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(url, urlType);
      setUrl('');
      setUrlType(0);
      setUrlError('');
      onClose();
    } catch (error: any) {
      console.error('Error adding URL:', error);
      setUrlError(error?.message || t('FAILED_ADD_URL'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setUrlType(0);
    setUrlError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('TITLE')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={12}>
            <TextField
              label={t('URL')}
              fullWidth
              required
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="https://example.com/image.jpg"
              error={!!urlError}
              helperText={urlError || t('URL_HELPER_TEXT')}
            />
          </Grid>
          <Grid size={12}>
            <FormControl fullWidth size="small">
              <InputLabel id="url-type-label">{t('URL_TYPE')}</InputLabel>
              <Select
                labelId="url-type-label"
                label={t('URL_TYPE')}
                value={urlType}
                onChange={(e) => setUrlType(e.target.value as UrlType)}
                variant="outlined"
              >
                <MenuItem value={0}>{t('TYPE_IMAGE')}</MenuItem>
                <MenuItem value={1}>{t('TYPE_VIDEO')}</MenuItem>
                <MenuItem value={2}>{t('TYPE_MANUAL')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>{t('CANCEL')}</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!url.trim() || isSubmitting}
        >
          {isSubmitting ? t('ADDING') : t('ADD_URL')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
