import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import SideDrawer from './SideDrawer';
import { ThinkingIcon } from './Icons';
import { ComponentVariation, AppSkin } from '../types';
import { generateContent, getSettings } from '../ai';
import { getReactExportPrompt, getReactTailwindExportPrompt } from '../prompts';
import { exportToZip } from '../utils';

interface ActionDrawerProps {
    drawerState: {
        isOpen: boolean;
        mode: 'code' | 'variations' | 'export' | 'preview' | 'playground' | null;
        title: string;
        data: any;
    };
    setDrawerState: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        mode: 'code' | 'variations' | 'export' | 'preview' | 'playground' | null;
        title: string;
        data: any;
    }>>;
    isLoadingDrawer: boolean;
    componentVariations: ComponentVariation[];
    applyVariation: (html: string) => void;
    onLoadIntoWorkspace?: (savedComp: any) => void;
    activeSkin: AppSkin;
}

export default function ActionDrawer({
    drawerState,
    setDrawerState,
    isLoadingDrawer,
    componentVariations,
    applyVariation,
    onLoadIntoWorkspace,
    activeSkin
}: ActionDrawerProps) {
    const [activeTab, setActiveTab] = useState<'preview' | 'playground' | 'code' | 'export'>('preview');
    const [isExportingReact, setIsExportingReact] = useState(false);
    const [isExportingReactTailwind, setIsExportingReactTailwind] = useState(false);
    const [isCopyingToClipboard, setIsCopyingToClipboard] = useState(false);

    // Playground States
    const [editableProps, setEditableProps] = useState<any[]>([]);
    const [colorsState, setColorsState] = useState<any[]>([]);
    const [templateHtml, setTemplateHtml] = useState<string>('');
    const [originalHtml, setOriginalHtml] = useState<string>('');

    // Extract raw HTML and metadata reliably
    const htmlContent = typeof drawerState.data === 'string' ? drawerState.data : (drawerState.data?.html || '');
    const componentId = typeof drawerState.data === 'string' ? 'workspace' : (drawerState.data?.id || 'workspace');
    const componentName = drawerState.title || 'Component';

    // Synchronize current tab with trigger mode when opened
    useEffect(() => {
        if (drawerState.isOpen) {
            if (drawerState.mode === 'code') setActiveTab('code');
            else if (drawerState.mode === 'export') setActiveTab('export');
            else if (drawerState.mode === 'playground') setActiveTab('playground');
            else if (drawerState.mode === 'preview') setActiveTab('preview');
            else setActiveTab('preview');
        }
    }, [drawerState.isOpen, drawerState.mode]);

    // Parse and prepare playground data when HTML changes
    useEffect(() => {
        if (drawerState.isOpen && htmlContent && htmlContent !== originalHtml) {
            setOriginalHtml(htmlContent);
            const { propsList, tempHtml } = parsePropsFromHtml(htmlContent);
            const parsedColors = collectUniqueColors(htmlContent);
            setEditableProps(propsList);
            setColorsState(parsedColors);
            setTemplateHtml(tempHtml);
        }
    }, [drawerState.isOpen, htmlContent]);

    // Parse properties from raw HTML with data-prop-id annotations
    const parsePropsFromHtml = (rawHtml: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');
        const propsList: any[] = [];
        let propCounter = 0;

        const elements = doc.querySelectorAll('*');
        elements.forEach((el) => {
            const tagName = el.tagName.toLowerCase();
            if (['script', 'style', 'head', 'html', 'body', 'link', 'meta'].includes(tagName)) {
                return;
            }

            // 1. Text Node Leaf Elements
            if (el.children.length === 0 && el.textContent && el.textContent.trim().length > 0) {
                const trimmed = el.textContent.trim();
                // Only consider reasonably short, modifiable text clusters
                if (trimmed.length < 150) {
                    const propId = `prop-txt-${propCounter++}`;
                    el.setAttribute('data-prop-id', propId);
                    propsList.push({
                        id: propId,
                        type: 'text',
                        tagName: tagName,
                        label: `${tagName} Text`,
                        value: trimmed
                    });
                }
            }

            // 2. Interactive Input Placeholders
            if (tagName === 'input' || tagName === 'textarea') {
                const placeholder = el.getAttribute('placeholder');
                if (placeholder) {
                    const propId = `prop-ph-${propCounter++}`;
                    el.setAttribute('data-prop-id', propId);
                    propsList.push({
                        id: propId,
                        type: 'placeholder',
                        tagName: tagName,
                        label: `${tagName} Input Placeholder`,
                        value: placeholder
                    });
                }
            }

            // 3. Media Sources
            if (tagName === 'img') {
                const src = el.getAttribute('src');
                if (src) {
                    const propId = `prop-img-${propCounter++}`;
                    el.setAttribute('data-prop-id', propId);
                    propsList.push({
                        id: propId,
                        type: 'image',
                        tagName: 'img',
                        label: 'Media Art Source',
                        value: src
                    });
                }
            }
        });

        return { propsList, tempHtml: doc.documentElement.outerHTML };
    };

    // Analyze most frequent branding/hex color elements
    const collectUniqueColors = (rawHtml: string) => {
        const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
        const matches = rawHtml.match(hexRegex) || [];
        const uniqueMatches = Array.from(new Set(matches)).filter((color) => {
            const lower = color.toLowerCase();
            return !['#fff', '#ffffff', '#000', '#000000', '#111', '#111111', '#121212', '#18181b', '#18181B'].includes(lower);
        });

        return uniqueMatches.slice(0, 5).map((color, idx) => ({
            id: `color-${idx}`,
            originalValue: color,
            currentValue: color,
            label: idx === 0 ? 'Primary Brand' : idx === 1 ? 'Secondary Accent' : `Accent Color ${idx + 1}`
        }));
    };

    // Generate processed dynamic HTML representing current playground states
    const getPlaygroundHtml = () => {
        if (!templateHtml) return htmlContent;
        const parser = new DOMParser();
        const doc = parser.parseFromString(templateHtml, 'text/html');

        editableProps.forEach((prop) => {
            const el = doc.querySelector(`[data-prop-id="${prop.id}"]`);
            if (el) {
                if (prop.type === 'text') {
                    el.textContent = prop.value;
                } else if (prop.type === 'placeholder') {
                    el.setAttribute('placeholder', prop.value);
                } else if (prop.type === 'image') {
                    el.setAttribute('src', prop.value);
                }
            }
        });

        let serialized = doc.documentElement.outerHTML;

        // Substitute custom theme variables
        colorsState.forEach((c) => {
            if (c.currentValue !== c.originalValue) {
                const escaped = c.originalValue.replace(/[-\\/\\^$*+?.()|[\\]{}]/g, '\\$&');
                const regex = new RegExp(escaped, 'gi');
                serialized = serialized.replace(regex, c.currentValue);
            }
        });

        return serialized;
    };

    const currentLiveHtml = getPlaygroundHtml();

    // Handlers for exporting and copy integrations
    const handleCopyToClipboard = async () => {
        const targetHtml = currentLiveHtml;
        if (!targetHtml) return;

        try {
            setIsCopyingToClipboard(true);
            const settings = getSettings();
            const prompt = getReactExportPrompt(targetHtml, activeSkin);
            const response = await generateContent(prompt, settings);

            let code = response.text || '';
            const codeBlockMatch = code.match(/```[a-z]*\n([\s\S]*?)```/);
            if (codeBlockMatch) {
                code = codeBlockMatch[1];
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = code;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    throw new Error("Unable to copy. Clipboard API not supported.");
                }
                textArea.remove();
            }
            alert('Component copied to clipboard!');
        } catch (e) {
            console.error('Copy failed:', e);
            alert('Failed to copy to clipboard.');
        } finally {
            setIsCopyingToClipboard(false);
        }
    };

    const handleGenerateExport = async (type: 'react' | 'react-tailwind') => {
        const targetHtml = currentLiveHtml;
        if (!targetHtml) return;

        try {
            if (type === 'react') setIsExportingReact(true);
            else setIsExportingReactTailwind(true);

            const settings = getSettings();
            const prompt = type === 'react'
                ? getReactExportPrompt(targetHtml, activeSkin)
                : getReactTailwindExportPrompt(targetHtml, activeSkin);

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
            a.download = `Component-${componentId}.tsx`;
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

    const handleApplyPlaygroundChanges = () => {
        applyVariation(currentLiveHtml);
        alert('Changes applied successfully directly to version control!');
    };

    const handlePropChange = (id: string, value: string) => {
        setEditableProps((prev) =>
            prev.map((p) => (p.id === id ? { ...p, value } : p))
        );
    };

    const handleColorChange = (id: string, val: string) => {
        setColorsState((prev) =>
            prev.map((c) => (c.id === id ? { ...c, currentValue: val } : c))
        );
    };

    // Determine when SideDrawer should be wide
    const isShowingVariations = drawerState.mode === 'variations';
    const isWideDrawer = drawerState.isOpen && !isShowingVariations;

    // Render navigation tabs
    const renderTabBar = () => {
        if (isShowingVariations) return null;

        const tabs = [
            { id: 'preview' as const, label: 'Preview', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ) },
            { id: 'playground' as const, label: 'Playground', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            ) },
            { id: 'code' as const, label: 'Source', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ) },
            { id: 'export' as const, label: 'Export', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ) }
        ];

        return (
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '12px',
                marginBottom: '16px',
                fontFamily: 'Rubik, sans-serif'
            }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: isActive ? '1px solid #04ACFF' : '1px solid rgba(255,255,255,0.05)',
                                background: isActive ? 'rgba(4, 172, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                color: isActive ? '#04ACFF' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <SideDrawer
            isOpen={drawerState.isOpen}
            onClose={() => setDrawerState(s => ({ ...s, isOpen: false }))}
            title={componentName}
            isWide={isWideDrawer}
        >
            {isLoadingDrawer && (
                <div className="loading-state">
                    <ThinkingIcon />
                    Designing variations...
                </div>
            )}

            {renderTabBar()}

            {/* Render based on Active Tabs / Modes */}
            {!isShowingVariations ? (
                <>
                    {/* 1. PREVIEW TAB */}
                    {activeTab === 'preview' && (
                        <div className="flex flex-col gap-4 h-[calc(100vh-210px)] pb-4">
                            {/* Workspace Action Bar */}
                            <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace Actions</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <button
                                        onClick={() => onLoadIntoWorkspace?.(drawerState.data)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#04ACFF] hover:bg-[#0298e0] transition text-black font-semibold py-2.5 px-4 rounded-lg text-sm cursor-pointer shadow-md font-sans"
                                    >
                                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 000-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit in Workspace
                                    </button>
                                    {drawerState.data?.id && (
                                        <button
                                            onClick={async () => {
                                                const { toggleFavorite } = await import('../services/dbService');
                                                await toggleFavorite(drawerState.data.id);
                                                setDrawerState(s => ({
                                                    ...s,
                                                    data: {
                                                        ...s.data,
                                                        favorite: !s.data?.favorite
                                                    }
                                                }));
                                            }}
                                            className={`flex items-center justify-center p-2.5 rounded-lg border transition cursor-pointer ${drawerState.data?.favorite ? 'bg-[#8B0000]/20 border-[#8B0000] text-[#ef4444]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                            title={drawerState.data?.favorite ? "Unpin from UI Kit" : "Pin to UI Kit"}
                                            style={{ width: '42px', height: '42px' }}
                                        >
                                            <svg className="w-5 h-5" fill={drawerState.data?.favorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Iframe Stage */}
                            <div className="flex-1 w-full rounded-xl overflow-hidden bg-white border border-white/10 shadow-inner flex flex-col min-h-[350px]">
                                <iframe
                                    srcDoc={currentLiveHtml}
                                    title="Preview"
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                    className="w-full h-full border-none flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* 2. PLAYGROUND TAB */}
                    {activeTab === 'playground' && (
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            height: 'calc(100vh - 210px)',
                            fontFamily: 'Rubik, sans-serif'
                        }}>
                            {/* Controls column */}
                            <div style={{
                                width: '320px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.01)'
                                }}>
                                    <span style={{ fontSize: '11px', color: '#FAFAFA', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        Interactive Props
                                    </span>
                                    <button
                                        onClick={handleApplyPlaygroundChanges}
                                        style={{
                                            background: '#8B0000',
                                            border: 'none',
                                            color: '#FAFAFA',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            lineHeight: '1.2'
                                        }}
                                    >
                                        Save Changes
                                    </button>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Accent brand customizers */}
                                    {colorsState.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', color: '#04ACFF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Branding Colors (SEIHouse Palette)
                                            </span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {colorsState.map((color) => (
                                                    <div key={color.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px', borderRadius: '8px' }}>
                                                        <input
                                                            type="color"
                                                            value={color.currentValue}
                                                            onChange={(e) => handleColorChange(color.id, e.target.value)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                width: '32px',
                                                                height: '24px',
                                                                cursor: 'pointer',
                                                                padding: '0'
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#FAFAFA' }}>{color.label}</span>
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', fontFamily: 'Roboto Mono, monospace' }}>
                                                            {color.currentValue}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Texts Props List */}
                                    {editableProps.filter(p => p.type === 'text').length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{ fontSize: '10px', color: '#04ACFF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Heading Elements & Labels
                                            </span>
                                            {editableProps.filter(p => p.type === 'text').map((prop) => (
                                                <div key={prop.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                                        <span style={{ textTransform: 'uppercase' }}>{prop.tagName} tag</span>
                                                    </div>
                                                    <textarea
                                                        value={prop.value}
                                                        onChange={(e) => handlePropChange(prop.id, e.target.value)}
                                                        rows={2}
                                                        style={{
                                                            width: '100%',
                                                            background: '#111',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: '#FAFAFA',
                                                            borderRadius: '6px',
                                                            padding: '8px',
                                                            fontSize: '12px',
                                                            lineHeight: '1.4',
                                                            outline: 'none',
                                                            resize: 'none'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Media Asset customizer */}
                                    {editableProps.filter(p => p.type === 'image').length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{ fontSize: '10px', color: '#04ACFF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Media & Artwork
                                            </span>
                                            {editableProps.filter(p => p.type === 'image').map((prop) => (
                                                <div key={prop.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                                        <span>{prop.label}</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={prop.value}
                                                        onChange={(e) => handlePropChange(prop.id, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            background: '#111',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: '#FAFAFA',
                                                            borderRadius: '6px',
                                                            padding: '8px',
                                                            fontSize: '12px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input placeholders */}
                                    {editableProps.filter(p => p.type === 'placeholder').length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{ fontSize: '10px', color: '#04ACFF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Interactive Input Placeholders
                                            </span>
                                            {editableProps.filter(p => p.type === 'placeholder').map((prop) => (
                                                <div key={prop.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                                        <span>Placeholder</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={prop.value}
                                                        onChange={(e) => handlePropChange(prop.id, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            background: '#111',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: '#FAFAFA',
                                                            borderRadius: '6px',
                                                            padding: '8px',
                                                            fontSize: '12px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live Rendering Stage */}
                            <div style={{
                                flex: 1,
                                height: '100%',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#FFFFFF',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <iframe
                                    srcDoc={currentLiveHtml}
                                    title="Playground Live Render"
                                    sandbox="allow-scripts allow-forms allow-same-origin"
                                    style={{ width: '100%', height: '100%', border: 'none', background: '#FFF' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* 3. SOURCE TAB */}
                    {activeTab === 'code' && (
                        <div style={{
                            maxHeight: 'calc(100vh - 210px)',
                            overflow: 'auto',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontFamily: 'Roboto Mono, monospace'
                        }}>
                            <SyntaxHighlighter
                                language="jsx"
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, padding: '16px', fontSize: '13px', background: 'transparent' }}
                            >
                                {currentLiveHtml}
                            </SyntaxHighlighter>
                        </div>
                    )}

                    {/* 4. EXPORT TAB */}
                    {activeTab === 'export' && (
                        <div className="export-options">
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontFamily: 'Rubik, sans-serif' }}>
                                Generate production-ready code outputs from this design variation.
                            </p>
                            <div className="export-card available">
                                <h3>Download ZIP</h3>
                                <p>Packaged archive containing split HTML, CSS, and JS files.</p>
                                <button onClick={async () => {
                                    if (currentLiveHtml) {
                                        await exportToZip(currentLiveHtml, `component-${componentId}`);
                                    }
                                }}>Download ZIP</button>
                            </div>
                            <div className="export-card available">
                                <h3>Copy to Clipboard</h3>
                                <p>Generate a React functional component and copy it to your clipboard for your Audio Player skin.</p>
                                <button
                                    disabled={isCopyingToClipboard}
                                    onClick={handleCopyToClipboard}
                                >
                                    {isCopyingToClipboard ? 'Copying...' : 'Copy React to Clipboard'}
                                </button>
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
                </>
            ) : (
                /* Original Component Variations Selection Grid */
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
        </SideDrawer>
    );
}
