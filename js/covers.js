// Card covers: the illustrations (tools/cover-tv.html, cover-invino.html, cover-ca.html) are drawn for 420×180.
// The card can be narrower, so the drawing is scaled as a whole to the cover's width instead of being cropped.
(() => {
  const covers = [...document.querySelectorAll('.case-card .cover')];
  if (!covers.length || !('ResizeObserver' in window)) return;
  const ro = new ResizeObserver(entries => entries.forEach(({ target }) => {
    target.style.setProperty('--art-s', (target.clientWidth / 420).toFixed(4));
  }));
  // First scale right away, then let the hover transition in on the next frame
  covers.forEach(c => {
    c.style.setProperty('--art-s', (c.clientWidth / 420).toFixed(4));
    ro.observe(c);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => covers.forEach(c => c.setAttribute('data-art-ready', ''))));
})();
