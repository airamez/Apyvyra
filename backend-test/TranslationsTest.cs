using System.Text.Json;
using System.Text.RegularExpressions;
using Xunit;

namespace BackendTest;

public class TranslationFilesTests
{
    private const string ReferenceLanguage = "en-US";
    private static readonly string TranslationsPath = GetTranslationsPath();
    private static readonly string[] LanguageFolders = GetLanguageFolders();

    private static string GetTranslationsPath()
    {
        var currentDir = AppContext.BaseDirectory;
        
        while (currentDir != null)
        {
            var translationsPath = Path.Combine(currentDir, "backend", "Resources", "Translations");
            if (Directory.Exists(translationsPath))
            {
                return translationsPath;
            }
            
            currentDir = Directory.GetParent(currentDir)?.FullName;
        }
        
        throw new DirectoryNotFoundException("Could not find the Translations folder. Make sure the test is run from the repository root.");
    }

    private static string[] GetLanguageFolders()
    {
        if (!Directory.Exists(TranslationsPath))
        {
            return [];
        }

        return Directory.GetDirectories(TranslationsPath)
            .Select(Path.GetFileName)
            .Where(f => f != null)
            .Cast<string>()
            .OrderBy(f => f)
            .ToArray();
    }

    public static IEnumerable<object[]> GetJsonFileNames()
    {
        var referencePath = Path.Combine(TranslationsPath, ReferenceLanguage);
        if (!Directory.Exists(referencePath))
        {
            yield break;
        }

        var jsonFiles = Directory.GetFiles(referencePath, "*.json")
            .Select(Path.GetFileName)
            .Where(f => f != null)
            .Cast<string>();

        foreach (var fileName in jsonFiles)
        {
            yield return new object[] { fileName };
        }
    }

    public static IEnumerable<object[]> GetEmailTemplateFiles()
    {
        var referenceEmailPath = Path.Combine(TranslationsPath, ReferenceLanguage, "email-templates");
        if (!Directory.Exists(referenceEmailPath))
        {
            yield break;
        }

        var htmlFiles = Directory.GetFiles(referenceEmailPath, "*.html")
            .Select(Path.GetFileName)
            .Where(f => f != null)
            .Cast<string>();

        foreach (var fileName in htmlFiles)
        {
            yield return new object[] { fileName };
        }
    }

    [Theory]
    [MemberData(nameof(GetJsonFileNames))]
    public void JsonFiles_ShouldHaveSameKeys_AcrossAllLanguages(string jsonFileName)
    {
        var keysByLanguage = new Dictionary<string, HashSet<string>>();
        var missingFiles = new List<string>();

        foreach (var language in LanguageFolders)
        {
            var filePath = Path.Combine(TranslationsPath, language, jsonFileName);
            
            if (!File.Exists(filePath))
            {
                missingFiles.Add(language);
                continue;
            }

            var jsonContent = File.ReadAllText(filePath);
            var jsonDocument = JsonDocument.Parse(jsonContent);
            var keys = jsonDocument.RootElement
                .EnumerateObject()
                .Select(p => p.Name)
                .ToHashSet();

            keysByLanguage[language] = keys;
        }

        Assert.Empty(missingFiles);

        var referenceKeys = keysByLanguage[ReferenceLanguage];

        foreach (var language in LanguageFolders.Where(l => l != ReferenceLanguage))
        {
            var currentKeys = keysByLanguage[language];

            var missingInCurrent = referenceKeys.Except(currentKeys).ToList();
            var extraInCurrent = currentKeys.Except(referenceKeys).ToList();

            Assert.True(
                missingInCurrent.Count == 0,
                $"File '{jsonFileName}' in '{language}' is missing keys present in '{ReferenceLanguage}': {string.Join(", ", missingInCurrent)}"
            );

            Assert.True(
                extraInCurrent.Count == 0,
                $"File '{jsonFileName}' in '{language}' has extra keys not present in '{ReferenceLanguage}': {string.Join(", ", extraInCurrent)}"
            );
        }
    }

    [Theory]
    [MemberData(nameof(GetJsonFileNames))]
    public void JsonFiles_ShouldExist_InAllLanguages(string jsonFileName)
    {
        foreach (var language in LanguageFolders)
        {
            var filePath = Path.Combine(TranslationsPath, language, jsonFileName);
            Assert.True(
                File.Exists(filePath),
                $"Translation file '{jsonFileName}' is missing for language '{language}'"
            );
        }
    }

    [Theory]
    [MemberData(nameof(GetJsonFileNames))]
    public void JsonFiles_ShouldBeValidJson(string jsonFileName)
    {
        foreach (var language in LanguageFolders)
        {
            var filePath = Path.Combine(TranslationsPath, language, jsonFileName);
            
            if (!File.Exists(filePath))
            {
                continue;
            }

            var jsonContent = File.ReadAllText(filePath);
            
            var exception = Record.Exception(() => JsonDocument.Parse(jsonContent));
            Assert.Null(exception);
        }
    }

    [Theory]
    [MemberData(nameof(GetJsonFileNames))]
    public void JsonFiles_ShouldHaveNonEmptyValues(string jsonFileName)
    {
        foreach (var language in LanguageFolders)
        {
            var filePath = Path.Combine(TranslationsPath, language, jsonFileName);
            
            if (!File.Exists(filePath))
            {
                continue;
            }

            var jsonContent = File.ReadAllText(filePath);
            var jsonDocument = JsonDocument.Parse(jsonContent);
            
            var emptyKeys = jsonDocument.RootElement
                .EnumerateObject()
                .Where(p => p.Value.ValueKind == JsonValueKind.String && 
                           string.IsNullOrWhiteSpace(p.Value.GetString()))
                .Select(p => p.Name)
                .ToList();

            Assert.True(
                emptyKeys.Count == 0,
                $"File '{jsonFileName}' in '{language}' has empty values for keys: {string.Join(", ", emptyKeys)}"
            );
        }
    }

    public static IEnumerable<object[]> GetOrderRelatedEmailTemplates()
    {
        var orderTemplates = new[] { "order-confirmation.html", "order-shipped.html" };
        
        foreach (var fileName in orderTemplates)
        {
            yield return new object[] { fileName };
        }
    }

    [Theory]
    [MemberData(nameof(GetOrderRelatedEmailTemplates))]
    public void OrderEmailTemplates_ShouldContainShippingAddressPlaceholder(string htmlFileName)
    {
        const string requiredPlaceholder = "{{shipping_address}}";

        foreach (var language in LanguageFolders)
        {
            var filePath = Path.Combine(TranslationsPath, language, "email-templates", htmlFileName);
            
            if (!File.Exists(filePath))
            {
                continue;
            }

            var htmlContent = File.ReadAllText(filePath);
            
            Assert.True(
                htmlContent.Contains(requiredPlaceholder),
                $"Email template '{htmlFileName}' in '{language}' is missing the required placeholder '{requiredPlaceholder}'"
            );
        }
    }

    [Theory]
    [MemberData(nameof(GetEmailTemplateFiles))]
    public void EmailTemplates_ShouldExist_InAllLanguages(string htmlFileName)
    {
        foreach (var language in LanguageFolders)
        {
            var filePath = Path.Combine(TranslationsPath, language, "email-templates", htmlFileName);
            Assert.True(
                File.Exists(filePath),
                $"Email template '{htmlFileName}' is missing for language '{language}'"
            );
        }
    }

    [Fact]
    public void AllLanguages_ShouldHaveSameJsonFiles()
    {
        var filesByLanguage = new Dictionary<string, HashSet<string>>();

        foreach (var language in LanguageFolders)
        {
            var languagePath = Path.Combine(TranslationsPath, language);
            
            if (!Directory.Exists(languagePath))
            {
                filesByLanguage[language] = new HashSet<string>();
                continue;
            }

            var jsonFiles = Directory.GetFiles(languagePath, "*.json")
                .Select(Path.GetFileName)
                .Where(f => f != null)
                .Cast<string>()
                .ToHashSet();

            filesByLanguage[language] = jsonFiles;
        }

        var referenceFiles = filesByLanguage[ReferenceLanguage];

        foreach (var language in LanguageFolders.Where(l => l != ReferenceLanguage))
        {
            var currentFiles = filesByLanguage[language];

            var missingInCurrent = referenceFiles.Except(currentFiles).ToList();
            var extraInCurrent = currentFiles.Except(referenceFiles).ToList();

            Assert.True(
                missingInCurrent.Count == 0,
                $"Language '{language}' is missing JSON files present in '{ReferenceLanguage}': {string.Join(", ", missingInCurrent)}"
            );

            Assert.True(
                extraInCurrent.Count == 0,
                $"Language '{language}' has extra JSON files not present in '{ReferenceLanguage}': {string.Join(", ", extraInCurrent)}"
            );
        }
    }

    [Fact]
    public void AllLanguages_ShouldHaveSameEmailTemplates()
    {
        var filesByLanguage = new Dictionary<string, HashSet<string>>();

        foreach (var language in LanguageFolders)
        {
            var emailPath = Path.Combine(TranslationsPath, language, "email-templates");
            
            if (!Directory.Exists(emailPath))
            {
                filesByLanguage[language] = new HashSet<string>();
                continue;
            }

            var htmlFiles = Directory.GetFiles(emailPath, "*.html")
                .Select(Path.GetFileName)
                .Where(f => f != null)
                .Cast<string>()
                .ToHashSet();

            filesByLanguage[language] = htmlFiles;
        }

        var referenceFiles = filesByLanguage[ReferenceLanguage];

        foreach (var language in LanguageFolders.Where(l => l != ReferenceLanguage))
        {
            var currentFiles = filesByLanguage[language];

            var missingInCurrent = referenceFiles.Except(currentFiles).ToList();
            var extraInCurrent = currentFiles.Except(referenceFiles).ToList();

            Assert.True(
                missingInCurrent.Count == 0,
                $"Language '{language}' is missing email templates present in '{ReferenceLanguage}': {string.Join(", ", missingInCurrent)}"
            );

            Assert.True(
                extraInCurrent.Count == 0,
                $"Language '{language}' has extra email templates not present in '{ReferenceLanguage}': {string.Join(", ", extraInCurrent)}"
            );
        }
    }

    private static HashSet<string> ExtractPlaceholders(string content)
    {
        var regex = new Regex(@"\{\{(\w+)\}\}");
        var matches = regex.Matches(content);
        return matches.Select(m => m.Value).ToHashSet();
    }

    [Theory]
    [MemberData(nameof(GetEmailTemplateFiles))]
    public void EmailTemplates_ShouldContainAllRequiredPlaceholders(string htmlFileName)
    {
        var referencePath = Path.Combine(TranslationsPath, ReferenceLanguage, "email-templates", htmlFileName);
        
        Assert.True(
            File.Exists(referencePath),
            $"Reference email template '{htmlFileName}' not found in '{ReferenceLanguage}'"
        );

        var referenceContent = File.ReadAllText(referencePath);
        var requiredPlaceholders = ExtractPlaceholders(referenceContent);

        foreach (var language in LanguageFolders)
        {
            var filePath = Path.Combine(TranslationsPath, language, "email-templates", htmlFileName);
            
            if (!File.Exists(filePath))
            {
                continue;
            }

            var content = File.ReadAllText(filePath);
            var placeholders = ExtractPlaceholders(content);

            var missingPlaceholders = requiredPlaceholders.Except(placeholders).ToList();

            Assert.True(
                missingPlaceholders.Count == 0,
                $"Email template '{htmlFileName}' in '{language}' is missing required placeholders: {string.Join(", ", missingPlaceholders)}"
            );
        }
    }
}
