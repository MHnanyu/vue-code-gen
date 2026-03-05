# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue3 Page Generator - A tool for generating HTML page prototypes and UX designs based on natural language requirements. Users input their requirements, and the system generates Vue3 code / HTML prototypes.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Type-check and build for production
npm run preview  # Preview production build locally
```

## Tech Stack

- **Framework**: Vue 3.5 + TypeScript 5.9
- **Build**: Vite 7.3
- **State**: Pinia 3.0
- **Router**: Vue Router 4.6
- **UI Library**: Element Plus 2.9
- **Code Editor**: Monaco Editor 0.55
- **Utilities**: @vueuse/core

## Architecture

### State Management (Pinia Stores)

Two main stores located in `src/stores/`:

1. **generator.ts** - Code generation state
   - `prompt`: User's requirement text
   - `generatedFiles`: Array of GeneratedFile objects
   - `currentFile`: Currently selected file for editing
   - `generationHistory`: History entries (max 20)
   - Key action: `addFile()` auto-generates UUID and timestamp

2. **preview.ts** - Live preview state
   - `html`, `css`, `javascript`: Code fragments
   - `viewport`: 'desktop' | 'tablet' | 'mobile'
   - `combinedHtml`: Computed full HTML document for iframe preview

### Views Flow

```
HomeView (/)          -> Input requirements, select component library
    ↓
GeneratorView (/generator) -> View/edit generated code, live preview
    ↓
PreviewView (/preview)     -> Standalone HTML/CSS/JS editor + preview
```

### Key Component

**MonacoEditor.vue** - Wrapper around Monaco Editor with:
- v-model support via `value` prop + `update:value` emit
- Dynamic language switching
- Auto-layout on resize

## Code Conventions

- Use Element Plus components for UI elements
- Stores use composition API style with `defineStore('name', () => {...})`
- TypeScript interfaces are exported from stores for reuse
- Path alias `@/` maps to `src/`
