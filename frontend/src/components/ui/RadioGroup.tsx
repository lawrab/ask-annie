import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface RadioGroupProps {
  /**
   * Label for the radio group
   */
  label?: string;

  /**
   * Helper text for the entire group
   */
  helperText?: string;

  /**
   * Error message for the group
   */
  error?: string;

  /**
   * Whether the group is required
   * @default false
   */
  required?: boolean;

  /**
   * Radio button elements
   */
  children: ReactNode;

  /**
   * Direction of radio buttons
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * Additional className
   */
  className?: string;
}

/**
 * RadioGroup component for grouping related radio buttons
 *
 * @example
 * ```tsx
 * <RadioGroup label="Severity level" required>
 *   <Radio name="severity" value="mild" label="Mild" />
 *   <Radio name="severity" value="moderate" label="Moderate" />
 *   <Radio name="severity" value="severe" label="Severe" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup({
  label,
  helperText,
  error,
  required,
  children,
  direction = 'vertical',
  className,
}: RadioGroupProps) {
  const groupId = `radiogroup-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${groupId}-error`;
  const helperTextId = `${groupId}-helper`;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Label */}
      {label && (
        <div className="text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && (
            <span className="text-red-600 ml-1" aria-label="required">
              *
            </span>
          )}
        </div>
      )}

      {/* Radio buttons */}
      <div
        role="radiogroup"
        aria-labelledby={label ? groupId : undefined}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? errorId : helperText ? helperTextId : undefined
        }
        className={cn(
          'space-y-3',
          direction === 'horizontal' && 'flex flex-wrap gap-4 space-y-0'
        )}
      >
        {children}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p id={helperTextId} className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

RadioGroup.displayName = 'RadioGroup';
