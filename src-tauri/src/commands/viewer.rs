// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Viewer (Display) window: open a second window with image list and index.
// The viewer window reads context via get_viewer_context and navigates with viewer_prev/viewer_next.

use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};

pub struct ViewerState {
    pub inner: Mutex<ViewerContext>,
}

pub struct ViewerContext {
    pub paths: Vec<String>,
    pub index: usize,
}

impl Default for ViewerState {
    fn default() -> Self {
        ViewerState {
            inner: Mutex::new(ViewerContext {
                paths: Vec::new(),
                index: 0,
            }),
        }
    }
}

/// Opens the viewer window with the given paths and start index. If the viewer window
/// already exists, focuses it and updates the context.
#[tauri::command]
pub async fn open_viewer_window(
    app: AppHandle,
    paths: Vec<String>,
    start_index: usize,
    state: State<'_, ViewerState>,
) -> Result<(), String> {
    let index = if paths.is_empty() {
        0
    } else {
        start_index.min(paths.len().saturating_sub(1))
    };
    {
        let mut ctx = state.inner.lock().map_err(|e| e.to_string())?;
        ctx.paths = paths;
        ctx.index = index;
    }
    let label = "viewer";
    if let Some(w) = app.webview_windows().get(label) {
        let _ = w.set_focus();
        return Ok(());
    }
    let url = WebviewUrl::App("viewer.html".into());
    WebviewWindowBuilder::new(&app, label, url)
        .title("V-See – Viewer")
        .inner_size(1200.0, 800.0)
        .min_inner_size(400.0, 300.0)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Returns the current viewer context (paths and index) for the viewer window to display.
#[tauri::command]
pub fn get_viewer_context(state: State<'_, ViewerState>) -> Result<(Vec<String>, usize), String> {
    let ctx = state.inner.lock().map_err(|e| e.to_string())?;
    Ok((ctx.paths.clone(), ctx.index))
}

/// Moves to the previous item (wrap to end) and returns the current path and name.
#[tauri::command]
pub fn viewer_prev(state: State<'_, ViewerState>) -> Result<Option<(String, String)>, String> {
    let mut ctx = state.inner.lock().map_err(|e| e.to_string())?;
    if ctx.paths.is_empty() {
        return Ok(None);
    }
    ctx.index = if ctx.index == 0 {
        ctx.paths.len() - 1
    } else {
        ctx.index - 1
    };
    let path = ctx.paths[ctx.index].clone();
    let name = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    Ok(Some((path, name)))
}

/// Moves to the next item (wrap to start) and returns the current path and name.
#[tauri::command]
pub fn viewer_next(state: State<'_, ViewerState>) -> Result<Option<(String, String)>, String> {
    let mut ctx = state.inner.lock().map_err(|e| e.to_string())?;
    if ctx.paths.is_empty() {
        return Ok(None);
    }
    ctx.index = (ctx.index + 1) % ctx.paths.len();
    let path = ctx.paths[ctx.index].clone();
    let name = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    Ok(Some((path, name)))
}
