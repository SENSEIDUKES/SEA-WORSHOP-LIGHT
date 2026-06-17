import React from 'react';
import { GridIcon, SparklesIcon, CodeIcon, DownloadIcon } from './Icons';
import { Session } from '../types';

interface ActionBarProps {
    focusedArtifactIndex: number | null;
    currentSession?: Session;
    isLoading: boolean;
    setFocusedArtifactIndex: (index: number | null) => void;
    handleGenerateVariations: () => void;
    handleShowCode: () => void;
    handleExport: () => void;
}

export default function ActionBar({
    focusedArtifactIndex,
    currentSession,
    isLoading,
    setFocusedArtifactIndex,
    handleGenerateVariations,
    handleShowCode,
    handleExport
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
    );
}
