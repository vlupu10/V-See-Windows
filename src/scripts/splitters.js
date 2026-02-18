/**
 * Resizable splitters for main layout: left panel width, left inner sections, right inner sections.
 */
(function () {
    var MIN_LEFT_WIDTH = 200;
    var MAX_LEFT_WIDTH_PERCENT = 0.6;
    var MIN_SECTION_HEIGHT = 60;

    var leftPanel = document.getElementById('left-panel');
    var splitterMain = document.getElementById('splitter-main');
    var splitterLeft1 = document.getElementById('splitter-left-1');
    var splitterLeft2 = document.getElementById('splitter-left-2');
    var splitterLeft3 = document.getElementById('splitter-left-3');
    var splitterRight1 = document.getElementById('splitter-right-1');
    var splitterRight2 = document.getElementById('splitter-right-2');

    var leftSection1 = document.getElementById('photos-folder-tree');
    var leftSection2 = document.getElementById('music-folder-tree');
    var leftSection3 = document.getElementById('playable-files');
    var leftSection4 = document.getElementById('player-controls');
    var rightSection1 = document.getElementById('thumbnails-section');
    var rightSection2 = document.getElementById('viewer-section');
    var rightSection3 = document.getElementById('help-section');

    function setupVerticalSplitter(splitterEl, leftEl, setWidth) {
        if (!splitterEl || !leftEl) return;
        var startX = 0, startW = 0;
        splitterEl.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startX = e.clientX;
            startW = leftEl.offsetWidth;
            splitterEl.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            function onMove(e) {
                var dx = e.clientX - startX;
                var maxW = Math.floor(window.innerWidth * MAX_LEFT_WIDTH_PERCENT);
                var newW = Math.min(maxW, Math.max(MIN_LEFT_WIDTH, startW + dx));
                setWidth(newW);
            }
            function onUp() {
                splitterEl.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    function setupHorizontalSplitter(splitterEl, sectionAbove, sectionBelow, getHeights, setHeights) {
        if (!splitterEl || !sectionAbove || !sectionBelow) return;
        var startY = 0, startHeights = [0, 0];
        splitterEl.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startY = e.clientY;
            startHeights = getHeights();
            splitterEl.classList.add('dragging');
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            function onMove(e) {
                var dy = e.clientY - startY;
                var h0 = Math.max(MIN_SECTION_HEIGHT, startHeights[0] + dy);
                var h1 = Math.max(MIN_SECTION_HEIGHT, startHeights[1] - dy);
                setHeights(h0, h1);
            }
            function onUp() {
                splitterEl.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    if (leftPanel && splitterMain) {
        setupVerticalSplitter(splitterMain, leftPanel, function (w) {
            leftPanel.style.width = w + 'px';
        });
    }

    if (leftSection1 && leftSection2 && splitterLeft1) {
        setupHorizontalSplitter(splitterLeft1, leftSection1, leftSection2,
            function () { return [leftSection1.offsetHeight, leftSection2.offsetHeight]; },
            function (a, b) {
                leftSection1.style.flex = '0 0 auto';
                leftSection2.style.flex = '0 0 auto';
                leftSection1.style.height = Math.max(MIN_SECTION_HEIGHT, a) + 'px';
                leftSection2.style.height = Math.max(MIN_SECTION_HEIGHT, b) + 'px';
            });
    }

    if (leftSection2 && leftSection3 && splitterLeft2) {
        setupHorizontalSplitter(splitterLeft2, leftSection2, leftSection3,
            function () { return [leftSection2.offsetHeight, leftSection3.offsetHeight]; },
            function (a, b) {
                leftSection2.style.flex = '0 0 auto';
                leftSection2.style.height = Math.max(MIN_SECTION_HEIGHT, a) + 'px';
                leftSection3.style.flex = '0 0 auto';
                leftSection3.style.height = Math.max(MIN_SECTION_HEIGHT, b) + 'px';
            });
    }

    if (leftSection3 && leftSection4 && splitterLeft3) {
        setupHorizontalSplitter(splitterLeft3, leftSection3, leftSection4,
            function () { return [leftSection3.offsetHeight, leftSection4.offsetHeight]; },
            function (a, b) {
                leftSection3.style.flex = '0 0 auto';
                leftSection3.style.height = Math.max(MIN_SECTION_HEIGHT, a) + 'px';
                leftSection4.style.flex = '0 0 auto';
                leftSection4.style.height = Math.max(40, b) + 'px';
            });
    }

    if (rightSection1 && rightSection2 && splitterRight1) {
        setupHorizontalSplitter(splitterRight1, rightSection1, rightSection2,
            function () { return [rightSection1.offsetHeight, rightSection2.offsetHeight]; },
            function (a, b) {
                rightSection1.style.flex = '0 0 auto';
                rightSection2.style.flex = '0 0 auto';
                rightSection1.style.height = Math.max(80, a) + 'px';
                rightSection2.style.height = Math.max(120, b) + 'px';
            });
    }

    if (rightSection2 && rightSection3 && splitterRight2) {
        setupHorizontalSplitter(splitterRight2, rightSection2, rightSection3,
            function () { return [rightSection2.offsetHeight, rightSection3.offsetHeight]; },
            function (a, b) {
                rightSection2.style.flex = '0 0 auto';
                rightSection2.style.height = Math.max(120, a) + 'px';
                rightSection3.style.flex = '0 0 auto';
                rightSection3.style.height = Math.max(36, b) + 'px';
            });
    }
})();
