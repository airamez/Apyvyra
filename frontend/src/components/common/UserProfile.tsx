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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { userService } from '../../services/userService';
import { useTranslation } from '../../hooks/useTranslation';

interface UserProfileProps {
  onProfileUpdate?: () => void;
}

function UserProfile({ onProfileUpdate }: UserProfileProps) {
  const { t } = useTranslation('UserProfile');
  const { t: tCommon } = useTranslation('Common');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    </>
  );
}

export default memo(UserProfile);
