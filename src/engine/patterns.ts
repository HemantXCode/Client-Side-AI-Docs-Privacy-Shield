export type PiiCategory =
  | 'email'
  | 'credit_card'
  | 'aadhaar'
  | 'pan'
  | 'ipv6'
  | 'ipv4'
  | 'phone';

export interface CategoryMeta {
  id: PiiCategory;
  label: string;
  shortLabel: string;
  priority: number;
  maskTag: string;
  pseudonymPrefix: string;
  riskWeight: number;
  badgeClass: string;
  highlightClass: string;
  dotClass: string;
}

export const PII_CATEGORIES: Record<PiiCategory, CategoryMeta> = {
  credit_card: {
    id: 'credit_card',
    label: 'Credit Card',
    shortLabel: 'Card',
    priority: 100,
    maskTag: '[CARD_REDACTED]',
    pseudonymPrefix: 'CARD',
    riskWeight: 35,
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    highlightClass: 'bg-rose-500/20 text-rose-200 border-b-2 border-rose-400',
    dotClass: 'bg-rose-400',
  },
  aadhaar: {
    id: 'aadhaar',
    label: 'Aadhaar ID',
    shortLabel: 'Aadhaar',
    priority: 90,
    maskTag: '[AADHAAR_REDACTED]',
    pseudonymPrefix: 'AADHAAR',
    riskWeight: 30,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    highlightClass: 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400',
    dotClass: 'bg-amber-400',
  },
  pan: {
    id: 'pan',
    label: 'Indian PAN',
    shortLabel: 'PAN',
    priority: 85,
    maskTag: '[PAN_REDACTED]',
    pseudonymPrefix: 'PAN',
    riskWeight: 25,
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/35',
    highlightClass: 'bg-orange-500/20 text-orange-200 border-b-2 border-orange-400',
    dotClass: 'bg-orange-400',
  },
  email: {
    id: 'email',
    label: 'Email Address',
    shortLabel: 'Email',
    priority: 80,
    maskTag: '[EMAIL_REDACTED]',
    pseudonymPrefix: 'EMAIL',
    riskWeight: 15,
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    highlightClass: 'bg-sky-500/20 text-sky-200 border-b-2 border-sky-400',
    dotClass: 'bg-sky-400',
  },
  phone: {
    id: 'phone',
    label: 'Phone Number',
    shortLabel: 'Phone',
    priority: 70,
    maskTag: '[PHONE_REDACTED]',
    pseudonymPrefix: 'PHONE',
    riskWeight: 15,
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    highlightClass: 'bg-violet-500/20 text-violet-200 border-b-2 border-violet-400',
    dotClass: 'bg-violet-400',
  },
  ipv6: {
    id: 'ipv6',
    label: 'IPv6 Address',
    shortLabel: 'IPv6',
    priority: 65,
    maskTag: '[IPV6_REDACTED]',
    pseudonymPrefix: 'IPV6',
    riskWeight: 10,
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    highlightClass: 'bg-cyan-500/20 text-cyan-200 border-b-2 border-cyan-400',
    dotClass: 'bg-cyan-400',
  },
  ipv4: {
    id: 'ipv4',
    label: 'IPv4 Address',
    shortLabel: 'IPv4',
    priority: 60,
    maskTag: '[IP_REDACTED]',
    pseudonymPrefix: 'IP',
    riskWeight: 10,
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/35',
    highlightClass: 'bg-teal-500/20 text-teal-200 border-b-2 border-teal-400',
    dotClass: 'bg-teal-400',
  },
};

export const CATEGORY_ORDER: PiiCategory[] = [
  'credit_card',
  'aadhaar',
  'pan',
  'email',
  'phone',
  'ipv6',
  'ipv4',
];

export const PATTERN_REGISTRY: Record<PiiCategory, RegExp[]> = {
  email: [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
  credit_card: [
    /(?<![+\d.\w])(?:\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{1,7}|\d{4}[\s-]\d{6}[\s-]\d{5}|\d{13,19})(?!(?:\.\d|\d|\w))/g,
  ],
  aadhaar: [
    /(?<!\d)[2-9]\d{3}(?:[\s-]\d{4}){2}(?!\d)|(?<!\d)[2-9]\d{11}(?!\d)/g,
  ],
  pan: [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g],
  ipv6: [
    /(?<![:\w.])(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7})(?!(?:\.\d|[:\w]))/g,
  ],
  ipv4: [
    /(?<![\d.])(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?!(?:\.\d|\d))/g,
  ],
  phone: [
    /(?<![\d.\w+])\+\d{1,3}[\s.-]?(?:\(\d{1,4}\)[\s.-]?|\d{1,4}[\s.-]?){2,4}\d{2,5}(?!(?:\.\d|\d|-\d))/g,
    /(?<![\d.\w+])(?:\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}|\d{3}[\s.-]\d{3}[\s.-]\d{4})(?!(?:\.\d|\d|-\d))/g,
    /(?<![\d.\w+])(?:(?:91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5})(?!(?:\.\d|\d|-\d))/g,
  ],
};
