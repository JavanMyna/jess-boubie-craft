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

