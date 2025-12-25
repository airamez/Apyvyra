import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { authService } from '../../services/authService';

export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'dropdown';
export type Operator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'startsWith' | 'endsWith' | 'between';

export interface DropdownConfig {
  endpoint: string;
  idField: string;
  nameField: string;
  staticOptions?: Array<{ id: any; name: string }>;
}

export interface FilterFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  operators?: Operator[];
  defaultOperator?: Operator;
  dropdownConfig?: DropdownConfig;
  placeholder?: string;
  section?: string; // Optional section name for grouping fields
}

export interface FilterConfig {
  fields: FilterFieldConfig[];
  onSearch: (filters: FilterValues) => void;
  onClear?: () => void;
  collapsibleSections?: boolean; // Enable collapsible sections for grouped fields
  collapsible?: boolean; // Make the entire filter collapsible
}

export interface FilterValue {
  field: string;
  operator: Operator;
  value: any;
  valueTo?: any; // For 'between' operator
}

export type FilterValues = FilterValue[];

interface FilterComponentProps {
  config: FilterConfig;
  hasMoreRecords?: boolean;
  totalCount?: number;
  currentCount?: number;
}

const operatorLabels: Record<Operator, string> = {
  eq: '=',
  ne: '≠',
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  contains: '~',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  between: 'Between',
};

const defaultOperatorsByType: Record<FieldType, Operator[]> = {
  string: ['contains', 'eq', 'ne', 'startsWith', 'endsWith'],
  number: ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'between'],
  date: ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'between'],
  boolean: ['eq'],
  dropdown: ['eq', 'ne'],
};

export default function FilterComponent({
  config,
  hasMoreRecords = false,
  totalCount = 0,
  currentCount = 0,
}: FilterComponentProps) {
  const [filters, setFilters] = useState<Record<string, { operator: Operator; value: any; valueTo?: any }>>({});
  const [dropdownData, setDropdownData] = useState<Record<string, Array<{ id: any; name: string }>>>({});

  useEffect(() => {
    loadDropdownData();
  }, [config.fields]);

  const loadDropdownData = async () => {
    const dropdownFields = config.fields.filter(f => f.type === 'dropdown' && f.dropdownConfig);
    
    for (const field of dropdownFields) {
      if (field.dropdownConfig?.staticOptions) {
        setDropdownData(prev => ({
          ...prev,
          [field.name]: field.dropdownConfig!.staticOptions!,
        }));
      } else if (field.dropdownConfig?.endpoint) {
        try {
          const token = authService.getToken();
          const response = await fetch(field.dropdownConfig.endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          
          const options = Array.isArray(data) ? data : data.data || [];
          const mappedOptions = options.map((item: any) => ({
            id: item[field.dropdownConfig!.idField],
            name: item[field.dropdownConfig!.nameField],
          }));
          
          setDropdownData(prev => ({
            ...prev,
            [field.name]: mappedOptions,
          }));
        } catch (error) {
          console.error(`Error loading dropdown data for ${field.name}:`, error);
        }
      }
    }
  };

  const handleFilterChange = (fieldName: string, key: 'operator' | 'value' | 'valueTo', value: any) => {
    setFilters(prev => {
      const currentFilter = prev[fieldName] || { operator: getDefaultOperator(fieldName), value: '' };
      
      // If operator is changing, reset value and valueTo
      if (key === 'operator' && currentFilter.operator !== value) {
        return {
          ...prev,
          [fieldName]: {
            operator: value as Operator,
            value: '',
            valueTo: undefined,
          },
        };
      }
      
      return {
        ...prev,
        [fieldName]: {
          ...currentFilter,
          [key]: value,
        },
      };
    });
  };

  const getDefaultOperator = (fieldName: string): Operator => {
    const field = config.fields.find(f => f.name === fieldName);
    if (!field) return 'eq';
    
    if (field.defaultOperator) return field.defaultOperator;
    
    const operators = field.operators || defaultOperatorsByType[field.type];
    return operators[0];
  };

  const getOperators = (field: FilterFieldConfig): Operator[] => {
    return field.operators || defaultOperatorsByType[field.type];
  };

  const handleSearch = () => {
    const filterValues: FilterValues = Object.entries(filters)
      .filter(([_, filterData]) => {
        if (filterData.operator === 'between') {
          return filterData.value !== undefined && filterData.value !== '' && 
                 filterData.valueTo !== undefined && filterData.valueTo !== '';
        }
        return filterData.value !== undefined && filterData.value !== '';
      })
      .map(([field, filterData]) => ({
        field,
        operator: filterData.operator,
        value: filterData.value,
        valueTo: filterData.valueTo,
      }));

    config.onSearch(filterValues);
  };

  const handleClear = () => {
    setFilters({});
    if (config.onClear) {
      config.onClear();
    } else {
      config.onSearch([]);
    }
  };

  const renderFilterField = (field: FilterFieldConfig) => {
    const filterData = filters[field.name] || { operator: getDefaultOperator(field.name), value: '' };
    const operators = getOperators(field);
    const showOperatorSelect = operators.length > 1;

    return (
      <Grid key={field.name} size={{ xs: 12, md: showOperatorSelect ? 6 : 4 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showOperatorSelect && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterData.operator}
                onChange={(e) => handleFilterChange(field.name, 'operator', e.target.value as Operator)}
              >
                {operators.map(op => (
                  <MenuItem key={op} value={op}>
                    {operatorLabels[op]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {field.type === 'dropdown' ? (
            <FormControl fullWidth size="small">
              <InputLabel>{field.label}</InputLabel>
              <Select
                value={filterData.value || ''}
                onChange={(e) => handleFilterChange(field.name, 'value', e.target.value)}
                label={field.label}
              >
                <MenuItem value="">All</MenuItem>
                {(dropdownData[field.name] || []).map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : field.type === 'boolean' ? (
            <FormControl fullWidth size="small">
              <InputLabel>{field.label}</InputLabel>
              <Select
                value={filterData.value === undefined ? '' : filterData.value.toString()}
                onChange={(e) => handleFilterChange(field.name, 'value', e.target.value === '' ? undefined : e.target.value === 'true')}
                label={field.label}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          ) : filterData.operator === 'between' ? (
            <>
              <TextField
                fullWidth
                size="small"
                label={`${field.label} From`}
                type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                value={filterData.value || ''}
                onChange={(e) => handleFilterChange(field.name, 'value', e.target.value)}
                placeholder={field.placeholder}
                InputLabelProps={{ shrink: true }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <TextField
                fullWidth
                size="small"
                label={`${field.label} To`}
                type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                value={filterData.valueTo || ''}
                onChange={(e) => handleFilterChange(field.name, 'valueTo', e.target.value)}
                placeholder={field.placeholder}
                InputLabelProps={{ shrink: true }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </>
          ) : (
            <TextField
              fullWidth
              size="small"
              label={field.label}
              type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              value={filterData.value || ''}
              onChange={(e) => handleFilterChange(field.name, 'value', e.target.value)}
              placeholder={field.placeholder}
              InputLabelProps={{ shrink: true }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          )}
        </Box>
      </Grid>
    );
  };

  // Group fields by section
  const groupedFields = config.fields.reduce((acc, field) => {
    const section = field.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, FilterFieldConfig[]>);

  const mainFields = groupedFields['main'] || [];
  const sections = Object.entries(groupedFields).filter(([key]) => key !== 'main');

  const filterContent = (
    <CardContent>
      <Grid container spacing={2}>
        {mainFields.map(field => renderFilterField(field))}
        
        {config.collapsibleSections && sections.map(([sectionName, sectionFields]) => (
          <Grid key={sectionName} size={{ xs: 12 }}>
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{sectionName}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {sectionFields.map(field => renderFilterField(field))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
        
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterAltOffIcon />}
              onClick={handleClear}
            >
              Clear Filters
            </Button>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  );

  return (
    <Card sx={{ mb: 3 }}>
      {config.collapsible ? (
        <Accordion defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
              <Typography variant="h6">Search Filters</Typography>
              {hasMoreRecords && (
                <Alert severity="warning" sx={{ py: 0.5, flexGrow: 1 }}>
                  Showing {currentCount} of {totalCount} results. Please refine your filters.
                </Alert>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {filterContent}
          </AccordionDetails>
        </Accordion>
      ) : (
        <>
          {hasMoreRecords && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Showing {currentCount} of {totalCount} results. Please refine your filters.
            </Alert>
          )}
          {filterContent}
        </>
      )}
    </Card>
  );
}
