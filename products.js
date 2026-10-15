(() => {
  const buttons = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.product-card')];
  const count = document.querySelector('.product-count');
  const search = document.querySelector('#product-search');
  const empty = document.querySelector('.catalog-empty');
  const reset = document.querySelector('#reset-products');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let category = 'all';

  function animate(element, delay = 0) {
    if (preference.matches || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(14px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 500, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }
  function stopAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase('th').trim();
  function update(withMotion = false) {
    stopAnimations();
    const query = normalize(search.value);
    let visible = 0;
    buttons.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    cards.forEach(card => {
      const matches = (category === 'all' || card.dataset.category === category)
        && normalize(card.dataset.search || card.textContent).includes(query);
      card.hidden = !matches;
      if (matches) {
        if (withMotion) animate(card, Math.min(visible * 45, 180));
        visible += 1;
      }
    });
    count.textContent = `แสดง ${visible} รายการ`;
    empty.hidden = visible !== 0;
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    update(true);
  }));
  search.addEventListener('input', () => update());
  reset.addEventListener('click', () => {
    category = 'all';
    search.value = '';
    update(true);
    search.focus();
  });
  update();

  // Reveal sections once as they enter view; no hidden-content dependency.
  if ('IntersectionObserver' in window && !preference.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.catalog-title-row, .product-card, .detail-heading, .detail-layout, .oral-detail > h2, .table-scroll, .brush-gallery, .catalog-help').forEach(element => observer.observe(element));
    preference.addEventListener('change', event => {
      if (event.matches) { observer.disconnect(); stopAnimations(); }
    });
  }
  document.addEventListener('focusin', stopAnimations);
  window.addEventListener('beforeprint', stopAnimations);
})();
