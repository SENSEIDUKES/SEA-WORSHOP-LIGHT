import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getSettingsB, saveSettingsB, generateContent, fetchAvailableModels } from '../ai';
import { ModelSettings, Provider } from '../types';
import { useLanguage, LANGUAGE_NAMES, Language } from '../localization';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onOpenInfo: () => void;
}

export default function SettingsPanel({ isOpen, onClose, onOpenInfo }: Props) {
    const { lang, changeLanguage, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
    const [settingsA, setSettingsA] = useState<ModelSettings>(getSettings());
    const [settingsB, setSettingsB] = useState<ModelSettings>(getSettingsB());
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    
    const [availableModelsA, setAvailableModelsA] = useState<string[]>([]);
    const [isLoadingModelsA, setIsLoadingModelsA] = useState(false);

    const [availableModelsB, setAvailableModelsB] = useState<string[]>([]);
    const [isLoadingModelsB, setIsLoadingModelsB] = useState(false);

    const currentSettings = activeTab === 'A' ? settingsA : settingsB;
    const setCurrentSettings = activeTab === 'A' ? setSettingsA : setSettingsB;
    const availableModels = activeTab === 'A' ? availableModelsA : availableModelsB;
    const isLoadingModels = activeTab === 'A' ? isLoadingModelsA : isLoadingModelsB;

    const [pinnedModels, setPinnedModels] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('sea_pinned_models');
            return saved ? JSON.parse(saved) : [
                'gemini-3-flash-preview',
                'gemini-2.5-flash',
                'anthropic/claude-3-haiku',
                'meta-llama/llama-3-8b-instruct'
            ];
        } catch {
            return ['gemini-3-flash-preview', 'gemini-1.5-flash', 'anthropic/claude-3-haiku'];
        }
    });

    const [providerSearch, setProviderSearch] = useState('');
    const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
    const [modelSearch, setModelSearch] = useState('');
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

    const togglePinModel = (modelName: string) => {
        setPinnedModels(prev => {
            const updated = prev.includes(modelName) 
                ? prev.filter(m => m !== modelName) 
                : [...prev, modelName];
            localStorage.setItem('sea_pinned_models', JSON.stringify(updated));
            return updated;
        });
    };

    const handleSelectPinnedModel = (modelName: string) => {
        let guessedProvider = currentSettings.provider;
        if (modelName.startsWith('gemini')) {
            guessedProvider = 'gemini';
        } else if (modelName.includes('/') && !modelName.startsWith('llama')) {
            guessedProvider = 'openrouter';
        } else if (modelName.startsWith('llama3') || modelName.startsWith('mistral') || modelName.startsWith('phi3') || modelName.startsWith('gemma2') || modelName.startsWith('qwen')) {
            guessedProvider = 'ollama';
        }
        
        setCurrentSettings({
            ...currentSettings,
            provider: guessedProvider,
            model: modelName
        });
    };

    // Sync state when opened
    useEffect(() => {
        if (isOpen) {
            setSettingsA(getSettings());
            setSettingsB(getSettingsB());
            setTestStatus('idle');
            setTestMessage('');
        }
    }, [isOpen]);

    // Fetch models whenever provider or auth info changes for A
    useEffect(() => {
        if (!isOpen) return;
        let isCurrent = true;
        const loadModels = async () => {
            if (settingsA.provider === 'openrouter' && !settingsA.apiKey) {
                if (isCurrent) setAvailableModelsA([]);
                return;
            }
            if (isCurrent) setIsLoadingModelsA(true);
            const models = await fetchAvailableModels(settingsA.provider, settingsA.apiKey, settingsA.baseUrl);
            if (isCurrent) {
                setAvailableModelsA(models);
                setIsLoadingModelsA(false);
            }
        };
        const timeoutId = setTimeout(loadModels, 500);
        return () => { isCurrent = false; clearTimeout(timeoutId); };
    }, [isOpen, settingsA.provider, settingsA.apiKey, settingsA.baseUrl]);

    // Fetch models whenever provider or auth info changes for B
    useEffect(() => {
        if (!isOpen) return;
        let isCurrent = true;
        const loadModels = async () => {
            if (settingsB.provider === 'openrouter' && !settingsB.apiKey) {
                if (isCurrent) setAvailableModelsB([]);
                return;
            }
            if (isCurrent) setIsLoadingModelsB(true);
            const models = await fetchAvailableModels(settingsB.provider, settingsB.apiKey, settingsB.baseUrl);
            if (isCurrent) {
                setAvailableModelsB(models);
                setIsLoadingModelsB(false);
            }
        };
        const timeoutId = setTimeout(loadModels, 500);
        return () => { isCurrent = false; clearTimeout(timeoutId); };
    }, [isOpen, settingsB.provider, settingsB.apiKey, settingsB.baseUrl]);

    // Reset status when settings change
    useEffect(() => {
        setTestStatus('idle');
        setTestMessage('');
    }, [currentSettings.provider, currentSettings.model, currentSettings.apiKey, currentSettings.baseUrl]);

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage('');
        try {
            await generateContent('Hello, reply with just "OK".', currentSettings);
            setTestStatus('success');
            setTestMessage('Connection successful!');
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(error.message || 'Connection failed.');
        }
    };

    const handleSave = () => {
        saveSettings(settingsA);
        saveSettingsB(settingsB);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="settings-panel">
                <div className="settings-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h2>Model Lab</h2>
                        <button className="close-button" onClick={onClose}>&times;</button>
                    </div>
                    <div className="settings-tabs" style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '100%' }}>
                       <button 
                           onClick={() => setActiveTab('A')} 
                           style={{ flex: 1, padding: '8px', background: activeTab === 'A' ? 'var(--input-bg)' : 'transparent', color: activeTab === 'A' ? 'white' : 'var(--text-secondary)', border: '1px solid', borderColor: activeTab === 'A' ? 'var(--border-color)' : 'transparent', borderRadius: '4px' }}
                       >
                           Model A
                       </button>
                       <button 
                           onClick={() => setActiveTab('B')} 
                           style={{ flex: 1, padding: '8px', background: activeTab === 'B' ? 'var(--input-bg)' : 'transparent', color: activeTab === 'B' ? 'white' : 'var(--text-secondary)', border: '1px solid', borderColor: activeTab === 'B' ? 'var(--border-color)' : 'transparent', borderRadius: '4px' }}
                       >
                           Model B (Dual Mode)
                       </button>
                    </div>
                </div>
                
                <div className="settings-body">
                    <div className="setting-group relative">
                        <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Provider</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                                className="w-full text-left flex justify-between items-center bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.1)] hover:border-white/20 text-[#FAFAFA]/95 px-3.5 py-2.5 rounded-lg text-xs font-medium select-none cursor-pointer focus:border-[#04ACFF]/50 focus:shadow-[0_0_0_2px_rgba(4,172,255,0.15)] outline-none transition-all duration-150"
                            >
                                <span className="capitalize tracking-tight">
                                    {currentSettings.provider === 'gemini' 
                                        ? 'Gemini' 
                                        : currentSettings.provider === 'openrouter' 
                                            ? 'OpenRouter' 
                                            : currentSettings.provider === 'ollama' 
                                                ? 'Ollama (Local)' 
                                                : 'LM Studio (Local)'}
                                </span>
                                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${providerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {providerDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => { setProviderDropdownOpen(false); setProviderSearch(''); }} />
                                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#121214] border border-[var(--glass-border)] rounded-lg shadow-2xl z-20 flex flex-col p-1.5 animation-fade-in">
                                        <div className="p-1">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search providers..."
                                                value={providerSearch}
                                                onChange={(e) => setProviderSearch(e.target.value)}
                                                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-[rgba(255,255,255,0.2)]"
                                            />
                                        </div>
                                        <div className="max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col mt-1 gap-0.5">
                                            {[
                                                { id: 'gemini', label: 'Gemini' },
                                                { id: 'openrouter', label: 'OpenRouter' },
                                                { id: 'ollama', label: 'Ollama (Local)' },
                                                { id: 'lmstudio', label: 'LM Studio (Local)' }
                                            ]
                                            .filter(p => p.label.toLowerCase().includes(providerSearch.toLowerCase()))
                                            .map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newProvider = p.id as Provider;
                                                        let newModel = currentSettings.model;
                                                        if (newProvider === 'openrouter' && currentSettings.model === 'gemini-3-flash-preview') {
                                                            newModel = 'anthropic/claude-3-haiku';
                                                        } else if (newProvider === 'gemini' && currentSettings.model === 'anthropic/claude-3-haiku') {
                                                            newModel = 'gemini-3-flash-preview';
                                                        }
                                                        setCurrentSettings({ ...currentSettings, provider: newProvider, model: newModel });
                                                        setProviderDropdownOpen(false);
                                                        setProviderSearch('');
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs font-sans rounded-md transition duration-150 flex items-center justify-between cursor-pointer ${
                                                        currentSettings.provider === p.id 
                                                            ? 'bg-[rgba(255,255,255,0.1)] text-white font-medium' 
                                                            : 'text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                                                    }`}
                                                >
                                                    <span>{p.label}</span>
                                                    {currentSettings.provider === p.id && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="setting-group relative">
                        <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Model Name</label>
                        
                        {/* Pinned Quick-Switch Badges */}
                        {pinnedModels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5 mb-2">
                                {pinnedModels.map(m => {
                                    const isActive = currentSettings.model === m;
                                    return (
                                        <div 
                                            key={m}
                                            onClick={() => handleSelectPinnedModel(m)}
                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono cursor-pointer transition select-none ${
                                                isActive 
                                                    ? 'bg-[#04ACFF]/15 border border-[#04ACFF]/40 text-[#04ACFF] font-medium' 
                                                    : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                                            }`}
                                        >
                                            <span className="truncate max-w-[120px]">{m}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePinModel(m);
                                                }}
                                                className="text-gray-500 hover:text-red-400 text-[9px] w-3 h-3 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
                                                title="Unpin model"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="relative">
                            {isLoadingModels ? (
                                <input type="text" value="Loading available models..." disabled className="w-full bg-[rgba(0,0,0,0.3)] text-gray-400" />
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                                        className="w-full text-left flex justify-between items-center bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.1)] hover:border-white/20 text-[#FAFAFA]/95 px-3.5 py-2.5 rounded-lg text-xs font-medium select-none cursor-pointer focus:border-[#04ACFF]/50 focus:shadow-[0_0_0_2px_rgba(4,172,255,0.15)] outline-none transition-all duration-150"
                                    >
                                        <span className="truncate font-mono tracking-tight text-[#FAFAFA]/90">{currentSettings.model || "Select a model"}</span>
                                        <div className="flex items-center gap-2">
                                            {pinnedModels.includes(currentSettings.model) && (
                                                <svg className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            )}
                                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {modelDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => { setModelDropdownOpen(false); setModelSearch(''); }} />
                                            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#121214] border border-[var(--glass-border)] rounded-lg shadow-2xl z-20 flex flex-col p-1.5 animation-fade-in">
                                                <div className="p-1">
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Search or type custom model..."
                                                        value={modelSearch}
                                                        onChange={(e) => setModelSearch(e.target.value)}
                                                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-[rgba(255,255,255,0.2)]"
                                                    />
                                                </div>
                                                <div className="max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col mt-1 gap-0.5">
                                                    {(() => {
                                                        const normalizedSearch = modelSearch.trim().toLowerCase();
                                                        let filtered = availableModels.filter(m => m.toLowerCase().includes(normalizedSearch));
                                                        
                                                        if (currentSettings.model && !availableModels.includes(currentSettings.model) && currentSettings.model.toLowerCase().includes(normalizedSearch)) {
                                                            filtered = [currentSettings.model, ...filtered];
                                                        }

                                                        const showCustomOption = modelSearch.trim() && !filtered.some(f => f.toLowerCase() === modelSearch.trim().toLowerCase());

                                                        return (
                                                            <>
                                                                {showCustomOption && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCurrentSettings({ ...currentSettings, model: modelSearch.trim() });
                                                                            setModelDropdownOpen(false);
                                                                            setModelSearch('');
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-xs font-sans text-[#04ACFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md flex items-center gap-1.5 cursor-pointer"
                                                                    >
                                                                        <span className="font-semibold">+ Set and use custom:</span>
                                                                        <span className="truncate font-mono">{modelSearch.trim()}</span>
                                                                    </button>
                                                                )}

                                                                {filtered.length === 0 && !showCustomOption && (
                                                                    <div className="text-gray-500 text-center py-4 text-xs font-sans">
                                                                        No matching models.
                                                                    </div>
                                                                )}

                                                                {filtered.map(m => {
                                                                    const isSelected = currentSettings.model === m;
                                                                    const isPinned = pinnedModels.includes(m);
                                                                    return (
                                                                        <div
                                                                            key={m}
                                                                            className={`w-full flex items-center justify-between px-1 rounded-md transition duration-150 ${
                                                                                isSelected 
                                                                                    ? 'bg-[rgba(255,255,255,0.1)]' 
                                                                                    : 'hover:bg-[rgba(255,255,255,0.05)]'
                                                                            }`}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setCurrentSettings({ ...currentSettings, model: m });
                                                                                    setModelDropdownOpen(false);
                                                                                    setModelSearch('');
                                                                                }}
                                                                                className={`flex-1 text-left px-2 py-2 text-xs font-mono truncate cursor-pointer transition ${
                                                                                    isSelected ? 'text-white font-medium' : 'text-gray-300'
                                                                                }`}
                                                                            >
                                                                                {m}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    togglePinModel(m);
                                                                                }}
                                                                                className={`p-1.5 rounded hover:bg-white/10 transition cursor-pointer select-none active:scale-90 ${
                                                                                    isPinned ? 'text-yellow-500 fill-current' : 'text-gray-500 hover:text-yellow-400'
                                                                                }`}
                                                                                title={isPinned ? "Unpin model" : "Pin model"}
                                                                            >
                                                                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isPinned ? "0" : "1.8"}>
                                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="hint">The specific model string the provider expects.</div>
                    </div>

                    <div className="setting-group">
                        <label>API Key</label>
                        <input 
                            type="password" 
                            value={currentSettings.apiKey} 
                            onChange={(e) => setCurrentSettings({ ...currentSettings, apiKey: e.target.value })}
                            placeholder="Leave empty to use .env key for Gemini"
                        />
                        <div className="hint">Required for OpenRouter. Stored locally in your browser.</div>
                    </div>

                    {(currentSettings.provider === 'ollama' || currentSettings.provider === 'lmstudio') && (
                        <div className="setting-group">
                            <label>Base URL</label>
                            <input 
                                type="text" 
                                value={currentSettings.baseUrl || ''} 
                                onChange={(e) => setCurrentSettings({ ...currentSettings, baseUrl: e.target.value })}
                                placeholder={currentSettings.provider === 'ollama' ? 'http://localhost:11434/v1/chat/completions' : 'http://localhost:1234/v1/chat/completions'}
                            />
                            <div className="hint">The full URL to the chat/completions endpoint.</div>
                        </div>
                    )}

                    <div className="setting-group">
                        <label>Temperature ({currentSettings.temperature})</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="2" 
                            step="0.1" 
                            value={currentSettings.temperature} 
                            onChange={(e) => setCurrentSettings({ ...currentSettings, temperature: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '20px 0' }}></div>
                    
                    <div className="setting-group">
                        <label>Language / Idioma</label>
                        <select 
                            value={lang} 
                            onChange={(e) => changeLanguage(e.target.value as Language)}
                            style={{ width: '100%' }}
                        >
                            {(Object.keys(LANGUAGE_NAMES) as Language[]).map((l) => (
                                <option key={l} value={l}>
                                    {LANGUAGE_NAMES[l]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>How to Use / Guide</label>
                        <button 
                            className="test-btn" 
                            onClick={onOpenInfo}
                            style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '8px', 
                                height: '38px',
                                background: 'rgba(255, 255, 255, 0.05)', 
                                border: '1px solid var(--border-color)', 
                                color: 'var(--text-color)',
                                cursor: 'pointer',
                                borderRadius: '4px'
                            }}
                        >
                            <span>ℹ️</span> {t('how_to_use')}
                        </button>
                    </div>

                    <div className="flex justify-center items-center mt-3 pt-1">
                        <a 
                            href="https://seihouse.world/" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[13px] text-[var(--text-secondary)] opacity-50 hover:opacity-100 transition-opacity duration-200 font-medium no-underline"
                        >
                            {t('created_by')}
                        </a>
                    </div>
                </div>

                <div className="settings-footer">
                    <div className="test-connection-wrapper">
                        <button 
                            className="test-btn" 
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing'}
                        >
                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testStatus !== 'idle' && (
                            <span className={`test-status-msg ${testStatus}`} title={testMessage}>
                                {testMessage}
                            </span>
                        )}
                    </div>
                    <button className="save-btn" onClick={handleSave}>Save & Close</button>
                </div>
            </div>
        </div>
    );
}
