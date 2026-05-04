import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-2xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-secondary text-foreground hover:bg-secondary/80': variant === 'default',
            'bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 transform hover:scale-[1.02]': variant === 'primary',
            'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary': variant === 'ghost',
            'bg-destructive hover:bg-destructive/90 text-destructive-foreground': variant === 'destructive',
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
    )
  }
)
Button.displayName = 'Button'

export { Button }
