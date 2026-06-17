import React from 'react';
import { SlidersIcon, ThinkingIcon, MicOffIcon, MicIcon, ArrowUpIcon } from './Icons';
import { COMPONENT_PRESETS, DNA_DIMENSIONS } from '../constants';
import { Session } from '../types';

interface FloatingInputProps {
    focusedArtifactIndex: number | null;
    selectedPreset: any;
    setSelectedPreset: (preset: any) => void;
    showStyleDna: boolean;
    setShowStyleDna: (show: boolean) => void;
    styleDna: Record<string, number>;
    setStyleDna: (dna: Record<string, number>) => void;
    isLoading: boolean;
    inputValue: string;
    placeholders: string[];
    placeholderIndex: number;
    inputRef: React.RefObject<HTMLInputElement>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    currentSession?: Session;
    isDictating: boolean;
    toggleDictation: () => void;
    handleSendMessage: () => void;
}

export default function FloatingInput({
    focusedArtifactIndex,
    selectedPreset,
    setSelectedPreset,
    showStyleDna,
    setShowStyleDna,
    styleDna,
    setStyleDna,
    isLoading,
    inputValue,
    placeholders,
    placeholderIndex,
    inputRef,
    handleInputChange,
    handleKeyDown,
    currentSession,
    isDictating,
    toggleDictation,
    handleSendMessage
}: FloatingInputProps) {
    return (
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
    );
}
