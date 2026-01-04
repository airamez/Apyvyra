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
        "ORDER_STATUS_PENDING_PAYMENT",
        "ORDER_STATUS_PAID",
        "ORDER_STATUS_CONFIRMED",
        "ORDER_STATUS_PROCESSING",
        "ORDER_STATUS_SHIPPED",
        "ORDER_STATUS_COMPLETED",
        "ORDER_STATUS_CANCELLED",
        "ORDER_STATUS_ON_HOLD"
    };

    public static string GetName(int status)
    {
        return status >= 0 && status < Names.Length ? Names[status] : "ORDER_STATUS_UNKNOWN";
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
