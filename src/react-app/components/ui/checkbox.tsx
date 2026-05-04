import { forwardRef } from 'react';
import { cn } from '@/react-app/lib/utils';

export interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked = false, onCheckedChange, disabled = false, className, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed",
          checked
            ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 shadow-lg shadow-green-500/25"
            : "bg-transparent border-white/30 hover:border-white/50",
          className
        )}
        ref={ref}
        {...props}
      >
        {checked && (
          <div className="w-2 h-2 bg-white rounded-full animate-fade-in-up" />
        )}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
