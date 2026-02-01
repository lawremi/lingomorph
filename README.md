# Lingomorph

**Lingomorph** is an AI-powered browser extension that turns the web into a personalized language learning experience. It adapts any text on a webpage to your specific proficiency level, reinforcing vocabulary you know and introducing new words at a comprehensible pace.

## 🧠 Why Lingomorph?

Learning a language is a multifaceted challenge involving input/output, text/speech, and the progression from words to sentences. For many adult learners, **text input** is the most effective starting point: it removes the time pressure of speech and allows for deep engagement with the material.

The web offers an infinite supply of text, but finding content that matches your exact proficiency level is nearly impossible. **Lingomorph bridges this gap.** By using Large Language Models (LLMs) to adapt real-world content to your unique vocabulary "fingerprint," it creates the perfect study material—challenging enough to learn, but simple enough to understand. It transforms the entire internet into a graded reader tailored just for you.

## 🚀 Key Features

*   **Intelligent Text Adaptation**: Rewrites complex text into simplified versions tailored to your level (A1-C2).
*   **Vocabulary Fingerprinting**: Analyzes your known vocabulary (from Anki) to create a unique "Fingerprint" that guides the AI's adaptation, ensuring content is neither too hard nor too boring.
*   **Multi-Provider Support**: Seamlessly integrates with **Google Gemini**, **OpenAI**, and **Anthropic** for state-of-the-art performance.
*   **MediaPipe On-Device AI**: Alternatively, run powerful LLMs (like **Gemma 3 12B**) entirely locally in your browser for privacy and speed, with no API costs (dedicated GPU and 16GB+ RAM recommended).
*   **Seamless Anki Integration**:
    *   **Auto-Sync**: Automatically fetches your review history and card status.
    *   **One-Click Add**: Add new words directly to your Anki decks with definitions and context.
    *   **Review Tracking**: Highlights words you are currently learning (Red) vs. new words (Blue) vs. words you have mastered.
*   **Interactive Analysis**: Hover over any word to see its dictionary form, definition, and CEFR level.
*   **Daily Goals & Streaks**: Track your daily study progress and maintain a learning streak.

## 🛠️ Technology Stack

*   **Frontend**: React, TypeScript, Tailwind CSS
*   **Build Tool**: Vite
*   **AI Inference**: Google MediaPipe (WebGPU), LiteRT
*   **Storage**: IndexedDB (idb-keyval), Chrome Storage
*   **Integration**: AnkiConnect

## 📦 Installation & Setup

### Prerequisites
*   Google Chrome (or Chromium-based browser)
*   optional: **Anki** (running locally with [AnkiConnect](https://ankiweb.net/shared/info/2055492159) installed) for vocabulary sync.

### Installation Options

#### Option 1: Download Release (Recommended)
1.  Go to the [Releases](https://github.com/lawremi/lingomorph/releases) page.
2.  Download the latest `lingomorph-extension.zip`.
3.  Unzip the file.
4.  Proceed to **Loading into Chrome**.

#### Option 2: Build from Source
**Note**: You only need Node.js if you are building the extension from source.

1.  **Install Node.js (v18+)**
2.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/lingomorph.git
    cd lingomorph
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Build the extension**:
    ```bash
    npm run build
    ```
    This will generate a `dist` folder.

### Loading into Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Select the **unzipped release folder** (Option 1) or the `dist` directory (Option 2).
5.  Pin the Lingomorph icon to your toolbar!

## ⚙️ Configuration

### 1. General Setup
*   **Languages**: Go to Settings and configure your **Native Language** (for definitions) and **Target Language** (the language you are learning).

### 2. AI Provider Setup
Lingomorph supports multiple AI providers. You can configure this in the **Settings** tab.

*   **Google Gemini / OpenAI / Anthropic**: Enter your API Key.
*   **MediaPipe (Local)**:
    *   Select "MediaPipe (On-Device)" in the Quick Start Wizard or Settings.
    *   **Warning**: This downloads the **Gemma 3 12B** model (~8GB).
    *   **Requirements**: 16GB+ RAM and a decent GPU are highly recommended.
    *   You will need a Hugging Face Access Token with permissions to access the `litert-community/Gemma3-12B-IT` model.

### 3. Anki Connection
1.  Ensure Anki is running.
2.  Install the **AnkiConnect** add-on (Code: `2055492159`).
3.  In Lingomorph Settings, confirm the AnkiConnect URL (default: `http://127.0.0.1:8765`).
4.  **Note Type**: Select the Anki Note Type (Model) you wish to use for new words (e.g., "Basic") and explicitly map the **Front** and **Back** fields.
5.  The extension will auto-sync your vocabulary on startup and update daily.

## 📖 Usage

1.  **Open the Side Panel**: Click the extension icon to open the Lingomorph side panel.
2.  **Adapt Text**:
    *   **Select & Adapt**: Select text on any webpage, right-click, and choose "Adapt to your level of `<language>`".
    *   **Paste & Adapt**: Paste text directly into the input box in the side panel.
    *   **Grab Selection**: Click the "Grab Selection" button in the panel to pull text from the active tab.
3.  **Learn**:
    *   Read the adapted text.
    *   Hover over words to see translations.
    *   Click words to add them to Anki.
    *   Chat with the AI to ask questions about grammar or context.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
