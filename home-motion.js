(() => {
  const page = document.querySelector('.home-page');
  if (!page || !('animate' in Element.prototype)) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  const seen = new WeakSet();
  const pending = new Set();
  let observer;

  function show(element, delay = 0, image = false) {
    if (seen.has(element)) return;
    seen.add(element);
    if (preference.matches) return;
    const animation = element.animate([
      { opacity: 0, transform: image ? 'translateY(18px) scale(.98)' : 'translateY(18px)' },
      { opacity: 1, transform: image ? 'translateY(0) scale(1)' : 'translateY(0)' }
    ], {
      duration: image ? 850 : 650,
      delay,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'backwards'
    });
    active.add(animation);
    animation.finished.then(() => active.delete(animation), () => active.delete(animation));
  }

  const groups = [
    ['.site-header .brand, .site-header nav > a', 55],
    ['.hero-copy > *', 100],
    ['.product-editorial', 0, true],
    ['.brand-strip > span', 85],
    ['.about-topline, .about-heading, .about-description, .about-details > div, .about-link', 75],
    ['.products-heading, .collection-card, .products-all', 90],
    ['.principles-title, .principle-list > article', 85],
    ['.feature-heading, .feature-facts > div, .fact-source', 85],
    ['.resource-heading, .editorial-card, .source-links', 85],
    ['.contact-copy > *, .contact-side', 80],
    ['footer > *', 70]
  ];
  const settings = new WeakMap();
  groups.forEach(([selector, step, image]) => {
    page.querySelectorAll(selector).forEach((element, index) => {
      // Short stagger only: scrolling never waits for a long animation queue.
      settings.set(element, { delay: Math.min(index * step, 240), image });
      pending.add(element);
    });
  });

  if ('IntersectionObserver' in window && !preference.matches) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const config = settings.get(element);
        show(element, config.delay, config.image);
        pending.delete(element);
        observer.unobserve(element);
      });
    }, { threshold: 0.08 });
    pending.forEach(element => observer.observe(element));
  }

  // Anchor navigation and keyboard focus must reveal content immediately.
  function revealImmediately(element) {
    active.forEach(animation => {
      const target = animation.effect?.target;
      if (target && (target === element || element.contains(target) || target.contains(element))) {
        animation.cancel();
      }
    });
    pending.forEach(target => {
      if (target === element || element.contains(target) || target.contains(element)) {
        seen.add(target);
        observer?.unobserve(target);
        pending.delete(target);
      }
    });
  }
  page.addEventListener('focusin', event => revealImmediately(event.target));
  function revealHash() {
    if (!location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target) revealImmediately(target);
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();

  window.addEventListener('beforeprint', () => {
    active.forEach(animation => animation.cancel());
  });

  preference.addEventListener('change', event => {
    if (!event.matches) return;
    observer?.disconnect();
    active.forEach(animation => animation.cancel());
    active.clear();
    pending.clear();
  });
})();
