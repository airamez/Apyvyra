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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { userService } from '../../services/userService';
import { useTranslation } from '../../hooks/useTranslation';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

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
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');

    try {
      // Update user profile
      await userService.updateProfile({ fullName });
      
      // Reload current user data
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
      
      setEditDialogOpen(false);
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
            Change Password
          </MenuItem>
        </Menu>
      </Box>

      <Dialog open={editDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('EDIT_PROFILE')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('FULL_NAME')}
            type="text"
            fullWidth
            variant="outlined"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('FULL_NAME_PLACEHOLDER')}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
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
    </>
  );
}

export default memo(UserProfile);
