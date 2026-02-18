# V-See Windows - TODO List

**Author**: Viorel LUPU  
**Date**: 2025-02-17  
**Purpose**: Track development progress and tasks for the Windows Tauri-based rebuild of V-See.

## Phase 1: Project Setup

- [ ] **setup-1**: Initialize Tauri project: Run `npm create tauri-app@latest` or use Tauri CLI to scaffold project structure
- [ ] **setup-2**: Configure Tauri: Set up Cargo.toml, tauri.conf.json with Windows-specific settings, window configuration
- [ ] **setup-3**: Set up project structure: Create src-tauri/src/services/, src-tauri/src/commands/, src/components/, src/services/ directories
- [ ] **setup-4**: Configure build tools: Set up package.json, install dependencies, configure Rust toolchain
- [ ] **setup-5**: Create basic window: Configure main window size, title, and basic layout structure

## Phase 2: Core File System & UI

- [ ] **core-1**: Implement FileSystemService (Rust): Create Tauri command to list directories, handle file system operations with error handling
- [ ] **core-2**: Build FolderTree component (Frontend): Create folder tree UI component for browsing directories, lazy loading children
- [ ] **core-3**: Implement dual folder trees: Create separate Photos and Music folder trees in left pane, independent selection
- [ ] **core-4**: Create ThumbnailService (Rust): Implement image thumbnail generation using image-rs or similar, async processing
- [ ] **core-5**: Build ThumbnailGrid component (Frontend): Display grid of thumbnails, handle selection, emit events for preview/viewer
- [ ] **core-6**: Implement Preview pane: Show selected image/video in preview area, handle image scaling and display

## Phase 3: Image Viewer

- [ ] **viewer-1**: Create ImageViewer window: Full-screen viewer window, image display with proper scaling
- [ ] **viewer-2**: Implement navigation: Prev/Next buttons with wrap-around, keyboard shortcuts (arrow keys)
- [ ] **viewer-3**: Add window management: Save/restore viewer window geometry, handle window close events

## Phase 4: Persistence

- [ ] **persistence-1**: Create PersistenceService (Rust): SQLite database for app state, key-value store pattern
- [ ] **persistence-2**: Implement state persistence: Save/restore last folders, window geometries, slideshow settings
- [ ] **persistence-3**: Add startup restoration: Load persisted state on app start, validate paths, fallback handling

## Phase 5: Slideshow

- [ ] **slideshow-1**: Implement slideshow timer: Auto-advance logic, configurable interval (1-3600 seconds)
- [ ] **slideshow-2**: Create SlideshowConfigDialog: UI for configuring interval, music selection, video duration options
- [ ] **slideshow-3**: Add slideshow controls: ON/OFF toggle, stop music button, integrate with viewer window

## Phase 6: Audio Support

- [ ] **audio-1**: Research audio solution: Evaluate Rust audio libraries (rodio, symphonia) or FFI bridge to existing solution
- [ ] **audio-2**: Implement AudioService (Rust): Audio playback, playlist management, volume control
- [ ] **audio-3**: Build MusicPlayer component (Frontend): Transport controls (play/pause/stop/prev/next), volume slider
- [ ] **audio-4**: Integrate music with slideshow: Auto-start music when slideshow runs, stop when slideshow stops
- [ ] **audio-5**: Create playable files list: Display audio files from selected music folder, handle selection

## Phase 7: Video Support

- [ ] **video-1**: Research video solution: Evaluate Tauri/Web video playback options, thumbnail extraction libraries
- [ ] **video-2**: Implement VideoThumbnailService (Rust): Extract video thumbnails (prefer embedded, fallback to frame extraction)
- [ ] **video-3**: Add video playback: Video player in preview pane and viewer, handle video file selection
- [ ] **video-4**: Integrate videos in slideshow: Play videos in slideshow (5 seconds or full duration per config)

## Phase 8: UI Polish

- [ ] **ui-1**: Design and implement UI layout: Three-pane splitter layout, responsive design, proper spacing
- [ ] **ui-2**: Add styling: CSS for modern, clean UI, consistent with photo viewer aesthetic
- [ ] **ui-3**: Implement error handling UI: User-friendly error messages for disconnected drives, invalid paths
- [ ] **ui-4**: Add loading states: Loading indicators for thumbnails, folder loading, async operations

## Phase 9: Final Polish

- [ ] **polish-1**: Performance optimization: Lazy loading improvements, thumbnail caching, memory management
- [ ] **polish-2**: Error handling refinement: Comprehensive error handling, graceful degradation, edge case handling
- [ ] **polish-3**: Testing: Test with various folder sizes, image formats, edge cases (disconnected drives, etc.)
- [ ] **polish-4**: Build and distribution: Configure Tauri build for Windows, create installer/portable package
- [ ] **polish-5**: Documentation: Update README with setup instructions, usage guide, development notes

---

## Progress Tracking

- **Total Tasks**: 35
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 35

## Notes

- Tasks are organized by phase to maintain logical development flow
- Each task should follow the documentation standards (Author, Date, Purpose headers)
- Reference the Mac version (`Project-V-See`) for detailed feature specifications
- Update this file as tasks are completed
