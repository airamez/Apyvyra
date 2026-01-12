import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  Snackbar,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { emailClientService, type EmailMessage, type EmailFilterRequest } from '../../../services/emailClientService';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFormatting } from '../../../hooks/useFormatting';

interface CustomerEmailsProps {
  customerEmail: string;
  customerName: string;
}

export default function CustomerEmails({ customerEmail, customerName }: CustomerEmailsProps) {
  const { t } = useTranslation('EmailClient');
  const { t: tCustomers } = useTranslation('Customers');
  const { formatDate, formatTime } = useFormatting();
  
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [emailsPerPage] = useState(10);
  
  // Date filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState('lastWeek');
  
  // Reply state
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Success notification state
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: EmailFilterRequest = {
        toEmail: customerEmail,
        fromEmail: customerEmail,
        limit: 1000 // Load all emails for client-side pagination
      };

      console.log('Loading customer emails with filter:', filter);
      const emailData = await emailClientService.getCustomerEmails(filter);
      console.log('Received emails:', emailData);
      setEmails(emailData);
      setFilteredEmails(emailData);
    } catch (err) {
      setError(t('FAILED_FETCH_EMAILS'));
      console.error('Error loading customer emails:', err);
    } finally {
      setLoading(false);
    }
  }, [customerEmail, t]);

  useEffect(() => {
    if (customerEmail) {
      console.log('CustomerEmails component mounted with email:', customerEmail);
      loadEmails();
      // Set default date range to last week
      setDefaultDateRange();
    }
  }, [customerEmail, loadEmails]);

  // Set default date range to last week
  const setDefaultDateRange = () => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setStartDate(lastWeek.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  // Filter emails based on search text and date range
  useEffect(() => {
    let filtered = emails;
    
    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(email => 
        email.subject.toLowerCase().includes(searchText.toLowerCase()) ||
        email.body.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(email => {
        const emailDate = new Date(email.date);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
        return emailDate >= start && emailDate <= end;
      });
    }
    
    setFilteredEmails(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [emails, searchText, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredEmails.length / emailsPerPage);
  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * emailsPerPage,
    currentPage * emailsPerPage
  );

  const handleRefresh = () => {
    setSearchText('');
    setDefaultDateRange();
    loadEmails();
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (range) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'lastWeek':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'last3Months':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        // Don't change dates, let user select custom dates
        return;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleEmailClick = (email: EmailMessage) => {
    setSelectedEmail(email);
    setShowEmailDialog(true);
  };

  const handleCloseEmailDialog = () => {
    setShowEmailDialog(false);
    setSelectedEmail(null);
  };

  const handleReply = () => {
    if (selectedEmail) {
      setReplyTo(selectedEmail.from);
      setReplySubject(selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
      setReplyBody('');
      setShowReplyDialog(true);
    }
  };

  const handleCloseReplyDialog = () => {
    setShowReplyDialog(false);
    setReplyTo('');
    setReplySubject('');
    setReplyBody('');
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyTo || !replySubject || !replyBody) {
      return;
    }

    try {
      setSendingReply(true);
      setError(null);

      await emailClientService.replyToEmail({
        to: replyTo,
        subject: replySubject,
        body: replyBody,
        isHtml: false,
        originalMessageId: selectedEmail.id
      });

      // Show success message and close dialog
      setSuccessMessage(t('REPLY_SENT_SUCCESS'));
      setShowSuccessSnackbar(true);
      handleCloseReplyDialog();
      handleCloseEmailDialog();
      
      // Refresh emails to show the new reply
      loadEmails();
    } catch (err) {
      setError(t('FAILED_SEND_REPLY'));
      console.error('Error sending reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const isEmailInbound = (email: EmailMessage) => {
    // Email is inbound if it's FROM the customer
    return email.from.toLowerCase() === customerEmail.toLowerCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Typography variant="h6">
          {tCustomers('EMAILS_SECTION')} - {customerName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({customerEmail})
        </Typography>
      </Box>

      {/* Search, Date Filter and Refresh */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder={t('SEARCH_EMAILS')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('DATE_RANGE')}</InputLabel>
          <Select
            value={dateRange}
            label={t('DATE_RANGE')}
            onChange={(e) => handleDateRangeChange(e.target.value)}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="lastWeek">Last Week</MenuItem>
            <MenuItem value="lastMonth">Last Month</MenuItem>
            <MenuItem value="last3Months">Last 3 Months</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
        
        {dateRange === 'custom' && (
          <>
            <TextField
              type="date"
              label={t('START_DATE')}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              type="date"
              label={t('END_DATE')}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            />
          </>
        )}
        
        <Tooltip title={t('REFRESH')}>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Email Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredEmails.length} {t('EMAILS_FOUND')} {filteredEmails.length !== emails.length && `(of ${emails.length} total)`}
      </Typography>

      {/* Compact Email List */}
      <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        {paginatedEmails.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={filteredEmails.length === 0 ? t('NO_EMAILS') : t('NO_EMAILS_MATCH_FILTERS')}
              secondary={filteredEmails.length === 0 ? t('NO_EMAILS_FOR_CUSTOMER') : t('TRY_ADJUSTING_FILTERS')}
            />
          </ListItem>
        ) : (
          paginatedEmails.map((email) => (
            <ListItem
              key={email.id}
              onClick={() => handleEmailClick(email)}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                py: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon color={email.isRead ? 'disabled' : 'primary'} />
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" noWrap sx={{ flexGrow: 1, fontWeight: email.isRead ? 'normal' : 'bold' }}>
                      {formatDate(email.date)} {formatTime(email.date)} - {email.subject}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        size="small" 
                        label={isEmailInbound(email) ? t('INBOUND') : t('OUTBOUND')}
                        color={isEmailInbound(email) ? 'success' : 'info'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {email.hasAttachments && (
                      <Chip size="small" label="📎" sx={{ height: 20 }} />
                    )}
                  </Typography>
                }
              />
            </ListItem>
          ))
        )}
      </List>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setCurrentPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Email Detail Dialog */}
      <Dialog open={showEmailDialog} onClose={handleCloseEmailDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">
                {selectedEmail?.subject}
              </Typography>
              {selectedEmail && (
                <Chip 
                  size="small" 
                  label={isEmailInbound(selectedEmail) ? t('INBOUND') : t('OUTBOUND')}
                  color={isEmailInbound(selectedEmail) ? 'success' : 'info'}
                />
              )}
            </Box>
            <IconButton onClick={handleCloseEmailDialog}>
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEmail && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('FROM')}: {selectedEmail.fromName || selectedEmail.from}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('TO')}: {selectedEmail.to}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('DATE')}: {formatDate(selectedEmail.date)} {formatTime(selectedEmail.date)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  p: 2,
                  borderRadius: 1,
                  minHeight: 200,
                  fontSize: '0.875rem',
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                  '& a': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                }}
              >
                {selectedEmail.htmlBody ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedEmail.htmlBody
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedEmail.body}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedEmail && isEmailInbound(selectedEmail) && (
            <Button onClick={handleReply} startIcon={<ReplyIcon />}>
              {t('REPLY')}
            </Button>
          )}
          <Button onClick={handleCloseEmailDialog}>
            {t('CLOSE')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onClose={handleCloseReplyDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('REPLY_TO_EMAIL')}</Typography>
            <IconButton onClick={handleCloseReplyDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label={t('TO')}
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="recipient@example.com"
              required
            />
            <TextField
              fullWidth
              label={t('SUBJECT')}
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label={t('MESSAGE')}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              multiline
              rows={12}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReplyDialog}>{t('CANCEL')}</Button>
          <Button
            variant="contained"
            startIcon={sendingReply ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSendReply}
            disabled={sendingReply || !replyTo || !replySubject || !replyBody}
          >
            {sendingReply ? t('SENDING') : t('SEND')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbar-root': {
            backgroundColor: 'success.main',
          }
        }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          sx={{ 
            width: '100%',
            backgroundColor: 'success.main',
            color: 'success.contrastText'
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
