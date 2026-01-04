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

## Additional Configuration

For additional details about the application architecure please refer to the **[ARCHITECTURE.md](ARCHITECTURE.md)** document.

## Additional Resources

- [Main README](README.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [DevOps Documentation](devops/README.md)
