/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type OutputMode = 'html' | 'react' | 'react-tailwind';

export interface AppSkin {
  id: string;
  name: string;
  description: string;
  systemPromptInjection: string;
  presets: SkinComponentPreset[];
  dnaDimensions: SkinDnaDimension[];
}

export interface SkinComponentPreset {
  id: string;
  label: string;
  instruction: string;
}

export interface SkinDnaDimension {
  key: string;
  labelLeft: string;
  labelRight: string;
  low: string;
  high: string;
  defaultWeight: number;
}


export interface ComponentPropsContract {
  name: string;
  type: string; // e.g., 'string', 'number', 'boolean', 'function'
  description?: string;
  defaultValue?: string;
}

export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  reactCode?: string; // Future React export
  reactTailwindCode?: string; // Future React + Tailwind export
  propsContract?: ComponentPropsContract[]; // Future props contract for functional components
  outputMode?: OutputMode; // Currently defaults to 'html'
  status: 'streaming' | 'complete' | 'error';
  history?: Array<{
    html: string;
    timestamp: number;
    label: string;
  }>;
}

export interface Session {
    id: string;
    prompt: string;
    referenceImage?: string; // data URI format
    componentType?: string;
    timestamp: number;
    artifacts: Artifact[];
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }

export type Provider = 'gemini' | 'openrouter' | 'ollama' | 'lmstudio';

export interface ModelSettings {
  provider: Provider;
  model: string;
  apiKey: string;
  temperature: number;
  baseUrl?: string;
}