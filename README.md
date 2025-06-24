<div align="center">
  <img src="./docs/imgs/logo.png" alt="302 AI Studio Logo" width="120" />
  
  # 🚀 302 AI Studio
  
  **让 AI 对话更智能，让创作更高效**
  
  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
  [![Made with Electron](https://img.shields.io/badge/Made%20with-Electron-blue.svg)](https://electronjs.org)
  [![React](https://img.shields.io/badge/React-19.1.0-61DAFB.svg)](https://reactjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)](https://typescriptlang.org)
  
  <br />
  
  *一个功能强大的桌面 AI 聊天应用，为创作者、开发者和思考者量身打造*
  
  [📥 下载体验](#-快速开始) · [🎯 功能特色](#-核心特色) · [📖 使用指南](#-使用场景) · [🛠️ 开发文档](#-开发指南)
  
</div>

---

## 🎯 核心特色

### 🧠 智能对话体验
- 🤖 **多 AI 引擎** - 集成 OpenAI、302.AI 等顶级 AI 服务，随时切换最适合的模型
- 💭 **上下文记忆** - 智能记住对话历史，让 AI 更懂你的需求  
- ⚡ **极速响应** - 流式输出，告别漫长等待，思维跟上灵感

### 🎨 现代化界面设计
- 🌙 **深色/浅色主题** - 护眼模式，适应不同环境和喜好
- 📱 **响应式布局** - 完美适配各种屏幕尺寸，随意调整窗口
- ✨ **动效交互** - 流畅的过渡动画，让每次点击都充满乐趣

### 📂 强大的文件处理
- 🖼️ **图像识别** - 上传图片让 AI 帮你分析内容、生成描述
- 📄 **文档解析** - 支持 PDF、Word、Excel 多种格式，让 AI 读懂你的文件
- 💻 **代码分析** - 直接拖拽代码文件，AI 帮你 Review、优化、解释

### 🔄 高效工作流
- 🗂️ **多线程管理** - 同时进行多个项目对话，思路清晰不混乱
- 🔖 **标签分类** - 自定义标签整理对话，快速找到历史内容
- 📋 **一键导出** - 对话内容支持多种格式导出，方便分享和存档

---

## 📖 使用场景

<table>
<tr>
<td width="50%">

### 💼 职场效率
- **代码审查** - 让 AI 帮你 Review 代码，发现潜在问题
- **文档写作** - AI 协助撰写技术文档、项目报告
- **数据分析** - 上传表格文件，AI 帮你分析数据趋势
- **邮件润色** - 让 AI 帮你优化邮件措辞，提升专业度

</td>
<td width="50%">

### 🎓 学习研究  
- **论文阅读** - 上传 PDF 论文，AI 帮你提取关键信息
- **编程学习** - 代码问题随时问，AI 耐心解答
- **外语翻译** - 多语言对话，提升外语水平
- **知识问答** - 任何领域的问题，AI 都能给出专业解答

</td>
</tr>
<tr>
<td width="50%">

### 🎨 创意设计
- **图像分析** - 上传设计图，AI 给出改进建议
- **文案创作** - AI 协助撰写营销文案、创意内容
- **头脑风暴** - 与 AI 一起探讨创意想法
- **设计灵感** - 描述需求，AI 提供设计方向

</td>
<td width="50%">

### 🏠 日常生活
- **生活助手** - 制定计划、解答疑问、提供建议  
- **学习辅导** - 帮助孩子解答作业问题
- **健康顾问** - 提供健康建议（非医疗诊断）
- **兴趣探索** - 任何好奇的话题都可以深入探讨

</td>
</tr>
</table>

---

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

### 📋 支持的文件格式

<div align="center">

| 类型 | 格式 | 功能 |
|------|------|------|
| **文档** | PDF, DOCX, TXT, MD | 内容提取与分析 |
| **表格** | XLSX, CSV | 数据分析与可视化 |
| **图像** | PNG, JPG, GIF, SVG | 图像识别与描述 |
| **代码** | JS, TS, PY, GO, etc. | 代码审查与优化 |
| **其他** | XML, JSON, YAML | 结构化数据解析 |

</div>

---

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

### 🎯 首次使用

1. **配置 API Key** - 在设置中添加你的 AI 服务 API 密钥
2. **选择模型** - 根据需求选择合适的 AI 模型
3. **开始对话** - 创建你的第一个聊天线程
4. **探索功能** - 尝试上传文件、使用标签等高级功能

---

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

---

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

### 🎨 代码规范

我们使用 **Biome** 确保代码质量和一致性：

```bash
# 检查代码风格
yarn lint

# 自动修复问题
yarn lint:fix

# 类型检查
yarn typecheck
```

### 🔄 Git 工作流

```bash
# 规范化提交
yarn commit

# 提交信息格式
feat: 添加新功能
fix: 修复问题
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

---

## 🤝 参与贡献

我们欢迎所有形式的贡献！无论是报告 bug、提出新功能建议，还是提交代码改进。

### 💡 贡献方式

1. **🐛 报告问题** - 发现 bug？请创建 Issue 描述问题
2. **💭 功能建议** - 有好想法？我们很乐意听取你的建议  
3. **📝 改进文档** - 帮助我们完善文档和使用指南
4. **🔧 代码贡献** - 提交 PR 来改进代码

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

---

## ❓ 常见问题

<details>
<summary><strong>🔑 如何配置 API Key？</strong></summary>

1. 打开应用设置
2. 在 "AI 配置" 选项卡中添加你的 API 密钥
3. 选择对应的 AI 服务提供商
4. 测试连接确保配置正确

</details>

<details>
<summary><strong>📁 支持哪些文件格式？</strong></summary>

目前支持：
- 文档：PDF, DOCX, TXT, MD
- 图像：PNG, JPG, GIF, SVG  
- 代码：所有主流编程语言
- 数据：XLSX, CSV, JSON, XML

</details>

<details>
<summary><strong>💾 数据存储在哪里？</strong></summary>

所有对话数据都存储在本地 SQLite 数据库中，确保你的隐私安全。数据文件位置：
- Windows: `%APPDATA%/302AIStudio/`
- macOS: `~/Library/Application Support/302AIStudio/`
- Linux: `~/.config/302AIStudio/`

</details>

<details>
<summary><strong>🔄 如何更新应用？</strong></summary>

应用会自动检查更新，有新版本时会在界面上显示更新提示。你也可以在设置中手动检查更新。

</details>

---

## 🎉 更新日志

### 🆕 v0.0.1 (2024-06-19)

**🎊 首次发布**
- ✨ 完整的 AI 对话功能
- 📁 文件上传与解析
- 🎨 现代化界面设计
- 🔄 多线程对话管理
- 🛠️ 开发者友好的构建流程

---

## 📞 支持与反馈

<div align="center">

### 💬 联系我们

[![官网](https://img.shields.io/badge/官网-302.ai-blue.svg)](https://302.ai)
[![GitHub](https://img.shields.io/badge/GitHub-302--AI--Studio-black.svg)](https://github.com/302ai/302-AI-Studio)
[![邮件](https://img.shields.io/badge/邮件-support@302.ai-red.svg)](mailto:support@302.ai)

**遇到问题？** 请在 [GitHub Issues](https://github.com/302ai/Chat-Chat-App/issues) 中反馈

**功能建议？** 我们在 [GitHub Discussions](https://github.com/302ai/Chat-Chat-App/discussions) 等你

</div>

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源，你可以自由使用、修改和分发。

---

<div align="center">
  
  **🌟 如果这个项目对你有帮助，请给我们一个 Star！**
  
  <br />
  
  Made with ❤️ by [302.AI](https://302.ai)
  
  <br />
  
  <sub>让 AI 成为你最好的工作伙伴</sub>
  
</div>
