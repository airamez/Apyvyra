import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Paper,
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
  TextField,
  Divider,
  Chip,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import OutboxIcon from '@mui/icons-material/Outbox';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmailIcon from '@mui/icons-material/Email';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DraftsIcon from '@mui/icons-material/Drafts';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import CreateIcon from '@mui/icons-material/Create';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { emailClientService, type EmailMessage, type EmailFilterRequest } from '../../services/emailClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { useFormatting } from '../../hooks/useFormatting';

export default function EmailClient() {
  const { t } = useTranslation('EmailClient');
  const { formatDate, formatTime } = useFormatting();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Selected email state
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  
  // Compose dialog state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Reply state
  const [replyMode, setReplyMode] = useState(false);
  const [originalEmail, setOriginalEmail] = useState<EmailMessage | null>(null);
  
  // Folder state
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent'>('inbox');
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterFromEmail, setFilterFromEmail] = useState('');
  const [filterSearchText, setFilterSearchText] = useState('');

  const loadEmails = useCallback(async (filter?: EmailFilterRequest) => {
    try {
      setLoading(true);
      setError(null);
      const filterWithFolder = { ...filter, folder: currentFolder };
      const data = await emailClientService.getEmails(filterWithFolder);
      setEmails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    loadEmails();
    setSelectedEmail(null);
  }, [loadEmails]);

  const handleApplyFilters = () => {
    const filter: EmailFilterRequest = {};
    
    if (filterStartDate) {
      filter.startDate = filterStartDate;
    }
    if (filterEndDate) {
      filter.endDate = filterEndDate;
    }
    if (filterFromEmail) {
      filter.fromEmail = filterFromEmail;
    }
    if (filterSearchText) {
      filter.searchText = filterSearchText;
    }
    
    loadEmails(filter);
  };

  const handleClearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterFromEmail('');
    setFilterSearchText('');
    loadEmails();
  };

  const handleSelectEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
  };

  const handleOpenCompose = () => {
    setReplyMode(false);
    setOriginalEmail(null);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setComposeCc('');
    setComposeOpen(true);
  };

  const handleOpenReply = (email: EmailMessage) => {
    setReplyMode(true);
    setOriginalEmail(email);
    setComposeTo(email.from);
    setComposeSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${email.fromName || email.from}\nDate: ${formatDate(email.date)}\nSubject: ${email.subject}\n\n${email.body}`);
    setComposeCc('');
    setComposeOpen(true);
  };

  const handleCloseCompose = () => {
    setComposeOpen(false);
    setReplyMode(false);
    setOriginalEmail(null);
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      setError(t('FILL_REQUIRED_FIELDS'));
      return;
    }

    try {
      setSendingEmail(true);
      setError(null);

      if (replyMode && originalEmail) {
        await emailClientService.replyToEmail({
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
          cc: composeCc || undefined,
          originalMessageId: originalEmail.id,
        });
      } else {
        await emailClientService.sendEmail({
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
          cc: composeCc || undefined,
        });
      }

      setSuccessMessage(replyMode ? t('REPLY_SENT_SUCCESS') : t('EMAIL_SENT_SUCCESS'));
      handleCloseCompose();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatSmartDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return formatTime(dateString);
    }
    return formatDate(dateString);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              {t('TITLE')}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('FOLDER')}</InputLabel>
              <Select
                value={currentFolder}
                label={t('FOLDER')}
                onChange={(e) => setCurrentFolder(e.target.value as 'inbox' | 'sent')}
              >
                <MenuItem value="inbox">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InboxIcon fontSize="small" />
                    {t('INBOX')}
                  </Box>
                </MenuItem>
                <MenuItem value="sent">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <OutboxIcon fontSize="small" />
                    {t('SENT')}
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<CreateIcon />}
              onClick={handleOpenCompose}
            >
              {t('COMPOSE')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {t('FILTERS')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => loadEmails()}
              disabled={loading}
            >
              {t('REFRESH')}
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Filter Emails
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('START_DATE')}
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('END_DATE')}
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('FROM_EMAIL')}
                  value={filterFromEmail}
                  onChange={(e) => setFilterFromEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('SEARCH')}
                  value={filterSearchText}
                  onChange={(e) => setFilterSearchText(e.target.value)}
                  placeholder={t('SEARCH_PLACEHOLDER')}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={handleClearFilters}>
                    {t('CLEAR')}
                  </Button>
                  <Button variant="contained" onClick={handleApplyFilters}>
                    {t('APPLY_FILTERS')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Main Content */}
        <Grid container spacing={2}>
          {/* Email List */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : emails.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No emails found</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {emails.map((email, index) => (
                    <Box key={email.id}>
                      <ListItem
                        component="div"
                        onClick={() => handleSelectEmail(email)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: selectedEmail?.id === email.id ? 'action.selected' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <ListItemIcon>
                          {email.isRead ? (
                            <DraftsIcon color="action" />
                          ) : (
                            <MailOutlineIcon color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: email.isRead ? 'normal' : 'bold',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '70%',
                                }}
                              >
                                {currentFolder === 'sent' ? `To: ${email.to}` : (email.fromName || email.from)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatSmartDate(email.date)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: email.isRead ? 'normal' : 'bold',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {email.subject}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                  }}
                                >
                                  {email.body.substring(0, 50)}...
                                </Typography>
                                {email.hasAttachments && (
                                  <AttachFileIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < emails.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Email Detail */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ height: 'calc(100vh - 280px)', overflow: 'auto', p: 3 }}>
              {selectedEmail ? (
                <Box>
                  {/* Email Header */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h5" component="h2">
                        {selectedEmail.subject}
                      </Typography>
                      <Tooltip title="Reply">
                        <IconButton color="primary" onClick={() => handleOpenReply(selectedEmail)}>
                          <ReplyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {(selectedEmail.fromName || selectedEmail.from).charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">
                          {selectedEmail.fromName || selectedEmail.from}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedEmail.from}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {formatFullDate(selectedEmail.date)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      To: {selectedEmail.to}
                    </Typography>
                    
                    {selectedEmail.hasAttachments && (
                      <Chip
                        icon={<AttachFileIcon />}
                        label={t('HAS_ATTACHMENTS')}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  {/* Email Body */}
                  <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {selectedEmail.htmlBody ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                    ) : (
                      <Typography variant="body1">{selectedEmail.body}</Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: 'text.secondary',
                  }}
                >
                  <MailOutlineIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">Select an email to read</Typography>
                  <Typography variant="body2">Choose an email from the list to view its contents</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Compose Dialog */}
        <Dialog open={composeOpen} onClose={handleCloseCompose} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {replyMode ? t('REPLY_TO_EMAIL') : t('COMPOSE_NEW_EMAIL')}
              <IconButton onClick={handleCloseCompose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={t('TO')}
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="recipient@example.com"
                required
              />
              <TextField
                fullWidth
                label={t('CC')}
                value={composeCc}
                onChange={(e) => setComposeCc(e.target.value)}
                placeholder="cc@example.com (optional)"
              />
              <TextField
                fullWidth
                label={t('SUBJECT')}
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label={t('MESSAGE')}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                multiline
                rows={12}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCompose}>{t('CANCEL')}</Button>
            <Button
              variant="contained"
              startIcon={sendingEmail ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={handleSendEmail}
              disabled={sendingEmail || !composeTo || !composeSubject || !composeBody}
            >
              {sendingEmail ? t('SENDING') : t('SEND')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
  );
}
