/**
 * String utility functions
 */

/**
 * Capitalize the first letter of a string
 * @example capitalize('pain') => 'Pain'
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get the uppercase initial (first letter) of a string
 * @example getInitial('john') => 'J'
 * @example getInitial('') => 'U' (default)
 */
export function getInitial(str: string | undefined | null, fallback: string = 'U'): string {
  if (!str || str.length === 0) return fallback;
  return str.charAt(0).toUpperCase();
}

/**
 * Format a number with fixed decimal places
 * @example formatNumber(3.567, 1) => '3.6'
 */
export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Format a snake_case or underscore-separated string for display
 * Converts to Title Case with spaces
 * @example formatDisplayName('joint_pain') => 'Joint Pain'
 * @example formatDisplayName('back_pain') => 'Back Pain'
 * @example formatDisplayName('headache') => 'Headache'
 * @example formatDisplayName('Back Pain') => 'Back Pain' (preserves already-formatted)
 */
export function formatDisplayName(str: string): string {
  if (!str) return '';
  // Split on underscores or spaces, then title case each word
  return str
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
