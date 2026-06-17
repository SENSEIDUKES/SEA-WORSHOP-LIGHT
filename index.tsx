/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, ModelLabSettings, ModelProvider } from './types';
import { INITIAL_PLACEHOLDERS } from './constants';
import { generateId } from './utils';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import {
    ThinkingIcon,
    CodeIcon,
    SparklesIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    GridIcon
} from './components/Icons';


const MODEL_LAB_STORAGE_KEY = 'sea-workshop-light:model-lab-settings';

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
  lmstudio: 'Lm Studio',
};

const DEFAULT_MODEL_BY_PROVIDER: Record<ModelProvider, string> = {
  gemini: 'gemini-3-flash-preview',
  openrouter: 'openai/gpt-4o-mini',
  ollama: 'llama3.2',
  lmstudio: 'local-model',
};

const DEFAULT_MODEL_LAB_SETTINGS: ModelLabSettings = {
  provider: 'gemini',
  modelName: DEFAULT_MODEL_BY_PROVIDER.gemini,
  apiKey: '',
  temperature: 1.0,
};

const loadModelLabSettings = (): ModelLabSettings => {
  if (typeof window === 'undefined') return DEFAULT_MODEL_LAB_SETTINGS;
  try {
    const savedSettings = window.localStorage.getItem(MODEL_LAB_STORAGE_KEY);
    if (!savedSettings) return DEFAULT_MODEL_LAB_SETTINGS;
    const parsed = JSON.parse(savedSettings) as Partial<ModelLabSettings>;
    const provider = parsed.provider && parsed.provider in PROVIDER_LABELS ? parsed.provider : DEFAULT_MODEL_LAB_SETTINGS.provider;
    const temperature = typeof parsed.temperature === 'number' && Number.isFinite(parsed.temperature)
      ? parsed.temperature
      : DEFAULT_MODEL_LAB_SETTINGS.temperature;

    return {
      provider,
      modelName: parsed.modelName || DEFAULT_MODEL_BY_PROVIDER[provider],
      apiKey: parsed.apiKey || '',
      temperature,
    };
  } catch (error) {
    console.warn('Failed to load Model Lab settings', error);
    return DEFAULT_MODEL_LAB_SETTINGS;
  }
};

const saveModelLabSettings = (settings: ModelLabSettings) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MODEL_LAB_STORAGE_KEY, JSON.stringify(settings));
};

const getModelApiKey = (settings: ModelLabSettings) => settings.apiKey.trim();

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type GenerateTextOptions = {
  settings: ModelLabSettings;
  prompt: string;
};

const cleanMarkdownHtml = (html: string) => {
  let finalHtml = html.trim();
  if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
  if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
  if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();
  return finalHtml;
};

const getLocalProviderUrl = (provider: ModelProvider) => {
  if (provider === 'ollama') return 'http://localhost:11434/v1/chat/completions';
  if (provider === 'lmstudio') return 'http://localhost:1234/v1/chat/completions';
  return '';
};

const openAiCompatibleGenerateText = async ({ settings, prompt }: GenerateTextOptions, endpoint: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = getModelApiKey(settings);
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.modelName || DEFAULT_MODEL_BY_PROVIDER[settings.provider],
      messages: [{ role: 'user', content: prompt }] satisfies ChatMessage[],
      temperature: settings.temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${PROVIDER_LABELS[settings.provider]} request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new Error(`${PROVIDER_LABELS[settings.provider]} returned an empty response.`);
  return text;
};

const generateText = async ({ settings, prompt }: GenerateTextOptions) => {
  if (settings.provider === 'gemini') {
    const apiKey = getModelApiKey(settings);
    if (!apiKey) throw new Error('Gemini API key is not configured. Add one in Model Lab settings.');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: settings.modelName || DEFAULT_MODEL_BY_PROVIDER[settings.provider],
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: { temperature: settings.temperature },
    });
    return response.text || '';
  }

  if (settings.provider === 'openrouter') {
    const apiKey = getModelApiKey(settings);
    if (!apiKey) throw new Error('OpenRouter API key is not configured. Add one in Model Lab settings.');
    return openAiCompatibleGenerateText({ settings, prompt }, 'https://openrouter.ai/api/v1/chat/completions');
  }

  return openAiCompatibleGenerateText({ settings, prompt }, getLocalProviderUrl(settings.provider));
};

const generateTextStream = async function* ({ settings, prompt }: GenerateTextOptions): AsyncGenerator<{ text: string }> {
  if (settings.provider === 'gemini') {
    const apiKey = getModelApiKey(settings);
    if (!apiKey) throw new Error('Gemini API key is not configured. Add one in Model Lab settings.');
    const ai = new GoogleGenAI({ apiKey });
    const responseStream = await ai.models.generateContentStream({
      model: settings.modelName || DEFAULT_MODEL_BY_PROVIDER[settings.provider],
      contents: [{ parts: [{ text: prompt }], role: 'user' }],
      config: { temperature: settings.temperature },
    });

    for await (const chunk of responseStream) {
      yield { text: typeof chunk.text === 'string' ? chunk.text : '' };
    }
    return;
  }

  yield { text: await generateText({ settings, prompt }) };
};

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);

  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);

  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | null;
      title: string;
      data: any;
  }>({ isOpen: false, mode: null, title: '', data: null });

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
  const [modelLabSettings, setModelLabSettings] = useState<ModelLabSettings>(() => loadModelLabSettings());
  const [isModelLabOpen, setIsModelLabOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  useEffect(() => {
      saveModelLabSettings(modelLabSettings);
  }, [modelLabSettings]);

  // Fix for mobile: reset scroll when focusing an item to prevent "overscroll" state
  useEffect(() => {
    if (focusedArtifactIndex !== null && window.innerWidth <= 1024) {
        if (gridScrollRef.current) {
            gridScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }
  }, [focusedArtifactIndex]);

  // Cycle placeholders
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
  }, [placeholders.length]);

  // Dynamic placeholder generation on load
  useEffect(() => {
      const fetchDynamicPlaceholders = async () => {
          try {
              const text = await generateText({
                  settings: modelLabSettings,
                  prompt: 'Generate 20 creative, short, diverse UI component prompts (e.g. "bioluminescent task list"). Return ONLY a raw JSON array of strings. IP SAFEGUARD: Avoid referencing specific famous artists, movies, or brands.'
              }) || '[]';
              const jsonMatch = text.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                  const newPlaceholders = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(newPlaceholders) && newPlaceholders.length > 0) {
                      const shuffled = newPlaceholders.sort(() => 0.5 - Math.random()).slice(0, 10);
                      setPlaceholders(prev => [...prev, ...shuffled]);
                  }
              }
          } catch (e) {
              console.warn("Silently failed to fetch dynamic placeholders", e);
          }
      };
      setTimeout(fetchDynamicPlaceholders, 1000);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };


  const updateModelLabSettings = (updates: Partial<ModelLabSettings>) => {
    setModelLabSettings(prev => {
        const nextProvider = updates.provider || prev.provider;
        const shouldUseProviderDefault = Boolean(updates.provider) && prev.modelName === DEFAULT_MODEL_BY_PROVIDER[prev.provider];
        return {
            ...prev,
            ...updates,
            provider: nextProvider,
            modelName: updates.modelName ?? (shouldUseProviderDefault ? DEFAULT_MODEL_BY_PROVIDER[nextProvider] : prev.modelName),
        };
    });
  };

  const parseJsonStream = async function* (responseStream: AsyncGenerator<{ text: string }>) {
      let buffer = '';
      let objectStart = -1;
      let depth = 0;
      let inString = false;
      let isEscaped = false;

      for await (const chunk of responseStream) {
          const text = chunk.text;
          if (typeof text !== 'string') continue;
          buffer += text;

          for (let i = 0; i < buffer.length; i++) {
              const char = buffer[i];

              if (isEscaped) {
                  isEscaped = false;
                  continue;
              }

              if (char === '\\' && inString) {
                  isEscaped = true;
                  continue;
              }

              if (char === '"') {
                  inString = !inString;
                  continue;
              }

              if (inString) continue;

              if (char === '{') {
                  if (depth === 0) objectStart = i;
                  depth++;
              } else if (char === '}') {
                  depth--;

                  if (depth === 0 && objectStart !== -1) {
                      const jsonString = buffer.substring(objectStart, i + 1);
                      try {
                          yield JSON.parse(jsonString);
                      } catch (e) {
                          console.warn('Failed to parse streamed JSON object', e);
                      }

                      buffer = buffer.substring(i + 1);
                      i = -1;
                      objectStart = -1;
                  }
              }
          }
      }
  };

  const handleGenerateVariations = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setComponentVariations([]);
    setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id });

    try {
        const prompt = `
You are a master UI/UX designer. Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${currentSession.prompt}".

**STRICT IP SAFEGUARD:**
No names of artists.
Instead, describe the *Physicality* and *Material Logic* of the UI.

**CREATIVE GUIDANCE (Use these as EXAMPLES of how to describe style, but INVENT YOUR OWN):**
1. Example: "Asymmetrical Primary Grid" (Heavy black strokes, rectilinear structure, flat primary pigments, high-contrast white space).
2. Example: "Suspended Kinetic Mobile" (Delicate wire-thin connections, floating organic primary shapes, slow-motion balance, white-void background).
3. Example: "Grainy Risograph Press" (Overprinted translucent inks, dithered grain textures, monochromatic color depth, raw paper substrate).
4. Example: "Volumetric Spectral Fluid" (Generative morphing gradients, soft-focus diffusion, bioluminescent light sources, spectral chromatic aberration).

**YOUR TASK:**
For EACH variation:
- Invent a unique design persona name based on a NEW physical metaphor.
- Rewrite the prompt to fully adopt that metaphor's visual language.
- Generate high-fidelity HTML/CSS.

Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
        `.trim();

        const responseStream = generateTextStream({
            settings: modelLabSettings,
            prompt,
        });

        for await (const variation of parseJsonStream(responseStream)) {
            if (variation.name && variation.html) {
                setComponentVariations(prev => [...prev, variation]);
            }
        }
    } catch (e: any) {
        console.error("Error generating variations:", e);
    } finally {
        setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex, modelLabSettings]);

  const applyVariation = (html: string) => {
      if (focusedArtifactIndex === null) return;
      setSessions(prev => prev.map((sess, i) =>
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) =>
                j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art
              )
          } : sess
      ));
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'code', title: 'Source Code', data: artifact.html });
      }
  };

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    const trimmedInput = promptToUse.trim();

    if (!trimmedInput || isLoading) return;
    if (!manualPrompt) setInputValue('');

    setIsLoading(true);
    const baseTime = Date.now();
    const sessionId = generateId();

    const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
        id: `${sessionId}_${i}`,
        styleName: 'Designing...',
        html: '',
        status: 'streaming',
    }));

    const newSession: Session = {
        id: sessionId,
        prompt: trimmedInput,
        timestamp: baseTime,
        artifacts: placeholderArtifacts
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length);
    setFocusedArtifactIndex(null);

    try {
        const stylePrompt = `
Generate 3 distinct, highly evocative design directions for: "${trimmedInput}".

**STRICT IP SAFEGUARD:**
Never use artist or brand names. Use physical and material metaphors.

**CREATIVE EXAMPLES (Do not simply copy these, use them as a guide for tone):**
- Example A: "Asymmetrical Rectilinear Blockwork" (Grid-heavy, primary pigments, thick structural strokes, Bauhaus-functionalism vibe).
- Example B: "Grainy Risograph Layering" (Tactile paper texture, overprinted translucent inks, dithered gradients).
- Example C: "Kinetic Wireframe Suspension" (Floating silhouettes, thin balancing lines, organic primary shapes).
- Example D: "Spectral Prismatic Diffusion" (Glassmorphism, caustic refraction, soft-focus morphing gradients).

**GOAL:**
Return ONLY a raw JSON array of 3 *NEW*, creative names for these directions (e.g. ["Tactile Risograph Press", "Kinetic Silhouette Balance", "Primary Pigment Gridwork"]).
        `.trim();

        let generatedStyles: string[] = [];
        const styleText = await generateText({ settings: modelLabSettings, prompt: stylePrompt }) || '[]';
        const jsonMatch = styleText.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
            try {
                generatedStyles = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn("Failed to parse styles, using fallbacks");
            }
        }

        if (!generatedStyles || generatedStyles.length < 3) {
            generatedStyles = [
                "Primary Pigment Gridwork",
                "Tactile Risograph Layering",
                "Kinetic Silhouette Balance"
            ];
        }

        generatedStyles = generatedStyles.slice(0, 3);

        setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            return {
                ...s,
                artifacts: s.artifacts.map((art, i) => ({
                    ...art,
                    styleName: generatedStyles[i]
                }))
            };
        }));

        const generateArtifact = async (artifact: Artifact, styleInstruction: string) => {
            try {
                const prompt = `
You are Flash UI. Create a stunning, high-fidelity UI component for: "${trimmedInput}".

**CONCEPTUAL DIRECTION: ${styleInstruction}**

**VISUAL EXECUTION RULES:**
1. **Materiality**: Use the specified metaphor to drive every CSS choice. (e.g. if Risograph, use \`feTurbulence\` for grain and \`mix-blend-mode: multiply\` for ink layering).
2. **Typography**: Use high-quality web fonts. Pair a bold sans-serif with a refined monospace for data.
3. **Motion**: Include subtle, high-performance CSS/JS animations (hover transitions, entry reveals).
4. **IP SAFEGUARD**: No artist names or trademarks.
5. **Layout**: Be bold with negative space and hierarchy. Avoid generic cards.

Return ONLY RAW HTML. No markdown fences.
          `.trim();

                const responseStream = generateTextStream({ settings: modelLabSettings, prompt });

                let accumulatedHtml = '';
                for await (const chunk of responseStream) {
                    const text = chunk.text;
                    if (typeof text === 'string') {
                        accumulatedHtml += text;
                        setSessions(prev => prev.map(sess =>
                            sess.id === sessionId ? {
                                ...sess,
                                artifacts: sess.artifacts.map(art =>
                                    art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
                                )
                            } : sess
                        ));
                    }
                }

                let finalHtml = cleanMarkdownHtml(accumulatedHtml);

                setSessions(prev => prev.map(sess =>
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art =>
                            art.id === artifact.id ? { ...art, html: finalHtml, status: finalHtml ? 'complete' : 'error' } : art
                        )
                    } : sess
                ));

            } catch (e: any) {
                console.error('Error generating artifact:', e);
                setSessions(prev => prev.map(sess =>
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art =>
                            art.id === artifact.id ? { ...art, html: `<div style="color: #ff6b6b; padding: 20px;">Error: ${e.message}</div>`, status: 'error' } : art
                        )
                    } : sess
                ));
            }
        };

        await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));

    } catch (e: any) {
        console.error("Fatal error in generation process", e);
        setSessions(prev => prev.map(sess =>
            sess.id === sessionId ? {
                ...sess,
                artifacts: sess.artifacts.map(art => ({
                    ...art,
                    html: `<div style="color: #ff6b6b; padding: 20px;">Error: ${e.message || 'Generation failed'}</div>`,
                    status: 'error'
                }))
            } : sess
        ));
    } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputValue, isLoading, sessions.length, modelLabSettings]);

  const handleSurpriseMe = () => {
      const currentPrompt = placeholders[placeholderIndex];
      setInputValue(currentPrompt);
      handleSendMessage(currentPrompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === 'Tab' && !inputValue && !isLoading) {
        event.preventDefault();
        setInputValue(placeholders[placeholderIndex]);
    }
  };

  const nextItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex < 2) setFocusedArtifactIndex(focusedArtifactIndex + 1);
      } else {
          if (currentSessionIndex < sessions.length - 1) setCurrentSessionIndex(currentSessionIndex + 1);
      }
  }, [currentSessionIndex, sessions.length, focusedArtifactIndex]);

  const prevItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
      } else {
           if (currentSessionIndex > 0) setCurrentSessionIndex(currentSessionIndex - 1);
      }
  }, [currentSessionIndex, focusedArtifactIndex]);

  const isLoadingDrawer = isLoading && drawerState.mode === 'variations' && componentVariations.length === 0;

  const hasStarted = sessions.length > 0 || isLoading;
  const currentSession = sessions[currentSessionIndex];

  let canGoBack = false;
  let canGoForward = false;

  if (hasStarted) {
      if (focusedArtifactIndex !== null) {
          canGoBack = focusedArtifactIndex > 0;
          canGoForward = focusedArtifactIndex < (currentSession?.artifacts.length || 0) - 1;
      } else {
          canGoBack = currentSessionIndex > 0;
          canGoForward = currentSessionIndex < sessions.length - 1;
      }
  }

  return (
    <>
        <a href="https://x.com/ammaar" target="_blank" rel="noreferrer" className={`creator-credit ${hasStarted ? 'hide-on-mobile' : ''}`}>
            created by @ammaar
        </a>


        <button className="model-lab-trigger" onClick={() => setIsModelLabOpen(true)} aria-label="Open Model Lab settings">
            <span>Model Lab</span>
            <strong>{PROVIDER_LABELS[modelLabSettings.provider]}</strong>
        </button>

        <SideDrawer
            isOpen={isModelLabOpen}
            onClose={() => setIsModelLabOpen(false)}
            title="Model Lab"
        >
            <div className="model-lab-panel">
                <p className="model-lab-description">
                    Choose the provider and model used for style directions, artifact HTML, and variations. Settings are saved only in this browser.
                </p>

                <label className="settings-field">
                    <span>Provider</span>
                    <select
                        value={modelLabSettings.provider}
                        onChange={(event) => updateModelLabSettings({ provider: event.target.value as ModelProvider })}
                    >
                        {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>

                <label className="settings-field">
                    <span>Model name</span>
                    <input
                        type="text"
                        value={modelLabSettings.modelName}
                        onChange={(event) => updateModelLabSettings({ modelName: event.target.value })}
                        placeholder={DEFAULT_MODEL_BY_PROVIDER[modelLabSettings.provider]}
                    />
                </label>

                <label className="settings-field">
                    <span>API key</span>
                    <input
                        type="password"
                        value={modelLabSettings.apiKey}
                        onChange={(event) => updateModelLabSettings({ apiKey: event.target.value })}
                        placeholder={modelLabSettings.provider === 'gemini' || modelLabSettings.provider === 'openrouter' ? 'Paste API key' : 'Optional for local providers'}
                        autoComplete="off"
                    />
                </label>

                <label className="settings-field">
                    <span>Temperature</span>
                    <div className="temperature-row">
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={modelLabSettings.temperature}
                            onChange={(event) => updateModelLabSettings({ temperature: Number(event.target.value) })}
                        />
                        <input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={modelLabSettings.temperature}
                            onChange={(event) => updateModelLabSettings({ temperature: Number(event.target.value) })}
                        />
                    </div>
                </label>

                {(modelLabSettings.provider === 'ollama' || modelLabSettings.provider === 'lmstudio') && (
                    <div className="settings-note">
                        Uses the local OpenAI-compatible endpoint at {getLocalProviderUrl(modelLabSettings.provider)}.
                    </div>
                )}
                {modelLabSettings.provider === 'openrouter' && (
                    <div className="settings-note">
                        OpenRouter uses https://openrouter.ai/api/v1/chat/completions with your selected model string.
                    </div>
                )}
            </div>
        </SideDrawer>

        <SideDrawer
            isOpen={drawerState.isOpen}
            onClose={() => setDrawerState(s => ({...s, isOpen: false}))}
            title={drawerState.title}
        >
            {isLoadingDrawer && (
                 <div className="loading-state">
                     <ThinkingIcon />
                     Designing variations...
                 </div>
            )}

            {drawerState.mode === 'code' && (
                <pre className="code-block"><code>{drawerState.data}</code></pre>
            )}

            {drawerState.mode === 'variations' && (
                <div className="sexy-grid">
                    {componentVariations.map((v, i) => (
                         <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                             <div className="sexy-preview">
                                 <iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts allow-same-origin" />
                             </div>
                             <div className="sexy-label">{v.name}</div>
                         </div>
                    ))}
                </div>
            )}
        </SideDrawer>

        <div className="immersive-app">
            <DottedGlowBackground
                gap={24}
                radius={1.5}
                color="rgba(255, 255, 255, 0.02)"
                glowColor="rgba(255, 255, 255, 0.15)"
                speedScale={0.5}
            />

            <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                 <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                     <div className="empty-content">
                         <h1>Flash UI</h1>
                         <p>Creative UI generation in a flash</p>
                         <button className="surprise-button" onClick={handleSurpriseMe} disabled={isLoading}>
                             <SparklesIcon /> Surprise Me
                         </button>
                     </div>
                 </div>

                {sessions.map((session, sIndex) => {
                    let positionClass = 'hidden';
                    if (sIndex === currentSessionIndex) positionClass = 'active-session';
                    else if (sIndex < currentSessionIndex) positionClass = 'past-session';
                    else if (sIndex > currentSessionIndex) positionClass = 'future-session';

                    return (
                        <div key={session.id} className={`session-group ${positionClass}`}>
                            <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {session.artifacts.map((artifact, aIndex) => {
                                    const isFocused = focusedArtifactIndex === aIndex;

                                    return (
                                        <ArtifactCard
                                            key={artifact.id}
                                            artifact={artifact}
                                            isFocused={isFocused}
                                            onClick={() => setFocusedArtifactIndex(aIndex)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

             {canGoBack && (
                <button className="nav-handle left" onClick={prevItem} aria-label="Previous">
                    <ArrowLeftIcon />
                </button>
             )}
             {canGoForward && (
                <button className="nav-handle right" onClick={nextItem} aria-label="Next">
                    <ArrowRightIcon />
                </button>
             )}

            <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                 <div className="active-prompt-label">
                    {currentSession?.prompt}
                 </div>
                 <div className="action-buttons">
                    <button onClick={() => setFocusedArtifactIndex(null)}>
                        <GridIcon /> Grid View
                    </button>
                    <button onClick={handleGenerateVariations} disabled={isLoading}>
                        <SparklesIcon /> Variations
                    </button>
                    <button onClick={handleShowCode}>
                        <CodeIcon /> Source
                    </button>
                 </div>
            </div>

            <div className="floating-input-container">
                <div className={`input-wrapper ${isLoading ? 'loading' : ''}`}>
                    {(!inputValue && !isLoading) && (
                        <div className="animated-placeholder" key={placeholderIndex}>
                            <span className="placeholder-text">{placeholders[placeholderIndex]}</span>
                            <span className="tab-hint">Tab</span>
                        </div>
                    )}
                    {!isLoading ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                    ) : (
                        <div className="input-generating-label">
                            <span className="generating-prompt-text">{currentSession?.prompt}</span>
                            <ThinkingIcon />
                        </div>
                    )}
                    <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()}>
                        <ArrowUpIcon />
                    </button>
                </div>
            </div>
        </div>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
