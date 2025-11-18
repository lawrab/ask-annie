import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Orientation of the divider
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Optional text label to display in the divider
   */
  label?: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Divider component for visual separation
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider label="or" />
 * <Divider orientation="vertical" />
 * ```
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', label, className, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          className={cn('inline-block h-full w-px bg-gray-200', className)}
          role="separator"
          aria-orientation="vertical"
          {...props}
        />
      );
    }

    // Horizontal divider
    if (label) {
      return (
        <div
          ref={ref}
          className={cn('relative flex items-center', className)}
          role="separator"
          aria-orientation="horizontal"
          {...props}
        >
          <div className="flex-grow border-t border-gray-200" />
          <span className="px-3 text-sm text-gray-500 bg-white">{label}</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>
      );
    }

    return (
      <hr
        ref={ref as React.Ref<HTMLHRElement>}
        className={cn('border-t border-gray-200', className)}
        role="separator"
        aria-orientation="horizontal"
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
