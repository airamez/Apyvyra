using System.Linq.Expressions;

namespace backend.Helpers;

/// <summary>
/// Helper class for applying dynamic filters to IQueryable based on query parameters
/// Supports operators: eq, ne, lt, lte, gt, gte, contains, startsWith, endsWith, between
/// </summary>
public static class QueryFilterHelper
{
    /// <summary>
    /// Applies a filter to a queryable based on field name, operator suffix, and value
    /// </summary>
    public static IQueryable<T> ApplyFilter<T>(
        IQueryable<T> query,
        string fieldName,
        string? operatorSuffix,
        string? value,
        string? valueTo = null)
    {
        if (string.IsNullOrEmpty(value))
            return query;

        var parameter = Expression.Parameter(typeof(T), "x");
        var property = GetProperty(parameter, fieldName);
        
        if (property == null)
            return query;

        var propertyType = property.Type;
        
        // Handle between operator
        if (operatorSuffix == "from" && !string.IsNullOrEmpty(valueTo))
        {
            var fromValue = ConvertValue(value, propertyType);
            var toValue = ConvertValue(valueTo, propertyType);
            
            if (fromValue == null || toValue == null)
                return query;

            var greaterThanOrEqual = Expression.GreaterThanOrEqual(property, Expression.Constant(fromValue, propertyType));
            var lessThanOrEqual = Expression.LessThanOrEqual(property, Expression.Constant(toValue, propertyType));
            var combined = Expression.AndAlso(greaterThanOrEqual, lessThanOrEqual);
            var lambda = Expression.Lambda<Func<T, bool>>(combined, parameter);
            
            return query.Where(lambda);
        }

        var convertedValue = ConvertValue(value, propertyType);
        if (convertedValue == null)
            return query;

        Expression? condition = operatorSuffix switch
        {
            "eq" => Expression.Equal(property, Expression.Constant(convertedValue, propertyType)),
            "ne" => Expression.NotEqual(property, Expression.Constant(convertedValue, propertyType)),
            "lt" => Expression.LessThan(property, Expression.Constant(convertedValue, propertyType)),
            "lte" => Expression.LessThanOrEqual(property, Expression.Constant(convertedValue, propertyType)),
            "gt" => Expression.GreaterThan(property, Expression.Constant(convertedValue, propertyType)),
            "gte" => Expression.GreaterThanOrEqual(property, Expression.Constant(convertedValue, propertyType)),
            "startsWith" => propertyType == typeof(string) 
                ? Expression.Call(property, typeof(string).GetMethod("StartsWith", new[] { typeof(string) })!, Expression.Constant(value))
                : null,
            "endsWith" => propertyType == typeof(string)
                ? Expression.Call(property, typeof(string).GetMethod("EndsWith", new[] { typeof(string) })!, Expression.Constant(value))
                : null,
            "contains" or null => propertyType == typeof(string)
                ? Expression.Call(property, typeof(string).GetMethod("Contains", new[] { typeof(string) })!, Expression.Constant(value))
                : Expression.Equal(property, Expression.Constant(convertedValue, propertyType)),
            _ => null
        };

        if (condition == null)
            return query;

        var whereLambda = Expression.Lambda<Func<T, bool>>(condition, parameter);
        return query.Where(whereLambda);
    }

    private static MemberExpression? GetProperty(Expression parameter, string propertyName)
    {
        try
        {
            // Handle nested properties (e.g., "Category.Name")
            var properties = propertyName.Split('.');
            Expression current = parameter;
            
            foreach (var prop in properties)
            {
                var propertyInfo = current.Type.GetProperty(prop, 
                    System.Reflection.BindingFlags.IgnoreCase | 
                    System.Reflection.BindingFlags.Public | 
                    System.Reflection.BindingFlags.Instance);
                
                if (propertyInfo == null)
                    return null;
                
                current = Expression.Property(current, propertyInfo);
            }
            
            return current as MemberExpression;
        }
        catch
        {
            return null;
        }
    }

    private static object? ConvertValue(string value, Type targetType)
    {
        try
        {
            // Handle nullable types
            var underlyingType = Nullable.GetUnderlyingType(targetType) ?? targetType;

            if (underlyingType == typeof(string))
                return value;

            if (underlyingType == typeof(int))
                return int.Parse(value);

            if (underlyingType == typeof(long))
                return long.Parse(value);

            if (underlyingType == typeof(decimal))
                return decimal.Parse(value);

            if (underlyingType == typeof(double))
                return double.Parse(value);

            if (underlyingType == typeof(float))
                return float.Parse(value);

            if (underlyingType == typeof(bool))
                return bool.Parse(value);

            if (underlyingType == typeof(DateTime))
                return DateTime.Parse(value).ToUniversalTime();

            if (underlyingType == typeof(DateTimeOffset))
                return DateTimeOffset.Parse(value).ToUniversalTime();

            if (underlyingType == typeof(Guid))
                return Guid.Parse(value);

            return Convert.ChangeType(value, underlyingType);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Parses query parameters and applies all filters to the query
    /// </summary>
    public static IQueryable<T> ApplyQueryFilters<T>(
        IQueryable<T> query,
        Microsoft.AspNetCore.Http.IQueryCollection queryParams)
    {
        var processedFields = new HashSet<string>();

        foreach (var param in queryParams)
        {
            var key = param.Key;
            var value = param.Value.ToString();

            if (string.IsNullOrEmpty(value))
                continue;

            // Parse field name and operator
            string fieldName;
            string? operatorSuffix = null;

            if (key.Contains('_'))
            {
                var parts = key.Split('_', 2);
                fieldName = parts[0];
                operatorSuffix = parts[1];
            }
            else
            {
                fieldName = key;
            }

            // Skip if already processed (for between operator)
            if (processedFields.Contains(fieldName))
                continue;

            // Handle between operator (field_from and field_to)
            if (operatorSuffix == "from")
            {
                var toKey = $"{fieldName}_to";
                var valueTo = queryParams.ContainsKey(toKey) ? queryParams[toKey].ToString() : null;
                
                query = ApplyFilter(query, fieldName, "from", value, valueTo);
                processedFields.Add(fieldName);
            }
            else if (operatorSuffix == "to")
            {
                // Skip, will be handled by _from
                processedFields.Add(fieldName);
            }
            else
            {
                query = ApplyFilter(query, fieldName, operatorSuffix, value);
                processedFields.Add(fieldName);
            }
        }

        return query;
    }
}
