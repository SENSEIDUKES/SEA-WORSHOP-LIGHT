/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, LayoutOption } from './types';
import { INITIAL_PLACEHOLDERS, COMPONENT_PRESETS, DNA_DIMENSIONS } from './constants';
import { generateContent, getSettings } from './ai';
import { useGenerativeSessions } from './hooks/useGenerativeSessions';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SettingsPanel from './components/SettingsPanel';
import ActionDrawer from './components/ActionDrawer';
import ActionBar from './components/ActionBar';
import FloatingInput from './components/FloatingInput';
import { 
    SettingsIcon,
    SparklesIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon
} from './components/Icons';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
  
  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'export' | null;
      title: string;
      data: any; 
  }>({ isOpen: false, mode: null, title: '', data: null });

  const [isDualMode, setIsDualMode] = useState<boolean>(() => {
      return localStorage.getItem('sea_is_dual_mode') === 'true';
  });

  const toggleDualMode = () => {
      const newVal = !isDualMode;
      setIsDualMode(newVal);
      localStorage.setItem('sea_is_dual_mode', newVal.toString());
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(COMPONENT_PRESETS[0]);

  const [showStyleDna, setShowStyleDna] = useState(false);
  const [styleDna, setStyleDna] = useState<Record<string, number>>({
    theme: 50,
    complexity: 50,
    texture: 50,
    vibe: 50,
    edge: 50,
    era: 50
  });

  // Extract complex state and management into isolated custom hooks
  const {
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    setFocusedArtifactIndex,
    isLoading,
    componentVariations,
    handleSendMessage: runSendMessage,
    handleGenerateVariations: runGenerateVariations,
    applyVariation: runApplyVariation,
    handleRevert,
    nextItem,
    prevItem
  } = useGenerativeSessions();

  const {
    isDictating,
    toggleDictation,
    stopDictation
  } = useSpeechRecognition({ inputValue, setInputValue });

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

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

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

  const handleGenerateVariations = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];
    if (!currentArtifact) return;

    setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id });
    await runGenerateVariations();
  }, [sessions, currentSessionIndex, focusedArtifactIndex, runGenerateVariations]);

  const applyVariation = (html: string) => {
      runApplyVariation(html, () => {
          setDrawerState(s => ({ ...s, isOpen: false }));
      });
  };

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          if (artifact) setDrawerState({ isOpen: true, mode: 'code', title: 'Source Code', data: artifact.html });
      }
  };

  const handleExport = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          if (artifact) setDrawerState({ isOpen: true, mode: 'export', title: 'Export Component', data: artifact });
      }
  };

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    const trimmedInput = promptToUse.trim();
    
    if (!trimmedInput || isLoading) return;
    
    stopDictation();
    
    if (!manualPrompt) setInputValue('');

    const options = {
      componentType: selectedPreset.label,
      componentInstruction: selectedPreset.instruction,
      isDualMode,
      showStyleDna,
      styleDnaPrompt: getDnaPrompt()
    };

    await runSendMessage(trimmedInput, options, () => {
        setTimeout(() => inputRef.current?.focus(), 100);
    });
  }, [inputValue, isLoading, isDualMode, showStyleDna, getDnaPrompt, selectedPreset, runSendMessage, stopDictation]);

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
            Created by SEIHouse
        </a>

        <ActionDrawer 
            drawerState={drawerState}
            setDrawerState={setDrawerState}
            isLoadingDrawer={isLoadingDrawer}
            componentVariations={componentVariations}
            applyVariation={applyVariation}
        />

        <div className="immersive-app">
            <DottedGlowBackground 
                gap={32} 
                radius={1.2} 
                color="rgba(255, 255, 255, 0.01)" 
                glowColor="rgba(255, 255, 255, 0.03)" 
                speedScale={0.15} 
            />

            <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                 <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                     <div className="empty-content">
                         <h1>SEA Workshop Light</h1>
                         <p>Creative music UI generation in a flash</p>
                         <button className={`surprise-button ${isDualMode ? 'active' : ''}`} onClick={toggleDualMode} disabled={isLoading}>
                             <SparklesIcon /> {isDualMode ? "Dual Mode: ON" : "Dual Mode: OFF"}
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

            <ActionBar 
                focusedArtifactIndex={focusedArtifactIndex}
                currentSession={currentSession}
                isLoading={isLoading}
                setFocusedArtifactIndex={setFocusedArtifactIndex}
                handleGenerateVariations={handleGenerateVariations}
                handleShowCode={handleShowCode}
                handleExport={handleExport}
            />

            <FloatingInput
                focusedArtifactIndex={focusedArtifactIndex}
                selectedPreset={selectedPreset}
                setSelectedPreset={setSelectedPreset}
                showStyleDna={showStyleDna}
                setShowStyleDna={setShowStyleDna}
                styleDna={styleDna}
                setStyleDna={setStyleDna}
                isLoading={isLoading}
                inputValue={inputValue}
                placeholders={placeholders}
                placeholderIndex={placeholderIndex}
                inputRef={inputRef}
                handleInputChange={handleInputChange}
                handleKeyDown={handleKeyDown}
                currentSession={currentSession}
                isDictating={isDictating}
                toggleDictation={toggleDictation}
                handleSendMessage={handleSendMessage}
            />
        </div>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}