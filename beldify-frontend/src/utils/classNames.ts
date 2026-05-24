/**
 * Utility for conditionally joining CSS class names together
 * This is similar to the classnames/clsx npm packages
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
