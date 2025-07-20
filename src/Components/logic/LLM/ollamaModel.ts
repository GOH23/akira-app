import { MmdModel } from "babylon-mmd/esm";
import { KokoroTTS } from "./kokoro-ts/kokoro";
export class OllamaModel {
    constructor(private model: MmdModel) {
        this.model = model;
    }
}