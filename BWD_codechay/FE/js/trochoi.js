(function () {
    const track = document.getElementById('gamesTrack');
    const controls = document.querySelectorAll('.slide-btn');

    if (!track || !controls.length) return;

    const getStep = () => Math.max(track.clientWidth * 0.85, 260);

    controls.forEach((button) => {
        button.addEventListener('click', () => {
            const dir = button.dataset.dir === 'next' ? 1 : -1;
            track.scrollBy({
                left: getStep() * dir,
                behavior: 'smooth'
            });
        });
    });
})();
