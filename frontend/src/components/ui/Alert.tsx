import { HTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Type of alert (determines color and icon)
   * @default 'info'
   */
  type?: 'success' | 'error' | 'warning' | 'info';

  /**
   * Optional title for the alert
   */
  title?: ReactNode;

  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Whether to show an icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom icon (overrides default type icon)
   */
  icon?: ReactNode;

  /**
   * Alert content
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Alert component for displaying important messages
 *
 * @example
 * ```tsx
 * <Alert type="success">
 *   Check-in saved successfully!
 * </Alert>
 *
 * <Alert type="error" title="Error" dismissible onDismiss={handleDismiss}>
 *   Failed to save check-in. Please try again.
 * </Alert>
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      type = 'info',
      title,
      dismissible = false,
      onDismiss,
      showIcon = true,
      icon: customIcon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);

    // Type-specific styles
    const typeStyles = {
      success: {
        container: 'bg-green-50 border-green-400 text-green-700',
        icon: 'text-green-500',
        title: 'text-green-800',
      },
      error: {
        container: 'bg-red-50 border-red-400 text-red-700',
        icon: 'text-red-500',
        title: 'text-red-800',
      },
      warning: {
        container: 'bg-amber-50 border-amber-400 text-amber-700',
        icon: 'text-amber-500',
        title: 'text-amber-800',
      },
      info: {
        container: 'bg-blue-50 border-blue-400 text-blue-700',
        icon: 'text-blue-500',
        title: 'text-blue-800',
      },
    };

    // Default icons
    const defaultIcons = {
      success: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      error: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      info: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) {
      return null;
    }

    const alertClassName = cn(
      'border px-4 py-3 rounded relative',
      typeStyles[type].container,
      className
    );

    const icon = customIcon || defaultIcons[type];

    return (
      <div ref={ref} className={alertClassName} role="alert" {...props}>
        <div className="flex items-start">
          {/* Icon */}
          {showIcon && (
            <div className={cn('flex-shrink-0 mr-3', typeStyles[type].icon)}>
              {icon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            {title && (
              <h3 className={cn('font-semibold mb-1', typeStyles[type].title)}>
                {title}
              </h3>
            )}
            <div className="text-sm">{children}</div>
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="ml-3 flex-shrink-0 inline-flex text-current hover:opacity-75 focus:outline-none focus:opacity-75"
              aria-label="Dismiss alert"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
