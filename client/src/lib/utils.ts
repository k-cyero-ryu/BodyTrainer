import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function linkify(text: string): string {
  if (!text) return "";
  const urlPattern = /(\b(https?:\/\/|www\.)[^\s]+)/gi;
  return text.replace(urlPattern, (url) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">${url}</a>`;
  });
}
