// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Tauri commands for file system operations (list directories, drive roots).
// Used by the folder tree to lazy-load children. Handles errors for disconnected drives.

use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use std::path::PathBuf;

/// Single entry returned from list_directory (file or directory).
/// Frontend uses this for the tree; only directories are shown as expandable.
#[derive(Debug, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

/// Result of list_directory. Returns entries or an error message for the UI.
#[derive(Debug, Serialize)]
pub struct ListDirResult {
    pub ok: bool,
    pub entries: Option<Vec<DirEntry>>,
    pub error: Option<String>,
}

/// Maps OS errors to short, user-friendly messages (e.g. disconnected drive).
fn friendly_error(e: &std::io::Error) -> String {
    let msg = e.to_string();
    let lower = msg.to_lowercase();
    if lower.contains("not ready") || lower.contains("device is not ready") {
        return "Drive unavailable or disconnected.".to_string();
    }
    if lower.contains("access is denied") || lower.contains("permission denied") {
        return "Access denied.".to_string();
    }
    if lower.contains("path not found") || lower.contains("no such file") || lower.contains("the system cannot find") {
        return "Path not found (drive may have been disconnected).".to_string();
    }
    if lower.contains("not found") {
        return "Not found.".to_string();
    }
    msg
}

/// Lists direct children of the given path (directories only for folder tree).
/// Sorted by name (case-insensitive). Returns error if path is invalid or inaccessible.
/// Defensive: external drives can be disconnected at any time; errors are returned cleanly.
#[tauri::command]
pub fn list_directory(path: String) -> ListDirResult {
    let path_buf = PathBuf::from(&path);
    if !path_buf.is_dir() {
        return ListDirResult {
            ok: false,
            entries: None,
            error: Some("Path is not a directory.".to_string()),
        };
    }
    let read = match std::fs::read_dir(&path_buf) {
        Ok(r) => r,
        Err(e) => {
            return ListDirResult {
                ok: false,
                entries: None,
                error: Some(friendly_error(&e)),
            };
        }
    };
    let mut entries: Vec<DirEntry> = Vec::new();
    for entry in read.flatten() {
        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let is_dir = meta.is_dir();
        let path_buf = entry.path();
        let path_str = path_buf.to_string_lossy().into_owned();
        let name = path_buf
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();
        entries.push(DirEntry {
            name,
            path: path_str,
            is_dir,
        });
    }
    entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    ListDirResult {
        ok: true,
        entries: Some(entries),
        error: None,
    }
}

/// Returns currently accessible drive roots (e.g. C:\, D:\, E:\) for the folder tree.
/// Only includes drives that can be read (avoids showing disconnected/external that are "not ready").
/// Call again (e.g. Refresh) to pick up newly connected external devices.
#[tauri::command]
pub fn get_folder_roots() -> ListDirResult {
    #[cfg(target_os = "windows")]
    {
        let mut entries = Vec::new();
        for letter in b'A'..=b'Z' {
            let root = format!("{}:\\", letter as char);
            let path_buf = PathBuf::from(&root);
            // Only include drives we can actually read (defensive: skip disconnected/external not ready)
            if path_buf.is_dir() {
                if std::fs::read_dir(&path_buf).is_ok() {
                    entries.push(DirEntry {
                        name: root.clone(),
                        path: root,
                        is_dir: true,
                    });
                }
            }
        }
        ListDirResult {
            ok: true,
            entries: Some(entries),
            error: None,
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var_os("HOME")
            .map(PathBuf::from)
            .filter(|p| p.is_dir());
        let entries = home
            .map(|p| {
                let path_str = p.to_string_lossy().into_owned();
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("Home").to_string();
                vec![DirEntry {
                    name,
                    path: path_str,
                    is_dir: true,
                }]
            })
            .unwrap_or_default();
        ListDirResult {
            ok: true,
            entries: Some(entries),
            error: None,
        }
    }
}

/// Returns the parent path of the given path, or None if at root.
#[tauri::command]
pub fn get_parent_path(path: String) -> Option<String> {
    let p = PathBuf::from(&path);
    let parent = p.parent()?;
    let parent_str = parent.to_string_lossy().into_owned();
    if parent_str.is_empty() || parent == p {
        return None;
    }
    Some(parent_str)
}

/// Max size (bytes) for read_file_as_data_url to avoid loading huge files.
const MAX_DATA_URL_SIZE: u64 = 8 * 1024 * 1024;

/// Max size (bytes) for read_file_as_audio_url (audio playback via data URL when asset protocol fails).
const MAX_AUDIO_DATA_URL_SIZE: u64 = 32 * 1024 * 1024;

/// Returns a data URL (e.g. data:image/jpeg;base64,...) for the file at path.
/// Used as fallback when asset protocol fails for preview. Limited to 8MB.
#[tauri::command]
pub fn read_file_as_data_url(path: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    if ext == "heic" || ext == "heif" {
        return Err("HEIC/HEIF is not supported".to_string());
    }
    if ext == "pdf" {
        return Err("PDF cannot be displayed".to_string());
    }
    let meta = std::fs::metadata(&p).map_err(|e| e.to_string())?;
    if meta.is_dir() {
        return Err("Path is a directory".to_string());
    }
    if meta.len() > MAX_DATA_URL_SIZE {
        return Err("File too large for preview".to_string());
    }
    let bytes = std::fs::read(&p).map_err(|e| e.to_string())?;
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "tiff" | "tif" => "image/tiff",
        "ico" => "image/x-icon",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    };
    let b64 = STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}

/// Returns a data URL for an audio file so the frontend can play it without relying on the asset protocol.
/// Used when convertFileSrc fails ("no supported sources"). Limited to 32MB.
#[tauri::command]
pub fn read_file_as_audio_url(path: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let meta = std::fs::metadata(&p).map_err(|e| e.to_string())?;
    if meta.is_dir() {
        return Err("Path is a directory.".to_string());
    }
    if meta.len() > MAX_AUDIO_DATA_URL_SIZE {
        return Err("File too large for playback (max 32MB).".to_string());
    }
    let bytes = std::fs::read(&p).map_err(|e| e.to_string())?;
    let mime = match ext.as_str() {
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "m4a" => "audio/mp4",
        "aac" => "audio/aac",
        "flac" => "audio/flac",
        "wma" => "audio/x-ms-wma",
        "opus" => "audio/opus",
        "webm" => "audio/webm",
        _ => "application/octet-stream",
    };
    let b64 = STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}
