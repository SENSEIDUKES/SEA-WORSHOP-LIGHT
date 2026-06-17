import React, { useState, useEffect } from 'react';
import { ModelSettings, Provider, getSettings, saveSettings, generateContent, fetchAvailableModels } from '../ai';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: Props) {
    const [settings, setSettings] = useState<ModelSettings>(getSettings());
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Sync state when opened
    useEffect(() => {
        if (isOpen) {
            setSettings(getSettings());
            setTestStatus('idle');
            setTestMessage('');
        }
    }, [isOpen]);

    // Fetch models whenever provider or auth info changes
    useEffect(() => {
        if (!isOpen) return;
        
        let isCurrent = true;
        
        const loadModels = async () => {
            if (settings.provider === 'openrouter' && !settings.apiKey) {
                if (isCurrent) setAvailableModels([]);
                return;
            }
            if (isCurrent) setIsLoadingModels(true);
            const models = await fetchAvailableModels(settings.provider, settings.apiKey, settings.baseUrl);
            if (isCurrent) {
                setAvailableModels(models);
                setIsLoadingModels(false);
            }
        };
        
        const timeoutId = setTimeout(loadModels, 500); // Debounce
        
        return () => {
            isCurrent = false;
            clearTimeout(timeoutId);
        };
    }, [isOpen, settings.provider, settings.apiKey, settings.baseUrl]);

    // Reset status when settings change
    useEffect(() => {
        setTestStatus('idle');
        setTestMessage('');
    }, [settings.provider, settings.model, settings.apiKey, settings.baseUrl]);

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage('');
        try {
            await generateContent('Hello, reply with just "OK".', settings);
            setTestStatus('success');
            setTestMessage('Connection successful!');
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(error.message || 'Connection failed.');
        }
    };

    const handleSave = () => {
        saveSettings(settings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="settings-panel">
                <div className="settings-header">
                    <h2>Model Lab</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                
                <div className="settings-body">
                    <div className="setting-group">
                        <label>Provider</label>
                        <select 
                            value={settings.provider} 
                            onChange={(e) => {
                                const newProvider = e.target.value as Provider;
                                let newModel = settings.model;
                                if (newProvider === 'openrouter' && settings.model === 'gemini-3-flash-preview') {
                                    newModel = 'anthropic/claude-3-haiku';
                                } else if (newProvider === 'gemini' && settings.model === 'anthropic/claude-3-haiku') {
                                    newModel = 'gemini-3-flash-preview';
                                }
                                setSettings({ ...settings, provider: newProvider, model: newModel });
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
                                value={settings.model} 
                                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                            >
                                {!availableModels.includes(settings.model) && (
                                    <option value={settings.model}>{settings.model} (Custom)</option>
                                )}
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        ) : (
                            <input 
                                type="text" 
                                value={settings.model} 
                                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                placeholder="e.g. gemini-3-flash-preview, anthropic/claude-3-haiku"
                            />
                        )}
                        <div className="hint">The specific model string the provider expects.</div>
                    </div>

                    <div className="setting-group">
                        <label>API Key</label>
                        <input 
                            type="password" 
                            value={settings.apiKey} 
                            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                            placeholder="Leave empty to use .env key for Gemini"
                        />
                        <div className="hint">Required for OpenRouter. Stored locally in your browser.</div>
                    </div>

                    {(settings.provider === 'ollama' || settings.provider === 'lmstudio') && (
                        <div className="setting-group">
                            <label>Base URL</label>
                            <input 
                                type="text" 
                                value={settings.baseUrl || ''} 
                                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                                placeholder={settings.provider === 'ollama' ? 'http://localhost:11434/v1/chat/completions' : 'http://localhost:1234/v1/chat/completions'}
                            />
                            <div className="hint">The full URL to the chat/completions endpoint.</div>
                        </div>
                    )}

                    <div className="setting-group">
                        <label>Temperature ({settings.temperature})</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="2" 
                            step="0.1" 
                            value={settings.temperature} 
                            onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                        />
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
