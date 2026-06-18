/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { AppSkin, SkinComponentPreset, SkinDnaDimension } from './types';

export const INITIAL_PLACEHOLDERS = [
    "Create a mobile-friendly music platform icon with artistic flair",
    "Design a custom playback control button",
    "Make a stylish waveform progress bar",
    "Create a compact scrubber visual for a music player",
    "Design a small music app badge",
    "Make a plugin-style toggle tile",
    "Create a dark glass mini settings panel",
    "Design a decorative music UI effect"
];

export const AUDIO_PLAYER_PRESETS: SkinComponentPreset[] = [
  { id: 'freeform', label: 'Freeform', instruction: 'Freeform Component. Generate based directly on the user request.' },
  { id: 'custom_icon', label: 'Custom Icon', instruction: 'Make a small, clear icon-style component for a music app. It should work at mobile size.' },
  { id: 'mini_badge', label: 'Mini Badge', instruction: 'Make a small, highly legible mini badge or tag component suitable for metadata like BPM or Key.' },
  { id: 'player_button', label: 'Player Button', instruction: 'Make a prominent player control button (like Play, Pause, or Skip) with excellent tactile feedback.' },
  { id: 'scrubber_visual', label: 'Scrubber Visual', instruction: 'Make a progress/scrubber element for an audio player. Prioritize usability, touch targets, progress state, and visual rhythm.' },
  { id: 'waveform_visual', label: 'Waveform Visual', instruction: 'Make a waveform visualizer component representing audio playback or processing.' },
  { id: 'plugin_tile', label: 'Plugin Tile', instruction: 'Make a tile or card component representing a DAW plugin, instrument, or effect.' },
  { id: 'mini_settings', label: 'Mini Settings Panel', instruction: 'Make a compact, modular settings panel with small toggles and sliders.' },
  { id: 'decorative_effect', label: 'Decorative Effect', instruction: 'Make a purely decorative sonic visual effect or ambient background element.' }
];

export const AUDIO_PLAYER_DNA: SkinDnaDimension[] = [
  { key: 'theme', labelLeft: 'Dark', labelRight: 'Light', low: 'Dark', high: 'Light', defaultWeight: 50 },
  { key: 'complexity', labelLeft: 'Minimal', labelRight: 'Expressive', low: 'Minimal', high: 'Expressive', defaultWeight: 50 },
  { key: 'texture', labelLeft: 'Flat', labelRight: 'Glassy', low: 'Flat', high: 'Glassy', defaultWeight: 50 },
  { key: 'vibe', labelLeft: 'Clean', labelRight: 'Experimental', low: 'Clean', high: 'Experimental', defaultWeight: 50 },
  { key: 'edge', labelLeft: 'Soft', labelRight: 'Aggressive', low: 'Soft', high: 'Aggressive', defaultWeight: 50 },
  { key: 'era', labelLeft: 'Modern', labelRight: 'Retro', low: 'Modern', high: 'Retro', defaultWeight: 50 },
];

export const DEFAULT_AUDIO_PLAYER_SKIN: AppSkin = {
  id: 'audio-player',
  name: 'Audio Player Core',
  description: 'Design premium audio components and playback UI.',
  systemPromptInjection: 'You are an elite UX/UI engineer specialized in designing premium dark music-product interfaces. Keep styling moody with black, off-white, deep red, and electric blue accents unless instructed otherwise.',
  presets: AUDIO_PLAYER_PRESETS,
  dnaDimensions: AUDIO_PLAYER_DNA
};

export const PORTAL_DNA: SkinDnaDimension[] = [
  { key: 'immersion', labelLeft: 'Flat', labelRight: 'Deep', low: 'Flat', high: 'Deep', defaultWeight: 80 },
  { key: 'motion', labelLeft: 'Static', labelRight: 'Fluid', low: 'Static', high: 'Fluid', defaultWeight: 75 },
  { key: 'texture', labelLeft: 'Clean', labelRight: 'Grainy', low: 'Clean', high: 'Grainy', defaultWeight: 60 }
];

export const PORTAL_PRESETS: SkinComponentPreset[] = [
  { id: 'freeform', label: 'Freeform', instruction: 'Generate an immersive, ambient 3D-like webGL or heavy CSS portal UI based on the user request.' },
  { id: 'entry_gate', label: 'Entry Gate', instruction: 'Design a single focal-point entry gate, like an album cover portal.' }
];

export const ARC_NOTES_DNA: SkinDnaDimension[] = [
  { key: 'layout', labelLeft: 'Dense', labelRight: 'Spacious', low: 'Dense', high: 'Spacious', defaultWeight: 40 },
  { key: 'typography', labelLeft: 'Utilitarian', labelRight: 'Editorial', low: 'Utilitarian', high: 'Editorial', defaultWeight: 60 },
  { key: 'structure', labelLeft: 'Grid', labelRight: 'Freeform', low: 'Grid', high: 'Freeform', defaultWeight: 50 }
];

export const ARC_NOTES_PRESETS: SkinComponentPreset[] = [
  { id: 'freeform', label: 'Freeform', instruction: 'Design an editorial, structured Arc Notes text or documentation component.' },
  { id: 'text_block', label: 'Text Block', instruction: 'Design a beautifully structured text block for notes or lyrics.' }
];

export const APP_SKINS: AppSkin[] = [
  DEFAULT_AUDIO_PLAYER_SKIN,
  {
    id: 'portal',
    name: 'Portal',
    description: 'Immersive, ambient album worlds.',
    systemPromptInjection: 'You are an elite creative developer. You are no longer building standard UI controls. You are building an immersive, ambient entry portal. Prioritize 3D-like effects, ambient motion, atmospheric styling, and zero UI clutter.',
    presets: PORTAL_PRESETS,
    dnaDimensions: PORTAL_DNA
  },
  {
    id: 'arc-notes',
    name: 'Arc Notes',
    description: 'Editorial layouts for documentation and text.',
    systemPromptInjection: 'You are an elite editorial designer. Design for the Arc Notes skin. Prioritize pristine typography, structured reading layouts, subtle borders, and elegant use of whitespace. Build clean documentation or lyric viewing contexts.',
    presets: ARC_NOTES_PRESETS,
    dnaDimensions: ARC_NOTES_DNA
  }
];

// Fallbacks for existing imports while refactoring
export const COMPONENT_PRESETS = AUDIO_PLAYER_PRESETS;
export const DNA_DIMENSIONS = AUDIO_PLAYER_DNA;
