# Backend (ASP.NET Core Web API)

The backend is built with ASP.NET Core Web API using C# and Entity Framework Core.

## Prerequisites

- .NET SDK 10.0 or later
- PostgreSQL database (via Docker or local)

## Setup

1. **Restore dependencies**
   ```bash
   cd backend
   dotnet restore
   ```

2. **Database setup**
   - Ensure PostgreSQL is running
   - Use the DevOps tool to initialize schema:
     ```bash
     cd ../devops
     dotnet run -- db-init
     dotnet run -- db-load-test-data
     cd ../backend
     ```

3. **Configuration**
   - Update `appsettings.json` for database connection if needed
   - JWT settings are configured for authentication

## Running

```bash
# Run the API
dotnet run

# Run with hot reload for development
dotnet watch run
```

The API will be available at `http://localhost:5000` (configured in `Properties/launchSettings.json`).

## Project Structure

- **Controllers/**: API endpoints
- **Models/**: Entity Framework models
- **Data/**: Database context
- **Services/**: Business logic (if any)
- **Middleware/**: Custom middleware for error handling

## Key Features

- JWT authentication for all protected endpoints
- Standardized error handling with custom headers
- Entity Framework Core with PostgreSQL
- Audit fields on all entities (created_at, updated_at, etc.)
- RESTful API design

## Testing

```bash
dotnet test
```

## Building for Production

```bash
dotnet publish -c Release -o ./publish
```

The published output can be containerized using the provided Dockerfile.</content>
<parameter name="filePath">/home/jose/code/Apyvyra/backend/README.md