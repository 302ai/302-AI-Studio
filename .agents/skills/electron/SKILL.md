---
name: electron
description: Provides comprehensive guidance for Electron framework including main process, renderer process, IPC communication, window management, and desktop app development. Use when the user asks about Electron, needs to create desktop applications, implement Electron features, or build cross-platform desktop apps.
license: Complete terms in LICENSE.txt
---

## When to use this skill

Use this skill whenever the user wants to:
- Build cross-platform desktop applications with Electron
- Understand Electron architecture (main process, renderer process, preload)
- Implement IPC (Inter-Process Communication) between processes
- Create and manage BrowserWindow instances
- Implement menus, tray icons, and native features
- Package and distribute Electron applications
- Use Electron Forge for project scaffolding and building
- Debug and test Electron applications
- Implement security best practices
- Use Electron APIs (app, BrowserWindow, ipcMain, ipcRenderer, etc.)

## How to use this skill

This skill is organized to match the Electron official documentation structure (https://www.electronjs.org/zh/docs/latest/, https://www.electronjs.org/zh/docs/latest/api/app). When working with Electron:

1. **Identify the topic** from the user's request:
   - Getting started/快速开始 → `examples/getting-started/installation.md` or `examples/getting-started/quick-start.md`
   - Main process/主进程 → `examples/processes/main-process.md`
   - Renderer process/渲染进程 → `examples/processes/renderer-process.md`
   - IPC communication/IPC 通信 → `examples/processes/ipc-communication.md`
   - BrowserWindow/窗口 → `examples/api/browser-window.md`
   - Menu/菜单 → `examples/api/menu.md`
   - Packaging/打包 → `examples/advanced/packaging.md`
   - Security/安全 → `examples/advanced/security.md`

2. **Load the appropriate example file** from the `examples/` directory:

   **Getting Started (快速开始) - `examples/getting-started/`**:
   - `examples/getting-started/installation.md` - Installing Electron and basic setup
   - `examples/getting-started/quick-start.md` - Quick start tutorial

   **Processes (进程) - `examples/processes/`**:
   - `examples/processes/main-process.md` - Main process concepts and usage
   - `examples/processes/renderer-process.md` - Renderer process concepts
   - `examples/processes/preload-scripts.md` - Preload scripts usage
   - `examples/processes/ipc-communication.md` - IPC communication patterns

   **API Examples (API 示例) - `examples/api/`**:
   - `examples/api/browser-window.md` - BrowserWindow usage
   - `examples/api/menu.md` - Menu and context menu
   - `examples/api/tray.md` - System tray
   - `examples/api/dialog.md` - File dialogs
   - `examples/api/ipc-main.md` - ipcMain usage
   - `examples/api/ipc-renderer.md` - ipcRenderer usage

   **Advanced (高级) - `examples/advanced/`**:
   - `examples/advanced/packaging.md` - Application packaging
   - `examples/advanced/security.md` - Security best practices
   - `examples/advanced/auto-updater.md` - Auto updater
   - `examples/advanced/native-modules.md` - Native modules

   **Tools (工具) - `examples/tools/`**:
   - `examples/tools/electron-forge.md` - Electron Forge usage
   - `examples/tools/electron-fiddle.md` - Electron Fiddle usage

3. **Follow the specific instructions** in that example file for syntax, structure, and best practices

   **Important Notes**:
   - All examples follow Electron latest API
   - Examples use both CommonJS (require) and ES modules (import)
   - Each example file includes key concepts, code examples, and key points
   - Always check the example file for best practices and common patterns
   - Electron supports Windows, macOS, and Linux

4. **Reference API documentation** in the `api/` directory when needed:
   - `api/app.md` - app module API
   - `api/browser-window.md` - BrowserWindow API
   - `api/ipc-main.md` - ipcMain API
   - `api/ipc-renderer.md` - ipcRenderer API
   - `api/menu.md` - Menu API
   - `api/tray.md` - Tray API

5. **Use templates** from the `templates/` directory:
   - `templates/main-process.md` - Main process template
   - `templates/preload-script.md` - Preload script template
   - `templates/renderer-process.md` - Renderer process template
   - `templates/package-json.md` - package.json template


### Doc mapping (one-to-one with official documentation)

- `examples/` → https://www.electronjs.org/zh/docs/latest/
- `api/` → https://www.electronjs.org/zh/docs/latest/api/app

## Examples and Templates

This skill includes detailed examples organized to match the official documentation structure. All examples are in the `examples/` directory (see mapping above).

**To use examples:**
- Identify the topic from the user's request
- Load the appropriate example file from the mapping above
- Follow the instructions, syntax, and best practices in that file
- Adapt the code examples to your specific use case

**To use templates:**
- Reference templates in `templates/` directory for common scaffolding
- Adapt templates to your specific needs and coding style

## API Reference

Detailed API documentation is available in the `api/` directory, organized to match the official Electron API documentation structure:

### Core APIs (`api/`)
- `api/app.md` - app module API
- `api/browser-window.md` - BrowserWindow API
- `api/ipc-main.md` - ipcMain API
- `api/ipc-renderer.md` - ipcRenderer API
- `api/menu.md` - Menu API
- `api/tray.md` - Tray API
- `api/dialog.md` - Dialog API

**To use API reference:**
1. Identify the API you need help with
2. Load the corresponding API file from the `api/` directory
3. Find the API signature, parameters, return type, and examples
4. Reference the linked example files for detailed usage patterns
5. All API files include links to relevant example files in the `examples/` directory

## Best Practices

1. **Security**: Never enable nodeIntegration in renderer process, use preload scripts
2. **Process separation**: Keep main and renderer processes separate
3. **IPC communication**: Use IPC for safe communication between processes
4. **Resource management**: Properly clean up resources (windows, listeners)
5. **Error handling**: Implement proper error handling and crash reporting
6. **Performance**: Optimize for performance, use webContents for debugging
7. **Packaging**: Use Electron Forge or electron-builder for packaging
8. **Auto updates**: Implement auto-updater for production apps
9. **Native modules**: Handle native module compatibility
10. **Cross-platform**: Test on all target platforms

## Resources

- **Official Website**: https://www.electronjs.org/zh/
- **Documentation**: https://www.electronjs.org/zh/docs/latest/
- **API Reference**: https://www.electronjs.org/zh/docs/latest/api/app
- **Electron Forge**: https://www.electronforge.io
- **Electron Fiddle**: https://www.electronjs.org/zh/fiddle
- **GitHub Repository**: https://github.com/electron/electron

## Keywords

Electron, desktop app, main process, renderer process, preload, IPC, BrowserWindow, Menu, Tray, Dialog, packaging, electron-builder, electron-forge, electron-fiddle, cross-platform, 桌面应用, 主进程, 渲染进程, IPC 通信, 窗口, 菜单, 托盘, 打包

## 能力边界

### ✅ 适用场景
- 当你需要使用此技能对应的技术栈时
- 当项目需要遵循最佳实践时
- 当需要快速上手或深入理解核心概念时

### ⚠️ 需要注意
- 复杂业务逻辑需要结合具体场景调整
- 性能优化需要根据实际数据量评估

### ❌ 不适用场景
- 不相关的技术栈或框架
- 需要完全自定义的特殊场景

## 常见陷阱 (Gotchas)

1. **版本兼容性**：注意框架版本与依赖库的兼容性，不同版本 API 可能有差异
2. **配置文件格式**：配置文件格式错误是最常见的问题，建议使用编辑器的语法检查
3. **环境变量**：确保所有必要的环境变量已正确设置，敏感信息不要硬编码
4. **依赖冲突**：多版本共存时注意依赖冲突，使用 lock 文件锁定版本
5. **性能陷阱**：大数据量场景下注意性能优化，避免 N+1 查询等常见问题

## 使用流程

### Step 1: 环境准备
确保开发环境已安装必要的依赖和工具。

### Step 2: 配置初始化
根据项目需求进行基础配置。

### Step 3: 核心功能使用
按照示例代码实现核心功能。

### Step 4: 测试验证
运行测试确保功能正常。

### Step 5: 部署上线
完成开发后进行部署和监控。
