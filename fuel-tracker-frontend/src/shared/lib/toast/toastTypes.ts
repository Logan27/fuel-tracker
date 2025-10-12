export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export interface Toast extends ToastOptions {
  id: string;
  type: ToastType;
  timestamp: number;
}
