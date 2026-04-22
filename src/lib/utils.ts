import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Helper shadcn/ui : combine clsx (conditionnel) + tailwind-merge
 * (dedupe les classes Tailwind conflictuelles).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
