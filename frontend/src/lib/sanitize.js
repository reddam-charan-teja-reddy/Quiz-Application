/**
 * Input sanitization utilities.
 *
 * These strip characters that could enable HTML-injection or break
 * JSON round-tripping.  They are intentionally lightweight — the
 * backend performs its own Pydantic validation, so these are a
 * defense-in-depth layer on the client side.
 */

const HTML_TAG_RE = /<\/?[^>]+(>|$)/g;

/** Strip HTML tags from a string. */
export function stripHtml(value) {
  return value.replace(HTML_TAG_RE, '');
}

/** Trim and collapse internal whitespace runs. */
export function normalizeWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize a plain-text input value.
 * - Strips HTML tags
 * - Limits length (default 500)
 */
export function sanitizeText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return stripHtml(value).slice(0, maxLength);
}

/**
 * Sanitize a longer text area value (descriptions, questions).
 * Preserves newlines but strips HTML.
 */
export function sanitizeTextArea(value, maxLength = 2000) {
  if (typeof value !== 'string') return '';
  return stripHtml(value).slice(0, maxLength);
}
