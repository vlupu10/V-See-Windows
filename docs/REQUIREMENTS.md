# V-See Windows - Requirements

**Author**: Viorel LUPU  
**Date**: 2025-02-17  
**Purpose**: Document functional and non-functional requirements for the Windows version of V-See, based on the Mac version specifications.

## Overview and Core Philosophy

**Goal**: Develop a high-performance desktop photo viewer application that replicates the core "browse, view, and slideshow" functionality of classic ACDSee (specifically version 20, non-subscription).

**Primary Pain Point to Solve**: The application must eliminate the slow initial loading times seen in modern viewers (like XnView MP or Photos). It must NOT recursively scan folders or build a massive database upon opening a large directory (e.g., a 300GB Camera folder).

### Core Philosophy

- **Speed is Paramount**: Folder listing and image viewing must feel instantaneous.
- **File-System Based (No Import)**: The app acts as a direct window to the file system. It reads files where they sit. No "importing" process is required.
- **Lazy Loading**: Only load information (thumbnails, metadata) for files currently visible on screen or imminent.

## Target Technology Stack

- **Framework**: Tauri (Rust backend + Web frontend)
- **Platform**: Windows only (initially)
- **Image Processing**: Rust `image` crate or similar for fast thumbnail generation
- **Video Processing**: TBD - evaluate Web APIs vs native Rust solutions
- **Audio Processing**: TBD - evaluate Rust audio libraries vs Web Audio API

## Functional Requirements

The application will have three main modes of operation, similar to ACDSee: **"Manage"** (Browser), **"View"** (Single Image), and **"Slideshow"**.

### 3.1. "Manage" Mode (The Browser Interface)

This is the default view when launching the application. It must feature a classic three-pane layout, resizable by splitters.

#### A. Folder Tree Pane (Left)

- Display a native hierarchical tree view of the computer's file system.
- Must load directory structures lazily (expanding a node only reads that specific folder's children). Does not pre-scan subfolders.
- **Windows-specific**: Root at drive root (e.g., `C:\`). Include "↑" (Go up) button for each tree, disabled when at drive root.
- **Dual Trees**: Separate Photos folder tree (top) and Music folder tree (bottom), independent selection.

#### B. File List/Thumbnail Pane (Center)

- Display contents of the folder selected in the Photos Tree Pane.
- **View Mode**: Thumbnails view (grid) - primary mode.
- **Performance Requirement (Critical)**: When opening a folder with 10,000 images, the UI must not freeze. Thumbnails must be generated asynchronously on background threads and populate as the user scrolls (virtual scrolling).
- **Supported File Types**: JPG, PNG, GIF, BMP, TIFF, plus common video containers (MP4, MOV, M4V, WebM).
- **Selection**: Selecting a thumbnail updates the preview pane. Double-clicking opens the View mode.

#### C. Preview/Metadata Pane (Right/Bottom)

- Show a larger preview of the single file selected in the Thumbnail Pane.
- **Images**: Display scaled version of the image.
- **Videos**: Play the selected video in the preview pane until another item is selected.
- **Future**: Show basic EXIF data (Camera model, ISO, Shutter speed, Date Taken).

#### D. Music Section (Left Pane, Below Music Tree)

- Display list of audio files (mp3, wav, m4a, aac, ogg, flac) from selected Music folder.
- Show files by filename without extension.
- **Music Player**: Transport controls (first, previous, stop, pause, play, next, last) and volume slider.
- Music can be played manually or auto-starts when slideshow runs (if configured).

### 3.2. "View" Mode (Single Image Viewer)

Activated by double-clicking an image in "Manage" mode.

#### Interface

- Clean, dark background, maximizing the image area.
- Window geometry is saved and restored.

#### Navigation

- **Arrow keys** (Left/Right) or on-screen buttons to move to the next/previous image in the current folder.
- Wrap-around: After the last image, go to the first; before the first, go to the last.
- **Mouse wheel**: Zoom In / Zoom Out smoothly (future enhancement).

#### Display Options

- "Fit to Screen" (default).
- "Actual Size" (1:1 pixel mapping) - future enhancement.

#### Performance

- Switching between high-resolution (e.g., 24MP+) images must be nearly instantaneous, using pre-fetching if necessary.

#### Controls

- **Slideshow ON/OFF**: Toggle slideshow mode.
- **Stop music**: Button to stop background music.
- **Configure Slideshow**: Open configuration dialog.

### 3.3. Slideshow Module

A configurable slideshow engine launched from the current folder context.

#### Scope

- Launch slideshow using all supported media in the currently selected folder.
- Works from View mode window.

#### Basic Settings

- **Slide duration**: Configurable interval (1-3600 seconds), default 3 seconds.
- **Background music**: 
  - Select music folder independently from photos folder.
  - Options: "No music", "All songs in the selected music folder", or start from a specific song.
  - Music auto-starts when slideshow runs.
  - Music stops when slideshow stops, when the viewer closes, or when the main window closes.
- **Video duration**: 
  - "Display first 5 seconds of video" (default)
  - "Display full video"
  - Configurable via Configure Slideshow dialog.

#### Advanced Settings (Future)

- **Background color**: Usually black.
- **Transitions**: "None" (Cut) and "Fade" (complex 3D transitions lower priority).
- **Scaling**: Toggle between "Stretch to fit screen" (aspect fit) or fill screen.
- **Loop**: Option to restart slideshow after the last image.
- **Order**: Toggle between "Forward" (filename order) and "Shuffle" (random).

#### Controls During Playback

- **Spacebar**: Pause/Resume.
- **ESC**: Exit slideshow and return to View/Manage mode.
- **Arrow keys**: Manual navigation (advances slideshow timer).

#### Text Overlay (Future)

- Ability to display the Filename or Date Taken in a corner during the slideshow.

## Non-Functional Requirements (NFRs)

### Responsiveness

- The application main thread (UI) must never block for more than ~50ms.
- All file I/O and image decoding must happen on worker threads or async operations.
- Thumbnail generation must be asynchronous and non-blocking.

### Memory Usage

- The application should be mindful of RAM usage.
- It should not try to load thousands of full-resolution images into memory at once.
- It should act as a window, discarding data that scrolls out of view.
- Implement thumbnail caching with reasonable size limits.

### Error Handling

- Gracefully handle disconnected drives (external storage unplugged).
- Handle invalid or deleted folder paths.
- Fall back to safe defaults when persisted state is invalid.
- Display user-friendly error messages instead of crashing.

### Persistence

- Save application state to survive restarts:
  - Last Photos folder selected
  - Last Music folder selected
  - Main window geometry (size, position)
  - Viewer window geometry
  - Slideshow interval
  - Slideshow music choice
  - Slideshow video duration setting
- Use SQLite database stored in `config/state.db` next to the application.

### Performance Targets

- **Folder listing**: < 100ms for folders with < 1000 files
- **Thumbnail generation**: First visible thumbnails appear within 200ms
- **Image switching**: < 100ms between images in View mode
- **Startup time**: < 2 seconds to show main window

## Future Scope (Not for V1)

- Batch Renaming/Resizing tools
- Image editing features (crop, rotate, color correction)
- Advanced video playback features
- AI-powered features (e.g., "Find similar images")
- Zoom/Pan in viewer (mouse wheel, click and drag)
- EXIF metadata display
- Slideshow transitions and effects
- Shuffle and loop options for slideshow

## Windows-Specific Requirements

- **File System Root**: Start at drive root (`C:\`, `D:\`, etc.)
- **Go Up Button**: Include "↑" button for folder trees, disabled at drive root
- **Path Handling**: Handle Windows path separators (`\`) correctly
- **Long Paths**: Support Windows long path names (if applicable)
- **Permissions**: Handle permission errors gracefully (e.g., system folders)

## Reference

- **Mac Version**: `C:/projects/Project-V-See` - Reference implementation for feature specifications
- **Audio Library**: `C:/projects/vio-python` - Reference for audio playback requirements
