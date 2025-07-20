import { KokoroTTS } from "./kokoro-ts/kokoro";

let tts: KokoroTTS | null = null;

self.onmessage = async (e) => {
  const { type, model_id, text } = e.data;
  if (type === "init") {
    tts = await KokoroTTS.from_pretrained(model_id, {
      dtype: "q8",
      device: "wasm",
    });
    self.postMessage({ type: "init_done" });
  }
  if (type === "generate" && tts) {
    const audio = await tts.generate(text);
    self.postMessage({ type: "audio", audio: audio.toBlob() });
  }
}; 