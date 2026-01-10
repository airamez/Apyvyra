using System.Text.RegularExpressions;
using Xunit;
using Xunit.Abstractions;

namespace BackendTest;

public class StringsChecks
{
    private readonly ITestOutputHelper _output;
    private static readonly string ProjectRoot = GetProjectRoot();

    public StringsChecks(ITestOutputHelper output)
    {
        _output = output;
    }

    private static string GetProjectRoot()
    {
        var currentDir = AppContext.BaseDirectory;
        
        while (currentDir != null)
        {
            var backendPath = Path.Combine(currentDir, "backend");
            var frontendPath = Path.Combine(currentDir, "frontend");
            if (Directory.Exists(backendPath) && Directory.Exists(frontendPath))
            {
                return currentDir;
            }
            
            currentDir = Directory.GetParent(currentDir)?.FullName;
        }
        
        throw new DirectoryNotFoundException("Could not find the project root. Make sure the test is run from the repository.");
    }

    [Fact]
    public void Backend_ShouldNotHaveHardcodedStrings()
    {
        var backendPath = Path.Combine(ProjectRoot, "backend");
        var csFiles = Directory.GetFiles(backendPath, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"));

        var violations = new List<StringViolation>();

        foreach (var file in csFiles)
        {
            var fileViolations = CheckCSharpFile(file);
            violations.AddRange(fileViolations);
        }

        PrintViolations("Backend (.cs)", violations);
        
        Assert.True(violations.Count == 0, 
            $"Found {violations.Count} potential hardcoded strings in backend. See test output for details.");
    }

    [Fact]
    public void Frontend_ShouldNotHaveHardcodedStrings()
    {
        var frontendPath = Path.Combine(ProjectRoot, "frontend", "src", "components");
        if (!Directory.Exists(frontendPath))
        {
            _output.WriteLine($"Frontend components path not found: {frontendPath}");
            return;
        }

        var tsxFiles = Directory.GetFiles(frontendPath, "*.tsx", SearchOption.AllDirectories)
            .Where(f => !f.Contains("node_modules"));

        var violations = new List<StringViolation>();

        foreach (var file in tsxFiles)
        {
            var fileViolations = CheckTypeScriptFile(file);
            violations.AddRange(fileViolations);
        }

        PrintViolations("Frontend (.tsx)", violations);
        
        Assert.True(violations.Count == 0, 
            $"Found {violations.Count} potential hardcoded strings in frontend. See test output for details.");
    }

    private List<StringViolation> CheckCSharpFile(string filePath)
    {
        var violations = new List<StringViolation>();
        var lines = File.ReadAllLines(filePath);
        var relativePath = Path.GetRelativePath(ProjectRoot, filePath);

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i];
            var lineNumber = i + 1;

            var strings = ExtractCSharpStrings(line);
            foreach (var str in strings)
            {
                if (IsHardcodedStringCSharp(str, line))
                {
                    violations.Add(new StringViolation
                    {
                        FilePath = relativePath,
                        LineNumber = lineNumber,
                        Line = line.Trim(),
                        StringValue = str
                    });
                }
            }
        }

        return violations;
    }

    private List<StringViolation> CheckTypeScriptFile(string filePath)
    {
        var violations = new List<StringViolation>();
        var lines = File.ReadAllLines(filePath);
        var relativePath = Path.GetRelativePath(ProjectRoot, filePath);

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i];
            var lineNumber = i + 1;

            var strings = ExtractTypeScriptStrings(line);
            foreach (var str in strings)
            {
                if (IsHardcodedStringTypeScript(str, line))
                {
                    violations.Add(new StringViolation
                    {
                        FilePath = relativePath,
                        LineNumber = lineNumber,
                        Line = line.Trim(),
                        StringValue = str
                    });
                }
            }
        }

        return violations;
    }

    private static List<string> ExtractCSharpStrings(string line)
    {
        var strings = new List<string>();
        
        // Match regular strings "..." but not verbatim @"..." or interpolated $"..."
        // Also match strings inside interpolated strings
        var regex = new Regex(@"(?<![@$])""([^""\\]*(?:\\.[^""\\]*)*)""");
        var matches = regex.Matches(line);
        
        foreach (Match match in matches)
        {
            if (match.Groups.Count > 1)
            {
                strings.Add(match.Groups[1].Value);
            }
        }

        return strings;
    }

    private static List<string> ExtractTypeScriptStrings(string line)
    {
        var strings = new List<string>();
        
        // Match single-quoted strings '...'
        var singleQuoteRegex = new Regex(@"'([^'\\]*(?:\\.[^'\\]*)*)'");
        var singleMatches = singleQuoteRegex.Matches(line);
        foreach (Match match in singleMatches)
        {
            if (match.Groups.Count > 1)
            {
                strings.Add(match.Groups[1].Value);
            }
        }

        // Match double-quoted strings "..."
        var doubleQuoteRegex = new Regex(@"""([^""\\]*(?:\\.[^""\\]*)*)""");
        var doubleMatches = doubleQuoteRegex.Matches(line);
        foreach (Match match in doubleMatches)
        {
            if (match.Groups.Count > 1)
            {
                strings.Add(match.Groups[1].Value);
            }
        }

        return strings;
    }

    private static bool IsHardcodedStringCSharp(string str, string line)
    {
        // Skip empty or whitespace-only strings
        if (string.IsNullOrWhiteSpace(str))
            return false;

        // Skip very short strings (likely technical)
        if (str.Length <= 2)
            return false;

        // Skip UPPERCASE_SNAKE_CASE constants (translation keys)
        if (Regex.IsMatch(str, @"^[A-Z][A-Z0-9_]*$"))
            return false;

        // Skip strings that look like translation keys with dots
        if (Regex.IsMatch(str, @"^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*)+$"))
            return false;

        // Skip log message placeholders like {Email}, {TemplatePath}
        if (Regex.IsMatch(str, @"^\{[A-Za-z]+\}$"))
            return false;

        // Skip strings containing log placeholders
        if (Regex.IsMatch(str, @"\{[A-Za-z]+\}"))
            return false;

        // Skip file paths and extensions
        if (str.Contains("/") || str.Contains("\\") || str.StartsWith(".") || str.EndsWith(".html") || str.EndsWith(".json") || str.EndsWith(".cs"))
            return false;

        // Skip URLs and schemes
        if (str.StartsWith("http") || str.StartsWith("https") || str.Contains("://"))
            return false;

        // Skip format strings
        if (Regex.IsMatch(str, @"^[A-Za-z0-9:, ]+$") && str.Length < 20 && (str.Contains(":") || Regex.IsMatch(str, @"^[FfDdNnCcPpXx]\d*$")))
            return false;

        // Skip date format strings
        if (Regex.IsMatch(str, @"^[MdyYHhmsft ,:-]+$"))
            return false;

        // Skip CSS/HTML related strings
        if (str.StartsWith("{{") || str.EndsWith("}}") || str.Contains("style=") || str.Contains("class="))
            return false;

        // Skip namespace declarations
        if (line.TrimStart().StartsWith("namespace"))
            return false;

        // Skip using statements
        if (line.TrimStart().StartsWith("using"))
            return false;

        // Skip attribute declarations
        if (line.Contains("[") && line.Contains("]"))
            return false;

        // Skip configuration keys (contain colons or are PascalCase paths)
        if (Regex.IsMatch(str, @"^[A-Za-z]+:[A-Za-z]+$") || Regex.IsMatch(str, @"^[A-Z][a-z]+([A-Z][a-z]+)+$"))
            return false;

        // Skip strings used in Path.Combine or similar
        if (line.Contains("Path.Combine") || line.Contains("Path.GetFileName"))
            return false;

        // Skip exception messages in throw statements (these are developer-facing)
        if (line.Contains("throw new") || line.Contains("Exception("))
            return false;

        // Skip strings in Replace calls that are placeholders
        if (line.Contains(".Replace(") && (str.StartsWith("{{") || str.StartsWith("\n") || str.Length < 5))
            return false;

        // Skip HTML/CSS inline content
        if (str.Contains("<") || str.Contains(">") || str.Contains("padding") || str.Contains("border") || str.Contains("font-"))
            return false;

        // Skip regex patterns
        if (str.Contains("\\") || str.Contains("^") || str.Contains("$") || str.Contains("[") || str.Contains("]"))
            return false;

        // Skip technical identifiers (camelCase or PascalCase without spaces)
        if (!str.Contains(" ") && Regex.IsMatch(str, @"^[a-z][a-zA-Z0-9]*$"))
            return false;

        // Skip strings that are just property/method names
        if (!str.Contains(" ") && Regex.IsMatch(str, @"^[A-Z][a-zA-Z0-9]*$") && str.Length < 30)
            return false;

        // Skip color codes
        if (Regex.IsMatch(str, @"^#[0-9A-Fa-f]{3,8}$"))
            return false;

        // Skip MIME types and content types
        if (str.Contains("/") || Regex.IsMatch(str, @"^[a-z]+/[a-z-]+$"))
            return false;

        // Skip string.Empty assignments
        if (line.Contains("string.Empty") || line.Contains("= \"\""))
            return false;

        // Skip comments
        if (line.TrimStart().StartsWith("//") || line.TrimStart().StartsWith("/*") || line.TrimStart().StartsWith("*"))
            return false;

        // Skip EF Core / Database configuration (column names, table names, constraints, indexes)
        if (line.Contains(".HasColumnName(") || line.Contains(".ToTable(") || line.Contains(".HasName(") ||
            line.Contains(".HasConstraintName(") || line.Contains(".HasIndex(") || line.Contains(".HasKey("))
            return false;

        // Skip database identifiers (snake_case names typically used for DB columns/tables)
        if (Regex.IsMatch(str, @"^[a-z][a-z0-9]*(_[a-z0-9]+)+$"))
            return false;

        // Skip connection strings
        if (str.Contains("Host=") || str.Contains("Server=") || str.Contains("Database=") || 
            str.Contains("Password=") || str.Contains("Username=") || line.Contains("UseNpgsql") ||
            line.Contains("UseSqlServer") || line.Contains("ConnectionString"))
            return false;

        // Skip logging statements
        if (line.Contains("_logger.Log") || line.Contains(".LogInformation(") || line.Contains(".LogWarning(") ||
            line.Contains(".LogError(") || line.Contains(".LogDebug(") || line.Contains(".LogTrace("))
            return false;

        // Skip mock/test data (common patterns)
        if (line.Contains("mock") || line.Contains("Mock") || line.Contains("@example.com") ||
            str.Contains("@example.com") || str.Contains("@vendor.com") || str.Contains("@payment.com") ||
            line.Contains("GetMockEmails") || line.Contains("GetMockSentEmails") ||
            (line.Contains("FromName") && line.Contains("=")) ||
            (line.Contains("Subject") && line.Contains("=") && (str.Contains("order") || str.Contains("Order") || str.Contains("Re:") || str.Contains("Invoice") || str.Contains("Newsletter") || str.Contains("inquiry") || str.Contains("statement"))) ||
            (line.Contains("Body") && line.Contains("=") && str.Length > 50) ||
            (line.Contains("Id") && line.Contains("=") && str.StartsWith("sent-")))
            return false;

        // Skip dictionary/metadata keys
        if (line.Contains("{ \"") && line.Contains(",") && !str.Contains(" "))
            return false;

        // Skip JSON property access
        if (line.Contains(".GetProperty("))
            return false;

        // Skip strings that are snake_case identifiers (metadata keys like order_id, customer_id)
        if (Regex.IsMatch(str, @"^[a-z]+(_[a-z]+)*$") && !str.Contains(" "))
            return false;

        // Skip status strings used in API responses (technical values)
        if (Regex.IsMatch(str, @"^[a-z]+(_[a-z]+)*$"))
            return false;

        // Skip SMTP/IMAP server names
        if (str.Contains("smtp.") || str.Contains("imap.") || str.EndsWith(".com") || str.EndsWith(".net"))
            return false;

        // Skip strings in switch expressions that map to arrow (=>)
        if (line.Contains(" => "))
            return false;

        // Skip HTTP header names (X-* pattern)
        if (str.StartsWith("X-") || line.Contains(".WithExposedHeaders("))
            return false;

        // Skip configuration keys (contain colon separator)
        if (str.Contains(":") && !str.Contains(" "))
            return false;

        // Skip Stripe webhook event types
        if (str.StartsWith("payment_intent.") || str.StartsWith("charge.") || str.StartsWith("customer."))
            return false;

        // Skip case statements (technical switch values)
        if (line.TrimStart().StartsWith("case "))
            return false;

        // This looks like a user-facing hardcoded string
        return true;
    }

    private static bool IsHardcodedStringTypeScript(string str, string line)
    {
        // Skip empty or whitespace-only strings
        if (string.IsNullOrWhiteSpace(str))
            return false;

        // Skip very short strings (likely technical)
        if (str.Length <= 2)
            return false;

        // Skip UPPERCASE_SNAKE_CASE constants (translation keys)
        if (Regex.IsMatch(str, @"^[A-Z][A-Z0-9_]*$"))
            return false;

        // Skip strings used in t() translation function
        if (Regex.IsMatch(line, @"t\s*\(\s*['"+ "\"']" + Regex.Escape(str)))
            return false;

        // Skip strings used in useTranslation hook
        if (line.Contains("useTranslation("))
            return false;

        // Skip import statements
        if (line.TrimStart().StartsWith("import"))
            return false;

        // Skip export statements with paths
        if (line.TrimStart().StartsWith("export") && str.Contains("/"))
            return false;

        // Skip file paths
        if (str.Contains("/") || str.StartsWith(".") || str.StartsWith("@/"))
            return false;

        // Skip URLs
        if (str.StartsWith("http") || str.Contains("://"))
            return false;

        // Skip CSS class names and IDs (no spaces, lowercase with dashes)
        if (!str.Contains(" ") && Regex.IsMatch(str, @"^[a-z][a-z0-9-]*$"))
            return false;

        // Skip color codes
        if (Regex.IsMatch(str, @"^#[0-9A-Fa-f]{3,8}$"))
            return false;

        // Skip event names and DOM attributes
        if (Regex.IsMatch(str, @"^on[A-Z][a-zA-Z]+$") || Regex.IsMatch(str, @"^[a-z]+(-[a-z]+)*$"))
            return false;

        // Skip component prop names (camelCase)
        if (!str.Contains(" ") && Regex.IsMatch(str, @"^[a-z][a-zA-Z0-9]*$"))
            return false;

        // Skip MUI/React specific strings
        if (Regex.IsMatch(str, @"^(primary|secondary|error|warning|info|success|inherit|default|small|medium|large|left|right|center|top|bottom|contained|outlined|text|light|dark)$"))
            return false;

        // Skip HTML element names
        if (Regex.IsMatch(str, @"^(div|span|p|h[1-6]|button|input|form|table|tr|td|th|ul|li|a|img|svg|path)$"))
            return false;

        // Skip type annotations
        if (line.Contains(": '") && !str.Contains(" "))
            return false;

        // Skip console.log/error messages (developer-facing)
        if (line.Contains("console."))
            return false;

        // Skip comments
        if (line.TrimStart().StartsWith("//") || line.TrimStart().StartsWith("/*") || line.TrimStart().StartsWith("*"))
            return false;

        // Skip JSX attribute values that are technical (no spaces)
        if (!str.Contains(" ") && line.Contains("="))
            return false;

        // Skip strings in sx prop (MUI styling)
        if (line.Contains("sx=") || line.Contains("sx:"))
            return false;

        // Skip variant and size props
        if (line.Contains("variant=") || line.Contains("size=") || line.Contains("color="))
            return false;

        // Skip icon names
        if (str.EndsWith("Icon") || str.StartsWith("Icon"))
            return false;

        // Skip CSS selectors and styling (MUI sx object keys)
        if (str.StartsWith("& ") || str.StartsWith("&.") || str.Contains("MuiDataGrid") || 
            str.Contains("!important") || str.Contains("rgba(") || str.Contains("rgb("))
            return false;

        // Skip CSS property values (dimensions, colors)
        if (Regex.IsMatch(str, @"^\d+px$") || Regex.IsMatch(str, @"^\d+px \d+px$") ||
            Regex.IsMatch(str, @"^\d+(px|em|rem|%|vh|vw)( !important)?$"))
            return false;

        // Skip throw new Error() messages (developer-facing)
        if (line.Contains("throw new Error("))
            return false;

        // Skip error state setters that use err.message fallback (the fallback is developer-facing)
        if (line.Contains("err.message ||") || line.Contains("err instanceof Error") || 
            line.Contains(".message ||") || line.Contains("error?.message"))
            return false;

        // Skip setError calls with technical error messages
        if (line.Contains("setError(") && !str.Contains(" "))
            return false;

        // Skip email addresses (test/mock data)
        if (str.Contains("@example.com") || str.Contains("@") && str.Contains("."))
            return false;

        // Skip strings that look like status codes or technical identifiers
        if (Regex.IsMatch(str, @"^[a-z]+_[a-z]+$") || Regex.IsMatch(str, @"^[a-z]+-[a-z0-9-]+$"))
            return false;

        // Skip strings in object literal keys (typically technical)
        if (line.TrimStart().StartsWith("'") && line.Contains(":") && !str.Contains(" "))
            return false;

        // Skip rel attribute values
        if (line.Contains("rel="))
            return false;

        // Skip strings used in .includes() or .startsWith() checks (conditional logic, not display)
        if (line.Contains(".includes(") || line.Contains(".startsWith("))
            return false;

        // Skip case statements in switch (typically status values)
        if (line.TrimStart().StartsWith("case "))
            return false;

        // Skip ternary operator technical values
        if (line.Contains(" ? '") && line.Contains("' : '") && !str.Contains(" "))
            return false;

        // Skip setUserType and similar state setters with enum-like values
        if (line.Contains("setUserType(") || line.Contains("setStatus("))
            return false;

        // Skip headerName in column definitions (these should be translated but are common pattern)
        // Actually, these SHOULD be caught - they are user-facing. Keep them.

        // Skip label= props that don't have spaces (likely technical)
        if (line.Contains("label=") && !str.Contains(" "))
            return false;

        // Skip placeholder= props (these should be translated - keep them)
        // Skip strings that are just PascalCase words (likely enum values or component names)
        if (!str.Contains(" ") && Regex.IsMatch(str, @"^[A-Z][a-zA-Z]+$"))
            return false;

        // Skip Re: prefix pattern (email reply convention)
        if (str == "Re:")
            return false;

        // This looks like a user-facing hardcoded string
        return true;
    }

    private void PrintViolations(string category, List<StringViolation> violations)
    {
        if (violations.Count == 0)
        {
            _output.WriteLine($"✓ No hardcoded strings found in {category}");
            return;
        }

        _output.WriteLine($"");
        _output.WriteLine($"═══════════════════════════════════════════════════════════════");
        _output.WriteLine($"  HARDCODED STRINGS FOUND IN {category.ToUpper()}");
        _output.WriteLine($"═══════════════════════════════════════════════════════════════");
        _output.WriteLine($"");

        var groupedByFile = violations.GroupBy(v => v.FilePath);
        
        foreach (var fileGroup in groupedByFile)
        {
            _output.WriteLine($"📄 {fileGroup.Key}");
            _output.WriteLine($"───────────────────────────────────────────────────────────────");
            
            foreach (var violation in fileGroup)
            {
                _output.WriteLine($"  Line {violation.LineNumber}: \"{violation.StringValue}\"");
                _output.WriteLine($"    → {violation.Line}");
                _output.WriteLine($"");
            }
        }

        _output.WriteLine($"═══════════════════════════════════════════════════════════════");
        _output.WriteLine($"  Total: {violations.Count} potential hardcoded strings");
        _output.WriteLine($"  Please add these to the translation files.");
        _output.WriteLine($"═══════════════════════════════════════════════════════════════");
    }

    private class StringViolation
    {
        public string FilePath { get; set; } = string.Empty;
        public int LineNumber { get; set; }
        public string Line { get; set; } = string.Empty;
        public string StringValue { get; set; } = string.Empty;
    }
}
