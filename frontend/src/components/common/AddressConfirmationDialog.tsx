import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert
} from '@mui/material';
import { LocationOn, CheckCircle } from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';
import './AddressConfirmationDialog.css';

interface AddressConfirmationDialogProps {
  open: boolean;
  originalAddress: string;
  suggestedAddress: string;
  suggestions?: string[];
  onConfirm: (address: string) => void;
  onReject: () => void;
}

const AddressConfirmationDialog: React.FC<AddressConfirmationDialogProps> = ({
  open,
  originalAddress,
  suggestedAddress,
  suggestions = [],
  onConfirm,
  onReject
}) => {
  const { t } = useTranslation('GoogleMaps');
  // Create list of all addresses for radio buttons
  const allAddresses = [
    { value: suggestedAddress, label: t('RECOMMENDED_ADDRESS'), isRecommended: true },
    ...suggestions.map((suggestion, index) => ({
      value: suggestion,
      label: `Option ${index + 1}`,
      isRecommended: false
    }))
  ].filter((addr, index, self) => 
    // Remove duplicates
    self.findIndex(a => a.value === addr.value) === index
  );

  const [selectedAddress, setSelectedAddress] = useState(suggestedAddress || allAddresses[0]?.value || '');

  // Update selected address when props change
  React.useEffect(() => {
    if (suggestedAddress) {
      setSelectedAddress(suggestedAddress);
    } else if (allAddresses.length > 0) {
      setSelectedAddress(allAddresses[0].value);
    }
  }, [suggestedAddress, allAddresses]);

  const handleConfirm = () => {
    onConfirm(selectedAddress);
  };

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAddress(event.target.value);
  };

  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="primary" />
          <Typography variant="h6">Address Confirmation</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            The address you entered doesn't exactly match our records. Please review the suggested address below.
          </Typography>
        </Alert>

        {/* Original address at the top */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            You entered:
          </Typography>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1,
            className: 'original-address'
          }}>
            <Typography variant="body1">{originalAddress}</Typography>
          </Box>
        </Box>

        {/* User suggested addresses below */}
        {allAddresses.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Please select the correct address:
            </Typography>
            <RadioGroup value={selectedAddress} onChange={handleAddressChange}>
              {allAddresses.map((addr, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <FormControlLabel
                    value={addr.value}
                    control={<Radio />}
                    label={
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 1,
                        flex: 1,
                        className: addr.isRecommended ? 'address-option recommended' : 'address-option standard'
                      }}>
                        {addr.isRecommended && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircle color="success" fontSize="small" />
                            <Typography variant="subtitle2" color="success.main">
                              {addr.label}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="body1" sx={{ fontWeight: addr.isRecommended ? 'medium' : 'regular' }}>
                          {addr.value}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              ))}
            </RadioGroup>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          startIcon={<CheckCircle />}
        >
          Use Selected Address
        </Button>
        <Button 
          onClick={onReject}
          variant="outlined"
          color="secondary"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressConfirmationDialog;
