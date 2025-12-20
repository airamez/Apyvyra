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

## Notes
- This tool uses ADO.NET directly (Npgsql) for flexibility.
- No Entity Framework dependency is required.
