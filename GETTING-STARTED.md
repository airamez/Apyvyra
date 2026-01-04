# Getting Started

## Project Overview

Apyvyra is a modern e-commerce platform built with **multi-tier architecture**, featuring separate layers for frontend, backend, database, and DevOps tooling. The application supports multiple languages (English, Brazilian Portuguese, Spanish, and Hindi already configured), integrates with Stripe for payments, and includes Google Maps for address validation.

### Project Structure

```
Apyvyra/
├── devops/              # DevOps tooling and scripts
│   ├── Database/        # Database management tools
│   ├── Scripts/         # Deployment and utility scripts
│   └── README.md        # DevOps documentation
├── backend/             # ASP.NET Core Web API
│   ├── Controllers/     # API endpoints
│   ├── Models/          # Entity Framework models
│   ├── Services/        # Business logic services
│   ├── Resources/       # Translation files and email templates
│   ├── Program.cs       # Application entry point
│   └── appsettings.json # Backend configuration
├── frontend/            # React/TypeScript SPA
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client services
│   │   └── config/      # Application configuration
│   ├── public/          # Static assets
│   └── package.json     # Frontend dependencies
├── database/            # Database schema and migrations
│   └── schema.sql       # PostgreSQL database schema
├── docker-compose.yml   # Multi-service container orchestration
└── README.md           # Main project documentation
```

### Required Software

- **Node.js** (latest LTS) - [Download](https://nodejs.org/)
- **.NET SDK** (latest) - [Download](https://dotnet.microsoft.com/download)
- **Docker & Docker Compose** (latest) - [Download](https://www.docker.com/get-started)

## Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/airamez/Apyvyra.git
   cd Apyvyra
   ```

2. **Setup database**
   ```bash
   # Start PostgreSQL database
   docker-compose up -d db

   # Initialize database schema and load demo data
   cd devops
   dotnet run -- db-init
   dotnet run -- db-load-test-data
   cd ..
   ```

3. **Install dependencies**
   ```bash
   # Frontend dependencies
   cd frontend
   npm install
   ```


4. **Run the application**

   **Option A: Manual Development Setup (Recommended for Development)**
   ```bash
   # Terminal 1: Start database with Docker
   cd Apyvyra
   docker-compose up -d db

   # Terminal 2: Backend
   cd backend
   dotnet run watch

   # Terminal 3: Frontend
   cd frontend
   npm run dev

   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000
   - Database: localhost:5432

   **Features of manual development:**
   - **Live editing**: Code changes instantly reflected
   - **Hot reloading**: Both frontend and backend auto-reload
   - **Debugging**: Full debugging capabilities in IDE
   - **Source control**: Direct access to source files

   **Option B: Docker Mode (For Demo & Deployment)**
   ```bash
   # Start all services in containers
   docker-compose up --build
   ```
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000
   - Database: localhost:5432

   **Features of Docker mode:**
   - **Self-contained**: All services run in Docker containers
   - **Consistent setup**: Same configuration across all machines
   - **Easy deployment**: Ready for production deployment
   - **No local setup**: No need to install Node.js or .NET SDK

   **Stopping the containers**
   ```bash
   # Stop all services
   docker-compose down

   # To remove volumes (clears database data)
   docker-compose down -v
   ```
```

## Requirements

- **Frontend**: React/TypeScript single-page application with modern UI components
- **Backend**: ASP.NET Core Web API with Entity Framework Core and PostgreSQL
- **Database**: PostgreSQL database with comprehensive schema for products, orders, and users
- **DevOps**: Docker containers, deployment scripts, and database management tools
- **Internationalization**: Backend-driven translation system supporting multiple languages

## Application Settings

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

### Payment Processing (Stripe)

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

### JWT Authentication Settings

Apyvyra uses **JSON Web Tokens (JWT)** for secure authentication and authorization. JWT tokens are issued upon successful login and must be included in API requests.

**Configuration** (`backend/appsettings.json`):
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

**Settings Explained:**
- **`Key`**: Secret key used to sign and verify JWT tokens (must be at least 32 characters long)
- **`Issuer`**: Identifies the token issuer (typically your API)
- **`Audience`**: Identifies the intended recipient of the token (typically your frontend)
- **`ExpiresInMinutes`**: Token expiration time (default: 60 minutes)

**Security Notes:**
- 🔐 **Never commit the JWT key** to version control
- 🔐 Use environment variables in production: `"Jwt__Key": "your-secure-key"`
- 🔄 **Rotate keys regularly** in production
- ⚡ **Keep expiration time reasonable** to balance security and user experience

### Email Configuration (SMTP)

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

### Address Validation (Google Maps)

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

### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```bash
VITE_API_URL=http://localhost:5000
```

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

## Additional Resources

- [Main README](README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [DevOps Documentation](devops/README.md)
- [Architecture Overview](ARCHITECTURE.md)
