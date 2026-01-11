import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { customerService } from '../../../services/customerService';
import { validateAddress } from '../../../utils/addressValidation';
import { getErrorMessages } from '../../../utils/apiErrorHandler';
import type { EditCustomerDialogProps, UpdateCustomerData, AddressValidationState } from './types';

export default function EditCustomerDialog({ open, onClose, onSuccess, customer, t }: EditCustomerDialogProps) {
  const [formData, setFormData] = useState<UpdateCustomerData>({});
  const [addressValidation, setAddressValidation] = useState<AddressValidationState>({
    result: null,
    isValidating: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        address: customer.address?.addressLine || '',
        status: customer.status,
        bypassAddressValidation: false,
      });
      setAddressValidation({
        result: customer.address?.isValidated ? { isValid: true, address: null } : null,
        isValidating: false,
      });
    }
  }, [customer]);

  const handleClose = () => {
    setFormData({});
    setAddressValidation({ result: null, isValidating: false });
    setError(null);
    onClose();
  };

  const handleValidateAddress = async () => {
    if (!formData.address?.trim()) return;
    
    setAddressValidation({ ...addressValidation, isValidating: true });
    try {
      const result = await validateAddress(formData.address);
      setAddressValidation({ result, isValidating: false });
    } catch {
      setAddressValidation({ 
        result: { isValid: false, address: null, errorMessage: t('ADDRESS_VALIDATION_FAILED') }, 
        isValidating: false 
      });
    }
  };

  const handleSubmit = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      setError(null);
      await customerService.update(customer.id, formData);
      onSuccess();
      handleClose();
    } catch (err) {
      const errors = getErrorMessages(err);
      setError(errors[0] || t('ERROR_UPDATING_CUSTOMER'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('EDIT_CUSTOMER')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label={t('EMAIL')}
            value={customer?.email || ''}
            disabled
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t('FULL_NAME')}
            value={formData.fullName || ''}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t('PHONE')}
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t('ADDRESS')}
            value={formData.address || ''}
            onChange={(e) => {
              setFormData({ ...formData, address: e.target.value });
              setAddressValidation({ result: null, isValidating: false });
            }}
            multiline
            rows={2}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText={
              addressValidation.isValidating ? t('VALIDATING_ADDRESS') :
              addressValidation.result ? (addressValidation.result.isValid ? t('ADDRESS_VALID') : addressValidation.result.errorMessage) : ''
            }
            error={addressValidation.result ? !addressValidation.result.isValid && !formData.bypassAddressValidation : false}
          />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleValidateAddress}
              disabled={addressValidation.isValidating || !formData.address?.trim()}
            >
              {addressValidation.isValidating ? t('VALIDATING_ADDRESS') : t('VALIDATE_ADDRESS')}
            </Button>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.bypassAddressValidation || false}
                  onChange={(e) => setFormData({ ...formData, bypassAddressValidation: e.target.checked })}
                />
              }
              label={t('BYPASS_ADDRESS_VALIDATION')}
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel>{t('STATUS')}</InputLabel>
            <Select
              value={formData.status ?? 0}
              label={t('STATUS')}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as number })}
            >
              <MenuItem value={0}>{t('PENDING_CONFIRMATION')}</MenuItem>
              <MenuItem value={1}>{t('ACTIVE')}</MenuItem>
              <MenuItem value={2}>{t('INACTIVE')}</MenuItem>
            </Select>
          </FormControl>
          {error && (
            <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{error}</Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('CANCEL')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : t('SAVE')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
