import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatMoney(amount: bigint | number | undefined | null) {
    if (amount === undefined || amount === null) return "₹0";
    const val = typeof amount === "bigint" ? Number(amount) / 100 : amount;
    return formatCurrency(val);
}
