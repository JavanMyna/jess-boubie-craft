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
    const textSizeBtns = Array.from(document.querySelectorAll('.text-size-btn'));

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

        if (prefersReducedMotion) {
            pages.focus({ preventScroll: true });
        } else {
            cover.addEventListener('transitionend', () => {
                pages.focus({ preventScroll: true });
            }, { once: true });
        }

        // Show swipe hint briefly then fade out
        showSwipeHint();
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
                        document.documentElement.classList.contains('zen');
        comfyToggle.setAttribute('aria-pressed', String(isComfy));
    }

    if (comfyToggle) {
        comfyToggle.addEventListener('click', () => {
            const isComfy = document.documentElement.classList.contains('chrome-hidden') &&
                            document.documentElement.classList.contains('zen');
            if (isComfy) {
                if (chromeToggle) chromeToggle.click();
                if (zenToggle) zenToggle.click();
                return;
            }
            if (!document.documentElement.classList.contains('chrome-hidden') && chromeToggle) {
                chromeToggle.click();
            }
            if (!document.documentElement.classList.contains('zen') && zenToggle) {
                zenToggle.click();
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

    // ─── SWIPE HINT ──────────────────────────────────────────────────
    const swipeHint = document.querySelector('.swipe-hint');
    let hintTimer = null;

    function hideSwipeHint() {
        if (!swipeHint || swipeHint.classList.contains('swipe-hint--hidden')) return;
        swipeHint.classList.add('swipe-hint--hidden');
        if (hintTimer) clearTimeout(hintTimer);
    }

    function showSwipeHint() {
        if (!swipeHint) return;
        // Remove hidden class in case it was already faded from a previous open
        swipeHint.classList.remove('swipe-hint--hidden');
        // Auto-fade after 5 seconds
        if (hintTimer) clearTimeout(hintTimer);
        hintTimer = setTimeout(hideSwipeHint, 5000);
    }

    // Hide the hint when the user scrolls (swipes) inside the book pages
    if (pages && swipeHint) {
        pages.addEventListener('scroll', hideSwipeHint, { once: true });
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