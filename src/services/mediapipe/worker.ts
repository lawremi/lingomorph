import { LlmInference, FilesetResolver } from '@mediapipe/tasks-genai';

let llm: LlmInference | null = null;

self.addEventListener('message', async (e: MessageEvent) => {
    const { type, payload } = e.data;

    try {
        if (type === 'load') {
            const { modelBlob } = payload;
            if (!modelBlob) throw new Error('No model blob provided');

            // Use local WASM files (copied to /wasm directory in dist)
            // Use self.location.origin to get the extension's root URL
            const wasmUrl = new URL('wasm', self.location.origin).toString();

            const visionGenAiFileset = await FilesetResolver.forGenAiTasks(wasmUrl);

            // Create a URL for the blob to pass to MediaPipe? 
            // Or typically MediaPipe task wants a path.
            // LlmInferenceOptions: modelAssetPath | modelAssetBuffer
            // We can pass the blob as a URL or get arrayBuffer.
            // Blob -> URL is easiest: URL.createObjectURL(blob)
            // But check if it supports it.
            // If we use modelAssetPath with a blob Object URL, it should work.

            const modelUrl = URL.createObjectURL(modelBlob);

            llm = await LlmInference.createFromOptions(visionGenAiFileset, {
                baseOptions: {
                    modelAssetPath: modelUrl,
                },
                // maxTokens, etc.
                maxTokens: 2000,
                randomSeed: 1,
                topK: 1,
                temperature: 0.1
            });

            self.postMessage({ type: 'loaded' });
        } else if (type === 'generate') {
            if (!llm) throw new Error('LLM not loaded');
            const { prompt } = payload;
            const response = await llm.generateResponse(prompt);
            self.postMessage({ type: 'result', payload: { text: response } });
        }
    } catch (err: any) {
        self.postMessage({ type: 'error', payload: err.message });
    }
});
