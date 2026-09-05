// ─────────────────────────────────────────────
//  VeriLens AI — Signal Definitions
// ─────────────────────────────────────────────

export interface SignalDefinition {
  id: string;
  category: string;
  label: string;
  mediaTypes: ('image' | 'video' | 'audio')[];
  description: string;
}

export const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  // ─── Image Signals ──────────────────────────
  {
    id: 'visual_artifacts',
    category: 'AI Generation Signals',
    label: 'Visual Artifacts',
    mediaTypes: ['image'],
    description: 'Unnatural pixel-level patterns inconsistent with real camera capture.',
  },
  {
    id: 'lighting_inconsistencies',
    category: 'AI Generation Signals',
    label: 'Lighting Inconsistencies',
    mediaTypes: ['image'],
    description: 'Lighting direction or intensity does not match across subjects and backgrounds.',
  },
  {
    id: 'facial_anomalies',
    category: 'AI Generation Signals',
    label: 'Facial Anomalies',
    mediaTypes: ['image', 'video'],
    description: 'Unnatural symmetry, blending, or artifacts around facial regions.',
  },
  {
    id: 'texture_inconsistencies',
    category: 'AI Generation Signals',
    label: 'Texture Inconsistencies',
    mediaTypes: ['image'],
    description: 'Skin or surface textures that are too uniform or smooth for real-world capture.',
  },
  {
    id: 'compression_patterns',
    category: 'AI Generation Signals',
    label: 'Compression Patterns',
    mediaTypes: ['image'],
    description: 'DCT block artifacts and compression fingerprints inconsistent with the claimed source.',
  },
  {
    id: 'metadata_anomalies',
    category: 'AI Generation Signals',
    label: 'Metadata Anomalies',
    mediaTypes: ['image', 'video', 'audio'],
    description: 'EXIF/metadata missing, stripped, or containing conflicting creation timestamps.',
  },
  // ─── Video Signals ──────────────────────────
  {
    id: 'frame_inconsistencies',
    category: 'Video Forensics',
    label: 'Frame Inconsistencies',
    mediaTypes: ['video'],
    description: 'Detected frames that differ statistically from the expected video stream.',
  },
  {
    id: 'face_voice_sync',
    category: 'Video Forensics',
    label: 'Face/Voice Synchronization',
    mediaTypes: ['video'],
    description: 'Lip movements do not consistently align with the audio waveform.',
  },
  {
    id: 'temporal_artifacts',
    category: 'Video Forensics',
    label: 'Temporal Artifacts',
    mediaTypes: ['video'],
    description: 'Unnatural motion blur, ghosting, or temporal inconsistencies between frames.',
  },
  {
    id: 'scene_transitions',
    category: 'Video Forensics',
    label: 'Scene Transitions',
    mediaTypes: ['video'],
    description: 'Abrupt or unnatural cut patterns that may indicate video splicing.',
  },
  // ─── Audio Signals ──────────────────────────
  {
    id: 'voice_synthesis',
    category: 'Audio Forensics',
    label: 'Voice Synthesis Indicators',
    mediaTypes: ['audio'],
    description: 'Spectral patterns consistent with neural TTS or voice cloning models.',
  },
  {
    id: 'spectral_anomalies',
    category: 'Audio Forensics',
    label: 'Spectral Anomalies',
    mediaTypes: ['audio'],
    description: 'Frequency components that fall outside normal human vocal range patterns.',
  },
  {
    id: 'unnatural_prosody',
    category: 'Audio Forensics',
    label: 'Unnatural Prosody',
    mediaTypes: ['audio'],
    description: 'Pitch, rhythm, and stress patterns atypical for natural human speech.',
  },
  {
    id: 'background_inconsistencies',
    category: 'Audio Forensics',
    label: 'Background Inconsistencies',
    mediaTypes: ['audio'],
    description: 'Background noise floor changes abruptly or is suspiciously absent.',
  },
];
