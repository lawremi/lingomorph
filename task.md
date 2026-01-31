# Lingomorph Task List

## Project Setup
- [x] Initialize project structure (Vite + React/TypeScript) <!-- id: 0 -->
- [x] Set up manifest.json for Chrome Extension (Side Panel) <!-- id: 1 -->
- [x] implementation_plan.md created and approved <!-- id: 2 -->

## Core Infrastructure
- [x] Implement Settings/Configuration (LLM Keys, AnkiConnect URL) <!-- id: 3 -->
- [x] Implement LLM Client (OpenAI/Gemini/Anthropic providers) <!-- id: 4 -->
- [x] Implement AnkiConnect Client <!-- id: 5 -->

## UI Development
- [x] Build Side Panel basic layout <!-- id: 6 -->
- [x] Implement Chat Interface (Console-style) <!-- id: 7 -->
- [x] Implement Word Interaction (Hover, Click) <!-- id: 8 -->
- [x] Add Difficulty Indicator <!-- id: 9 -->

## Core Logic
- [x] Implement Text Selection & Capture <!-- id: 10 -->
- [x] Implement "Adapt Text" pipeline (Fetch -> Simplify -> Render) <!-- id: 11 -->
- [x] Implement Lemma Matching Logic <!-- id: 12 -->
- [x] Implement Vocabulary Sync (Anki -> Local DB) <!-- id: 13 -->
- [x] Implement LLM-based Vocabulary Normalization during Sync <!-- id: 14 -->
- [x] Add Settings Toggle for LLM Normalization (Default Off) <!-- id: 16 -->
- [x] Implement Heuristic Normalization (Korean: refined logic) <!-- id: 17 -->
- [x] Improve Sync Error Handling (Retries & UI Feedback) <!-- id: 18 -->
- [x] Enhance Adaptation Estimates (Frequency/Level + Lemma refinements) <!-- id: 19 -->
- [x] Refactor Adaptation View to "Notebook" Style (Persistent History) <!-- id: 20 -->
- [x] Implement "Add to Anki" Feature for New Words <!-- id: 21 -->

## Verification
- [x] Verify End-to-End flow with mocked LLM/Anki <!-- id: 15 -->
- [x] Create Walkthrough <!-- id: 15 -->

## UI Polish & Fixes (Current)
- [x] Fix Logo Size in Sidebar <!-- id: 16 -->
- [x] Add Language Dropdown (include Korean) <!-- id: 17 -->
- [x] Fix Settings View Scrolling <!-- id: 18 -->
