# V-See Windows - Architecture Overview

**Author**: Viorel LUPU  
**Date**: 2025-02-17  
**Purpose**: Document the architecture and design decisions for the Windows version of V-See, built with Tauri.

## Technology Stack

### Why Tauri?
- **Platform-specific optimization**: Mac version uses PyQt6 with QtMultimedia, which doesn't work reliably on Windows
- **Performance**: Rust backend provides excellent performance for image/video processing
- **Modern UI**: Web frontend allows for modern, responsive UI development
- **Cross-platform foundation**: While Windows-only initially, Tauri makes future cross-platform expansion easier

### Architecture Layers

```
┌─────────────────────────────────────┐
│   Frontend (HTML/CSS/JavaScript)    │  UI Layer
├─────────────────────────────────────┤
│   Tauri API (Commands/Events)       │  Bridge Layer
├─────────────────────────────────────┤
│   Rust Backend (Services)           │  Business Logic Layer
├─────────────────────────────────────┤
│   System APIs (File System, etc.)  │  Platform Layer
└─────────────────────────────────────┘
```

## Project Structure (Planned)

```
v-see-windows/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri application entry
│   │   ├── commands/       # Tauri command handlers
│   │   ├── services/       # Business logic services
│   │   │   ├── thumbnails.rs
│   │   │   ├── persistence.rs
│   │   │   ├── audio.rs
│   │   │   └── video.rs
│   │   └── utils/          # Utility functions
│   └── Cargo.toml
├── src/                    # Frontend (Web)
│   ├── components/         # UI components
│   │   ├── ThumbnailGrid/
│   │   ├── ImageViewer/
│   │   ├── FolderTree/
│   │   └── MusicPlayer/
│   ├── services/           # Frontend services
│   ├── styles/             # CSS
│   └── main.js             # Entry point
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── TODO.md
│   └── REQUIREMENTS.md
├── .cursorrules            # Cursor IDE rules
└── README.md
```

## Key Components (Reference from Mac Version)

### Components (UI Layer)
- **ThumbnailGrid**: Displays grid of image/video thumbnails
- **ImageViewer**: Full-screen image viewer with navigation
- **FolderTree**: Hierarchical folder browser (Photos + Music)
- **MusicPlayer**: Audio playback controls
- **SlideshowConfigDialog**: Configure slideshow settings

### Services (Backend Layer)
- **ThumbnailService**: Generate thumbnails asynchronously (images + videos)
- **PersistenceService**: Store application state (SQLite or similar)
- **AudioService**: Audio playback and playlist management
- **VideoService**: Video playback and thumbnail extraction
- **FileSystemService**: File system operations with error handling

## Design Principles

1. **Separation of Concerns**: Clear split between UI and business logic
2. **Async Operations**: Never block UI thread; use async/await or workers
3. **Error Handling**: Graceful degradation for missing features
4. **Performance**: Lazy loading, caching, efficient algorithms
5. **User Experience**: Responsive UI, restore state, handle edge cases

## Migration Strategy

### What to Reuse
- Business logic and algorithms (convert Python to Rust)
- UI/UX patterns and workflows
- Feature specifications and requirements
- Architecture patterns (components/services split)

### What to Rebuild
- UI framework (PyQt6 → Web frontend)
- Video playback (QtMultimedia → Tauri/Web APIs)
- Audio playback (Python mp3-player → Rust equivalent or FFI)
- File system operations (Python → Rust/Tauri APIs)

## Implementation Phases

1. **Phase 1**: Basic Tauri setup, file browser, image display
2. **Phase 2**: Thumbnail generation, grid view, preview pane
3. **Phase 3**: Image viewer, navigation, slideshow basics
4. **Phase 4**: Audio playback, music player integration
5. **Phase 5**: Video support, thumbnails, playback
6. **Phase 6**: Persistence, state management, polish

## Technical Decisions

### Rust Backend
- Use `tauri-plugin-fs` for file system operations
- Use `image` crate for image processing and thumbnails
- Use `rusqlite` for persistence (SQLite database)
- Evaluate `rodio` or `symphonia` for audio playback
- Use async/await for non-blocking operations

### Frontend
- Vanilla JavaScript or lightweight framework (to be decided)
- CSS for styling (consider CSS variables for theming)
- Use Tauri's event system for frontend-backend communication
- Implement virtual scrolling for large thumbnail grids

### Video Playback
- Research Web APIs (HTML5 video) vs native Rust solutions
- Consider `ffmpeg` bindings for video thumbnail extraction
- Evaluate Tauri's native video capabilities

### Audio Playback
- Research Rust audio libraries vs Web Audio API
- Consider FFI bridge to existing audio solution if needed
- Ensure cross-platform compatibility for future expansion

## Notes

- Reference the Mac version (`Project-V-See`) for detailed feature specs
- Keep code documentation standards consistent (see `.cursorrules`)
- Prioritize Windows-specific optimizations
- Plan for future cross-platform expansion if needed
- Maintain feature parity with Mac version where possible
