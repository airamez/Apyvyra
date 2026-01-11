import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { customerService } from '../../../services/customerService';
import { getErrorMessages } from '../../../utils/apiErrorHandler';
import type { DeleteCustomerDialogProps } from './types';

export default function DeleteCustomerDialog({ open, onClose, onSuccess, customer, t }: DeleteCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      setError(null);
      await customerService.delete(customer.id);
      onSuccess();
      handleClose();
    } catch (err) {
      const errors = getErrorMessages(err);
      setError(errors[0] || t('ERROR_DELETING_CUSTOMER'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{t('DELETE_CUSTOMER')}</DialogTitle>
      <DialogContent>
        <Typography>{t('CONFIRM_DELETE_CUSTOMER')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {customer?.fullName} ({customer?.email})
        </Typography>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('CANCEL')}</Button>
        <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : t('DELETE_CUSTOMER')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
