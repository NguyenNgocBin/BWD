(function () {
    const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!revealItems.length) return;

    revealItems.forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 120}ms`);
    });

    function revealVisibleItems() {
        const triggerLine = window.innerHeight * 0.86;

        revealItems.forEach((item) => {
            if (item.classList.contains("is-visible")) return;

            const rect = item.getBoundingClientRect();
            if (rect.top < triggerLine && rect.bottom > 0) {
                item.classList.add("is-visible");
            }
        });
    }

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.14,
                rootMargin: "0px 0px -10% 0px",
            }
        );

        revealItems.forEach((item) => observer.observe(item));
    }

    revealVisibleItems();
    window.addEventListener("scroll", revealVisibleItems, { passive: true });
    window.addEventListener("resize", revealVisibleItems);
})();
