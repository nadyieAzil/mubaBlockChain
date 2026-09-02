import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address?: string | null, length = 6): string {
  if (!address) return '';
  if (address.length <= length * 2 + 2) return address;
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

export function formatUSDC(amount: number | string | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function basisPointsToPercent(bps: number): string {
  return (bps / 100).toFixed(2);
}

export function percentToBasisPoints(pct: number): number {
  return Math.round(pct * 100);
}

export function formatDate(timestamp: number | string | Date): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
