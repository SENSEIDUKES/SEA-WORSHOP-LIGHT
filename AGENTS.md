<system_context>
# AGENT DIRECTIVE: SEA WORKSHOP LIGHT
**Target Application**: SEA Workshop Light (Flash UI)
**Domain**: AI-assisted UI generation, local/remote LLM streaming client, "Artifact" explorer.
**Frameworks**: React 19, Vite, Tailwind CSS, TypeScript.

## ARCHITECTURE & STATE MAP
1. **Core Data (`types.ts`)**: The absolute source of truth for `Artifact`, `Session`, `OutputMode`, and `ModelSettings` interfaces.
2. **AI Layer (`ai.ts`)**: Multi-provider polymorphic wrapper supporting `@google/genai` (native), OpenRouter, Ollama, and LM Studio. Maintains a custom `parseOpenAIStream` generator for non-Gemini SSE streams. 
3. **Core Components**:
   - `index.tsx`: Main container, handles prompting, global session history, layout variations.
   - `ArtifactCard.tsx`: Safely renders AI-generated code (HTML/React-Tailwind) dynamically.
   - `SettingsPanel.tsx`: Provider selection and API key management (persisted in `localStorage`).

## CRITICAL INVARIANTS & CONSTRAINTS
- **Streaming Parser**: `ai.ts` contains a custom Server-Sent Events (SSE) generator (`parseOpenAIStream`). DO NOT replace this with standard `EventSource` unless implementing full POST stream compatibility. Modifying this function breaks OpenRouter/Local LLM streaming.
- **Client-Side Exclusivity**: The application operates entirely client-side. API keys are stored in `localStorage`. DO NOT introduce a backend (`server.ts`, Express, or Next.js app router) to proxy requests unless the user explicitly mandates a full-stack migration.
- **Provider Discriminant**: All generative AI requests MUST switch rigidly upon `settings.provider` (`'gemini' | 'openrouter' | 'ollama' | 'lmstudio'`). Do not assume Google GenAI is the only provider.
- **Context Isolation**: Artifacts represent arbitrary AI-generated HTML/code. They MUST be isolated from the parent React application's DOM/CSS scope to prevent layout bleed.
</system_context>

<modification_guidelines>
## EXAMPLES OF GOOD AND BAD CHANGES

### SCENARIO: Adding a new AI Provider to the app
**❌ BAD CHANGE:**
```typescript
// ai.ts
export async function generateContentStream(prompt: string, settings: ModelSettings) {
  // ⛔ Error: Hardcoding a new external SDK directly and ignoring the polymorphic provider interface.
  const openai = new OpenAI({ apiKey: settings.apiKey });
  return openai.chat.completions.create({ ... });
}
```
*Why it is bad:* Breaks the decoupled function signature. Neglects the global `ModelSettings` type. Bloats the Vite bundle with large external Node SDKs when standard native `fetch` streaming is already custom-implemented in the codebase.

**✅ GOOD CHANGE:**
```typescript
// types.ts
export type Provider = 'gemini' | 'openrouter' | 'ollama' | 'lmstudio' | 'anthropic'; // ✅ Safe type extension

// ai.ts -> Extend existing fetch logic branch safely 
} else if (provider === 'anthropic') {
    url = 'https://api.anthropic.com/v1/messages';
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
}
// ✅ Integrates cleanly into the existing fetch/stream generation pipeline.
```

### SCENARIO: Rendering Artifact Code
**❌ BAD CHANGE:**
```tsx
// ArtifactCard.tsx
// ⛔ Error: Using dangerouslySetInnerHTML naively for uncontrolled HTML
<div className="w-full" dangerouslySetInnerHTML={{ __html: props.artifact.html }} />
```
*Why it is bad:* Critical CSS bleed flaw. Any global Tailwind styling or CSS resets injected by the AI output will break the host workshop application's styling and layout.

**✅ GOOD CHANGE:**
```tsx
// ArtifactCard.tsx
// ✅ Use an isolated sandboxed iframe to mount AI-generated raw code
<iframe 
  srcDoc={props.artifact.html} 
  sandbox="allow-scripts allow-forms allow-same-origin"
  className="w-full h-full border-none"
/>
```
</modification_guidelines>

<agent_execution_rules>
1. **Analyze Types First**: Always read `types.ts` via `view_file` at the start of a session. It contains the data contract linking the UI with the AI generation logic.
2. **State Persistence bias**: User preferences (keys, model strings, temperature) rely on exact `localStorage` keys (`sea_model_settings`). Modifying key names will break existing persistent states.
3. **No Telemetry / No Slop**: Do not inject arbitrary "status" bars or pseudo-terminal logging into the UI cards. Maintain the exact aesthetic baseline.
4. **Assume React 19**: Standard legacy hooks might throw warnings. Keep React patterns modern.
</agent_execution_rules>
