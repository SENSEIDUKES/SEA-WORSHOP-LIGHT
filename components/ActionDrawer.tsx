import React, { useState } from 'react';
import SideDrawer from './SideDrawer';
import { ThinkingIcon } from './Icons';
import { ComponentVariation } from '../types';
import { generateContent, getSettings } from '../ai';
import { getReactExportPrompt, getReactTailwindExportPrompt } from '../prompts';
import { exportToZip } from '../utils';

interface ActionDrawerProps {
    drawerState: {
        isOpen: boolean;
        mode: 'code' | 'variations' | 'export' | 'preview' | null;
        title: string;
        data: any;
    };
    setDrawerState: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        mode: 'code' | 'variations' | 'export' | 'preview' | null;
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

            {drawerState.mode === 'preview' && (
                <div style={{ width: '100%', height: 'calc(100vh - 120px)', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                    <iframe srcDoc={drawerState.data?.html} title="Preview" sandbox="allow-scripts allow-same-origin allow-forms" style={{ width: '100%', height: '100%', border: 'none' }} />
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
                        <h3>Download ZIP</h3>
                        <p>Packaged archive containing split HTML, CSS, and JS files.</p>
                        <button onClick={async () => {
                            if (drawerState.data?.html) {
                                await exportToZip(drawerState.data.html, `component-${drawerState.data?.id}`);
                            }
                        }}>Download ZIP</button>
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
