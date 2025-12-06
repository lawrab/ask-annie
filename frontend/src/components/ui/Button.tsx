import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'link' | 'cta';

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
 * Button component following the Soft Dawn design system
 *
 * Variants:
 * - primary: Blush Rose background, Deep Walnut text (7.4:1 contrast)
 * - cta: Deep Terracotta background, white text (4.9:1 contrast) - for main actions
 * - secondary: Rose border, transparent background
 * - tertiary: Transparent, for less prominent actions
 * - danger: Red for destructive actions
 * - link: Text-only link style
 *
 * @example
 * ```tsx
 * <Button variant="cta">Start Check-in</Button>
 * <Button variant="primary">Save</Button>
 * <Button variant="danger" icon={<TrashIcon />}>Delete</Button>
 * <Button variant="secondary" loading>Processing...</Button>
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
      'inline-flex items-center justify-center font-sans font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles following Soft Dawn design system
    const variantStyles = {
      // Primary: Blush Rose background, Deep Walnut text
      primary:
        'bg-rose text-walnut shadow-soft hover:bg-rose-hover hover:shadow-card hover:-translate-y-0.5 focus:ring-rose disabled:hover:bg-rose disabled:hover:translate-y-0 disabled:hover:shadow-soft',
      // CTA: Deep Terracotta background, white text - for main conversion actions
      cta: 'bg-terracotta text-white shadow-soft hover:bg-terracotta-hover hover:shadow-card hover:-translate-y-0.5 focus:ring-terracotta disabled:hover:bg-terracotta disabled:hover:translate-y-0 disabled:hover:shadow-soft',
      // Secondary: Rose border, transparent background
      secondary:
        'border-2 border-rose bg-transparent text-walnut hover:bg-rose hover:text-walnut focus:ring-rose disabled:hover:bg-transparent',
      // Tertiary: Minimal styling for less prominent actions
      tertiary:
        'bg-transparent hover:bg-cream text-walnut-muted hover:text-walnut focus:ring-sage disabled:hover:bg-transparent',
      // Danger: Red for destructive actions
      danger:
        'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:hover:bg-red-600',
      // Link: Text-only link style
      link: 'bg-transparent hover:underline text-sage hover:text-walnut focus:ring-sage p-0 h-auto disabled:hover:no-underline',
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
