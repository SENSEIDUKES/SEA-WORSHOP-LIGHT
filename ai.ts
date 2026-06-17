import { GoogleGenAI } from '@google/genai';

export type Provider = 'gemini' | 'openrouter' | 'ollama' | 'lmstudio';

export interface ModelSettings {
  provider: Provider;
  model: string;
  apiKey: string;
  temperature: number;
  baseUrl?: string;
}

export const DEFAULT_SETTINGS: ModelSettings = {
  provider: 'gemini',
  model: 'gemini-3-flash-preview', // Might need an older fallback or latest gemini depending on availability, but 3-flash is specified in the old code
  apiKey: '',
  temperature: 1.2
};

export function getSettings(): ModelSettings {
    const raw = localStorage.getItem('sea_model_settings');
    if (raw) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        } catch (e) {
            console.error('Failed to parse settings', e);
        }
    }
    return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ModelSettings) {
    localStorage.setItem('sea_model_settings', JSON.stringify(settings));
}

export async function fetchAvailableModels(provider: Provider, apiKey?: string, baseUrl?: string): Promise<string[]> {
    try {
        if (provider === 'gemini') {
            return [
                'gemini-3-flash-preview',
                'gemini-2.5-flash',
                'gemini-2.0-flash',
                'gemini-2.0-flash-lite-preview-02-05',
                'gemini-1.5-flash',
                'gemini-1.5-pro'
            ];
        } else if (provider === 'openrouter') {
            if (!apiKey) return [];
            const res = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
            });
            if (!res.ok) return [];
            const data = await res.json();
            const models = data.data.map((m: any) => m.id);
            return models.sort((a: string, b: string) => a.localeCompare(b));
        } else {
            // ollama / lmstudio
            let url = baseUrl || (provider === 'ollama' ? 'http://localhost:11434/v1/chat/completions' : 'http://localhost:1234/v1/chat/completions');
            // replace chat/completions with models
            url = url.replace(/\/chat\/completions\/?$/, '/models');
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            const models = data.data.map((m: any) => m.id);
            return models.sort((a: string, b: string) => a.localeCompare(b));
        }
    } catch (e) {
        console.error("Failed to fetch available models", e);
        return [];
    }
}

// Utility to parse streams from OpenAI compatible endpoints
export async function* parseOpenAIStream(response: Response) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    if (!reader) return;

    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        let lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                const dataStr = trimmed.substring(6);
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                        yield { text: parsed.choices[0].delta.content };
                    }
                } catch (e) {
                    console.warn("Failed to parse stream chunk", dataStr);
                }
            }
        }
    }
}

export async function generateContentStream(prompt: string, settings: ModelSettings): Promise<AsyncGenerator<{text: string}>> {
    const { provider, model, apiKey, temperature, baseUrl } = settings;
    
    // For gemini, fallback to process.env if apiKey is empty in settings
    const finalApiKey = apiKey || (process.env.API_KEY as string);

    if (provider === 'gemini') {
        if (!finalApiKey) throw new Error("Gemini API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey: finalApiKey });
        const responseStream = await ai.models.generateContentStream({
            model: model || 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: prompt }], role: 'user' }],
            config: { temperature }
        });
        return responseStream;
    }

    // OpenAI compatible providers (OpenRouter, Ollama, LM Studio)
    let url = 'https://openrouter.ai/api/v1/chat/completions';
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        if (!apiKey) throw new Error("OpenRouter API_KEY is not configured.");
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        headers['HTTP-Referer'] = window.location.href;
        headers['X-Title'] = 'SEA Workshop Light';
    } else if (provider === 'ollama') {
        url = baseUrl || 'http://localhost:11434/v1/chat/completions';
        // Ollama usually doesn't strictly need auth for local
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`; 
    } else if (provider === 'lmstudio') {
        url = baseUrl || 'http://localhost:1234/v1/chat/completions';
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    let finalTemperature = temperature;
    if (provider === 'openrouter' && model.includes('anthropic')) {
        finalTemperature = Math.min(finalTemperature, 1.0);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: finalTemperature,
            stream: true,
        })
    });

    if (!response.ok) {
        let errStr = await response.text();
        try { const parsed = JSON.parse(errStr); if (parsed?.error?.message) errStr = parsed.error.message; } catch {}
        if (response.status === 401 && provider === 'openrouter') { throw new Error(`OpenRouter 401: Invalid API Key or Unauthorized. Details: ${errStr}`); }
        throw new Error(`${provider} request failed: ${response.status} ${errStr}`);
    }

    return parseOpenAIStream(response);
}

export async function generateContent(prompt: string, settings: ModelSettings): Promise<{ text: string }> {
    const { provider, model, apiKey, temperature, baseUrl } = settings;
    const finalApiKey = apiKey || (process.env.API_KEY as string);
    
    if (provider === 'gemini') {
        if (!finalApiKey) throw new Error("Gemini API_KEY is not configured.");
        const ai = new GoogleGenAI({ apiKey: finalApiKey });
        const response = await ai.models.generateContent({
            model: model || 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { temperature }
        });
        return { text: response.text || '' };
    }

    let url = 'https://openrouter.ai/api/v1/chat/completions';
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        if (!apiKey) throw new Error("OpenRouter API_KEY is not configured.");
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        headers['HTTP-Referer'] = window.location.href;
        headers['X-Title'] = 'SEA Workshop Light';
    } else if (provider === 'ollama') {
        url = baseUrl || 'http://localhost:11434/v1/chat/completions';
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`; 
    } else if (provider === 'lmstudio') {
        url = baseUrl || 'http://localhost:1234/v1/chat/completions';
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    let finalTemperature = temperature;
    if (provider === 'openrouter' && model.includes('anthropic')) {
        finalTemperature = Math.min(finalTemperature, 1.0);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: finalTemperature,
            stream: false,
        })
    });

    if (!response.ok) {
        let errStr = await response.text();
        try { const parsed = JSON.parse(errStr); if (parsed?.error?.message) errStr = parsed.error.message; } catch {}
        if (response.status === 401 && provider === 'openrouter') { throw new Error(`OpenRouter 401: Invalid API Key or Unauthorized. Details: ${errStr}`); }
        throw new Error(`${provider} request failed: ${response.status} ${errStr}`);
    }

    const data = await response.json();
    return { text: data.choices?.[0]?.message?.content || '' };
}
