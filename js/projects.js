(() => {
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chips = $$('[data-filter]');
  const cards = $$('[data-open] .case-card');
  const countEl = document.querySelector('[data-count]');
  const allCount = countEl.textContent;
  const plural = (n, [one, few, many]) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many}`;

  /* ---------- Filter by project type; the choice lives in the address (#own), so it can be shared ---------- */
  const setFilter = (type, focus) => {
    if (!chips.some(c => c.dataset.filter === type)) type = 'all';
    chips.forEach(c => {
      const on = c.dataset.filter === type;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
      if (on && focus) c.focus();
    });
    const shown = cards.filter(c => {
      const on = type === 'all' || c.dataset.type === type;
      c.hidden = !on;
      return on;
    });
    countEl.textContent = type === 'all' ? allCount : type === 'wip' ? plural(shown.length, ['проект', 'проекта', 'проектов']) + ' в разработке' : plural(shown.length, ['кейс', 'кейса', 'кейсов']);
    if (!reduceMotion) shown.forEach((c, i) => c.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, delay: i * 50, easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'backwards' },
    ));
    history.replaceState(null, '', type === 'all' ? location.pathname : `#${type}`);
  };
  chips.forEach((c, i) => {
    c.addEventListener('click', () => setFilter(c.dataset.filter));
    c.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      setFilter(chips[(i + d + chips.length) % chips.length].dataset.filter, true);
    });
  });
  const fromHash = location.hash.slice(1);
  if (fromHash) setFilter(fromHash);
})();
