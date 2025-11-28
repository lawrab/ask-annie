import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /**
   * Label text for the checkbox
   */
  label?: ReactNode;

  /**
   * Helper text displayed below the checkbox
   */
  helperText?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Indeterminate state (visual only, for "select all" scenarios)
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Size of the checkbox
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Checkbox component following the Annie's Health Journal design system
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={agreed}
 *   onChange={(e) => setAgreed(e.target.checked)}
 *   label="I agree to the terms and conditions"
 * />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      indeterminate = false,
      size = 'medium',
      disabled,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility if not provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${checkboxId}-error`;
    const helperTextId = `${checkboxId}-helper`;

    // Size styles
    const sizeStyles = {
      small: 'h-3 w-3',
      medium: 'h-4 w-4',
      large: 'h-5 w-5',
    };

    const checkboxClassName = cn(
      'rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
      sizeStyles[size],
      className
    );

    return (
      <div className="flex flex-col">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={(node) => {
                if (node && indeterminate) {
                  node.indeterminate = true;
                }
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }}
              id={checkboxId}
              type="checkbox"
              disabled={disabled}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={
                error ? errorId : helperText ? helperTextId : undefined
              }
              className={checkboxClassName}
              {...props}
            />
          </div>

          {/* Label */}
          {label && (
            <div className="ml-2 flex-1">
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm text-gray-700',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>

              {/* Helper text */}
              {helperText && !error && (
                <p id={helperTextId} className="text-xs text-gray-500 mt-0.5">
                  {helperText}
                </p>
              )}

              {/* Error message */}
              {error && (
                <p id={errorId} className="text-xs text-red-600 mt-0.5" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
