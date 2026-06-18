import React from 'react';
import { GridIcon, SparklesIcon, CodeIcon, DownloadIcon, BookmarkIcon } from './Icons';
import { Session } from '../types';

interface ActionBarProps {
    focusedArtifactIndex: number | null;
    currentSession?: Session;
    isLoading: boolean;
    isEditMode: boolean;
    setIsEditMode: (v: boolean) => void;
    setFocusedArtifactIndex: (index: number | null) => void;
    handleGenerateVariations: () => void;
    handleShowCode: () => void;
    handleExport: () => void;
    handleSave: () => void;
}

export default function ActionBar({
    focusedArtifactIndex,
    currentSession,
    isLoading,
    isEditMode,
    setIsEditMode,
    setFocusedArtifactIndex,
    handleGenerateVariations,
    handleShowCode,
    handleExport,
    handleSave
}: ActionBarProps) {
    return (
        <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
             <div className="active-prompt-label">
                {currentSession?.prompt}
             </div>
             <div className="action-buttons">
                <button onClick={() => setFocusedArtifactIndex(null)}>
                    <GridIcon /> Grid View
                </button>
                <button 
                  onClick={() => setIsEditMode(!isEditMode)} 
                  disabled={isLoading}
                  style={{ background: isEditMode ? 'rgba(4, 172, 255, 0.2)' : undefined, color: isEditMode ? '#04ACFF' : undefined }}
                >
                    <SparklesIcon /> {isEditMode ? 'Editing Elements...' : 'Select Elements'}
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
                <button onClick={handleSave}>
                    <BookmarkIcon /> Save
                </button>
             </div>
        </div>
    );
}
