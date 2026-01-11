import type { Customer, CustomerOrder, PhoneCall, CreateCustomerData, UpdateCustomerData, CreatePhoneCallData } from '../../../services/customerService';
import type { AddressValidationResult } from '../../../utils/addressValidation';

export type { Customer, CustomerOrder, PhoneCall, CreateCustomerData, UpdateCustomerData, CreatePhoneCallData };

export interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}

export interface AddCustomerDialogProps extends CustomerDialogProps {}

export interface EditCustomerDialogProps extends CustomerDialogProps {
  customer: Customer | null;
}

export interface DeleteCustomerDialogProps extends CustomerDialogProps {
  customer: Customer | null;
}

export interface CustomerOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  t: (key: string) => string;
  formatDateTime: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

export interface CustomerPhoneCallsDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onPhoneCallChange: () => void;
  t: (key: string) => string;
  formatDateTime: (date: string) => string;
}

export interface AddressValidationState {
  result: AddressValidationResult | null;
  isValidating: boolean;
}
