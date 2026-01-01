# Getting Started

## Project Overview

Apyvyra is a modern e-commerce platform built with **multi-tier architecture**, featuring separate layers for frontend, backend, database, and DevOps tooling. The application supports multiple languages (English and Brazilian Portuguese already configured), integrates with Stripe for payments, and includes Google Maps for address validation.

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

   **Option A: Using Docker (Recommended)**
   ```bash
   # Start all services (frontend, backend, database)
   docker-compose up
   ```
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000

   **Option B: Manual development setup**
   ```bash
   # Terminal 1: Database (if not using Docker)
   ```bash
   cd Apyvyra
   docker-compose up -d db
   ```

   # Terminal 2: Backend
   cd backend
   dotnet run watch

   # Terminal 3: Frontend
   cd frontend
   sudo npm run dev # sudo is required because it is running on port 80

   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000

## Requirements

- **Frontend**: React/TypeScript single-page application with modern UI components
- **Backend**: ASP.NET Core Web API with Entity Framework Core and PostgreSQL
- **Database**: PostgreSQL database with comprehensive schema for products, orders, and users
- **DevOps**: Docker containers, deployment scripts, and database management tools
- **Internationalization**: Backend-driven translation system supporting multiple languages

## Application Settings

### Language & Translation Configuration

Apyvyra includes a **backend-driven translation system** that allows the application to be deployed in different languages. Currently supports English (`en-US`) and Brazilian Portuguese (`pt-BR`).

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
└── pt-BR/              # Portuguese translations
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

### Email Configuration (SMTP)

Email configuration is handled through the backend `appsettings.json` file.

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

## Additional Resources

- [Main README](README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [DevOps Documentation](devops/README.md)
- [Architecture Overview](ARCHITECTURE.md)
