

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