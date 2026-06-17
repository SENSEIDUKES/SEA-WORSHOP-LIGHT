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
                    <div className="setting-group">
                        <label>Provider</label>
                        <select 
                            value={currentSettings.provider} 
                            onChange={(e) => {
                                const newProvider = e.target.value as Provider;
                                let newModel = currentSettings.model;
                                if (newProvider === 'openrouter' && currentSettings.model === 'gemini-3-flash-preview') {
                                    newModel = 'anthropic/claude-3-haiku';
                                } else if (newProvider === 'gemini' && currentSettings.model === 'anthropic/claude-3-haiku') {
                                    newModel = 'gemini-3-flash-preview';
                                }
                                setCurrentSettings({ ...currentSettings, provider: newProvider, model: newModel });
                            }}
                        >
                            <option value="gemini">Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="ollama">Ollama (Local)</option>
                            <option value="lmstudio">LM Studio (Local)</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>Model Name</label>
                        {isLoadingModels ? (
                            <input type="text" value="Loading available models..." disabled />
                        ) : availableModels.length > 0 ? (
                            <select 
                                value={currentSettings.model} 
                                onChange={(e) => setCurrentSettings({ ...currentSettings, model: e.target.value })}
                            >
                                {!availableModels.includes(currentSettings.model) && (
                                    <option value={currentSettings.model}>{currentSettings.model} (Custom)</option>
                                )}
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        ) : (
                            <input 
                                type="text" 
                                value={currentSettings.model} 
                                onChange={(e) => setCurrentSettings({ ...currentSettings, model: e.target.value })}
                                placeholder="e.g. gemini-3-flash-preview, anthropic/claude-3-haiku"
                            />
                        )}
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
