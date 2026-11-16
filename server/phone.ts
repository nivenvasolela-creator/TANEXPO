export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let cleaned = trimmed.replace(/[\s\-()]/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (!/^[1-9]\d{7,14}$/.test(digits)) {
      return null;
    }
    return '+' + digits;
  }

  if (!/^\d+$/.test(cleaned)) {
    return null;
  }

  // 12 digits starting with 255 -> +255...
  if (/^255\d{9}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  // 10 digits starting with 0 -> +255...
  if (/^0\d{9}$/.test(cleaned)) {
    return '+255' + cleaned.slice(1);
  }

  // 9 digits starting with 6 or 7 -> +255...
  if (/^[67]\d{8}$/.test(cleaned)) {
    return '+255' + cleaned;
  }

  return null;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '';
  const s = phone.trim();
  if (s.length <= 3) return '***';
  return '*'.repeat(Math.max(3, s.length - 3)) + s.slice(-3);
}
