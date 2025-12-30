namespace backend.Enums;

public static class OrderStatus
{
    public const int PendingPayment = 0;
    public const int Paid = 1;
    public const int Confirmed = 2;
    public const int Processing = 3;
    public const int Shipped = 4;
    public const int Completed = 5;
    public const int Cancelled = 6;
    public const int OnHold = 7;

    public static readonly string[] Names = {
        "Pending Payment",
        "Paid",
        "Confirmed",
        "Processing",
        "Shipped",
        "Completed",
        "Cancelled",
        "On Hold"
    };

    public static string GetName(int status)
    {
        return status >= 0 && status < Names.Length ? Names[status] : "Unknown";
    }

    public static bool IsFinalState(int status)
    {
        return status == Completed || status == Cancelled;
    }

    public static bool CanTransition(int from, int to)
    {
        // Define valid transitions
        return (from, to) switch
        {
            (PendingPayment, Paid) => true,
            (PendingPayment, Cancelled) => true,
            (Paid, Confirmed) => true,
            (Paid, Cancelled) => true,
            (Confirmed, Processing) => true,
            (Confirmed, Cancelled) => true,
            (Confirmed, OnHold) => true,
            (Processing, Shipped) => true,
            (Processing, Cancelled) => true,
            (Processing, OnHold) => true,
            (OnHold, Processing) => true,
            (OnHold, Cancelled) => true,
            (Shipped, Completed) => true,
            _ => false
        };
    }
}

public static class PaymentStatus
{
    public const int Pending = 0;
    public const int Succeeded = 1;
    public const int Failed = 2;
    public const int Refunded = 3;

    public static readonly string[] Names = {
        "Pending",
        "Succeeded",
        "Failed",
        "Refunded"
    };

    public static string GetName(int status)
    {
        return status >= 0 && status < Names.Length ? Names[status] : "Unknown";
    }
}
