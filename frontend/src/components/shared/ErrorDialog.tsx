import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorDialogProps {
  open: boolean;
  errors: string[];
  onClose: () => void;
  title?: string;
}

/**
 * Reusable error dialog component for displaying API errors
 */
export default function ErrorDialog({ open, errors, onClose, title = 'Error' }: ErrorDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <ErrorOutlineIcon />
        {title}
      </DialogTitle>
      <DialogContent>
        {errors.length === 1 ? (
          <Typography>{errors[0]}</Typography>
        ) : (
          <List dense>
            {errors.map((error, index) => (
              <ListItem key={index} disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ErrorOutlineIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
