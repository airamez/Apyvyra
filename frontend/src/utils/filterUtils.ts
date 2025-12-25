import type { FilterValues, Operator, FilterValue } from '../components/admin/FilterComponent';

/**
 * Converts filter values to URL query parameters for backend API
 * 
 * Operator mapping:
 * - eq: field_eq=value
 * - ne: field_ne=value
 * - lt: field_lt=value
 * - lte: field_lte=value
 * - gt: field_gt=value
 * - gte: field_gte=value
 * - contains: field_contains=value
 * - startsWith: field_startsWith=value
 * - endsWith: field_endsWith=value
 * - between: field_from=value&field_to=valueTo
 */
export function filtersToQueryParams(filters: FilterValues): URLSearchParams {
  const params = new URLSearchParams();

  filters.forEach((filter: FilterValue) => {
    const { field, operator, value, valueTo } = filter;

    if (value === undefined || value === null || value === '') {
      return;
    }

    switch (operator) {
      case 'eq':
        params.append(`${field}_eq`, value.toString());
        break;
      case 'ne':
        params.append(`${field}_ne`, value.toString());
        break;
      case 'lt':
        params.append(`${field}_lt`, value.toString());
        break;
      case 'lte':
        params.append(`${field}_lte`, value.toString());
        break;
      case 'gt':
        params.append(`${field}_gt`, value.toString());
        break;
      case 'gte':
        params.append(`${field}_gte`, value.toString());
        break;
      case 'contains':
        params.append(`${field}_contains`, value.toString());
        break;
      case 'startsWith':
        params.append(`${field}_startsWith`, value.toString());
        break;
      case 'endsWith':
        params.append(`${field}_endsWith`, value.toString());
        break;
      case 'between':
        if (valueTo !== undefined && valueTo !== null && valueTo !== '') {
          params.append(`${field}_from`, value.toString());
          params.append(`${field}_to`, valueTo.toString());
        }
        break;
    }
  });

  return params;
}

/**
 * Converts simple filter object to FilterValues format
 * Used for backward compatibility with existing code
 */
export function simpleFiltersToFilterValues(filters: Record<string, any>): FilterValues {
  return Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([field, value]) => ({
      field,
      operator: 'contains' as Operator,
      value,
    }));
}
