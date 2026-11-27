import {
  CATEGORY_ORDER,
  PII_CATEGORIES,
  PATTERN_REGISTRY,
  type PiiCategory,
} from './patterns';
import {
  isValidLuhn,
  isValidPhoneCandidate,
  isValidVerhoeff,
  stripToDigits,
} from './validators';

export type RedactionMode = 'full' | 'partial' | 'pseudonym';

export interface SanitizeOptions {
  mode: RedactionMode;
  enabledCategories: Record<PiiCategory, boolean>;
  enforceAadhaarVerhoeff?: boolean;
}

export interface DetectedSpan {
  id: string;
  category: PiiCategory;
  start: number;
  end: number;
  raw: string;
  replacement: string;
  validationBadge: string;
  priority: number;
}

export interface OutputSegment {
  text: string;
  isRedacted: boolean;
  category?: PiiCategory;
  raw?: string;
}

export interface RejectedCandidate {
  category: PiiCategory;
  start: number;
  end: number;
  raw: string;
  reason: string;
}

export type RiskLevel = 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface PseudonymMappingEntry {
  placeholder: string;
  category: PiiCategory;
  originalPreview: string;
  occurrences: number;
}

export interface AuditStats {
  totalDetections: number;
  countsByCategory: Record<PiiCategory, number>;
  falsePositivesIgnored: number;
  luhnRejectedCount: number;
  verhoeffRejectedCount: number;
  rejectedCandidates: RejectedCandidate[];
  riskScore: number;
  riskLevel: RiskLevel;
  processingTimeMs: number;
}

export interface SanitizationResult {
  originalText: string;
  sanitizedText: string;
  spans: DetectedSpan[];
  outputSegments: OutputSegment[];
  audit: AuditStats;
  pseudonymKey: {
    mode: RedactionMode;
    generatedAt: string;
    totalUniqueTokens: number;
    mappings: Record<string, { category: PiiCategory; occurrences: number }>;
  };
}

export const DEFAULT_ENABLED_CATEGORIES: Record<PiiCategory, boolean> = {
  credit_card: true,
  aadhaar: true,
  pan: true,
  email: true,
  phone: true,
  ipv6: true,
  ipv4: true,
};

function createEmptyCounts(): Record<PiiCategory, number> {
  return {
    credit_card: 0,
    aadhaar: 0,
    pan: 0,
    email: 0,
    phone: 0,
    ipv6: 0,
    ipv4: 0,
  };
}

function normalizeForPseudonym(category: PiiCategory, raw: string): string {
  switch (category) {
    case 'email':
      return raw.trim().toLowerCase();
    case 'credit_card':
    case 'aadhaar':
    case 'phone':
      return stripToDigits(raw);
    case 'pan':
    case 'ipv6':
      return raw.trim().toUpperCase();
    case 'ipv4':
      return raw.trim();
  }
}

function applyPartialMask(category: PiiCategory, raw: string): string {
  switch (category) {
    case 'credit_card': {
      const digits = stripToDigits(raw);
      const last4 = digits.slice(-4);
      if (raw.includes('-')) {
        return `XXXX-XXXX-XXXX-${last4}`;
      }
      if (raw.includes(' ')) {
        return `XXXX XXXX XXXX ${last4}`;
      }
      return `XXXXXXXXXXXX${last4}`;
    }
    case 'email': {
      const atIdx = raw.indexOf('@');
      if (atIdx <= 0) return '[EMAIL_REDACTED]';
      const local = raw.slice(0, atIdx);
      const domain = raw.slice(atIdx);
      return `${local[0]}***${domain}`;
    }
    case 'pan': {
      if (raw.length !== 10) return '[PAN_REDACTED]';
      return `${raw.slice(0, 5)}****${raw.slice(9)}`;
    }
    case 'aadhaar': {
      const digits = stripToDigits(raw);
      const last4 = digits.slice(-4);
      if (raw.includes('-')) return `XXXX-XXXX-${last4}`;
      if (raw.includes(' ')) return `XXXX XXXX ${last4}`;
      return `XXXXXXXX${last4}`;
    }
    case 'phone': {
      const digits = stripToDigits(raw);
      const last4 = digits.slice(-4);
      const prefix = raw.startsWith('+') ? `+${digits.slice(0, Math.max(1, digits.length - 10))} ` : '';
      return `${prefix}******${last4}`;
    }
    case 'ipv4': {
      const parts = raw.split('.');
      if (parts.length !== 4) return '[IP_REDACTED]';
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    case 'ipv6': {
      const idx = raw.indexOf('::');
      if (idx > 0) {
        return `${raw.slice(0, idx)}::****`;
      }
      const segments = raw.split(':');
      return `${segments.slice(0, 2).join(':')}::****`;
    }
  }
}

function computeRiskLevel(score: number): RiskLevel {
  if (score === 0) return 'Safe';
  if (score <= 20) return 'Low';
  if (score <= 45) return 'Medium';
  if (score <= 75) return 'High';
  return 'Critical';
}

function overlapsRange(
  start: number,
  end: number,
  ranges: Array<{ start: number; end: number }>
): boolean {
  return ranges.some((r) => start < r.end && end > r.start);
}

/**
 * Scans, validates, resolves overlaps, and redacts sensitive PII synchronously in-memory.
 */
export function sanitizeDocument(
  text: string,
  options: SanitizeOptions
): SanitizationResult {
  const startTime =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!text) {
    return {
      originalText: text,
      sanitizedText: '',
      spans: [],
      outputSegments: [],
      audit: {
        totalDetections: 0,
        countsByCategory: createEmptyCounts(),
        falsePositivesIgnored: 0,
        luhnRejectedCount: 0,
        verhoeffRejectedCount: 0,
        rejectedCandidates: [],
        riskScore: 0,
        riskLevel: 'Safe',
        processingTimeMs: 0,
      },
      pseudonymKey: {
        mode: options.mode,
        generatedAt: new Date().toISOString(),
        totalUniqueTokens: 0,
        mappings: {},
      },
    };
  }

  const rawCandidates: Array<{
    category: PiiCategory;
    start: number;
    end: number;
    raw: string;
    validationBadge: string;
    priority: number;
  }> = [];

  const rejectedCandidates: RejectedCandidate[] = [];
  const rejectedCardRanges: Array<{ start: number; end: number }> = [];
  let luhnRejectedCount = 0;
  let verhoeffRejectedCount = 0;

  // 1. Collect candidates category by category in priority order
  for (const category of CATEGORY_ORDER) {
    if (!options.enabledCategories[category]) continue;
    const meta = PII_CATEGORIES[category];
    const regexes = PATTERN_REGISTRY[category];

    for (const templateRegex of regexes) {
      const regex = new RegExp(templateRegex.source, templateRegex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const raw = match[0];
        const start = match.index;
        const end = start + raw.length;

        if (category === 'credit_card') {
          if (!isValidLuhn(raw)) {
            luhnRejectedCount++;
            rejectedCardRanges.push({ start, end });
            rejectedCandidates.push({
              category,
              start,
              end,
              raw,
              reason: 'Failed Luhn checksum (non-card numeric ID)',
            });
            continue;
          }
          rawCandidates.push({
            category,
            start,
            end,
            raw,
            validationBadge: 'Luhn Verified',
            priority: meta.priority,
          });
          continue;
        }

        if (category === 'aadhaar') {
          // Do not match inside a rejected 16-digit non-Luhn ID
          if (overlapsRange(start, end, rejectedCardRanges)) {
            continue;
          }
          const verhoeffOk = isValidVerhoeff(raw);
          if (options.enforceAadhaarVerhoeff && !verhoeffOk) {
            verhoeffRejectedCount++;
            rejectedCandidates.push({
              category,
              start,
              end,
              raw,
              reason: 'Failed Verhoeff checksum',
            });
            continue;
          }
          rawCandidates.push({
            category,
            start,
            end,
            raw,
            validationBadge: verhoeffOk ? 'Verhoeff Verified' : 'Format Match',
            priority: meta.priority,
          });
          continue;
        }

        if (category === 'phone') {
          // Prevent phone regex from matching fragments of rejected 16-digit order IDs
          if (overlapsRange(start, end, rejectedCardRanges)) {
            continue;
          }
          if (!isValidPhoneCandidate(raw)) {
            continue;
          }
          rawCandidates.push({
            category,
            start,
            end,
            raw,
            validationBadge: raw.startsWith('+') ? 'E.164 Format' : 'Phone Pattern',
            priority: meta.priority,
          });
          continue;
        }

        const badgeMap: Record<PiiCategory, string> = {
          credit_card: 'Luhn Verified',
          aadhaar: 'Format Match',
          pan: 'PAN Structure',
          email: 'RFC Email',
          phone: 'Phone Pattern',
          ipv6: 'IPv6 Format',
          ipv4: 'IPv4 Range Valid',
        };

        rawCandidates.push({
          category,
          start,
          end,
          raw,
          validationBadge: badgeMap[category],
          priority: meta.priority,
        });
      }
    }
  }

  // 2. Deterministic overlap resolution:
  //    Sort by higher priority first, then longer span length, then earlier start.
  const ranked = [...rawCandidates].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    return a.start - b.start;
  });

  const accepted: typeof rawCandidates = [];
  for (const candidate of ranked) {
    const conflicts = accepted.some(
      (existing) => candidate.start < existing.end && candidate.end > existing.start
    );
    if (!conflicts) {
      accepted.push(candidate);
    }
  }

  // Sort accepted spans in document order (left to right)
  accepted.sort((a, b) => a.start - b.start);

  // 3. Assign replacements & build pseudonym map
  const pseudonymCounters = createEmptyCounts();
  const pseudonymLookup = new Map<string, string>();
  const keyMappings: Record<string, { category: PiiCategory; occurrences: number }> = {};
  const countsByCategory = createEmptyCounts();

  const spans: DetectedSpan[] = accepted.map((item, idx) => {
    countsByCategory[item.category]++;
    const meta = PII_CATEGORIES[item.category];
    let replacement: string;

    if (options.mode === 'full') {
      replacement = meta.maskTag;
    } else if (options.mode === 'partial') {
      replacement = applyPartialMask(item.category, item.raw);
    } else {
      const normalizedKey = `${item.category}:${normalizeForPseudonym(
        item.category,
        item.raw
      )}`;
      let token = pseudonymLookup.get(normalizedKey);
      if (!token) {
        pseudonymCounters[item.category]++;
        const indexStr = String(pseudonymCounters[item.category]).padStart(2, '0');
        token = `${meta.pseudonymPrefix}_${indexStr}`;
        pseudonymLookup.set(normalizedKey, token);
        keyMappings[token] = { category: item.category, occurrences: 0 };
      }
      keyMappings[token].occurrences++;
      replacement = token;
    }

    return {
      id: `span-${idx}-${item.start}`,
      category: item.category,
      start: item.start,
      end: item.end,
      raw: item.raw,
      replacement,
      validationBadge: item.validationBadge,
      priority: item.priority,
    };
  });

  // 4. Reconstruct sanitized text & output segments preserving exact whitespace/delimiters
  const outputSegments: OutputSegment[] = [];
  let cursor = 0;

  for (const span of spans) {
    if (span.start > cursor) {
      outputSegments.push({
        text: text.slice(cursor, span.start),
        isRedacted: false,
      });
    }
    outputSegments.push({
      text: span.replacement,
      isRedacted: true,
      category: span.category,
      raw: span.raw,
    });
    cursor = span.end;
  }

  if (cursor < text.length) {
    outputSegments.push({
      text: text.slice(cursor),
      isRedacted: false,
    });
  }

  const sanitizedText = outputSegments.map((s) => s.text).join('');

  // 5. Compute risk score (0-100) based on weighted detections
  let rawRisk = 0;
  for (const cat of CATEGORY_ORDER) {
    rawRisk += countsByCategory[cat] * PII_CATEGORIES[cat].riskWeight;
  }
  const riskScore = Math.min(100, rawRisk);
  const endTime =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    originalText: text,
    sanitizedText,
    spans,
    outputSegments,
    audit: {
      totalDetections: spans.length,
      countsByCategory,
      falsePositivesIgnored: luhnRejectedCount + verhoeffRejectedCount,
      luhnRejectedCount,
      verhoeffRejectedCount,
      rejectedCandidates,
      riskScore,
      riskLevel: computeRiskLevel(riskScore),
      processingTimeMs: Math.max(0.1, Number((endTime - startTime).toFixed(2))),
    },
    pseudonymKey: {
      mode: options.mode,
      generatedAt: new Date().toISOString(),
      totalUniqueTokens: Object.keys(keyMappings).length,
      mappings: keyMappings,
    },
  };
}
