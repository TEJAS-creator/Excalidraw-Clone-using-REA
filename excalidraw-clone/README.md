# ✏️ Excalidraw Studio (Clone built with REA)

A lightweight, high-performance, and modular clone of **Excalidraw** reverse-engineered and built from scratch using the **REA (Reverse Engineer Anything)** methodology.

[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Rough.js](https://img.shields.io/badge/Rough.js-Hand--Drawn-f08c00?style=flat-square)](https://roughjs.com/)

---

## 🚀 Features

- **Infinite Canvas & Focal Zooming:** Smooth panning and zooming centered precisely around the mouse pointer without drift.
- **Hand-Drawn Aesthetics (`rough.js`):** Signature sketchy hand-drawn lines, rectangles, diamonds, ellipses, arrows, freehand pencil drawings, and text.
- **Seeded Render Stability:** Stable deterministic random seeds per element to prevent jitter during 60 FPS viewport pans and selections.
- **Element Manipulation:** Select, move, multi-select (marquee box & Shift-click), and 8-cardinal handle scaling.
- **Visual Property Inspector:** Custom stroke/fill colors, fill styles (hachure, cross-hatch, solid, dots, zigzag), stroke width, stroke style, roughness (sloppiness), and opacity.
- **Full Undo / Redo & Keybindings:** Multi-level history stacks with native hotkeys (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+D`, `Delete`, `Escape`).
- **Interoperable JSON & Image Export:** Standard `.excalidraw` JSON scene schema compatibility, crisp 2x/3x Retina PNG export, and direct clipboard copying with confetti.

---

## ⚡ Quick Start

```bash
# Navigate to the app directory
cd excalidraw-clone

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Step-by-Step: How to Clone Any Web App Using REA

The **REA (Reverse Engineer Anything)** toolkit allows an AI agent or engineer to analyze any application (web, Electron, native binary) without source access and reconstruct a clean, clean-room clone.

### Workflow:
1. **Repository Setup:**
   Clone the REA repository into your workspace:
   ```bash
   gh repo clone morluto/rea
   ```
2. **Reconnaissance & Architecture Deconstruction:**
   Use REA’s web runtime observation, DevTools protocol bridges, and JavaScript application graph inspection to identify:
   - Screen-to-canvas coordinate projections.
   - Core event listeners (pointer, wheel, touch).
   - Data structures (`elements[]`, `appState`) and state machines.
   - Drawing engine mechanics (e.g., HTML5 2D Canvas + `rough.js`).
3. **Architecture Blueprint:**
   Define clean interfaces and mathematical projection models before writing application code.
4. **Scaffolding & Implementation:**
   Initialize a modern, modular React/TypeScript/Vite stack with decoupled modules (`CanvasRenderer`, `Toolbar`, `PropertiesPanel`, `useCanvasInteractions`).
5. **Testing & Automated Browser Verification:**
   Verify the reconstructed app using browser subagents or CDP automation to ensure performance, visual fidelity, and export compatibility.

---

## 📋 The Generalized REA Cloning Prompt

Use this standardized prompt template with your AI coding agent to reverse-engineer and clone any target application:

```markdown
You are an expert AI software architect and reverse-engineering specialist. Your task is to analyze, reverse-engineer, and rebuild a functional clone of [TARGET APPLICATION NAME] using the tooling and patterns provided in the local or remote REA repository (`https://github.com/morluto/rea.git`).

### Objectives
1. **Analyze with REA:** Utilize the REA toolkit to inspect [TARGET APPLICATION NAME]'s web app architecture, event handling loops, state management, and rendering/interaction pipeline (specifically [KEY MECHANIC 1, e.g., canvas rendering, audio synthesis, graph editing], pointer/touch event capture, and [SERIALIZATION FORMAT, e.g., JSON export/import]).
2. **Deconstruct Core Features:** Break down the core mechanics required for the clone:
   - [Core Feature 1: e.g., Infinite canvas / viewport transformations]
   - [Core Feature 2: e.g., Primitives, creation tools, and freehand drawing]
   - [Core Feature 3: e.g., Selection, dragging, resizing, and property modification]
   - [Core Feature 4: e.g., Local storage persistence and state serialization]
3. **Build the Application:** Scaffold and implement a clean, modern, modular web application (using React, TypeScript, and modern CSS / Canvas / SVG) that replicates these core features cleanly from scratch based on your reverse-engineering findings.

### Step-by-Step Execution Plan
- **Step 1 (Inspection & Recon):** Clone or reference `morluto/rea` to hook into browser/app inspection tools. Analyze how the target application handles input events, coordinate transformations, and rendering reconciliation.
- **Step 2 (Architecture & State Design):** Design a clean state store for scene entities and application state, handling undo/redo history stacks and active interaction modes.
- **Step 3 (Core Implementation):** Write the modular components:
  - `CanvasRenderer.tsx` / `MainView.tsx`: Handles primary view rendering and visual pipeline.
  - `Toolbar.tsx`: Tool and mode selection with hotkey bindings.
  - `interactionHandler.ts`: Manages pointer/touch down, move, and up lifecycle.
  - Property inspectors, modals, and export utilities.
- **Step 4 (Testing & Polish):** Ensure smooth 60 FPS performance, responsive styling, and clean export/persistence features.

Begin by initializing the workspace, setting up the necessary dependencies, and outputting the architecture blueprint before writing the implementation files.
```

---

## 📂 Repository Structure

```
.
├── excalidraw-clone/          # Reconstructed Excalidraw web application
│   ├── src/
│   │   ├── components/        # CanvasRenderer, Toolbar, PropertiesPanel, TopBar, ExportModal
│   │   ├── utils/             # Coordinates math, hitTest, roughUtils, exportUtils, storage
│   │   ├── useCanvasInteractions.ts  # Event state machine
│   │   ├── types.ts           # Schema & TypeScript definitions
│   │   ├── constants.ts       # Color palettes, styles, shortcuts
│   │   ├── App.tsx            # Main application shell
│   │   └── index.css          # Design system & visual styling
│   └── package.json
├── rea/                       # Cloned REA (Reverse Engineer Anything) toolkit
└── README.md
```
