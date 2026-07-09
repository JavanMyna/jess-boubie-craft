/*
    story.js controls two interactions: opening the book and toggling
    dark mode. It stays small and declarative — the animation itself is
    driven by CSS, and the theme state is mostly a class on <html>.
*/

document.addEventListener('DOMContentLoaded', () => {
    const book = document.getElementById('book');
    const cover = document.getElementById('bookCover');
    const interior = document.getElementById('bookInterior');
    const pages = document.getElementById('bookPages');
    const bookClose = document.getElementById('bookClose');
    const themeToggle = document.getElementById('themeToggle');

    /*
        Detect the user's motion preference. matchMedia returns a live
        MediaQueryList object; .matches is true when the OS/browser is set
        to reduce motion (macOS/iOS "Reduce Motion", Windows
        "Show animations", Android "Remove animations", etc.).

        We check it once up front. If true, the openBook() function will
        move focus immediately instead of waiting for a CSS transition
        that isn't happening.
    */
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

        /*
            Remove the cover from the keyboard tab order once the book is
            open. A user shift-tabbing backward should not land on an
            invisible, rotated cover. We keep it reachable before opening
            (real buttons are focusable by default), then pull it out now.
        */
        cover.tabIndex = -1;

        /*
            Hide the cover from assistive technologies once it is visually
            gone. We do this after setting tabIndex so we don't violate the
            ARIA rule that aria-hidden should not be used on focusable elements.
        */
        cover.setAttribute('aria-hidden', 'true');

        if (prefersReducedMotion) {
            // No animation is playing, so we can move focus right away.
            // preventScroll keeps the browser from jumping the page down
            // to the focused element; the user is already looking at it.
            pages.focus({ preventScroll: true });
        } else {
            /*
                Wait for the cover's CSS transition to finish before moving
                focus. If we focused the reading area while it was still
                opacity: 0 / visibility: hidden, screen readers might read
                hidden content or keyboard focus could behave oddly.

                We listen on the cover because that transition is the
                longest-running one (1s). { once: true } auto-removes the
                listener after it fires, so it doesn't accumulate on repeated
                opens (even though openBook guards against repeated calls).
            */
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

    /*
        We attach a single click listener to the cover button. Because the
        cover is a real <button>, the browser automatically translates
        Enter/Space key presses into click events for us — no separate
        keydown handler needed. That is the main reason we used a <button>
        instead of a <div>: we get keyboard accessibility for free.
    */
    cover.addEventListener('click', openBook);

    if (bookClose) {
        bookClose.addEventListener('click', closeBook);
    }
});
