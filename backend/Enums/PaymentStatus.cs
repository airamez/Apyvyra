namespace backend.Enums;

public static class PaymentStatus
{
    public const int Pending = 0;
    public const int Succeeded = 1;
    public const int Failed = 2;
    public const int Refunded = 3;

    public static readonly string[] Names = {
        "PAYMENT_STATUS_PENDING",
        "PAYMENT_STATUS_SUCCEEDED",
        "PAYMENT_STATUS_FAILED",
        "PAYMENT_STATUS_REFUNDED"
    };

    public static string GetName(int status)
    {
        return status >= 0 && status < Names.Length ? Names[status] : "PAYMENT_STATUS_UNKNOWN";
    }
}
