// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Tauri command handlers module

mod audio;
mod debug_log;
mod fs;
mod persistence;
mod video_thumb;
mod viewer;

pub use audio::{play_audio, stop_audio, pause_audio, AudioState};
pub use debug_log::{debug_log, get_debug_log_path};
pub use fs::{get_folder_roots, get_parent_path, list_directory, read_file_as_audio_url, read_file_as_data_url};
pub use persistence::{get_all_persisted, get_persistence_db_path, get_persisted, set_persisted, PersistenceState};
pub use video_thumb::get_video_thumbnail_data_url;
pub use viewer::{get_viewer_context, open_viewer_window, viewer_next, viewer_prev, ViewerState};
