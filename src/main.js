// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Frontend entry point for V-See Windows

import { createFolderTree } from './components/FolderTree.js';
import { loadThumbnails } from './components/ThumbnailGrid.js';
import { loadPlayableList } from './components/PlayableList.js';

/** Show a message or error in the bottom help panel (also used for errors). */
export function setHelpMessage(text, isError = false) {
    const el = document.getElementById('help-message');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('error', !!isError);
}

/** Returns Tauri's convertFileSrc for asset URLs; null when not in Tauri. */
function getConvertFileSrc() {
    return window.__TAURI__?.core?.convertFileSrc;
}

/** Show selected image/video in the preview pane. Uses asset URL first; for images, falls back to data URL if load fails. */
function showPreview(filePath, name) {
    const viewer = document.getElementById('viewer-content');
    if (!viewer) return;
    const invokeFn = window.__TAURI__?.core?.invoke;
    const convertFileSrc = getConvertFileSrc();
    const ext = (name.split('.').pop() || '').toLowerCase();
    const isVideo = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', 'wmv'].includes(ext);
    const isHeic = ['heic', 'heif'].includes(ext);
    const isPdf = ext === 'pdf';
    if (isHeic) {
        viewer.innerHTML = '<p class="placeholder">HEIC</p>';
        return;
    }
    if (isPdf) {
        viewer.innerHTML = '<p class="placeholder">PDF cannot be displayed.</p>';
        return;
    }
    if (isVideo) {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'auto';
        video.autoplay = true;
        video.playsInline = true;
        video.muted = false;
        video.className = 'viewer-video';
        viewer.innerHTML = '';
        viewer.appendChild(video);
        function setVideoPlaceholder(msg) {
            viewer.innerHTML = '<p class="placeholder">' + (msg || name || 'Video could not be loaded') + '</p>';
        }
        if (convertFileSrc) {
            try {
                video.src = convertFileSrc(filePath);
                video.onerror = () => {
                    setVideoPlaceholder('Video failed to load. Check path or format.');
                };
                video.play().catch(() => {});
            } catch (_) {
                setVideoPlaceholder();
            }
        } else {
            setVideoPlaceholder('Tauri not available');
        }
        return;
    }

    const img = document.createElement('img');
    img.alt = name;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    viewer.innerHTML = '';
    viewer.appendChild(img);

    function setPlaceholder() {
        viewer.innerHTML = '<p class="placeholder">' + name + '</p>';
    }

    if (convertFileSrc) {
        try {
            img.src = convertFileSrc(filePath);
        } catch (_) {
            setPlaceholder();
            return;
        }
    }

    img.onerror = async () => {
        if (!invokeFn) {
            setPlaceholder();
            return;
        }
        try {
            const dataUrl = await invokeFn('read_file_as_data_url', { path: filePath });
            img.src = dataUrl;
            img.onerror = setPlaceholder;
        } catch (_) {
            setPlaceholder();
        }
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('V-See app started');
    const photosContainer = document.getElementById('photos-folder-tree');
    const musicContainer = document.getElementById('music-folder-tree');
    const thumbGrid = document.getElementById('thumbnails-grid');
    const playableList = document.getElementById('playable-files-list');
    const helpBtn = document.getElementById('help-btn');
    const invokeFn = window.__TAURI__?.core?.invoke;

    const reportError = (msg) => setHelpMessage(msg || '', msg !== '');

    /** Parent directory of a file path (so we can open the folder that contains the selected file/track). */
    function dirname(p) {
        if (!p || typeof p !== 'string') return '';
        const s = p.trim().replace(/\//g, '\\');
        const i = s.lastIndexOf('\\');
        if (i < 0) return s;
        const out = s.slice(0, i);
        if (out.length === 2 && out[1] === ':') return out + '\\';
        return out;
    }

    let lastFolder = null;
    let lastMusicFolder = null;
    let lastSelectedFile = null;
    let lastSelectedTrack = null;
    if (invokeFn) {
        try {
            const folder = await invokeFn('get_persisted', { key: 'last_folder' });
            const music = await invokeFn('get_persisted', { key: 'last_music_folder' });
            const file = await invokeFn('get_persisted', { key: 'last_selected_file' });
            const track = await invokeFn('get_persisted', { key: 'last_selected_track' });
            lastFolder = typeof folder === 'string' && folder.trim() ? folder.trim() : null;
            lastMusicFolder = typeof music === 'string' && music.trim() ? music.trim() : null;
            lastSelectedFile = typeof file === 'string' && file.trim() ? file.trim() : null;
            lastSelectedTrack = typeof track === 'string' && track.trim() ? track.trim() : null;
            console.log('Persistence loaded:', { lastFolder, lastMusicFolder, lastSelectedFile, lastSelectedTrack });
        } catch (e) {
            console.warn('Persistence load failed:', e);
        }
    }

    let pendingRestoreSelectedFile = lastSelectedFile;
    let pendingRestoreSelectedTrack = lastSelectedTrack;
    const folderToRestore = lastSelectedFile ? dirname(lastSelectedFile) : lastFolder;
    const musicFolderToRestore = lastSelectedTrack ? dirname(lastSelectedTrack) : lastMusicFolder;
    if (typeof window !== 'undefined' && window.vseeLog) {
        window.vseeLog.debug('Main', 'restore paths', { folderToRestore: folderToRestore || '(none)', musicFolderToRestore: musicFolderToRestore || '(none)' });
    }

    /** In-memory current selection so we can persist on close even if last async persist didn't complete. */
    let currentPhotosFolder = folderToRestore || '';
    let currentMusicFolder = musicFolderToRestore || '';
    let lastSelectedFilePath = lastSelectedFile || '';

    /** Writes a key/value pair to the persisted state DB (async; fire-and-forget). */
    function persist(key, value) {
        if (!key || value === undefined || value === null) return;
        const v = String(value).trim();
        if (v === '') return;
        const inv = window.__TAURI__?.core?.invoke;
        if (typeof inv !== 'function') return;
        inv('set_persisted', { key, value: v }).catch((e) => console.warn('set_persisted', key, 'failed:', e));
    }

    let selectedTrackPath = null;

    /** Writes current folder/file/track selection to the state DB. Called on beforeunload/pagehide so last selection is saved before exit. */
    function persistCurrentState() {
        if (currentPhotosFolder) persist('last_folder', currentPhotosFolder);
        if (currentMusicFolder) persist('last_music_folder', currentMusicFolder);
        if (lastSelectedFilePath) persist('last_selected_file', lastSelectedFilePath);
        if (selectedTrackPath) persist('last_selected_track', selectedTrackPath);
    }

    if (photosContainer && thumbGrid) {
        createFolderTree(photosContainer, 'Photos folder', (path, opts) => {
            setHelpMessage('');
            currentPhotosFolder = path || currentPhotosFolder;
            if (!opts?.programmatic) persist('last_folder', path);
            const initialFile = pendingRestoreSelectedFile || undefined;
            if (pendingRestoreSelectedFile) pendingRestoreSelectedFile = null;
            loadThumbnails(thumbGrid, path, (filePath, name) => {
                showPreview(filePath, name);
                lastSelectedFilePath = filePath || '';
                currentPhotosFolder = dirname(filePath) || currentPhotosFolder;
                persist('last_selected_file', filePath);
                persist('last_folder', dirname(filePath));
            }, (paths, startIndex) => {
                const inv = window.__TAURI__?.core?.invoke;
                if (typeof inv === 'function' && paths && paths.length) {
                    inv('open_viewer_window', { paths, startIndex }).catch((e) => setHelpMessage('Could not open viewer: ' + (e?.message || e), true));
                }
            }, initialFile).then(() => {});
        }, reportError, folderToRestore || undefined);
    }
    if (musicContainer && playableList) {
        createFolderTree(musicContainer, 'Music folder', (path, opts) => {
            setHelpMessage('');
            currentMusicFolder = path || currentMusicFolder;
            if (!opts?.programmatic) persist('last_music_folder', path);
            const initialTrack = pendingRestoreSelectedTrack || undefined;
            if (pendingRestoreSelectedTrack) pendingRestoreSelectedTrack = null;
            loadPlayableList(playableList, path, (filePath) => {
                selectedTrackPath = filePath;
                currentMusicFolder = dirname(filePath) || currentMusicFolder;
                persist('last_selected_track', filePath);
                persist('last_music_folder', dirname(filePath));
                startAudioPlayback(filePath);
            }, initialTrack);
        }, reportError, musicFolderToRestore || undefined);
    }

    const audioEl = document.getElementById('player-audio');
    const progressRange = document.getElementById('player-progress');
    const playerTimeEl = document.getElementById('player-time');
    const playBtn = document.getElementById('player-play');
    const stopBtn = document.getElementById('player-stop');
    const volumeEl = document.getElementById('volume');
    const convertFileSrc = getConvertFileSrc();

    /** Format seconds as M:SS. */
    function formatTime(s) {
        if (!Number.isFinite(s) || s < 0) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function updatePlayButtonIcon() {
        if (!playBtn) return;
        const paused = !audioEl || audioEl.paused;
        playBtn.title = paused ? 'Play' : 'Pause';
        playBtn.dataset.icon = paused ? 'play' : 'pause';
        playBtn.textContent = paused ? '\u25B6' : '\u23F8';
    }

    function updateProgress() {
        if (!audioEl || !progressRange || !playerTimeEl) return;
        const d = audioEl.duration;
        const t = audioEl.currentTime;
        if (Number.isFinite(d) && d > 0) {
            progressRange.value = Math.min(100, (t / d) * 100);
        } else {
            progressRange.value = 0;
        }
        playerTimeEl.textContent = formatTime(t) + ' / ' + formatTime(Number.isFinite(d) ? d : 0);
    }

    /** Start playing a track using the HTML5 audio element. Uses read_file_as_audio_url so playback works without asset protocol. */
    async function startAudioPlayback(filePath) {
        if (!audioEl || !filePath) {
            setHelpMessage('Audio not available.', true);
            return;
        }
        const invokeFn = window.__TAURI__?.core?.invoke;
        if (typeof invokeFn !== 'function') {
            setHelpMessage('Tauri not available.', true);
            return;
        }
        setHelpMessage('Loading…');
        try {
            const dataUrl = await invokeFn('read_file_as_audio_url', { path: filePath });
            setHelpMessage('');
            if (!dataUrl || typeof dataUrl !== 'string') {
                setHelpMessage('Playback failed: no data.', true);
                return;
            }
            audioEl.src = dataUrl;
            if (volumeEl) audioEl.volume = Number(volumeEl.value) / 100;
            await audioEl.play();
            updatePlayButtonIcon();
        } catch (e) {
            setHelpMessage('Playback failed: ' + (e?.message || e), true);
        }
    }

    if (audioEl) {
        audioEl.addEventListener('timeupdate', updateProgress);
        audioEl.addEventListener('loadedmetadata', updateProgress);
        audioEl.addEventListener('ended', () => { updateProgress(); updatePlayButtonIcon(); });
        audioEl.addEventListener('play', updatePlayButtonIcon);
        audioEl.addEventListener('pause', updatePlayButtonIcon);
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!selectedTrackPath) {
                setHelpMessage('Select a track from the list first.', true);
                return;
            }
            if (!audioEl) return;
            if (audioEl.paused) {
                if (audioEl.src) {
                    audioEl.play().catch((e) => setHelpMessage('Playback failed: ' + (e?.message || e), true));
                } else {
                    startAudioPlayback(selectedTrackPath);
                }
            } else {
                audioEl.pause();
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (audioEl) {
                audioEl.pause();
                audioEl.currentTime = 0;
                updateProgress();
                updatePlayButtonIcon();
            }
            setHelpMessage('');
        });
    }

    if (progressRange && audioEl) {
        progressRange.addEventListener('input', () => {
            const d = audioEl.duration;
            if (Number.isFinite(d) && d > 0) {
                audioEl.currentTime = (Number(progressRange.value) / 100) * d;
            }
        });
    }

    if (volumeEl && audioEl) {
        volumeEl.addEventListener('input', () => {
            audioEl.volume = Number(volumeEl.value) / 100;
        });
        audioEl.volume = Number(volumeEl.value) / 100;
    }

    const eventApi = window.__TAURI__?.event;
    if (eventApi && typeof eventApi.listen === 'function') {
        eventApi.listen('stop-music', () => {
            if (audioEl) {
                audioEl.pause();
                audioEl.currentTime = 0;
                updateProgress();
                updatePlayButtonIcon();
            }
        }).catch(() => {});
    }

    const inv = () => window.__TAURI__?.core?.invoke;
    if (helpBtn) {
        helpBtn.addEventListener('click', async () => {
            const fn = inv();
            if (typeof fn !== 'function') {
                setHelpMessage('Help content will go here.');
                return;
            }
            try {
                const state = await fn('get_all_persisted');
                const logPath = await fn('get_debug_log_path');
                let msg = 'State DB: ' + (state?.db_path || '?') + '\n';
                if (state?.entries?.length) {
                    state.entries.forEach((e) => {
                        const v = (e.value && e.value.length > 80) ? e.value.slice(0, 77) + '...' : (e.value || '');
                        msg += e.key + ': ' + v + '\n';
                    });
                } else {
                    msg += '(no entries yet)\n';
                }
                if (logPath) msg += 'Log file: ' + logPath;
                setHelpMessage(msg.trim());
            } catch (e) {
                try {
                    const dbPath = await fn('get_persistence_db_path');
                    setHelpMessage('State DB: ' + (dbPath || '?') + '\n(empty or error: ' + (e?.message || e) + ')');
                } catch (_) {
                    setHelpMessage('Could not load state: ' + (e?.message || e));
                }
            }
        });
    }

    window.addEventListener('beforeunload', () => { persistCurrentState(); });
    window.addEventListener('pagehide', () => { persistCurrentState(); });
});
