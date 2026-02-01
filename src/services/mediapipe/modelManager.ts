import { get, set, del } from 'idb-keyval';

// "Gemma-3-12B-IT" from LiteRT community (Requires License)

const LITERT_REPO = 'https://huggingface.co/litert-community/Gemma3-12B-IT/resolve/main/gemma3-12b-it-int4-web.task';

const MODEL_KEY = 'mediapipe-llm-model';

export class ModelManager {
    static async isModelCached(): Promise<boolean> {
        try {
            const model = await get(MODEL_KEY);
            return !!model;
        } catch (e) {
            console.error("Error checking model cache:", e);
            return false;
        }
    }

    static async getModel(): Promise<Blob | undefined> {
        return get(MODEL_KEY);
    }

    static async getModelSize(): Promise<string | null> {
        try {
            const model = await get<Blob>(MODEL_KEY);
            if (!model) return null;

            const bytes = model.size;
            if (bytes === 0) return '0 B';

            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        } catch (e) {
            return null;
        }
    }

    static async downloadModel(
        token?: string,
        onProgress?: (progress: number) => void
    ): Promise<Blob> {
        const url = LITERT_REPO;
        console.log(`Downloading model from ${url}...`);

        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (response.status === 401 || response.status === 403) {
            throw new Error('Access denied. Please check your Hugging Face Token and ensure you have accepted the model license at https://huggingface.co/litert-community/Gemma3-12B-IT');
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is null');

        const stream = new ReadableStream({
            start(controller) {
                function push() {
                    // Force non-null assertion or check because we threw above? 
                    // The compiler might not know valid scope.
                    if (!reader) return;

                    reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        loaded += value.byteLength;
                        if (total && onProgress) {
                            onProgress(Math.round((loaded / total) * 100));
                        }
                        controller.enqueue(value);
                        push();
                    });
                }
                push();
            }
        });

        const newResponse = new Response(stream);
        const blob = await newResponse.blob();

        await set(MODEL_KEY, blob);
        console.log("Model cached successfully.");
        return blob;
    }

    static async clearCache(): Promise<void> {
        await del(MODEL_KEY);
        console.log("Model cache cleared.");
    }
}
