import type { FilterConfig, FilterFieldConfig } from '../components/admin/FilterComponent';
import { API_ENDPOINTS } from './api';

/**
 * Reusable audit fields configuration
 * These fields are present in all database tables for tracking creation and updates
 */
export const auditFieldsConfig: FilterFieldConfig[] = [
  {
    name: 'createdAt',
    label: 'Created Date',
    type: 'date',
    operators: ['eq', 'lt', 'lte', 'gt', 'gte', 'between'],
    defaultOperator: 'between',
    section: 'Auditing',
  },
  {
    name: 'createdBy',
    label: 'Created By',
    type: 'dropdown',
    dropdownConfig: {
      endpoint: API_ENDPOINTS.USER.LIST,
      idField: 'id',
      nameField: 'username',
    },
    section: 'Auditing',
  },
  {
    name: 'updatedAt',
    label: 'Updated Date',
    type: 'date',
    operators: ['eq', 'lt', 'lte', 'gt', 'gte', 'between'],
    defaultOperator: 'between',
    section: 'Auditing',
  },
  {
    name: 'updatedBy',
    label: 'Updated By',
    type: 'dropdown',
    dropdownConfig: {
      endpoint: API_ENDPOINTS.USER.LIST,
      idField: 'id',
      nameField: 'username',
    },
    section: 'Auditing',
  },
];

/**
 * Filter configuration for Products page
 */
export const productFilterConfig: Pick<FilterConfig, 'fields' | 'collapsible' | 'collapsibleSections'> = {
  collapsible: true,
  collapsibleSections: true,
  fields: [
    {
      name: 'name',
      label: 'Product Name',
      type: 'string',
      operators: ['contains', 'eq', 'startsWith', 'endsWith'],
      defaultOperator: 'contains',
      placeholder: 'Search by name...',
    },
    {
      name: 'sku',
      label: 'SKU',
      type: 'string',
      operators: ['contains', 'eq', 'startsWith'],
      defaultOperator: 'contains',
      placeholder: 'Search by SKU...',
    },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'dropdown',
      dropdownConfig: {
        endpoint: API_ENDPOINTS.PRODUCT_CATEGORY.LIST,
        idField: 'id',
        nameField: 'name',
      },
    },
    {
      name: 'brand',
      label: 'Brand',
      type: 'string',
      operators: ['contains', 'eq'],
      defaultOperator: 'contains',
    },
    {
      name: 'manufacturer',
      label: 'Manufacturer',
      type: 'string',
      operators: ['contains', 'eq'],
      defaultOperator: 'contains',
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      operators: ['eq', 'lt', 'lte', 'gt', 'gte', 'between'],
      defaultOperator: 'between',
    },
    {
      name: 'stockQuantity',
      label: 'Stock Quantity',
      type: 'number',
      operators: ['eq', 'lt', 'lte', 'gt', 'gte'],
      defaultOperator: 'gte',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'boolean',
    },
    // Audit fields
    ...auditFieldsConfig,
  ],
};

/**
 * Filter configuration for Categories page
 */
export const categoryFilterConfig: Pick<FilterConfig, 'fields' | 'collapsible' | 'collapsibleSections'> = {
  collapsible: true,
  collapsibleSections: true,
  fields: [
    {
      name: 'name',
      label: 'Category Name',
      type: 'string',
      operators: ['contains', 'eq', 'startsWith'],
      defaultOperator: 'contains',
      placeholder: 'Search by name...',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'string',
      operators: ['contains'],
      defaultOperator: 'contains',
      placeholder: 'Search in description...',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'boolean',
    },
    {
      name: 'parentCategoryId',
      label: 'Parent Category',
      type: 'dropdown',
      dropdownConfig: {
        endpoint: API_ENDPOINTS.PRODUCT_CATEGORY.LIST,
        idField: 'id',
        nameField: 'name',
      },
    },
    // Audit fields
    ...auditFieldsConfig,
  ],
};

/**
 * Filter configuration for Staff page
 */
export const staffFilterConfig: Pick<FilterConfig, 'fields' | 'collapsible' | 'collapsibleSections'> = {
  collapsible: true,
  collapsibleSections: true,
  fields: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'string',
      operators: ['contains', 'eq', 'startsWith'],
      defaultOperator: 'contains',
      placeholder: 'Search by name...',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'string',
      operators: ['contains', 'eq', 'startsWith'],
      defaultOperator: 'contains',
      placeholder: 'Search by email...',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'dropdown',
      dropdownConfig: {
        endpoint: '',
        idField: 'id',
        nameField: 'name',
        staticOptions: [
          { id: 0, name: 'Pending Confirmation' },
          { id: 1, name: 'Active' },
          { id: 2, name: 'Inactive' },
        ],
      },
    },
    // Audit fields
    ...auditFieldsConfig,
  ],
};
