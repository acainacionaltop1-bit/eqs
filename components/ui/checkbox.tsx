'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked = false, onCheckedChange, disabled = false, className, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    return (
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed',
          checked
            ? 'bg-gradient-to-r from-primary to-accent border-primary shadow-lg shadow-primary/25'
            : 'bg-transparent border-border hover:border-muted-foreground',
          className
        )}
        ref={ref}
        {...props}
      >
        {checked && (
          <div className="w-2 h-2 bg-primary-foreground rounded-full animate-fade-in-up" />
        )}
      </button>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
