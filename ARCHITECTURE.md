

# Architecture Guide


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