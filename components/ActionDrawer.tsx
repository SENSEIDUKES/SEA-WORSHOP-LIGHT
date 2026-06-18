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
    onLoadIntoWorkspace?: (savedComp: any) => void;
}

export default function ActionDrawer({
    drawerState,
    setDrawerState,
    isLoadingDrawer,
    componentVariations,
    applyVariation,
    onLoadIntoWorkspace
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
            a.download = `Component-${drawerState.data?.id || 'export'}.tsx`;
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
                <div className="flex flex-col gap-4 h-[calc(100vh-120px)] pb-4">
                    {/* Workspace restoration details */}
                    <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace Actions</span>
                        </div>
                        <button 
                            onClick={() => onLoadIntoWorkspace?.(drawerState.data)}
                            className="w-full flex items-center justify-center gap-2 bg-[#04ACFF] hover:bg-[#0298e0] transition text-black font-semibold py-2.5 px-4 rounded-lg text-sm cursor-pointer shadow-md font-sans"
                        >
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 000-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit in Workspace
                        </button>
                    </div>

                    {/* Export Panel directly in Preview */}
                    <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Direct Export Code</span>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={async () => {
                                    if (drawerState.data?.html) {
                                        await exportToZip(drawerState.data.html, `component-${drawerState.data?.id}`);
                                    }
                                }}
                                className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-lg p-3 text-xs transition cursor-pointer border border-white/5"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                ZIP Archive
                            </button>
                            <button 
                                disabled={isExportingReact || isExportingReactTailwind} 
                                onClick={() => handleGenerateExport('react')}
                                className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-lg p-3 text-xs transition cursor-pointer border border-white/5 disabled:opacity-50"
                            >
                                {isExportingReact ? (
                                    <span className="animate-spin text-gray-400 text-sm">⏳</span>
                                ) : (
                                    <svg className="w-4 h-4 text-[#04ACFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                )}
                                React Code
                            </button>
                            <button 
                                disabled={isExportingReact || isExportingReactTailwind} 
                                onClick={() => handleGenerateExport('react-tailwind')}
                                className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-lg p-3 text-xs transition cursor-pointer border border-white/5 disabled:opacity-50"
                            >
                                {isExportingReactTailwind ? (
                                    <span className="animate-spin text-gray-400 text-sm">⏳</span>
                                ) : (
                                    <svg className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                )}
                                React + TW
                            </button>
                        </div>
                    </div>

                    {/* Integrated Interactive Preview Iframe */}
                    <div className="flex-1 w-full rounded-xl overflow-hidden bg-white border border-white/10 shadow-inner flex flex-col min-h-[320px]">
                        <iframe 
                            srcDoc={drawerState.data?.html} 
                            title="Preview" 
                            sandbox="allow-scripts allow-same-origin allow-forms" 
                            className="w-full h-full border-none flex-1" 
                        />
                    </div>
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
