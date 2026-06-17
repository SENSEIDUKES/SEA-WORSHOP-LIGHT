# SEA Workshop Light 🎛️⚡

**SEA Workshop Light** is an advanced, high-fidelity interactive playground for music-tech creators and web developers. It allows users to rapidly generate, preview, customize, and export stunning music-product and audio UI elements utilizing advanced generative AI models. 

Designed like a professional creative instrument, it keeps AI focus tight on beautiful, product-useful audio widgets rather than drifting into sprawling, generic dashboard containers.

---

## 🚀 Key Architectural Upgrades

### 1. Component Type Presets (Creative Constraints) 🎹
Instead of working with a blank canvas prone to model drift, users can tap specialized component mode presets:
*   **Custom Icon**: Small, clear icon-style components built for ultra-mobile sizes.
*   **Mini Badge**: Small, high-contrast badges for metadata (e.g., BPM, Key, or Scale).
*   **Player Button**: Prominent controls (Play, Pause, Record) designed with rich tactile visual design.
*   **Scrubber Visual**: Linear sliders and timeline progression elements.
*   **Waveform Visual**: Visual representations of playback, soundwaves, or transient waveforms.
*   **Plugin Tile**: Cards representing digital audio workstation effects, channels, or virtual instruments.
*   **Mini Settings Panel**: Compact utility bars containing micro-inputs, toggles, and feedback displays.
*   **Decorative Effect**: Purely ambient, reactive feedback animations or decorative sonic designs.
*   **Freeform**: Unstructured prompt-to-component rendering.

### 2. Style DNA Panel 🔬
An interactive visual configuration desk let users shape the "DNA" of the component prior to triggering model execution:
*   **Theme**: Dark ↔ Light
*   **Complexity**: Minimal ↔ Expressive
*   **Texture**: Flat ↔ Glassy
*   **Vibe**: Clean ↔ Experimental
*   **Edge**: Soft ↔ Aggressive
*   **Era**: Modern ↔ Retro

The app translates these sliders into structured attributes parsed by the generation prompts to yield highly precise aesthetic directions.

### 3. Cline-Inspired Model Fetching & API System 📡
A robust API backend system with streamlined key entry:
*   **Dynamic Discovery**: Once a provider is chosen (e.g., Gemini or OpenRouter), entering your API key fires a debounce worker that fetches and displays the available matching model IDs in an automated dropdown select menu (just like `Cline`).
*   **Multi-Provider support**: Backed by a decoupled integration layer supporting Gemini, OpenRouter, Ollama, and LM Studio.
*   **Error Intelligence**: Real-time HTTP 401 handling blocks bad states and delivers clear model/provider debugging feedback.

---

## 🛠️ Project Structure

```bash
├── components/
│   ├── ArtifactCard.tsx           # Manages output iframe sandbox, code display copy, and variation layouts
│   ├── DottedGlowBackground.tsx   # Premium workspace background ambient aesthetics
│   ├── Icons.tsx                  # Pre-compiled high-performance SVG visual glyphs (including Sliders settings)
│   ├── SettingsPanel.tsx          # Dynamic API provider setup with auto-model discovery
│   └── SideDrawer.tsx             # Interactive slider panel to view live HTML source, JSON schema and exports
├── ai.ts                          # Unified SDK bridge & stream handling wrapper
├── constants.ts                   # Initial prompts and Component Presets configuration
├── index.css                      # Master glassmorphic workspace styles, custom retro theme, and DNA animations
├── index.tsx                      # Primary App layout, dictation controller, dynamic state coordinators, and feedback streams
├── metadata.json                  # AI Studio context registry
├── types.ts                       # Standard TypeScript type definitions (Sessions, Artifacts, Settings)
└── utils.ts                       # Secure layout generators and UI helpers
```

---

## 🧑‍💻 Technical Stack & Integration

*   **Runtime Framework**: React 19 + TypeScript + Vite.
*   **Styling Engine**: Modern high-contrast Tailwind styling combined with frosted-glass CSS backdrops.
*   **Speech Integration**: Web Speech API dictation support for touch-free command prompts.
*   **Persistence**: Secure local storage synchronization (`localStorage`) keeping keys and settings persisted across application lifecycle.

---

*Created by **SEIHouse**.*
