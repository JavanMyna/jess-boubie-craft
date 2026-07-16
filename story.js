/*
    story.js controls the story page interactions:
      - opening / closing the book (3D cover swing)
      - dark mode toggle (existing, preserved)
      - reader preferences: chrome hide, zen mode, text size, page-by-page
    The theme and reader-preference state is persisted in localStorage,
    matching the existing jbc-theme pattern. The inline <head> script
    applies the saved classes before paint; this file wires up the
    controls and (for page mode) the layout that needs measurement.
*/

document.addEventListener('DOMContentLoaded', () => {
    const book = document.getElementById('book');
    const cover = document.getElementById('bookCover');
    const interior = document.getElementById('bookInterior');
    const pages = document.getElementById('bookPages');
    const bookClose = document.getElementById('bookClose');
    const themeToggle = document.getElementById('themeToggle');

    const chromeToggle = document.getElementById('chromeToggle');
    const zenToggle = document.getElementById('zenToggle');
    const pageModeToggle = document.getElementById('pageModeToggle');
    const textSizeBtns = Array.from(document.querySelectorAll('.text-size-btn'));
    const pagePrev = document.getElementById('pagePrev');
    const pageNext = document.getElementById('pageNext');

    // --- Feedback link URL (one-line swap) ---
    const FEEDBACK_FORM_URL = 'PASTE_GOOGLE_FORM_URL_HERE';
    document.querySelectorAll('.feedback-link').forEach(link => {
        link.href = FEEDBACK_FORM_URL;
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /*
        THEME TOGGLE
        The inline script in the <head> may have already set .dark-mode on
        <html> based on localStorage or OS preference. Here we just make the
        button reflect that initial state and respond to clicks.
    */
    function updateToggleState() {
        const isDark = document.documentElement.classList.contains('dark-mode');
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark-mode');
        try {
            localStorage.setItem('jbc-theme', isDark ? 'dark' : 'light');
        } catch (e) {
            // If localStorage is unavailable, the toggle still works for the
            // current session; it just won't persist across page loads.
        }
        updateToggleState();
    }

    if (themeToggle) {
        updateToggleState();
        themeToggle.addEventListener('click', toggleTheme);
    }

    /*
        CHROME TOGGLE — hide / show the story header and footer.
        aria-pressed reflects "chrome visible" (true by default).
        State persists as 'jbc-story-chrome': 'visible' | 'hidden'.
    */
    function applyChromeState() {
        const hidden = document.documentElement.classList.contains('chrome-hidden');
        if (chromeToggle) chromeToggle.setAttribute('aria-pressed', String(!hidden));
    }
    if (chromeToggle) {
        applyChromeState();
        chromeToggle.addEventListener('click', () => {
            const willHide = !document.documentElement.classList.contains('chrome-hidden');
            document.documentElement.classList.toggle('chrome-hidden', willHide);
            try {
                localStorage.setItem('jbc-story-chrome', willHide ? 'hidden' : 'visible');
            } catch (e) {}
            applyChromeState();
            updateComfyState();
        });
    }

    /*
        ZEN TOGGLE — additive second reading style.
        aria-pressed reflects "zen active".
        State persists as 'jbc-story-zen': 'on' | 'off'.
    */
    function applyZenState() {
        const on = document.documentElement.classList.contains('zen');
        if (zenToggle) zenToggle.setAttribute('aria-pressed', String(on));
    }
    if (zenToggle) {
        applyZenState();
        zenToggle.addEventListener('click', () => {
            const willOn = !document.documentElement.classList.contains('zen');
            document.documentElement.classList.toggle('zen', willOn);
            try {
                localStorage.setItem('jbc-story-zen', willOn ? 'on' : 'off');
            } catch (e) {}
            applyZenState();
            // Page mode depends on .book-pages height, which zen changes
            // via padding; re-measure if currently active.
            if (pageModeState.active) rebuildPages();
            updateComfyState();
        });
    }

    /*
        TEXT SIZE (S / M / L) — only one of .text-small / .text-large is
        applied at a time; Medium is the default (no class).
        State persists as 'jbc-story-text': 'small'|'medium'|'large'.
    */
    function setTextSize(size) {
        const root = document.documentElement;
        root.classList.remove('text-small', 'text-large');
        if (size === 'small') root.classList.add('text-small');
        else if (size === 'large') root.classList.add('text-large');
        // size === 'medium' → no class
        try {
            localStorage.setItem('jbc-story-text', size);
        } catch (e) {}
        textSizeBtns.forEach(btn => {
            const active = btn.dataset.size === size;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
        });
    }
    if (textSizeBtns.length) {
        // Initial sync with classes already applied by the <head> script.
        const root = document.documentElement;
        let initial = 'medium';
        if (root.classList.contains('text-small')) initial = 'small';
        else if (root.classList.contains('text-large')) initial = 'large';
        setTextSize(initial);
        textSizeBtns.forEach(btn => {
            btn.addEventListener('click', () => setTextSize(btn.dataset.size));
        });
    }

    /*
        PAGE-BY-PAGE MODE
        When active, .book-pages becomes a horizontal track of full-size
        pages (built from the original chapter children) and the internal
        scroll is replaced by page flips (buttons, arrow keys, swipe).
        Reverting restores the original children untouched.

        Implementation notes:
          - We keep a snapshot of the original children so toggling off is
            a clean restoration (no clones left behind, no lost nodes).
          - Each page is filled with whole chapters until the next chapter
            would overflow the available height, then a new page starts.
          - Page count is recomputed on resize / zen / text-size changes
            so the layout stays correct without a reload.
    */
    const pageModeState = {
        active: false,
        originalChildren: null,
        track: null,
        index: 0,
        count: 1,
    };

    function availablePageHeight() {
        // The interior's height is the available canvas for each page.
        return Math.max(120, interior.clientHeight);
    }

    function rebuildPages() {
        if (!pageModeState.active || !pageModeState.originalChildren) return;

        // Restore originals before repaginating so measurement uses the
        // unwrapped content height in the current style context.
        if (pageModeState.track) {
            pageModeState.track.remove();
            pageModeState.track = null;
        }
        const parent = pages;
        parent.setAttribute('tabindex', '-1');
        const originals = pageModeState.originalChildren;
        originals.forEach(node => parent.appendChild(node));

        // Measure template heights.
        const pageHeight = availablePageHeight();
        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left = '-99999px';
        temp.style.top = '0';
        temp.style.width = (parent.clientWidth || 600) + 'px';
        temp.style.padding = '2rem 2rem 2.25rem';
        // Match the reading style's font context for accurate measurement.
        temp.style.font = getComputedStyle(parent).font;
        parent.appendChild(temp);

        function measureHeight(node) {
            temp.innerHTML = '';
            temp.appendChild(node.cloneNode(true));
            return temp.scrollHeight;
        }

        const track = document.createElement('div');
        track.className = 'pages-track';
        const pagesArr = [];
        let currentPage = null;
        let used = 0;
        // Account for the padding inside each .page when budgeting.
        const pagePadding = 64; // 2rem top + 2.25rem bottom ≈ 64px

        originals.forEach(node => {
            const h = measureHeight(node);
            if (currentPage === null || used + h + (used > 0 ? 8 : 0) > pageHeight - pagePadding) {
                currentPage = document.createElement('div');
                currentPage.className = 'page';
                track.appendChild(currentPage);
                pagesArr.push(currentPage);
                used = 0;
            }
            if (used > 0) used += 8; // small inter-block gap
            currentPage.appendChild(node);
            used += h;
        });

        temp.remove();
        // Clear parent and insert the track.
        while (parent.firstChild) parent.removeChild(parent.firstChild);
        parent.appendChild(track);
        pageModeState.track = track;
        pageModeState.count = Math.max(1, pagesArr.length);
        pageModeState.index = Math.min(pageModeState.index, pageModeState.count - 1);
        updatePagePosition();
    }

    function updatePagePosition() {
        if (!pageModeState.track) return;
        const offset = -pageModeState.index * 100;
        pageModeState.track.style.transform = `translateX(${offset}%)`;
        if (pagePrev) pagePrev.disabled = pageModeState.index <= 0;
        if (pageNext) pageNext.disabled = pageModeState.index >= pageModeState.count - 1;
    }

    function setPagerVisible(visible) {
        if (pagePrev) pagePrev.hidden = !visible;
        if (pageNext) pageNext.hidden = !visible;
    }

    function turnPage(direction) {
        if (!pageModeState.active) return;
        const next = pageModeState.index + direction;
        if (next < 0 || next >= pageModeState.count) return;
        pageModeState.index = next;

        // TODO: page-turn SFX
        // (Hook left for a custom Jummbox-style SFX, matching the
        // myta-catalogue approach Fred used previously. Drop an <audio>
        // element + play() call here when the asset is ready.)

        updatePagePosition();
    }

    function activatePageMode() {
        if (pageModeState.active) return;
        pageModeState.active = true;
        document.documentElement.classList.add('page-mode');
        // Snapshot current children as the source of truth for pagination.
        pageModeState.originalChildren = Array.from(pages.children);
        setPagerVisible(true);
        rebuildPages();
    }

    function deactivatePageMode() {
        if (!pageModeState.active) return;
        pageModeState.active = false;
        document.documentElement.classList.remove('page-mode');
        setPagerVisible(false);
        if (pageModeState.track) {
            pageModeState.track.remove();
            pageModeState.track = null;
        }
        if (pageModeState.originalChildren) {
            while (pages.firstChild) pages.removeChild(pages.firstChild);
            pageModeState.originalChildren.forEach(node => pages.appendChild(node));
            pageModeState.originalChildren = null;
        }
        pages.setAttribute('tabindex', '0');
    }

    function applyPageModeState() {
        if (pageModeToggle) pageModeToggle.setAttribute('aria-pressed', String(pageModeState.active));
    }

    if (pageModeToggle) {
        // Page mode is NOT pre-applied in the <head> script because it
        // needs the book to be open / measurable. Default is scrolling.
        let initialPageMode = false;
        try {
            initialPageMode = localStorage.getItem('jbc-story-pagemode') === 'on';
        } catch (e) {}
        if (initialPageMode) {
            // We don't activate until the book is actually opened; just
            // remember the intent so openBook() can honour it.
            pageModeState.pendingActivation = true;
        }
        applyPageModeState();
        pageModeToggle.addEventListener('click', () => {
            if (pageModeState.active) {
                deactivatePageMode();
                try { localStorage.setItem('jbc-story-pagemode', 'off'); } catch (e) {}
            } else {
                activatePageMode();
                try { localStorage.setItem('jbc-story-pagemode', 'on'); } catch (e) {}
            }
            applyPageModeState();
            updateComfyState();
        });
    }

    if (pagePrev) pagePrev.addEventListener('click', () => turnPage(-1));
    if (pageNext) pageNext.addEventListener('click', () => turnPage(1));

    // Keyboard: arrow keys flip pages when page mode is active and the
    // reading area is focused / hovered. Left/Up = prev, Right/Down = next.
    document.addEventListener('keydown', (e) => {
        if (!pageModeState.active) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            turnPage(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            turnPage(1);
        }
    });

    // Touch swipe to flip pages in page mode.
    let touchStartX = null;
    pages.addEventListener('touchstart', (e) => {
        if (!pageModeState.active) return;
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    pages.addEventListener('touchend', (e) => {
        if (!pageModeState.active || touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) turnPage(dx < 0 ? 1 : -1);
        touchStartX = null;
    });

    // Re-paginate on resize (debounced) so pages stay correct.
    let pageResizeTimer;
    window.addEventListener('resize', () => {
        if (!pageModeState.active) return;
        clearTimeout(pageResizeTimer);
        pageResizeTimer = setTimeout(rebuildPages, 150);
    });

    function openBook() {
        // Guard against double activation (e.g. rapid clicks or a keyboard
        // event that also fires a click event on some browsers).
        if (book.classList.contains('is-open')) return;

        // This single class is the "on switch" for the CSS transitions
        // defined in story.css.
        book.classList.add('is-open');

        // Mark the cover as disabled and expose the interior to assistive
        // technology now that it is visible.
        cover.setAttribute('aria-disabled', 'true');
        interior.setAttribute('aria-hidden', 'false');

        cover.tabIndex = -1;
        cover.setAttribute('aria-hidden', 'true');

        // Honour a persisted page-mode preference once the book is open and
        // measurable.
        if (pageModeState.pendingActivation) {
            pageModeState.pendingActivation = false;
            activatePageMode();
            applyPageModeState();
            updateComfyState();
        }

        if (prefersReducedMotion) {
            pages.focus({ preventScroll: true });
        } else {
            cover.addEventListener('transitionend', () => {
                pages.focus({ preventScroll: true });
            }, { once: true });
        }
    }

    function closeBook() {
        // Guard against closing an already-closed book.
        if (!book.classList.contains('is-open')) return;

        book.classList.remove('is-open');

        // Restore the cover's natural keyboard behavior and accessibility.
        cover.removeAttribute('aria-disabled');
        cover.removeAttribute('aria-hidden');
        cover.removeAttribute('tabindex');

        // Hide the interior from assistive tech while the cover closes.
        interior.setAttribute('aria-hidden', 'true');

        if (prefersReducedMotion) {
            cover.focus({ preventScroll: true });
        } else {
            // Wait for the cover to finish swinging shut before moving focus
            // back, so screen readers don't announce hidden content.
            cover.addEventListener('transitionend', () => {
                cover.focus({ preventScroll: true });
            }, { once: true });
        }
    }

    cover.addEventListener('click', openBook);

    if (bookClose) {
        bookClose.addEventListener('click', closeBook);
    }

    // ─── COMFY MODE PRESET ───────────────────────────────────────────
    const comfyToggle = document.getElementById('comfyToggle');

    function updateComfyState() {
        if (!comfyToggle) return;
        const isComfy = document.documentElement.classList.contains('chrome-hidden') &&
                        document.documentElement.classList.contains('zen') &&
                        pageModeState.active;
        comfyToggle.setAttribute('aria-pressed', String(isComfy));
    }

    if (comfyToggle) {
        comfyToggle.addEventListener('click', () => {
            const isComfy = document.documentElement.classList.contains('chrome-hidden') &&
                            document.documentElement.classList.contains('zen') &&
                            pageModeState.active;
            // If already in comfy, toggle off all three.
            if (isComfy) {
                if (chromeToggle) chromeToggle.click();
                if (zenToggle) zenToggle.click();
                if (pageModeToggle) pageModeToggle.click();
                return;
            }
            // Activate each if not already on.
            if (!document.documentElement.classList.contains('chrome-hidden') && chromeToggle) {
                chromeToggle.click();
            }
            if (!document.documentElement.classList.contains('zen') && zenToggle) {
                zenToggle.click();
            }
            if (!pageModeState.active && pageModeToggle) {
                pageModeToggle.click();
            }
        });
        updateComfyState();
    }

    // ─── SETTINGS PANEL TOGGLE ───────────────────────────────────────
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.getElementById('settingsPanel');

    if (settingsToggle && settingsPanel) {
        function openSettings() {
            settingsPanel.hidden = false;
            settingsToggle.setAttribute('aria-expanded', 'true');
        }
        function closeSettings() {
            settingsPanel.hidden = true;
            settingsToggle.setAttribute('aria-expanded', 'false');
        }

        settingsToggle.addEventListener('click', () => {
            if (settingsPanel.hidden) openSettings();
            else closeSettings();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !settingsPanel.hidden) {
                closeSettings();
                settingsToggle.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!settingsPanel.hidden &&
                !settingsPanel.contains(e.target) &&
                e.target !== settingsToggle &&
                !settingsToggle.contains(e.target)) {
                closeSettings();
            }
        });
    }

    // ─── MOBILE HEADER COLLAPSE ──────────────────────────────────────
    let lastScrollY = 0;
    let headerTicking = false;
    const HEADER_COLLAPSE_AT = 60;

    window.addEventListener('scroll', () => {
        if (headerTicking) return;
        headerTicking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            const header = document.querySelector('.story-header');
            if (!header) { headerTicking = false; return; }
            const isMobile = window.matchMedia('(max-width: 700px)').matches;
            if (!isMobile) { headerTicking = false; return; }

            if (y > HEADER_COLLAPSE_AT && y > lastScrollY) {
                header.classList.add('story-header--hidden');
            } else if (y < lastScrollY) {
                header.classList.remove('story-header--hidden');
            }
            lastScrollY = y;
            headerTicking = false;
        });
    }, { passive: true });
});