export const OrderStatus = {
  PendingPayment: 0,
  Paid: 1,
  Confirmed: 2,
  Processing: 3,
  Shipped: 4,
  Completed: 5,
  Cancelled: 6,
  OnHold: 7,
} as const;

export const OrderStatusNames = {
  [OrderStatus.PendingPayment]: "Pending Payment",
  [OrderStatus.Paid]: "Paid",
  [OrderStatus.Confirmed]: "Confirmed",
  [OrderStatus.Processing]: "Processing",
  [OrderStatus.Shipped]: "Shipped",
  [OrderStatus.Completed]: "Completed",
  [OrderStatus.Cancelled]: "Cancelled",
  [OrderStatus.OnHold]: "On Hold",
} as const;

export const PaymentStatus = {
  Pending: 0,
  Succeeded: 1,
  Failed: 2,
  Refunded: 3,
} as const;

export const PaymentStatusNames = {
  [PaymentStatus.Pending]: "Pending",
  [PaymentStatus.Succeeded]: "Succeeded",
  [PaymentStatus.Failed]: "Failed",
  [PaymentStatus.Refunded]: "Refunded",
} as const;

export function getOrderStatusName(status: number): string {
  return OrderStatusNames[status as keyof typeof OrderStatusNames] || "Unknown";
}

export function getPaymentStatusName(status: number): string {
  return PaymentStatusNames[status as keyof typeof PaymentStatusNames] || "Unknown";
}

export function isOrderFinalState(status: number): boolean {
  return status === OrderStatus.Completed || status === OrderStatus.Cancelled;
}
