// utils/orderHelpers.ts
export function getOrderStatusBadgeVariant(status: string): "default" | "success" | "warning" | "info" | "destructive" {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  }