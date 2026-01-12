import { useState, memo, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { userService } from '../../services/userService';
import { useTranslation } from '../../hooks/useTranslation';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { validateAddress, type AddressValidationResult } from '../../utils/addressValidation';
import AddressConfirmationDialog from './AddressConfirmationDialog';

interface UserProfileProps {
  onProfileUpdate?: () => void;
}

function UserProfile({ onProfileUpdate }: UserProfileProps) {
  const { t } = useTranslation('UserProfile');
  const { t: tCommon } = useTranslation('Common');
  const { t: tPasswordReset } = useTranslation('PasswordReset');
  const { logout } = useAuth();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bypassAddressValidation, setBypassAddressValidation] = useState(false);
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const hasLoaded = useRef(false);

  // Load user data immediately when component mounts
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadUserData = async () => {
      try {
        const user = await userService.getCurrentUser();
        setCurrentUser(user);
        setFullName(user.fullName || '');
        setPhone(user.phone || '');
        setAddress(user.address || '');
      } catch (err) {
        console.error('Error loading current user:', err);
      }
    };

    loadUserData();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditProfile = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleChangePassword = () => {
    handleMenuClose();
    setChangePasswordDialogOpen(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(false);
  };

  const handleSendPasswordReset = async () => {
    try {
      setChangePasswordLoading(true);
      setChangePasswordError(null);
      
      // Get current user's email
      const user = await userService.getCurrentUser();
      
      // Call the same forgot-password API as the ForgotPassword component
      const response = await fetch(API_ENDPOINTS.APP_USER.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setChangePasswordSuccess(true);
      } else {
        setChangePasswordError(data.error || data.message || tPasswordReset('FAILED_RESET'));
      }
    } catch (err: any) {
      setChangePasswordError(err.message || tPasswordReset('TOKEN_ERROR'));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleCloseChangePasswordDialog = () => {
    // If password reset was successful, logout the user for security
    if (changePasswordSuccess) {
      logout();
    }
    setChangePasswordDialogOpen(false);
    setChangePasswordError(null);
    setChangePasswordSuccess(false);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setError('');
    setAddressValidation(null);
    setBypassAddressValidation(false);
  };

  const handleValidateAddress = async () => {
    if (!address.trim()) return;
    
    setIsValidatingAddress(true);
    try {
      const result = await validateAddress(address);
      setAddressValidation(result);
      
      // Show confirmation dialog if address is not an exact match
      if (!result.isExactMatch && result.address) {
        setShowAddressConfirmation(true);
      }
    } catch (err) {
      setAddressValidation({ isValid: false, isExactMatch: false, errorMessage: t('VALIDATION_FAILED'), address: null });
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleAddressConfirm = (confirmedAddress: string) => {
    setAddress(confirmedAddress);
    setShowAddressConfirmation(false);
    setAddressValidation({ 
      isValid: true, 
      isExactMatch: true, 
      address: null, // We don't need the full address object for confirmation
      errorMessage: undefined 
    });
  };

  const handleAddressReject = () => {
    setShowAddressConfirmation(false);
    // User can continue editing the original address
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setAddress(suggestion);
    setShowAddressConfirmation(false);
    setAddressValidation({ 
      isValid: true, 
      isExactMatch: true, 
      address: null,
      errorMessage: undefined 
    });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');

    try {
      // Build update data
      const updateData: { fullName?: string; phone?: string; address?: string; bypassAddressValidation?: boolean } = { fullName };
      
      // Only include customer fields if user is a customer
      if (currentUser?.userType === 2) {
        updateData.phone = phone;
        updateData.address = address;
        updateData.bypassAddressValidation = bypassAddressValidation;
      }
      
      // Update user profile
      await userService.updateProfile(updateData);
      
      // Reload current user data
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      
      setEditDialogOpen(false);
      setAddressValidation(null);
      setBypassAddressValidation(false);
      onProfileUpdate?.();
    } catch (err: any) {
      setError(err.message || t('FAILED_UPDATE_PROFILE'));
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (!currentUser) return t('LOADING');
    return currentUser.fullName || currentUser.email;
  };

  
  return (
    <>
      <Box>
        <Button
          onClick={handleMenuOpen}
          size="small"
          variant="outlined"
          sx={{ 
            mr: 2,
            color: 'inherit',
            textTransform: 'none',
            minWidth: 'auto',
            p: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {getDisplayName()}
            </Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
          </Box>
        </Button>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem disabled>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {getDisplayName()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentUser?.email}
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleEditProfile}>
            <EditIcon sx={{ mr: 1, fontSize: 20 }} />
            {t('EDIT_PROFILE')}
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <LockIcon sx={{ mr: 1, fontSize: 20 }} />
            {t('CHANGE_PASSWORD')}
          </MenuItem>
        </Menu>
      </Box>

      <Dialog open={editDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('EDIT_PROFILE')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label={t('FULL_NAME')}
              type="text"
              fullWidth
              variant="outlined"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            
            {/* Show customer-specific fields only for customers (userType === 2) */}
            {currentUser?.userType === 2 && (
              <>
                <TextField
                  label={t('PHONE')}
                  type="tel"
                  fullWidth
                  variant="outlined"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label={t('ADDRESS')}
                  fullWidth
                  variant="outlined"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddressValidation(null);
                  }}
                  multiline
                  rows={2}
                  InputLabelProps={{ shrink: true }}
                  helperText={
                    isValidatingAddress ? t('VALIDATING_ADDRESS') :
                    addressValidation ? (addressValidation.isValid ? t('ADDRESS_VALID') : addressValidation.errorMessage) : ''
                  }
                  error={addressValidation ? !addressValidation.isValid && !bypassAddressValidation : false}
                />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={handleValidateAddress}
                    disabled={isValidatingAddress || !address.trim()}
                  >
                    {isValidatingAddress ? t('VALIDATING_ADDRESS') : t('VALIDATE_ADDRESS')}
                  </Button>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={bypassAddressValidation}
                        onChange={(e) => setBypassAddressValidation(e.target.checked)}
                      />
                    }
                    label={t('BYPASS_ADDRESS_VALIDATION')}
                  />
                </Box>
              </>
            )}
            
            {error && (
              <Alert severity="error">{error}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>{tCommon('CANCEL')}</Button>
          <Button onClick={handleSaveProfile} variant="contained" disabled={loading}>
            {loading ? t('SAVING') : t('SAVE')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onClose={handleCloseChangePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('CHANGE_PASSWORD')}</DialogTitle>
        <DialogContent>
          {changePasswordSuccess ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {tPasswordReset('PASSWORD_RESET_SENT')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {tPasswordReset('WILL_BE_LOGGED_OUT')}
                </Typography>
                <Typography variant="body2">
                  {tPasswordReset('PLEASE_CHECK_EMAIL')}
                </Typography>
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={handleCloseChangePasswordDialog}
                sx={{ mt: 2 }}
              >
                {tCommon('CLOSE')}
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                {tPasswordReset('PASSWORD_CHANGE_EMAIL_SENT_MESSAGE')}: <strong>{currentUser?.email}</strong>
              </Typography>
              
              {changePasswordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {changePasswordError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!changePasswordSuccess && (
            <>
              <Button onClick={handleCloseChangePasswordDialog}>{tCommon('CANCEL')}</Button>
              <Button onClick={handleSendPasswordReset} variant="contained" disabled={changePasswordLoading}>
                {changePasswordLoading ? tPasswordReset('RESETTING') : tPasswordReset('RESET_BUTTON')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Address Confirmation Dialog */}
      <AddressConfirmationDialog
        open={showAddressConfirmation}
        originalAddress={addressValidation?.originalAddress || ''}
        suggestedAddress={addressValidation?.address?.formatted_address || ''}
        suggestions={addressValidation?.suggestions}
        onConfirm={handleAddressConfirm}
        onReject={handleAddressReject}
        onSuggestionSelect={handleSuggestionSelect}
      />
    </>
  );
}

export default memo(UserProfile);
