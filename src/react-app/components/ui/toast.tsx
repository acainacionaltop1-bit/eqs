import { toast as hotToast, Toaster } from 'react-hot-toast';

// Simple toast utility
export const toast = {
  success: (message: string) => hotToast.success(message, {
    duration: 4000,
    style: {
      background: '#1f2937',
      color: '#fff',
      border: '1px solid #10b981',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#1f2937',
    },
  }),
  
  error: (message: string) => hotToast.error(message, {
    duration: 4000,
    style: {
      background: '#1f2937',
      color: '#fff',
      border: '1px solid #ef4444',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#1f2937',
    },
  }),
  
  loading: (message: string) => hotToast.loading(message, {
    style: {
      background: '#1f2937',
      color: '#fff',
      border: '1px solid #6b7280',
    },
  }),
  
  custom: (message: string, options?: any) => hotToast(message, {
    style: {
      background: '#1f2937',
      color: '#fff',
      border: '1px solid #6b7280',
    },
    ...options,
  }),
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
    </>
  );
};
