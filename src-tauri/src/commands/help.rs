// Author: Viorel LUPU
// Purpose: Open the Help window (static HTML from Project-V-See help_dialog.py).

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Opens the Help window. If it already exists, focuses it.
#[tauri::command]
pub async fn open_help_window(app: AppHandle) -> Result<(), String> {
    let label = "help";
    if let Some(w) = app.webview_windows().get(label) {
        let _ = w.set_focus();
        return Ok(());
    }
    let url = WebviewUrl::App("help.html".into());
    WebviewWindowBuilder::new(&app, label, url)
        .title("V-See – Help")
        .inner_size(560.0, 520.0)
        .min_inner_size(400.0, 300.0)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}
