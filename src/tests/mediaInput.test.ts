// ─────────────────────────────────────────────
//  VeriLens AI — Media Input Module Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { parseFile, parseUrl, formatFileSize } from '../modules/mediaInput';

// ─── parseFile ────────────────────────────────

describe('parseFile', () => {
  it('detects image files correctly', () => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const input = parseFile(file);
    expect(input.type).toBe('image');
    expect(input.mimeType).toBe('image/jpeg');
    expect(input.name).toBe('photo.jpg');
    expect(input.isDemo).toBe(false);
  });

  it('detects audio files correctly', () => {
    const file = new File(['data'], 'sound.mp3', { type: 'audio/mpeg' });
    const input = parseFile(file);
    expect(input.type).toBe('audio');
  });

  it('detects video files correctly', () => {
    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    const input = parseFile(file);
    expect(input.type).toBe('video');
  });

  it('calculates file size in MB correctly', () => {
    const bytes = new Uint8Array(1024 * 1024); // 1 MB
    const file = new File([bytes], 'test.jpg', { type: 'image/jpeg' });
    const input = parseFile(file);
    expect(input.sizeMb).toBe(1.0);
  });

  it('generates a unique id for each call', () => {
    const file1 = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
    const input1 = parseFile(file1);
    const input2 = parseFile(file2);
    expect(input1.id).not.toBe(input2.id);
  });

  it('marks unknown MIME types as unknown', () => {
    const file = new File(['data'], 'document.pdf', { type: 'application/pdf' });
    const input = parseFile(file);
    expect(input.type).toBe('unknown');
  });
});

// ─── parseUrl ─────────────────────────────────

describe('parseUrl', () => {
  it('detects image URLs by extension', () => {
    const input = parseUrl('https://example.com/photo.jpg');
    expect(input.type).toBe('image');
    expect(input.previewUrl).toBe('https://example.com/photo.jpg');
  });

  it('detects audio URLs by extension', () => {
    const input = parseUrl('https://cdn.example.com/audio.mp3');
    expect(input.type).toBe('audio');
  });

  it('detects video URLs by extension', () => {
    const input = parseUrl('https://stream.example.com/video.mp4');
    expect(input.type).toBe('video');
  });

  it('extracts filename from URL path', () => {
    const input = parseUrl('https://example.com/media/my-image.png');
    expect(input.name).toBe('my-image.png');
  });

  it('defaults to unknown for unrecognised extensions', () => {
    const input = parseUrl('https://example.com/data.bin');
    expect(input.type).toBe('unknown');
  });

  it('marks as not demo', () => {
    const input = parseUrl('https://example.com/photo.jpg');
    expect(input.isDemo).toBe(false);
  });
});

// ─── formatFileSize ───────────────────────────

describe('formatFileSize', () => {
  it('formats kilobytes for small files', () => {
    expect(formatFileSize(0.05)).toContain('KB');
  });

  it('formats megabytes for normal files', () => {
    expect(formatFileSize(2.5)).toBe('2.5 MB');
  });

  it('formats gigabytes for large files', () => {
    expect(formatFileSize(1500)).toContain('GB');
  });

  it('formats exactly 1 MB correctly', () => {
    expect(formatFileSize(1.0)).toBe('1.0 MB');
  });
});
