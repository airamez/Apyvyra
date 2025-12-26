using System.Data;
using Npgsql;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using BCrypt.Net;

namespace DevOpsTool;

class Program
{

    static string ReadPassword()
    {
        var password = new StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(true);
            if (key.Key == ConsoleKey.Enter) break;
            if (key.Key == ConsoleKey.Backspace && password.Length > 0)
            {
                password.Remove(password.Length - 1, 1);
                Console.Write("\b \b");
            }
            else if (!char.IsControl(key.KeyChar))
            {
                password.Append(key.KeyChar);
                Console.Write("*");
            }
        }
        Console.WriteLine();
        return password.ToString();
    }

    static async Task<int> Main(string[] args)
    {
        if (args.Length == 0 || args[0] == "--help" || args[0] == "-h")
        {
            Console.WriteLine("Usage: devops [command] [options]");
            Console.WriteLine("\nCommands:");
            Console.WriteLine("  db-init              Re-create the database schema");
            Console.WriteLine("  db-load-test-data    Load test data into the database");
            Console.WriteLine("\nOptions:");
            Console.WriteLine("  -force               Skip confirmation prompts");
            return 1;
        }

        if (args[0] == "db-init")
        {
            bool force = args.Length > 1 && args[1] == "-force";
            return await InitializeDatabase(force);
        }

        if (args[0] == "db-load-test-data")
        {
            bool force = args.Length > 1 && args[1] == "-force";
            return await LoadTestData(force);
        }

        Console.WriteLine($"Unknown command: {args[0]}");
        return 1;
    }

    /// <summary>
    /// Recreates the database using the SQL file and the default connection string.
    /// </summary>
    static async Task<int> InitializeDatabase(bool force)
    {
        if (!force)
        {
            Console.WriteLine("WARNING: This operation will DELETE and RE-CREATE ALL TABLES in the database. ALL DATA WILL BE LOST.");
            Console.Write("Are you sure you want to continue? Type 'yes' to proceed: ");
            var confirmation = Console.ReadLine();
            if (confirmation?.Trim().ToLowerInvariant() != "yes")
            {
                Console.WriteLine("Operation cancelled.");
                return 1;
            }
        }

        var apiBaseUrl = GetApiBaseUrl();
        if (string.IsNullOrWhiteSpace(apiBaseUrl))
        {
            Console.WriteLine("Could not find API base URL in frontend/.env");
            return 1;
        }

        Console.WriteLine($"WARNING: The backend service must be running on {apiBaseUrl} for this to work.");

        // Prompt for admin credentials first
        Console.Write("Enter admin email: ");
        var email = Console.ReadLine()?.Trim();
        if (string.IsNullOrEmpty(email))
        {
            Console.WriteLine("Email cannot be empty. Aborting.");
            return 1;
        }
        Console.Write("Enter admin password: ");
        var password = ReadPassword();
        if (string.IsNullOrEmpty(password))
        {
            Console.WriteLine("Password cannot be empty. Aborting.");
            return 1;
        }

        var connectionString = GetDefaultConnectionString();
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            Console.WriteLine("Could not find a valid connection string in backend/appsettings.json");
            return 1;
        }

        var sqlFilePath = "../database.sql";
        if (!File.Exists(sqlFilePath))
        {
            Console.WriteLine($"SQL file not found: {sqlFilePath}");
            return 1;
        }

        var sql = await File.ReadAllTextAsync(sqlFilePath);
        
        // For simplicity, execute the entire SQL file at once
        // Handle common errors that occur when re-running the script
        try
        {
            using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync();
            
            // First, try to drop all tables with CASCADE to handle dependencies
            var dropScript = @"
                DROP TABLE IF EXISTS product_url CASCADE;
                DROP TABLE IF EXISTS product_image CASCADE; 
                DROP TABLE IF EXISTS product CASCADE;
                DROP TABLE IF EXISTS product_category CASCADE;
                DROP TABLE IF EXISTS app_user CASCADE;
            ";
            
            using (var dropCmd = new NpgsqlCommand(dropScript, conn))
            {
                await dropCmd.ExecuteNonQueryAsync();
                Console.WriteLine("Dropped existing tables.");
            }
            
            // Now execute the full SQL script
            using var cmd = new NpgsqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync();
            Console.WriteLine("Database initialized successfully.");

            Console.WriteLine("Creating required admin user...");

            // Create admin user directly in database (with temporary created_by value)
            using var createAdminCmd = new NpgsqlCommand(@"
                INSERT INTO app_user (email, password, user_type, status, created_by, updated_by) 
                VALUES (@email, @password, 0, 1, 0, 1)", conn);
            
            createAdminCmd.Parameters.AddWithValue("@email", email);
            createAdminCmd.Parameters.AddWithValue("@password", BCrypt.Net.BCrypt.HashPassword(password));
            
            await createAdminCmd.ExecuteNonQueryAsync();
            
            // Get the admin user ID and set created_by to self
            using var getAdminIdCmd = new NpgsqlCommand("SELECT id FROM app_user WHERE email = @email", conn);
            getAdminIdCmd.Parameters.AddWithValue("@email", email);
            var adminIdResult = await getAdminIdCmd.ExecuteScalarAsync();
            if (adminIdResult == null)
            {
                throw new Exception("Failed to retrieve admin user ID after creation");
            }
            var adminId = (int)adminIdResult;
            
            using var updateAdminCmd = new NpgsqlCommand("UPDATE app_user SET created_by = @id WHERE id = @id", conn);
            updateAdminCmd.Parameters.AddWithValue("@id", adminId);
            await updateAdminCmd.ExecuteNonQueryAsync();
            
            Console.WriteLine("Admin user created successfully.");

            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error initializing database: {ex.Message}");
            return 1;
        }
    }

    /// <summary>
    /// Loads test data into the database using the test data SQL file.
    /// </summary>
    static async Task<int> LoadTestData(bool force)
    {
        if (!force)
        {
            Console.WriteLine("This operation will load test data into the database.");
            Console.Write("Are you sure you want to continue? Type 'yes' to proceed: ");
            var confirmation = Console.ReadLine();
            if (confirmation?.Trim().ToLowerInvariant() != "yes")
            {
                Console.WriteLine("Operation cancelled.");
                return 1;
            }
        }

        var connectionString = GetDefaultConnectionString();
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            Console.WriteLine("Could not find a valid connection string in backend/appsettings.json");
            return 1;
        }

        var sqlFilePath = "../database_test_data.sql";
        if (!File.Exists(sqlFilePath))
        {
            Console.WriteLine($"SQL file not found: {sqlFilePath}");
            return 1;
        }

        var sql = await File.ReadAllTextAsync(sqlFilePath);
        
        try
        {
            using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync();
            
            Console.WriteLine("Loading test data...");
            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.CommandTimeout = 120; // Increase timeout for large data load
            await cmd.ExecuteNonQueryAsync();
            Console.WriteLine("Test data loaded successfully.");
            Console.WriteLine("- 5 product categories created");
            Console.WriteLine("- 100 products created with realistic data");
            Console.WriteLine("- Product images added from Unsplash (public domain)");
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading test data: {ex.Message}");
            return 1;
        }
    }

        static string? GetDefaultConnectionString()
        {
            var configPath = Path.GetFullPath("../backend/appsettings.json");
            if (!File.Exists(configPath))
                return null;

            var config = new ConfigurationBuilder()
                .AddJsonFile(configPath, optional: false, reloadOnChange: false)
                .Build();
            return config.GetConnectionString("DefaultConnection");
        }

        static string? GetApiBaseUrl()
        {
            var envPath = Path.GetFullPath("../frontend/.env");
            if (!File.Exists(envPath))
                return null;

            var lines = File.ReadAllLines(envPath);
            foreach (var line in lines)
            {
                if (line.StartsWith("VITE_API_URL="))
                {
                    return line.Substring("VITE_API_URL=".Length).Trim();
                }
            }
            return null;
        }
}
