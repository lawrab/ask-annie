import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Label text for the input
   */
  label?: string;

  /**
   * Helper text displayed below the input
   */
  helperText?: string;

  /**
   * Error message to display
   * When provided, input will be styled as error state
   */
  error?: string;

  /**
   * Whether the input is required
   * Adds asterisk to label
   * @default false
   */
  required?: boolean;

  /**
   * Size of the input
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Icon to display at the start of the input
   */
  startIcon?: ReactNode;

  /**
   * Icon to display at the end of the input
   */
  endIcon?: ReactNode;

  /**
   * Whether the input should take up the full width of its container
   * @default true
   */
  fullWidth?: boolean;
}

/**
 * Input component following the Soft Dawn design system
 *
 * Uses warm, accessible colors:
 * - Deep Walnut for text
 * - Deep Sage for focus states
 * - Rose accents for borders
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email address"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={emailError}
 *   helperText="We'll never share your email"
 *   required
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      size = 'medium',
      startIcon,
      endIcon,
      fullWidth = true,
      disabled,
      type = 'text',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    // Generate unique ID for accessibility if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;

    // Base input styles following Soft Dawn design
    const baseStyles =
      'block border rounded-lg placeholder-walnut-muted text-walnut transition-colors duration-200 focus:outline-none disabled:bg-mist disabled:cursor-not-allowed';

    // Size styles
    const sizeStyles = {
      small: 'px-3 py-1.5 text-base',
      medium: 'px-3 py-2 text-base',
      large: 'px-4 py-3 text-base',
    };

    // State styles - using Soft Dawn colors
    const stateStyles = error
      ? 'border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500'
      : 'border-walnut-200 focus:ring-2 focus:ring-sage focus:border-sage';

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Icon padding adjustments
    const iconPadding = {
      start: startIcon ? 'pl-10' : '',
      end: endIcon || type === 'password' ? 'pr-10' : '',
    };

    const inputClassName = cn(
      baseStyles,
      sizeStyles[size],
      stateStyles,
      widthStyles,
      iconPadding.start,
      iconPadding.end,
      className
    );

    // Determine input type (handle password show/hide)
    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-walnut mb-1"
          >
            {label}
            {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
          </label>
        )}

        {/* Input wrapper (for icons) */}
        <div className="relative">
          {/* Start icon */}
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-walnut-muted">
              {startIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? errorId : helperText ? helperTextId : undefined
            }
            aria-required={required}
            className={inputClassName}
            {...props}
          />

          {/* End icon or password toggle */}
          {(endIcon || type === 'password') && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {type === 'password' ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-walnut-muted hover:text-walnut focus:outline-none focus:text-walnut text-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              ) : (
                <div className="text-walnut-muted pointer-events-none">{endIcon}</div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Helper text (only show if no error) */}
        {!error && helperText && (
          <p id={helperTextId} className="mt-1 text-sm text-walnut-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
