document.addEventListener('DOMContentLoaded', () => {
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
        document.body.inert = true;
        lightbox.inert = false;
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
        document.body.inert = false;
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

        function createDots() {
            dotsContainer.innerHTML = '';
            const dotCount = maxIndex() + 1;
            for (let i = 0; i < dotCount; i++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'dot';
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => goTo(i));
                dotsContainer.appendChild(dot);
            }
        }

        function updateDots() {
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
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
            currentIndex = Math.min(Math.max(currentIndex + direction, 0), maxIndex());
            update();
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