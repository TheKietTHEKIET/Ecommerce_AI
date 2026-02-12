import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Định dạng số tiền kèm ký hiệu tiền tệ
 * @param amount - Giá tiền (có thể là null hoặc undefined)
 * @param currency - Ký hiệu tiền tệ (mặc định: "$")
 * @returns Chuỗi giá đã được định dạng (ví dụ: "$599.99")
 */
export function formatPrice(
  amount: number | null | undefined,
  currency: string = "$"
): string {
  return `${currency}${(amount ?? 0).toFixed(2)}`;
}
