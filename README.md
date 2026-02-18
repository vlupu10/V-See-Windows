# V-See Windows

Windows-specific implementation of the V-See photo viewer application, built with Tauri.

## About

This is a **separate codebase** from the Mac version, rebuilt from scratch using Tauri (Rust + Web frontend) specifically for Windows. The Mac version uses PyQt6 with QtMultimedia, which doesn't work reliably on Windows, so we maintain separate codebases for optimal platform-specific implementations.

## Project Strategy

- **Technology**: Tauri (Rust backend + Web frontend)
- **Platform**: Windows only
- **Reference**: The Mac version (`Project-V-See`) serves as a reference for business requirements and feature specifications
- **Goal**: Achieve feature parity with the Mac version while leveraging Tauri's cross-platform capabilities

## Development Workflow

- **Main branch**: Protected - no direct commits allowed (pre-commit hook prevents this)
- **Develop branch**: All development work happens here
- Create feature branches from `develop` and merge back via pull requests

## Business Requirements

V-See is a high-performance desktop photo viewer with three main modes:

1. **Manage Mode**: Three-pane browser with folder trees, thumbnail grid, and preview pane
2. **View Mode**: Full-screen single image viewer with navigation
3. **Slideshow Mode**: Auto-advance with optional background music

See the Mac version repository for detailed feature specifications and architecture documentation.

## Documentation

- **[User Guide](docs/USER-GUIDE.md)** — How to install V-See (MSI or from source) and how to use the application (browsing, preview, viewer, music, slideshow).
- **[Install test guide](docs/INSTALL-TEST.md)** — Step-by-step procedure to test building the MSI, running the installer, and verifying the installed app.

## Getting Started

### Prerequisites

- **Node.js** and npm
- **Rust** (install from [rustup.rs](https://rustup.rs/)). After installing, **open a new terminal** so `cargo` is on your PATH (or restart Cursor).
- **Windows**: WebView2 is usually already installed on Windows 10/11.

### Run in development

**Always run from the project root** (the folder that contains `src-tauri` and `package.json`). Otherwise you'll get: *"Couldn't recognize the current folder as a Tauri project"*.

**From Cursor terminal** (PATH often doesn’t include Rust): run `npm run dev` — it sets PATH for the command so `cargo` is found without changing the terminal:

```powershell
cd C:\Projects\Project-V-See-Windows
npm run dev
```

Alternatively use the script: `.\scripts\run-dev.ps1`

Or from any terminal where `cargo` is already on PATH:

```powershell
cd C:\Projects\Project-V-See-Windows
npm install
npm run tauri dev
```

Or with Cargo directly:

```powershell
cd C:\Projects\Project-V-See-Windows
cargo tauri dev
```

The first run starts a small static server on port 1420 and builds the Rust backend (may take a few minutes). If `cargo` is not recognized outside the script, restart the terminal after installing Rust, or use `.\scripts\run-dev.ps1`.

## Reference Projects

- **Mac Version**: [Project-V-See](https://github.com/vlupu10/V-See) - Reference for requirements and UX
- **Audio Library**: [vio-python](https://github.com/vlupu10/vio-python) - Reference for audio playback requirements
