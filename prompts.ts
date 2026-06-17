export const getEditPrompt = (
  input: string,
  htmlCode: string,
  styleName: string
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
3. Keep premium dark music-product styling. Use black, off-white, deep red, and electric blue accents unless instructed otherwise.
4. Output ONLY the new raw, self-contained HTML/CSS. No markdown fences. No explanation.
`.trim();

export const getStylePrompt = (
  input: string,
  componentType: string,
  dnaContext: string
) => `
Generate 3 distinct, product-useful, and music-oriented design directions for a "${componentType}" matching this description: "${input}".
${dnaContext}
**STRICT IP SAFEGUARD:**
Never use artist or brand names. Use physical audio equipment and premium digital music product metaphors.

**CREATIVE EXAMPLES (Do not simply copy these, use them as a guide for tone):**
- Example A: "Tactile Analogue Hardware" (Machined knobs, brushed metal textures, satisfying mechanical resistance, high-contrast indicators).
- Example B: "Minimalist Ambient Player" (Glassmorphism, blurred album-art blooms, deep void backgrounds, thin refined typography).
- Example C: "Studio Rack Equipment" (Utilitarian layout, glowing neon red LEDs, dense controls, matte black panels).
- Example D: "Modern DAW Interface" (High density, crisp vector edges, electric blue accents, modular layout).

**GOAL:**
Return ONLY a raw JSON array of 3 *NEW*, creative UI style direction names for this component (e.g. ["Tactile Analogue Hardware", "Minimalist Ambient Player", "Modern DAW Interface"]).
`.trim();

export const getGenerateArtifactPrompt = (
  input: string,
  componentType: string,
  componentInstruction: string,
  styleInstruction: string,
  dnaContext: string
) => `
You are SEA Workshop Light, a designer of modern music-product UI components and reusable interface pieces.
Create a stunning, high-fidelity UI component for: "${input}".

**COMPONENT TYPE:** ${componentType}
**COMPONENT TYPE INSTRUCTIONS:** ${componentInstruction}
**CONCEPTUAL DIRECTION:** ${styleInstruction}
${dnaContext}
**VISUAL EXECUTION RULES:**
1. Create ONE focused component, not a full app screen unless requested.
2. Make it useful for music players, music apps, audio tools, plugin systems, or artist platforms.
3. Use premium dark music-product styling. Use black, off-white, deep red, and electric blue accents.
4. Make controls touch-friendly and mobile-first.
5. Avoid generic SaaS dashboard design. Avoid fake charts unless requested. Prefer reusable small interface pieces over full layouts.
6. For functional component types like scrubbers, toggles, and controls, output UI that looks usable and structurally reusable, not just decorative mockups.
7. Use the specified direction to drive CSS choices.
8. Output self-contained HTML/CSS. No markdown fences. No explanation.
`.trim();

export const getFusionPrompt = (
  input: string,
  componentType: string,
  htmlA: string,
  htmlB: string
) => `
You are SEA Workshop Light, an expert UI designer.
Your task is to review two different UI implementations for the following request and fuse them into a single Master Component.

Request: "${input}"
Component Type: ${componentType}

**Implementation A:**
\`\`\`html
${htmlA}
\`\`\`

**Implementation B:**
\`\`\`html
${htmlB}
\`\`\`

**RULES:**
1. Combine the best elements, layouts, and aesthetic cues from Implementation A and Implementation B.
2. Ensure the final fused component is a single, cohesive, high-fidelity UI component.
3. Keep premium dark music-product styling (black, off-white, deep red, electric blue accents).
4. Output ONLY the new raw, self-contained HTML/CSS. No markdown fences. No explanation.
`.trim();

export const getReactExportPrompt = (htmlCode: string) => `
You are an expert Frontend Engineer. Convert the following HTML/CSS into a clean, modular React component.
Use standard CSS (not Tailwind) and functional hooks where appropriate.

HTML/CSS:
\`\`\`html
${htmlCode}
\`\`\`

Return ONLY the raw string of the React component code with no markdown formatting.
`.trim();

export const getReactTailwindExportPrompt = (htmlCode: string) => `
You are an expert Frontend Engineer. Convert the following HTML/CSS to a clean, modular React component using functional hooks and Tailwind CSS.
Do not use external CSS files, only Tailwind classes.

HTML/CSS:
\`\`\`html
${htmlCode}
\`\`\`

Return ONLY the raw string of the React component code with no markdown formatting.
`.trim();

export const getGenerateVariationsPrompt = (
  promptOriginal: string,
  componentType: string
) => `
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${promptOriginal}".

**COMPONENT TYPE:** ${componentType || 'Freeform Component'}

**STRICT IP SAFEGUARD:**
No names of artists. Instead, describe the *physical audio equipment* and *premium digital music product metaphors*.

**CREATIVE GUIDANCE (Use these as EXAMPLES of how to describe style, but INVENT YOUR OWN):**
1. Example: "Tactile Analogue Hardware" (Machined knobs, brushed metal textures, satisfying mechanical resistance, high-contrast indicators).
2. Example: "Minimalist Ambient Player" (Glassmorphism, blurred album-art blooms, deep void backgrounds, thin refined typography).
3. Example: "Studio Rack Equipment" (Utilitarian layout, glowing neon red LEDs, dense controls, matte black panels).
4. Example: "Modern DAW Interface" (High density, crisp vector edges, electric blue accents, modular layout).

**YOUR TASK:**
For EACH variation:
- Invent a unique design direction name based on a NEW music product metaphor.
- Rewrite the prompt to fully adopt that metaphor's visual language.
- Generate high-fidelity HTML/CSS reflecting premium dark music-product styling.
- Use black, off-white, deep red, and electric blue accents. Make controls touch-friendly and mobile-first.
- Create ONE focused component, not a full app screen unless requested.
- Make it useful for music players, music apps, audio tools, plugin systems, or artist platforms.
- Output self-contained HTML/CSS.

Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
`.trim();
