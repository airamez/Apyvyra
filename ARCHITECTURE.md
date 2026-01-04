

# Apyvyra Architecture Guide

## Overview

Apyvyra is a modern full-stack ERP application with a clean layered architecture:

- **Frontend**: React + TypeScript + Material-UI + Vite
- **Backend**: ASP.NET Core + Entity Framework Core + PostgreSQL
- **Database**: PostgreSQL with proper indexing and audit trails
- **Authentication**: JWT-based with role-based access control
- **Error Handling**: Centralized header-based error system
- **Filtering**: Server-side filtering with query limits

>Note: We will try keep everything on the latest version.

## Technology Stack

### Backend (.NET)
- ASP.NET Core, Entity Framework Core
- PostgreSQL with Npgsql provider
- JWT Authentication, BCrypt password hashing

### Frontend (React)
- React + TypeScript + Vite
- Material-UI for components

### Database
- PostgreSQL

## Email Configuration (SMTP)

Email configuration is handled through the backend `appsettings.json` file. Apyvyra supports both real SMTP email delivery and a test mode for development.

#### Option 1: Test Mode (Recommended for Local Development)

In test mode, emails are printed to the backend console instead of being sent via SMTP. This is perfect for development and testing without requiring email credentials.

**Configuration**:
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com",
    "FromName": "Apyvyra",
    "EnableSsl": true,
    "DevelopmentMode": true
  }
}
```

**Features of Test Mode:**
- 🖨️ **Console Output**: All emails are printed to the backend console
- 🚀 **Fast Development**: No network calls or email server dependencies
- 🔍 **Easy Debugging**: Email content is immediately visible in logs
- 📧 **Template Testing**: Perfect for testing email templates and placeholders

#### Option 2: SMTP Mode

For real email delivery using traditional SMTP servers. Supports any email provider that offers SMTP access.

**Common SMTP Providers:**

**Gmail:**
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com",
    "FromName": "Apyvyra",
    "EnableSsl": true,
    "DevelopmentMode": false
  }
}
```

**Outlook/Office 365:**
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.office365.com",
    "SmtpPort": 587,
    "Username": "your-email@outlook.com",
    "Password": "your-password",
    "FromEmail": "your-email@outlook.com",
    "FromName": "Apyvyra",
    "EnableSsl": true,
    "DevelopmentMode": false
  }
}
```

**Yahoo Mail:**
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.mail.yahoo.com",
    "SmtpPort": 587,
    "Username": "your-email@yahoo.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@yahoo.com",
    "FromName": "Apyvyra",
    "EnableSsl": true,
    "DevelopmentMode": false
  }
}
```

**Custom SMTP Server:**
```json
{
  "EmailSettings": {
    "SmtpServer": "mail.yourdomain.com",
    "SmtpPort": 587,
    "Username": "noreply@yourdomain.com",
    "Password": "your-smtp-password",
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "Apyvyra",
    "EnableSsl": true,
    "DevelopmentMode": false
  }
}
```

**Settings Explained:**
- **`SmtpServer`**: SMTP server address (varies by provider)
- **`SmtpPort`**: SMTP port (typically 587 for TLS, 465 for SSL, 25 for unencrypted)
- **`Username`**: Email address for SMTP authentication
- **`Password`**: Email password or app-specific password
- **`FromEmail`**: Email address that appears as sender
- **`FromName`**: Display name for the sender
- **`EnableSsl`**: Enable SSL/TLS encryption for SMTP
- **`DevelopmentMode`**: When `true`, prints emails to console instead of sending

**Provider-Specific Notes:**
- **Gmail**: Requires App Password setup. See configuration below.
- **Outlook**: May require "Authenticated SMTP" setting
- **Yahoo**: Requires "App Password" for third-party access
- **Custom**: Check your hosting provider's SMTP settings

**Gmail Configuration with App Password:**

Gmail requires App Passwords for third-party applications. This is Google's security requirement and provides better protection for your account.

**Setup Steps:**
1. **Enable 2-Step Verification** (Required):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable **2-Step Verification**

2. **Create App Password**:
   - Go to **App Passwords**: https://myaccount.google.com/apppasswords
   - Select "Mail" for app and "Other (Custom name)" for device
   - Enter "Apyvyra" as the custom name
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Configure Application**:
   - Use the App Password in your `appsettings.json`

**Gmail SMTP Configuration:**
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "your-email@gmail.com",
    "Password": "abcd efgh ijkl mnop",  // App Password (remove spaces if needed)
    "FromEmail": "your-email@gmail.com",
    "FromName": "Apyvyra",
    "EnableSsl": true,
    "DevelopmentMode": false
  }
}
```

**Gmail SMTP Settings Reference:**
```
Server: smtp.gmail.com
Port: 587 (TLS) or 465 (SSL)
Username: your-full-email@gmail.com
Password: [16-character App Password]
SSL/TLS: Enabled
```

**Important Notes:**
- App Passwords are required even without 2FA enabled
- Regular Gmail passwords will not work for SMTP
- Each App Password can only be used once
- You can revoke App Passwords anytime from Google Account settings

## Payment Processing (Stripe)

Apyvyra integrates with **Stripe** for payment processing. You have three configuration options:

#### Option 1: Mock Mode (Recommended for Local Development)
Perfect for demos, testing, and offline development without requiring a Stripe account.
Using the `TestMode` and `MockStripe` as true.

**Configuration** (`backend/appsettings.json`):
```json
{
  "Stripe": {
    "SecretKey": "sk_test_YOUR_STRIPE_TEST_SECRET_KEY",
    "PublishableKey": "pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY",
    "WebhookSecret": "whsec_your_webhook_secret_here",
    "TestMode": true,
    "MockStripe": true
  }
}
```

#### Option 2: Test Mode with Real Stripe
For integration testing with real Stripe infrastructure using test keys (no real charges).

**Setup Steps:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Create a free account (no credit card required for test mode)
3. Verify your email address
4. Log in to your Stripe Dashboard
5. Make sure **Test mode** is enabled (toggle in the top-right corner)
6. Go to **Developers** → **API keys**
7. Copy your keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Starts with `sk_test_`

**Test Card Numbers:**
- `4242 4242 4242 4242` - Successful payment
- `4000 0000 0000 9995` - Payment declined

**Configuration**:
```json
{
  "Stripe": {
    "SecretKey": "sk_test_YOUR_REAL_TEST_KEY",
    "PublishableKey": "pk_test_YOUR_REAL_TEST_KEY",
    "WebhookSecret": "whsec_your_webhook_secret",
    "TestMode": true,
    "MockStripe": false
  }
}
```

#### Option 3: Production Mode
For live applications with real payments.

**Configuration**:
```json
{
  "Stripe": {
    "SecretKey": "sk_live_YOUR_LIVE_SECRET_KEY",
    "PublishableKey": "pk_live_YOUR_LIVE_PUBLISHABLE_KEY",
    "WebhookSecret": "whsec_your_live_webhook_secret",
    "TestMode": false,
    "MockStripe": false
  }
}
```

## Address Validation (Google Maps)

Apyvyra integrates with **Google Maps Platform** for address validation during checkout.

#### Option 1: Mock Mode (Recommended for Local Development)
Basic address validation without Google Maps API key.

**Configuration**:
```json
{
  "GoogleMaps": {
    "ApiKey": "YOUR_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": true
  }
}
```

#### Option 2: Production Mode
Real Google Maps integration for comprehensive address validation.

**Setup Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Places API** and **Geocoding API**
3. Create an API key and restrict it to your domain
4. Add the API key to your configuration

**Configuration**:
```json
{
  "GoogleMaps": {
    "ApiKey": "YOUR_ACTUAL_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": false
  }
}
```

## Database Design

### Table Conventions
- **Singular names**: `product`, `app_user`, `product_category`
- **Audit fields**: `created_at`, `created_by`, `updated_at`, `updated_by` on all tables
- **Timestamps**: All use `TIMESTAMPTZ` (UTC with timezone info)
- **Money fields**: Use `DECIMAL(19,4)` for precise financial calculations

### User Roles & Permissions
- **Admin (0)**: Full access to all features including staff management
- **Staff (1)**: Can manage products, categories, customers
- **Customer (2)**: Can view products and place orders

## Filtering & Query Limits

### Server-Side Filtering
- **No traditional pagination** - uses filtering with query limits instead
- **Max records**: Configured via `MAX_RECORDS_QUERIES_COUNT` in app settings (default: 100)
- **Response headers**: `X-Total-Count` and `X-Has-More-Records`
- **Dynamic operators**: eq, ne, lt, lte, gt, gte, contains, startsWith, endsWith, between

### FilterComponent
- **Reusable** filtering component for all admin pages
- **Field types**: string, number, date, boolean, dropdown
- **Dynamic dropdowns** load from backend endpoints
- **Inline warnings** when more records exist
- **Grid filtering disabled** - all filtering through custom form

### Backend Implementation
```csharp
// BaseApiController provides ExecuteLimitedQueryAsync()
var products = await ExecuteLimitedQueryAsync(query);
// Automatically limits results and sets headers
```

### Server-Side Filtering

All list endpoints support server-side filtering via query parameters with **dynamic operators**. Filters are applied **before** the `MAX_RECORDS_QUERIES_COUNT` limit.

**Products Endpoint** (`GET /api/product`):
- `categoryId` (int) - Filter by category ID
- `brand` (string) - Filter by brand (partial match)
- `manufacturer` (string) - Filter by manufacturer (partial match)
- `isActive` (bool) - Filter by active status
- `search` (string) - Search across name, description, and SKU (partial match)
- `sku` (string) - Filter by SKU (partial match)

**Categories Endpoint** (`GET /api/product_category`):
- `isActive` (bool) - Filter by active status
- `parentId` (int) - Filter by parent category ID
- `search` (string) - Search across name and description (partial match)

**Example Requests**:
```
GET /api/product?search=nike&categoryId=5&isActive=true
GET /api/product_category?search=electronics&isActive=true
```

**Backend Implementation** (using QueryFilterHelper):
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<ProductResponse>>> GetProducts()
{
    var query = _context.Products
        .Include(p => p.Category)
        .AsQueryable();
    
    // Apply dynamic filters from query parameters
    // Supports: eq, ne, lt, lte, gt, gte, contains, startsWith, endsWith, between
    query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);
    
    // Then apply limit
    var products = await ExecuteLimitedQueryAsync(query);
    return Ok(products);
}
```

**Query Parameter Examples**:
- `?name=nike` → Contains "nike"
- `?price_gt=100` → Price greater than 100
- `?price_from=50&price_to=200` → Price between 50 and 200
- `?categoryId=5` → Category equals 5
- `?name_startsWith=Pro` → Name starts with "Pro"

### Frontend Handling

The frontend automatically handles query metadata through the `apiFetchWithMetadata()` utility:

**Implementation**:
```typescript
// Service layer returns data with metadata
const response = await productService.getAll();
setProducts(response.data);
setHasMoreRecords(response.metadata.hasMoreRecords);
setTotalCount(response.metadata.totalCount);

// Display warning when more records exist
{hasMoreRecords && (
  <Alert severity="warning" sx={{ mb: 3 }}>
    Showing {products.length} of {totalCount} results. 
    Please refine your filters to narrow down the search for better results.
  </Alert>
)}
```

**User Experience**:
1. **Check `X-Has-More-Records` header** after loading data
2. **Display a warning** if `true`: "Showing {count} of {X-Total-Count} results. Please refine your filters."
3. **Client-side sorting and pagination only** - no client-side filtering
4. **All filtering is server-side** through the custom filter form

**Components Updated**:
- `Products.tsx` - Custom filter form with Search/Clear buttons, warning alert inline with buttons, DataGrid with `disableColumnFilter` enabled
- `Categories.tsx` - Custom filter form with Search/Clear buttons, warning alert, simple Table component

**Frontend Filtering Flow**:
1. User enters filter criteria in the **custom filter form** above the grid
2. User clicks **"Search" button** (or presses Enter in any filter field)
3. Frontend sends filters as **query parameters** to backend API
4. Backend applies filters **before** limiting to `MAX_RECORDS_QUERIES_COUNT`
5. Frontend displays results with **warning alert inline** with buttons if more records exist
6. User refines filters to narrow down results
7. **Grid filtering is disabled** - only sorting and pagination work on loaded data

**Important**: The DataGrid's built-in column filtering is **disabled** (`disableColumnFilter={true}`). All filtering must be done through the custom filter form above the grid.

**Service Layer Example**:
```typescript
export interface ProductFilters {
  categoryId?: number;
  brand?: string;
  isActive?: boolean;
  search?: string;
}

async getAll(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters?.search) params.append('search', filters.search);
  
  const url = params.toString() 
    ? `${API_ENDPOINTS.PRODUCT.LIST}?${params.toString()}` 
    : API_ENDPOINTS.PRODUCT.LIST;
  
  return apiFetchWithMetadata<Product[]>(url, { ... });
}
```

**Component Example**:
```typescript
const [filters, setFilters] = useState<ProductFilters>({ 
  search: '', 
  categoryId: undefined,
  brand: '',
  isActive: undefined 
});

const handleSearch = () => {
  const cleanFilters: ProductFilters = {};
  if (filters.search?.trim()) cleanFilters.search = filters.search.trim();
  if (filters.categoryId) cleanFilters.categoryId = filters.categoryId;
  if (filters.brand?.trim()) cleanFilters.brand = filters.brand.trim();
  if (filters.isActive !== undefined) cleanFilters.isActive = filters.isActive;
  
  loadProducts(cleanFilters);
};

// Filter form UI with inline warning
<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
  <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
    Search
  </Button>
  <Button variant="outlined" startIcon={<FilterAltOffIcon />} onClick={handleClearFilters}>
    Clear Filters
  </Button>
  {hasMoreRecords && (
    <Alert severity="warning" sx={{ ml: 2, py: 0.5, flexGrow: 1 }}>
      Showing {products.length} of {totalCount} results. Please refine your filters.
    </Alert>
  )}
</Box>

// DataGrid with filtering disabled
<DataGrid
  rows={products}
  columns={columns}
  disableColumnFilter  // ← Grid filtering disabled
  pageSizeOptions={[10, 25, 50, 100]}
  initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
/>
```

### Benefits

- **Performance**: Only top N records returned, reducing network and memory usage
- **User Experience**: Fast, responsive UI with immediate feedback
- **Scalability**: Reduces backend load by avoiding large result sets
- **Encourages Better Filtering**: Users learn to use precise filters

### Migration from Traditional Paging

**Old approach** (removed):
```csharp
// ❌ Traditional pagination with page/pageSize parameters
[HttpGet]
public async Task<ActionResult> GetProducts(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
{
    var products = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
}
```

**New approach** (implemented):
```csharp
// ✅ Modern filtering with automatic limiting
[HttpGet]
public async Task<ActionResult> GetProducts([FromQuery] int? categoryId)
{
    var query = _context.Products.AsQueryable();
    if (categoryId.HasValue)
        query = query.Where(p => p.CategoryId == categoryId);
    
    var products = await ExecuteLimitedQueryAsync(query);
    return Ok(products);
}
```

## Frontend API Configuration

API endpoints are centralized in `frontend/src/config/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL as string;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is not set');
}

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  APP_USER: {
    REGISTER: `${API_BASE_URL}/api/app_user`,
    LOGIN: `${API_BASE_URL}/api/app_user/login`,
    ME: `${API_BASE_URL}/api/app_user/me`,
  },
  PRODUCT: {
    LIST: `${API_BASE_URL}/api/product`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/product/${id}`,
  },
  PRODUCT_CATEGORY: {
    LIST: `${API_BASE_URL}/api/product_category`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/product_category/${id}`,
  },
};
```

## Frontend DataGrid Pattern (Default for All Grids)

All data grids in the application should follow this standard pattern using Material-UI DataGrid (`@mui/x-data-grid`):

### Key Features:
1. **Auto-height**: Grid automatically adjusts height based on page size selection
2. **Active Filters Display**: Shows all applied filters above the grid with individual chips
3. **Reset Filters Button**: Positioned on the right side of the active filters display
4. **Filtered Count Indicator**: Shows filtered vs total records count
5. **Built-in Toolbar**: Includes columns, filters, density, export, and quick search
6. **Pagination**: Options for 10, 25, 50, 100 rows per page

### Implementation Pattern:

```typescript
import { useState } from 'react';
import { DataGrid, type GridRenderCellParams, GridToolbar, useGridApiRef } from '@mui/x-data-grid';
import { Box, Chip, Button, Typography } from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

export default function DataListComponent() {
  const [data, setData] = useState<DataType[]>([]);
  const [filteredRowCount, setFilteredRowCount] = useState(0);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const apiRef = useGridApiRef();

  return (
    <>
      {/* Record Count Display */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {filteredRowCount > 0 && filteredRowCount < data.length && (
          <Chip label={`${filteredRowCount} filtered`} color="secondary" size="small" />
        )}
        <Chip label={`${data.length} total`} color="primary" />
      </Box>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 2, 
          p: 2, 
          bgcolor: 'background.default', 
          borderRadius: 1,
          border: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="body2" fontWeight="medium" sx={{ mr: 1 }}>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={`${filter.field}: ${filter.operator} "${filter.value}"`}
                size="small"
                color="info"
                variant="outlined"
              />
            ))}
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FilterAltOffIcon />}
            onClick={() => apiRef.current?.setFilterModel({ items: [] })}
          >
            Reset Filters
          </Button>
        </Box>
      )}

      {/* DataGrid */}
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        apiRef={apiRef}
        onFilterModelChange={(model) => {
          setActiveFilters(model.items || []);
          setTimeout(() => {
            if (apiRef.current) {
              const filteredRows = apiRef.current.getRowModels();
              const visibleCount = filteredRows.size;
              setFilteredRowCount(visibleCount);
            }
          }, 100);
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        autoHeight
        disableRowSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      />
    </>
  );
}
```

### Required Imports:
```typescript
import { DataGrid, type GridRenderCellParams, GridToolbar, useGridApiRef } from '@mui/x-data-grid';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
```

### Benefits:
- **Consistent UX**: All grids behave the same way across the application
- **User-Friendly**: Clear visibility of active filters and easy reset
- **Performance**: Auto-height prevents unnecessary scrolling
- **Accessibility**: Built-in keyboard navigation and screen reader support
- **Feature-Rich**: Sorting, filtering, column management, export out of the box

### Reference Implementation:
See `frontend/src/components/Products.tsx` for a complete working example.

## Error Handling in Backend API Calls

The application uses a standardized error handling pattern with response headers to communicate success/failure status and error messages between backend and frontend.

### Backend Implementation

#### Response Headers
All API responses include standardized headers:
- **`X-Success`**: Boolean string (`"true"` or `"false"`) indicating request success
- **`X-Errors`**: JSON array of error messages (only present when `X-Success` is `"false"`)

#### Middleware
`backend/Middleware/ResponseHeadersMiddleware.cs` automatically adds these headers to all responses:

```csharp
public class ResponseHeadersMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        // Add X-Success header based on status code
        var isSuccess = context.Response.StatusCode >= 200 && context.Response.StatusCode < 300;
        context.Response.Headers["X-Success"] = isSuccess.ToString().ToLower();

        // Add X-Errors header if errors were set in context
        if (context.Items.TryGetValue("Errors", out var errors) && errors is List<string> errorList)
        {
            context.Response.Headers["X-Errors"] = JsonSerializer.Serialize(errorList);
        }
    }
}
```

#### Base Controller
`backend/Controllers/BaseApiController.cs` provides helper methods for consistent error responses:

```csharp
public abstract class BaseApiController : ControllerBase
{
    // Returns BadRequest with errors in both body and headers
    protected IActionResult BadRequestWithErrors(params string[] errors);
    protected IActionResult BadRequestWithErrors(List<string> errors);
    
    // Returns NotFound with error message
    protected IActionResult NotFoundWithError(string error);
    
    // Returns Conflict with error message
    protected IActionResult ConflictWithError(string error);
    
    // Returns InternalServerError with error message
    protected IActionResult InternalServerErrorWithError(string error);
    
    // Returns validation errors from ModelState
    protected IActionResult ValidationErrors();
}
```

#### Controller Usage Example
```csharp
[Route("api/product")]
public class ProductController : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<ProductResponse>> CreateProduct(CreateProductRequest request)
    {
        try
        {
            if (await _context.Products.AnyAsync(p => p.Sku == request.Sku))
            {
                return ConflictWithError("SKU already exists");
            }
            
            // Create product...
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return InternalServerErrorWithError("An error occurred while creating the product");
        }
    }
}
```

#### CORS Configuration
Custom headers must be exposed in CORS policy:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => /* ... */)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("X-Success", "X-Errors");  // Expose custom headers
    });
});
```

### Frontend Implementation

#### Error Handler Utility
`frontend/src/utils/apiErrorHandler.ts` provides centralized error handling:

```typescript
export interface ApiError {
  success: boolean;
  errors: string[];
  statusCode: number;
}

// Wrapper for fetch that automatically handles errors
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  
  // Check X-Success header
  const error = checkResponseHeaders(response);
  if (error) {
    throw error;  // Throws ApiError with errors array
  }
  
  return response.json();
}

// Helper to format error messages
export function getErrorMessages(error: unknown): string[] {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    return (error as ApiError).errors;
  }
  return ['An unexpected error occurred'];
}
```

#### Error Dialog Component
`frontend/src/components/ErrorDialog.tsx` displays errors to users:

```typescript
interface ErrorDialogProps {
  open: boolean;
  errors: string[];
  onClose: () => void;
  title?: string;
}

export default function ErrorDialog({ open, errors, onClose, title = 'Error' }: ErrorDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <ErrorOutlineIcon /> {title}
      </DialogTitle>
      <DialogContent>
        {errors.length === 1 ? (
          <Typography>{errors[0]}</Typography>
        ) : (
          <List>
            {errors.map((error, index) => (
              <ListItem key={index}>
                <ListItemIcon><ErrorOutlineIcon color="error" /></ListItemIcon>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
```

#### Service Layer Usage
Services use `apiFetch` instead of raw `fetch`:

```typescript
import { apiFetch } from '../utils/apiErrorHandler';

export const productService = {
  async create(data: CreateProductData): Promise<Product> {
    return apiFetch<Product>(API_ENDPOINTS.PRODUCT.LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    // Automatically throws ApiError if X-Success is false
  },
};
```

#### Component Usage
Components catch errors and display them using ErrorDialog:

```typescript
export default function ProductsComponent() {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const handleSubmit = async (data: CreateProductData) => {
    try {
      await productService.create(data);
      // Success handling...
    } catch (error) {
      const errors = getErrorMessages(error);
      setErrorMessages(errors);
      setErrorDialogOpen(true);
    }
  };

  return (
    <>
      {/* Component UI */}
      <ErrorDialog
        open={errorDialogOpen}
        errors={errorMessages}
        onClose={() => setErrorDialogOpen(false)}
      />
    </>
  );
}
```

### Benefits

1. **Consistency**: All API errors follow the same pattern
2. **Flexibility**: Supports single or multiple error messages
3. **User-Friendly**: Clear error messages displayed in a modal dialog
4. **Maintainability**: Centralized error handling logic
5. **Type Safety**: TypeScript interfaces ensure correct error handling
6. **Debugging**: Errors logged on backend, displayed clearly on frontend
7. **Validation**: ModelState validation errors automatically included

### Error Response Format

**Headers:**
```
X-Success: false
X-Errors: ["SKU already exists", "Name is required"]
```

**Body (for backward compatibility):**
```json
{
  "message": "SKU already exists; Name is required",
  "errors": ["SKU already exists", "Name is required"]
}
```

This dual approach ensures both header-based and body-based error handling work seamlessly.

## Service Layer

Domain-specific services handle API communication:

- `authService.ts` - Authentication (login, logout, token management)
- `userService.ts` - User operations (register, profile)
- `productService.ts` - Product CRUD operations

## Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000
```

For different environments:
- Development: `http://localhost:5000`
- Production: `https://api.yourdomain.com`

## Translating Database Status Fields

Apyvyra provides a robust system for translating status fields from database tables into localized text. This allows you to store integer status codes in your database while displaying user-friendly, multilingual text in your application.

### How It Works

The translation system uses a three-layer approach:
1. **Database Layer**: Stores integer status codes (e.g., `0`, `1`, `2`)
2. **Enum Layer**: Maps integers to translation keys (e.g., `"ORDER_STATUS_PENDING"`)
3. **Translation Layer**: Maps keys to localized text (e.g., "Pending Payment", "Pagamento Pendente")

### Example: Order Status Implementation

#### 1. Database Table Definition

```sql
-- customer_order table with status fields
CREATE TABLE customer_order (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,           -- Order status
    payment_status INTEGER NOT NULL DEFAULT 0,    -- Payment status
    -- ... other fields
);
```

#### 2. Enum Classes (Backend/Enums/)

**OrderStatus.cs**:
```csharp
namespace backend.Enums;

public static class OrderStatus
{
    public const int PendingPayment = 0;
    public const int Paid = 1;
    public const int Confirmed = 2;
    public const int Processing = 3;
    public const int Shipped = 4;
    public const int Completed = 5;
    public const int Cancelled = 6;
    public const int OnHold = 7;

    public static readonly string[] Names = {
        "ORDER_STATUS_PENDING_PAYMENT",
        "ORDER_STATUS_PAID",
        "ORDER_STATUS_CONFIRMED",
        "ORDER_STATUS_PROCESSING",
        "ORDER_STATUS_SHIPPED",
        "ORDER_STATUS_COMPLETED",
        "ORDER_STATUS_CANCELLED",
        "ORDER_STATUS_ON_HOLD"
    };

    public static string GetName(int status)
    {
        return status >= 0 && status < Names.Length ? Names[status] : "ORDER_STATUS_UNKNOWN";
    }
}
```

**PaymentStatus.cs**:
```csharp
namespace backend.Enums;

public static class PaymentStatus
{
    public const int Pending = 0;
    public const int Succeeded = 1;
    public const int Failed = 2;
    public const int Refunded = 3;

    public static readonly string[] Names = {
        "PAYMENT_STATUS_PENDING",
        "PAYMENT_STATUS_SUCCEEDED",
        "PAYMENT_STATUS_FAILED",
        "PAYMENT_STATUS_REFUNDED"
    };

    public static string GetName(int status)
    {
        return status >= 0 && status < Names.Length ? Names[status] : "PAYMENT_STATUS_UNKNOWN";
    }
}
```

#### 3. Translation Files (Backend/Resources/Translations/)

**English (en-US/OrderStatus.json)**:
```json
{
  "ORDER_STATUS_PENDING_PAYMENT": "Pending Payment",
  "ORDER_STATUS_PAID": "Paid",
  "ORDER_STATUS_CONFIRMED": "Confirmed",
  "ORDER_STATUS_PROCESSING": "Processing",
  "ORDER_STATUS_SHIPPED": "Shipped",
  "ORDER_STATUS_COMPLETED": "Completed",
  "ORDER_STATUS_CANCELLED": "Cancelled",
  "ORDER_STATUS_ON_HOLD": "On Hold",
  "ORDER_STATUS_UNKNOWN": "Unknown"
}
```

**Portuguese (pt-BR/OrderStatus.json)**:
```json
{
  "ORDER_STATUS_PENDING_PAYMENT": "Pagamento Pendente",
  "ORDER_STATUS_PAID": "Pago",
  "ORDER_STATUS_CONFIRMED": "Confirmado",
  "ORDER_STATUS_PROCESSING": "Em Processamento",
  "ORDER_STATUS_SHIPPED": "Enviado",
  "ORDER_STATUS_COMPLETED": "Concluído",
  "ORDER_STATUS_CANCELLED": "Cancelado",
  "ORDER_STATUS_ON_HOLD": "Em Espera",
  "ORDER_STATUS_UNKNOWN": "Desconhecido"
}
```

**English (en-US/PaymentStatus.json)**:
```json
{
  "PAYMENT_STATUS_PENDING": "Pending",
  "PAYMENT_STATUS_SUCCEEDED": "Succeeded",
  "PAYMENT_STATUS_FAILED": "Failed",
  "PAYMENT_STATUS_REFUNDED": "Refunded",
  "PAYMENT_STATUS_UNKNOWN": "Unknown"
}
```

#### 4. Translation Service (Backend/Services/TranslationService.cs)

The `TranslationService` handles loading and retrieving translations:

```csharp
public interface ITranslationService
{
    string GetCurrentLanguage();
    Dictionary<string, string> GetTranslations(string component);
    string Translate(string component, string key);
}
```

#### 5. Controller Implementation (Backend/Controllers/OrderController.cs)

Inject the translation service and use it for status names:

```csharp
public class OrderController : BaseApiController
{
    private readonly ITranslationService _translationService;

    public OrderController(
        AppDbContext context,
        ILogger<OrderController> logger,
        IEmailService emailService,
        IConfiguration configuration,
        ITranslationService translationService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
        _configuration = configuration;
        _translationService = translationService;
    }

    private string GetStatusName(int status)
    {
        var key = OrderStatus.GetName(status);
        return _translationService.Translate("OrderStatus", key);
    }

    private string GetPaymentStatusName(int paymentStatus)
    {
        var key = PaymentStatus.GetName(paymentStatus);
        return _translationService.Translate("PaymentStatus", key);
    }

    private OrderResponse MapToOrderResponse(CustomerOrder order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            Status = order.Status,
            StatusName = GetStatusName(order.Status),           // Translated text
            PaymentStatus = order.PaymentStatus,
            PaymentStatusName = GetPaymentStatusName(order.PaymentStatus), // Translated text
            // ... other fields
        };
    }
}
```

### Benefits of This Approach

1. **Database Efficiency**: Store small integers instead of long text strings
2. **Performance**: Integer comparisons are faster than string comparisons
3. **Consistency**: Same status values across all languages
4. **Flexibility**: Easy to add new languages without database changes
5. **Maintainability**: Translation logic is centralized and reusable

### Adding New Status Values

1. **Add constant to enum**: `public const int NewStatus = 8;`
2. **Add translation key to Names array**: `"ORDER_STATUS_NEW_STATUS"`
3. **Add translations to all language files**
4. **Update any business logic that references the status**

### Supporting New Languages

1. **Create new language folder**: `backend/Resources/Translations/fr-FR/`
2. **Copy existing translation files**: `OrderStatus.json`, `PaymentStatus.json`
3. **Translate all keys**: Replace English text with French translations
4. **Update configuration**: Set `"Language": "fr-FR"` in appsettings.json

### API Response Example

With the translation system active, API responses include both the raw status code and the translated text:

```json
{
  "id": 123,
  "status": 1,
  "statusName": "Paid",
  "paymentStatus": 1,
  "paymentStatusName": "Succeeded"
}
```

When configured for Portuguese:
```json
{
  "id": 123,
  "status": 1,
  "statusName": "Pago",
  "paymentStatus": 1,
  "paymentStatusName": "Sucesso"
}
```

## Backend Configuration

### JWT Authentication

The backend uses JWT tokens for authentication. Configuration is managed in `backend/appsettings.json`:

```json
{
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForHS256",
    "Issuer": "ApyvyraAPI",
    "Audience": "ApyvyraClient",
    "ExpiresInMinutes": 60
  }
}
```

**Important:** 
- `Key` must be at least 32 characters for HS256 algorithm
- For production, use environment variables or secrets management (Azure Key Vault, AWS Secrets Manager)
- Never commit production secrets to source control

### Database Connection

Database connection string in `backend/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra"
  }
}
```

### Language & Translation Configuration

Apyvyra includes a **backend-driven translation system** that allows the application to be deployed in different languages. Currently supports English (`en-US`), Brazilian Portuguese (`pt-BR`), Spanish (`es-ES`), and Hindi (`hi-IN`).

**Backend Configuration** (`backend/appsettings.json`):
```json
{
  "Localization": {
    "Language": "en-US",
    "ResourcePath": "Resources/Translations"
  }
}
```

**Translation Structure**:
```
backend/Resources/Translations/
├── en-US/              # English translations
│   ├── email-templates/    # Email templates
│   └── *.json             # UI translation files
├── pt-BR/              # Portuguese translations
│   ├── email-templates/    # Email templates
│   └── *.json             # UI translation files
├── es-ES/              # Spanish translations
│   ├── email-templates/    # Email templates
│   └── *.json             # UI translation files
└── hi-IN/              # Hindi translations
    ├── email-templates/    # Email templates
    └── *.json             # UI translation files
```

## Security Considerations

⚠️ **SECURITY WARNING: Sensitive Configuration**

**🚨 NEVER commit the following sensitive information to version control:**

- **JWT Key**: `Jwt.Key` - Use environment variable: `Jwt__Key`
- **Stripe Keys**: `Stripe.SecretKey`, `Stripe.PublishableKey`, `Stripe.WebhookSecret` - Use environment variables
- **Email Password**: `EmailSettings.Password` - Use environment variable: `EmailSettings__Password`
- **Google Maps API Key**: `GoogleMaps.ApiKey` - Use environment variable: `GoogleMaps__ApiKey`
- **Database Password**: `ConnectionStrings.DefaultConnection` (consider using environment variables)

**For production deployments:**
1. Remove sensitive values from `appsettings.json`
2. Use environment variables or cloud secret management services (AWS Secrets Manager, Azure Key Vault, Google Cloud Secret Manager, etc.)
3. Use different keys for development, staging, and production
4. Regularly rotate secrets and API keys

**Example using environment variables:**
```bash
# Production environment variables
Jwt__Key="your-super-secure-jwt-key-here"
Stripe__SecretKey="sk_live_your_live_stripe_key"
EmailSettings__Password="your-email-app-password"
GoogleMaps__ApiKey="your-production-google-maps-key"
```

### Complete Backend Configuration Example

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForHS256",
    "Issuer": "ApyvyraAPI",
    "Audience": "ApyvyraClient",
    "ExpiresInMinutes": 60
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com",
    "FromName": "Apyvyra",
    "EnableSsl": true,
    "DevelopmentMode": true
  },
  "Stripe": {
    "SecretKey": "sk_test_YOUR_STRIPE_TEST_SECRET_KEY",
    "PublishableKey": "pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY",
    "WebhookSecret": "whsec_your_webhook_secret_here",
    "TestMode": true,
    "MockStripe": true
  },
  "GoogleMaps": {
    "ApiKey": "YOUR_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": true
  },
  "Localization": {
    "Language": "en-US",
    "ResourcePath": "Resources/Translations"
  },
  "BaseUrl": "http://localhost:5000",
  "QuerySettings": {
    "MAX_RECORDS_QUERIES_COUNT": 100
  }
}
```