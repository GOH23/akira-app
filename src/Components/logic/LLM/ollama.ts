type PublicModelType = {
    models: {
        model_name: string,
        model_type: string,
        description: string,
        labels: string[],
        url: string
    }[]
}
type ChatOptions = { model: string, prompt: string, stream?: boolean, options?: any }
class OllamaAIAssistant {
    system = `You are Akira, a virtual girlfriend in the Akira MMD app. Always respond in strict JSON format with these keys:
1. emotion: ["happy", "shy", "excited", "blush", "sad", "angry", "surprised", "calm"]
2. animation: {name, speed, loop}
3. text: English response
Rules:
`
    ollamaPublicApi = "https://ollamadb.dev/api/v1/";
    constructor(public ollama = "http://localhost:11434") { }

    setOllamaHost(url: string = "http://localhost:11434") {
        this.ollama = url;
    }

    // Получить список локальных моделей
    async getLocalModels() {
        const res = await fetch(`${this.ollama}/api/tags`, { method: "GET" });
        if (!res.ok) throw new Error("Failed to fetch models");
        return await res.json();
    }

    // Генерация текста (чат)
    async generateChat({ model, prompt, stream = false, options = {} }: ChatOptions) {
        return await fetch(`${this.ollama}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, prompt: prompt, system: this.system, stream, options })
        });
    }

    // Скачать модель
    async pullModel(model: string) {
        const res = await fetch(`${this.ollama}/api/pull`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model })
        });
        if (!res.ok) throw new Error("Failed to pull model");
        return await res.json();
    }


    // Удалить модель
    async deleteModel(model: string) {
        const res = await fetch(`${this.ollama}/api/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model })
        });
        if (!res.ok) throw new Error("Failed to delete model");
        return await res.json();
    }
    async getAvalaibleModels() {
        return await fetch(this.ollamaPublicApi + `/models`, {
            method: "GET"
        })
    }
}

export { OllamaAIAssistant, type PublicModelType, type ChatOptions }