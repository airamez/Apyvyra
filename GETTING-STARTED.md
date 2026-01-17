# Getting Started

## Project Overview

* Apyvyra is an open source ERP platform built with **multi-tier architecture**, featuring separate layers for frontend, backend, database, and DevOps tooling.
* Provide a easy way to support Internationalization.
  * Already supporting:
    * English
    * Brazilian Portuguese
    * Spanish
    * Hindi
* Integrates with
  * Email (SMTP)
  * Stripe for payments
  * Google Maps for address validation.

### Project Structure

- **Frontend**: React/TypeScript single-page application with modern UI components
- **Backend**: ASP.NET Core Web API with Entity Framework Core and PostgreSQL
- **Database**: PostgreSQL database with comprehensive schema for products, orders, and users
- **DevOps**: Docker containers, deployment scripts, and database management tools
- **Internationalization**: Backend-driven translation system supporting multiple languages

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
├── database.sql         # PostgreSQL database schema
├── docker-compose.yml   # Multi-service container orchestration
└── README.md           # Main project documentation
```

### Required Software

- **Node.js** (latest LTS) - [Download](https://nodejs.org/)
- **.NET SDK** (latest) - [Download](https://dotnet.microsoft.com/download)
- **Docker & Docker Compose** (latest) - [Download](https://www.docker.com/get-started)

## Quick Setup

* The default urls/ports are:
  * Frontend: http://localhost:8080
  * Backend API: http://localhost:5000
  * Database: localhost:5432

* **Clone the repository**
   ```bash
   git clone https://github.com/airamez/Apyvyra.git
   ```

* **Setup database**

  ```bash
  cd Apyvyra
  # Start PostgreSQL database
  docker-compose up -d db
  # Initialize database schema and load demo data
  cd devops
  dotnet run -- db-init
  ```

  >Note:  The `db-init` argument executes the  `database.sql`

* **Load test data**

  ```bash
  # Initialize database schema and load demo data
  cd devops
  dotnet run -- db-load-test-data
  ```

  >Note: The `db-load-test-data` argument executes the `database_test_data.sql`

* **Install dependencies**

  ```bash
  # Frontend dependencies
  cd frontend
  npm install
  ```

* **Run the application for development**
  * Terminal 1: Start database with Docker

    ```bash
    cd Apyvyra
    docker-compose up -d db
    ```

  * Terminal 2: Backend

    ```bash
    cd backend
    dotnet run watch
    ```

  * Terminal 3: Frontend

    ```bash
    cd frontend
    npm run dev
    ```

* **Run the application with docker (For Demo & Deployment)**

  ```bash
  # Start all services in containers
  docker-compose up --build
  ```

   **Stopping the containers**

   ```bash
   # Stop all services
   docker-compose down

   # To remove volumes (clears database data)
   docker-compose down -v
   ```

## Database Model

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              APYVYRA DATABASE SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌───────────────────┐
                              │    app_user       │
                              ├───────────────────┤
                              │ id (PK)           │◄─────────────────────────────────────┐
                              │ email (UNIQUE)    │                                      │
                              │ password          │  (All tables reference app_user      │
                              │ full_name         │   via created_by / updated_by)       │
                              │ user_type         │                                      │
                              │ status            │                                      │
                              │ confirmation_token│                                      │
                              │ created_at        │                                      │
                              │ updated_at        │                                      │
                              └───────────────────┘                                      │
                                       ▲                                                 │
                                       │ 1:1                                             │
                                       │                                                 │
┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐        │
│     address       │◄────────│     customer      │         │  product_category │        │
├───────────────────┤         ├───────────────────┤         ├───────────────────┤        │
│ id (PK)           │         │ id (PK)           │         │ id (PK)           │◄──┐    │
│ address_line      │         │ app_user_id (FK)──┼─────────│ name              │   │    │
│ google_place_id   │         │ phone             │         │ description       │   │    │
│ formatted_address │         │ notes             │         │ parent_category_id├───┘    │
│ country           │         │ address_id (FK)───┼────┐    │ is_active         │        │
│ state             │         │ created_at        │    │    │ created_at        │        │
│ city              │         │ created_by (FK)───┼────┼────│ created_by (FK)───┼────────┤
│ postal_code       │         │ updated_by (FK)───┼────┼────│ updated_by (FK)───┼────────┤
│ is_validated      │◄────────┼───────────────────┼────┘    └───────────────────┘        │
│ created_at        │         └───────────────────┘                  │                   │
│ created_by (FK)───┼────────────────────┼───────────────────────────┼───────────────────┤
│ updated_by (FK)───┼────────────────────┼───────────────────────────┼───────────────────┤
└───────────────────┘                    │                           │                   │
         ▲                               │                           ▼                   │
         │                               ▼                  ┌───────────────────┐        │
         │                      ┌───────────────────┐       │      product      │        │
         │                      │customer_phone_call│       ├───────────────────┤        │
         │                      ├───────────────────┤       │ id (PK)           │        │
         │                      │ id (PK)           │       │ sku (UNIQUE)      │        │
         │                      │ customer_id (FK)──┼───┐   │ name              │        │
         │                      │ call_date         │   │   │ description       │        │
         │                      │ call_type         │   │   │ category_id (FK)──┼────────┤
         │                      │ duration_minutes  │   │   │ price             │        │
         │                      │ notes             │   │   │ cost_price        │        │
         │                      │ created_at        │   │   │ tax_rate          │        │
         │                      │ created_by (FK)───┼───┼───│ stock_quantity    │        │
         │                      │ updated_by (FK)───┼───┼───│ brand             │        │
         │                      └───────────────────┘   │   │ manufacturer      │        │
         │                               │              │   │ is_active         │        │
         │                               │              │   │ created_by (FK)───┼────────┤
         │                               │              │   │ updated_by (FK)───┼────────┤
         │                               │              │   └───────────────────┘        │
         │                               │              │            │                   │
         │                               │              │            ▼                   │
         │                               │              │   ┌───────────────────┐        │
         │                               │              │   │    product_url    │        │
         │                               │              │   ├───────────────────┤        │
         │                               │              │   │ id (PK)           │        │
         │                               │              │   │ product_id (FK)───┼────┐   │
         │                               │              │   │ url               │    │   │
         │                               │              │   │ url_type          │    │   │
         │                               │              │   │ alt_text          │    │   │
         │                               │              │   │ display_order     │    │   │
         │                               │              │   │ is_primary        │    │   │
         │                               │              │   │ created_at        │    │   │
         │                               │              │   │ created_by (FK)───┼────┼───┤
         │                               │              │   └───────────────────┘    │   │
         │                               │              │                            │   │
         │                               ▼              ▼                            │   │
         │                      ┌───────────────────┐                                │   │
         │                      │  customer_order   │◄───────────────────────────────┼───┤
         │                      ├───────────────────┤                                │   │
         │                      │ id (PK)           │◄───────────────────────┐       │   │
         │                      │ order_number      │                        │       │   │
         │                      │ customer_id (FK)──┼────────────────────────┼───────┤   │
         │                      │ status            │                        │       │   │
         │                      │ payment_status    │                        │       │   │
         │◄─────────────────────┤ shipping_addr_id  │                        │       │   │
         │                      │ subtotal          │                        │       │   │
         │                      │ tax_amount        │                        │       │   │
         │                      │ total_amount      │                        │       │   │
         │                      │ notes             │                        │       │   │
         │                      │ stripe_payment_id │                        │       │   │
         │                      │ paid_at           │                        │       │   │
         │                      │ order_date        │       ┌───────────────────┐    │   │
         │                      │ created_by (FK)───┼───────│    order_item     │    │   │
         │                      │ updated_by (FK)───┼───────├───────────────────┤    │   │
         │                      └───────────────────┘       │ id (PK)           │    │   │
         │                                                  │ order_id (FK)─────┼────┘   │
         │                                                  │ product_id (FK)───┼────────┘
         │                                                  │ product_name      │
         │                                                  │ product_sku       │
         │                                                  │ quantity          │
         │                                                  │ unit_price        │
         │                                                  │ tax_rate          │
         │                                                  │ tax_amount        │
         │                                                  │ line_total        │
         │                                                  │ created_at        │
         └──────────────────────────────────────────────────┴───────────────────┘

LEGEND:
  PK = Primary Key       FK = Foreign Key
  ─► = References (Many-to-One)
  ◄─ = Referenced by (One-to-Many)
  ◄──┐/┘ = Self-Reference

RELATIONSHIPS:
  customer.app_user_id ──────────► app_user.id (1:1)
  customer.address_id ───────────► address.id
  customer_phone_call.customer_id► customer.id
  customer_order.customer_id ────► customer.id
  customer_order.shipping_addr_id► address.id
  order_item.order_id ───────────► customer_order.id
  order_item.product_id ─────────► product.id
  product.category_id ───────────► product_category.id
  product_category.parent_id ────► product_category.id (self-ref)
  product_url.product_id ────────► product.id
  All tables ────────────────────► app_user.id (created_by/updated_by)
```

## Mock Mode Configuration

The Apyvyra application runs in **mocking mode** by default for `email`, `Google Maps`, and `Stripe integration. This allows you to run demos and tests without requiring third-party service integration or API keys.

### Email Service (Mock Mode)

In mock mode, emails are printed to the backend console instead of being sent or retrived via SMTP/IMAP. This is perfect for demo, development and testing without requiring email credentials.

**Mock Configuration** (default in `backend/appsettings.json`):
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

### Payment Processing (Stripe Mock Mode)

In mock mode, payments are simulated and no real charges are made. This is perfect for demo, development and testing without requiring a Stripe account.

**Mock Configuration** (default in `backend/appsettings.json`):
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

**Mock Mode Features:**
- 💳 **Simulated Payments**: All payment operations succeed without real charges
- 🔗 **Mock Webhooks**: Webhook events are simulated locally
- 🧪 **Test Scenarios**: Perfect for testing payment flows
- 📊 **Demo Ready**: Great for product demonstrations

### Address Validation (Google Maps Mock Mode)

Basic address validation without Google Maps API key requirements.

**Mock Configuration** (default in `backend/appsettings.json`):
```json
{
  "GoogleMaps": {
    "ApiKey": "YOUR_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": true
  }
}
```

**Mock Mode Features:**
- 🏠 **Basic Validation**: Simple address format validation
- 🌍 **No API Calls**: No requests to Google Maps services
- ⚡ **Instant Response**: Immediate validation results
- 🔒 **Privacy**: No address data sent to external services

## Production Configuration

When you're ready to move to production, you'll need to configure real services. Below are the setup instructions for each service.

### Email Service Configuration

#### Option 1: Test Mode (Recommended for Local Development)
Keep using the mock mode with `"DevelopmentMode": true` as shown above.

#### Option 2: SMTP Mode (Real Email Delivery)

**Gmail Configuration:**
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

**Gmail App Password Setup:**
1. Enable 2-Step Verification in your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" for app and "Other (Custom name)" for device
4. Enter "Apyvyra" as the custom name
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Use this password in your configuration

**Other SMTP Providers:**
- **Outlook**: `smtp.office365.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom**: Use your provider's SMTP settings

### Stripe Payment Configuration

#### Option 1: Test Mode with Real Stripe
For integration testing with real Stripe infrastructure using test keys (no real charges).

**Setup Steps:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Create a free account (no credit card required for test mode)
3. Verify your email address
4. Enable **Test mode** (toggle in the top-right corner)
5. Go to **Developers** → **API keys**
6. Copy your test keys (starts with `pk_test_` and `sk_test_`)

**Test Mode Configuration:**
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
- `4242 4242 4242 4242` - Successful payment
- `4000 0000 0000 9995` - Payment declined

#### Option 2: Production Mode
For live applications with real payments.

**Production Configuration:**
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

### Google Maps Configuration

#### Production Mode Setup
Real Google Maps integration for comprehensive address validation.

**Setup Steps:**
1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable billing (required for Maps APIs)

2. **Enable Required APIs**
   - In the navigation menu, go to **APIs & Services** → **Library**
   - Search for and enable these APIs:
     - **Geocoding API** (for address validation)

3. **Create API Key**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **API key**
   - Copy the generated API key

4. **Restrict API Key (Important for Security)**
   - Click on the created API key
   - Under **Application restrictions**, select **HTTP referrers** (web) or **IP addresses** (server)
   - For development: Add `localhost:*` and your development server IP
   - For production: Add your domain (e.g., `*.yourdomain.com`)
   - Under **API restrictions**, select **Restrict key** and choose:
     - Places API
     - Geocoding API
     - Maps JavaScript API (if needed)

5. **Update Configuration**
   - Replace the placeholder API key in your backend configuration
   - Set `MockAddressValidation` to `false`

**Production Configuration:**
```json
{
  "GoogleMaps": {
    "ApiKey": "YOUR_ACTUAL_GOOGLE_MAPS_API_KEY",
    "MockAddressValidation": false
  }
}
```

**Environment Variable Method (Recommended for Production):**
```bash
# Set environment variable instead of hardcoding in appsettings.json
GoogleMaps__ApiKey="YOUR_ACTUAL_GOOGLE_MAPS_API_KEY"
GoogleMaps__MockAddressValidation="false"
```

**Testing Your Configuration:**
- Start the backend application
- Check the console logs for any Google Maps warnings
- Try validating an address through the API endpoint
- Mock mode will automatically fallback if API key is invalid

**Common Issues & Solutions:**
- **"API key not authorized"**: Check API restrictions and enabled APIs
- **"ZERO_RESULTS"**: Try with more specific address formats
- **"REQUEST_DENIED"**: Verify API key is correctly set and not restricted too tightly

### Security Considerations

⚠️ **SECURITY WARNING: Sensitive Configuration**

**🚨 NEVER commit the following sensitive information to version control:**

- **JWT Key**: `Jwt.Key` - Use environment variable: `Jwt__Key`
- **Stripe Keys**: `Stripe.SecretKey`, `Stripe.PublishableKey`, `Stripe.WebhookSecret`
- **Email Password**: `EmailSettings.Password` - Use environment variable: `EmailSettings__Password`
- **Google Maps API Key**: `GoogleMaps.ApiKey` - Use environment variable: `GoogleMaps__ApiKey`
- **Database Password**: `ConnectionStrings.DefaultConnection`

**For production deployments:**
1. Remove sensitive values from `appsettings.json`
2. Use environment variables or cloud secret management services
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

## Additional Configuration

For additional details about the application architecure please refer to the **[ARCHITECTURE.md](ARCHITECTURE.md)** document.

## Additional Resources

- [Main README](README.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [DevOps Documentation](devops/README.md)
