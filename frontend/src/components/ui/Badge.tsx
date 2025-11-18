import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  /**
   * Visual variant/color of the badge
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

  /**
   * Size of the badge
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether the badge can be removed
   * Shows an × button when true
   * @default false
   */
  removable?: boolean;

  /**
   * Callback when badge is removed
   * Required if removable is true
   */
  onRemove?: () => void;

  /**
   * Icon to display before text
   */
  icon?: ReactNode;

  /**
   * Badge content
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Badge component for labels, tags, and status indicators
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="primary">headache: 7</Badge>
 * <Badge removable onRemove={() => removeSymptom('headache')}>
 *   headache
 * </Badge>
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'medium',
      removable = false,
      onRemove,
      icon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors';

    // Variant styles (background + text color)
    const variantStyles = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-primary-100 text-primary-800',
      secondary: 'bg-secondary-100 text-secondary-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-amber-100 text-amber-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    // Size styles
    const sizeStyles = {
      small: 'px-2 py-0.5 text-xs gap-1',
      medium: 'px-3 py-1 text-sm gap-1.5',
      large: 'px-4 py-1.5 text-base gap-2',
    };

    const badgeClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    // Remove button styles
    const removeButtonStyles = cn(
      'ml-1 -mr-1 rounded-full hover:bg-black/10 focus:outline-none focus:bg-black/10 transition-colors',
      size === 'small' && 'p-0.5',
      size === 'medium' && 'p-0.5',
      size === 'large' && 'p-1'
    );

    const removeIconSize = {
      small: 'h-3 w-3',
      medium: 'h-3.5 w-3.5',
      large: 'h-4 w-4',
    };

    // Validate removable usage
    if (removable && !onRemove) {
      console.warn('Badge: removable badges must have an onRemove callback');
    }

    return (
      <span ref={ref} className={badgeClassName} {...props}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {removable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }
            }}
            className={removeButtonStyles}
            aria-label={`Remove ${children}`}
            tabIndex={0}
          >
            <svg
              className={removeIconSize[size]}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
