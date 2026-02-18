# V-See Windows — User Guide

This guide explains how to **install** and **use** V-See on Windows.

---

## What is V-See?

V-See is a desktop photo and media viewer for Windows. You can:

- **Browse** folders of photos and videos in a thumbnail grid.
- **Preview** images and videos in the main window.
- **Open** a full-screen viewer to look at one image or video and move to the next/previous.
- **Play music** from a folder (MP3 and other audio files) while browsing, with play/pause, seek, and volume.
- **Run a slideshow** with optional background music in the viewer window.

Your last chosen folders and selections are remembered when you close and reopen the app.

---

## System requirements

- **Windows 10 or 11** (64-bit).
- **WebView2** — usually already installed. If the app fails to start, install [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

---

## How to install

### Option A: Install using the MSI installer (recommended)

1. Go to the [Releases](https://github.com/your-org/project-v-see-windows/releases) page of the V-See Windows repository (replace with your actual repo URL).
2. Download the latest **`.msi`** file (e.g. `V-See_0.1.0_x64_en-US.msi`).
3. Double-click the downloaded MSI.
4. Follow the installer steps (choose install location if prompted, then finish).
5. V-See will be available from the **Start Menu** and can be uninstalled via **Settings → Apps**.

### Option B: Build from source

If there is no release yet or you want to build yourself:

1. Install **Node.js** and **Rust** ([rustup.rs](https://rustup.rs/)). After installing Rust, open a **new** terminal.
2. Clone the repository and go to the project folder:
   ```powershell
   git clone https://github.com/your-org/project-v-see-windows.git
   cd project-v-see-windows
   ```
3. Install dependencies and build:
   ```powershell
   npm install
   npm run tauri build
   ```
4. The installer will be in `src-tauri\target\release\bundle\` (e.g. `.msi`). Run that MSI to install, or run the `.exe` in `src-tauri\target\release\` for a one-off run without installing.

---

## How to use the application

### Main window

The main window has **two sides**, with resizable panels (you can drag the dividers to resize):

**Left side**

- **Photos folder tree** — Navigate your drives and folders. Click a folder to load its photos and videos in the grid.
- **Music folder tree** — Choose a folder that contains audio files (e.g. MP3).
- **Playable files** — List of audio files in the selected music folder. Click a file to start playing it.
- **Player** — Progress bar (drag to seek), play/pause, stop, previous/next, and volume.

**Right side**

- **Files (thumbnails)** — Grid of image and video thumbnails for the selected photos folder.  
  - **Single click** — Shows the file in the preview pane and remembers your selection.  
  - **Double click** — Opens the **viewer window** with that file and lets you move through the list with Prev/Next.
- **Preview / Metadata** — Shows the selected image or video (or a placeholder for HEIC/PDF).
- **Help** — Bottom panel; the **Help** button shows technical state info (for support/debug). General usage is described in this guide.

**Persistence**

- The app saves your last **photos folder**, **music folder**, and **selected file/track**. When you open V-See again, it restores those so you can continue where you left off.

### Viewer window (full-screen style)

When you **double-click** a thumbnail (or open from the grid), a **viewer window** opens with a single image or video.

- **Previous / Next** — Move to the previous or next file in the current folder list.
- **Slideshow** — Start or stop automatic advance; interval can be set in config.
- **Stop music** — Stops the main window’s music playback.
- **Config** — Adjust slideshow interval and other options.
- **Fullscreen** — Toggle fullscreen for the viewer.

Videos in the viewer have standard playback controls (play, pause, seek). HEIC and PDF show a placeholder (not rendered in this viewer).

### Supported formats

- **Images:** JPG, PNG, GIF, BMP, WebP, TIFF, ICO, SVG (thumbnails and preview; HEIC/HEIF show a placeholder).
- **Videos:** MP4, MOV, AVI, WebM, MKV, M4V, WMV (preview and viewer with controls).
- **Audio:** MP3 and other formats supported by the system (in the playable list and player).
- **PDF / HEIC:** Listed and show a placeholder; not displayed as content.

---

## Troubleshooting

- **App does not start**  
  Ensure WebView2 is installed (see [System requirements](#system-requirements)).

- **No thumbnails or preview**  
  Make sure you selected a folder in the **Photos folder tree**. Only image/video files in that folder appear in the grid.

- **Music does not play**  
  Select a folder in the **Music folder tree**, then click a file in the **Playable files** list. Check that the file format is supported and volume is not muted.

- **Viewer does not open**  
  Double-click a thumbnail (not single-click). If it still fails, check the main window’s help area for an error message.

For developers: see the main [README](../README.md) and [TODO](TODO.md) in the repo for build and contribution details.
