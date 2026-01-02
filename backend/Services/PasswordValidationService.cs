using System.Text.RegularExpressions;

namespace backend.Services;

public interface IPasswordValidationService
{
    PasswordValidationResult ValidatePassword(string password);
    PasswordRulesStatus GetPasswordRulesStatus(string password);
}

public class PasswordValidationService : IPasswordValidationService
{
    private readonly ITranslationService _translationService;
    private const string TranslationComponent = "PasswordValidation";

    // Password requirements based on NIST and industry best practices
    private const int MinLength = 8;
    private const int MaxLength = 128;

    public PasswordValidationService(ITranslationService translationService)
    {
        _translationService = translationService;
    }

    public PasswordValidationResult ValidatePassword(string password)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(password))
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_REQUIRED"));
            return new PasswordValidationResult
            {
                IsValid = false,
                Errors = errors
            };
        }

        // Rule 1: Minimum length (8 characters - NIST recommendation)
        if (password.Length < MinLength)
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_MIN_LENGTH"));
        }

        // Rule 2: Maximum length (128 characters - prevent DoS attacks)
        if (password.Length > MaxLength)
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_MAX_LENGTH"));
        }

        // Rule 3: At least one uppercase letter
        if (!Regex.IsMatch(password, @"[A-Z]"))
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_UPPERCASE_REQUIRED"));
        }

        // Rule 4: At least one lowercase letter
        if (!Regex.IsMatch(password, @"[a-z]"))
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_LOWERCASE_REQUIRED"));
        }

        // Rule 5: At least one digit
        if (!Regex.IsMatch(password, @"[0-9]"))
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_DIGIT_REQUIRED"));
        }

        // Rule 6: At least one special character
        if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?~`]"))
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_SPECIAL_REQUIRED"));
        }

        // Rule 7: No spaces allowed
        if (password.Contains(' '))
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_NO_SPACES"));
        }

        // Rule 8: No more than 3 sequential characters
        if (HasSequentialCharacters(password))
        {
            errors.Add(_translationService.Translate(TranslationComponent, "PASSWORD_NO_SEQUENTIAL"));
        }

        return new PasswordValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    public PasswordRulesStatus GetPasswordRulesStatus(string password)
    {
        password ??= string.Empty;
        
        return new PasswordRulesStatus
        {
            HasMinLength = password.Length >= MinLength,
            HasMaxLength = password.Length <= MaxLength,
            HasUppercase = Regex.IsMatch(password, @"[A-Z]"),
            HasLowercase = Regex.IsMatch(password, @"[a-z]"),
            HasDigit = Regex.IsMatch(password, @"[0-9]"),
            HasSpecialChar = Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?~`]"),
            HasNoSpaces = !password.Contains(' '),
            HasNoSequential = !HasSequentialCharacters(password)
        };
    }

    private static bool HasSequentialCharacters(string password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 4)
            return false;

        for (int i = 0; i <= password.Length - 4; i++)
        {
            // Check for 4 ascending sequential characters
            if (password[i + 1] == password[i] + 1 &&
                password[i + 2] == password[i] + 2 &&
                password[i + 3] == password[i] + 3)
            {
                return true;
            }

            // Check for 4 descending sequential characters
            if (password[i + 1] == password[i] - 1 &&
                password[i + 2] == password[i] - 2 &&
                password[i + 3] == password[i] - 3)
            {
                return true;
            }
        }

        return false;
    }
}

public class PasswordValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
}

public class PasswordRulesStatus
{
    public bool HasMinLength { get; set; }
    public bool HasMaxLength { get; set; }
    public bool HasUppercase { get; set; }
    public bool HasLowercase { get; set; }
    public bool HasDigit { get; set; }
    public bool HasSpecialChar { get; set; }
    public bool HasNoSpaces { get; set; }
    public bool HasNoSequential { get; set; }
    
    public bool IsValid => HasMinLength && HasMaxLength && HasUppercase && HasLowercase && 
                           HasDigit && HasSpecialChar && HasNoSpaces && HasNoSequential;
}
