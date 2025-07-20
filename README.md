# Akira-app - Next-Generation Motion Capture for MMD/Blender
[![License](https://img.shields.io/badge/License-MIT-ff69b4)](https://github.com/GOH23/akira-app)  
[![Version](https://img.shields.io/badge/version-1.1.1-brightgreen)](https://github.com/GOH23/akira-app)  
[![GitHub Issues](https://img.shields.io/github/issues/GOH23/akira-app)](https://github.com/GOH23/akira-app/issues)  

**Revolutionizing motion capture with real-time AI-powered animation workflows!**  
Akira-app combines Google MediaPipe's cutting-edge pose estimation with Electron's cross-platform capabilities to deliver **professional-grade 3D animation tools** for creators across industries - from MMD enthusiasts to game developers, VR creators, and digital artists. Create stunning animations in minutes using webcam input, no specialized hardware required.  

## 🔥 Key Features  
### 🧠 AI-Driven Innovation  
- **Next-Gen Motion Capture**: Leverage Google MediaPipe's enhanced pose estimation with **new hybrid tracking algorithms** combining 2D video analysis and 3D skeletal modeling.
- **Cross-Platform Power**: Web-based Electron framework works seamlessly on Windows/macOS/Linux.
- **GPU Turbocharging**: NVIDIA/AMD GPU acceleration enables 3x faster processing for complex animations. 

### 🌍 Global Accessibility  
- **Multi-Language Support** ✅  
  - ✅ **Now Available**: English, Russian, Japanese, Chinese 
  - 🌐 Easily extendable localization system for future language additions  

### 🎨 Creative Flexibility  
- **Universal Animation Tools**:  
  - Real-time motion capture from webcam/video input  
  - Multi-scene workspace with timeline synchronization  
  - MP4 export/Vmd export/glTF export
- **Visual Customization**:  
  - Dark/Purple/White themes with dynamic UI adaptation  
  - Bone Structure Visualizer for precise skeletal adjustments  

### ⚡ Efficiency Optimizations  
- **Zero Setup Required**: Works instantly in browser with WebGL 2.0 compatible GPUs  
- **Hardware-Aware Performance**: Automatic resource management for optimal frame rates  
- **Streamlined Workflow**: Capture → Adjust → Export in 3 simple steps  

---

## 🚀 Quick Start Guide  
### Prerequisites  
- Node.js v16+  
- Electron-compatible browser (Chrome 90+/Edge recommended)  
- WebGL 2.0 compatible GPU  

### Installation  
```bash
# Clone repository
git clone https://github.com/GOH23/akira-app.git

# Install dependencies
npm install

# Launch Electron app
npm start
```

---

## 🖥️ Performance Best Practices  
1. Enable browser "Hardware Acceleration" in settings  
2. Use Chrome/Edge for best WebGL performance  
3. Optimal resolution: 1280x720 for real-time preview  
4. Close background apps during capture sessions  
5. Utilize GPU acceleration toggle in settings for complex scenes    

---

## 🧑‍💻 How to Use the Neural Network (AI Assistant)

Akira-app features an integrated AI Assistant powered by local Large Language Models (LLMs) via [Ollama](https://ollama.com/). This allows you to chat with Akira, generate responses, and trigger character animations using natural language.

### How to Use
1. **Open the AI Assistant**: Click the AI icon or open the "AI Assistant" drawer in the app interface.
2. **Type your message**: Enter your prompt or question in the chat input field.
3. **Send**: Press Enter or click the send button. Akira will respond using the selected LLM model, and may trigger an animation and voice response.
4. **Change Language**: The AI will reply in the language selected in the app settings (English, Russian, Japanese, Chinese).
5. **Audio Output**: Enable or disable voice output using the toggle in the chat footer.

> **Note:** For the AI Assistant to work, you must have a local Ollama server running with a compatible LLM model installed (see below).

---

## 🤖 How to Install and Use Ollama for Local LLM

Ollama is a local LLM server that allows you to run models like Llama 3, Mistral, Gemma, and others on your own machine. Akira-app connects to Ollama to provide AI chat and animation features.

### 1. Install Ollama
- **Windows/macOS/Linux:**
  - Go to [https://ollama.com/download](https://ollama.com/download) and download the installer for your OS.
  - Follow the installation instructions for your platform.

### 2. Run Ollama
- After installation, start the Ollama server:
  - **Windows:** Launch "Ollama" from the Start menu or run `ollama serve` in Command Prompt.
  - **macOS/Linux:** Run `ollama serve` in Terminal.
- By default, Ollama runs at `http://localhost:11434`.

### 3. Pull a Model
- In Terminal/Command Prompt, run:
  ```bash
  ollama pull llama3
  ```
  Or choose another supported model (see [Ollama models](https://ollama.com/library)).

### 4. Configure Akira-app
- In the app, open **Settings** > **Ollama Host** and ensure the URL matches your Ollama server (default: `http://localhost:11434`).
- Select the desired model from the model dropdown.

### 5. Start Using AI
- Open the AI Assistant and start chatting!

---

## ❓ Troubleshooting
- If you see errors like "Failed to connect to Ollama" or "No models found":
  - Make sure Ollama is running and accessible at the configured host.
  - Ensure you have pulled at least one model (e.g., `ollama pull llama3`).
  - Check firewall/antivirus settings if running on Windows.

For more help, see the [Ollama documentation](https://github.com/ollama/ollama/tree/main/docs) or open an issue in this repository.
