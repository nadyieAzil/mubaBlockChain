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

/**
 * Validates whether a string conforms to a valid Sui 64-hex object/account address format.
 */
export function isValidSuiAddress(address?: string | null): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  // Accepts standard 0x prefixed hex addresses (up to 64 hex characters)
  return /^0x[a-fA-F0-9]{1,64}$/.test(trimmed);
}

/**
 * Strictly sanitizes and validates proof/deliverable URIs against dangerous schemes (javascript:, data:, vbscript:).
 */
export function sanitizeDeliverableUri(uri?: string | null): { isValid: boolean; sanitizedUrl: string } {
  if (!uri || typeof uri !== 'string') return { isValid: false, sanitizedUrl: '' };
  const trimmed = uri.trim();
  
  // Disallow scripts and dangerous pseudo-protocols
  if (/^(javascript:|data:|vbscript:|file:)/i.test(trimmed)) {
    return { isValid: false, sanitizedUrl: '' };
  }

  // Enforce http/https or ipfs protocols
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('ipfs://')) {
    return { isValid: true, sanitizedUrl: trimmed };
  }

  // If provided as a domain without scheme (e.g. github.com/user/repo), prepend https://
  if (/^[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return { isValid: true, sanitizedUrl: `https://${trimmed}` };
  }

  return { isValid: false, sanitizedUrl: '' };
}
