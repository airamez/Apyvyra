

# Architecture Guide

## Project Architecture Overview

Apyvyra is a full-stack ERP application built with modern web technologies. The architecture follows a layered approach with clear separation of concerns:

- **Frontend**: React SPA with TypeScript, Material-UI, and Vite
- **Backend**: ASP.NET Core Web API with C#, Entity Framework Core
- **Database**: PostgreSQL with proper schema design
- **DevOps**: Docker containerization and automated database tools

The application uses RESTful APIs for communication, JWT for authentication, and follows modern development practices including audit trails, error handling, and responsive design.

## Technology Stack Versions & Best Practices

> **CRITICAL: Always Use Latest Versions** - This project uses the latest stable versions of all technologies and APIs. When making changes or adding features, always verify and use the most current versions available. AI agents and developers often default to outdated versions without checking current project dependencies.

### Current Technology Versions (as of December 2025)

#### Backend (.NET)
- **Framework**: .NET 10.0 (latest LTS)
- **ASP.NET Core**: 10.0.0
- **Entity Framework Core**: 10.0.0
- **Npgsql**: 10.0.1 (PostgreSQL provider)
- **JWT Authentication**: 10.0.0
- **OpenAPI/Swagger**: 10.0.0
- **BCrypt**: 4.0.3

#### Frontend (React/TypeScript)
- **React**: 19.2.0 (latest stable)
- **TypeScript**: 5.9.3
- **Vite**: 7.2.4 (build tool)
- **Material-UI**: 7.3.6 (latest major version)
- **ESLint**: 9.39.1
- **Node.js**: 24.10.1 (via @types/node)

#### Database
- **PostgreSQL**: Latest stable version (via Docker)
- **Npgsql.EntityFrameworkCore.PostgreSQL**: 10.0.0

#### DevOps & Tools
- **Docker**: Latest stable
- **Docker Compose**: Latest stable
- **.NET Console App**: .NET 10.0

### Version Update Guidelines

#### Before Making Changes:
1. **Check Current Versions**: Review `package.json`, `.csproj` files, and `package-lock.json`
2. **Verify Compatibility**: Ensure all packages work together
3. **Test Updates**: Run full test suite after version updates
4. **Update Documentation**: Reflect version changes in this document

#### Package Update Commands:
```bash
# Frontend
cd frontend
npm update
npm audit fix

# Backend (update packages in .csproj files)
dotnet restore
dotnet build

# Check for outdated packages
npm outdated
dotnet list package --outdated
```

#### Breaking Changes Awareness:
- **Material-UI v7**: Grid API changed from `item` prop to `size` prop
- **React 19**: New features and potential breaking changes
- **.NET 10**: Latest features and performance improvements

### API Version Management

#### REST API Versioning:
- Use URL versioning: `/api/v1/products`
- Header versioning: `Accept: application/vnd.apyvyra.v1+json`
- Document all API changes in OpenAPI/Swagger

#### Database Schema Versioning:
- Use EF Core migrations for schema changes
- Never modify existing migration files
- Test migrations on staging environment first

### Dependency Management Best Practices

#### Security First:
```bash
# Regular security audits
npm audit
dotnet list package --vulnerable

# Update vulnerable packages immediately
npm audit fix
```

#### Performance Considerations:
- Monitor bundle size with `npm run build`
- Use tree shaking and code splitting
- Optimize Docker image sizes

#### Development Workflow:
1. **Pull latest changes**: `git pull`
2. **Update dependencies**: `npm install` / `dotnet restore`
3. **Run tests**: `npm test` / `dotnet test`
4. **Build locally**: `npm run build` / `dotnet build`
5. **Test in containers**: `docker-compose up`

> **Best Practice:** As the ERP project grows (including backend, frontend, and DevOps tooling), always follow best software architecture principles:
> - Use proper modularization: separate logic into methods, classes, and files by responsibility.
> - Keep code maintainable, testable, and clear.
> - Document architectural decisions and patterns.
> - Refactor and organize code as new features are added.


## SQL Table Naming Convention

All SQL table names in this project are **singular** (e.g., `product`, `user`, `product_url`).

Each table includes standard audit fields:

- `created_at` (timestamp)
- `created_by` (user reference)
- `updated_at` (timestamp)
- `updated_by` (user reference)

This ensures consistency and traceability across the database schema.

## Database Field Types

### Date/Time Fields

All date/time columns use `TIMESTAMPTZ` (timestamp with time zone) instead of `TIMESTAMP` (timestamp without time zone):

**Rationale:**
- **UTC Consistency**: Ensures all timestamps are stored in UTC, preventing timezone-related bugs
- **Npgsql Compatibility**: Avoids .NET PostgreSQL provider issues with `DateTimeKind.Unspecified` values
- **Global ERP Support**: Proper handling of international users across different time zones
- **Future-Proofing**: Aligns with modern web standards and cloud-native applications

**Industry Best Practices:**
Big tech companies (Google, Amazon, Facebook, Stripe, etc.) universally use UTC timestamps with timezone information:

- **PostgreSQL**: `TIMESTAMPTZ` is the standard for all temporal data
- **MySQL**: `TIMESTAMP` or `DATETIME` with UTC conversion
- **MongoDB**: ISODate with UTC
- **Cloud Services**: All major cloud providers (AWS, GCP, Azure) store timestamps in UTC

**Implementation:**
- Backend: All `DateTime` properties use `DateTimeKind.Utc`
- Database: `created_at`, `updated_at` columns use `TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`
- API: Return timestamps in ISO 8601 format with 'Z' suffix (e.g., `2025-12-20T10:30:00.000Z`)

**Why TIMESTAMPTZ is Recommended:**
- **Ambiguity Elimination**: No confusion about whether a timestamp represents local time or UTC
- **Timezone Safety**: Applications can convert to user timezones without data loss
- **Compliance**: Meets requirements for financial systems, audit trails, and international standards
- **Performance**: PostgreSQL optimizes `TIMESTAMPTZ` queries efficiently

### Currency/Monetary Fields

Price and cost fields use `DECIMAL(19, 4)` precision:

**Rationale:**
- **Calculation Accuracy**: 4 decimal places prevent rounding errors in tax calculations, discounts, and currency conversions
- **Industry Standard**: Matches practices used by major e-commerce platforms (Stripe, Shopify, Amazon)
- **Financial Compliance**: Supports precise monetary arithmetic required for ERP systems
- **Storage Efficiency**: DECIMAL provides exact decimal representation without floating-point precision issues

**Fields Using DECIMAL(19, 4):**
- `price` - Product selling price
- `cost_price` - Product cost/purchase price  
- `compare_at_price` - Original/compare price for sales

**Benefits:**
- Eliminates floating-point arithmetic errors (e.g., 0.1 + 0.2 = 0.3 exactly)
- Supports micro-payments and complex pricing rules
- Enables accurate financial reporting and reconciliation

## Frontend API Configuration

API endpoints are centralized in `frontend/src/config/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL as string;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is not set');
}

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  USERS: {
    REGISTER: `${API_BASE_URL}/api/users`,
    LOGIN: `${API_BASE_URL}/api/users/login`,
    ME: `${API_BASE_URL}/api/users/me`,
  },
  PRODUCTS: {
    LIST: `${API_BASE_URL}/api/products`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/products/${id}`,
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