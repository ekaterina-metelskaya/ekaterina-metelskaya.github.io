// Consent banner for Google Analytics. The choice lives in localStorage (em-analytics: granted | denied);
// GA4 itself is started and stopped by window.emAnalytics from the inline script in <head> (templates/partials/gtag.html).
// Any element with data-consent-open (footer, privacy page) brings the banner back to change the choice.
(() => {
  const banner = document.querySelector('[data-consent]');
  if (!banner || !window.emAnalytics) return;
  const KEY = 'em-analytics';
  let opener = null;

  // While the banner is open the footer gets room at the bottom (in its own colour), so nothing is stuck under the banner
  const footer = document.querySelector('.site-footer') || document.body;
  const room = () => footer.style.setProperty('padding-bottom', banner.hidden ? '' : `calc(${banner.offsetHeight + 16}px + env(safe-area-inset-bottom, 0px))`);
  new ResizeObserver(room).observe(banner);
  const show = open => { banner.hidden = !open; room(); };

  banner.addEventListener('click', e => {
    const btn = e.target.closest('[data-consent-choice]');
    if (!btn) return;
    const choice = btn.dataset.consentChoice;
    try { localStorage.setItem(KEY, choice); } catch (err) {}
    if (choice === 'granted') emAnalytics.grant(); else emAnalytics.revoke();
    show(false);
    opener?.focus();
    opener = null;
  });

  document.addEventListener('click', e => {
    const link = e.target.closest('[data-consent-open]');
    if (!link) return;
    e.preventDefault();
    opener = link;
    show(true);
    banner.querySelector('[data-consent-choice]').focus();
  });

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (err) {}
  if (stored !== 'granted' && stored !== 'denied') show(true);
})();
