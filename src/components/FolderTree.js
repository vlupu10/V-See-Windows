// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Folder tree component. Lazy-loads directory children via Tauri commands.
// Renders a single tree (Photos or Music). Used twice in the main layout.
// Uses window.__TAURI__.core.invoke so it works without a bundler (serve dev server).

/** Get Tauri invoke; only available when running inside the Tauri app. */
function getInvoke() {
    return window.__TAURI__?.core?.invoke;
}

const PLACEHOLDER = '\u2026'; // "…" so node shows expand arrow before load

/**
 * Creates a folder tree in the given container. Loads roots via get_folder_roots,
 * then list_directory when a node is expanded. Defensive: shows errors for
 * disconnected drives and allows retry/refresh.
 * @param {HTMLElement} container - Element to render the tree into
 * @param {string} label - Section label (e.g. "Photos folder")
 * @param {(path: string, opts?: { programmatic?: boolean }) => void} onSelect - Callback when a folder is selected; opts.programmatic true when selection is from restore/fallback, not user click
 * @param {(message: string) => void} [onError] - Optional: report errors to help/error panel
 * @param {string} [initialPath] - Optional: path to expand and select after roots load (e.g. persisted last_folder)
 * @returns {{ destroy: () => void; refresh: () => Promise<void>; expandAndSelectPath: (path: string) => Promise<void> }} - Cleanup and refresh
 */
export function createFolderTree(container, label, onSelect, onError, initialPath) {
    container.innerHTML = '';
    const headerRow = document.createElement('div');
    headerRow.className = 'folder-tree-header-row';
    const header = document.createElement('div');
    header.className = 'folder-tree-header';
    header.textContent = label;
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'folder-tree-refresh';
    refreshBtn.title = 'Refresh drives (e.g. after connecting a USB)';
    refreshBtn.textContent = 'Refresh';
    headerRow.appendChild(header);
    headerRow.appendChild(refreshBtn);
    container.appendChild(headerRow);

    const treeEl = document.createElement('ul');
    treeEl.className = 'folder-tree';
    treeEl.setAttribute('role', 'tree');
    container.appendChild(treeEl);

    const loadedPaths = new Set(); // path -> true when children were loaded

    /** Builds one tree item (li with span); click selects and, for dirs, calls onSelect and toggles expand. */
    function createNode(name, path, isDir, depth = 0) {
        const li = document.createElement('li');
        li.setAttribute('role', 'treeitem');
        li.setAttribute('data-path', path);
        li.setAttribute('aria-expanded', 'false');
        li.style.paddingLeft = `${depth * 12 + 8}px`;
        const span = document.createElement('span');
        span.className = 'folder-tree-item';
        span.textContent = name || path;
        if (isDir) {
            span.classList.add('folder');
            const arrow = document.createElement('span');
            arrow.className = 'folder-tree-arrow';
            arrow.textContent = '\u25B6'; // ▶
            span.prepend(arrow);
        }
        li.appendChild(span);

        span.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(li);
            if (isDir) {
                onSelect(path);
                toggleExpand(li);
            }
        });
        return li;
    }

    /** Sets the selected state to the given node (removes .selected from others, adds to this node's span). */
    function selectNode(li) {
        container.querySelectorAll('.folder-tree-item').forEach((el) => el.classList.remove('selected'));
        const span = li.querySelector('.folder-tree-item');
        if (span) span.classList.add('selected');
    }

    /** Expands or collapses a folder node; loads children via list_directory when first expanded. */
    function toggleExpand(li) {
        const path = li.getAttribute('data-path');
        if (!path) return;
        const isDir = li.querySelector('.folder');
        if (!isDir) return;
        const expanded = li.getAttribute('aria-expanded') === 'true';
        if (expanded) {
            li.setAttribute('aria-expanded', 'false');
            const sub = li.querySelector('ul');
            if (sub) sub.hidden = true;
            const arrow = li.querySelector('.folder-tree-arrow');
            if (arrow) arrow.textContent = '\u25B6';
            return;
        }
        li.setAttribute('aria-expanded', 'true');
        const arrow = li.querySelector('.folder-tree-arrow');
        if (arrow) arrow.textContent = '\u25BC';
        if (!loadedPaths.has(path)) {
            loadChildren(li, path);
        } else {
            const sub = li.querySelector('ul');
            if (sub) sub.hidden = false;
        }
    }

    /** Fetches direct subdirectories of path via list_directory and appends child nodes to parentLi; shows error + retry on failure. */
    async function loadChildren(parentLi, path) {
        let ul = parentLi.querySelector('ul');
        if (!ul) {
            ul = document.createElement('ul');
            ul.setAttribute('role', 'group');
            ul.className = 'folder-tree-children';
            parentLi.appendChild(ul);
        }
        ul.innerHTML = '<li class="folder-tree-loading">Loading…</li>';
        ul.hidden = false;
        const invokeFn = getInvoke();
        if (!invokeFn) {
            ul.innerHTML = '<li class="folder-tree-error">Tauri API not available</li>';
            if (onError) onError('Not running inside V-See app.');
            return;
        }
        const result = await invokeFn('list_directory', { path });
        if (!result.ok || !result.entries) {
            const msg = result.error || 'Could not read folder';
            ul.innerHTML = '<li class="folder-tree-error folder-tree-retry" data-path="' + escapeHtml(path) + '">' + escapeHtml(msg) + ' (click to retry)</li>';
            setupRetryClick(ul);
            if (onError) onError(msg);
            return;
        }
        loadedPaths.add(path);
        const dirs = result.entries.filter((e) => e.is_dir);
        ul.innerHTML = '';
        const depth = (parentLi.style.paddingLeft && parseInt(parentLi.style.paddingLeft, 10) / 12) || 0;
        for (const entry of dirs) {
            const childLi = createNode(entry.name, entry.path, true, depth + 1);
            ul.appendChild(childLi);
        }
        ul.hidden = false;
    }

    /** Attaches click handler to the retry element so user can re-run loadChildren after an error. */
    function setupRetryClick(ul) {
        const retryLi = ul.querySelector('.folder-tree-retry');
        if (retryLi) {
            retryLi.addEventListener('click', () => {
                const path = retryLi.getAttribute('data-path');
                const parentLi = ul.closest('li[data-path]');
                if (path && parentLi) {
                    loadedPaths.delete(path);
                    ul.innerHTML = '';
                    loadChildren(parentLi, path);
                }
            });
        }
    }

    /** Loads drive roots (get_folder_roots), then restores initialPath via expandAndSelectPath or selects first root. */
    async function loadRoots() {
        treeEl.innerHTML = '<li class="folder-tree-loading">Loading…</li>';
        loadedPaths.clear();
        const invokeFn = getInvoke();
        if (!invokeFn) {
            treeEl.innerHTML = '<li class="folder-tree-error">Run this app with V-See (npm run dev) to browse folders.</li>';
            if (onError) onError('Tauri API not available.');
            return;
        }
        try {
            const result = await invokeFn('get_folder_roots');
            if (!result.ok || !result.entries) {
                const msg = result.error || 'Failed to load roots';
                treeEl.innerHTML = '<li class="folder-tree-error">' + escapeHtml(msg) + '</li>';
                if (onError) onError(msg);
                return;
            }
            treeEl.innerHTML = '';
            for (const entry of result.entries) {
                const li = createNode(entry.name, entry.path, true, 0);
                treeEl.appendChild(li);
            }
            if (onError) onError('');
        } catch (e) {
            const msg = String(e && e.message ? e.message : e);
            treeEl.innerHTML = '<li class="folder-tree-error">Error: ' + escapeHtml(msg) + '</li>';
            if (onError) onError(msg);
        }
        const pathToRestore = typeof initialPath === 'string' ? normalizePath(initialPath) : '';
        if (pathToRestore) {
            await Promise.resolve(); // yield so roots are committed to DOM
            await expandAndSelectPath(pathToRestore);
        }
        const hasSelection = container.querySelector('.folder-tree-item.selected');
        if (!hasSelection) {
            const firstLi = treeEl.querySelector('li[data-path]');
            if (firstLi) {
                selectNode(firstLi);
                const firstPath = firstLi.getAttribute('data-path');
                if (firstPath) onSelect(firstPath, { programmatic: true });
            }
        }
    }

    /** Normalize path: trim, use backslashes on Windows for comparison with tree (data-path). */
    function normalizePath(p) {
        if (!p || typeof p !== 'string') return '';
        const s = p.trim().replace(/\//g, '\\');
        return s.replace(/\\+$/, '');
    }

    /** Normalize for comparison: trim, backslashes, no trailing slash (so backend "C:\\Camera\\" matches "C:\\Camera"). */
    function pathNorm(p) {
        if (!p || typeof p !== 'string') return '';
        return p.trim().replace(/\//g, '\\').replace(/\\+$/, '');
    }

    /** Compare two paths for equality; on Windows use case-insensitive so restore works regardless of backend casing. */
    function pathEquals(a, b) {
        const na = pathNorm(a);
        const nb = pathNorm(b);
        if (na === nb) return true;
        if (!na || !nb) return false;
        const isWin = typeof navigator !== 'undefined' && /Win/i.test(navigator.platform);
        return isWin ? na.toLowerCase() === nb.toLowerCase() : na === nb;
    }

    /** Build path segments for expandAndSelectPath (e.g. "C:\\Users\\foo" -> ["C:\\", "C:\\Users", "C:\\Users\\foo"]). Handles both / and \. */
    function getPathSegments(fullPath) {
        const normalized = normalizePath(fullPath);
        if (!normalized) return [];
        const parts = normalized.split(/\\/).filter((x) => x.length > 0);
        if (parts.length === 0) return [];
        const segments = [];
        // Windows: first part is "C:"; tree root is "C:\" so first segment must be "C:\"
        let acc = parts[0];
        if (/^[a-zA-Z]:$/.test(parts[0])) acc += '\\';
        segments.push(acc);
        for (let i = 1; i < parts.length; i++) {
            // acc already ends with \ for "C:\", so don't add another backslash
            acc = acc + (acc.endsWith('\\') ? '' : '\\') + parts[i];
            segments.push(acc);
        }
        return segments;
    }

    /** Expand a node and wait for its children to load. */
    async function expandNode(li, path) {
        if (li.getAttribute('aria-expanded') === 'true') {
            const sub = li.querySelector('ul');
            if (sub) sub.hidden = false;
            return;
        }
        li.setAttribute('aria-expanded', 'true');
        const arrow = li.querySelector('.folder-tree-arrow');
        if (arrow) arrow.textContent = '\u25BC';
        if (!loadedPaths.has(path)) {
            await loadChildren(li, path);
        } else {
            const sub = li.querySelector('ul');
            if (sub) sub.hidden = false;
        }
    }

    /** Expand the tree to the given path and select that folder. Call after loadRoots(). Invalid paths are ignored. */
    async function expandAndSelectPath(fullPath) {
        const segments = getPathSegments(fullPath);
        if (segments.length === 0) return;
        let parentUl = treeEl;
        let lastLi = null;
        for (const seg of segments) {
            const lis = Array.from(parentUl.children).filter((el) => el.getAttribute('data-path'));
            const li = lis.find((el) => pathEquals(el.getAttribute('data-path'), seg));
            if (!li) return;
            lastLi = li;
            const path = li.getAttribute('data-path');
            await expandNode(li, path);
            const childUl = li.querySelector('ul');
            parentUl = childUl || parentUl;
        }
        if (lastLi) {
            selectNode(lastLi);
            onSelect(fullPath, { programmatic: true });
        }
    }

    refreshBtn.addEventListener('click', () => loadRoots());
    loadRoots();

    /** Escapes a string for safe use in HTML (e.g. error messages in tree). */
    function escapeHtml(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    return {
        destroy() {
            container.innerHTML = '';
        },
        refresh() {
            return loadRoots();
        },
        expandAndSelectPath(path) {
            return expandAndSelectPath(path);
        },
    };
}
