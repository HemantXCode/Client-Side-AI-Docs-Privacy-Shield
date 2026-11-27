import type { PiiCategory } from '../engine/patterns';

export interface CategoryPresentation {
  label: string;
  shortTag: string;
  highlightBg: string;
  chipBg: string;
  borderClass: string;
}

export const CATEGORY_THEME: Record<PiiCategory, CategoryPresentation> = {
  email: {
    label: 'Email',
    shortTag: 'EMAIL',
    highlightBg: 'bg-tint-email text-ink',
    chipBg: 'bg-tint-email text-ink',
    borderClass: 'border-ink',
  },
  phone: {
    label: 'Phone',
    shortTag: 'PHONE',
    highlightBg: 'bg-tint-phone text-ink',
    chipBg: 'bg-tint-phone text-ink',
    borderClass: 'border-ink',
  },
  pan: {
    label: 'PAN',
    shortTag: 'PAN',
    highlightBg: 'bg-tint-gov text-ink',
    chipBg: 'bg-tint-gov text-ink',
    borderClass: 'border-ink',
  },
  aadhaar: {
    label: 'Aadhaar',
    shortTag: 'AADHAAR',
    highlightBg: 'bg-tint-gov text-ink',
    chipBg: 'bg-tint-gov text-ink',
    borderClass: 'border-ink',
  },
  credit_card: {
    label: 'Card',
    shortTag: 'CARD',
    highlightBg: 'bg-tint-card text-ink',
    chipBg: 'bg-tint-card text-ink',
    borderClass: 'border-ink',
  },
  ipv4: {
    label: 'IPv4',
    shortTag: 'IPV4',
    highlightBg: 'bg-tint-ip text-ink',
    chipBg: 'bg-tint-ip text-ink',
    borderClass: 'border-ink',
  },
  ipv6: {
    label: 'IPv6',
    shortTag: 'IPV6',
    highlightBg: 'bg-tint-ip text-ink',
    chipBg: 'bg-tint-ip text-ink',
    borderClass: 'border-ink',
  },
};
