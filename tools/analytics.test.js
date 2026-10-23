// Dependency-free regression checks: node --test tools/analytics.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function setup({ stored = null, oldStored = null, home = true } = {}) {
  const docListeners = {}, winListeners = {}, frames = [], observers = [], appended = [];
  const section = { id: 'about' }, end = {}, card = {};
  const document = {
    visibilityState: 'visible', documentElement: { scrollHeight: 10000 }, cookie: '',
    referrer: 'https://referrer.test/',
    head: { appendChild: el => appended.push(el) }, createElement: () => ({ remove() {} }),
    addEventListener: (name, fn) => (docListeners[name] ||= []).push(fn),
    dispatchEvent: e => (docListeners[e.type] || []).forEach(fn => fn(e)),
    querySelector: s => ({ '.hero': home ? {} : null, '.prose': home ? null : {}, '[data-content-end]': end, '[data-match-copy]': card })[s] || null,
    querySelectorAll: s => s === 'details' || s === '.prose .fig' ? [] : [section],
  };
  const context = vm.createContext({ document, console, URL, Set, Map, WeakMap,
    localStorage: { getItem: key => key === 'em-analytics-v2' ? stored : oldStored },
    location: { pathname: home ? '/' : '/cases/planning.html', hostname: 'example.test', href: 'https://example.test/' },
    innerHeight: 1000, scrollY: 0,
    Event: class { constructor(type) { this.type = type; } },
    addEventListener: (name, fn) => (winListeners[name] ||= []).push(fn),
    requestAnimationFrame: fn => frames.push(fn), queueMicrotask: fn => fn(),
    IntersectionObserver: class {
      constructor(fn) { this.fn = fn; this.targets = new Set(); observers.push(this); }
      observe(el) { this.targets.add(el); }
      unobserve(el) { this.targets.delete(el); }
    },
  });
  context.window = context;
  vm.runInContext(read('templates/partials/gtag.html').match(/<script>([\s\S]*?)<\/script>/)[1], context);
  vm.runInContext(read('js/analytics.js'), context);
  const flush = () => { while (frames.length) frames.shift()(); };
  const dispatch = (type, target) => document.dispatchEvent({ type, target });
  const observe = target => observers[0].fn([{ target, isIntersecting: true }]);
  const events = name => Array.from(context.dataLayer).filter(args => args[0] === 'event' && (!name || args[1] === name));
  const scroll = y => { context.scrollY = y; (winListeners.scroll || []).forEach(fn => fn()); flush(); };
  flush();
  return { context, document, section, end, card, events, scroll, observe, dispatch, flush, appended };
}

test('no custom events or Google script before consent; no replay of old interactions', () => {
  const s = setup();
  s.context.emAnalytics.track('cv_click', { location: 'header' });
  s.scroll(9000); s.observe(s.section); s.observe(s.end);
  assert.equal(s.events().length, 0); assert.equal(s.appended.length, 0);
  s.scroll(0); s.context.emAnalytics.grant(); s.flush();
  assert.equal(s.events().length, 0);
  assert.equal(s.appended.length, 2);
});
test('old GA-only consent does not load either counter', () => {
  const s = setup({ oldStored: 'granted' });
  assert.equal(s.appended.length, 0);
  assert.equal(s.context.ym, undefined);
  assert.equal(s.context.emAnalytics.granted, false);
});
test('Metrica starts once after load with the supplied counter settings and stops on revoke', () => {
  const s = setup({ stored: 'granted' });
  const script = s.appended.find(el => el.src.includes('mc.yandex.ru'));
  assert.equal(script.src, 'https://mc.yandex.ru/metrika/tag.js?id=113747202');
  assert.equal(script.async, true);
  assert.equal(s.context.ym.a, undefined); // No init queued while the library is loading.
  script.onload();
  const init = s.context.ym.a[0];
  assert.equal(init[0], 113747202); assert.equal(init[1], 'init');
  for (const key of ['ssr', 'webvisor', 'clickmap', 'accurateTrackBounce', 'trackLinks']) assert.equal(init[2][key], true, key);
  assert.equal(init[2].ecommerce, 'dataLayer');
  assert.equal(init[2].referrer, s.document.referrer);
  assert.equal(init[2].url, s.context.location.href);
  s.context.emAnalytics.grant();
  assert.equal(s.context.ym.a.length, 1);
  s.context.emAnalytics.revoke();
  assert.equal(s.context.ym.a[1][1], 'destruct');
  s.context.emAnalytics.grant();
  assert.equal(s.context.ym.a[2][1], 'init');
  assert.equal(s.appended.length, 2); // One script per provider, including re-grants.
});
test('revoking while Metrica loads prevents late initialization', () => {
  const s = setup({ stored: 'granted' });
  const script = s.appended.find(el => el.src.includes('mc.yandex.ru'));
  s.context.emAnalytics.revoke(); script.onload();
  assert.equal(s.context.ym.a, undefined);
  assert.equal(s.context.emAnalytics.metrikaActive, false);
  s.context.emAnalytics.grant();
  assert.equal(s.context.ym.a[0][1], 'init');
  assert.equal(s.appended.length, 2);
});
test('blocked Metrica can retry and does not block GA4', () => {
  const s = setup({ stored: 'granted' });
  s.appended.find(el => el.src.includes('mc.yandex.ru')).onerror();
  assert.equal(s.context.emAnalytics.metrikaActive, false);
  s.context.emAnalytics.track('cv_click', { location: 'header' });
  assert.equal(s.events('cv_click').length, 1);
  s.context.emAnalytics.grant();
  assert.equal(s.appended.filter(el => el.src.includes('mc.yandex.ru')).length, 2);
});
test('thresholds fire once per page view including jumps and bfcache', () => {
  const s = setup({ stored: 'granted' });
  s.scroll(1600); s.scroll(4000); s.scroll(8000); s.scroll(0); s.scroll(9500);
  s.dispatch('em:consent'); s.flush();
  assert.deepEqual(s.events('scroll_depth').map(e => e[2].percent_scrolled), [25, 50, 75, 90]);
});
test('section and content end are deduplicated and tagged with the case page', () => {
  const s = setup({ stored: 'granted', home: false });
  s.observe(s.section); s.observe(s.section); s.observe(s.end); s.observe(s.end);
  assert.equal(s.events('section_view').length, 1);
  assert.equal(s.events('content_end').length, 1);
  assert.equal(s.events('content_end')[0][2].page_type, 'case');
  assert.equal(s.events('section_view')[0][2].section_id, 'about');
});
test('revoke blocks events; granting again does not duplicate config or completed thresholds', () => {
  const s = setup({ stored: 'granted' });
  s.scroll(1600); s.context.emAnalytics.revoke();
  s.scroll(5000); s.observe(s.section);
  assert.equal(s.events('scroll_depth').length, 1);
  assert.equal(s.events('section_view').length, 0);
  s.context.emAnalytics.grant(); s.flush(); s.observe(s.section);
  assert.deepEqual(s.events('scroll_depth').map(e => e[2].percent_scrolled), [25, 50]);
  assert.equal(s.events('section_view').length, 1);
  assert.equal(s.context.dataLayer.filter(e => e[0] === 'config').length, 1);
  assert.equal(s.appended.length, 2);
});
test('hidden document does not report depth, sections or results', () => {
  const s = setup({ stored: 'granted' }); s.document.visibilityState = 'hidden';
  s.scroll(9000); s.observe(s.section); s.observe(s.end);
  assert.equal(s.events().length, 0);
});
test('match result waits for visibility, deduplicates and records a new result', () => {
  const s = setup({ stored: 'granted' });
  const result = { role: 'product', result_key: 'first' };
  s.document.dispatchEvent({ type: 'em:match-result', detail: result });
  assert.equal(s.events('match_result').length, 0);
  s.observe(s.card); s.observe(s.card);
  s.document.dispatchEvent({ type: 'em:match-result', detail: result });
  assert.equal(s.events('match_result').length, 1);
  s.document.dispatchEvent({ type: 'em:match-result', detail: { ...result, result_key: 'second' } });
  assert.equal(s.events('match_result').length, 2);
});
function link({ cv = false, href = 'https://t.me/person', place = 'header' } = {}) {
  const el = {
    href, disabled: false, getAttribute: () => null,
    matches: s => s === '[data-cv]' ? cv : s === 'a[href]',
    closest: s => s.includes('a, button') ? el :
      s === '.site-header' && place === 'header' || s === '.site-footer' && place === 'footer' || s === '#match' && place === 'match' ? {} : null,
  };
  return el;
}
test('CV and all contact channels include placement; match contact is also recorded', () => {
  const s = setup({ stored: 'granted' });
  s.dispatch('click', link({ cv: true }));
  for (const href of ['https://t.me/person', 'mailto:test@example.test', 'https://www.linkedin.com/in/person/']) {
    s.dispatch('click', link({ href, place: 'footer' }));
  }
  s.dispatch('click', link({ place: 'match' }));
  assert.equal(s.events('cv_click')[0][2].location, 'header');
  assert.deepEqual(s.events('contact_click').map(e => e[2].channel), ['telegram', 'email', 'linkedin', 'telegram']);
  assert.equal(s.events('contact_click')[0][2].location, 'footer');
  assert.equal(s.events('match_contact').length, 1);
  assert.equal(s.events('ui_interaction').length, 0);
});
test('every built page loads analytics first; end marker precedes next case', () => {
  for (const file of ['index.html', 'projects.html', 'privacy.html', ...fs.readdirSync(path.join(root, 'cases')).map(f => `cases/${f}`)]) {
    const html = read(file);
    assert.equal((html.match(/src="(?:\.\.\/)?js\/analytics\.js/g) || []).length, 1, file);
    assert.ok(html.indexOf('js/analytics.js') < html.indexOf('js/menu.js'), file);
    if (file.startsWith('cases/')) {
      assert.equal((html.match(/data-content-end/g) || []).length, 1, file);
      assert.ok(html.indexOf('data-content-end') < html.indexOf('class="next-link"'), file);
    }
  }
});
