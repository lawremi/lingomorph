# Lingomorph Walkthrough

Lingomorph is a Chrome Extension that adapts web content to your precise language level. It uses your Anki vocabulary to identify what you already know and simplifies text so that you learn efficiently.

## Installation

1. **Build the extension**:
    ```bash
    npm install
    npm run build
    ```
2. **Load in Chrome**:
    - Open `chrome://extensions`
    - Enable **Developer mode** (toggle in the top right).
    - Click **Load unpacked**.
    - Select the `dist` folder in this project directory.

## Configuration & Setup

Before using the extension, you should configure it to match your learning profile.

1. **Open the Side Panel**:
    - Click the Lingomorph extension icon (puzzle piece).
    - Select "Open Side Panel".
2. **Configure Settings** (Gear Tab):
    - **Languages**: Set your **Target Language** (e.g., Spanish) and **Native Language**.
    - **AI Provider**: Choose Google Gemini, OpenAI, or Anthropic and enter your API Key.
    - **Anki Connection**:
        - Ensure [Anki](https://apps.ankiweb.net/) is open.
        - Ensure [AnkiConnect](https://ankiweb.net/shared/info/2055492159) is installed.
3. **Sync Vocabulary** (Crucial Step):
    - In the Settings panel, scroll to the **Vocabulary Sync** section.
    - Click **"Sync Now"**.
    - *What happens?* Lingomorph fetches your cards from Anki decks that match your Target Language. This tells the AI which words you already know, ensuring the adapted text is perfectly tailored to you.

## Features

### 1. Adapt Text to Your Level
There are two ways to use this feature:
- **Selection Capture**: Highlight any text on a webpage, right-click, and select **"Adapt text to your [Language] level"**.
- **Manual Input**: Copy text, open the **Adapt** tab (Sparkles icon), paste it, and click "Adapt Text".

The AI will rewrite the text to be comprehensible, maintaining your "known" words and introducing a healthy ratio of new vocabulary.

### 2. Interactive Word Learning
The adapted text is fully interactive:
- **Color Coding**:
    - **Purple**: Potential new words.
    - **Gray**: Words found in your Anki collection (Known).
- **Click to Analyze**: Click any word to see its **dictionary form** (lemma) and translation.

## Troubleshooting
- **Sync Failed**: Check that Anki is running and the AnkiConnect add-on is active. The default URL is `http://127.0.0.1:8765`.
- **Context Menu Missing**: If the context menu option doesn't appear, try refreshing the webpage or reloading the extension.
