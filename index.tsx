/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, LayoutOption } from './types';
import { INITIAL_PLACEHOLDERS, COMPONENT_PRESETS } from './constants';
import { generateId } from './utils';
import { generateContent, generateContentStream, getSettings } from './ai';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import SettingsPanel from './components/SettingsPanel';
import { 
    SettingsIcon,
    ThinkingIcon, 
    CodeIcon, 
    SparklesIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    ArrowUpIcon, 
    GridIcon,
    DownloadIcon,
    MicIcon,
    MicOffIcon,
    SlidersIcon
} from './components/Icons';

const DNA_DIMENSIONS = [
  { key: 'theme', labelLeft: 'Dark', labelRight: 'Light', low: 'Dark', high: 'Light' },
  { key: 'complexity', labelLeft: 'Minimal', labelRight: 'Expressive', low: 'Minimal', high: 'Expressive' },
  { key: 'texture', labelLeft: 'Flat', labelRight: 'Glassy', low: 'Flat', high: 'Glassy' },
  { key: 'vibe', labelLeft: 'Clean', labelRight: 'Experimental', low: 'Clean', high: 'Experimental' },
  { key: 'edge', labelLeft: 'Soft', labelRight: 'Aggressive', low: 'Soft', high: 'Aggressive' },
  { key: 'era', labelLeft: 'Modern', labelRight: 'Retro', low: 'Modern', high: 'Retro' },
];

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
      mode: 'code' | 'variations' | 'export' | null;
      title: string;
      data: any; 
  }>({ isOpen: false, mode: null, title: '', data: null });

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(COMPONENT_PRESETS[0]);
  const [isDictating, setIsDictating] = useState(false);

  const [showStyleDna, setShowStyleDna] = useState(false);
  const [styleDna, setStyleDna] = useState<Record<string, number>>({
    theme: 50,
    complexity: 50,
    texture: 50,
    vibe: 50,
    edge: 50,
    era: 50
  });

  const getDnaPrompt = useCallback(() => {
    return DNA_DIMENSIONS.map(dim => {
        const val = styleDna[dim.key];
        if (val < 30) return dim.low;
        if (val > 70) return dim.high;
        return `Balanced ${dim.low}/${dim.high}`;
    }).join(', ');
  }, [styleDna]);

  const inputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef<string>('');

  useEffect(() => {
      inputRef.current?.focus();
      
      // Setup Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          
          recognitionRef.current.onresult = (event: any) => {
              let currentTranscript = '';
              for (let i = 0; i < event.results.length; ++i) {
                  currentTranscript += event.results[i][0].transcript;
              }
              setInputValue(originalInputRef.current + (originalInputRef.current ? ' ' : '') + currentTranscript);
          };

          recognitionRef.current.onerror = (event: any) => {
              console.error("Speech recognition error", event.error);
              setIsDictating(false);
          };

          recognitionRef.current.onend = () => {
              setIsDictating(false);
          };
      }
  }, []);

  const toggleDictation = () => {
      if (!recognitionRef.current) {
          alert('Speech recognition is not supported in this browser.');
          return;
      }
      
      if (isDictating) {
          recognitionRef.current.stop();
          setIsDictating(false);
      } else {
          // Store what they already typed so dictation appends to it
          originalInputRef.current = inputValue.trim();
          try {
              recognitionRef.current.start();
              setIsDictating(true);
          } catch (e) {
              console.warn("Could not start recognition (might be already started)", e);
          }
      }
  };

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
              const settings = getSettings();
              const response = await generateContent(
                  `Generate 20 creative, short, diverse UI component prompts for music apps (e.g. "granular synth oscillator", "analog delay toggle"). Return ONLY a raw JSON array of strings. IP SAFEGUARD: Avoid referencing specific famous artists, movies, or brands. Return ONLY the JSON raw array string.`,
                  settings
              );
              const text = response.text || '[]';
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

  const parseJsonStream = async function* (responseStream: AsyncGenerator<{ text: string }>) {
      let buffer = '';
      for await (const chunk of responseStream) {
          const text = chunk.text;
          if (typeof text !== 'string') continue;
          buffer += text;
          let braceCount = 0;
          let start = buffer.indexOf('{');
          while (start !== -1) {
              braceCount = 0;
              let end = -1;
              for (let i = start; i < buffer.length; i++) {
                  if (buffer[i] === '{') braceCount++;
                  else if (buffer[i] === '}') braceCount--;
                  if (braceCount === 0 && i > start) {
                      end = i;
                      break;
                  }
              }
              if (end !== -1) {
                  const jsonString = buffer.substring(start, end + 1);
                  try {
                      yield JSON.parse(jsonString);
                      buffer = buffer.substring(end + 1);
                      start = buffer.indexOf('{');
                  } catch (e) {
                      start = buffer.indexOf('{', start + 1);
                  }
              } else {
                  break; 
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
        const settings = getSettings();

        const prompt = `
You are SEA Workshop Light, a designer of modern music-product UI components and reusable interface pieces.
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${currentSession.prompt}".

**COMPONENT TYPE:** ${currentSession.componentType || 'Freeform Component'}

**STRICT IP SAFEGUARD:**
No names of artists. Instead, describe the *physical audio equipment* and *premium digital music product metaphors*.

**CREATIVE GUIDANCE (Use these as EXAMPLES of how to describe style, but INVENT YOUR OWN):**
1. Example: "Tactile Analogue Hardware" (Machined knobs, brushed metal textures, satisfying mechanical resistance, high-contrast indicators).
2. Example: "Minimalist Ambient Player" (Glassmorphism, blurred album-art blooms, deep void backgrounds, thin refined typography).
3. Example: "Studio Rack Equipment" (Utilitarian layout, glowing neon red LEDs, dense controls, matte black panels).
4. Example: "Modern DAW Interface" (High density, crisp vector edges, electric blue accents, modular layout).

**YOUR TASK:**
For EACH variation:
- Invent a unique design direction name based on a NEW music product metaphor.
- Rewrite the prompt to fully adopt that metaphor's visual language.
- Generate high-fidelity HTML/CSS reflecting premium dark music-product styling.
- Use black, off-white, deep red, and electric blue accents. Make controls touch-friendly and mobile-first.
- Create ONE focused component, not a full app screen unless requested.
- Make it useful for music players, music apps, audio tools, plugin systems, or artist platforms.
- Output self-contained HTML/CSS.

Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
        `.trim();

        const responseStream = await generateContentStream(prompt, settings);

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
  }, [sessions, currentSessionIndex, focusedArtifactIndex]);

  const applyVariation = (html: string) => {
      if (focusedArtifactIndex === null) return;
      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => {
                if (j === focusedArtifactIndex) {
                    const currentHistory = art.history || (art.html ? [{
                        html: art.html,
                        timestamp: Date.now() - 1000,
                        label: 'Initial Generation'
                    }] : []);
                    const newHistory = [...currentHistory, {
                        html,
                        timestamp: Date.now(),
                        label: 'Applied Variation'
                    }];
                    return { 
                        ...art, 
                        html, 
                        status: 'complete',
                        history: newHistory
                    };
                }
                return art;
              })
          } : sess
      ));
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleRevert = useCallback((artifactId: string, html: string) => {
      setSessions(prev => prev.map(sess => ({
          ...sess,
          artifacts: sess.artifacts.map(art => 
              art.id === artifactId ? { ...art, html } : art
          )
      })));
  }, []);

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'code', title: 'Source Code', data: artifact.html });
      }
  };

  const handleExport = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'export', title: 'Export Component', data: artifact });
      }
  };

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    const trimmedInput = promptToUse.trim();
    
    if (!trimmedInput || isLoading) return;
    
    // Stop dictation if running
    if (isDictating && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsDictating(false);
    }
    
    if (!manualPrompt) setInputValue('');

    setIsLoading(true);

    if (focusedArtifactIndex !== null && sessions[currentSessionIndex]) {
        // Iterate on specific artifact
        const sessionToEdit = sessions[currentSessionIndex];
        const artifactIndexToEdit = focusedArtifactIndex;
        const artifactToEdit = sessionToEdit.artifacts[artifactIndexToEdit];

        setSessions(prev => prev.map(s => s.id === sessionToEdit.id ? {
            ...s,
            artifacts: s.artifacts.map((art, i) => i === artifactIndexToEdit ? {
                ...art,
                status: 'streaming'
            } : art)
        } : s));

        try {
            const settings = getSettings();
            const editPrompt = `
You are SEA Workshop Light, an expert UI designer.
Your task is to modify the provided HTML/CSS component based on this request: "${trimmedInput}"

Current HTML:
\`\`\`html
${artifactToEdit.html}
\`\`\`

**RULES:**
1. Keep the same creative direction: ${artifactToEdit.styleName}
2. Apply the requested changes precisely.
3. Keep premium dark music-product styling. Use black, off-white, deep red, and electric blue accents unless instructed otherwise.
4. Output ONLY the new raw, self-contained HTML/CSS. No markdown fences. No explanation.
            `.trim();

            const responseStream = await generateContentStream(editPrompt, settings);
            
            let accumulatedHtml = '';
            for await (const chunk of responseStream) {
                const text = chunk.text;
                if (typeof text === 'string') {
                    accumulatedHtml += text;
                    setSessions(prev => prev.map(sess => 
                        sess.id === sessionToEdit.id ? {
                            ...sess,
                            artifacts: sess.artifacts.map((art, i) => 
                                i === artifactIndexToEdit ? { ...art, html: accumulatedHtml } : art
                            )
                        } : sess
                    ));
                }
            }
            
            let finalHtml = accumulatedHtml.trim();
            if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
            if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
            if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

            setSessions(prev => prev.map(sess => 
                sess.id === sessionToEdit.id ? {
                    ...sess,
                    artifacts: sess.artifacts.map((art, i) => 
                        i === artifactIndexToEdit ? { 
                            ...art, 
                            html: finalHtml, 
                            status: finalHtml ? 'complete' : 'error',
                            history: finalHtml ? [
                                ...(art.history || []),
                                {
                                    html: finalHtml,
                                    timestamp: Date.now(),
                                    label: trimmedInput
                                }
                            ] : (art.history || [])
                        } : art
                    )
                } : sess
            ));
        } catch (e: any) {
            console.error('Error editing artifact:', e);
            setSessions(prev => prev.map(sess => 
                sess.id === sessionToEdit.id ? {
                    ...sess,
                    artifacts: sess.artifacts.map((art, i) => 
                        i === artifactIndexToEdit ? { ...art, status: 'error' } : art
                    )
                } : sess
            ));
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }

        return; // Exit here if we iterated
    }

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
        componentType: selectedPreset.label,
        timestamp: baseTime,
        artifacts: placeholderArtifacts
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length); 
    setFocusedArtifactIndex(null); 

    try {
        const settings = getSettings();
        const dnaString = getDnaPrompt();
        const dnaContext = showStyleDna ? `\n**STYLE DNA (User Selected Aesthetics):**\n${dnaString}\n` : '';

        const stylePrompt = `
Generate 3 distinct, product-useful, and music-oriented design directions for a "${selectedPreset.label}" matching this description: "${trimmedInput}".
${dnaContext}
**STRICT IP SAFEGUARD:**
Never use artist or brand names. Use physical audio equipment and premium digital music product metaphors.

**CREATIVE EXAMPLES (Do not simply copy these, use them as a guide for tone):**
- Example A: "Tactile Analogue Hardware" (Machined knobs, brushed metal textures, satisfying mechanical resistance, high-contrast indicators).
- Example B: "Minimalist Ambient Player" (Glassmorphism, blurred album-art blooms, deep void backgrounds, thin refined typography).
- Example C: "Studio Rack Equipment" (Utilitarian layout, glowing neon red LEDs, dense controls, matte black panels).
- Example D: "Modern DAW Interface" (High density, crisp vector edges, electric blue accents, modular layout).

**GOAL:**
Return ONLY a raw JSON array of 3 *NEW*, creative UI style direction names for this component (e.g. ["Tactile Analogue Hardware", "Minimalist Ambient Player", "Modern DAW Interface"]).
        `.trim();

        const styleResponse = await generateContent(stylePrompt, settings);

        let generatedStyles: string[] = [];
        const styleText = styleResponse.text || '[]';
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
You are SEA Workshop Light, a designer of modern music-product UI components and reusable interface pieces.
Create a stunning, high-fidelity UI component for: "${trimmedInput}".

**COMPONENT TYPE:** ${selectedPreset.label}
**COMPONENT TYPE INSTRUCTIONS:** ${selectedPreset.instruction}
**CONCEPTUAL DIRECTION:** ${styleInstruction}
${dnaContext}
**VISUAL EXECUTION RULES:**
1. Create ONE focused component, not a full app screen unless requested.
2. Make it useful for music players, music apps, audio tools, plugin systems, or artist platforms.
3. Use premium dark music-product styling. Use black, off-white, deep red, and electric blue accents.
4. Make controls touch-friendly and mobile-first.
5. Avoid generic SaaS dashboard design. Avoid fake charts unless requested. Prefer reusable small interface pieces over full layouts.
6. For functional component types like scrubbers, toggles, and controls, output UI that looks usable and structurally reusable, not just decorative mockups.
7. Use the specified direction to drive CSS choices.
8. Output self-contained HTML/CSS. No markdown fences. No explanation.
          `.trim();
          
                const responseStream = await generateContentStream(prompt, settings);

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
                
                let finalHtml = accumulatedHtml.trim();
                if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
                if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
                if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { 
                                ...art, 
                                html: finalHtml, 
                                status: finalHtml ? 'complete' : 'error',
                                history: finalHtml ? [{
                                    html: finalHtml,
                                    timestamp: Date.now(),
                                    label: 'Initial Generation'
                                }] : []
                            } : art
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

    } catch (e) {
        console.error("Fatal error in generation process", e);
    } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputValue, isLoading, sessions.length, isDictating]);

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
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <button className="settings-button" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon />
        </button>

        <a href="https://x.com/ammaar" target="_blank" rel="noreferrer" className={`creator-credit ${hasStarted ? 'hide-on-mobile' : ''}`}>
            created by @ammaar
        </a>

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

            {drawerState.mode === 'export' && (
                <div className="export-options">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Generate production-ready code from this design variation.
                    </p>
                    <div className="export-card available">
                        <h3>Preview HTML</h3>
                        <p>Self-contained HTML, CSS, and JS. Good for iframe previews.</p>
                        <button onClick={() => {
                            const blob = new Blob([drawerState.data?.html || ''], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `component-${drawerState.data?.id}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}>Download HTML</button>
                    </div>
                    <div className="export-card future">
                        <h3>React Component <span>(Future)</span></h3>
                        <p>A structured React functional component. Converts the visual layout into clean DOM elements and maps interactive states to hooks.</p>
                        <button disabled>Coming Soon</button>
                    </div>
                    <div className="export-card future">
                        <h3>React + Tailwind <span>(Future)</span></h3>
                        <p>Fully typed React component with inline Tailwind classes for immediate use in modern codebases.</p>
                        <button disabled>Coming Soon</button>
                    </div>
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
                         <h1>SEA Workshop Light</h1>
                         <p>Creative music UI generation in a flash</p>
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
                                            onRevert={handleRevert}
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
                    <button onClick={handleExport}>
                        <DownloadIcon /> Export
                    </button>
                 </div>
            </div>

            <div className="floating-input-container">
                <div className="input-group">
                    {focusedArtifactIndex === null && (
                        <div className="preset-pills-container">
                            {COMPONENT_PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    className={`preset-pill ${selectedPreset.id === preset.id ? 'active' : ''}`}
                                    onClick={() => setSelectedPreset(preset)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            <button 
                                className={`preset-pill highlight ${showStyleDna ? 'active' : ''}`}
                                onClick={() => setShowStyleDna(!showStyleDna)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
                            >
                                <SlidersIcon /> Style DNA
                            </button>
                        </div>
                    )}
                    
                    {showStyleDna && (
                        <div className="dna-panel-container">
                            {DNA_DIMENSIONS.map(dim => (
                                <div key={dim.key} className="dna-slider-row">
                                    <span className="dna-label left">{dim.labelLeft}</span>
                                    <input 
                                        type="range"
                                        className="dna-slider"
                                        min="0" max="100" 
                                        value={styleDna[dim.key]} 
                                        onChange={(e) => setStyleDna({...styleDna, [dim.key]: parseInt(e.target.value)})}
                                    />
                                    <span className="dna-label right">{dim.labelRight}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={`input-wrapper ${isLoading ? 'loading' : ''}`}>
                        {(!inputValue && !isLoading) && (
                            <div className="animated-placeholder" key={placeholderIndex}>
                                <span className="placeholder-text">
                                    {focusedArtifactIndex !== null 
                                        ? "Edit this component..." 
                                        : placeholders[placeholderIndex]}
                                </span>
                                {focusedArtifactIndex === null && <span className="tab-hint">Tab</span>}
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
                        <button className={`send-button mic-button ${isDictating ? 'dictating' : ''}`} onClick={toggleDictation} disabled={isLoading} style={{ marginRight: '8px' }}>
                            {isDictating ? <MicOffIcon /> : <MicIcon />}
                        </button>
                        <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()}>
                            <ArrowUpIcon />
                        </button>
                    </div>
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