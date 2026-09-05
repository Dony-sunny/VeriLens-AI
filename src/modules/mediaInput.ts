// ─────────────────────────────────────────────
//  VeriLens AI — Media Input Module
//  Parses file or URL into a MediaInput object.
// ─────────────────────────────────────────────

import type { MediaInput, MediaType } from '../types/analysis';

function detectMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'unknown';
}

function detectMediaTypeFromUrl(url: string): MediaType {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)/.test(lower)) return 'image';
  if (/\.(mp3|wav|ogg|flac|aac|m4a|wma)/.test(lower)) return 'audio';
  if (/\.(mp4|avi|mov|mkv|webm|flv|wmv|m4v)/.test(lower)) return 'video';
  return 'unknown';
}

export function parseFile(file: File): MediaInput {
  const id = `input-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const type = detectMediaType(file.type);
  const previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined;

  return {
    id,
    file,
    name: file.name,
    type,
    mimeType: file.type,
    sizeMb: parseFloat((file.size / 1024 / 1024).toFixed(2)),
    previewUrl,
    isDemo: false,
  };
}

export function parseUrl(url: string): MediaInput {
  const id = `input-url-${Date.now()}`;
  const type = detectMediaTypeFromUrl(url);
  const name = url.split('/').pop() || 'media';

  return {
    id,
    url,
    name,
    type,
    mimeType: '',
    sizeMb: 0,
    previewUrl: type === 'image' ? url : undefined,
    isDemo: false,
  };
}

export function formatFileSize(mb: number): string {
  if (mb < 0.1) return `${Math.round(mb * 1024)} KB`;
  if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export const ACCEPTED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/gif': 'GIF Image',
  'image/webp': 'WebP Image',
  'image/bmp': 'BMP Image',
  'audio/mpeg': 'MP3 Audio',
  'audio/wav': 'WAV Audio',
  'audio/ogg': 'OGG Audio',
  'audio/mp4': 'M4A Audio',
  'audio/flac': 'FLAC Audio',
  'video/mp4': 'MP4 Video',
  'video/avi': 'AVI Video',
  'video/quicktime': 'MOV Video',
  'video/webm': 'WebM Video',
  'video/x-matroska': 'MKV Video',
};
