import { twMerge } from "tailwind-merge"
import { clsx } from "clsx"
import type { ClassValue } from "clsx"

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export const dev_emails=[
  "taher.mustansir5253@gmail.com"
]
