# Getting Started

## Quick Setup Overview

### Payment Processing (Stripe)
- **What it's for**: Processing credit card payments during checkout
- **Setup URL**: [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
- **API Keys**: Get from [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
- **Cost**: Free for development, 2.9% + 30¢ per transaction in production
- **Testing**: Use test mode with test card numbers (no real charges)

### Address Validation (Google Maps)
- **What it's for**: Validating and standardizing shipping addresses during checkout
- **Setup URL**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
- **API Keys**: Create at [Google Cloud → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
- **Cost**: $200 monthly free credit, then ~$0.017 per validation request
- **Testing**: Mock mode available (no API key required for development)

## Prerequisites

- Node.js (latest) - [https://nodejs.org/](https://nodejs.org/)
- .NET SDK (latest) - [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
- Docker & Docker Compose (latest) - [https://www.docker.com/get-started](https://www.docker.com/get-started)

## Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/airamez/Apyvyra.git
   cd Apyvyra
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   cd ..
   ```

   >Note: Backend dependencies are restored automatically

3. **Setup database**
   ```bash
   # Start the database container
   # At the root folder
   docker-compose up -d db

   # Initialize database schema
   # at devops folder
   dotnet run -- db-init

   # Load demo data
   dotnet run -- db-load-test-data
   ```

4. **Run the application with Docker**
   ```bash
   # At root folder
   # Start all services with Docker
   docker-compose up

   # Or run manually (see below)
   ```

## Run the application manually (for development)

- **Database**: 
  ```bash
  # At root folder
  docker-compose up -d db

  # Initialize database schema
  # At devops folder
  dotnet run -- db-init

  # Load demo data
  dotnet run -- db-load-test-data
  ```
- **Backend**:
  ```bash
  # At backend folder
  dotnet run watch
  ```
  >Note: (Backend at http://localhost:5000)
- **Frontend**:
  ```bash
  # At fronend folder
  sudo npm run dev
  ```
  >Note: (Frontend at http://localhost:80). The `sudo` is required becase of the pot 80

## Email Configuration

Email configuration is handled through the backend `appsettings.json` file. For SMTP settings and email templates, see the [Backend README](backend/README.md) for detailed configuration instructions.

## Google Maps Address Validation Configuration

Apyvyra integrates with **Google Maps Platform** for address validation during checkout. You have three configuration options depending on your development stage:

### Option 1: Mock Mode (Recommended for Local Development)

Perfect for demos, testing, and offline development without requiring a Google Maps API key or internet connection.

**Configuration:**
```json
{
  "GoogleMaps": {
    "ApiKey": "YOUR_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": true
  }
}
```

**Features:**
- No Google Maps API key required
- No external network calls to Google
- Basic US address format validation
- Validates street number, street name, city, state, and zip code
- Perfect for demos, testing, and offline development

### Option 2: Test Mode with Real Google Maps API

For integration testing with real Google Maps infrastructure using a free API key.

**Setup Steps:**
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Places API"
   - Click **Enable**
4. Enable the **Geocoding API** (optional, for additional features):
   - Search for "Geocoding API"
   - Click **Enable**
5. Create an API key:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy your API key
6. Restrict your API key (recommended):
   - Click on your API key
   - Under **Application restrictions**, select **HTTP referrers**
   - Add your development domain (e.g., `localhost:*`)
   - Under **API restrictions**, select **Restrict key**
   - Select **Places API** and **Geocoding API**

**Configuration:**
```json
{
  "GoogleMaps": {
    "ApiKey": "YOUR_ACTUAL_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": false
  }
}
```

**Features:**
- Uses real Google Places API
- Comprehensive address validation and autocomplete
- Returns formatted addresses and place IDs
- Free tier includes $200 monthly credit (typically sufficient for development)
- Requires internet connection and Google Cloud project

### Option 3: Production Mode

For live applications with real address validation.

**Setup Steps:**
1. Complete your Google Cloud project setup
2. Secure your API key:
   - Restrict by IP address or domain
   - Enable API key restrictions
   - Monitor usage in Google Cloud Console
3. Consider enabling billing if you expect high usage:
   - Google Maps Platform offers $200 monthly free credit
   - Additional usage is billed per request
   - Monitor costs in Google Cloud Console

**Configuration:**
```json
{
  "GoogleMaps": {
    "ApiKey": "YOUR_PRODUCTION_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": false
  }
}
```

**Features:**
- Production-grade address validation
- Stores Google Place IDs for future reference
- Comprehensive address components and formatting
- Requires proper API key security measures

### API Usage and Costs

**Free Tier:**
- $200 monthly credit automatically applied
- Places API: ~$0.017 per request
- Geocoding API: ~$0.005 per request
- Typically covers thousands of validation requests per month

**Cost Management:**
- Set up budget alerts in Google Cloud Console
- Monitor usage in Google Maps Platform
- Consider usage quotas and limits

> **Important**: Never commit API keys to version control. Use environment variables or secrets management in production.

## Internationalization (i18n) / Translation System

Apyvyra includes a **backend-driven translation system** that allows the application to be deployed in different languages. The language is configured in `appsettings.json` and all translations are served from the backend.

### Architecture Overview

```
Backend (Translation Service)
├── Resources/Translations/
│   ├── en-US/           # English (US) translations
│   │   ├── Common.json
│   │   ├── Login.json
│   │   ├── Register.json
│   │   └── ...
│   ├── es-MX/           # Spanish (Mexico) - add as needed
│   └── pt-BR/           # Portuguese (Brazil) - add as needed
│
Frontend (Translation Hook)
├── useTranslation('ComponentName')  # Fetches and caches translations
└── t('KEY')                         # Returns translated string
```

### Configuration

**Backend** (`appsettings.json`):
```json
{
  "Localization": {
    "Language": "en-US",
    "ResourcePath": "Resources/Translations"
  }
}
```

### Translation File Format

Each component has its own JSON file with key-value pairs:

**Example** (`Resources/Translations/en-US/Login.json`):
```json
{
  "TITLE": "Login",
  "EMAIL_ADDRESS": "Email Address",
  "PASSWORD": "Password",
  "LOGIN_BUTTON": "Login",
  "LOGGING_IN": "Logging in...",
  "LOGIN_SUCCESS": "Login successful! Welcome back.",
  "DONT_HAVE_ACCOUNT": "Don't have an account?",
  "SIGN_UP_HERE": "Sign up here"
}
```

### Frontend Usage

```tsx
import { useTranslation } from '../../hooks/useTranslation';

export default function Login() {
  const { t } = useTranslation('Login');
  const { t: tCommon } = useTranslation('Common');

  return (
    <TextField label={t('EMAIL_ADDRESS')} />
    <Button>{t('LOGIN_BUTTON')}</Button>
    <Button>{tCommon('CANCEL')}</Button>
  );
}
```

### Parameter Substitution

Translations support parameter substitution using `{paramName}` syntax:

**Translation file**:
```json
{
  "WELCOME_MESSAGE": "Welcome, {fullName}!"
}
```

**Usage**:
```tsx
t('WELCOME_MESSAGE', { fullName: 'John Doe' })
// Returns: "Welcome, John Doe!"
```

### Adding a New Language

1. Create a new folder under `Resources/Translations/` (e.g., `es-MX/`)
2. Copy all JSON files from `en-US/` to the new folder
3. Translate all values in the JSON files
4. Update `appsettings.json` to use the new language:
   ```json
   {
     "Localization": {
       "Language": "es-MX"
     }
   }
   ```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/translation/language` | Returns current language |
| `GET /api/translation/{component}` | Returns translations for a component |

### Available Translation Files

| Component | Description |
|-----------|-------------|
| `Common` | Shared strings (Cancel, Save, Delete, etc.) |
| `Login` | Login page |
| `Register` | Registration page |
| `EmailConfirmation` | Email confirmation page |
| `StaffSetup` | Staff account setup |
| `WelcomePage` | Welcome/home page |
| `Store` | Product store |
| `ShoppingCart` | Shopping cart |
| `Checkout` | Checkout process |
| `Payment` | Payment page |
| `MyOrders` | Customer orders |
| `Dashboard` | Admin dashboard |
| `Staff` | Staff management |
| `Products` | Product management |
| `Categories` | Category management |
| `Customers` | Customer management |
| `OrderManagement` | Order management |
| `Navigation` | Menu/navigation items |
| `Validation` | Validation messages |
| `UserProfile` | User profile |

## Stripe Payment Configuration

Apyvyra integrates with **Stripe** for payment processing. You have three configuration options depending on your development stage:

### Option 1: Mock Mode (Recommended for Local Development)

Perfect for demos, testing, and offline development without requiring a Stripe account or internet connection.

**Configuration:**
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

**Features:**
- No Stripe account required
- No external network calls to Stripe
- Shows a simplified payment UI
- Payments are automatically approved with one click
- Perfect for demos, testing, and offline development

### Option 2: Test Mode with Real Stripe

For integration testing with real Stripe infrastructure using test keys (no real charges).

**Setup Steps:**
1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create a free account (no credit card required for test mode)
3. Verify your email address
4. Log in to your Stripe Dashboard
5. Make sure **Test mode** is enabled (toggle in the top-right corner)
6. Go to **Developers** → **API keys**
7. Copy your keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Starts with `sk_test_`

**Configuration:**
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

**Test Card Numbers:**
| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment declined |

Use any future expiration date (e.g., `12/34`) and any 3-digit CVC.

**Features:**
- Uses real Stripe.js and Stripe API
- No real charges are made
- Full Stripe payment UI experience
- Requires internet connection and Stripe account

### Option 3: Production Mode

For live applications with real payments.

**Setup Steps:**
1. Complete your Stripe account verification
2. Toggle off **Test mode** in Stripe Dashboard
3. Get your live API keys (start with `pk_live_` and `sk_live_`)
4. Configure webhooks (optional but recommended):
   - Go to **Developers** → **Webhooks** in Stripe Dashboard
   - Click **Add endpoint**
   - Enter your webhook URL: `https://your-domain.com/api/payment/webhook`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Copy the **Signing secret** (starts with `whsec_`) to your configuration

**Configuration:**
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

**Features:**
- Processes real payments
- Requires verified Stripe account
- Webhooks recommended for payment confirmations
- Full production Stripe environment

> **Important**: Never commit API keys to version control. Use environment variables or secrets management in production.

## Currency and Number Formatting Configuration

Apyvyra supports configurable currency and number formatting to adapt to different regions and business requirements. The currency settings are defined in the frontend application configuration.

### Configuration Structure

The currency configuration is managed through the frontend app configuration system:

**Location**: `frontend/src/config/app.ts`

```typescript
export interface AppConfig {
  currency: {
    code: string;           // ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP')
    symbol: string;         // Currency symbol (e.g., '$', '€', '£')
    locale: string;         // Locale for number formatting (e.g., 'en-US', 'de-DE', 'fr-FR')
  };
  dateFormat: {
    locale: string;         // Locale for date formatting
    options: Intl.DateTimeFormatOptions;
  };
}
```

### Default Configuration

```typescript
export const defaultAppConfig: AppConfig = {
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
  dateFormat: {
    locale: 'en-US',
    options: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  },
};
```

### Supported Currencies

The system supports any currency that can be formatted by JavaScript's `Intl.NumberFormat`. Common examples:

| Currency | Code | Symbol | Locale | Example |
|----------|------|--------|---------|---------|
| US Dollar | USD | $ | en-US | $1,234.56 |
| Euro | EUR | € | de-DE | 1.234,56 € |
| British Pound | GBP | £ | en-GB | £1,234.56 |
| Japanese Yen | JPY | ¥ | ja-JP | ¥1,235 |
| Canadian Dollar | CAD | $ | en-CA | $1,234.56 |
| Australian Dollar | AUD | $ | en-AU | $1,234.56 |

### Usage in Components

**Import the formatting utilities:**
```typescript
import { formatCurrency, formatDate } from '../../config/app';
```

**Use in components:**
```typescript
// Currency formatting
formatCurrency(1234.56);  // Returns: $1,234.56 (based on current config)

// Date formatting  
formatDate('2024-01-15'); // Returns: Jan 15, 2024 (based on current config)
```

### Dynamic Configuration

The currency configuration can be updated at runtime to support user preferences or regional settings:

```typescript
import { updateAppConfig } from '../../config/app';

// Update to European configuration
updateAppConfig({
  currency: {
    code: 'EUR',
    symbol: '€', 
    locale: 'de-DE',
  }
});
```

### API Integration

For production applications, currency settings can be loaded from the backend API:

**API Endpoint**: `GET /api/app/settings`

**Expected Response:**
```json
{
  "data": {
    "currency": {
      "code": "EUR",
      "symbol": "€",
      "locale": "de-DE"
    },
    "dateFormat": {
      "locale": "de-DE",
      "options": {
        "year": "numeric",
        "month": "short", 
        "day": "numeric"
      }
    }
  }
}
```

### Implementation Notes

- **Browser Compatibility**: Uses native `Intl.NumberFormat` and `Intl.DateTimeFormat` APIs
- **Performance**: Configuration is cached in memory for efficient formatting
- **Fallback**: If configuration fails to load, defaults to USD/en-US
- **Extensibility**: Easy to add new currencies and locales by updating the configuration

### Testing Different Currencies

To test different currency configurations:

1. **Temporary Override** (for testing):
```typescript
// In browser console
import { updateAppConfig } from './config/app';
updateAppConfig({ currency: { code: 'EUR', symbol: '€', locale: 'de-DE' }});
```

2. **Environment-based Configuration**:
Create different configuration files for different deployment regions.

3. **User Preferences**:
Store user's preferred currency in their profile and apply it on login.

## Application Configuration

### Default Ports and URLs
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432 (PostgreSQL)

### Configuration Files

#### Backend Configuration (`backend/appsettings.json`)
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
    "EnableSsl": true
  },
  "Stripe": {
    "SecretKey": "sk_test_your_stripe_secret_key_here",
    "PublishableKey": "pk_test_your_stripe_publishable_key_here",
    "WebhookSecret": "whsec_your_webhook_secret_here",
    "TestMode": true,
    "MockMode": false,
    "MockServerUrl": "http://localhost:12111",
    "BypassPayment": false
  },
  "GoogleMaps": {
    "ApiKey": "YOUR_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": true
  },
  "BaseUrl": "http://localhost:5000",
  "QuerySettings": {
    "MAX_RECORDS_QUERIES_COUNT": 100
  }
}
```

#### Frontend Configuration (Environment Variables)
Create `.env` file in frontend directory:
```bash
VITE_API_URL=http://localhost:5000
```

#### Docker Configuration (`docker-compose.yml`)
- **Database Service**: PostgreSQL 15 on port 5432
- **Backend Service**: .NET application on port 5000
- **Frontend Service**: Node.js development server on port 80

### User Roles and Permissions
- **Admin (user_type = 0)**: Full access to all features including staff management
- **Staff (user_type = 1)**: Can manage products, categories, customers
- **Customer (user_type = 2)**: Can view products and place orders

### Database Schema
- **Tables**: `app_user`, `product`, `product_category`, `product_url`, `customer_order`, `order_item`
- **Audit Fields**: All tables include `created_at`, `created_by`, `updated_at`, `updated_by`
- **Timestamps**: All use `TIMESTAMPTZ` (UTC with timezone info)
- **Money Fields**: Use `DECIMAL(19,4)` for precise financial calculations

### Order Status Workflow
Orders follow this status progression:

| Status | Name | Description |
|--------|------|-------------|
| 0 | Pending Payment | Order created, awaiting payment |
| 1 | Paid | Payment successful, ready for processing |
| 2 | Processing | Order being prepared |
| 3 | Shipped | Order shipped to customer |
| 4 | Delivered | Order delivered |
| 5 | Cancelled | Order cancelled |

### Payment Status
| Status | Name | Description |
|--------|------|-------------|
| 0 | Pending | Payment not yet attempted |
| 1 | Succeeded | Payment completed successfully |
| 2 | Failed | Payment failed |
| 3 | Refunded | Payment refunded |

## Documentation
- [Main README](README.md)
- [DevOps](devops/README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Architecture](ARCHITECTURE.md)
- [Paging vs Filtering](PAGING_VS_FILTERING.md)
