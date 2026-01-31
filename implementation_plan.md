# Implementation Plan - Lingomorph

## 1. Project Structure
- **Framework**: React + TypeScript (Vite)
- **Extension Wrapper**: `manifest.json` targeting Chrome Side Panel API.
- **State Management**: React Context or lightweight store (Zustand/Jotai) for user settings and vocabulary cache.
- **Storage**: 
  - `chrome.storage.local` for settings (API keys, Anki URL).
  - `IndexedDB` (via `idb` library) for Lemmas and Vocabulary (to reduce latency).

## 2. Chrome Extension Architecture
- `manifest.json`: version 3.
  - Permissions: `sidePanel`, `activeTab`, `scripting`, `storage`.
  - Host Permissions: `<all_urls>` (to read content).
- `background.js`: Handles context menu events, installation.
- `sidepanel.html` + `src/main.tsx`: The main React application.
- `content_script.js`: For capturing text and maybe handling interactions on the page if needed (though Side Panel is preferred for display).

## 3. Core Modules

### 3.1 LLM Client (`src/services/llm`)
- Interface `LLMProvider` { `complete(prompt, context): Promise<string>` }
- Implementations: 
  - `GeminiProvider` (using Google AI SDK or REST)
  - `OpenAIProvider`
  - `AnthropicProvider`
- **Prompt Engineering**:
  - System prompt to act as a language tutor.
  - Input: User text + User Vocabulary (subset) -> Output: Analysis/Simplification.
  - JSON mode or structured output if possible for accurate parsing.

### 3.2 Anki Connect (`src/services/anki`)
- `AnkiConnect` API wrapper.
- `syncVocabulary()`: Fetch user's known words/notes.
- `addWord(word, definition, context)`: Add new note.

### 3.3 Text Processing (`src/services/text`)
- Lemma extraction: likely need a lightweight local NLP or rely on LLM to return lemmas for words. 
- *Decision*: Relying purely on LLM for lemma extraction for every word might be slow/expensive. 
- *Optimization*: Download a basic lemma dictionary or use a library like `compromise` or `wink-lemmatizer` locally if feasible, OR batch request to LLM. Given the "difficult to find content" requirement, accurate difficulty assessment needs accurate lemma matching.
- **Hybrid Approach**: Use LLM to "adapt" text. The LLM response should ideally include metadata about changed words.

### 3.4 UI Components (`src/components`)
- **ChatConsole**: The main log of interactions.
- **AdaptationView**: Displays the adapted text.
  - **InteractiveWord**: Component that handles hover (definition) and click (actions).
  - **DifficultyMeter**: Visual indicator.
- **Settings**: API Key configuration.

## 4. Workflows

### 4.1 "Adapt Page" / "Adapt Selection"
1. **Context Menu**: Add "Adapt Selection" context menu item.
2. **Side Panel**: Add "Grab Selection" button in Adaptation View.
3. **Content Script**: 
   - Listen for runtime messages to get current selection.
   - (Optional) Listen for right-click events to capture context.
4. **Data Flow**: Content Script -> Runtime Message -> Side Panel.

### 4.2 Vocabulary Sync
1. On load, check IndexedDB for Anki cache.
2. If stale, fetch deck from AnkiConnect.
3. Update IndexDB.

## 5. Development Steps
1. **Manifest & Basic Side Panel**: Get the extension running in Chrome.
2. **Settings**: Allow entering API keys.
3. **LLM Connection**: Verify generic request to Gemini.
4. **Anki Connection**: Verify status check to localhost:8765.
5. **Text Capture**: Implement script to get text from active tab.
6. **Adaptation Logic**: Build the prompts and parsing.
7. **Interactive UI**: Build the word clicking/hovering.

## 6. Tech Stack Details
- **Build Tool**: Vite (configured for multiple entry points if needed, or single SPA for sidepanel).
- **Styling**: Vanilla CSS (CSS Modules or standard).
- **Icons**: Lucide-React.
