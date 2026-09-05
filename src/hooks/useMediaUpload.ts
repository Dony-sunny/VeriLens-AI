// ─────────────────────────────────────────────
//  VeriLens AI — useMediaUpload Hook
//  With integrated security validation.
// ─────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import type { MediaInput } from '../types/analysis';
import { parseFile, parseUrl } from '../modules/mediaInput';
import { validateFile, sanitiseUrl, createSafeObjectUrl, revokeSafeObjectUrl } from '../utils/security';

interface UseMediaUploadReturn {
  mediaInput: MediaInput | null;
  isDragOver: boolean;
  urlInput: string;
  validationError: string | null;
  setUrlInput: (url: string) => void;
  handleFileSelect: (files: FileList | null) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: () => void;
  handleUrlSubmit: () => void;
  clearMedia: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const [mediaInput, setMediaInput] = useState<MediaInput | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track blob URL for cleanup
  const blobUrlRef = useRef<string | null>(null);

  /** Revoke any previously created blob URL to avoid memory leaks. */
  const revokeExistingBlobUrl = useCallback(() => {
    revokeSafeObjectUrl(blobUrlRef.current);
    blobUrlRef.current = null;
  }, []);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      setValidationError(null);
      if (!files || files.length === 0) return;

      const file = files[0];

      // Security: validate before processing
      const validation = validateFile(file);
      if (!validation.valid) {
        setValidationError(validation.error ?? 'Invalid file.');
        return;
      }

      revokeExistingBlobUrl();
      const input = parseFile(file);

      // Safely create preview URL
      if (input.type === 'image') {
        const blobUrl = createSafeObjectUrl(file);
        blobUrlRef.current = blobUrl;
        input.previewUrl = blobUrl ?? undefined;
      }

      setMediaInput(input);
      setUrlInput('');
    },
    [revokeExistingBlobUrl]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleUrlSubmit = useCallback(() => {
    setValidationError(null);
    if (!urlInput.trim()) return;

    // Security: sanitise URL before use
    const result = sanitiseUrl(urlInput.trim());
    if (!result.valid) {
      setValidationError(result.error ?? 'Invalid URL.');
      return;
    }

    const sanitised = result.sanitised!;
    revokeExistingBlobUrl();
    setMediaInput(parseUrl(sanitised));
  }, [urlInput, revokeExistingBlobUrl]);

  const clearMedia = useCallback(() => {
    revokeExistingBlobUrl();
    setMediaInput(null);
    setUrlInput('');
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [revokeExistingBlobUrl]);

  return {
    mediaInput,
    isDragOver,
    urlInput,
    validationError,
    setUrlInput,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleUrlSubmit,
    clearMedia,
    inputRef,
  };
}
