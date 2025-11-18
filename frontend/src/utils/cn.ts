import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 *
 * @example
 * ```tsx
 * cn('px-4 py-2', isActive && 'bg-blue-500', className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
