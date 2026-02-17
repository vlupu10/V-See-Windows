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

## Getting Started

This project is in early development. Setup instructions will be added as the Tauri project structure is established.

## Reference Projects

- **Mac Version**: [Project-V-See](https://github.com/vlupu10/V-See) - Reference for requirements and UX
- **Audio Library**: [vio-python](https://github.com/vlupu10/vio-python) - Reference for audio playback requirements
