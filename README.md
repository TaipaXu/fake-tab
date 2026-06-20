# Fake Tab

English | [中文](./README_ZH.md)

Modify browser tab page icon and title, hide the website you are currently browsing.

## Installation

[Chrome](https://chrome.google.com/webstore/detail/fake-tab/dpkljoiigkodeceffpaoiloiagihckfg)

[Edge](https://microsoftedge.microsoft.com/addons/detail/fake-tab/hoddagbgojdogakjblefciohlkmmkjbk)

## Tech Stack

- [Vite+](https://viteplus.dev/guide/) as the unified web toolchain and `vp` CLI.
- [Vue](https://vuejs.org/) for the popup UI.
- [Vuetify](https://vuetifyjs.com/) for UI components.
- [TypeScript](https://www.typescriptlang.org/) for typed application code.
- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) for browser extension APIs.

## Runtime

- Node.js: `24.17.0`
- Package manager: `pnpm@11.8.0`
- Vite+ reads these settings from `package.json`.

First-time runtime setup:

```bash
vp env setup
vp env on
vp env install
```

## Development

Install dependencies:

```bash
git clone https://github.com/TaipaXu/fake-tab.git
cd fake-tab
vp install
```

Build the Chrome extension into `dist` and keep watching for changes:

```bash
vp run dev
```

For a browser-only popup preview during development:

```bash
vp run dev:server
```

Load the generated `dist` directory as an unpacked extension in Chrome or Edge.

## Build

Run the project build script through Vite+. This runs Vue type checking and the Vite+ production build in parallel:

```bash
vp run build
```

After building, preview the production popup locally:

```bash
vp preview
```

The extension build outputs:

```text
dist/
dist/manifest.json
dist/popup.html
dist/assets/
```

## Validation

```bash
vp check
```

Run `vp help` to see the full list of Vite+ commands, or `vp <command> --help` for command-specific help.

## License

[GPL-3.0](LICENSE)
