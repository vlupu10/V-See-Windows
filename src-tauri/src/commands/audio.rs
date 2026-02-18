// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Audio playback for MP3 player. Uses rodio on a dedicated thread
// so that OutputStream (not Send+Sync on Windows) is never stored in Tauri state.
// Decode result is sent back so the frontend can show "Playback failed: ...".

use rodio::{Decoder, OutputStream, Sink, Source};
use std::fs::File;
use std::io::BufReader;
use std::sync::mpsc;
use std::time::Duration;
use tauri::State;

pub enum AudioCommand {
    Play {
        path: String,
        result_tx: Option<mpsc::Sender<Result<(), String>>>,
    },
    Stop,
    Pause,
}

/// Only the channel sender is stored; the audio thread owns the stream and sink.
pub struct AudioState {
    tx: mpsc::Sender<AudioCommand>,
}

fn try_play(path: &str, sink: &Sink) -> Result<(), String> {
    let path_buf = std::path::PathBuf::from(path);
    let ext = path_buf
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "mp3" => {
            let file = File::open(&path_buf).map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    "File not found.".to_string()
                } else {
                    e.to_string()
                }
            })?;
            let dec = Decoder::new_mp3(BufReader::new(file)).map_err(|e| format!("MP3: {}", e))?;
            sink.append(dec.convert_samples::<f32>());
        }
        "wav" => {
            let file = File::open(&path_buf).map_err(|e| e.to_string())?;
            let dec = Decoder::new_wav(BufReader::new(file)).map_err(|e| format!("WAV: {}", e))?;
            sink.append(dec.convert_samples::<f32>());
        }
        "flac" => {
            let file = File::open(&path_buf).map_err(|e| e.to_string())?;
            let dec = Decoder::new_flac(BufReader::new(file)).map_err(|e| format!("FLAC: {}", e))?;
            sink.append(dec.convert_samples::<f32>());
        }
        "ogg" => {
            let file = File::open(&path_buf).map_err(|e| e.to_string())?;
            let dec = Decoder::new_vorbis(BufReader::new(file)).map_err(|e| format!("Vorbis: {}", e))?;
            sink.append(dec.convert_samples::<f32>());
        }
        _ => {
            if ext.as_str() == "m4a" || ext.as_str() == "aac" {
                return Err("M4A/AAC not supported. Use MP3, WAV, FLAC, or OGG.".to_string());
            }
            let file = File::open(&path_buf).map_err(|e| e.to_string())?;
            let dec = Decoder::new(BufReader::new(file)).map_err(|e| format!("Decode: {}", e))?;
            sink.append(dec.convert_samples::<f32>());
        }
    }
    Ok(())
}

impl AudioState {
    pub fn new() -> Result<Self, String> {
        let (tx, rx) = mpsc::channel();
        std::thread::spawn(move || {
            let (_stream, stream_handle) = match OutputStream::try_default() {
                Ok(x) => x,
                Err(e) => {
                    eprintln!("Audio thread: OutputStream failed: {}", e);
                    return;
                }
            };
            let sink = match Sink::try_new(&stream_handle) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Audio thread: Sink failed: {}", e);
                    return;
                }
            };
            while let Ok(cmd) = rx.recv() {
                match cmd {
                    AudioCommand::Play { path, result_tx } => {
                        sink.stop();
                        sink.clear();
                        let result = try_play(&path, &sink);
                        if let Some(tx) = result_tx {
                            let _ = tx.send(result);
                        }
                    }
                    AudioCommand::Stop => {
                        sink.stop();
                        sink.clear();
                    }
                    AudioCommand::Pause => {
                        if sink.is_paused() {
                            sink.play();
                        } else {
                            sink.pause();
                        }
                    }
                }
            }
        });
        Ok(AudioState { tx })
    }
}

/// Plays the audio file at the given path. Returns when decode succeeds or fails so the UI can show errors.
#[tauri::command]
pub fn play_audio(path: String, state: State<AudioState>) -> Result<(), String> {
    let (result_tx, result_rx) = mpsc::channel();
    state
        .tx
        .send(AudioCommand::Play {
            path,
            result_tx: Some(result_tx),
        })
        .map_err(|e| e.to_string())?;
    result_rx
        .recv_timeout(Duration::from_secs(10))
        .map_err(|_| "Playback start timed out.".to_string())?
}

/// Stops current audio playback.
#[tauri::command]
pub fn stop_audio(state: State<AudioState>) -> Result<(), String> {
    state.tx.send(AudioCommand::Stop).map_err(|e| e.to_string())
}

/// Pauses or resumes playback.
#[tauri::command]
pub fn pause_audio(state: State<AudioState>) -> Result<(), String> {
    state
        .tx
        .send(AudioCommand::Pause)
        .map_err(|e| e.to_string())
}
