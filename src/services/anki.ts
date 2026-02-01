export class AnkiConnect {
    private url: string;
    constructor(url: string = 'http://127.0.0.1:8765') {
        this.url = url;
    }

    async invoke(action: string, params: any = {}) {
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                mode: 'cors', // AnkiConnect needs to be configured for this or running in extension
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action, version: 6, params })
            });

            const result = await response.json();

            if (Object.getOwnPropertyNames(result).length != 2) {
                throw new Error('response has an unexpected number of fields');
            }
            if (!result.hasOwnProperty('error')) {
                throw new Error('response is missing required error field');
            }
            if (!result.hasOwnProperty('result')) {
                throw new Error('response is missing required result field');
            }
            if (result.error) {
                throw new Error(result.error);
            }
            return result.result;
        } catch (e) {
            console.error('AnkiConnect Error:', e);
            throw e;
        }
    }

    async getDeckNames(): Promise<string[]> {
        return this.invoke('deckNames');
    }

    async getModelNames(): Promise<string[]> {
        return this.invoke('modelNames');
    }

    async getModelFieldNames(modelName: string): Promise<string[]> {
        return this.invoke('modelFieldNames', { modelName });
    }

    async addNote(deckName: string, modelName: string, fields: Record<string, string>, tags: string[] = []) {
        return this.invoke('addNote', {
            note: {
                deckName,
                modelName,
                fields,
                tags
            }
        });
    }

    async findNotes(query: string): Promise<number[]> {
        return this.invoke('findNotes', { query });
    }

    async notesInfo(notes: number[]): Promise<any[]> {
        return this.invoke('notesInfo', { notes });
    }
}
