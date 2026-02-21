import { stripHtml, normalizeWhitespace, sanitizeText, sanitizeTextArea } from '../../lib/sanitize';

describe('stripHtml', () => {
  it('removes simple HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
  });

  it('removes nested tags', () => {
    expect(stripHtml('<div><span>hi</span></div>')).toBe('hi');
  });

  it('removes script tags (XSS prevention)', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('strips incomplete/malformed tags', () => {
    expect(stripHtml('text<br')).toBe('text');
  });
});

describe('normalizeWhitespace', () => {
  it('collapses multiple spaces into one', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
  });

  it('collapses tabs and newlines', () => {
    expect(normalizeWhitespace("hello\t\n\r  world")).toBe('hello world');
  });
});

describe('sanitizeText', () => {
  it('strips HTML and normalizes whitespace', () => {
    expect(sanitizeText('<b>hi</b>')).toBe('hi');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeText(123)).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('truncates to default maxLength of 500', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeText(long)).toHaveLength(500);
  });
});

describe('sanitizeTextArea', () => {
  it('strips HTML but preserves plain text', () => {
    expect(sanitizeTextArea('<p>paragraph</p>')).toBe('paragraph');
  });

  it('truncates to default maxLength of 2000', () => {
    const long = 'x'.repeat(2500);
    expect(sanitizeTextArea(long)).toHaveLength(2000);
  });
});
