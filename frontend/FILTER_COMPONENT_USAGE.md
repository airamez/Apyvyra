# FilterComponent Usage Guide

The `FilterComponent` is a reusable, configurable component for building dynamic filter forms with support for multiple field types and operators.

## Features

- **Multiple Field Types**: string, number, date, boolean, dropdown
- **Flexible Operators**: eq, ne, lt, lte, gt, gte, contains, startsWith, endsWith, between
- **Dynamic Dropdowns**: Load options from backend endpoints or use static options
- **Automatic Query Building**: Converts filters to backend-compatible query parameters
- **Inline Warning**: Shows warning when more records exist
- **Keyboard Support**: Press Enter in any field to trigger search

## UI Patterns

### Always Visible Labels

All filter field labels remain visible even when the field is empty. This is achieved by setting `InputLabelProps={{ shrink: true }}` on all TextField components, providing consistent UX and making field purposes always clear to users.

## Quick Start

### 1. Define Filter Configuration

Create a filter configuration in `src/config/filterConfigs.ts`:

```typescript
import type { FilterConfig } from '../components/FilterComponent';
import { API_ENDPOINTS } from './api';
import { auditFieldsConfig } from './filterConfigs';

export const productFilterConfig: Omit<FilterConfig, 'onSearch' | 'onClear'> = {
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
      name: 'price',
      label: 'Price',
      type: 'number',
      operators: ['eq', 'lt', 'lte', 'gt', 'gte', 'between'],
      defaultOperator: 'between',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'boolean',
    },
    // Add standard audit fields
    ...auditFieldsConfig,
  ],
};
```

### 2. Use in Component

```typescript
import { useState, useEffect } from 'react';
import FilterComponent, { type FilterValues } from '../components/FilterComponent';
import { productFilterConfig } from '../config/filterConfigs';
import { productService } from '../services/productService';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadProducts = async (filters?: FilterValues) => {
    const response = await productService.getAll(filters);
    setProducts(response.data);
    setHasMoreRecords(response.metadata.hasMoreRecords);
    setTotalCount(response.metadata.totalCount);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearch = (filters: FilterValues) => {
    loadProducts(filters);
  };

  const handleClear = () => {
    loadProducts();
  };

  return (
    <Container>
      <FilterComponent
        config={{
          ...productFilterConfig,
          onSearch: handleSearch,
          onClear: handleClear,
        }}
        hasMoreRecords={hasMoreRecords}
        totalCount={totalCount}
        currentCount={products.length}
      />
      
      {/* Your data grid here */}
    </Container>
  );
}
```

## Audit Fields

All database tables include standard audit fields for tracking creation and updates. These are available as a reusable configuration:

```typescript
import { auditFieldsConfig } from '../config/filterConfigs';

export const myFilterConfig = {
  fields: [
    // Your custom fields
    { name: 'name', label: 'Name', type: 'string' },
    { name: 'status', label: 'Status', type: 'boolean' },
    
    // Add audit fields
    ...auditFieldsConfig,
  ],
};
```

**Audit Fields Included**:
- `createdAt` (date): Created date with between/lt/lte/gt/gte operators
- `createdBy` (dropdown): User who created the record
- `updatedAt` (date): Last updated date with between/lt/lte/gt/gte operators
- `updatedBy` (dropdown): User who last updated the record

**Example Queries**:
- Created in last 7 days: `?createdAt_gte=2024-12-17`
- Created between dates: `?createdAt_from=2024-01-01&createdAt_to=2024-12-31`
- Created by specific user: `?createdBy=5`
- Updated after date: `?updatedAt_gt=2024-12-01`

## Field Types

### String Fields

```typescript
{
  name: 'name',
  label: 'Product Name',
  type: 'string',
  operators: ['contains', 'eq', 'startsWith', 'endsWith'],
  defaultOperator: 'contains',
  placeholder: 'Search by name...',
}
```

**Supported Operators**:
- `contains` (~): Partial match (default for strings)
- `eq` (=): Exact match
- `ne` (≠): Not equal
- `startsWith`: Starts with
- `endsWith`: Ends with

### Number Fields

```typescript
{
  name: 'price',
  label: 'Price',
  type: 'number',
  operators: ['eq', 'lt', 'lte', 'gt', 'gte', 'between'],
  defaultOperator: 'gte',
}
```

**Supported Operators**:
- `eq` (=): Equal to
- `ne` (≠): Not equal to
- `lt` (<): Less than
- `lte` (≤): Less than or equal
- `gt` (>): Greater than
- `gte` (≥): Greater than or equal
- `between`: Between two values (shows two input fields)

### Date Fields

```typescript
{
  name: 'createdAt',
  label: 'Created Date',
  type: 'date',
  operators: ['eq', 'lt', 'lte', 'gt', 'gte', 'between'],
  defaultOperator: 'between',
}
```

**Supported Operators**: Same as number fields

### Boolean Fields

```typescript
{
  name: 'isActive',
  label: 'Active',
  type: 'boolean',
}
```

**Operators**: Only `eq` (shows Yes/No/All dropdown)

### Dropdown Fields

#### From Backend Endpoint

```typescript
{
  name: 'categoryId',
  label: 'Category',
  type: 'dropdown',
  dropdownConfig: {
    endpoint: API_ENDPOINTS.PRODUCT_CATEGORY.LIST,
    idField: 'id',
    nameField: 'name',
  },
}
```

#### Static Options

```typescript
{
  name: 'status',
  label: 'Status',
  type: 'dropdown',
  dropdownConfig: {
    staticOptions: [
      { id: 'pending', name: 'Pending' },
      { id: 'approved', name: 'Approved' },
      { id: 'rejected', name: 'Rejected' },
    ],
    idField: 'id',
    nameField: 'name',
  },
}
```

## Backend Query Parameters

The FilterComponent automatically converts filter values to query parameters:

### Examples

**Filter**: `name` contains "nike"
**Query**: `?name=nike`

**Filter**: `price` greater than 100
**Query**: `?price_gt=100`

**Filter**: `price` between 50 and 200
**Query**: `?price_from=50&price_to=200`

**Filter**: `categoryId` equals 5
**Query**: `?categoryId=5`

**Filter**: `name` starts with "Pro"
**Query**: `?name_startsWith=Pro`

### Operator Suffixes

- `eq`: `field=value`
- `ne`: `field_ne=value`
- `lt`: `field_lt=value`
- `lte`: `field_lte=value`
- `gt`: `field_gt=value`
- `gte`: `field_gte=value`
- `contains`: `field=value`
- `startsWith`: `field_startsWith=value`
- `endsWith`: `field_endsWith=value`
- `between`: `field_from=value1&field_to=value2`

## Backend Implementation

The backend uses `QueryFilterHelper` to automatically parse and apply filters:

```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<ProductResponse>>> GetProducts()
{
    var query = _context.Products
        .Include(p => p.Category)
        .AsQueryable();

    // Apply dynamic filters from query parameters
    query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);

    // Apply limit and return
    var products = await ExecuteLimitedQueryAsync(query);
    return Ok(products);
}
```

## Complete Example: Products Component

```typescript
import { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import FilterComponent, { type FilterValues } from '../components/FilterComponent';
import { productFilterConfig } from '../config/filterConfigs';
import { productService } from '../services/productService';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadProducts = async (filters?: FilterValues) => {
    try {
      setLoading(true);
      const response = await productService.getAll(filters);
      setProducts(response.data);
      setHasMoreRecords(response.metadata.hasMoreRecords);
      setTotalCount(response.metadata.totalCount);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Products
      </Typography>

      <FilterComponent
        config={{
          ...productFilterConfig,
          onSearch: loadProducts,
          onClear: () => loadProducts(),
        }}
        hasMoreRecords={hasMoreRecords}
        totalCount={totalCount}
        currentCount={products.length}
      />

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Product Inventory</Typography>
            <Chip label={`${products.length} products`} color="primary" />
          </Box>
          
          <DataGrid
            rows={products}
            columns={columns}
            loading={loading}
            disableColumnFilter
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            autoHeight
          />
        </CardContent>
      </Card>
    </Container>
  );
}
```

## Benefits

1. **Reusable**: Same component for all pages with grids
2. **Configurable**: JSON-based configuration for fields and operators
3. **Type-Safe**: Full TypeScript support
4. **Flexible**: Supports all common filter scenarios
5. **Backend-Integrated**: Automatic query parameter generation
6. **User-Friendly**: Inline warnings, keyboard shortcuts, clear UI
7. **Maintainable**: Centralized filter logic and configuration

## Migration from Old Filter Forms

**Before** (hardcoded filter form):
```typescript
const [filters, setFilters] = useState({ search: '', categoryId: undefined });
// 50+ lines of filter UI code
```

**After** (FilterComponent):
```typescript
<FilterComponent
  config={{ ...productFilterConfig, onSearch: loadProducts }}
  hasMoreRecords={hasMoreRecords}
  totalCount={totalCount}
  currentCount={products.length}
/>
```

Reduces code by ~80% and makes filters consistent across all pages!
