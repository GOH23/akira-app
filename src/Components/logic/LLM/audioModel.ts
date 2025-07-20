import { KokoroTTS } from "./kokoro-ts/kokoro";
// @ts-ignore
import TTSWorker from "worker-loader!./tts.worker.ts";

export class AudioModel {
    model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
    worker: Worker;
    isReady: boolean = false;
    tts: KokoroTTS;

    constructor() {
        this.worker = new TTSWorker();
        this.worker.onmessage = (e) => {
            if (e.data.type === "init_done") {
                this.isReady = true;
            }
        };
        this.worker.postMessage({ type: "init", model_id: this.model_id });
    }

    loadModel = async () => {
        const tts = await KokoroTTS.from_pretrained(this.model_id, {
            dtype: "q8", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
            device: "wasm", // Options: "wasm", "webgpu" (web) or "cpu" (node). If using "webgpu", we recommend using dtype="fp32".
        });
        this.tts = tts;
    }

    textToSpeech = (text: string) => {
        return new Promise((resolve) => {
            this.worker.onmessage = (e) => {
                
                if (e.data.type === "audio") resolve(e.data.audio);
            };
            this.worker.postMessage({ type: "generate", text });
        });
    }
}