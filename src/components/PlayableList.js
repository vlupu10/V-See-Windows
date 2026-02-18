// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Lists audio files in the selected music folder and lets user select a track for playback.

const AUDIO_EXT = new Set([
    'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus', 'webm'
]);

/** Tauri invoke; null when not running inside the app. */
function getInvoke() {
    return window.__TAURI__?.core?.invoke;
}

/** True if the filename has an audio extension we can play. */
function isAudioFile(name) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return AUDIO_EXT.has(ext);
}

/**
 * Loads direct audio files from folderPath and renders them into listEl.
 * @param {HTMLElement} listEl - #playable-files-list
 * @param {string} folderPath - Selected music folder path
 * @param {(path: string, name: string) => void} onSelect - When a track is selected
 * @param {string} [initialSelectedPath] - Optional: path to select after load (restore; defensive: ignored if not in list)
 * @returns {Promise<string[]>} Paths of playable files (for playlist)
 */
export async function loadPlayableList(listEl, folderPath, onSelect, initialSelectedPath) {
    if (!listEl) return [];
    listEl.innerHTML = '<p class="placeholder">Loading…</p>';
    const invokeFn = getInvoke();
    if (!invokeFn) {
        listEl.innerHTML = '<p class="placeholder">Tauri API not available</p>';
        return [];
    }
    let result;
    try {
        result = await invokeFn('list_directory', { path: folderPath });
    } catch (e) {
        listEl.innerHTML = '<p class="placeholder">Error loading folder</p>';
        return [];
    }
    if (!result.ok || !result.entries) {
        listEl.innerHTML = '<p class="placeholder">' + (result.error || 'Could not read folder') + '</p>';
        return [];
    }
    const files = result.entries.filter((e) => !e.is_dir && isAudioFile(e.name));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    listEl.innerHTML = '';
    listEl.classList.add('playable-list');
    const paths = [];
    for (const file of files) {
        paths.push(file.path);
        const row = document.createElement('div');
        row.className = 'playable-item';
        row.setAttribute('data-path', file.path);
        row.textContent = file.name;
        row.addEventListener('click', () => {
            listEl.querySelectorAll('.playable-item').forEach((r) => r.classList.remove('selected'));
            row.classList.add('selected');
            if (onSelect) onSelect(file.path, file.name);
        });
        listEl.appendChild(row);
    }
    if (files.length === 0) {
        listEl.innerHTML = '<p class="placeholder">No audio files in this folder</p>';
    } else {
        const pathToSelect = typeof initialSelectedPath === 'string' && initialSelectedPath.trim() ? initialSelectedPath.trim() : null;
        let rowToSelect = null;
        if (pathToSelect) {
            const rows = listEl.querySelectorAll('.playable-item');
            for (const r of rows) {
                if (r.getAttribute('data-path') === pathToSelect) {
                    rowToSelect = r;
                    break;
                }
            }
        }
        if (rowToSelect) {
            listEl.querySelectorAll('.playable-item').forEach((r) => r.classList.remove('selected'));
            rowToSelect.classList.add('selected');
            const path = rowToSelect.getAttribute('data-path');
            if (onSelect && path) onSelect(path, rowToSelect.textContent || '');
            rowToSelect.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
    }
    return paths;
}
