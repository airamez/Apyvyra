using System.Data;
using Npgsql;
using Microsoft.Extensions.Configuration;

namespace DevOpsTool;

class Program
{

    static async Task<int> Main(string[] args)
    {
        if (args.Length == 0 || args[0] == "--help" || args[0] == "-h")
        {
            Console.WriteLine("Usage: devops db-init");
            return 1;
        }

        if (args[0] == "db-init")
        {
            bool force = args.Length > 1 && args[1] == "-force";
            return await InitializeDatabase(force);
        }

        Console.WriteLine($"Unknown command: {args[0]}");
        return 1;
    }

    /// <summary>
    /// Recreates the database using the SQL file and the default connection string.
    /// </summary>
    static async Task<int> InitializeDatabase()
    {

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
        try
        {
            using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync();
            Console.WriteLine("Database initialized successfully.");
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error initializing database: {ex.Message}");
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
}
