// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Viewer (Display) window: single image/video with Prev/Next, slideshow, fullscreen.
// Matches Project-V-See ImageViewerWindow behavior (buttons at top).

(function () {
    const invoke = window.__TAURI__?.core?.invoke;
    const convertFileSrc = window.__TAURI__?.core?.convertFileSrc;
    const getCurrent = window.__TAURI__?.window?.getCurrent;

    const contentEl = document.getElementById('viewer-content');
    const filenameEl = document.getElementById('viewer-filename');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSlideshow = document.getElementById('btn-slideshow');
    const btnStopMusic = document.getElementById('btn-stop-music');
    const btnConfig = document.getElementById('btn-config');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    let paths = [];
    let index = 0;
    let slideshowTimer = null;
    let slideshowIntervalMs = 3000;

    /** Basename of path (last segment after / or \). */
    function getName(path) {
        const s = path.replace(/\\/g, '/');
        const i = s.lastIndexOf('/');
        return i >= 0 ? s.slice(i + 1) : s;
    }

    /** Lowercase file extension from filename. */
    function getExt(name) {
        return (name.split('.').pop() || '').toLowerCase();
    }

    /** True if filename is a supported video format. */
    function isVideo(name) {
        return ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', 'wmv'].includes(getExt(name));
    }

    /** True if filename is HEIC/HEIF. */
    function isHeic(name) {
        return ['heic', 'heif'].includes(getExt(name));
    }

    /** True if filename is PDF. */
    function isPdf(name) {
        return getExt(name) === 'pdf';
    }

    /** Shows placeholder text in the content area and clears the filename. */
    function setPlaceholder(text) {
        contentEl.innerHTML = '<p class="placeholder">' + (text || 'No image') + '</p>';
        filenameEl.textContent = '';
    }

    /** Renders the current image or video in the content area; HEIC/PDF show a placeholder. */
    function showImage(path, name) {
        const ext = getExt(name);
        if (isHeic(name)) {
            setPlaceholder('HEIC');
            filenameEl.textContent = name;
            return;
        }
        if (isPdf(name)) {
            setPlaceholder('PDF cannot be displayed.');
            filenameEl.textContent = name;
            return;
        }
        if (isVideo(name)) {
            const src = convertFileSrc ? convertFileSrc(path) : '';
            contentEl.innerHTML = src
                ? '<video src="' + src + '" controls autoplay preload="auto"></video>'
                : '<p class="placeholder">' + name + '</p>';
            filenameEl.textContent = name;
            return;
        }
        const img = document.createElement('img');
        img.alt = name;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        contentEl.innerHTML = '';
        contentEl.appendChild(img);
        filenameEl.textContent = name;
        function fallback() {
            setPlaceholder(name);
        }
        if (convertFileSrc) {
            try {
                img.src = convertFileSrc(path);
            } catch (_) {
                fallback();
                return;
            }
        }
        img.onerror = function () {
            if (!invoke) {
                fallback();
                return;
            }
            invoke('read_file_as_data_url', { path: path })
                .then(function (dataUrl) {
                    img.src = dataUrl;
                })
                .catch(fallback);
        };
    }

    /** Updates the viewer to show the given file (calls showImage or placeholder). */
    function updateDisplay(path, name) {
        if (!path) {
            setPlaceholder('No image');
            return;
        }
        showImage(path, name);
    }

    /** Moves to the previous item and updates the display (via viewer_prev). */
    function goPrev() {
        if (!invoke) return;
        invoke('viewer_prev').then(function (result) {
            if (result && result[0]) updateDisplay(result[0], result[1]);
        }).catch(function () {});
    }

    /** Moves to the next item and updates the display (via viewer_next). */
    function goNext() {
        if (!invoke) return;
        invoke('viewer_next').then(function (result) {
            if (result && result[0]) updateDisplay(result[0], result[1]);
        }).catch(function () {});
    }

    /** Starts the slideshow timer (advance to next image at interval). */
    function startSlideshow() {
        if (slideshowTimer) return;
        slideshowTimer = setInterval(goNext, slideshowIntervalMs);
        btnSlideshow.textContent = 'Slideshow OFF';
    }

    /** Stops the slideshow timer. */
    function stopSlideshow() {
        if (slideshowTimer) {
            clearInterval(slideshowTimer);
            slideshowTimer = null;
        }
        btnSlideshow.textContent = 'Slideshow ON';
    }

    /** Toggles slideshow on or off. */
    function toggleSlideshow() {
        if (slideshowTimer) stopSlideshow();
        else startSlideshow();
    }

    /** Stops audio playback (Rust backend + notify main window HTML5 player). */
    function stopMusic() {
        if (invoke) invoke('stop_audio').catch(function () {});
        var eventApi = window.__TAURI__ && window.__TAURI__.event;
        if (eventApi && typeof eventApi.emit === 'function') {
            eventApi.emit('stop-music').catch(function () {});
        }
    }

    /** Toggles fullscreen for the viewer window. */
    function toggleFullscreen() {
        const w = getCurrent && getCurrent();
        if (!w) return;
        w.isFullscreen().then(function (full) {
            w.setFullscreen(!full);
        }).catch(function () {});
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            getCurrent && getCurrent().then(function (w) {
                w.isFullscreen().then(function (full) {
                    if (full) w.setFullscreen(false);
                });
            });
            return;
        }
        if (e.key === 'ArrowLeft') { goPrev(); e.preventDefault(); }
        if (e.key === 'ArrowRight') { goNext(); e.preventDefault(); }
    });

    btnPrev.addEventListener('click', goPrev);
    btnNext.addEventListener('click', goNext);
    btnSlideshow.addEventListener('click', toggleSlideshow);
    btnStopMusic.addEventListener('click', stopMusic);
    btnConfig.addEventListener('click', function () {
        var interval = window.prompt('Slideshow interval (seconds, 1–3600)', String(slideshowIntervalMs / 1000));
        if (interval != null) {
            var n = parseInt(interval, 10);
            if (!isNaN(n) && n >= 1 && n <= 3600) {
                slideshowIntervalMs = n * 1000;
                if (invoke) invoke('set_persisted', { key: 'slideshow_interval_seconds', value: String(n) }).catch(function () {});
                if (slideshowTimer) {
                    stopSlideshow();
                    startSlideshow();
                }
            }
        }
    });
    btnFullscreen.addEventListener('click', toggleFullscreen);

    (function init() {
        if (!invoke) {
            setPlaceholder('Tauri API not available');
            return;
        }
        invoke('get_persisted', { key: 'slideshow_interval_seconds' }).then(function (val) {
            if (val) {
                var n = parseInt(val, 10);
                if (!isNaN(n) && n >= 1 && n <= 3600) slideshowIntervalMs = n * 1000;
            }
        }).catch(function () {});
        invoke('get_viewer_context').then(function (result) {
            if (!result || !result[0] || !result[0].length) {
                setPlaceholder('No images');
                return;
            }
            paths = result[0];
            index = typeof result[1] === 'number' ? result[1] : 0;
            if (index >= paths.length) index = paths.length - 1;
            var path = paths[index];
            var name = getName(path);
            updateDisplay(path, name);
        }).catch(function () {
            setPlaceholder('Failed to load context');
        });
        window.addEventListener('focus', function syncFromState() {
            if (!invoke || !paths.length) return;
            invoke('get_viewer_context').then(function (result) {
                if (!result || !result[0] || !result[0].length) return;
                paths = result[0];
                index = typeof result[1] === 'number' ? result[1] : 0;
                if (index >= paths.length) index = paths.length - 1;
                var path = paths[index];
                updateDisplay(path, getName(path));
            }).catch(function () {});
        });
    })();
})();
