# Apyvyra Backend Test

A comprehensive test suite for the Apyvyra backend API, covering email client functionality, customer management, and API endpoints.

## Table of Contents

- [Overview](#overview)
- [Test Categories](#test-categories)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Email Client Testing](#email-client-testing)
- [Test Data](#test-data)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

This test suite provides comprehensive testing for the Apyvyra backend with special focus on:
- Email client IMAP/SMTP functionality
- Customer email integration
- API endpoint testing
- Authentication and authorization
- Data validation and error handling

## Test Categories

### 1. Unit Tests
- Individual component testing
- Service layer testing
- Utility function testing
- Mock-based testing

### 2. Integration Tests
- Database integration testing
- Email server integration testing
- API endpoint integration
- End-to-end workflows

### 3. Email Client Tests
- IMAP connection testing
- SMTP sending testing
- Email filtering and searching
- Customer email integration
- Development vs Production modes

### 4. API Tests
- RESTful endpoint testing
- Authentication testing
- Request/response validation
- Error handling testing

## Prerequisites

- **.NET SDK**: Version 8.0 or later
- **Test Runner**: Visual Studio Test Explorer or dotnet test
- **Database**: PostgreSQL (for integration tests)
- **Email Account**: Gmail account (for email tests - optional with Development Mode)

## Setup

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd Apyvyra/backend-test
```

### 2. Restore Dependencies

```bash
dotnet restore
```

### 3. Configure Test Settings

Create or update `appsettings.test.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=apyvyra_test;Username=apyvyra;Password=apyvyra"
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "test-email@gmail.com",
    "Password": "test-app-password",
    "FromEmail": "test-email@gmail.com",
    "FromName": "Test Account",
    "EnableSsl": true,
    "DevelopmentMode": true
  },
  "Jwt": {
    "Key": "TestSuperSecretKeyThatIsAtLeast32CharactersLongForHS256",
    "Issuer": "ApyvyraTestAPI",
    "Audience": "ApyvyraTestClient",
    "ExpiresInMinutes": 60
  }
}
```

## Running Tests

### All Tests

```bash
dotnet test
```

### Specific Test Categories

```bash
# Run only unit tests
dotnet test --filter Category=Unit

# Run only integration tests
dotnet test --filter Category=Integration

# Run only email client tests
dotnet test --filter Category=EmailClient

# Run only API tests
dotnet test --filter Category=API
```

### With Coverage

```bash
dotnet test --collect:"XPlat Code Coverage"
```

### Verbose Output

```bash
dotnet test --verbosity normal
```

## Email Client Testing

### Development Mode Tests

Email client tests run in Development Mode by default, using mock data:

```csharp
[Fact]
public async Task GetCustomerEmails_ShouldReturnMockData_WhenInDevelopmentMode()
{
    // Arrange
    var filter = new EmailFilterRequest
    {
        FromEmail = "customer@example.com",
        ToEmail = "customer@example.com",
        Limit = 10
    };

    // Act
    var result = await _emailClientService.GetCustomerEmailsAsync(filter);

    // Assert
    Assert.NotNull(result);
    Assert.True(result.Count > 0);
    Assert.All(result, email => 
    {
        Assert.True(email.From.Contains("customer@example.com", StringComparison.OrdinalIgnoreCase) ||
                   email.To.Contains("customer@example.com", StringComparison.OrdinalIgnoreCase));
    });
}
```

### Production Mode Tests

For production mode testing, configure real Gmail credentials:

```csharp
[Fact(Skip = "Requires real Gmail credentials")]
public async Task GetCustomerEmails_ShouldConnectToRealIMAP_WhenInProductionMode()
{
    // Arrange - Update appsettings.test.json with real credentials
    var filter = new EmailFilterRequest
    {
        FromEmail = "real-customer@example.com",
        ToEmail = "real-customer@example.com",
        Limit = 10
    };

    // Act
    var result = await _emailClientService.GetCustomerEmailsAsync(filter);

    // Assert
    Assert.NotNull(result);
    // Additional assertions based on real data
}
```

### Email Filtering Tests

```csharp
[Theory]
[InlineData("customer@example.com", true)]
[InlineData("other@example.com", false)]
public async Task GetCustomerEmails_ShouldFilterByCustomerEmail(string customerEmail, bool shouldFind)
{
    // Arrange
    var filter = new EmailFilterRequest
    {
        FromEmail = customerEmail,
        ToEmail = customerEmail,
        Limit = 50
    };

    // Act
    var result = await _emailClientService.GetCustomerEmailsAsync(filter);

    // Assert
    if (shouldFind)
    {
        Assert.True(result.Count > 0, $"Expected to find emails for {customerEmail}");
    }
    else
    {
        Assert.True(result.Count == 0, $"Expected no emails for {customerEmail}");
    }
}
```

## Test Data

### Mock Email Data

The test suite includes comprehensive mock email data:

```csharp
// Mock inbox emails
var mockInboxEmails = new List<EmailMessage>
{
    new()
    {
        Id = "1",
        From = "customer1@example.com",
        FromName = "John Doe",
        To = "apyvyra@gmail.com",
        Subject = "Question about my order #12345",
        Body = "Hello, I have a question about my recent order...",
        Date = DateTime.UtcNow.AddDays(-1),
        IsRead = false,
        HasAttachments = false
    },
    // ... more mock emails
};

// Mock sent emails
var mockSentEmails = new List<EmailMessage>
{
    new()
    {
        Id = "sent-1",
        From = "apyvyra@gmail.com",
        FromName = "Apyvyra Support",
        To = "customer1@example.com",
        Subject = "Re: Question about my order #12345",
        Body = "Hello John, thank you for contacting us...",
        Date = DateTime.UtcNow.AddHours(-4),
        IsRead = true,
        HasAttachments = false
    },
    // ... more mock emails
};
```

### Customer Test Scenarios

Test data includes various customer scenarios:
- **Active Customers**: Recent email exchanges
- **Inactive Customers**: Old or no emails
- **Mixed Communication**: Both inbound and outbound emails
- **Attachments**: Emails with and without attachments
- **Different Date Ranges**: Various time periods

## Configuration

### Test Categories

Use test categories to organize tests:

```csharp
[Trait("Category", "Unit")]
public class EmailClientServiceTests
{
    // Unit tests
}

[Trait("Category", "Integration")]
public class EmailClientIntegrationTests
{
    // Integration tests
}

[Trait("Category", "EmailClient")]
public class EmailClientFunctionalTests
{
    // Email client specific tests
}
```

### Test Settings

Configure test-specific settings in `appsettings.test.json`:

```json
{
  "TestSettings": {
    "UseRealEmailServer": false,
    "TestDatabaseName": "apyvyra_test",
    "MockEmailCount": 50,
    "TestCustomerEmail": "test-customer@example.com"
  }
}
```

### Database Testing

Use in-memory database or test database:

```csharp
public class TestDatabaseFixture : IDisposable
{
    public AppDbContext Context { get; private set; }

    public TestDatabaseFixture()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        Context = new AppDbContext(options);
        SeedTestData();
    }

    private void SeedTestData()
    {
        // Seed test data
        Context.SaveChanges();
    }

    public void Dispose()
    {
        Context.Dispose();
    }
}
```

## Troubleshooting

### Common Test Issues

**Test Database Connection Failed**
```bash
# Ensure PostgreSQL is running for integration tests
docker ps | grep postgres

# Check test connection string in appsettings.test.json
```

**Email Tests Failing**
```bash
# Ensure DevelopmentMode is true for mock tests
# Check EmailSettings configuration in appsettings.test.json
# Verify Gmail credentials for production tests
```

**Authentication Tests Failing**
```bash
# Check JWT configuration in appsettings.test.json
# Ensure test user exists in test database
# Verify token generation and validation
```

**Test Data Issues**
```bash
# Ensure test data is properly seeded
# Check test data matches expected scenarios
# Verify mock data covers all test cases
```

### Debugging Tests

Run tests with detailed output:

```bash
dotnet test --logger "console;verbosity=detailed"
```

Use breakpoints in test methods for debugging:

```csharp
[Fact]
public async Task ComplexEmailTest()
{
    // Arrange
    var filter = CreateTestFilter();
    
    // Act
    var result = await _emailClientService.GetCustomerEmailsAsync(filter);
    
    // Debug point here to inspect result
    Debugger.Break(); // or use IDE breakpoints
    
    // Assert
    Assert.NotNull(result);
}
```

### Performance Testing

For performance testing of email operations:

```csharp
[Fact]
public async Task GetCustomerEmails_PerformanceTest()
{
    var stopwatch = Stopwatch.StartNew();
    
    var filter = new EmailFilterRequest
    {
        FromEmail = "customer@example.com",
        ToEmail = "customer@example.com",
        Limit = 100
    };

    var result = await _emailClientService.GetCustomerEmailsAsync(filter);
    
    stopwatch.Stop();
    
    Assert.True(stopwatch.ElapsedMilliseconds < 5000, 
        $"Email retrieval took {stopwatch.ElapsedMilliseconds}ms, expected < 5000ms");
}
```

## Best Practices

### Test Organization
- Use descriptive test names
- Arrange-Act-Assert pattern
- Test categories for organization
- Separate unit and integration tests

### Mock Usage
- Mock external dependencies in unit tests
- Use real dependencies in integration tests
- Consistent mock data across tests
- Reset test state between tests

### Email Testing
- Test both Development and Production modes
- Cover various email scenarios
- Test error conditions
- Validate email filtering logic

### Continuous Integration
Configure tests to run in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    dotnet test --logger "trx;LogFileName=test_results.trx" --collect:"XPlat Code Coverage"
```

This comprehensive test suite ensures the reliability and correctness of the Apyvyra backend, with special emphasis on the email client functionality and customer integration features.
