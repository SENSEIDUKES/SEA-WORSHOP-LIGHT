/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

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

export const COMPONENT_PRESETS = [
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

export const DNA_DIMENSIONS = [
  { key: 'theme', labelLeft: 'Dark', labelRight: 'Light', low: 'Dark', high: 'Light' },
  { key: 'complexity', labelLeft: 'Minimal', labelRight: 'Expressive', low: 'Minimal', high: 'Expressive' },
  { key: 'texture', labelLeft: 'Flat', labelRight: 'Glassy', low: 'Flat', high: 'Glassy' },
  { key: 'vibe', labelLeft: 'Clean', labelRight: 'Experimental', low: 'Clean', high: 'Experimental' },
  { key: 'edge', labelLeft: 'Soft', labelRight: 'Aggressive', low: 'Soft', high: 'Aggressive' },
  { key: 'era', labelLeft: 'Modern', labelRight: 'Retro', low: 'Modern', high: 'Retro' },
];
