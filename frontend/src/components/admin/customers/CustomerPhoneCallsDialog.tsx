import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { customerService } from '../../../services/customerService';
import { getErrorMessages } from '../../../utils/apiErrorHandler';
import type { CustomerPhoneCallsDialogProps, PhoneCall, CreatePhoneCallData } from './types';

export default function CustomerPhoneCallsDialog({ 
  open, 
  onClose, 
  customer, 
  onPhoneCallChange,
  t, 
  formatDateTime 
}: CustomerPhoneCallsDialogProps) {
  const [phoneCalls, setPhoneCalls] = useState<PhoneCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePhoneCallData>({
    callType: 0,
    durationMinutes: undefined,
    notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && customer) {
      loadPhoneCalls();
    }
  }, [open, customer]);

  const loadPhoneCalls = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      const data = await customerService.getPhoneCalls(customer.id);
      setPhoneCalls(data);
    } catch {
      setPhoneCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneCalls([]);
    setError(null);
    onClose();
  };

  const handleOpenAddDialog = () => {
    setFormData({ callType: 0, durationMinutes: undefined, notes: '' });
    setError(null);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setFormData({ callType: 0, durationMinutes: undefined, notes: '' });
    setError(null);
    setAddDialogOpen(false);
  };

  const handleCreatePhoneCall = async () => {
    if (!customer) return;
    try {
      setFormLoading(true);
      setError(null);
      await customerService.createPhoneCall(customer.id, formData);
      handleCloseAddDialog();
      await loadPhoneCalls();
      onPhoneCallChange();
    } catch (err) {
      const errors = getErrorMessages(err);
      setError(errors[0] || t('ERROR_CREATING_PHONE_CALL'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePhoneCall = async (callId: number) => {
    if (!customer) return;
    try {
      await customerService.deletePhoneCall(customer.id, callId);
      await loadPhoneCalls();
      onPhoneCallChange();
    } catch (err) {
      const errors = getErrorMessages(err);
      setError(errors[0] || t('ERROR_DELETING_PHONE_CALL'));
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('PHONE_CALLS')} - {customer?.fullName}</Typography>
            <Box>
              <Button startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mr: 1 }}>
                {t('ADD_PHONE_CALL')}
              </Button>
              <IconButton onClick={handleClose}><CloseIcon /></IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : phoneCalls.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('NO_PHONE_CALLS')}
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('CALL_DATE')}</TableCell>
                    <TableCell>{t('CALL_TYPE')}</TableCell>
                    <TableCell>{t('DURATION')}</TableCell>
                    <TableCell>{t('NOTES')}</TableCell>
                    <TableCell>{t('ACTIONS')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {phoneCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>{formatDateTime(call.callDate)}</TableCell>
                      <TableCell><Chip label={call.callTypeName} size="small" /></TableCell>
                      <TableCell>{call.durationMinutes ? `${call.durationMinutes} min` : '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {call.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => handleDeletePhoneCall(call.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Phone Call Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('ADD_PHONE_CALL')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{t('CALL_TYPE')}</InputLabel>
              <Select
                value={formData.callType}
                label={t('CALL_TYPE')}
                onChange={(e) => setFormData({ ...formData, callType: e.target.value as number })}
              >
                <MenuItem value={0}>{t('CALL_TYPE_INBOUND')}</MenuItem>
                <MenuItem value={1}>{t('CALL_TYPE_OUTBOUND')}</MenuItem>
                <MenuItem value={2}>{t('CALL_TYPE_MISSED')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('DURATION')}
              type="number"
              value={formData.durationMinutes || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                durationMinutes: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              fullWidth
            />
            <TextField
              label={t('NOTES')}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>{t('CANCEL')}</Button>
          <Button onClick={handleCreatePhoneCall} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : t('SAVE')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
