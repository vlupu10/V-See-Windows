// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Renders a grid of image/video thumbnails for the selected folder.
// HEIC/PDF show as a frame with label; JPG, PNG, ICO, SVG and videos show as thumbnails.

const IMAGE_EXT = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'ico', 'svg'
]);
const VIDEO_EXT = new Set(['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', 'wmv']);
const HEIC_EXT = new Set(['heic', 'heif']);
const PDF_EXT = new Set(['pdf']);

/** Tauri invoke; null when not running inside the app. */
function getInvoke() {
    return window.__TAURI__?.core?.invoke;
}

/** Tauri convertFileSrc for asset URLs; null when not in Tauri. */
function getConvertFileSrc() {
    return window.__TAURI__?.core?.convertFileSrc;
}

/** Lowercase file extension from a filename. */
function getExt(name) {
    return (name.split('.').pop() || '').toLowerCase();
}

/** True if the file is an image, video, HEIC, or PDF (shown in the grid). */
function isMediaFile(name) {
    const ext = getExt(name);
    return IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext) || HEIC_EXT.has(ext) || PDF_EXT.has(ext);
}

/** True if the file is HEIC/HEIF. */
function isHeic(name) {
    return HEIC_EXT.has(getExt(name));
}

/** True if the file is PDF. */
function isPdf(name) {
    return PDF_EXT.has(getExt(name));
}

/** True if the file is a supported video format. */
function isVideo(name) {
    return VIDEO_EXT.has(getExt(name));
}

/**
 * Loads the given folder path and renders thumbnails into gridEl.
 * HEIC/PDF: frame with "HEIC" or "PDF" text. Others: image or video thumbnail.
 * @param {(path: string, name: string) => void} [onSelect] - Single click: preview + persist selection
 * @param {(paths: string[], index: number) => void} [onActivate] - Double click: open viewer window
 * @param {string} [initialSelectedPath] - Optional: path to select after load (restore; defensive: ignored if not in list)
 */
export async function loadThumbnails(gridEl, folderPath, onSelect, onActivate, initialSelectedPath) {
    if (!gridEl) return;
    gridEl.innerHTML = '<p class="placeholder">Loading…</p>';
    const invokeFn = getInvoke();
    const convertFileSrc = getConvertFileSrc();
    if (!invokeFn) {
        gridEl.innerHTML = '<p class="placeholder">Tauri API not available</p>';
        return;
    }
    let result;
    try {
        result = await invokeFn('list_directory', { path: folderPath });
    } catch (e) {
        gridEl.innerHTML = '<p class="placeholder">Error loading folder</p>';
        return;
    }
    if (!result.ok || !result.entries) {
        gridEl.innerHTML = '<p class="placeholder">' + (result.error || 'Could not read folder') + '</p>';
        return;
    }
    const files = result.entries.filter((e) => !e.is_dir && isMediaFile(e.name));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    if (files.length === 0) {
        gridEl.innerHTML = '<p class="placeholder">No images or videos in this folder</p>';
        return;
    }
    gridEl.innerHTML = '';
    gridEl.classList.add('thumbnails-grid');
    const paths = files.map((f) => f.path);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cell = document.createElement('div');
        cell.className = 'thumbnail-cell';
        cell.setAttribute('data-path', file.path);
        const label = document.createElement('span');
        label.className = 'thumbnail-label';
        label.textContent = file.name;

        if (isHeic(file.name)) {
            const placeholder = document.createElement('div');
            placeholder.className = 'thumbnail-placeholder';
            placeholder.textContent = 'HEIC';
            cell.appendChild(placeholder);
        } else if (isPdf(file.name)) {
            const placeholder = document.createElement('div');
            placeholder.className = 'thumbnail-placeholder';
            placeholder.textContent = 'PDF';
            cell.appendChild(placeholder);
        } else {
            const img = document.createElement('img');
            img.alt = file.name;
            img.loading = 'lazy';
            if (isVideo(file.name)) {
                img.src = '';
                (async () => {
                    const inv = getInvoke();
                    if (!inv) return;
                    try {
                        const dataUrl = await inv('get_video_thumbnail_data_url', { path: file.path });
                        if (img.parentNode && cell.getAttribute('data-path') === file.path) {
                            img.src = dataUrl;
                        }
                    } catch (_) {
                        const ph = document.createElement('div');
                        ph.className = 'thumbnail-placeholder';
                        ph.textContent = 'Video';
                        if (img.parentNode && cell.getAttribute('data-path') === file.path) {
                            img.replaceWith(ph);
                        }
                    }
                })();
            } else {
                if (convertFileSrc) {
                    try {
                        img.src = convertFileSrc(file.path);
                    } catch (_) {
                        img.src = '';
                    }
                }
                img.onerror = async () => {
                    const inv = getInvoke();
                    if (inv) {
                        try {
                            const dataUrl = await inv('read_file_as_data_url', { path: file.path });
                            img.src = dataUrl;
                        } catch (_) {
                            img.style.visibility = 'hidden';
                        }
                    } else {
                        img.style.visibility = 'hidden';
                    }
                };
            }
            cell.appendChild(img);
        }

        cell.appendChild(label);
        cell.addEventListener('click', () => {
            gridEl.querySelectorAll('.thumbnail-cell').forEach((c) => c.classList.remove('selected'));
            cell.classList.add('selected');
            if (onSelect) onSelect(file.path, file.name);
        });
        cell.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (onActivate) onActivate(paths, i);
        });
        gridEl.appendChild(cell);
    }

    const pathToSelect = typeof initialSelectedPath === 'string' && initialSelectedPath.trim() ? initialSelectedPath.trim() : null;
    let cellToSelect = null;
    if (pathToSelect) {
        const cells = gridEl.querySelectorAll('.thumbnail-cell');
        for (const c of cells) {
            if (c.getAttribute('data-path') === pathToSelect) {
                cellToSelect = c;
                break;
            }
        }
    }
    if (!cellToSelect) {
        const first = gridEl.querySelector('.thumbnail-cell');
        if (first) cellToSelect = first;
    }
    if (cellToSelect) {
        gridEl.querySelectorAll('.thumbnail-cell').forEach((c) => c.classList.remove('selected'));
        cellToSelect.classList.add('selected');
        const path = cellToSelect.getAttribute('data-path');
        const labelEl = cellToSelect.querySelector('.thumbnail-label');
        const name = labelEl ? labelEl.textContent : '';
        if (onSelect && path) onSelect(path, name);
        cellToSelect.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
}
