import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assetUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, "")
  return `${import.meta.env.BASE_URL}${normalizedPath}`
}
