const DEFAULT_COUNTRY_CODE = '+91';

export function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeCountryCode(value: string): string {
  const digits = sanitizePhoneDigits(value);
  return digits ? `+${digits}` : DEFAULT_COUNTRY_CODE;
}

export function formatPhoneForOtp(countryCode: string, localPhone: string): string {
  const localDigits = sanitizePhoneDigits(localPhone);
  if (!localDigits) return '';
  return `${normalizeCountryCode(countryCode)}${localDigits}`;
}
