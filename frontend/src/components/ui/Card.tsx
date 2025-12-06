import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant of the card
   * @default 'elevated'
   */
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive' | 'mist';

  /**
   * Padding size
   * @default 'default'
   */
  padding?: 'none' | 'compact' | 'default' | 'spacious';

  /**
   * Whether the card is clickable/hoverable
   * Sets cursor and adds hover effects
   * @default false
   */
  interactive?: boolean;

  /**
   * Card content
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Card component following the Soft Dawn design system
 *
 * Features soft, organic shapes with gentle shadows.
 * Uses 24px border radius for a warm, approachable feel.
 *
 * Variants:
 * - default: White background, no shadow
 * - elevated: White background with soft card shadow
 * - outlined: White background with subtle border
 * - interactive: Elevated with hover/focus states
 * - mist: Morning Mist background for subtle emphasis
 *
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <Card.Header>
 *     <h3>Card Title</h3>
 *   </Card.Header>
 *   <Card.Body>
 *     <p>Card content goes here</p>
 *   </Card.Body>
 * </Card>
 * ```
 */
const CardBase = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'default',
      interactive = false,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles - rounded-2xl for soft, organic feel
    const baseStyles = 'bg-white rounded-2xl transition-all duration-200';

    // Variant styles following Soft Dawn design system
    const variantStyles = {
      default: '',
      elevated: 'shadow-card',
      outlined: 'border border-rose/20',
      interactive: 'shadow-card hover:shadow-lifted cursor-pointer',
      mist: 'bg-mist shadow-soft',
    };

    // Padding styles
    const paddingStyles = {
      none: '',
      compact: 'p-4',
      default: 'p-6',
      spacious: 'p-8',
    };

    // Interactive styles
    const interactiveStyles = interactive || onClick
      ? 'cursor-pointer hover:shadow-lifted hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2'
      : '';

    // Combine styles
    const cardClassName = cn(
      baseStyles,
      variantStyles[variant],
      paddingStyles[padding],
      interactiveStyles,
      className
    );

    // Determine if card should be clickable
    const isClickable = interactive || onClick;

    return (
      <div
        ref={ref}
        className={cardClassName}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onClick) {
                  e.preventDefault();
                  // Simulate a click event for keyboard activation
                  const syntheticEvent = {
                    ...e,
                    type: 'click',
                  } as unknown as React.MouseEvent<HTMLDivElement>;
                  onClick(syntheticEvent);
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);

// Create a type for the Card component with subcomponents
interface CardComponent extends React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
}

CardBase.displayName = 'Card';

/**
 * Card.Header - Optional header section for cards
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4 pb-3 border-b border-rose/20', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'Card.Header';

/**
 * Card.Body - Main content area for cards
 */
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'Card.Body';

/**
 * Card.Footer - Optional footer section for cards
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mt-4 pt-3 border-t border-rose/20 flex gap-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'Card.Footer';

// Attach subcomponents to Card
const Card = CardBase as CardComponent;
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };
