import { useRef, useId } from 'react';
import {
  Upload,
  Image,
  Volume2,
  Video,
  Link2,
  X,
  File,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../lib/utils';
import type { MediaInput, AnalysisStatus } from '../../types/analysis';
import { formatFileSize } from '../../modules/mediaInput';

const TYPE_ICONS = {
  image: Image,
  audio: Volume2,
  video: Video,
  unknown: File,
};

interface MediaUploaderProps {
  mediaInput: MediaInput | null;
  isDragOver: boolean;
  urlInput: string;
  analysisStatus: AnalysisStatus;
  analysisProgress: number;
  stepLabel: string;
  validationError?: string | null;
  onFileSelect: (files: FileList | null) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onUrlChange: (url: string) => void;
  onUrlSubmit: () => void;
  onClear: () => void;
  onAnalyze: () => void;
}

export function MediaUploader({
  mediaInput,
  isDragOver,
  urlInput,
  analysisStatus,
  analysisProgress,
  stepLabel,
  validationError,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onUrlChange,
  onUrlSubmit,
  onClear,
  onAnalyze,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlInputId = useId();
  const dropZoneId = useId();
  const progressId = useId();
  const errorId = useId();

  const isAnalyzing = ['uploading', 'detecting', 'extracting', 'explaining', 'verifying'].includes(analysisStatus);
  const TypeIcon = mediaInput ? TYPE_ICONS[mediaInput.type] : null;

  return (
    <GlassCard className="p-6">
      {/* Validation error */}
      {validationError && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {validationError}
        </div>
      )}

      {!mediaInput ? (
        <>
          {/* Drag-and-drop zone */}
          <div
            id={dropZoneId}
            role="button"
            tabIndex={0}
            aria-label="Drop media here or press Enter to browse files. Accepts images, audio and video."
            aria-describedby={validationError ? errorId : undefined}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
              isDragOver
                ? 'border-cyan-500/70 bg-cyan-500/8'
                : 'border-white/15 hover:border-cyan-500/40 hover:bg-white/3'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept="image/*,audio/*,video/*"
              aria-label="Choose a media file"
              onChange={(e) => onFileSelect(e.target.files)}
            />
            <div
              aria-hidden="true"
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors',
                isDragOver
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-slate-400'
              )}
            >
              <Upload className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white">
                {isDragOver ? 'Drop to analyze' : 'Drop media here'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                or <span className="text-cyan-400">click to browse</span>
              </p>
            </div>
            <div className="flex items-center gap-3" aria-label="Supported formats: Images, Audio, Video">
              {[
                { Icon: Image, label: 'Images' },
                { Icon: Volume2, label: 'Audio' },
                { Icon: Video, label: 'Video' },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400"
                >
                  <Icon className="h-3.5 w-3.5 text-cyan-500/70" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div className="mt-4">
            <label htmlFor={urlInputId} className="sr-only">
              Or paste a media URL
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-4 py-3 focus-within:border-cyan-500/40">
              <Link2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                id={urlInputId}
                type="url"
                placeholder="Or paste a media URL..."
                value={urlInput}
                onChange={(e) => onUrlChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onUrlSubmit()}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                autoComplete="url"
                spellCheck={false}
              />
              {urlInput && (
                <button
                  onClick={onUrlSubmit}
                  aria-label="Load media from URL"
                  className="rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-400 hover:bg-cyan-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  Load
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* File selected state */
        <div className="space-y-4">
          {/* File info */}
          <div
            className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/3 p-4"
            aria-label={`Selected file: ${mediaInput.name}`}
          >
            {mediaInput.previewUrl && mediaInput.type === 'image' ? (
              <img
                src={mediaInput.previewUrl}
                alt={`Preview of ${mediaInput.name}`}
                className="h-16 w-16 rounded-lg object-cover border border-white/10"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5"
                aria-hidden="true"
              >
                {TypeIcon && <TypeIcon className="h-7 w-7 text-cyan-400" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold text-white">{mediaInput.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="cyan">{mediaInput.type.toUpperCase()}</Badge>
                {mediaInput.sizeMb > 0 && (
                  <span className="text-xs text-slate-500">{formatFileSize(mediaInput.sizeMb)}</span>
                )}
                {mediaInput.mimeType && (
                  <span className="text-xs text-slate-600">{mediaInput.mimeType}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClear}
              disabled={isAnalyzing}
              aria-label="Remove selected file"
              className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Progress */}
          {isAnalyzing && (
            <div
              id={progressId}
              role="status"
              aria-label={`${stepLabel} — ${analysisProgress}% complete`}
              aria-live="polite"
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {stepLabel}
                </span>
                <span className="font-mono text-slate-400" aria-hidden="true">{analysisProgress}%</span>
              </div>
              <ProgressBar value={analysisProgress} color="cyan" />
            </div>
          )}

          {/* Analyze button */}
          {!isAnalyzing && analysisStatus !== 'complete' && (
            <button
              onClick={onAnalyze}
              aria-label={`Analyze ${mediaInput.name} for AI generation and manipulation`}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Analyze
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}
