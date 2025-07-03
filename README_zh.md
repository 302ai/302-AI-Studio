<h1 align="center">
<img src='./docs/imgs/icon.svg' width='30'>
<span>
    302 AI Studio
</span>
</h1>
 
<p align="center">
<em>302 AI Studio 是一款支持多种大模型（LLM）服务商的桌面客户端，适用于 Windows、Mac 和 Linux。</em>
</p>

<p align="center"><a href="https://302.ai/" target="blank"><img src="https://file.302.ai/gpt/imgs/github/20250102/72a57c4263944b73bf521830878ae39a.png" /></a></p >

<p align="center"><a href="README_zh.md">中文</a> | <a href="README.md">English</a> | <a href="README_ja.md">日本語</a></p>


## 🌟 主要特点

### 文档与数据处理
- 🖼️ 上传图片让 AI 帮你分析内容、生成描述
- 📄 支持 PDF、CSV、PNG、 PY、JSON等多种格式
- 💻 代码高亮显示
- 📊 Mermaid 图表可视化


### 优质使用体验
- 🖥️ Windows、Mac、Linux多平台支持
- 🌙 明暗主题，适应不同环境和喜好
- 📝 完整的 Markdown 渲染
- 📱 完美适配各种屏幕尺寸，随意调整窗口

### 高效工作流
- 🗂️ 同时进行多个项目对话，思路清晰不混乱  

### 多语言支持
- **中文**
- **English** 
- **日本語**


## 🛠️ 技术架构

<div align="center">
  <img src="./docs/imgs/architecture.png" alt="技术架构图" />
</div>

### 🏗️ 核心技术栈


| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **界面层** | React 19 + TypeScript | 现代化组件开发，类型安全 |
| **样式层** | Tailwind CSS + Framer Motion | 原子化 CSS + 流畅动画 |
| **桌面端** | Electron 35 | 跨平台桌面应用框架 |
| **状态管理** | Zustand + React Query | 轻量状态管理 + 数据缓存 |
| **数据层** | SQLite + Triplit | 本地数据库 + 实时同步 |
| **AI 集成** | AI SDK | 统一 AI 提供商接口 |
| **构建工具** | Vite + Electron Vite | 快速构建 + 热重载 |


## 🚀 快速开始

### 📋 系统要求

- **操作系统**: Windows 10+ / macOS 10.14+ / Linux (Ubuntu 18.04+)
- **内存**: 4GB RAM (推荐 8GB+)
- **存储**: 500MB 可用空间
- **网络**: 稳定的互联网连接

### ⚡ 一键启动

```bash
# 1️⃣ 克隆项目
git clone https://github.com/302ai/302-AI-Studio.git
cd 302-AI-Studio

# 2️⃣ 安装依赖
yarn install

# 3️⃣ 预构建
yarn prebuild

# 4️⃣ 安装 Electron 依赖  
yarn install:deps

# 5️⃣ 启动开发服务器 🎉
yarn dev
```

## 📦 构建与部署

### 🔧 开发构建

```bash
# 类型检查
yarn typecheck

# 代码规范检查
yarn lint

# 修复代码问题
yarn lint:fix
```

### 🚀 生产构建

```bash
# 通用构建
yarn build

# 平台特定构建
yarn build:win     # Windows
yarn build:mac     # macOS  
yarn build:linux   # Linux
```

### 📱 跨平台支持

| 平台 | 架构 | 状态 |
|------|------|------|
| Windows | x64 / ARM64 | ✅ 完全支持 |
| macOS | x64 / Apple Silicon | ✅ 完全支持 |
| Linux | x64 / ARM64 | ✅ 完全支持 |


## 🛠️ 开发指南

### 📁 项目结构

```
📦 302-AI-Studio
├── 📂 src/                          # 源代码目录
│   ├── 📂 components/               # React 组件
│   ├── 📂 pages/                    # 页面组件
│   ├── 📂 hooks/                    # 自定义 Hooks
│   ├── 📂 utils/                    # 工具函数
│   ├── 📂 stores/                   # 状态管理
│   ├── 📂 types/                    # TypeScript 类型定义
│   └── 📂 assets/                   # 静态资源
├── 📂 scripts/                      # 构建脚本
├── 📂 .github/                      # GitHub Actions
├── 📄 electron-builder.ts           # Electron 构建配置
├── 📄 electron.vite.config.ts       # Vite 配置
└── 📄 package.json                  # 项目配置
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是报告 bug、提出新功能建议，还是提交代码改进。

### 💡 贡献方式

1. **代码贡献** ：提交 PR 来改进代码
2. **修复Bug** ：提交你发现的问题修复
3. **功能建议** ：有好想法？我们很乐意听取你的建议  
4. **编写文档** ：帮助我们完善文档和使用指南
5. **推广应用** ：宣传302 AI Studio

### 📋 贡献步骤

```bash
# 1. Fork 项目
# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'feat: add amazing feature'

# 4. 推送到分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

## 💬 联系我们

<div align="center">

[![官网](https://img.shields.io/badge/官网-302.ai-blue.svg)](https://302.ai)
[![GitHub](https://img.shields.io/badge/GitHub-302--AI--Studio-black.svg)](https://github.com/302ai/302-AI-Studio)
[![邮件](https://img.shields.io/badge/邮件-support@302.ai-red.svg)](mailto:support@302.ai)

**遇到问题？** 请在 [GitHub Issues](https://github.com/302ai/Chat-Chat-App/issues) 中反馈

**功能建议？** 我们在 [GitHub Discussions](https://github.com/302ai/Chat-Chat-App/discussions) 等你

</div>


## 📄 许可证

本项目基于 [AGPL-3.0](LICENSE) 开源，你可以自由使用、修改和分发。


## ✨ 302.AI介绍 ✨
[302.AI](https://302.ai)是一个按需付费的AI应用平台，为用户解决AI用于实践的最后一公里问题。
1. 🧠 集合了最新最全的AI能力和品牌，包括但不限于语言模型、图像模型、声音模型、视频模型。
2. 🚀 在基础模型上进行深度应用开发，我们开发真正的AI产品，而不是简单的对话机器人
3. 💰 零月费，所有功能按需付费，全面开放，做到真正的门槛低，上限高。
4. 🛠 功能强大的管理后台，面向团队和中小企业，一人管理，多人使用。
5. 🔗 所有AI能力均提供API接入，所有工具开源可自行定制（进行中）。
6. 💡 强大的开发团队，每周推出2-3个新应用，产品每日更新。有兴趣加入的开发者也欢迎联系我们
