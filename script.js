document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    // Find every product image on the page
    // Attach a click "handler" to each one
    document.querySelector('.product-grid').addEventListener('click', (e) => {
        const img = e.target.closest('.product-card img');
        if (!img) return;
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
});

document.addEventListener('DOMContentLoaded', () => {

    function initSlider(sliderEl) {
        const track   = sliderEl.querySelector('.product-grid');
        const prevBtn = sliderEl.querySelector('.slider-prev');
        const nextBtn = sliderEl.querySelector('.slider-next');

        // track.children is an HTMLCollection — like a Python list, but
        // "live" and missing most list methods (no .map, no .filter).
        // Array.from() converts it into a real Array, same as calling
        // list(some_iterable) in Python to unlock full list behaviour.
        // Note: .children (not .childNodes) only grabs actual elements,
        // skipping stray whitespace text nodes — like filtering a mixed
        // list down to only the objects you care about.
        const cards = Array.from(track.children);
        const totalCards = cards.length;   // <-- this IS len(cards)

        // Read --cards-per-view live from CSS, so JS and CSS can never
        // disagree, and it auto-updates when your @media query kicks in.
        function getCardsPerView() {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--cards-per-view');
            return parseInt(raw, 10) || 1;   // parseInt() ≈ Python's int()
        }

        // currentIndex is our STATE — the one variable that remembers where
        // we are. Exactly like `start = 0` before doing `my_list[start:start+n]`
        // in Python, then updating `start` each time you paginate.
        let currentIndex = 0;

        // The furthest right we're allowed to scroll — you can't scroll
        // past the point where the last card is flush against the edge.
        // Python: max(0, len(cards) - cards_per_view)
        function maxIndex() {
            return Math.max(0, totalCards - getCardsPerView());
        }

        function update() {
            // Measure ONE real card's rendered width in pixels — more
            // reliable than doing the math ourselves, since the browser
            // already resolved every calc() and % for us.
            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            const step = cardWidth + gap;   // distance to travel per index

            // Shift the whole track left by (index * step) pixels.
            // Negative X = move left = reveal cards further along the list.
            track.style.transform = `translateX(${-(currentIndex * step)}px)`;

            // Disable buttons at the boundaries. Same as guarding a Python
            // pagination function: `if start == 0: disallow prev()`.
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex();
        }

        function move(direction) {
            // direction is -1 or +1, read off the button's data-dir attribute.
            // Clamp between 0 and maxIndex() so we can never go out of bounds —
            // identical to Python's: start = min(max(start + direction, 0), max_index)
            currentIndex = Math.min(Math.max(currentIndex + direction, 0), maxIndex());
            update();
        }

        prevBtn.addEventListener('click', () => move(parseInt(prevBtn.dataset.dir, 10)));
        nextBtn.addEventListener('click', () => move(parseInt(nextBtn.dataset.dir, 10)));

        // Card width / cards-per-view can change on resize (your @media query
        // flips --cards-per-view to 1 on small screens) — recalculate the
        // pixel position, don't just leave it stale.
        window.addEventListener('resize', update);

        update();   // run once immediately so buttons start in the right state
    }

    // Find EVERY .slider on the page and wire each one up independently.
    // Right now you have one, but this scales to more without new code —
    // like looping `for slider in all_sliders: init(slider)` in Python.
    document.querySelectorAll('.slider').forEach(initSlider);

});