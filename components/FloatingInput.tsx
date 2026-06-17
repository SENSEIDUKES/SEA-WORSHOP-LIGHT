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
    referenceImage: string | null;
    setReferenceImage: (img: string | null) => void;
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
    handleSendMessage,
    referenceImage,
    setReferenceImage
}: FloatingInputProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file (e.g., .png, .jpg)');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setReferenceImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
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

                <div className={`input-wrapper ${isLoading ? 'loading' : ''} ${referenceImage ? 'has-image-seed' : ''}`}>
                    {(!inputValue && !isLoading && !referenceImage) && (
                        <div className="animated-placeholder" key={placeholderIndex}>
                            <span className="placeholder-text">
                                {focusedArtifactIndex !== null 
                                    ? "Edit this component..." 
                                    : placeholders[placeholderIndex]}
                            </span>
                            {focusedArtifactIndex === null && <span className="tab-hint">Tab</span>}
                        </div>
                    )}
                    
                    {!isLoading && referenceImage && (
                        <div className="image-seed-preview" style={{ 
                            height: '40px', width: '40px', flexShrink: 0, borderRadius: '6px', 
                            overflow: 'hidden', position: 'relative', marginLeft: '12px',
                            border: '1px solid var(--border-color)', backgroundImage: `url(${referenceImage})`,
                            backgroundSize: 'cover', backgroundPosition: 'center'
                        }}>
                            <button 
                                onClick={() => setReferenceImage(null)}
                                style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', 
                                         color: '#fff', border: 'none', borderRadius: '0 0 0 4px', 
                                         width: '16px', height: '16px', display: 'flex', alignItems: 'center', 
                                         justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                                title="Remove Image Seed"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    )}

                    {!isLoading ? (
                        <input 
                            ref={inputRef}
                            type="text" 
                            style={{ paddingLeft: referenceImage ? '12px' : undefined }}
                            value={inputValue} 
                            placeholder={referenceImage && !inputValue ? "Extract palette, mood, texture..." : ""}
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
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                    />
                    <button 
                        className="send-button mic-button" 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isLoading} 
                        style={{ marginRight: '4px' }}
                        title="Upload Image Seed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </button>
                    <button className={`send-button mic-button ${isDictating ? 'dictating' : ''}`} onClick={toggleDictation} disabled={isLoading} style={{ marginRight: '8px' }}>
                        {isDictating ? <MicOffIcon /> : <MicIcon />}
                    </button>
                    <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || (!inputValue.trim() && !referenceImage)}>
                        <ArrowUpIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}
