// Compact menu for screens up to 1100px, where the header's section links (.nav) are hidden.
// It reuses the same links, so the list lives in one place — the header markup.
(() => {
  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('.nav');
  const right = header?.querySelector('.header-right');
  if (!nav || !right) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'site-menu');
  btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>Меню</span>';
  right.prepend(btn);

  const panel = document.createElement('nav');
  panel.id = 'site-menu';
  panel.className = 'site-menu';
  panel.setAttribute('aria-label', 'Разделы');
  panel.hidden = true;
  panel.innerHTML = `<div class="wrap">${[...nav.querySelectorAll('a')].map(a => a.outerHTML).join('')}</div>`;
  header.append(panel);

  const set = open => {
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    header.classList.toggle('is-menu-open', open);
  };
  btn.addEventListener('click', () => set(panel.hidden));
  panel.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('click', e => { if (!panel.hidden && !header.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  // Back to a wide screen: the regular links are visible again, the panel is not needed
  matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) set(false); });
})();
