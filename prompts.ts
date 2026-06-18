import { AppSkin } from './types';

export const getEditPrompt = (
  input: string,
  htmlCode: string,
  styleName: string,
  skin: AppSkin
) => `
You are SEA Workshop Light, an expert UI designer.
Your task is to modify the provided HTML/CSS component based on this request: "${input}"

Current HTML:
\`\`\`html
${htmlCode}
\`\`\`

**RULES:**
1. Keep the same creative direction: ${styleName}
2. Apply the requested changes precisely.
3. SKIN CONTEXT: ${skin.systemPromptInjection}
4. Output ONLY the new raw, self-contained HTML/CSS. No markdown fences. No explanation.
`.trim();

export const getStylePrompt = (
  input: string,
  componentType: string,
  dnaContext: string,
  skin: AppSkin
) => `
Generate 3 distinct, product-useful design directions for a "${componentType}" matching this description: "${input}".

${dnaContext}

**SKIN CONTEXT:**
${skin.systemPromptInjection}

**GOAL:**
Return ONLY a raw JSON array of 3 *NEW*, creative UI style direction names for this component (e.g. ["Option A", "Option B", "Option C"]).
`.trim();

export const getGenerateArtifactPrompt = (
  input: string,
  componentType: string,
  componentInstruction: string,
  styleInstruction: string,
  dnaContext: string,
  skin: AppSkin
) => `
You are SEA Workshop Light, a designer of modern UI components and reusable interface pieces.
Create a stunning, high-fidelity UI component for: "${input}".

**COMPONENT TYPE:** ${componentType}
**COMPONENT TYPE INSTRUCTIONS:** ${componentInstruction}
**CONCEPTUAL DIRECTION:** ${styleInstruction}
${dnaContext}

**SKIN CONTEXT:**
${skin.systemPromptInjection}

**VISUAL EXECUTION RULES:**
1. Create ONE focused component, not a full app screen unless requested.
2. Make controls touch-friendly and mobile-first.
3. For functional component types, output UI that looks usable and structurally reusable, not just decorative mockups.
4. Use the specified direction to drive CSS choices.
5. Output self-contained HTML/CSS. No markdown fences. No explanation.
`.trim();

export const getFusionPrompt = (
  input: string,
  componentType: string,
  htmlA: string,
  htmlB: string,
  fusionMode: string = 'Best Of',
  skin: AppSkin
) => `
You are SEA Workshop Light, an expert UI designer.
Your task is to review two different UI implementations for the following request and fuse them into a single Master Component.

Request: "${input}"
Component Type: ${componentType}
Fusion Mode: ${fusionMode}

**Implementation A:**
\`\`\`html
${htmlA}
\`\`\`

**Implementation B:**
\`\`\`html
${htmlB}
\`\`\`

**RULES FOR FUSION MODE: ${fusionMode}**
${fusionMode === 'Best Of' ? 'Combine the strongest functional and visual setup pieces from both Implementation A and Implementation B.' : ''}
${fusionMode === 'A Look + B Structure' ? 'Apply the visual style, colors, and textures of Implementation A onto the structural layout and elements of Implementation B.' : ''}
${fusionMode === 'B Look + A Structure' ? 'Apply the visual style, colors, and textures of Implementation B onto the structural layout and elements of Implementation A.' : ''}
${fusionMode === 'Cleaner / Production' ? 'Simplify the combined designs. Remove messy, bloated, or overly complex CSS. Ensure it looks like a clean, production-ready component.' : ''}

**GENERAL RULES:**
1. Ensure the final fused component is a single, cohesive, high-fidelity UI component.
2. SKIN CONTEXT: ${skin.systemPromptInjection}
3. Output ONLY the new raw, self-contained HTML/CSS. No markdown fences. No explanation.
`.trim();

export const getElementEditPrompt = (
  instruction: string,
  htmlCode: string,
  elementHtml: string,
  elementName: string,
  skin: AppSkin
) => `
You are SEA Workshop Light, an expert UI designer.
Your task is to modify a SPECIFIC element within the provided HTML/CSS component based on this request: "${instruction}"

Selected Element: ${elementName}
Selected Element HTML Snapshot:
\`\`\`html
${elementHtml}
\`\`\`

Full Component HTML:
\`\`\`html
${htmlCode}
\`\`\`

**RULES:**
1. Keep the same creative direction and layout, but apply the requested changes strictly to the selected element.
2. If the user asks to modify the element, you MUST update the element in the context of the full component block.
3. SKIN CONTEXT: ${skin.systemPromptInjection}
4. Output ONLY the new raw, self-contained FULL HTML/CSS for the entire component. No markdown fences. No explanation.
`.trim();

export const getReactExportPrompt = (htmlCode: string, skin: AppSkin) => `
You are an expert Frontend Engineer. Convert the following HTML/CSS into a clean, modular React component.
Use standard CSS (not Tailwind) and functional hooks where appropriate.

HTML/CSS:
\`\`\`html
${htmlCode}
\`\`\`

**SKIN CONTEXT:**
${skin.systemPromptInjection}

**PROPS STANDARDIZATION:**
Review the Skin Context. Export the component expecting standard props that fit the specific domain of the Skin context.

Return ONLY the raw string of the React component code with no markdown formatting.
`.trim();

export const getReactTailwindExportPrompt = (htmlCode: string, skin: AppSkin) => `
You are an expert Frontend Engineer. Convert the following HTML/CSS to a clean, modular React component using functional hooks and Tailwind CSS.
Do not use external CSS files, only Tailwind classes.

HTML/CSS:
\`\`\`html
${htmlCode}
\`\`\`

**SKIN CONTEXT:**
${skin.systemPromptInjection}

**PROPS STANDARDIZATION:**
Review the Skin Context. Export the component expecting standard props that fit the specific domain of the Skin context.

Return ONLY the raw string of the React component code with no markdown formatting.
`.trim();

export const getGenerateVariationsPrompt = (
  promptOriginal: string,
  componentType: string,
  skin: AppSkin
) => `
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${promptOriginal}".

**COMPONENT TYPE:** ${componentType || 'Freeform Component'}

**SKIN CONTEXT:**
${skin.systemPromptInjection}

**YOUR TASK:**
For EACH variation:
- Invent a unique design direction name.
- Rewrite the prompt to fully adopt that metaphor's visual language.
- Generate high-fidelity HTML/CSS.
- Make controls touch-friendly and mobile-first.
- Create ONE focused component, not a full app screen unless requested.
- Output self-contained HTML/CSS.

Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
`.trim();
