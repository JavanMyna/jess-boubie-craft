document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    /* ONE listener on the whole page. Any click that bubbles up from
       an element with class="lightbox-trigger" (product cards, gallery,
       future sections) gets handled here.
       
       Python analogy: this is like a single @app.route('/') handler
       that checks request.path inside the function, instead of
       registering a separate route for every single URL. */
    document.body.addEventListener('click', (e) => {
        const img = e.target.closest('.lightbox-trigger');
        if (!img) return;   // guard clause: wrong target, ignore

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.remove('hidden');
    });

    // Clicking anywhere on the dark overlay closes it
    lightbox.addEventListener('click', (e) => {
        if (!e.target.closest('#lightbox-img')) {
            lightbox.classList.add('hidden');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
            lightbox.classList.add('hidden');
        }
    });

    function initSlider(wrapperEl) {
        const track      = wrapperEl.querySelector('.product-grid');
        const prevBtn    = wrapperEl.querySelector('.slider-prev');
        const nextBtn    = wrapperEl.querySelector('.slider-next');
        const dotsContainer = wrapperEl.querySelector('.dots');   // NEW

        const cards = Array.from(track.children);
        const totalCards = cards.length;

        function getCardsPerView() {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--cards-per-view');
            return parseInt(raw, 10) || 1;
        }

        let currentIndex = 0;   // the ONE shared state, now used by buttons AND dots

        function maxIndex() {
            return Math.max(0, totalCards - getCardsPerView());
        }

        // NEW — builds the dots fresh. Called once at startup, and again on
        // resize (since cardsPerView, and therefore dot count, can change).
        function createDots() {
            dotsContainer.innerHTML = '';   // wipe any previous set first

            const dotCount = maxIndex() + 1;   // <-- the formula we just derived

            for (let i = 0; i < dotCount; i++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'dot';
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);

                // `let i` (not `var i`) matters here: each loop iteration gets
                // its OWN copy of i, so this closure "remembers" the right
                // value per dot. With `var`, all dots would wrongly jump to
                // the same final index — a classic JS gotcha you just avoided
                // by using `let`.
                dot.addEventListener('click', () => goTo(i));

                dotsContainer.appendChild(dot);
            }
        }

        // NEW — paints which dot is "active" to match currentIndex
        function updateDots() {
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        function update() {
            if (cards.length === 0) return;   // guard: empty grid, nothing to animate
            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            const step = cardWidth + gap;

            track.style.transform = `translateX(${-(currentIndex * step)}px)`;

            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex();

            updateDots();   // NEW — keep dots synced every time position changes
        }

        function move(direction) {
            currentIndex = Math.min(Math.max(currentIndex + direction, 0), maxIndex());
            update();
        }

        // NEW — jump directly to a position (what dot-clicks need, vs. move()'s
        // relative ±1 step)
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
                update();
            }, 150); // 150ms is the sweet spot
        });

        createDots();   // build dots once on load
        update();       // then set initial positions/states
    }

    document.querySelectorAll('.slider-wrapper').forEach(initSlider);
    // When opening
    document.body.setAttribute('aria-hidden', 'true');
    lightbox.removeAttribute('aria-hidden');
    lightboxImg.focus(); // or a close button

    // When closing (reverse)
    });