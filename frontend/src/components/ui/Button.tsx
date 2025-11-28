import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'link';

  /**
   * The size of the button
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether the button should take up the full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Whether the button is in a loading state
   * Shows a spinner and disables interaction
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display before the button text
   */
  icon?: ReactNode;

  /**
   * Whether this is an icon-only button (no text)
   * Requires aria-label for accessibility
   * @default false
   */
  iconOnly?: boolean;

  /**
   * Accessible label for icon-only buttons
   * Required when iconOnly is true
   */
  'aria-label'?: string;

  /**
   * Button content (text and/or icons)
   */
  children?: ReactNode;
}

/**
 * Button component following the Annie's Health Journal design system
 *
 * @example
 * ```tsx
 * <Button variant="primary">Save Check-in</Button>
 * <Button variant="danger" icon={<TrashIcon />}>Delete</Button>
 * <Button variant="secondary" loading>Processing...</Button>
 * <Button iconOnly aria-label="Delete"><TrashIcon /></Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      icon,
      iconOnly = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles - always applied
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles = {
      primary:
        'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 disabled:hover:bg-primary-600',
      secondary:
        'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500 disabled:hover:bg-white',
      tertiary:
        'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-primary-500 disabled:hover:bg-transparent',
      danger:
        'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:hover:bg-red-600',
      link: 'bg-transparent hover:underline text-primary-600 hover:text-primary-700 focus:ring-primary-500 p-0 h-auto disabled:hover:no-underline',
    };

    // Size styles
    const sizeStyles = {
      small: iconOnly ? 'p-1.5' : 'px-3 py-1.5 text-sm',
      medium: iconOnly ? 'p-2' : 'px-4 py-2 text-sm',
      large: iconOnly ? 'p-3' : 'px-6 py-3 text-base',
    };

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Combine all styles
    const buttonClassName = cn(
      baseStyles,
      variantStyles[variant],
      variant !== 'link' && sizeStyles[size],
      widthStyles,
      className
    );

    // Loading spinner component
    const Spinner = () => (
      <svg
        className="animate-spin h-4 w-4 mr-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Validate iconOnly usage
    if (iconOnly && !props['aria-label']) {
      console.warn(
        'Button: iconOnly buttons must have an aria-label for accessibility'
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner />}
        {!loading && icon && !iconOnly && <span className="mr-2">{icon}</span>}
        {!iconOnly && children}
        {iconOnly && children}
      </button>
    );
  }
);

Button.displayName = 'Button';
