# DevOps Console Tool

A .NET console application for database management and DevOps operations in the Apyvyra project.

## Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) or later
- PostgreSQL database running and accessible
- Database user with permissions to create/drop tables

## Configuration

The tool uses its own `appsettings.json` file for configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra"
  }
}
```

Update the connection string to match your database setup before running any commands.

## Usage

### Build the project

```bash
cd devops
dotnet build
```

### Commands

#### `db-init` — Initialize Database Schema

Re-creates the database schema using the SQL file at `../database.sql`.

**Example:**
```bash
cd devops
dotnet run -- db-init
```

**What it does:**
- Shows the target database server and name for confirmation
- Drops existing tables with CASCADE to handle foreign key dependencies
- Executes the complete SQL schema from `../database.sql`
- Creates an admin user directly in the database (bypasses API for reliability)
- Prompts for admin email and password during setup

**Options:**
- `-force` — Skip confirmation prompts (useful for automated scripts)

**Important Notes:**
- **This operation will DELETE all existing data** in the target database
- Requires interactive input for admin credentials
- Password input is masked for security
- Safe to run multiple times (idempotent operations)

#### `db-load-test-data` — Load Test Data

Populates the database with realistic test data using `../database_test_data.sql`.

**Example:**
```bash
cd devops
dotnet run -- db-load-test-data
```

**What it does:**
- Shows the target database server and name for confirmation
- Inserts 5 product categories (Electronics, Home & Kitchen, Sports & Outdoors, Books & Media, Clothing & Accessories)
- Creates 100 realistic products with complete details (SKU, name, description, pricing, stock, etc.)
- Adds product images using public domain images from Unsplash
- Each product includes appropriate image URLs

**Options:**
- `-force` — Skip confirmation prompts (useful for automated scripts)

**Important Notes:**
- Must be run **after** `db-init` to populate an existing schema
- Uses significant database resources for large data insertion
- Includes timeout handling for long-running operations

## Architecture & Design

- **Direct Database Access**: Uses ADO.NET (Npgsql) for maximum flexibility and performance
- **No Entity Framework**: Avoids ORM dependencies for simpler deployment
- **Idempotent Operations**: Safe to run commands multiple times
- **Interactive Safety**: Confirmation prompts prevent accidental data loss
- **Error Handling**: Comprehensive error reporting with detailed messages
- **Configuration Isolation**: Self-contained configuration separate from other services

## Troubleshooting

### Common Issues

**Connection Failed**
- Verify PostgreSQL is running
- Check connection string in `appsettings.json`
- Ensure database user has proper permissions

**SQL File Not Found**
- Ensure `../database.sql` and `../database_test_data.sql` exist
- Check relative path from devops directory

**Permission Denied**
- Database user needs CREATE, DROP, INSERT, UPDATE permissions
- For production, consider using dedicated devops database user

### Error Messages

The tool provides detailed error messages. Common errors include:
- `Could not find a valid connection string` — Check `appsettings.json`
- `SQL file not found` — Verify SQL files exist in parent directory
- `Failed to retrieve admin user ID` — Database connection or permissions issue

## Development

### Adding New Commands

1. Add command handling in `Main()` method
2. Implement command logic as separate async method
3. Follow existing patterns for error handling and user interaction
4. Update this README with new command documentation

### Code Structure

- `Program.cs` — Main application logic and command handling
- `appsettings.json` — Configuration and connection strings
- `../database.sql` — Database schema definition
- `../database_test_data.sql` — Test data population script
