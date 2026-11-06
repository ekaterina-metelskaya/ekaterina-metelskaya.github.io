// ---- Холст «Field Notes» — источник примеров рядом с плагином ----
// Подставляется в превью плагина перед `load();`. Карточки собраны по макету демо-файла (Figma Community: Re-Instance —
// Community Demo). Выделение карточек на холсте — это выделение в «Figma» для плагина (область «Выделение»);
// открытый в плагине фрейм подсвечивается на холсте, как при переходе к слою в Figma.
const FN_LANG = embedLang === 'en' ? 'en' : 'ru';
const FN_TEXT = {
  ru: {
    title: 'Файл с примерами',
    hint: 'Выделите карточки и запустите поиск по выделению, либо по странице целиком. Фрейм, открытый в плагине, подсвечивается здесь.',
    selected: (n) => `Выделено: ${n}`,
    clear: 'Снять выделение',
    select: 'Выделить на холсте',
    restored: 'Восстановлено как экземпляр · оригинал скрыт',
  },
  en: {
    title: 'Example file',
    hint: 'Select cards and scan the selection, or scan the whole page. A frame opened in the plugin is highlighted here.',
    selected: (n) => `Selected: ${n}`,
    clear: 'Clear selection',
    select: 'Select on canvas',
    restored: 'Restored as an instance · original hidden',
  },
}[FN_LANG];

// Card view: what a card looks like on the canvas and in the plugin's previews.
const view = (id, title, caption, extra = {}) => ({ id, title, caption, ...extra });
const FN_SECTIONS = [
  {
    title: 'Detached examples',
    tag: '4 frames',
    items: [
      view('1:25', 'Alpine lake', 'A quiet stop above the pines.', { label: 'Alpine lake', sub: 'Compare → preview transfer → restore' }),
      view('1:35', 'Cedar grove', 'Follow the shaded loop.', { label: 'Cedar grove', sub: 'Title and caption changed' }),
      view('1:45', 'North ridge', 'An open view of the valley.', { label: 'North ridge', sub: 'Title and caption changed' }),
      view('1:55', 'Trail map', 'A note from the trail.', { fill: '#F9DBBF', label: 'Trail map', sub: 'Bind fill → confirm color change' }),
    ],
  },
  {
    title: 'Local source components',
    tag: '2 originals',
    items: [
      view('1:10', 'Field guide', 'A note from the trail.', { main: true, label: 'Card' }),
      view('1:15', 'Trail map', 'A note from the trail.', { main: true, label: 'Card / Token' }),
    ],
  },
  {
    title: 'More ways to restore',
    items: [
      view('13:13', 'Trail map', 'A note from the trail.', { label: 'Unchanged', sub: 'Reconnect to the source' }),
      view('13:26', 'River crossing', 'A note from the trail.', { label: 'Text edit', sub: 'Keep the edited title' }),
      view('13:39', 'Trail map', 'A note from the trail.', { radius: 4, label: 'Sharper corners', sub: 'Keep the new corner radius' }),
      view('13:52', 'Trail map', 'A note from the trail.', { w: 208, label: 'Narrower card', sub: 'Keep the adjusted width' }),
    ],
  },
  {
    title: 'Layers, fonts & local components',
    items: [
      view('16:13', 'Trail map', 'A note from the trail.', { badge: 'WAYPOINT', label: 'Added layer', sub: 'Find the extra badge' }),
      view('16:28', 'Trail map', 'A note from the trail.', { serif: true, mono: true, divider: true, note: 'Check the stream level.', label: 'Added layers + fonts', sub: 'Find two extra layers and font edits' }),
      view('16:43', 'Trail map', 'A note from the trail.', { serif: true, mono: true, label: 'Fonts only', sub: 'Compare Lora and IBM Plex Mono' }),
    ],
  },
  {
    title: 'New local components',
    items: [
      view('16:67', 'Field alert', 'Check conditions ahead.', { main: true, serif: true, badge: 'ADVISORY', label: 'Field alert', sub: 'Local main component' }),
      view('16:78', 'Creek alert', 'Check conditions ahead.', { serif: true, badge: 'ADVISORY', label: 'Creek alert', sub: 'Detached from Field alert' }),
      view('16:100', 'Route note', 'Follow the upper trail.', { main: true, serif: true, mono: true, divider: true, note: 'Allow an extra 20 min.', label: 'Route note', sub: 'Local main component' }),
      view('16:111', 'Ridge route note', 'Follow the upper trail.', { serif: true, mono: true, divider: true, note: 'Allow an extra 20 min.', label: 'Ridge route note', sub: 'Detached from Route note' }),
    ],
  },
];
const FN_VIEWS = Object.fromEntries(FN_SECTIONS.flatMap((s) => s.items).map((v) => [v.id, v]));

// --- Previews in the plugin: a drawing of the card standing in for exportAsync (as the original svgThumb does).
function fieldThumb(v) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const w = v.w || 238;
  const extra = v.badge ? 36 : v.divider ? 42 : 0;
  const h = 134 + extra;
  const x = (320 - w) / 2;
  const y = 1;
  const sans = "IBM Plex Sans, Segoe UI, sans-serif";
  const serif = "Georgia, 'Times New Roman', serif";
  const mono = "IBM Plex Mono, Consolas, monospace";
  const t = (px, py, value, size, weight, fill, family) => `<text x="${px}" y="${py}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${v.radius ?? 16}" fill="${v.fill || '#DCD8FE'}"/>`;
  body += `<rect x="${x + 20}" y="${y + 20}" width="77" height="24" rx="5" fill="#FFFFFF"/>` + t(x + 26, y + 36, 'FIELD NOTES', 10, 700, '#514597', sans);
  body += t(x + 20, y + 75, v.title, 19, 700, '#201940', v.serif ? serif : sans);
  body += t(x + 20, y + 104, v.caption, 12, 400, '#514770', v.mono ? mono : sans);
  if (v.badge) body += `<rect x="${x + 20}" y="${y + 121}" width="${8 + v.badge.length * 7}" height="24" rx="5" fill="#FFFFFF"/>` + t(x + 26, y + 137, v.badge, 10, 700, '#514597', sans);
  if (v.divider) body += `<rect x="${x + 20}" y="${y + 123}" width="${w - 40}" height="1" fill="#B9B2E6"/>` + t(x + 20, y + 148, v.note, 11, 400, '#514770', mono);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${h + 2}" viewBox="0 0 320 ${h + 2}"><rect width="320" height="${h + 2}" fill="#F7F6FC"/>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
// Redefines the host's thumbnailsFor (the last declaration in the script wins).
function thumbnailsFor(frameId) {
  const frame = FRAMES.find((f) => f.frameId === frameId);
  const source = frame && SOURCES[frame.sourceKey];
  return { source: source && FN_VIEWS[source.componentId] ? fieldThumb(FN_VIEWS[source.componentId]) : undefined, target: fieldThumb(FN_VIEWS[frameId]) };
}

// --- The canvas panel (in its own scope: names like `status` must not collide with the host script or window)
(() => {
state.selectedIds = [];
const panelEl = document.getElementById('fn-panel');
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const head = el('div', 'fn-head');
head.append(el('h1', 'fn-title', FN_TEXT.title));
const status = el('div', 'fn-status');
const statusText = el('span', 'fn-status-text');
const clearBtn = el('button', 'fn-clear', FN_TEXT.clear);
clearBtn.type = 'button';
status.append(statusText, clearBtn);
head.append(el('p', 'fn-hint', FN_TEXT.hint), status);
panelEl.append(head);

// A card drawn from its view: colour, corners, width, fonts and the layers inside. Also used to redraw a card after a restore.
const paintCard = (card, v) => {
  card.className = 'fn-card' + (v.serif ? ' is-serif' : '') + (v.mono ? ' is-mono' : '');
  card.style.setProperty('--fill', v.fill || '#DCD8FE');
  card.style.setProperty('--r', `${v.radius ?? 16}px`);
  card.style.width = `${v.w || 238}px`;
  card.style.minHeight = `${v.badge ? 170 : v.divider ? 176 : 134}px`;
  const parts = [el('span', 'fn-cat', 'FIELD NOTES'), el('b', 'fn-card-title', v.title), el('span', 'fn-card-cap', v.caption)];
  if (v.badge) parts.push(el('span', 'fn-cat fn-badge', v.badge));
  if (v.divider) parts.push(el('span', 'fn-divider'), el('span', 'fn-note', v.note));
  card.replaceChildren(...parts);
};

const itemEls = new Map();
for (const section of FN_SECTIONS) {
  const sec = el('section', 'fn-section');
  const h = el('h2', 'fn-h2', section.title);
  if (section.tag) h.append(el('span', 'fn-tag', section.tag));
  const grid = el('div', 'fn-grid');
  for (const v of section.items) {
    const item = el('button', 'fn-item');
    item.type = 'button';
    item.dataset.id = v.id;
    item.setAttribute('aria-pressed', 'false');
    item.setAttribute('aria-label', `${v.label}${v.sub ? '. ' + v.sub : ''}. ${FN_TEXT.select}`);
    const card = el('span', 'fn-card');
    paintCard(card, v);
    const sub = el('span', 'fn-sub', v.sub || '');
    item.append(card, el('span', 'fn-label', v.label), sub);
    item._v = v;
    item._card = card;
    item._sub = sub;
    grid.append(item);
    itemEls.set(v.id, item);
  }
  sec.append(h, grid);
  panelEl.append(sec);
}

function renderSelection() {
  for (const [id, item] of itemEls) item.setAttribute('aria-pressed', String(state.selectedIds.includes(id)));
  statusText.textContent = FN_TEXT.selected(state.selectedIds.length);
  clearBtn.hidden = state.selectedIds.length === 0;
}
function setSelected(ids) {
  state.selectedIds = ids;
  renderSelection();
  setSelection(ids.length);
}
panelEl.addEventListener('click', (event) => {
  const item = event.target.closest('.fn-item');
  if (!item) return;
  const id = item.dataset.id;
  // Like Shift+click on the canvas: a card is added to the selection or removed from it
  setSelected(state.selectedIds.includes(id) ? state.selectedIds.filter((x) => x !== id) : [...state.selectedIds, id]);
});
clearBtn.addEventListener('click', () => setSelected([]));
renderSelection();

// ---- Plugin → canvas: what the plugin does is shown on the cards, as it would be in Figma ----
const clearFocus = () => {
  for (const other of itemEls.values()) {
    other.classList.remove('is-focus');
    other.querySelectorAll('.is-layer-focus').forEach((node) => node.classList.remove('is-layer-focus'));
  }
};
// The plugin opens a frame or a layer (focusNode in the host calls this): the card, and the layer in it, are highlighted
// and scrolled into view. A layer path looks like "Card · Alpine lake/Title"; a path of the frame alone points at the card.
let focusTimer;
const LAYER_PARTS = { Title: '.fn-card-title', Caption: '.fn-card-cap', 'Extra badge': '.fn-badge', 'Extra divider': '.fn-divider', 'Extra note': '.fn-note' };
window.__canvasFocus = (nodeId) => {
  const [id, layerPath] = String(nodeId).split('#');
  const item = itemEls.get(id);
  if (!item) return false;
  clearFocus();
  item.classList.add('is-focus');
  const layer = layerPath && layerPath.includes('/') ? layerPath.split('/').pop() : '';
  const part = layer && LAYER_PARTS[layer] ? item._card.querySelector(LAYER_PARTS[layer]) : null;
  if (part) part.classList.add('is-layer-focus');
  clearTimeout(focusTimer);
  focusTimer = setTimeout(clearFocus, 2600);
  const box = item.getBoundingClientRect();
  const area = panelEl.getBoundingClientRect();
  if (box.top < area.top || box.bottom > area.bottom) panelEl.scrollTo({ top: panelEl.scrollTop + box.top - area.top - 72, behavior: 'smooth' });
  return true;
};

// Restoring replaces a detached frame with an instance (the original stays hidden next to it); undo brings the frame back;
// binding the fill returns the card's colour to the component's variable. The canvas follows the plugin's answers.
const SURFACE = '#DCD8FE';
const fn = { instances: new Set(), bound: new Set() };
// What a restored card looks like: an instance of its source component. The look (colour, corners, width, fonts, layers) comes
// from the source; only the text edits the plugin carries over (the changes of kind «text-content») stay as they were.
const instanceLook = (id, own) => {
  const frameInfo = FRAMES.find((f) => f.frameId === id);
  const source = frameInfo && SOURCES[frameInfo.sourceKey];
  const base = source && FN_VIEWS[source.componentId];
  if (!base) return own;
  const edited = (layer) => ((COMPARISONS[id] && COMPARISONS[id].changes) || []).some((c) => c.kind === 'text-content' && c.path.endsWith('/' + layer));
  return { ...base, title: edited('Title') ? own.title : base.title, caption: edited('Caption') ? own.caption : base.caption };
};
const renderItem = (id) => {
  const item = itemEls.get(id);
  if (!item) return;
  const instance = fn.instances.has(id);
  item.classList.toggle('is-instance', instance);
  paintCard(item._card, instance ? instanceLook(id, item._v) : item._v);
  if (fn.bound.has(id)) item._card.style.setProperty('--fill', SURFACE);
  item._sub.textContent = instance ? FN_TEXT.restored : item._v.sub || '';
};
const setScanning = (on, scope) => {
  const ids = on ? (scope === 'selection' ? state.selectedIds : FRAMES.map((f) => f.frameId)) : [];
  for (const [id, item] of itemEls) item.classList.toggle('is-scanning', ids.includes(id));
};
// The host answers the plugin through post(): its messages are watched here, the work stays in the host.
const hostPost = post;
const embedParams = new URLSearchParams(location.search);
const reportAction = action => {
  if (parent === window || !embedParams.has('fit') || embedParams.has('demo')) return;
  parent.postMessage({ type: 're-instance-analytics', action }, location.origin);
};
post = (message) => {
  const done = (list, fnItem) => (list || []).forEach(fnItem);
  if (message.type === 'RESTORE_DONE') done(message.outcomes, (o) => { if (o.status === 'restored') { fn.instances.add(o.frameId); renderItem(o.frameId); } });
  else if (message.type === 'RESTORE_UNDONE') done(message.frameIds, (id) => { fn.instances.delete(id); renderItem(id); });
  else if (message.type === 'REBIND_DONE') done(message.outcomes, (o) => { if (o.status === 'bound' && o.frameId) { fn.bound.add(o.frameId); renderItem(o.frameId); } });
  else if (message.type === 'SCAN_RESULT' || message.type === 'SCAN_CANCELLED') setScanning(false);
  if (message.type === 'FRAME_COMPARISON' && message.comparison) reportAction('compare');
  if (message.type === 'RESTORE_DONE' && message.outcomes?.some(outcome => outcome.status === 'restored')) reportAction('restore');
  if (message.type === 'REBIND_DONE' && message.outcomes?.some(outcome => outcome.status === 'bound' && outcome.field === 'fills')) reportAction('bind_color');
  return hostPost(message);
};
// ...and what the plugin is asked to do: a search lights up the cards it goes through.
window.addEventListener('message', (event) => {
  const message = event.data && event.data.pluginMessage;
  if (event.source !== frame.contentWindow || message?.type !== 'SCAN') return;
  setScanning(true, message.scope);
  reportAction('scan');
});

// The cards fill the width of the canvas: as many columns as fit (at least two), each card scaled to its column
// (a card is drawn 238 px wide and shrunk with `zoom`, never enlarged beyond that)
const fitCards = () => {
  const inner = panelEl.clientWidth - 32;
  if (inner <= 0) return;
  const gap = 10;
  const cols = Math.max(2, Math.floor((inner + gap) / (150 + gap)));
  const col = (inner - gap * (cols - 1)) / cols;
  panelEl.style.setProperty('--fn-cols', String(cols));
  panelEl.style.setProperty('--fn-zoom', Math.min(col / 238, 1).toFixed(3));
};
new ResizeObserver(fitCards).observe(panelEl);
fitCards();

// ?fit — the standalone page: the playground fills the whole frame (see embed.css)
if (new URLSearchParams(location.search).has('fit')) document.documentElement.classList.add('is-fit');

// ?demo — the state shown on the teaser picture (tools/playground-shot.js): a search is done, the Card group is open and
// «Alpine lake» is compared, with its card marked on the canvas
if (new URLSearchParams(location.search).has('demo')) {
  const click = (re) => {
    const doc = document.getElementById('frame').contentDocument;
    const button = doc && [...doc.querySelectorAll('button, [role=button], a')].find((b) => re.test(b.textContent.trim()));
    if (button) button.click();
    return !!button;
  };
  const step = (re, delay, next) => {
    const timer = setInterval(() => { if (click(re)) { clearInterval(timer); setTimeout(next, delay); } }, 200);
  };
  step(/^(Start search|Начать поиск)$/, 3500, () => step(/^Card\s*3\s*(frames|фрейм)/, 700, () => step(/Alpine lake/, 1500, () => {
    clearFocus();
    itemEls.get('1:25').classList.add('is-demo');
  })));
}

// The embedding page sets the height of the iframe from this message.
const layoutEl = document.querySelector('.layout');
const reportHeight = () => parent !== window && parent.postMessage({ type: 're-instance-playground', height: Math.ceil(layoutEl.getBoundingClientRect().height) }, '*');
new ResizeObserver(reportHeight).observe(layoutEl);
window.addEventListener('load', reportHeight);
})();
