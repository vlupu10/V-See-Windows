// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: SQLite persistence for V-See Windows. Mirrors Project-V-See persistence.py:
// key-value store in app_state (key TEXT PRIMARY KEY, value TEXT). Location: config dir
// next to app (portable) or APPDATA on Windows for installed app.

use rusqlite::Connection;
use serde::Serialize;
use std::path::PathBuf;
use tauri::State;

/// Keys matching Project-V-See persistence.py (used by frontend; kept for reference).
#[allow(dead_code)]
pub const LAST_FOLDER_KEY: &str = "last_folder";
#[allow(dead_code)]
pub const LAST_MUSIC_FOLDER_KEY: &str = "last_music_folder";
#[allow(dead_code)]
pub const MAIN_WINDOW_GEOMETRY_KEY: &str = "main_window_geometry";
#[allow(dead_code)]
pub const VIEWER_WINDOW_GEOMETRY_KEY: &str = "viewer_window_geometry";
#[allow(dead_code)]
pub const SLIDESHOW_INTERVAL_SECONDS_KEY: &str = "slideshow_interval_seconds";
#[allow(dead_code)]
pub const SLIDESHOW_MUSIC_KEY: &str = "slideshow_music";
#[allow(dead_code)]
pub const SLIDESHOW_VIDEO_DURATION_KEY: &str = "slideshow_video_duration";
#[allow(dead_code)]
pub const LAST_SELECTED_FILE_KEY: &str = "last_selected_file";
#[allow(dead_code)]
pub const LAST_SELECTED_TRACK_KEY: &str = "last_selected_track";

fn db_path() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        let appdata = std::env::var("APPDATA").map_err(|_| "APPDATA not set".to_string())?;
        let dir = PathBuf::from(appdata).join("V-See");
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        Ok(dir.join("state.db"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
        let dir = PathBuf::from(home).join(".config").join("v-see");
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        Ok(dir.join("state.db"))
    }
}

fn ensure_schema(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT)",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub struct PersistenceState {}

impl PersistenceState {
    pub fn new() -> Self {
        PersistenceState {}
    }

    fn with_conn<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> Result<T, String>,
    {
        let path = db_path()?;
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        ensure_schema(&conn)?;
        let out = f(&conn)?;
        Ok(out)
    }
}

#[tauri::command]
pub fn get_persisted(key: String, state: State<PersistenceState>) -> Result<Option<String>, String> {
    state.with_conn(|conn| {
        let mut stmt = conn
            .prepare("SELECT value FROM app_state WHERE key = ?")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt.query([&key]).map_err(|e| e.to_string())?;
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let value: String = row.get(0).map_err(|e| e.to_string())?;
            return Ok(Some(value));
        }
        Ok(None)
    })
}

#[tauri::command]
pub fn set_persisted(key: String, value: String, state: State<PersistenceState>) -> Result<(), String> {
    state.with_conn(|conn| {
        conn.execute(
            "INSERT INTO app_state (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
            [&key, &value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[derive(Debug, Serialize)]
pub struct PersistedEntry {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize)]
pub struct AllPersistedResult {
    pub db_path: String,
    pub entries: Vec<PersistedEntry>,
}

/// Returns the path to state.db (for display in UI).
#[tauri::command]
pub fn get_persistence_db_path(_state: State<PersistenceState>) -> Result<String, String> {
    let path = db_path()?;
    Ok(path.to_string_lossy().into_owned())
}

/// Returns all key-value pairs in state.db for debugging / status display.
#[tauri::command]
pub fn get_all_persisted(state: State<PersistenceState>) -> Result<AllPersistedResult, String> {
    let path = db_path()?;
    let path_str = path.to_string_lossy().into_owned();
    state.with_conn(|conn| {
        let mut stmt = conn
            .prepare("SELECT key, value FROM app_state ORDER BY key")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(PersistedEntry {
                    key: row.get(0)?,
                    value: row.get(1)?,
                })
            })
            .map_err(|e| e.to_string())?;
        let entries: Vec<PersistedEntry> = rows.filter_map(|r| r.ok()).collect();
        Ok(AllPersistedResult {
            db_path: path_str,
            entries,
        })
    })
}
