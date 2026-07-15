document.addEventListener('DOMContentLoaded', () => {
    // ─── FEEDBACK FORM URL ───────────────────────────────────────────
    // One-line swap: paste the real Google Form URL here when it's ready.
    const FEEDBACK_FORM_URL = 'PASTE_GOOGLE_FORM_URL_HERE';
    document.querySelectorAll('.feedback-link').forEach(link => {
        link.href = FEEDBACK_FORM_URL;
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    //const lightboxClose = document.querySelector('.lightbox-close'); a dead code but idk why i added it in the first place
    let lastFocusedElement = null;

    // Open lightbox
    document.body.addEventListener('click', (e) => {
        const img = e.target.closest('.lightbox-trigger');
        if (!img) return;

        lastFocusedElement = img;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.remove('hidden');
        // Inert every direct child of body except the lightbox itself, so
        // the overlay is the only interactive region while it is open.
        Array.from(document.body.children).forEach(child => {
            if (child !== lightbox) child.inert = true;
        });
        lightboxImg.focus();
    });

    // Close lightbox (click overlay or close button)
    lightbox.addEventListener('click', (e) => {
        if (e.target.closest('#lightbox-img')) return;
        closeLightbox();
    });

    // Close lightbox (Escape key) + trap Tab focus inside while open
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
            closeLightbox();
            return;
        }

        if (e.key === 'Tab') {
            const focusable = lightbox.querySelectorAll('button, [href], img[tabindex]');
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    function closeLightbox() {
        lightbox.classList.add('hidden');
        Array.from(document.body.children).forEach(child => {
            child.inert = false;
        });
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    // Slider logic (unchanged from your working V1)
    function initSlider(wrapperEl) {
        const track = wrapperEl.querySelector('.product-grid');
        const prevBtn = wrapperEl.querySelector('.slider-prev');
        const nextBtn = wrapperEl.querySelector('.slider-next');
        const dotsContainer = wrapperEl.querySelector('.dots');

        const cards = Array.from(track.children);
        const totalCards = cards.length;

        function getCardsPerView() {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--cards-per-view');
            return parseInt(raw, 10) || 1;
        }

        let currentIndex = 0;

        function maxIndex() {
            return Math.max(0, totalCards - getCardsPerView());
        }

        // Each "page" of the carousel shows getCardsPerView() cards, so
        // the prev/next buttons should jump by that many cards — not by 1.
        // Otherwise a user who sees 3 cards clicks `>` and only moves one,
        // which feels broken. We recalculate on every move so viewport
        // changes (resize, orientation) are reflected immediately.
        const PAGE_STEP = () => getCardsPerView();

        // Dot positions land on page boundaries: 0, step, 2*step, ...
        // The final dot is clamped to the last valid leftmost index so
        // there's always a dot that surfaces the tail end of the row.
        function pageStarts() {
            const step = PAGE_STEP();
            const last = maxIndex();
            const starts = [];
            for (let i = 0; i <= last; i += step) {
                starts.push(Math.min(i, last));
            }
            // Guarantee the final page (last valid index) is reachable.
            if (starts[starts.length - 1] !== last) starts.push(last);
            return starts;
        }

        function createDots() {
            dotsContainer.innerHTML = '';
            const starts = pageStarts();
            starts.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'dot';
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => goTo(starts[i]));
                dotsContainer.appendChild(dot);
            });
        }

        function updateDots() {
            const dots = dotsContainer.querySelectorAll('.dot');
            const starts = pageStarts();
            // Highlight the dot for the page currently in view — i.e. the
            // page whose start index is the greatest one <= currentIndex.
            let activeIdx = 0;
            for (let i = 0; i < starts.length; i++) {
                if (starts[i] <= currentIndex) activeIdx = i;
            }
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIdx);
            });
        }

        function update() {
            if (cards.length === 0) return;
            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            const step = cardWidth + gap;

            track.style.transform = `translateX(${-(currentIndex * step)}px)`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex();
            updateDots();
        }

        function move(direction) {
            // Advance by a full page (cards visible at once), not a single
            // card. direction is +1 (next) or -1 (prev).
            const step = PAGE_STEP();
            const starts = pageStarts();

            // Find the current page index, then move to the neighbour page's
            // start index. This keeps clicks landing on clean page breaks
            // even after a viewport resize that changed the step size.
            let currentIdx = 0;
            for (let i = 0; i < starts.length; i++) {
                if (starts[i] <= currentIndex) currentIdx = i;
            }
            const nextIdx = Math.min(Math.max(currentIdx + direction, 0), starts.length - 1);
            goTo(starts[nextIdx]);
        }

        function goTo(index) {
            currentIndex = Math.min(Math.max(index, 0), maxIndex());
            update();
        }

        prevBtn.addEventListener('click', () => move(parseInt(prevBtn.dataset.dir, 10)));
        nextBtn.addEventListener('click', () => move(parseInt(nextBtn.dataset.dir, 10)));

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                createDots();
                goTo(currentIndex);
            }, 150);
        });

        createDots();
        update();
    }

    document.querySelectorAll('.slider-wrapper').forEach(initSlider);
});