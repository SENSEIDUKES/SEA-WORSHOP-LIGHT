import React, { useState } from 'react';
import SideDrawer from './SideDrawer';
import { ThinkingIcon } from './Icons';
import { ComponentVariation } from '../types';
import { generateContent, getSettings } from '../ai';
import { getReactExportPrompt, getReactTailwindExportPrompt } from '../prompts';

interface ActionDrawerProps {
    drawerState: {
        isOpen: boolean;
        mode: 'code' | 'variations' | 'export' | null;
        title: string;
        data: any;
    };
    setDrawerState: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        mode: 'code' | 'variations' | 'export' | null;
        title: string;
        data: any;
    }>>;
    isLoadingDrawer: boolean;
    componentVariations: ComponentVariation[];
    applyVariation: (html: string) => void;
}

export default function ActionDrawer({
    drawerState,
    setDrawerState,
    isLoadingDrawer,
    componentVariations,
    applyVariation
}: ActionDrawerProps) {
    const [isExportingReact, setIsExportingReact] = useState(false);
    const [isExportingReactTailwind, setIsExportingReactTailwind] = useState(false);

    const handleGenerateExport = async (type: 'react' | 'react-tailwind') => {
        if (!drawerState.data?.html) return;
        
        try {
            if (type === 'react') setIsExportingReact(true);
            else setIsExportingReactTailwind(true);

            const settings = getSettings();
            const prompt = type === 'react' 
                ? getReactExportPrompt(drawerState.data.html)
                : getReactTailwindExportPrompt(drawerState.data.html);

            const response = await generateContent(prompt, settings);
            
            let code = response.text || '';
            const codeBlockMatch = code.match(/```[a-z]*\n([\s\S]*?)```/);
            if (codeBlockMatch) {
                code = codeBlockMatch[1];
            }

            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Component-${drawerState.data?.id}.tsx`;
            a.click();
            URL.revokeObjectURL(url);
            
        } catch (e) {
            console.error('Export failed:', e);
            alert('Failed to generate export.');
        } finally {
            if (type === 'react') setIsExportingReact(false);
            else setIsExportingReactTailwind(false);
        }
    };

    return (
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
                    <div className="export-card available">
                        <h3>React Component</h3>
                        <p>A structured React functional component. Converts the visual layout into clean DOM elements and maps interactive states to hooks.</p>
                        <button 
                            disabled={isExportingReact || isExportingReactTailwind} 
                            onClick={() => handleGenerateExport('react')}
                        >
                            {isExportingReact ? 'Generating...' : 'Download React'}
                        </button>
                    </div>
                    <div className="export-card available">
                        <h3>React + Tailwind</h3>
                        <p>Fully typed React component with inline Tailwind classes for immediate use in modern codebases.</p>
                        <button 
                            disabled={isExportingReact || isExportingReactTailwind} 
                            onClick={() => handleGenerateExport('react-tailwind')}
                        >
                            {isExportingReactTailwind ? 'Generating...' : 'Download React+Tailwind'}
                        </button>
                    </div>
                </div>
            )}
        </SideDrawer>
    );
}
