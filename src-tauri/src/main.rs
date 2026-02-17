// Author: Viorel LUPU
// Date: 2025-02-17
// Purpose: Tauri application entry point for V-See Windows

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Setup code here
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
