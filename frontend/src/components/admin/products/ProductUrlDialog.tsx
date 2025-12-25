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

interface ProductUrlDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string, type: UrlType) => Promise<void>;
}

const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export default function ProductUrlDialog({ open, onClose, onSubmit }: ProductUrlDialogProps) {
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState<UrlType>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError('URL is required');
      return false;
    }
    if (!URL_REGEX.test(value)) {
      setUrlError('Please enter a valid URL (must start with http:// or https://)');
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
      setUrlError(error?.message || 'Failed to add URL. Please try again.');
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
      <DialogTitle>Add Product URL</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={12}>
            <TextField
              label="URL"
              fullWidth
              required
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="https://example.com/image.jpg"
              error={!!urlError}
              helperText={urlError || 'Enter a valid URL starting with http:// or https://'}
            />
          </Grid>
          <Grid size={12}>
            <FormControl fullWidth size="small">
              <InputLabel id="url-type-label">URL Type</InputLabel>
              <Select
                labelId="url-type-label"
                label="URL Type"
                value={urlType}
                onChange={(e) => setUrlType(e.target.value as UrlType)}
                variant="outlined"
              >
                <MenuItem value={0}>Image</MenuItem>
                <MenuItem value={1}>Video</MenuItem>
                <MenuItem value={2}>Manual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!url.trim() || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add URL'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
