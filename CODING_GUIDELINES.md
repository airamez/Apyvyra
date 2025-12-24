# Apyvyra Project Coding Guidelines

## Technology Stack
- **Backend**: C# / ASP.NET Core
- **Frontend**: React + TypeScript + Vite
- **UI Library**: Material-UI (MUI) v7
- **Database**: PostgreSQL

## Frontend Development Rules

### MUI Versioning & API Usage
- **ALWAYS** use the latest stable version of Material-UI (MUI) components and APIs
- Follow official MUI migration guides for breaking changes (e.g., Grid v7: use `size` prop instead of deprecated `item` prop - `<Grid size={{ xs: 12, md: 6 }}>` instead of `<Grid item xs={12} md={6}>`)
- Remove deprecated props and update code to match the latest MUI documentation
- Regularly review https://mui.com/material-ui/migration/ for updates

### Dialogs & Confirmations
- **ALWAYS** use Material-UI (MUI) Dialog components for all confirmation dialogs (e.g., delete confirmations)
- Do NOT use browser dialogs like `window.confirm`, `window.alert`, or `window.prompt`
- Dialogs must be accessible and follow MUI best practices

### UI Components
- **ALWAYS** use Material-UI (MUI) components - never create custom HTML elements
- Import from `@mui/material` for all UI components
- Use MUI icons from `@mui/icons-material`
- Follow MUI's design system and spacing conventions (sx prop, theme)

### Component Structure
- Use functional components with TypeScript
- Define interfaces for props and data types
- Keep components in `frontend/src/components/`
- Services go in `frontend/src/services/`

### State Management
- Use React hooks (useState, useEffect, etc.)
- Keep state close to where it's used
- Use proper TypeScript types for all state

### Forms
- Use MUI TextField, Select, FormControl, etc.
- Use Grid for layout (never custom divs for layout)
- Validate required fields
- Show proper error messages with Alert component

### Styling
- Use MUI's `sx` prop for styling (never inline styles or CSS files for components)
- Use theme spacing: `sx={{ mt: 2, mb: 3 }}` instead of pixels
- Maintain consistent spacing throughout

### Authentication
- **ALL API calls require authentication EXCEPT:**
  - Register endpoint
  - Login endpoint
- Include authentication token in all other requests
- Handle 401/403 errors appropriately
- Redirect to login when session expires

## Backend Development Rules

### API Structure
- RESTful endpoints: `/api/[controller]`
- Use proper HTTP verbs (GET, POST, PUT, DELETE)
- Return proper status codes (200, 201, 400, 404, 500)
- Always include error handling with try-catch

### Authentication & Authorization
- **ALL endpoints require authentication EXCEPT:**
  - `POST /api/app_user` (Register)
  - `POST /api/app_user/login` (Login)
- Use `[Authorize]` attribute on controllers/actions
- Validate JWT tokens on all protected endpoints
- Return 401 Unauthorized for missing/invalid tokens
- Return 403 Forbidden for insufficient permissions

### Database Models
- Use Data Annotations for validation
- **EVERY table MUST have these 4 auditing fields:**
  - `created_at` (DateTime) - When record was created
  - `created_by` (int?, nullable) - User ID who created the record
  - `updated_at` (DateTime) - When record was last updated
  - `updated_by` (int?, nullable) - User ID who last updated the record
- Use proper foreign key relationships for created_by/updated_by to users table
- Map column names with [Column("name")] attribute
- Set default values: `DateTime.UtcNow` for timestamps

### Auditing Fields Implementation
```csharp
// Example model with auditing fields
[Column("created_at")]
public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

[Column("created_by")]
public int? CreatedBy { get; set; }

[Column("updated_at")]
public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

[Column("updated_by")]
public int? UpdatedBy { get; set; }

[ForeignKey("CreatedBy")]
public User? CreatedByUser { get; set; }

[ForeignKey("UpdatedBy")]
public User? UpdatedByUser { get; set; }
```

### Database Schema
```sql
-- All tables must include:
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
created_by INTEGER REFERENCES users(id),
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_by INTEGER REFERENCES users(id)
```

### Controllers
- Include XML comments for documentation
- Use async/await for all database operations
- Log errors with ILogger
- Return DTOs, not raw entities (hide sensitive data like passwords)
- Populate auditing fields (created_by, updated_by) from authenticated user
- **Use `ExecuteLimitedQueryAsync()` for all list queries** to enforce MAX_RECORDS_QUERIES_COUNT limit
- **Do NOT use traditional pagination** (page/pageSize parameters) - use modern filtering approach instead

### ORM
- **ALWAYS use Entity Framework Core** for all database access and migrations
- Do not use raw SQL except for migrations or performance-critical queries
- Define all models as C# classes with proper attributes
- Use DbContext for all data access
- Use migrations to manage schema changes

### Query Limiting (Modern Filtering)
- **All list endpoints** must use `ExecuteLimitedQueryAsync()` from `BaseApiController`
- **No pagination parameters** (page, pageSize) - use filtering instead
- **Example**:
  ```csharp
  [HttpGet]
  public async Task<ActionResult<IEnumerable<ProductResponse>>> GetProducts(
      [FromQuery] int? categoryId,
      [FromQuery] string? brand)
  {
      var query = _context.Products.AsQueryable();
      
      // Apply filters
      if (categoryId.HasValue)
          query = query.Where(p => p.CategoryId == categoryId);
      
      // Automatically limits to MAX_RECORDS_QUERIES_COUNT and sets headers
      var products = await ExecuteLimitedQueryAsync(query);
      
      return Ok(products.Select(p => MapToResponse(p)));
  }
  ```
- **Headers set automatically**: `X-Has-More-Records`, `X-Total-Count`
- **Frontend responsibility**: Show warning if more records exist, encourage better filtering

## Code Quality

### General
- Write clear, descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Follow DRY (Don't Repeat Yourself) principle

### TypeScript/C#
- Always use proper types (no `any` in TypeScript unless absolutely necessary)
- Use nullable types correctly (`?` in both languages)
- Handle null/undefined cases explicitly

### Error Handling
- Always wrap async operations in try-catch
- Provide user-friendly error messages
- Log errors for debugging
- Don't expose internal errors to users

## File Organization
```
backend/
  Controllers/     # API endpoints
  Models/         # Database entities (all with auditing fields)
  Data/           # DbContext
  Services/       # Business logic

frontend/
  src/
    components/   # React components
    services/     # API calls (all include auth headers except register/login)
    config/       # Configuration
```

## Naming Conventions
- **C#**: PascalCase for classes, methods, properties
- **TypeScript**: camelCase for variables, functions; PascalCase for interfaces, types, components
- **Database**: snake_case for table and column names
- **Files**: PascalCase for components (Products.tsx), camelCase for utilities

## Git Workflow
- Write clear commit messages
- Keep commits focused and atomic
- Test before committing

## Testing
- Test all CRUD operations
- Verify form validation
- Check error handling
- Test authentication on all endpoints (except register/login)
- Test auditing fields are properly populated
- Test with real database data
