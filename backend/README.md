# Backend (ASP.NET Core Web API)

> **Note**: This project uses the latest stable versions of all packages and frameworks.

A modern RESTful Web API built with **ASP.NET Core**, using **Entity Framework Core** for data access and **PostgreSQL** as the database. Features JWT authentication, Stripe payment processing, email services, and comprehensive API documentation.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Key Features](#key-features)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## Quick Start

```bash
# 1. Setup database
cd ../devops
dotnet run -- db-init

# 2. Install dependencies and run
cd ../backend
dotnet restore
dotnet run
```

API available at: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/swagger`

## Architecture Overview

### Core Technologies

- **Framework**: ASP.NET Core Web API (.NET 10.0)
- **Database**: PostgreSQL with Entity Framework Core
- **Authentication**: JWT Bearer tokens
- **Payments**: Stripe integration with mock mode support
- **Email**: SMTP with HTML templates
- **Documentation**: OpenAPI/Swagger

### Design Principles

- **RESTful API**: Conventional routing with proper HTTP methods
- **Database-First**: Schema defined in SQL, models scaffolded from database
- **Clean Architecture**: Controllers → Services → Data access layers
- **Error Handling**: Custom headers and structured error responses
- **Security**: JWT authentication with role-based authorization

## Prerequisites

- **.NET SDK**: Version 10.0 or later ([download](https://dotnet.microsoft.com/download/dotnet/10.0))
- **PostgreSQL**: Version 13+ (via Docker or local installation)
- **Git**: For cloning and version control
- **Stripe Account**: For payment processing (optional - can use mock mode)

### Recommended Tools

- **Visual Studio Code** or **Visual Studio 2022+**
- **Docker Desktop** (for containerized database)
- **Postman** or **Insomnia** (for API testing)
- **Git** client

## Setup

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd apyvyra/backend
```

### 2. Database Setup

**Option A: Docker (Recommended)**

```bash
# From project root
docker-compose up -d db

# Wait for database to be ready
sleep 10
```

**Option B: Local PostgreSQL**

Ensure PostgreSQL is running with:
- Host: `localhost`
- Port: `5432`
- Database: `apyvyra`
- Username: `apyvyra`
- Password: `apyvyra`

### 3. Initialize Database

```bash
# From project root
cd devops
dotnet run -- db-init
dotnet run -- db-load-test-data  # Optional: Load test data
cd ../backend
```

### 4. Restore Dependencies

```bash
dotnet restore
```

## Configuration

### appsettings.json Structure

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
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUser": "your-email@gmail.com",
    "SmtpPass": "your-app-password",
    "FromEmail": "noreply@apyvyra.com",
    "FromName": "Apyvyra",
    "DevelopmentMode": true
  },
  "Stripe": {
    "PublishableKey": "pk_test_...",
    "SecretKey": "sk_test_...",
    "WebhookSecret": "whsec_...",
    "MockStripe": true
  },
  "BaseUrl": "http://localhost:5000",
  "QuerySettings": {
    "MAX_RECORDS_QUERIES_COUNT": 100
  }
}
```

### Environment-Specific Configuration

Create `appsettings.Development.json`, `appsettings.Staging.json`, or `appsettings.Production.json` for environment-specific settings.

### Stripe Configuration

#### Development (Mock Mode)
Set `"MockStripe": true` for development - simulates payments without real charges.

#### Production (Live Mode)
1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get live API keys from Stripe Dashboard
3. Set `"MockStripe": false`
4. Configure webhook endpoint for payment events

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

## Running the Application

### Development Mode

```bash
# Run with hot reload
dotnet watch run

# Or run normally
dotnet run
```

### Production Mode

```bash
# Build for production
dotnet publish -c Release -o ./publish

# Run published application
cd publish
./Apyvyra.Backend  # or Apyvyra.Backend.exe on Windows
```

### Docker

```bash
# Build image
docker build -t apyvyra-backend .

# Run container
docker run -p 5000:5000 apyvyra-backend
```

### Access Points

- **API**: `http://localhost:5000`
- **Swagger UI**: `http://localhost:5000/swagger`
- **Health Check**: `http://localhost:5000/health` (if implemented)

## API Documentation

### Authentication

All protected endpoints require JWT token in `Authorization: Bearer <token>` header.

```bash
# Login to get token
curl -X POST http://localhost:5000/api/app_user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/product
```

### Endpoints Overview

#### Authentication
- `POST /api/app_user` - Register new user
- `POST /api/app_user/login` - Login and receive JWT token
- `GET /api/app_user/me` - Get current user info (requires auth)
- `GET /api/app_user` - List all users (Admin/Staff only)

#### Products
- `GET /api/product` - List products with dynamic filtering
- `GET /api/product/{id}` - Get product by ID
- `POST /api/product` - Create new product (requires auth)
- `PUT /api/product/{id}` - Update product (requires auth)
- `DELETE /api/product/{id}` - Delete product (requires auth)

#### Categories
- `GET /api/product_category` - List categories with filtering
- `GET /api/product_category/{id}` - Get category by ID
- `POST /api/product_category` - Create category (requires auth)
- `PUT /api/product_category/{id}` - Update category (requires auth)
- `DELETE /api/product_category/{id}` - Delete category (requires auth)

#### Orders
- `GET /api/order` - List orders (Admin/Staff, filtered)
- `GET /api/order/{id}` - Get order details
- `POST /api/order` - Create new order (requires auth)
- `PUT /api/order/{id}/status` - Update order status (Admin/Staff)
- `GET /api/order/stats` - Get order statistics (Admin/Staff)

#### Payments
- `GET /api/payment/config` - Get payment configuration
- `POST /api/payment/create-intent/{orderId}` - Create payment intent
- `POST /api/payment/confirm/{orderId}` - Confirm payment
- `POST /api/payment/webhook` - Stripe webhook handler

### Dynamic Filtering

All list endpoints support advanced filtering via query parameters:

```bash
# Filter by name (contains)
GET /api/product?name=nike

# Filter by price range
GET /api/product?price_gte=50&price_lte=200

# Filter by category and status
GET /api/product?categoryId=5&isActive=true

# Filter by date range
GET /api/order?createdAt_gte=2024-01-01&createdAt_lte=2024-12-31
```

**Supported Operators:**
- `eq` (equals): `field=value`
- `ne` (not equals): `field_ne=value`
- `lt/gt/lte/gte`: Comparison operators
- `contains/startsWith/endsWith`: String matching
- `from/to`: Range queries for dates and numbers

## Key Features

### 1. Modern Query Limiting
Returns top N filtered records instead of traditional pagination for better performance.

### 2. Comprehensive Error Handling
Custom response headers (`X-Success`, `X-Errors`) and structured error responses.

### 3. Database Auditing
Automatic timestamp and user tracking for all entities.

### 4. Stripe Payment Integration
Full payment processing with webhook support and mock mode for development.

### 5. Email Service
HTML email templates with dynamic content for order confirmations and notifications.

### 6. JWT Authentication
Secure token-based authentication with role-based authorization.

### 7. Dynamic Filtering
Powerful query filtering system supporting complex search criteria.

## Project Structure

```
backend/
├── Controllers/              # Web API controllers
│   ├── BaseApiController.cs  # Base controller with error handling
│   ├── AppUserController.cs  # Authentication & user management
│   ├── ProductController.cs  # Product CRUD operations
│   ├── ProductCategoryController.cs # Category management
│   ├── OrderController.cs    # Order processing
│   └── PaymentController.cs  # Stripe payment processing
├── Models/                   # EF Core entity models (auto-generated)
├── Data/
│   └── AppDbContext.cs       # Database context & configurations
├── Services/
│   ├── EmailService.cs       # Email sending with templates
│   └── StripeService.cs      # Payment processing
├── Middleware/
│   └── ResponseHeadersMiddleware.cs # Custom response headers
├── Helpers/
│   └── QueryFilterHelper.cs  # Dynamic query filtering
├── Enums/                    # Application constants
├── Resources/
│   └── Translations/         # Translation files and email templates
│       ├── en-US/           # English translations
│       │   ├── email-templates/    # English HTML email templates
│       │   └── *.json              # English translation files
│       └── pt-BR/           # Brazilian Portuguese translations
│           ├── email-templates/    # Portuguese HTML email templates
│           └── *.json              # Portuguese translation files
├── Program.cs                # Application entry point
├── appsettings.json          # Configuration
└── README.md                 # This file
```

## Development

### Database Schema Changes

1. Update `../database.sql` with new schema changes
2. Run database initialization:
   ```bash
   cd ../devops
   dotnet run -- db-init
   ```
3. Regenerate EF Core models:
   ```bash
   dotnet ef dbcontext scaffold "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra" Npgsql.EntityFrameworkCore.PostgreSQL -o Models -c AppDbContext -d Data --context-dir Data --force
   ```
4. Update controllers and DTOs as needed

### Adding New Endpoints

1. Create or update controller in `Controllers/`
2. Use `[Authorize]` attribute for protected endpoints
3. Inherit from `BaseApiController` for error handling helpers
4. Return DTOs instead of raw entity models
5. Test with Swagger UI or API client

### Testing

```bash
# Run unit tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Deployment

### Docker Deployment

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["backend/backend.csproj", "backend/"]
RUN dotnet restore "backend/backend.csproj"
COPY . .
WORKDIR "/src/backend"
RUN dotnet build "backend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "backend.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "backend.dll"]
```

### Production Checklist

- [ ] Update `appsettings.json` with production values
- [ ] Configure environment variables for secrets
- [ ] Set up SSL/TLS certificates
- [ ] Set up monitoring and logging
- [ ] Configure Stripe webhooks for live environment
- [ ] Set up database backups
- [ ] Configure email SMTP for production

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection manually
psql -h localhost -p 5432 -U apyvyra -d apyvyra
```

**JWT Authentication Issues**
- Verify JWT key is at least 32 characters
- Check token expiration in `appsettings.json`
- Ensure `Bearer` scheme is used in Authorization header

**CORS Errors**
- Check `AllowedHosts` in `appsettings.json`
- Verify CORS policy allows frontend origin
- Ensure credentials are enabled for auth cookies

**Email Not Sending**
- Check SMTP credentials in `appsettings.json`
- Verify `DevelopmentMode` setting
- Look for email logs in console output

**Stripe Payment Errors**
- Verify API keys are correct
- Check webhook endpoint configuration
- Use Stripe dashboard to monitor payment events

### Debug Mode

Run with detailed logging:
```bash
dotnet run --environment Development
```

### Health Checks

```bash
# Basic health check
curl http://localhost:5000/health

# Database connectivity
curl http://localhost:5000/api/health/database
```

## Resources

### Official Documentation

- [ASP.NET Core Web API](https://learn.microsoft.com/en-us/aspnet/core/web-api/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [JWT Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Npgsql Documentation](https://www.npgsql.org/doc/)

### Related Project Documentation

- [Main Project README](../README.md)
- [Getting Started Guide](../GETTING-STARTED.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [DevOps Tools](../devops/README.md)
- [Frontend Documentation](../frontend/README.md)

### Community Resources

- [ASP.NET Core GitHub](https://github.com/dotnet/aspnetcore)
- [EF Core GitHub](https://github.com/dotnet/efcore)
- [Stripe Developer Community](https://stripe.com/docs/questions)
