<h1 align="center">
<img src='./docs/imgs/icon.svg' width='30'>
<span>
    302 AI Studio
</span>
</h1>
 
<p align="center">
<em>302 AI Studio is a desktop client that supports multiple large language model (LLM) service providers, compatible with Windows, Mac and Linux.</em>
</p>

<p align="center"><a href="https://302.ai/en/" target="blank"><img src="https://file.302.ai/gpt/imgs/github/20250102/72a57c4263944b73bf521830878ae39a.png" /></a></p >

<p align="center"><a href="README_zh.md">中文</a> | <a href="README.md">English</a> | <a href="README_ja.md">日本語</a></p>


## 🌟 Key Features

### Document and Data Processing
- 🖼️ Upload images for AI analysis and description generation
- 📄 Support for multiple formats including PDF, CSV, PNG, PY, JSON, etc.
- 💻 Code syntax highlighting
- 📊 Mermaid chart visualization


### Superior User Experience
- 🖥️ Multi-platform support for Windows, Mac, Linux
- 🌙 Light and dark themes for different environments and preferences
- 📝 Complete Markdown rendering
- 📱 Perfect adaptation to various screen sizes, flexible window adjustment

### Efficient Workflow
- 🗂️ Conduct multiple project conversations simultaneously with clear organization

### Multi-language Support
- **Chinese**
- **English** 
- **Japanese**


## 🛠️ Technical Architecture

<div align="center">
  <img src="./docs/imgs/architecture.png" alt="Technical Architecture Diagram" />
</div>

### 🏗️ Core Technology Stack


| Layer | Technology Choice | Description |
|------|----------|------|
| **UI Layer** | React 19 + TypeScript | Modern component development, type safety |
| **Styling Layer** | Tailwind CSS + Framer Motion | Atomic CSS + Smooth animations |
| **Desktop Layer** | Electron 35 | Cross-platform desktop application framework |
| **State Management** | Zustand + React Query | Lightweight state management + Data caching |
| **Data Layer** | SQLite + Triplit | Local database + Real-time sync |
| **AI Integration** | AI SDK | Unified AI provider interface |
| **Build Tools** | Vite + Electron Vite | Fast building + Hot reload |


## 🚀 Quick Start

### 📋 System Requirements

- **Operating System**: Windows 10+ / macOS 10.14+ / Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM (8GB+ recommended)
- **Storage**: 500MB available space
- **Network**: Stable internet connection

### ⚡ Quick Start

```bash
# 1️⃣ Clone the project
git clone https://github.com/302ai/302-AI-Studio.git
cd 302-AI-Studio

# 2️⃣ Install dependencies
yarn install

# 3️⃣ Prebuild
yarn prebuild

# 4️⃣ Install Electron dependencies
yarn install:deps

# 5️⃣ Start development server 🎉
yarn dev
```

## 📦 Build and Deploy

### 🔧 Development Build

```bash
# Type check
yarn typecheck

# Code specification check
yarn lint

# Fix code issues
yarn lint:fix
```

### 🚀 Production Construction

```bash
# Universal construction
yarn build

# Platform specific construction
yarn build:win     # Windows
yarn build:mac     # macOS  
yarn build:linux   # Linux
```

### 📱 Cross-Platform Support

| Platform | Architecture | Status |
|------|------|------|
| Windows | x64 / ARM64 | ✅ Fully Supported |
| macOS | x64 / Apple Silicon | ✅ Fully Supported |
| Linux | x64 / ARM64 | ✅ Fully Supported |


## 🛠️ Development Guide

### 📁 Project Structure

```
📦 302-AI-Studio
├── 📂 src/                          # Source code directory
│   ├── 📂 components/               # React components
│   ├── 📂 pages/                    # Page components
│   ├── 📂 hooks/                    # Custom Hooks
│   ├── 📂 utils/                    # Utility functions
│   ├── 📂 stores/                   # State management
│   ├── 📂 types/                    # TypeScript type definitions
│   └── 📂 assets/                   # Static assets
├── 📂 scripts/                      # Build scripts
├── 📂 .github/                      # GitHub Actions
├── 📄 electron-builder.ts           # Electron Build Configuration
├── 📄 electron.vite.config.ts       # Vite configuration
└── 📄 package.json                  # Project configuration
```

## 🤝 Contribution Guidelines

We welcome all forms of contributions! Whether it's reporting bugs, suggesting new features, or submitting code improvements.

### 💡 Ways to Contribute

1. **Code Contribution**: Submit PRs to improve the code
2. **Bug Fixes**: Submit fixes for issues you've found
3. **Feature Suggestions**: Got a great idea? We'd love to hear your suggestions
4. **Documentation**: Help us improve our documentation and user guides
5. **Promotion**: Help spread the word about 302 AI Studio

### 📋 Contribution Steps

```bash
# 1. Fork Project
# 2. Create a functional branch
git checkout -b feature/amazing-feature

# 3. Commit Changes
git commit -m 'feat: add amazing feature'

# 4. Push to branch
git push origin feature/amazing-feature

# 5. Create Pull Request
```

## 💬 Contact Us

<div align="center">

[![Website](https://img.shields.io/badge/Website-302.ai-blue.svg)](https://302.ai)
[![GitHub](https://img.shields.io/badge/GitHub-302--AI--Studio-black.svg)](https://github.com/302ai/302-AI-Studio)
[![Email](https://img.shields.io/badge/Email-support@302.ai-red.svg)](mailto:support@302.ai)

**Having issues?** Please report them in [GitHub Issues](https://github.com/302ai/Chat-Chat-App/issues)

**Feature suggestions?** We're waiting for you in [GitHub Discussions](https://github.com/302ai/Chat-Chat-App/discussions)

</div>


## 📄 License

This project is open source under the [AGPL-3.0](LICENSE), you are free to use, modify and distribute.


## ✨ About 302.AI ✨
[302.AI](https://302.ai/en/) is an enterprise-oriented AI application platform that offers pay-as-you-go services, ready-to-use solutions, and an open-source ecosystem.✨
1. 🧠 Comprehensive AI capabilities: Incorporates the latest in language, image, audio, and video models from leading AI brands.
2. 🚀 Advanced application development: We build genuine AI products, not just simple chatbots.
3. 💰 No monthly fees: All features are pay-per-use, fully accessible, ensuring low entry barriers with high potential.
4. 🛠 Powerful admin dashboard: Designed for teams and SMEs - managed by one, used by many.
5. 🔗 API access for all AI features: All tools are open-source and customizable (in progress).
6. 💡 Powerful development team: Launching 2-3 new applications weekly with daily product updates. Interested developers are welcome to contact us.
