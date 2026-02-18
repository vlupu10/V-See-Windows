// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Debug logging to a file. Frontend console.log/error and backend messages
// are written to a log file for debugging. Echoes frontend logs and errors.

use std::fs::OpenOptions;
use std::time::{SystemTime, UNIX_EPOCH};

fn format_timestamp() -> String {
    let d = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = d.as_secs();
    let millis = d.subsec_millis();
    let (date, time) = {
        const SECS_PER_DAY: u64 = 86400;
        let days_since_epoch = secs / SECS_PER_DAY;
        let time_secs = secs % SECS_PER_DAY;
        let hour = time_secs / 3600;
        let min = (time_secs % 3600) / 60;
        let sec = time_secs % 60;
        let (y, m, d) = days_to_ymd(days_since_epoch);
        (
            format!("{:04}-{:02}-{:02}", y, m, d),
            format!("{:02}:{:02}:{:02}.{:03}", hour, min, sec, millis),
        )
    };
    format!("{} {}", date, time)
}

#[allow(clippy::many_single_char_names)]
fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    let (mut y, mut m, mut d) = (1970u64, 1u64, 1u64);
    let mut n = days + 1;
    let is_leap = |year: u64| year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let month_days = |year: u64, month: u64| {
        let feb = if is_leap(year) { 29 } else { 28 };
        match month {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 => feb,
            _ => 0,
        }
    };
    while n > 0 {
        let dim = month_days(y, m);
        if n > dim {
            n -= dim;
            m += 1;
            if m > 12 {
                m = 1;
                y += 1;
            }
        } else {
            d = n;
            n = 0;
        }
    }
    (y, m, d)
}
use std::io::Write;
use std::path::PathBuf;

/// Log file path: APPDATA/V-See/logs/v-see.log (Windows) or HOME/.v-see/logs/v-see.log (Unix).
fn log_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("APPDATA").map(PathBuf::from).map(|p| p.join("V-See").join("logs"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var_os("HOME")
            .map(PathBuf::from)
            .map(|p| p.join(".v-see").join("logs"))
    }
}

fn log_path() -> Option<PathBuf> {
    log_dir().map(|d| d.join("v-see.log"))
}

/// Writes a single line to the log file. Creates the log directory if needed.
/// Format: "YYYY-MM-DD HH:MM:SS [LEVEL] message"
fn write_log_line(level: &str, message: &str) -> Result<(), String> {
    let path = log_path().ok_or_else(|| "Could not determine log directory".to_string())?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let ts = format_timestamp();
    let line = format!("{} [{}] {}\n", ts, level.to_uppercase(), message);
    let mut f = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("{}: {}", path.display(), e))?;
    f.write_all(line.as_bytes())
        .map_err(|e| e.to_string())?;
    f.flush().map_err(|e| e.to_string())?;
    Ok(())
}

/// Tauri command: append a message to the debug log file and echo to stderr (terminal).
/// Called by the frontend for console.log/warn/error and unhandled errors.
#[tauri::command]
pub fn debug_log(level: String, message: String) -> Result<(), String> {
    let level = level.as_str();
    let level = match level {
        "log" | "info" => "INFO",
        "warn" | "warning" => "WARN",
        "error" => "ERROR",
        "debug" => "DEBUG",
        _ => level,
    };
    // Echo to terminal when running e.g. `tauri dev`
    eprintln!("[{}] {}", level, message);
    write_log_line(level, &message)
}

/// Returns the path to the log file for display in UI or help.
#[tauri::command]
pub fn get_debug_log_path() -> Option<String> {
    log_path().map(|p| p.to_string_lossy().into_owned())
}
