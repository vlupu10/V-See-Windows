// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Video thumbnail extraction via ffmpeg (one frame as PNG), returned as data URL.
// If ffmpeg is missing or fails, returns an error so the frontend can show a placeholder.

use base64::{engine::general_purpose::STANDARD, Engine};
use std::process::Command;

/// Extracts a single frame from the video at path (at ~1s to skip black intro).
/// Returns a data URL (data:image/png;base64,...) or an error string.
#[tauri::command]
pub fn get_video_thumbnail_data_url(path: String) -> Result<String, String> {
    let path_buf = std::path::PathBuf::from(&path);
    if !path_buf.is_file() {
        return Err("File not found.".to_string());
    }
    let output = Command::new("ffmpeg")
        .args([
            "-y",
            "-loglevel", "error",
            "-ss", "1",
            "-i", &path,
            "-vframes", "1",
            "-f", "image2",
            "-vcodec", "png",
            "pipe:1",
        ])
        .output()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "ffmpeg not found. Install ffmpeg and add it to PATH.".to_string()
            } else {
                e.to_string()
            }
        })?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffmpeg failed: {}", stderr.trim()));
    }
    if output.stdout.is_empty() {
        return Err("No frame produced.".to_string());
    }
    let b64 = STANDARD.encode(&output.stdout);
    Ok(format!("data:image/png;base64,{}", b64))
}
