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

## Run THe application manually (for development)

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

For email confirmation setup and SMTP configuration, see: [Email Confirmation Setup Guide](EMAIL_CONFIRMATION_SETUP.md)

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
- **Tables**: `app_user`, `product`, `product_category`, `product_url`
- **Audit Fields**: All tables include `created_at`, `created_by`, `updated_at`, `updated_by`
- **Timestamps**: All use `TIMESTAMPTZ` (UTC with timezone info)
- **Money Fields**: Use `DECIMAL(19,4)` for precise financial calculations

## Documentation
- [Main README](README.md)
- [DevOps](devops/README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Architecture](ARCHITECTURE.md)
- [Coding Guidelines](CODING_GUIDELINES.md)
- [Paging vs Filtering](PAGING_VS_FILTERING.md)
- [Email Confirmation Setup](EMAIL_CONFIRMATION_SETUP.md)
