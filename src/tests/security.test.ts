// ─────────────────────────────────────────────
//  VeriLens AI — Security Utils Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  validateFile,
  sanitiseUrl,
  sanitiseString,
  MAX_FILE_SIZE_MB,
} from '../utils/security';

// ─── validateFile ─────────────────────────────

describe('validateFile', () => {
  it('accepts valid image files', () => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateFile(file).valid).toBe(true);
  });

  it('accepts valid audio files', () => {
    const file = new File(['data'], 'clip.mp3', { type: 'audio/mpeg' });
    expect(validateFile(file).valid).toBe(true);
  });

  it('accepts valid video files', () => {
    const file = new File(['data'], 'video.mp4', { type: 'video/mp4' });
    expect(validateFile(file).valid).toBe(true);
  });

  it('rejects unsupported MIME types', () => {
    const file = new File(['exec'], 'malware.exe', { type: 'application/octet-stream' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported file type');
  });

  it('rejects oversized files', () => {
    // Create a mock File with a large size
    const bytes = new Uint8Array((MAX_FILE_SIZE_MB + 1) * 1024 * 1024);
    const file = new File([bytes], 'huge.jpg', { type: 'image/jpeg' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('rejects empty files', () => {
    const file = new File([], 'empty.png', { type: 'image/png' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('rejects text/html MIME type', () => {
    const file = new File(['<html></html>'], 'page.html', { type: 'text/html' });
    expect(validateFile(file).valid).toBe(false);
  });
});

// ─── sanitiseUrl ──────────────────────────────

describe('sanitiseUrl', () => {
  it('accepts valid https URLs', () => {
    const result = sanitiseUrl('https://example.com/image.jpg');
    expect(result.valid).toBe(true);
    expect(result.sanitised).toContain('https://example.com');
  });

  it('accepts valid http URLs', () => {
    const result = sanitiseUrl('http://cdn.example.org/photo.png');
    expect(result.valid).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    const result = sanitiseUrl('javascript:alert(1)');
    expect(result.valid).toBe(false);
  });

  it('rejects data: URLs', () => {
    const result = sanitiseUrl('data:text/html,<script>alert(1)</script>');
    expect(result.valid).toBe(false);
  });

  it('rejects localhost URLs', () => {
    const result = sanitiseUrl('http://localhost:3000/secret');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('private');
  });

  it('rejects 127.x.x.x URLs', () => {
    expect(sanitiseUrl('http://127.0.0.1/admin').valid).toBe(false);
  });

  it('rejects 192.168.x.x URLs', () => {
    expect(sanitiseUrl('http://192.168.1.1/data').valid).toBe(false);
  });

  it('rejects 10.x.x.x URLs', () => {
    expect(sanitiseUrl('http://10.0.0.1/internal').valid).toBe(false);
  });

  it('rejects 172.16-31.x.x URLs', () => {
    expect(sanitiseUrl('http://172.16.0.1/admin').valid).toBe(false);
  });

  it('rejects 169.254.x.x link-local & cloud metadata URLs (169.254.169.254)', () => {
    expect(sanitiseUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);
  });

  it('rejects 0.0.0.0 URLs', () => {
    expect(sanitiseUrl('http://0.0.0.0/').valid).toBe(false);
  });

  it('rejects internal and local domain suffixes', () => {
    expect(sanitiseUrl('http://server.internal/api').valid).toBe(false);
    expect(sanitiseUrl('http://device.local/status').valid).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(sanitiseUrl('').valid).toBe(false);
  });

  it('rejects URLs exceeding max length', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2050);
    expect(sanitiseUrl(longUrl).valid).toBe(false);
  });

  it('strips fragment identifiers', () => {
    const result = sanitiseUrl('https://example.com/image.jpg#hack');
    expect(result.valid).toBe(true);
    expect(result.sanitised).not.toContain('#hack');
  });

  it('rejects malformed URLs', () => {
    expect(sanitiseUrl('not-a-url').valid).toBe(false);
    expect(sanitiseUrl('://broken').valid).toBe(false);
  });
});

// ─── sanitiseString ───────────────────────────

describe('sanitiseString', () => {
  it('escapes HTML special characters', () => {
    const result = sanitiseString('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes & characters', () => {
    expect(sanitiseString('a & b')).toContain('&amp;');
  });

  it('escapes double quotes', () => {
    expect(sanitiseString('"hello"')).toContain('&quot;');
  });

  it('escapes single quotes', () => {
    expect(sanitiseString("it's fine")).toContain('&#x27;');
  });

  it('truncates strings exceeding maxLength', () => {
    const long = 'a'.repeat(1000);
    expect(sanitiseString(long, 100).length).toBe(100);
  });

  it('passes safe strings through unchanged', () => {
    expect(sanitiseString('Hello, world! 123')).toBe('Hello, world! 123');
  });
});
