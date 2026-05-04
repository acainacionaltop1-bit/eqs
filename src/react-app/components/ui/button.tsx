import { forwardRef } from 'react';
import { cn } from '@/react-app/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'nextfund' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-2xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            'bg-white/10 text-white hover:bg-white/20': variant === 'default',
            'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 transform hover:scale-[1.02]': variant === 'nextfund',
            'bg-transparent text-white/70 hover:text-white hover:bg-white/10': variant === 'ghost',
            'bg-red-500 hover:bg-red-600 text-white': variant === 'destructive',
          },
          {
            'h-9 px-3': size === 'sm',
            'h-12 px-6': size === 'default',
            'h-12 sm:h-14 px-6 sm:px-8': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
