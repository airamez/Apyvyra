# Backend (ASP.NET Core Web API)

> **Note**: We will always be using the latest stable versions of all packages and frameworks.

The backend is a RESTful Web API built with **ASP.NET Core**, using **Entity Framework Core** for data access and **PostgreSQL** as the database.

## Architecture Overview

### ASP.NET Core Web API
- **API Style**: RESTful with conventional routing (`/api/[controller]`)
- **Authentication**: JWT Bearer tokens
- **Serialization**: JSON with camelCase naming (configured in `Program.cs`)
- **OpenAPI/Swagger**: Integrated for API documentation
- **CORS**: Configured to allow frontend communication with custom headers

### Entity Framework Core (Database-First Approach)
- **Provider**: Npgsql.EntityFrameworkCore.PostgreSQL
- **Approach**: **Database-First** - Schema defined in SQL, models scaffolded from database
- **DbContext**: `AppDbContext` manages all database entities
- **Models**: Auto-generated partial classes from database schema
- **No Migrations**: Schema changes are managed via SQL scripts in `database.sql`

### Database Schema Management
- **Schema Definition**: `/database.sql` - Single source of truth for database structure
- **Initialization**: DevOps console tool (`dotnet run -- db-init`) executes SQL script
- **Model Generation**: Use EF Core scaffolding to regenerate models after schema changes:
  ```bash
  dotnet ef dbcontext scaffold "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra" Npgsql.EntityFrameworkCore.PostgreSQL -o Models -c AppDbContext -d Data --context-dir Data --force
  ```

## Prerequisites

- .NET SDK (latest stable version)
- PostgreSQL database (via Docker or local installation)
- Stripe account (for payment processing - see Stripe Configuration below)

## Setup

1. **Restore dependencies**
   ```bash
   cd backend
   dotnet restore
   ```

2. **Database setup**
   - Ensure PostgreSQL is running (via Docker Compose):
     ```bash
     docker-compose up -d db
     ```
   - Initialize database schema using DevOps tool:
     ```bash
     cd ../devops
     dotnet run -- db-init
     dotnet run -- db-load-test-data
     cd ../backend
     ```

3. **Configuration**
   - Connection string in `appsettings.json`:
     ```json
     {
       "ConnectionStrings": {
         "DefaultConnection": "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra"
       }
     }
     ```
   - JWT settings in `appsettings.json`:
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
   - Email settings in `appsettings.json`:
     ```json
     {
       "EmailSettings": {
         "SmtpHost": "smtp.gmail.com",
         "SmtpPort": 587,
         "SmtpUser": "your-email@gmail.com",
         "SmtpPass": "your-app-password",
         "FromEmail": "noreply@apyvyra.com",
         "FromName": "Apyvyra",
         "DevelopmentMode": true
       }
     }
     ```
   - Stripe settings in `appsettings.json`:
     ```json
     {
       "Stripe": {
         "PublishableKey": "pk_test_...",
         "SecretKey": "sk_test_...",
         "WebhookSecret": "whsec_...",
         "MockStripe": false
       }
     }
     ```

## Running

```bash
# Run the API
dotnet run

# Run with hot reload for development
dotnet watch run
```

The API will be available at `http://localhost:5000` (configured in `Properties/launchSettings.json`).

## Stripe Configuration

### Setting Up Stripe for Testing

1. **Create a Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Verify your email and complete the basic setup
   - Enable test mode (toggle in the dashboard)

2. **Get Test API Keys**
   - In Stripe Dashboard → Developers → API Keys
   - Copy the **Publishable key** (starts with `pk_test_`)
   - Copy the **Secret key** (starts with `sk_test_`)
   - Create a webhook endpoint and copy the **Signing secret** (starts with `whsec_`)

3. **Configure Webhook**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/payment/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret

4. **Update appsettings.json**
   ```json
   {
     "Stripe": {
       "PublishableKey": "pk_test_your_publishable_key_here",
       "SecretKey": "sk_test_your_secret_key_here", 
       "WebhookSecret": "whsec_your_webhook_secret_here",
       "MockStripe": false
     }
   }
   ```

### Payment Testing Options

#### Option 1: Mock Stripe (Development/Testing)
Set `"MockStripe": true` in `appsettings.json` to bypass Stripe entirely:
- Simulates successful payments without real charges
- No Stripe account required for basic testing
- Perfect for development and demo purposes
- Payment flow works normally but uses mock responses

#### Option 2: Stripe Test Mode (Real Testing)
Set `"MockStripe": false` and use test keys:
- Uses real Stripe test environment
- No actual charges to real cards
- Test with Stripe's test card numbers
- Full payment workflow with real Stripe processing

### Test Card Numbers (Stripe Test Mode)
Use these card numbers in the payment form:
- **Success**: `4242 4242 4242 4242` (Visa)
- **Success**: `4000 0000 0000 0002` (Card declined)
- **Success**: `4000 0000 0000 9995` (Insufficient funds)
- Any future expiry date, any CVC, any 5-digit ZIP code

### Email Templates

The backend includes email templates for customer communications:

```
backend/email-templates/
├── confirmation.html      # Email confirmation for user registration
├── staff-invitation.html  # Staff account invitation
├── order-confirmation.html # Order confirmation to customers
└── order-shipped.html     # Shipping notification to customers
```

#### Template Variables
Each template uses placeholder variables that are dynamically replaced:
- `{{customer_name}}` - Customer's full name
- `{{order_number}}` - Order identifier
- `{{order_items}}` - HTML table of ordered products
- `{{total_amount}}` - Order total with formatting
- `{{shipping_address}}` - Customer's delivery address
- `{{shipping_details}}` - Tracking info and delivery details

#### Email Configuration
Configure SMTP settings in `appsettings.json`:
```json
{
  "EmailSettings": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUser": "your-email@gmail.com",
    "SmtpPass": "your-app-password",
    "FromEmail": "noreply@apyvyra.com",
    "FromName": "Apyvyra",
    "DevelopmentMode": true
  }
}
```

**Development Mode**: When `true`, emails are logged to console instead of being sent. Check the backend console for email logs.

## Project Structure

```
backend/
├── Controllers/          # Web API controllers (RESTful endpoints)
│   ├── BaseApiController.cs       # Base controller with error handling helpers
│   ├── AppUserController.cs       # User registration, login, authentication
│   ├── ProductController.cs       # Product CRUD operations
│   ├── ProductCategoryController.cs # Category management
│   ├── OrderController.cs         # Order management and processing
│   └── PaymentController.cs        # Payment processing with Stripe
├── Models/              # Entity Framework models (auto-generated from DB)
│   ├── AppUser.cs
│   ├── Product.cs
│   ├── ProductCategory.cs
│   ├── ProductUrl.cs
│   ├── CustomerOrder.cs
│   ├── OrderItem.cs
│   └── Payment.cs
├── Data/               # Entity Framework DbContext
│   └── AppDbContext.cs            # Database context with entity configurations
├── Services/           # Business logic layer
│   └── EmailService.cs            # Email sending with templates
├── Middleware/         # Custom middleware
│   └── ResponseHeadersMiddleware.cs # Adds X-Success and X-Errors headers
├── Enums/              # Application enums
│   ├── OrderStatus.cs              # Order status constants and helpers
│   └── PaymentStatus.cs           # Payment status constants and helpers
├── Helpers/            # Utility classes
│   └── QueryFilterHelper.cs        # Dynamic query filtering
├── email-templates/    # Email templates for customer communications
│   ├── confirmation.html           # User registration confirmation
│   ├── staff-invitation.html       # Staff account invitation
│   ├── order-confirmation.html     # Order confirmation to customers
│   └── order-shipped.html          # Shipping notification to customers
├── Program.cs          # Application entry point and service configuration
└── appsettings.json    # Configuration (connection strings, JWT, Stripe, Email)
```

## Key Features

### 1. **Entity Framework Core Integration**
- **DbContext**: `AppDbContext` manages all database entities
- **DbSets**: `AppUsers`, `Products`, `ProductCategories`, `ProductUrls`, `CustomerOrders`, `OrderItems`, `Payments`
- **Relationships**: Configured via Fluent API in `OnModelCreating`
- **Connection**: Npgsql provider for PostgreSQL
- **Configuration**: Registered in `Program.cs` with dependency injection

### 2. **RESTful Web API**
- **Controllers**: Inherit from `ControllerBase` or custom `BaseApiController`
- **Routing**: Attribute-based routing with `[Route("api/[controller]")]`
- **HTTP Verbs**: GET, POST, PUT, DELETE with proper status codes
- **DTOs**: Request/response models separate from entity models
- **Async/Await**: All database operations use async patterns

### 3. **JWT Authentication**
- **Protected Endpoints**: Use `[Authorize]` attribute
- **Public Endpoints**: `POST /api/app_user` (register), `POST /api/app_user/login`
- **Token Generation**: Created on successful login with user claims
- **Token Validation**: Configured in `Program.cs` with issuer, audience, and signing key
- **Bearer Scheme**: Tokens sent in `Authorization: Bearer <token>` header

### 4. **Error Handling**
- **Custom Headers**: `X-Success` (true/false) and `X-Errors` (JSON array)
- **BaseApiController**: Helper methods for consistent error responses:
  - `BadRequestWithErrors()`
  - `NotFoundWithError()`
  - `ConflictWithError()`
  - `InternalServerErrorWithError()`
- **Middleware**: `ResponseHeadersMiddleware` adds headers to all responses
- **CORS**: Custom headers exposed via `WithExposedHeaders()`

### 5. **Database Auditing**
- **Audit Fields**: All entities include:
  - `created_at` (TIMESTAMPTZ)
  - `created_by` (foreign key to app_user)
  - `updated_at` (TIMESTAMPTZ)
  - `updated_by` (foreign key to app_user)
- **Automatic Timestamps**: Default values set in database schema
- **User Tracking**: Controllers populate created_by/updated_by from JWT claims

### 6. **CORS Configuration**
- **Policy**: `AllowFrontend` allows localhost origins
- **Credentials**: Enabled for cookie/auth header support
- **Custom Headers**: `X-Success`, `X-Errors`, `X-Has-More-Records`, `X-Total-Count` exposed to frontend
- **Methods**: All HTTP methods allowed

### 7. **Query Limiting (Modern Filtering Approach)**
- **Configuration**: `MAX_RECORDS_QUERIES_COUNT` in `appsettings.json` (default: 100)
- **Approach**: Returns only top N filtered records instead of traditional pagination
- **Headers**: Automatically sets `X-Has-More-Records` and `X-Total-Count` headers
- **Helper Method**: `ExecuteLimitedQueryAsync<T>()` in `BaseApiController`
- **Benefits**: Better performance, encourages precise filtering, reduces backend load
- **See**: `paging_vs_filtering.md` for detailed explanation

### 8. **Dynamic Server-Side Filtering (QueryFilterHelper)**

All list endpoints support **dynamic filtering** via query parameters using the `QueryFilterHelper` class. Filters are applied **before** the `MAX_RECORDS_QUERIES_COUNT` limit.

**Supported Operators**:
- `eq` (equals): `field=value`
- `ne` (not equals): `field_ne=value`
- `lt` (less than): `field_lt=value`
- `lte` (less than or equal): `field_lte=value`
- `gt` (greater than): `field_gt=value`
- `gte` (greater than or equal): `field_gte=value`
- `contains`: `field=value` (default for strings)
- `startsWith`: `field_startsWith=value`
- `endsWith`: `field_endsWith=value`
- `between`: `field_from=value1&field_to=value2`

**Examples**:
- `/api/product?name=nike` → Name contains "nike"
- `/api/product?price_gt=100` → Price > 100
- `/api/product?price_from=50&price_to=200` → Price between 50 and 200
- `/api/product?categoryId=5&isActive=true` → Category = 5 AND Active = true
- `/api/product?name_startsWith=Pro` → Name starts with "Pro"

**Implementation**:
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<ProductResponse>>> GetProducts()
{
    var query = _context.Products.Include(p => p.Category).AsQueryable();
    
    // Apply dynamic filters from query parameters
    query = Helpers.QueryFilterHelper.ApplyQueryFilters(query, Request.Query);
    
    var products = await ExecuteLimitedQueryAsync(query);
    return Ok(products);
}
```

**Benefits**:
- No need to define individual filter parameters
- Supports any entity property dynamically
- Consistent filtering across all endpoints
- Frontend can use reusable FilterComponent
- Type-safe conversions (int, decimal, DateTime, bool, etc.)
- Supports nested properties (e.g., `Category.Name`)

## API Endpoints

### Authentication
- `POST /api/app_user` - Register new user
- `POST /api/app_user/login` - Login and receive JWT token
- `GET /api/app_user/me` - Get current user info (requires auth)
- `GET /api/app_user` - List all users (Admin/Staff only)

### Products
- `GET /api/product` - List all products (with filtering)
- `GET /api/product/{id}` - Get product by ID
- `POST /api/product` - Create new product (requires auth)
- `PUT /api/product/{id}` - Update product (requires auth)
- `DELETE /api/product/{id}` - Delete product (requires auth)

### Product Categories
- `GET /api/product_category` - List all categories (with filtering)
- `GET /api/product_category/{id}` - Get category by ID
- `POST /api/product_category` - Create category (requires auth)
- `PUT /api/product_category/{id}` - Update category (requires auth)
- `DELETE /api/product_category/{id}` - Delete category (requires auth)

### Orders
- `GET /api/order` - List all orders (Admin/Staff only, with filtering)
- `GET /api/order/{id}` - Get order by ID
- `POST /api/order` - Create new order (requires auth)
- `PUT /api/order/{id}/status` - Update order status (Admin/Staff only)
- `GET /api/order/stats` - Get order statistics (Admin/Staff only)

### Payments
- `POST /api/payment/create-intent` - Create Stripe payment intent
- `POST /api/payment/confirm` - Confirm payment
- `POST /api/payment/webhook` - Stripe webhook handler
- `GET /api/payment/config` - Get payment configuration

## NuGet Packages

```xml
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.0" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
<PackageReference Include="Stripe.net" Version="45.8.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.2.1" />
```

## Key Features Added

### 9. **Order Management System**
- **Order Statuses**: Complete workflow from pending to completed
- **Status Transitions**: Logical validation for status changes
- **Order Filtering**: Dynamic filtering by customer, date, status
- **Email Notifications**: Automatic shipping confirmation emails
- **Order Statistics**: Comprehensive order analytics

### 10. **Payment Processing with Stripe**
- **Mock Mode**: Development-friendly payment simulation
- **Test Mode**: Real Stripe test environment integration
- **Webhooks**: Secure payment event handling
- **Payment Intents**: Modern Stripe payment flow
- **Error Handling**: Comprehensive payment error management

### 11. **Email Service with Templates**
- **Template System**: HTML email templates with variable substitution
- **Development Mode**: Console logging for development
- **SMTP Integration**: Configurable email delivery
- **Order Emails**: Confirmation and shipping notifications
- **User Emails**: Registration and staff invitations

## Development Workflow

### Making Schema Changes
1. Update `../database.sql` with new schema
2. Run DevOps tool to recreate database:
   ```bash
   cd ../devops
   dotnet run -- db-init
   ```
3. Regenerate EF Core models:
   ```bash
   cd ../backend
   dotnet ef dbcontext scaffold "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra" Npgsql.EntityFrameworkCore.PostgreSQL -o Models -c AppDbContext -d Data --context-dir Data --force
   ```
4. Update controllers and DTOs as needed

### Adding New Endpoints
1. Create or update controller in `Controllers/`
2. Add `[Authorize]` attribute if authentication required
3. Use `BaseApiController` helper methods for error handling
4. Return proper DTOs (not raw entity models)
5. Test with Swagger UI or HTTP client

## Testing

```bash
dotnet test
```

## Building for Production

```bash
dotnet publish -c Release -o ./publish
```

The published output can be containerized using the provided Dockerfile.

## Docker Support

Build and run with Docker:
```bash
docker build -t apyvyra-backend .
docker run -p 5000:5000 apyvyra-backend
```

Or use Docker Compose from project root:
```bash
docker-compose up backend
```

## Additional Resources

- [ASP.NET Core Web API Documentation](https://learn.microsoft.com/en-us/aspnet/core/web-api/)
- [Entity Framework Core Documentation](https://learn.microsoft.com/en-us/ef/core/)
- [Npgsql Entity Framework Provider](https://www.npgsql.org/efcore/)
- [JWT Authentication in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)
