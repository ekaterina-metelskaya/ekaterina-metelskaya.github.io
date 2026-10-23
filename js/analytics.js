// Custom GA4 events. emAnalytics.track is the single consent gate; nothing is buffered before consent.
(() => {
  const api = window.emAnalytics;
  if (!api) return;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const track = (name, params) => api.track(name, params);
  const isCase = !!$('.prose');
  const isHome = !!$('.hero');
  const locationOf = el => {
    if (el.closest('.site-header')) return 'header';
    if (el.closest('.site-footer')) return 'footer';
    if (el.closest('#match')) return 'match';
    if (el.closest('.hero, .case-hero')) return 'hero';
    return el.closest('section[id]')?.id || 'page';
  };
  // Only authored control identifiers/labels; never read text entered into demo forms.
  const identity = el => {
    if (el.matches('a[href]')) {
      const url = new URL(el.href, location.href);
      return (url.pathname + url.hash).slice(0, 100);
    }
    const keys = ['scheme', 'beh', 'v', 'phTab', 'day', 'genre', 'key', 'fs', 'apMode', 'lang', 'token', 'slShow', 'agStep', 'i'];
    const key = keys.find(k => el.dataset[k] !== undefined);
    if (key) return `${key}:${el.dataset[key]}`.slice(0, 100);
    const marker = [...el.attributes].find(a => a.name.startsWith('data-'));
    return (el.id || marker?.name || el.getAttribute('aria-label') || el.classList[0] || el.tagName.toLowerCase()).slice(0, 100);
  };
  const figures = $$('.prose .fig');
  const interaction = (el, action, extra = {}) => track('ui_interaction', {
    element: identity(el), action, location: locationOf(el),
    component: el.closest('.fig') ? `figure_${figures.indexOf(el.closest('.fig')) + 1}` : '',
    section_id: el.closest('section[id]')?.id || '', ...extra,
  });

  const depths = new Set();
  const checkDepth = () => {
    if ((!isHome && !isCase) || document.visibilityState === 'hidden') return;
    const height = document.documentElement.scrollHeight;
    if (height <= innerHeight) return;
    const percent = Math.min(100, (scrollY + innerHeight) / height * 100);
    [25, 50, 75, 90].forEach(depth => {
      if (percent >= depth && !depths.has(depth) && track('scroll_depth', { percent_scrolled: depth })) depths.add(depth);
    });
  };
  let frame = false;
  const scheduleDepth = () => {
    if (frame) return;
    frame = true;
    requestAnimationFrame(() => { frame = false; checkDepth(); });
  };
  addEventListener('scroll', scheduleDepth, { passive: true });
  addEventListener('resize', scheduleDepth);
  addEventListener('load', scheduleDepth);

  const seen = new Set();
  const targets = new Map();
  if (isHome || isCase) {
    $$('main section[id], .hero, .case-hero').forEach(el => targets.set(el, {
      name: 'section_view', params: { section_id: el.id || 'hero' },
    }));
  }
  const end = $('[data-content-end]');
  if (end) targets.set(end, { name: 'content_end', params: {} });
  let result = null;
  let resultVisible = false;
  let lastResult = '';
  const card = $('[data-match-copy]');
  const reportResult = () => {
    if (!resultVisible || !result || document.visibilityState === 'hidden') return;
    const key = JSON.stringify(result);
    if (key !== lastResult && track('match_result', { ...result, location: 'match' })) lastResult = key;
  };
  document.addEventListener('em:match-result', e => { result = e.detail; if (!result) lastResult = ''; reportResult(); });
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === card) { resultVisible = entry.isIntersecting; reportResult(); return; }
      if (!entry.isIntersecting || document.visibilityState === 'hidden' || seen.has(entry.target)) return;
      const event = targets.get(entry.target);
      if (event && track(event.name, event.params)) { seen.add(entry.target); observer.unobserve(entry.target); }
    });
  }, { threshold: 0 }) : null;
  const refresh = () => {
    scheduleDepth();
    if (observer) {
      targets.forEach((_, el) => { if (!seen.has(el)) { observer.unobserve(el); observer.observe(el); } });
      if (card) { observer.unobserve(card); observer.observe(card); }
    }
    reportResult();
  };
  document.addEventListener('em:consent', refresh);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') refresh(); });
  addEventListener('pageshow', refresh); // bfcache keeps the same page-view deduplication sets.
  refresh();

  document.addEventListener('click', e => {
    if (e.isTrusted === false) return;
    const el = e.target.closest('a, button, [role="button"], [role="radio"], [role="tab"], [tabindex], summary');
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    const place = locationOf(el);
    if (el.matches('[data-cv]')) {
      track('cv_click', { location: place });
      return;
    }
    if (el.matches('a[href]')) {
      const url = new URL(el.href, location.href);
      const channel = url.protocol === 'mailto:' ? 'email' :
        /^(www\.)?t\.me$/.test(url.hostname) ? 'telegram' :
        /^(www\.)?linkedin\.com$/.test(url.hostname) ? 'linkedin' : null;
      if (channel) {
        track('contact_click', { channel, location: place });
        if (place === 'match') track('match_contact', { channel, location: place });
        return;
      }
    }
    if (el.closest('#match') || el.matches('input, select, textarea, summary')) return;
    if (!el.closest('.hero, .case-hero, .site-header, .prose')) return;
    const before = el.getAttribute('aria-checked') ?? el.getAttribute('aria-selected');
    // Capture also reaches demos that stop propagation. Read the state after their handler.
    queueMicrotask(() => {
      if (el.matches('[role="radio"], [role="tab"]') && before === 'true') return;
      const action = el.hasAttribute('aria-expanded') ? (el.getAttribute('aria-expanded') === 'true' ? 'expand' : 'collapse') :
        el.matches('[role="radio"], [role="tab"]') ? 'select' : 'click';
      interaction(el, action);
    });
  }, true);
  document.addEventListener('change', e => {
    if (e.isTrusted === false) return;
    const el = e.target;
    if (!el.matches('input, select') || !el.closest('.hero, .prose')) return;
    const params = {};
    if (el.type === 'checkbox') params.value = el.checked ? 'on' : 'off';
    else if (el.type === 'range' || el.tagName === 'SELECT') params.value = el.value;
    interaction(el, 'change', params);
  }, true);
  document.addEventListener('keydown', e => {
    if (e.isTrusted === false || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) return;
    const el = e.target.closest('[role="radio"], [role="button"]');
    if (!el || !el.closest('.hero, .prose')) return;
    // Enter/Space on native buttons already produces click. Arrow keys in radio groups do not.
    if (el.tagName === 'BUTTON' && ['Enter', ' '].includes(e.key)) return;
    queueMicrotask(() => {
      const picked = document.activeElement;
      if (el.matches('[role="radio"]')) {
        if (picked !== el && picked?.getAttribute('aria-checked') === 'true') interaction(picked, 'select');
      } else interaction(el, 'activate');
    });
  }, true);
  // Native details: the browser also handles keyboard activation and nested summary content.
  const detailsState = new WeakMap($$('details').map(el => [el, el.open]));
  document.addEventListener('toggle', e => {
    if (e.target.matches('details') && e.target.closest('.prose, .site-header')) {
      if (detailsState.get(e.target) === e.target.open) return;
      detailsState.set(e.target, e.target.open);
      interaction(e.target, e.target.open ? 'expand' : 'collapse');
    }
  }, true);
})();
