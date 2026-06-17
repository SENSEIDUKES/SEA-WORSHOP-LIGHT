import { useState, useCallback } from 'react';
import { Artifact, Session, ComponentVariation, ModelSettings } from '../types';
import { generateId } from '../utils';
import { generateContent, generateContentStream, getSettings, getSettingsB } from '../ai';
import { getEditPrompt, getStylePrompt, getGenerateArtifactPrompt, getGenerateVariationsPrompt } from '../prompts';

export interface GenerateOptions {
  componentType: string;
  componentInstruction: string;
  isDualMode: boolean;
  showStyleDna: boolean;
  styleDnaPrompt: string;
}

export function useGenerativeSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);

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

  const handleSendMessage = useCallback(async (
    prompt: string,
    options: GenerateOptions,
    onComplete?: () => void
  ) => {
    const trimmedInput = prompt.trim();
    if (!trimmedInput || isLoading) return;

    setIsLoading(true);

    if (focusedArtifactIndex !== null && sessions[currentSessionIndex]) {
      // Iterate on specific artifact
      const sessionToEdit = sessions[currentSessionIndex];
      const artifactIndexToEdit = focusedArtifactIndex;
      const artifactToEdit = sessionToEdit.artifacts[artifactIndexToEdit];

      if (!artifactToEdit) {
        setIsLoading(false);
        return;
      }

      setSessions(prev => prev.map(s => s.id === sessionToEdit.id ? {
        ...s,
        artifacts: s.artifacts.map((art, i) => i === artifactIndexToEdit ? {
          ...art,
          status: 'streaming' as const
        } : art)
      } : s));

      try {
        const settings = getSettings();
        const editPrompt = getEditPrompt(trimmedInput, artifactToEdit.html, artifactToEdit.styleName);

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
                status: (finalHtml ? 'complete' : 'error') as 'complete' | 'error',
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
              i === artifactIndexToEdit ? { ...art, status: 'error' as const } : art
            )
          } : sess
        ));
      } finally {
        setIsLoading(false);
        if (onComplete) onComplete();
      }

      return; // Exit here if we iterated
    }

    const baseTime = Date.now();
    const sessionId = generateId();

    const placeholderArtifacts: Artifact[] = Array(options.isDualMode ? 2 : 3).fill(null).map((_, i) => ({
      id: `${sessionId}_${i}`,
      styleName: 'Designing...',
      html: '',
      status: 'streaming' as const,
    }));

    const newSession: Session = {
      id: sessionId,
      prompt: trimmedInput,
      componentType: options.componentType,
      timestamp: baseTime,
      artifacts: placeholderArtifacts
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length);
    setFocusedArtifactIndex(null);

    try {
      const settings = getSettings();
      const dnaContext = options.showStyleDna ? `\n**STYLE DNA (User Selected Aesthetics):**\n${options.styleDnaPrompt}\n` : '';

      const stylePrompt = getStylePrompt(trimmedInput, options.componentType, dnaContext);

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

      if (!generatedStyles || !Array.isArray(generatedStyles) || generatedStyles.length < (options.isDualMode ? 2 : 3)) {
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
            styleName: options.isDualMode
              ? (i === 0 ? getSettings().model : getSettingsB().model)
              : generatedStyles[i]
          }))
        };
      }));

      const generateArtifact = async (artifact: Artifact, styleInstruction: string, activeSettings: ModelSettings) => {
        try {
          const prompt = getGenerateArtifactPrompt(
            trimmedInput,
            options.componentType,
            options.componentInstruction,
            styleInstruction,
            dnaContext
          );

          const responseStream = await generateContentStream(prompt, activeSettings);

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
                  status: (finalHtml ? 'complete' : 'error') as 'complete' | 'error',
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
                art.id === artifact.id ? { ...art, html: `<div style="color: #ff6b6b; padding: 20px;">Error: ${e.message}</div>`, status: 'error' as const } : art
              )
            } : sess
          ));
        }
      };

      await Promise.all(placeholderArtifacts.map((art, i) => {
        const activeSettings = (options.isDualMode && i === 1) ? getSettingsB() : settings;
        const styleInst = options.isDualMode ? generatedStyles[0] : generatedStyles[i];
        return generateArtifact(art, styleInst, activeSettings);
      }));

    } catch (e: any) {
      console.error("Fatal error in generation process", e);
      setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          artifacts: s.artifacts.map(art => ({
            ...art,
            status: 'error' as const,
            html: `<div style="color: #ff6b6b; padding: 20px;">Fatal Initial Error: ${e.message}</div>`
          }))
        };
      }));
    } finally {
      setIsLoading(false);
      if (onComplete) onComplete();
    }
  }, [isLoading, sessions.length, currentSessionIndex, focusedArtifactIndex]);

  const handleGenerateVariations = useCallback(async (onStart?: (artifactId: string) => void) => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];
    if (!currentArtifact) return;

    setIsLoading(true);
    setComponentVariations([]);

    if (onStart) {
      onStart(currentArtifact.id);
    }

    try {
      const settings = getSettings();

      const prompt = getGenerateVariationsPrompt(
        currentSession.prompt,
        currentSession.componentType || 'Freeform Component'
      );

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

  const applyVariation = useCallback((html: string, onComplete?: () => void) => {
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
              status: 'complete' as const,
              history: newHistory
            };
          }
          return art;
        })
      } : sess
    ));
    if (onComplete) onComplete();
  }, [currentSessionIndex, focusedArtifactIndex]);

  const handleRevert = useCallback((artifactId: string, html: string) => {
    setSessions(prev => prev.map(sess => ({
      ...sess,
      artifacts: sess.artifacts.map(art =>
        art.id === artifactId ? { ...art, html } : art
      )
    })));
  }, []);

  const nextItem = useCallback(() => {
    const currentSession = sessions[currentSessionIndex];
    if (focusedArtifactIndex !== null) {
      if (currentSession && focusedArtifactIndex < currentSession.artifacts.length - 1) {
        setFocusedArtifactIndex(focusedArtifactIndex + 1);
      }
    } else {
      if (currentSessionIndex < sessions.length - 1) {
        setCurrentSessionIndex(currentSessionIndex + 1);
      }
    }
  }, [currentSessionIndex, sessions, focusedArtifactIndex]);

  const prevItem = useCallback(() => {
    if (focusedArtifactIndex !== null) {
      if (focusedArtifactIndex > 0) {
        setFocusedArtifactIndex(focusedArtifactIndex - 1);
      }
    } else {
      if (currentSessionIndex > 0) {
        setCurrentSessionIndex(currentSessionIndex - 1);
      }
    }
  }, [currentSessionIndex, focusedArtifactIndex]);

  return {
    sessions,
    setSessions,
    currentSessionIndex,
    setCurrentSessionIndex,
    focusedArtifactIndex,
    setFocusedArtifactIndex,
    isLoading,
    setIsLoading,
    componentVariations,
    setComponentVariations,
    handleSendMessage,
    handleGenerateVariations,
    applyVariation,
    handleRevert,
    nextItem,
    prevItem
  };
}
