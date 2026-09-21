import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard utility function for conditionally combining CSS class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
