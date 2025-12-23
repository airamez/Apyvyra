# DevOps Console Tool

This is a .NET console application for DevOps operations in the Apyvyra project.

## Usage

Build the project:

```bash
cd devops
dotnet build
```

### Commands

#### `db-init` — Re-create the database schema

Re-creates the database using the SQL file at `/home/jose/code/Apyvyra/database.sql`.

Example:

```bash
cd devops
dotnet run -- db-init
```

This command connects to the database using the default connection string from `backend/appsettings.json` and executes all SQL statements from `../database.sql`.

**Options:**
- `-force` — Skip the confirmation prompt (useful for automated scripts)

**What it does:**
- Drops existing tables (with CASCADE to handle foreign key dependencies)
- Re-creates all tables from the SQL schema
- Sets up proper field types (`TIMESTAMPTZ` for dates, `DECIMAL(19,4)` for prices)
- Creates indexes for performance
- Initializes foreign key relationships

#### `db-load-test-data` — Load test data

Loads test data into the database using the SQL file at `/home/jose/code/Apyvyra/database_test_data.sql`.

Example:

```bash
cd devops
dotnet run -- db-load-test-data
```

This command loads realistic test data into an existing database schema.

**Options:**
- `-force` — Skip the confirmation prompt (useful for automated scripts)

**What it does:**
- Creates a test user account
- Inserts 5 product categories (Electronics, Home & Kitchen, Sports & Outdoors, Books & Media, Clothing & Accessories)
- Inserts 100 realistic products with complete details (SKU, name, description, pricing, stock, etc.)
- Adds product images using public domain images from Unsplash
- Each product includes appropriate URLs for product images

**Note:** This command should be run AFTER `db-init` to populate the database with test data.

## Notes
- This tool uses ADO.NET directly (Npgsql) for flexibility.
- No Entity Framework dependency is required.
- Safe to run multiple times (idempotent operations).
- Requires the PostgreSQL database container to be running.
