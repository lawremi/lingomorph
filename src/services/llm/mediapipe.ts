import type { LLMProvider, LLMResponse } from './index';
import { ModelManager } from '../mediapipe/modelManager';

export class MediaPipeProvider implements LLMProvider {
    id = 'mediapipe';
    name = 'MediaPipe (On-Device)';
    private worker: Worker | null = null;
    private isLoaded = false;
    private loadPromise: Promise<void> | null = null;

    constructor() {
        // Initialize worker
        // Initialize worker
        this.worker = new Worker(new URL('../mediapipe/worker.ts', import.meta.url));

        this.worker.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'error') {
                console.error('MediaPipe Worker Error:', payload);
            } else if (type === 'loaded') {
                this.isLoaded = true;
                console.log('MediaPipe LLM Loaded in Worker');
            }
        };
    }

    private async ensureLoaded() {
        if (this.isLoaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = new Promise(async (resolve, reject) => {
            try {
                // Check if model exists
                const exists = await ModelManager.isModelCached();
                if (!exists) {
                    throw new Error('Model not downloaded. Please download it in Settings.');
                }

                const blob = await ModelManager.getModel();
                if (!blob) throw new Error('Failed to load model from cache.');

                // Send to worker
                if (!this.worker) throw new Error('Worker not initialized');

                const handler = (e: MessageEvent) => {
                    if (e.data.type === 'loaded') {
                        this.worker?.removeEventListener('message', handler);
                        resolve();
                    } else if (e.data.type === 'error') {
                        this.worker?.removeEventListener('message', handler);
                        reject(new Error(e.data.payload));
                    }
                };
                this.worker.addEventListener('message', handler);

                this.worker.postMessage({ type: 'load', payload: { modelBlob: blob } });

            } catch (e) {
                reject(e);
            }
        });
        return this.loadPromise;
    }

    async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        await this.ensureLoaded();

        return new Promise((resolve, reject) => {
            if (!this.worker) return reject(new Error('Worker died'));

            const handler = (e: MessageEvent) => {
                const { type, payload } = e.data;
                if (type === 'result') {
                    this.worker?.removeEventListener('message', handler);
                    resolve({ text: payload.text });
                } else if (type === 'error') {
                    this.worker?.removeEventListener('message', handler);
                    reject(new Error(payload));
                }
            };
            this.worker.addEventListener('message', handler);

            // Apply Gemma Chat Template
            // <start_of_turn>user\n{system}\n{user}<end_of_turn>\n<start_of_turn>model\n
            const fullPrompt = systemPrompt
                ? `<start_of_turn>user\n${systemPrompt}\n\n${prompt}<end_of_turn>\n<start_of_turn>model\n`
                : `<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`;
            this.worker.postMessage({ type: 'generate', payload: { prompt: fullPrompt } });
        });
    }
}
