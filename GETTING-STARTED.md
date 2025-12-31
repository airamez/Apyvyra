# Getting Started

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

## Stripe Payment Configuration

Apyvyra integrates with **Stripe** for payment processing. Stripe provides a robust test mode that allows you to fully test payments without processing real transactions.

### 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create a free account (no credit card required for test mode)
3. Verify your email address

### 2. Get Your API Keys

1. Log in to your Stripe Dashboard
2. Make sure **Test mode** is enabled (toggle in the top-right corner)
3. Go to **Developers** → **API keys**
4. Copy your keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Starts with `sk_test_`

### 3. Configure Backend

Update `backend/appsettings.json` with your Stripe keys:

```json
{
  "Stripe": {
    "SecretKey": "sk_test_your_stripe_secret_key_here",
    "PublishableKey": "pk_test_your_stripe_publishable_key_here",
    "WebhookSecret": "whsec_your_webhook_secret_here",
    "TestMode": true
  }
}
```

### 4. Test Card Numbers

In test mode, use these card numbers for testing:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment declined |

Use any future expiration date (e.g., `12/34`) and any 3-digit CVC.

### 5. Webhook Configuration (Optional)

For production or advanced testing, configure webhooks:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/payment/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`) to your configuration

### 6. Local Development Without Stripe

Apyvyra supports a mock mode for local development and demos without requiring a Stripe account.

#### Mock Mode Configuration

Set `MockStripe: true` in your configuration to enable payment simulation:

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

**In Mock Mode:**
- No Stripe account or valid API keys required
- No external network calls to Stripe
- Shows a simplified payment UI
- Payments are automatically approved with one click
- Perfect for demos, testing, and offline development

#### Stripe Test Mode (Real Stripe with Test Keys)

For integration testing with real Stripe (requires internet and Stripe account):

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

**In Test Mode:**
- Uses real Stripe.js and Stripe API
- No real charges are made
- Use test card `4242 4242 4242 4242` with any future expiry and CVC
- Full Stripe payment UI experience

### 7. Going Live

When ready for production:

1. Complete your Stripe account verification
2. Toggle off **Test mode** in Stripe Dashboard
3. Get your live API keys (start with `pk_live_` and `sk_live_`)
4. Update your configuration with live keys
5. Set `"TestMode": false` and `"MockStripe": false`

> **Important**: Never commit API keys to version control. Use environment variables or secrets management in production.

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
- [Coding Guidelines](CODING_GUIDELINES.md)
- [Paging vs Filtering](PAGING_VS_FILTERING.md)
