import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /**
   * Label text for the radio
   */
  label?: ReactNode;

  /**
   * Helper text displayed below the radio
   */
  helperText?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Size of the radio button
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Radio component following the Annie's Health Journal design system
 *
 * @example
 * ```tsx
 * <Radio
 *   name="severity"
 *   value="mild"
 *   checked={severity === 'mild'}
 *   onChange={(e) => setSeverity(e.target.value)}
 *   label="Mild"
 * />
 * ```
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'medium',
      disabled,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility if not provided
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${radioId}-error`;
    const helperTextId = `${radioId}-helper`;

    // Size styles
    const sizeStyles = {
      small: 'h-3 w-3',
      medium: 'h-4 w-4',
      large: 'h-5 w-5',
    };

    const radioClassName = cn(
      'border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
      sizeStyles[size],
      className
    );

    return (
      <div className="flex flex-col">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={radioId}
              type="radio"
              disabled={disabled}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={
                error ? errorId : helperText ? helperTextId : undefined
              }
              className={radioClassName}
              {...props}
            />
          </div>

          {/* Label */}
          {label && (
            <div className="ml-2 flex-1">
              <label
                htmlFor={radioId}
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

Radio.displayName = 'Radio';
