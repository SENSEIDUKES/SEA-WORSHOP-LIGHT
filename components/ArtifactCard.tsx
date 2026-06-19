/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { Artifact } from '../types';
import { CopyIcon } from './Icons';
import { useThumbnail } from '../hooks/useThumbnail';
import { useLanguage } from '../localization';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
    onRevert?: (artifactId: string, html: string) => void;
    onDismiss?: () => void;
    isEditMode?: boolean;
    onElementSelect?: (name: string, html: string) => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    onClick,
    onRevert,
    onDismiss,
    isEditMode,
    onElementSelect
}: ArtifactCardProps) => {
    const { t } = useLanguage();
    const codeRef = useRef<HTMLPreElement>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [compareVersionIndex, setCompareVersionIndex] = useState<number | null>(null);
    const [diffMode, setDiffMode] = useState(false);
    const [copied, setCopied] = useState(false);
    const { thumbnail, isGenerating: isGeneratingThumbnail } = useThumbnail(artifact.html, artifact.status);

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    // Handle Edit Mode integration
    useEffect(() => {
        if (!isEditMode || !onElementSelect) return;
        const handleMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'ELEMENT_SELECTED' && e.data.artifactId === artifact.id) {
                onElementSelect(e.data.elementName, e.data.elementHtml);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isEditMode, artifact.id, onElementSelect]);

    // Close history view when active card focus changes
    useEffect(() => {
        if (!isFocused) {
            setShowHistory(false);
            setCompareVersionIndex(null);
        }
    }, [isFocused]);

    const isBlurring = artifact.status === 'streaming';
    
    // Safety check: count total versions in history
    const versionsCount = artifact.history?.length || 1;
    const hasHistory = artifact.history && artifact.history.length > 0;

    const handleRevertClick = (e: React.MouseEvent, html: string) => {
        e.stopPropagation();
        if (onRevert) {
            onRevert(artifact.id, html);
        }
    };

    const handleCopyCode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(artifact.html);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code: ', err);
        }
    };

    const getSrcDoc = () => {
        if (!isEditMode || artifact.status !== 'complete') return artifact.html;
        
        const script = `
        <script>
            (function() {
                let hoveredEl = null;
                const style = document.createElement('style');
                style.innerHTML = '.sea-edit-outline { outline: 2px solid #04ACFF !important; outline-offset: -2px !important; cursor: pointer !important; transition: outline 0.1s; }';
                document.head.appendChild(style);

                document.body.addEventListener('mouseover', (e) => {
                    if(e.target === document.body || e.target === document.documentElement) return;
                    e.target.classList.add('sea-edit-outline');
                    hoveredEl = e.target;
                });
                document.body.addEventListener('mouseout', (e) => {
                    e.target.classList.remove('sea-edit-outline');
                });
                document.body.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if(!hoveredEl) return;
                    
                    const tag = hoveredEl.tagName.toLowerCase();
                    const id = hoveredEl.id ? '#' + hoveredEl.id : '';
                    let classes = hoveredEl.className;
                    if (typeof classes === 'string') {
                        classes = classes.replace('sea-edit-outline', '').trim();
                        classes = classes.split(' ').filter(Boolean).join('.');
                        if (classes) classes = '.' + classes;
                    } else {
                        classes = '';
                    }
                    
                    let name = tag + id + classes;
                    
                    const clone = hoveredEl.cloneNode(true);
                    clone.classList.remove('sea-edit-outline');
                    if(clone.classList.length === 0) clone.removeAttribute('class');
                    
                    window.parent.postMessage({
                        type: 'ELEMENT_SELECTED',
                        artifactId: '${artifact.id}',
                        elementName: name,
                        elementHtml: clone.outerHTML
                    }, '*');
                }, true);
            })();
        </script>
        `;
        return artifact.html + script;
    };

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
                
                {artifact.status === 'streaming' && (
                    <div className="artifact-progress-indicator" style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.75rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'rgba(255,255,255,0.6)',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <span>~{Math.max(1, Math.floor((artifact.html?.length || 0) / 4))} tkns</span>
                        <span>•</span>
                        <span>~${(Math.max(1, Math.floor((artifact.html?.length || 0) / 4)) * 0.000003).toFixed(5)}</span>
                    </div>
                )}

                {artifact.status === 'complete' && (
                    <div className="artifact-version-control" onClick={(e) => e.stopPropagation()}>
                        <span className="artifact-version-badge">v{versionsCount}</span>
                        {isFocused && (
                            <button
                                className="copy-code-button"
                                style={{
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    fontSize: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '4px',
                                    color: '#FAFAFA',
                                    cursor: 'pointer',
                                    fontFamily: 'Rubik, sans-serif',
                                    fontWeight: 400,
                                    textTransform: 'none',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onClick={handleCopyCode}
                            >
                                <CopyIcon />
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        )}
                        {hasHistory && (
                            <button 
                                className="view-history-button"
                                style={{
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    fontSize: '0.75rem',
                                    background: showHistory ? '#8B0000' : 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '4px',
                                    color: '#FAFAFA',
                                    cursor: 'pointer',
                                    fontFamily: 'Rubik, sans-serif',
                                    fontWeight: 400,
                                    textTransform: 'none',
                                    transition: 'all 0.2s ease',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHistory(!showHistory);
                                }}
                            >
                                {showHistory ? 'View Live' : 'View History'}
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                
                {showHistory && hasHistory && (
                    <div 
                        className="history-panel-overlay" 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 30,
                            background: 'rgba(0, 0, 0, 0.95)',
                            color: '#FAFAFA',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '16px',
                            overflowY: 'auto',
                            fontFamily: 'Rubik, sans-serif'
                        }}
                    >
                        <div 
                            className="history-panel-header"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                paddingBottom: '8px'
                            }}
                        >
                            <span 
                                className="history-panel-title"
                                style={{
                                    fontFamily: 'Alegreya SC, serif',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    color: '#FAFAFA'
                                }}
                            >
                                Generation History
                            </span>
                            <button 
                                className="history-close-btn"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    padding: '0 4px'
                                }}
                                onClick={() => setShowHistory(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div 
                            className="history-list"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                flex: 1,
                                overflowY: 'auto'
                            }}
                        >
                            {artifact.history?.slice().reverse().map((entry, revIndex) => {
                                // Since we reversed to show newest first, compute correct index
                                const originalIndex = versionsCount - 1 - revIndex;
                                const isActive = entry.html === artifact.html;
                                return (
                                    <div 
                                        key={originalIndex} 
                                        className={`history-entry-item ${isActive ? 'active' : ''}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            borderRadius: '6px',
                                            background: isActive ? 'rgba(139, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                            border: isActive ? '1px solid #8B0000' : '1px solid rgba(255, 255, 255, 0.05)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div 
                                            className="history-entry-meta"
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <span 
                                                style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    color: isActive ? '#04ACFF' : '#FAFAFA'
                                                }}
                                            >
                                                Version {originalIndex + 1}
                                            </span>
                                            <span 
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: 'rgba(255,255,255,0.6)'
                                                }}
                                            >
                                                {entry.label}
                                            </span>
                                            <span 
                                                style={{
                                                    fontSize: '0.65rem',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontFamily: 'monospace'
                                                }}
                                            >
                                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        {isActive ? (
                                            <span 
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    color: '#04ACFF',
                                                    border: '1px solid rgba(4, 172, 255, 0.3)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(4, 172, 255, 0.05)'
                                                }}
                                            >
                                                Current
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                    className="compare-btn"
                                                    style={{
                                                        background: 'transparent',
                                                        color: '#FAFAFA',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: '4px',
                                                        padding: '4px 10px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                        fontFamily: 'Rubik, sans-serif',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCompareVersionIndex(originalIndex);
                                                        setShowHistory(false);
                                                    }}
                                                >
                                                    Compare
                                                </button>
                                                <button 
                                                    className="revert-btn"
                                                    style={{
                                                        background: '#04ACFF',
                                                        color: '#000000',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '4px 10px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                        fontFamily: 'Rubik, sans-serif',
                                                        boxShadow: '0 2px 4px rgba(4, 172, 255, 0.2)',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onClick={(e) => handleRevertClick(e, entry.html)}
                                                >
                                                    Revert
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {compareVersionIndex !== null && hasHistory && artifact.history ? (
                     <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 20, background: '#1e1e1e' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.1)', alignItems: 'center' }}>
                             <div style={{ display: 'flex', gap: '8px' }}>
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); setDiffMode(false); }} 
                                     style={{ background: !diffMode ? '#04ACFF' : 'transparent', color: !diffMode ? '#000' : '#FFF', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                 >
                                     Visual Compare
                                 </button>
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); setDiffMode(true); }} 
                                     style={{ background: diffMode ? '#04ACFF' : 'transparent', color: diffMode ? '#000' : '#FFF', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                 >
                                     Code Diff
                                 </button>
                             </div>
                             <button 
                                 style={{ background: 'none', border: 'none', color: '#FAFAFA', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                 onClick={(e) => { e.stopPropagation(); setCompareVersionIndex(null); setShowHistory(true); }}
                             >
                                 ✕
                             </button>
                         </div>
                         <div style={{ flex: 1, display: 'flex', overflow: 'auto', background: diffMode ? '#282c34' : '#fff' }}>
                             {diffMode ? (
                                 <div style={{ width: '100%', height: '100%', overflow: 'auto' }} className="diff-container-custom">
                                     <ReactDiffViewer 
                                         oldValue={artifact.history[compareVersionIndex].html} 
                                         newValue={artifact.html} 
                                         splitView={true} 
                                         useDarkTheme={true}
                                     />
                                 </div>
                             ) : (
                                 <>
                                     <div style={{ flex: 1, position: 'relative', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.85)', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                             <span style={{ fontSize: '0.8rem', color: '#FAFAFA', fontWeight: 500 }}>
                                                 Version v{compareVersionIndex + 1}
                                             </span>
                                         </div>
                                         <div style={{ width: '100%', height: '100%', paddingTop: '34px', boxSizing: 'border-box', background: '#fff' }}>
                                             <iframe 
                                                 srcDoc={artifact.history[compareVersionIndex].html} 
                                                 title={`${artifact.id}-compare`} 
                                                 sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                                                 className="artifact-iframe"
                                                 style={{ width: '100%', height: '100%', border: 'none' }}
                                             />
                                         </div>
                                     </div>
                                     <div style={{ flex: 1, position: 'relative' }}>
                                         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.85)', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                             <span style={{ fontSize: '0.8rem', color: '#04ACFF', fontWeight: 500 }}>
                                                 Current (v{versionsCount})
                                             </span>
                                         </div>
                                         <div style={{ width: '100%', height: '100%', paddingTop: '34px', boxSizing: 'border-box', background: '#fff' }}>
                                             <iframe 
                                                 srcDoc={artifact.html} 
                                                 title={`${artifact.id}-current`} 
                                                 sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                                                 className="artifact-iframe"
                                                 style={{ width: '100%', height: '100%', border: 'none' }}
                                             />
                                         </div>
                                     </div>
                                 </>
                             )}
                         </div>
                     </div>
                ) : !isFocused && thumbnail ? (
                    <div style={{ width: '100%', height: '100%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                         <img src={thumbnail} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                    </div>
                ) : artifact.status === 'error' ? (
                    <div 
                        className="error-card-display"
                        onClick={(e) => { e.stopPropagation(); }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            width: '100%',
                            background: '#121214',
                            padding: '32px',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                            color: '#fff',
                            fontFamily: 'Inter, sans-serif',
                            border: '1px solid rgba(255,107,107,0.2)',
                            borderRadius: '8px'
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#ff6b6b' }}>{t('gen_failed')}</h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '280px', lineHeight: '1.5' }}>
                            {artifact.html.replace(/<[^>]*>/g, '') || t('error_occured')}
                        </p>
                        {onDismiss && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                                className="surprise-button"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                {t('exit_error')}
                            </button>
                        )}
                    </div>
                ) : (
                    <iframe 
                        srcDoc={getSrcDoc()} 
                        title={artifact.id} 
                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                        className="artifact-iframe"
                        style={{ pointerEvents: isEditMode ? 'auto' : 'auto' }}
                    />
                )}
            </div>
        </div>
    );
});

export default ArtifactCard;