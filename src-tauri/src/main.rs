// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Tauri application entry point for V-See Windows

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{
    debug_log, get_all_persisted, get_debug_log_path, get_folder_roots, get_persistence_db_path,
    get_persisted, get_parent_path, get_video_thumbnail_data_url, get_viewer_context, list_directory,
    open_help_window, open_viewer_window, pause_audio, play_audio, read_file_as_audio_url,
    read_file_as_data_url, set_persisted, stop_audio, viewer_next, viewer_prev, AudioState,
    PersistenceState, ViewerState,
};

fn main() {
    tauri::Builder::default()
        .manage(
            AudioState::new().unwrap_or_else(|e| {
                eprintln!("Audio init failed: {}", e);
                panic!("AudioState::new failed");
            }),
        )
        .manage(PersistenceState::new())
        .manage(ViewerState::default())
        .invoke_handler(tauri::generate_handler![
            get_folder_roots,
            list_directory,
            get_parent_path,
            read_file_as_data_url,
            read_file_as_audio_url,
            get_video_thumbnail_data_url,
            open_help_window,
            open_viewer_window,
            get_viewer_context,
            viewer_prev,
            viewer_next,
            debug_log,
            get_debug_log_path,
            get_persisted,
            set_persisted,
            get_all_persisted,
            get_persistence_db_path,
            play_audio,
            stop_audio,
            pause_audio,
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
