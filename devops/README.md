# DevOps Console Tool

This is a .NET console application for DevOps operations in the Apyvyra project.

## Usage

Build the project:

```bash
cd devops
dotnet build
```

### Commands

- `db-init` — Re-create the database using the SQL file at `/home/jose/code/Apyvyra/database.sql`.

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

## Notes
- This tool uses ADO.NET directly (Npgsql) for flexibility.
- No Entity Framework dependency is required.
- Safe to run multiple times (idempotent operations).
- Requires the PostgreSQL database container to be running.
