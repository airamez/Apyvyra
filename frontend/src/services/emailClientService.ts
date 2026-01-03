import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch } from '../utils/apiErrorHandler';

export interface EmailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  date: string;
  isRead: boolean;
  hasAttachments: boolean;
}

export interface EmailFilterRequest {
  startDate?: string;
  endDate?: string;
  fromEmail?: string;
  searchText?: string;
  folder?: string;
  limit?: number;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string;
}

export interface ReplyEmailRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string;
  originalMessageId?: string;
}

const EMAIL_CLIENT_BASE = `${API_ENDPOINTS.BASE_URL}/api/email-client`;

export const emailClientService = {
  async getEmails(filter?: EmailFilterRequest): Promise<EmailMessage[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.fromEmail) params.append('fromEmail', filter.fromEmail);
      if (filter.searchText) params.append('searchText', filter.searchText);
      if (filter.folder) params.append('folder', filter.folder);
      if (filter.limit) params.append('limit', filter.limit.toString());
    }
    
    const url = params.toString()
      ? `${EMAIL_CLIENT_BASE}?${params.toString()}`
      : EMAIL_CLIENT_BASE;
    
    return apiFetch<EmailMessage[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async getEmailById(id: string): Promise<EmailMessage> {
    return apiFetch<EmailMessage>(`${EMAIL_CLIENT_BASE}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async sendEmail(request: SendEmailRequest): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`${EMAIL_CLIENT_BASE}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });
  },

  async replyToEmail(request: ReplyEmailRequest): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`${EMAIL_CLIENT_BASE}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });
  },
};
