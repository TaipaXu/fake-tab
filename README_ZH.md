# Fake Tab

[English](./README.md) | 中文

修改浏览器标签页图标和标题，隐藏你当前正在浏览的网站。

## 安装

[Chrome](https://chrome.google.com/webstore/detail/fake-tab/dpkljoiigkodeceffpaoiloiagihckfg)

[Edge](https://microsoftedge.microsoft.com/addons/detail/fake-tab/hoddagbgojdogakjblefciohlkmmkjbk)

## 技术栈

- 使用 [Vite+](https://viteplus.dev/guide/) 作为统一的 Web 工具链和 `vp` CLI。
- 使用 [Vue](https://vuejs.org/) 构建弹窗 UI。
- 使用 [Vuetify](https://vuetifyjs.com/) 构建 UI 组件。
- 使用 [TypeScript](https://www.typescriptlang.org/) 编写类型化应用代码。
- 使用 [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) 调用浏览器扩展 API。

## 运行环境

- Node.js：`24.17.0`
- 包管理器：`pnpm@11.8.0`
- Vite+ 会从 `package.json` 读取这些设置。

首次配置运行环境：

```bash
vp env setup
vp env on
vp env install
```

## 开发

安装依赖：

```bash
git clone https://github.com/TaipaXu/fake-tab.git
cd fake-tab
vp install
```

构建 Chrome 扩展到 `dist` 并持续监听变更：

```bash
vp run dev
```

开发期间如需仅在浏览器中预览弹窗：

```bash
vp run dev:server
```

在 Chrome 或 Edge 中将生成的 `dist` 目录加载为未打包的扩展程序。

## 构建

通过 Vite+ 运行项目构建脚本。这会并行执行 Vue 类型检查和 Vite+ 生产构建：

```bash
vp run build
```

构建后，在本地预览生产版弹窗：

```bash
vp preview
```

扩展构建输出：

```text
dist/
dist/manifest.json
dist/popup.html
dist/assets/
```

## 验证

```bash
vp check
```

运行 `vp help` 查看完整的 Vite+ 命令列表，或运行 `vp <command> --help` 查看特定命令的帮助。

## 许可证

[GPL-3.0](LICENSE)
