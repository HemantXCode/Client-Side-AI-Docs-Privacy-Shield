import { describe, expect, it } from 'vitest';
import { SAMPLE_DATASETS } from '../../data/samples';
import {
  DEFAULT_ENABLED_CATEGORIES,
  sanitizeDocument,
} from '../sanitizer';
import { isValidLuhn, isValidVerhoeff } from '../validators';

describe('Luhn and Verhoeff validators', () => {
  it('validates real-format test cards via Luhn and rejects random 16-digit IDs', () => {
    expect(isValidLuhn('4532-0151-1283-0366')).toBe(true);
    expect(isValidLuhn('4111 1111 1111 1111')).toBe(true);
    expect(isValidLuhn('5500000000000004')).toBe(true);

    // Random 16-digit order/tracking IDs (non-Luhn)
    expect(isValidLuhn('9988-7766-5544-3321')).toBe(false);
    expect(isValidLuhn('8842190344517720')).toBe(false);
    expect(isValidLuhn('0000000000000000')).toBe(false);
    expect(isValidLuhn('12345')).toBe(false);
  });

  it('validates Aadhaar Verhoeff checksums accurately', () => {
    const validDigits = '0123456789'
      .split('')
      .map((d) => `45128890331${d}`)
      .find((candidate) => isValidVerhoeff(candidate));

    expect(validDigits).toBeDefined();
    expect(isValidVerhoeff(validDigits!)).toBe(true);

    // Flip last digit to ensure invalid checksum is rejected
    const lastDigit = Number(validDigits!.slice(-1));
    const invalidDigits = `${validDigits!.slice(0, -1)}${(lastDigit + 1) % 10}`;
    expect(isValidVerhoeff(invalidDigits)).toBe(false);
    expect(isValidVerhoeff('123456789012')).toBe(false); // starts with 1
  });
});

describe('sanitizeDocument — Core PII detection & false positive prevention', () => {
  it('detects Emails, Phones (Indian + International), IPv4, IPv6, PAN, Aadhaar, and Luhn Credit Cards', () => {
    const input = [
      'Email: ananya.sharma@fintechcorp.in',
      'IN Phone: +91 98765 43210',
      'US Phone: +1 (415) 555-0192',
      'PAN: ABCDE1234F',
      'Aadhaar: 4512 8890 3312',
      'IPv4: 192.168.10.45',
      'IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      'Card: 4532-0151-1283-0366',
    ].join('\n');

    const result = sanitizeDocument(input, {
      mode: 'full',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });

    expect(result.audit.countsByCategory.email).toBe(1);
    expect(result.audit.countsByCategory.phone).toBe(2);
    expect(result.audit.countsByCategory.pan).toBe(1);
    expect(result.audit.countsByCategory.aadhaar).toBe(1);
    expect(result.audit.countsByCategory.ipv4).toBe(1);
    expect(result.audit.countsByCategory.ipv6).toBe(1);
    expect(result.audit.countsByCategory.credit_card).toBe(1);
    expect(result.audit.totalDetections).toBe(8);

    expect(result.sanitizedText).toContain('[EMAIL_REDACTED]');
    expect(result.sanitizedText).toContain('[PHONE_REDACTED]');
    expect(result.sanitizedText).toContain('[PAN_REDACTED]');
    expect(result.sanitizedText).toContain('[AADHAAR_REDACTED]');
    expect(result.sanitizedText).toContain('[IP_REDACTED]');
    expect(result.sanitizedText).toContain('[IPV6_REDACTED]');
    expect(result.sanitizedText).toContain('[CARD_REDACTED]');
  });

  it('ignores non-Luhn 16-digit Order IDs and counts them as filtered false positives', () => {
    const input =
      'Customer paid with 4532-0151-1283-0366 for Order ID 9988-7766-5544-3321 and Tracking 8842190344517720.';

    const result = sanitizeDocument(input, {
      mode: 'full',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });

    expect(result.audit.countsByCategory.credit_card).toBe(1);
    expect(result.audit.luhnRejectedCount).toBe(2);
    expect(result.audit.falsePositivesIgnored).toBe(2);
    expect(result.sanitizedText).toContain('[CARD_REDACTED]');
    expect(result.sanitizedText).toContain('9988-7766-5544-3321');
    expect(result.sanitizedText).toContain('8842190344517720');
  });

  it('supports strict Aadhaar Verhoeff checksum toggle', () => {
    const validDigits = '0123456789'
      .split('')
      .map((d) => `45128890331${d}`)
      .find((candidate) => isValidVerhoeff(candidate))!;
    const lastDigit = Number(validDigits.slice(-1));
    const invalidDigits = `${validDigits.slice(0, -1)}${(lastDigit + 1) % 10}`;

    const input = `Valid: ${validDigits} | Invalid: ${invalidDigits}`;
    const result = sanitizeDocument(input, {
      mode: 'full',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
      enforceAadhaarVerhoeff: true,
    });

    expect(result.audit.countsByCategory.aadhaar).toBe(1);
    expect(result.audit.verhoeffRejectedCount).toBe(1);
    expect(result.sanitizedText).toBe(`Valid: [AADHAAR_REDACTED] | Invalid: ${invalidDigits}`);
  });

  it('masks partial characters safely without exposing full secrets', () => {
    const input =
      'Email: rohan@acme.io | PAN: ABCDE1234F | Card: 4532-0151-1283-0366 | Phone: +91 98765 43210 | IP: 10.24.88.12';

    const result = sanitizeDocument(input, {
      mode: 'partial',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });

    expect(result.sanitizedText).toContain('r***@acme.io');
    expect(result.sanitizedText).toContain('ABCDE****F');
    expect(result.sanitizedText).toContain('XXXX-XXXX-XXXX-0366');
    expect(result.sanitizedText).toContain('******3210');
    expect(result.sanitizedText).toContain('10.24.***.***');
    expect(result.sanitizedText).not.toContain('4532-0151');
    expect(result.sanitizedText).not.toContain('98765');
  });

  it('maintains deterministic pseudonym consistency across repeated tokens and distinct values', () => {
    const input = [
      'From: alice@corp.com to bob@corp.com.',
      'Reply-To: ALICE@corp.com.',
      'Phone1: +91 98765 43210, Phone2: 9876543210, Phone3: +91 91234 56789.',
    ].join(' ');

    const result = sanitizeDocument(input, {
      mode: 'pseudonym',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });

    expect(result.sanitizedText).toBe(
      'From: EMAIL_01 to EMAIL_02. Reply-To: EMAIL_01. Phone1: PHONE_01, Phone2: PHONE_02, Phone3: PHONE_03.'
    );
    expect(result.pseudonymKey.mappings['EMAIL_01'].occurrences).toBe(2);
    expect(result.pseudonymKey.mappings['EMAIL_02'].occurrences).toBe(1);
    expect(result.pseudonymKey.totalUniqueTokens).toBe(5);
  });

  it('resolves overlapping patterns cleanly without corrupting indices or CSV delimiters', () => {
    const csv = [
      'id,email,card,aadhaar,ip',
      '101,dev@example.org,4532-0151-1283-0366,4512 8890 3312,172.16.0.10',
      '102,ops@example.org,4111-1111-1111-1111,6789 1234 5678,fe80::1ff:fe23:4567:890a',
    ].join('\n');

    const result = sanitizeDocument(csv, {
      mode: 'full',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });

    const lines = result.sanitizedText.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe(
      '101,[EMAIL_REDACTED],[CARD_REDACTED],[AADHAAR_REDACTED],[IP_REDACTED]'
    );
    expect(lines[2]).toBe(
      '102,[EMAIL_REDACTED],[CARD_REDACTED],[AADHAAR_REDACTED],[IPV6_REDACTED]'
    );
  });

  it('skips disabled categories when toggled off', () => {
    const input = 'Email: test@user.com | IP: 192.168.1.1';
    const result = sanitizeDocument(input, {
      mode: 'full',
      enabledCategories: {
        ...DEFAULT_ENABLED_CATEGORIES,
        ipv4: false,
      },
    });

    expect(result.sanitizedText).toBe('Email: [EMAIL_REDACTED] | IP: 192.168.1.1');
    expect(result.audit.countsByCategory.email).toBe(1);
    expect(result.audit.countsByCategory.ipv4).toBe(0);
  });

  it('handles empty and whitespace-only strings gracefully', () => {
    const empty = sanitizeDocument('', {
      mode: 'full',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });
    expect(empty.sanitizedText).toBe('');
    expect(empty.audit.totalDetections).toBe(0);
    expect(empty.audit.riskLevel).toBe('Safe');

    const spaces = sanitizeDocument('   \n\t  ', {
      mode: 'pseudonym',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });
    expect(spaces.sanitizedText).toBe('   \n\t  ');
    expect(spaces.audit.totalDetections).toBe(0);
  });
});

describe('Sample datasets end-to-end verification', () => {
  it('verifies Support Ticket sample redacts Luhn card while preserving non-Luhn Order IDs', () => {
    const support = SAMPLE_DATASETS.find((s) => s.id === 'support')!;
    const result = sanitizeDocument(support.content, {
      mode: 'pseudonym',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });

    expect(result.audit.countsByCategory.credit_card).toBe(1);
    expect(result.audit.luhnRejectedCount).toBe(2);
    expect(result.audit.countsByCategory.ipv4).toBe(1);
    expect(result.audit.countsByCategory.ipv6).toBe(1);
    expect(result.audit.countsByCategory.email).toBe(2);
    expect(result.pseudonymKey.mappings['EMAIL_01'].occurrences).toBe(2);
    expect(result.sanitizedText).toContain('9988-7766-5544-3321');
    expect(result.sanitizedText).toContain('8842190344517720');
    expect(result.sanitizedText).not.toContain('4532-0151-1283-0366');
  });

  it('verifies CRM CSV sample preserves row/column structure and repeated user pseudonyms', () => {
    const csv = SAMPLE_DATASETS.find((s) => s.id === 'csv')!;
    const result = sanitizeDocument(csv.content, {
      mode: 'pseudonym',
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    });

    const lines = result.sanitizedText.split('\n');
    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(line.split(',')).toHaveLength(8);
    }
    // Non-PII numeric record IDs & totals remain intact
    expect(result.sanitizedText).toContain('10045');
    expect(result.sanitizedText).toContain('14500');
    // Repeated Rohan Verma email/phone/pan/card/ip map consistently
    expect(result.pseudonymKey.mappings['EMAIL_01'].occurrences).toBe(2);
    expect(result.pseudonymKey.mappings['CARD_01'].occurrences).toBe(2);
  });
});
