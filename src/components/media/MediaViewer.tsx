import { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Image, Volume2, Video, Play, Pause } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import type { MediaInput } from '../../types/analysis';

interface MediaViewerProps {
  mediaInput: MediaInput;
  suspiciousRegions?: Array<{ x: number; y: number; width: number; height: number; label: string }>;
  suspiciousTimestamps?: Array<{ time: number; label: string }>;
}

export function MediaViewer({ mediaInput, suspiciousRegions = [], suspiciousTimestamps = [] }: MediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
      setPlaying(!playing);
    }
    if (audioRef.current) {
      if (playing) audioRef.current.pause();
      else audioRef.current.play();
      setPlaying(!playing);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mediaInput.type === 'image' && <Image className="h-4 w-4 text-cyan-400" />}
          {mediaInput.type === 'audio' && <Volume2 className="h-4 w-4 text-cyan-400" />}
          {mediaInput.type === 'video' && <Video className="h-4 w-4 text-cyan-400" />}
          <h3 className="text-sm font-bold text-white">Media Evidence Viewer</h3>
        </div>
        {mediaInput.type === 'image' && (
          <div className="flex items-center gap-1">
            <button onClick={handleZoomOut} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition-colors">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-xs font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition-colors">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={handleReset} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition-colors">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
        {(mediaInput.type === 'video' || mediaInput.type === 'audio') && (
          <button onClick={togglePlay} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      {/* Image viewer */}
      {mediaInput.type === 'image' && mediaInput.previewUrl && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <div className="relative overflow-auto max-h-96" style={{ cursor: zoom > 1 ? 'move' : 'default' }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}>
              <img
                src={mediaInput.previewUrl}
                alt={mediaInput.name}
                className="w-full h-auto block"
              />
              {/* Suspicious region overlays */}
              {suspiciousRegions.map((region, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-red-500 bg-red-500/10"
                  style={{
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    width: `${region.width}%`,
                    height: `${region.height}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white">
                    {region.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video viewer */}
      {mediaInput.type === 'video' && (
        <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
          {mediaInput.previewUrl || mediaInput.url ? (
            <video
              ref={videoRef}
              src={mediaInput.previewUrl || mediaInput.url}
              className="w-full rounded-xl"
              controls
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          ) : (
            <div className="flex h-48 items-center justify-center">
              <div className="text-center">
                <Video className="mx-auto mb-2 h-10 w-10 text-slate-600" />
                <p className="text-sm text-slate-500">Video preview not available</p>
                <p className="text-xs text-slate-600">{mediaInput.name}</p>
              </div>
            </div>
          )}
          {/* Suspicious timestamps */}
          {suspiciousTimestamps.length > 0 && (
            <div className="border-t border-white/8 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">Suspicious Timestamps</p>
              <div className="flex flex-wrap gap-2">
                {suspiciousTimestamps.map((ts, i) => (
                  <span key={i} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400">
                    {ts.time}s — {ts.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio viewer */}
      {mediaInput.type === 'audio' && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          {/* Simulated waveform */}
          <div className="mb-4 flex h-24 items-center gap-px overflow-hidden">
            {Array.from({ length: 120 }).map((_, i) => {
              const height = 20 + Math.sin(i * 0.3) * 20 + ((i * 17 + 7) % 30);
              const isSuspicious = suspiciousTimestamps.some((ts) => {
                const pct = (ts.time / 60) * 120;
                return Math.abs(i - pct) < 5;
              });
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${isSuspicious ? 'bg-red-500/70' : 'bg-cyan-500/50'}`}
                  style={{ height: `${Math.min(100, height)}%` }}
                />
              );
            })}
          </div>
          {mediaInput.file || mediaInput.url ? (
            <audio
              ref={audioRef}
              src={mediaInput.url}
              controls
              className="w-full"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          ) : null}
          <p className="mt-2 text-xs text-slate-500 text-center">
            {mediaInput.name} • {mediaInput.sizeMb > 0 ? `${mediaInput.sizeMb} MB` : 'Demo file'}
          </p>
          {suspiciousTimestamps.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suspiciousTimestamps.map((ts, i) => (
                <span key={i} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400">
                  {ts.time}s — {ts.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unknown type */}
      {mediaInput.type === 'unknown' && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-black/40">
          <p className="text-sm text-slate-500">Media preview not available for this file type.</p>
        </div>
      )}
    </GlassCard>
  );
}
