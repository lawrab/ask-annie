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
