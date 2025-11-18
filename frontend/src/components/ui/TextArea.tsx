import { TextareaHTMLAttributes, forwardRef, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /**
   * Label text for the textarea
   */
  label?: string;

  /**
   * Helper text displayed below the textarea
   */
  helperText?: string;

  /**
   * Error message to display
   * When provided, textarea will be styled as error state
   */
  error?: string;

  /**
   * Whether the textarea is required
   * Adds asterisk to label
   * @default false
   */
  required?: boolean;

  /**
   * Size of the textarea
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether the textarea should take up the full width of its container
   * @default true
   */
  fullWidth?: boolean;

  /**
   * Whether to show character count
   * Requires maxLength to be set
   * @default false
   */
  showCount?: boolean;

  /**
   * Whether to auto-resize height based on content
   * @default false
   */
  autoResize?: boolean;
}

/**
 * TextArea component following the Ask Annie design system
 *
 * @example
 * ```tsx
 * <TextArea
 *   label="Additional notes"
 *   value={notes}
 *   onChange={(e) => setNotes(e.target.value)}
 *   maxLength={500}
 *   showCount
 *   autoResize
 * />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      size = 'medium',
      fullWidth = true,
      showCount = false,
      autoResize = false,
      disabled,
      className,
      id,
      value,
      maxLength,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    // Generate unique ID for accessibility if not provided
    const textAreaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${textAreaId}-error`;
    const helperTextId = `${textAreaId}-helper`;

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textAreaRef.current) {
        const textarea = textAreaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize]);

    // Base textarea styles
    const baseStyles =
      'block border rounded-md placeholder-gray-400 text-gray-900 transition-colors focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed resize-y';

    // Size styles
    const sizeStyles = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-3 py-2 text-sm',
      large: 'px-4 py-3 text-base',
    };

    // State styles
    const stateStyles = error
      ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500';

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Disable resize if autoResize is enabled
    const resizeStyles = autoResize ? 'resize-none' : '';

    const textAreaClassName = cn(
      baseStyles,
      sizeStyles[size],
      stateStyles,
      widthStyles,
      resizeStyles,
      className
    );

    // Calculate character count
    const charCount = value ? String(value).length : 0;
    const showCharCount = showCount && maxLength;

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textAreaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && (
              <span className="text-red-600 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* TextArea */}
        <textarea
          ref={(node) => {
            textAreaRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          id={textAreaId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? errorId : helperText ? helperTextId : undefined
          }
          aria-required={required}
          value={value}
          maxLength={maxLength}
          rows={autoResize ? 1 : rows}
          className={textAreaClassName}
          {...props}
        />

        {/* Character count and error/helper text row */}
        <div className="flex items-start justify-between mt-1">
          <div className="flex-1">
            {/* Error message */}
            {error && (
              <p id={errorId} className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Helper text (only show if no error) */}
            {!error && helperText && (
              <p id={helperTextId} className="text-sm text-gray-500">
                {helperText}
              </p>
            )}
          </div>

          {/* Character count */}
          {showCharCount && (
            <p
              className={cn(
                'text-sm ml-2 flex-shrink-0',
                charCount > maxLength! ? 'text-red-600' : 'text-gray-500'
              )}
              aria-live="polite"
            >
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
