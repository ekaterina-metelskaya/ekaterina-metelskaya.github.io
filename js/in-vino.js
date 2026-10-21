(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Radiogroups built on .ap-seg: click and arrow keys
  const radio = (group, onChange) => {
    const items = $$('[role="radio"]', group);
    const pick = b => {
      items.forEach(x => { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      onChange(b.dataset.v);
    };
    items.forEach(b => { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; });
    group.addEventListener('click', e => { const b = e.target.closest('[role="radio"]'); if (b) pick(b); });
    group.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const b = items[(i + d + items.length) % items.length];
      b.focus(); pick(b);
    });
  };

  /* =========================================================
     Library scale: one line of totals under «Архитектура компонентов»
     (snapshot of the Figma library: name, variants, slot properties)
     ========================================================= */
  const MODULES = [
    ['04', 'Icons', [['Icon', 72]]],
    ['05', 'Buttons', [['Button', 390]]],
    ['06', 'Inputs', [['Input Field', 108], ['Field Caption', 5]]],
    ['07', 'Selection Controls', [['Checkbox', 45], ['Radio', 30], ['Switch', 24], ['Segment', 24], ['Segmented Control', 9, ['Segments']], ['Chip', 16]]],
    ['08', 'Select & Pickers', [['Select', 6], ['Combobox', 9], ['Multiselect', 6], ['Date Picker', 4], ['Calendar', 2]]],
    ['09', 'Navigation', [['App Bar', 12, ['Actions']], ['Sidebar', 2, ['Items']], ['Navigation Bar', 3, ['Items']], ['Drawer', 2, ['Items']], ['Bottom Navigation', 3, ['Items']], ['Navigation Rail', 2, ['Items']], ['Toolbar', 4, ['Actions']], ['Nav Item', 8]]],
    ['10', 'Tabs & Paging', [['Tab', 48], ['Tabs', 8, ['Tabs']], ['Breadcrumb Item', 6], ['Breadcrumbs', 4, ['Items']], ['Pagination Item', 17], ['Pagination', 1, ['Pages']], ['TOC Item', 24], ['Table of Contents', 8]]],
    ['11', 'Menus & Commands', [['Menu Item', 9], ['Menu', 7, ['Items']], ['Command Palette', 2]]],
    ['12', 'Tables & Property Panel', [['Property Row', 15], ['Property Section', 2, ['Rows']], ['Property Panel', 2, ['Sections']], ['Table Status', 5], ['Table Progress', 5], ['Table Header Cell', 3], ['Table Cell', 9], ['Table Row', 12, ['Cells']], ['Table Group', 2], ['Table Footer', 1], ['Data Table', 3, ['Header', 'Body']]]],
    ['13', 'Cards & Disclosure', [['Card', 18, ['Header', 'Content', 'Footer']], ['Statistic Card', 3, ['Context']], ['Summary Card', 4, ['Content', 'Footer']], ['Document Card', 4, ['Details', 'Actions']], ['Interactive List Card', 4, ['Content', 'Metadata', 'Actions']], ['Research Card', 4, ['Tags', 'Content', 'Footer']], ['Information Card', 2, ['Content', 'Footer']], ['Project Card', 6, ['Media', 'Content']], ['Media Card', 4, ['Media', 'Tags', 'Content', 'Avatar', 'Actions']], ['Collapsible', 16, ['Content']], ['Accordion', 2, ['Items']], ['Universal Card', 4, ['Content']], ['Task Card', 20, ['Content', 'Avatar', 'Actions']]]],
    ['14', 'Data Display', [['Tree Item', 12], ['Tree', 1, ['Items']], ['List Item', 4], ['List', 1, ['Items']], ['Data List', 1, ['Items']], ['Data List Item', 2], ['Timeline Bar', 14], ['Timeline', 1], ['Chart Legend Item', 8], ['Sparkline', 6], ['Bar Chart', 2], ['Line Chart', 4], ['KPI Card', 6]]],
    ['15', 'Status & Tags', [['Status Label', 54], ['Status Inline', 12], ['Tag', 48], ['Priority Indicator', 10], ['Presence Status', 20], ['Notification Badge', 12]]],
    ['16', 'Avatars', [['Avatar', 72, ['Image']], ['Avatar Initials', 48], ['Avatar Overflow', 3], ['Avatar Group', 3, ['Items']], ['Avatar with Presence', 24, ['Avatar']], ['Avatar with Notification', 10, ['Avatar']]]],
    ['17', 'Image & Carousel', [['Image Placeholder', 3], ['Image', 16, ['Image']], ['Media Caption', 4], ['Image Thumbnail', 10, ['Image']], ['Carousel Dot', 8], ['Carousel Pagination', 3, ['Items']], ['Carousel Slide', 3, ['Media', 'Caption']], ['Carousel', 12, ['Items', 'Pagination']]]],
    ['18', 'Feedback', [['Alert', 4], ['Toast', 4], ['Empty State', 2], ['Skeleton', 9], ['Spinner', 10], ['Snackbar', 6], ['Notification', 4], ['Notification Center', 1, ['Items']], ['Progress Bar', 48], ['Circular Progress', 48]]],
    ['19', 'Overlays', [['Popover', 8], ['Dialog', 6], ['Alert Dialog', 4], ['Sheet', 12, ['Body']], ['Hover Card', 2], ['Tooltip', 8], ['Backdrop', 3]]],
    ['20', 'Content & Utilities', [['Link', 10], ['Inline Code', 1], ['Code Block', 1], ['Quote', 2], ['Kbd', 2], ['Divider', 6], ['Scroll Area', 4, ['Content']]]],
  ];
  const all = MODULES.flatMap(m => m[2]);
  const nf = n => n.toLocaleString('ru-RU');
  $('[data-inv-stats]').innerHTML = [
    [all.length, 'компонентов'],
    [all.reduce((s, c) => s + c[1], 0), 'вариантов'],
    [1930, 'переменных'], // sum of the nine collections in Figma Variables
  ].map(([n, l]) => `<div><dt>${l}</dt><dd>${nf(n)}</dd></div>`).join('');

  /* ---------- FIG. 8 — interface palette, values from .Primitives (Figma) ---------- */
  const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const RAMPS = [
    ['Neutral · Stone', 'fafaf9 f5f5f4 e7e5e4 d6d3d1 a6a09d 7e7772 57534e 44403c 292524 1c1917 0c0a09'],
    ['Identity · Vino', 'fdf2f2 fce5e7 f9cfd3 f5a9b1 f47f90 eb5773 d33a5d ad2849 91233d 7d1f34 450c19'],
    ['Primary · Violet', 'f5f3ff ede9fe ddd6fe c4b5fd a88cfb 9062fd 7c3aed 6d28d9 5b21b6 4c1d95 2e1065', 600],
    ['Accent · Lime', 'f7fee7 ecfccb d9f99d bef264 8aca00 68a400 4f8200 406a00 345700 2c4906 1a2e05'],
    ['Success · Green', 'f0fdf4 dcfce7 bbf7d0 86efac 32cc70 00a94b 008739 006e30 025a2a 094b26 052e16'],
    ['Warning · Orange', 'fff7ed ffedd5 fed7aa fdba74 f78e37 e76700 cc4900 ac3500 8f2a03 76270b 431407'],
    ['Error · Red', 'fef2f2 fee2e2 fecaca fca5a5 fe7776 f54a49 dc2626 b91c1c 991b1b 7f1d1d 450a0a'],
    ['Info · Blue', 'eff6ff dbeafe bfdbfe 93c5fd 5fa4f9 3c83f7 2563eb 1d4ed8 1e40af 1e3a8a 172554'],
  ];
  $('[data-iv-ramps]').innerHTML = RAMPS.map(([name, hexes, key]) => `<div class="iv-ramp-row${key ? ' is-primary' : ''}"><p class="t-label-mono">${name}</p><ol class="iv-ramp">${hexes.split(' ').map((h, i) => `<li${STEPS[i] === key ? ' class="is-key"' : ''} style="--c:#${h}" title="${name.split(' · ')[1].toLowerCase()}-${STEPS[i]} #${h}"><span></span><b>${STEPS[i]}</b></li>`).join('')}</ol></div>`).join('');
  radio($('[data-iv-surface]'), v => { $('[data-iv-palette]').dataset.surface = v; });

  /* ---------- FIG. 9 — the 17 text styles (size / line height, weight, letter spacing) ---------- */
  const TYPE = [
    ['Display XL', 64, 72, 600, -1], ['Display LG', 48, 56, 600, -1], ['Display MD', 36, 44, 600, -.5],
    ['Heading LG', 28, 36, 600, -.5], ['Heading MD', 24, 32, 600, 0], ['Heading SM', 20, 28, 600, 0],
    ['Title', 16, 24, 600, 0], ['Subtitle', 16, 24, 500, 0], ['Body LG', 16, 24, 400, 0], ['Body', 14, 20, 400, 0], ['Body SM', 12, 16, 400, 0],
    ['Caption', 11, 14, 400, .5, 'upper'], ['Overline', 14, 20, 500, .5, 'upper'], ['Label', 12, 16, 500, .5], ['Label Italic', 12, 16, 500, .5, 'italic'],
    ['Code', 14, 20, 400, 0, 'mono'], ['Code SM', 10, 16, 400, 0, 'mono'],
  ];
  const WEIGHT = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold' };
  $('[data-iv-type]').innerHTML = `<ol class="iv-types">${TYPE.map(([name, size, lh, w, ls, kind]) => {
    const style = `font:${kind === 'italic' ? 'italic ' : ''}${w} ${size}px/${lh}px ${kind === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'};letter-spacing:${ls}px${kind === 'upper' ? ';text-transform:uppercase' : ''}`;
    return `<li><b>${name}</b><span class="iv-type-sample" style="${style}">In vino veritas</span><code>${size}/${lh} · ${WEIGHT[w]}${kind === 'italic' ? ' Italic' : ''}${ls ? ` · ${ls}` : ''}</code></li>`;
  }).join('')}</ol>`;

  /* =========================================================
     FIG. 1 — Token playground: four mode axes + inspector
     ========================================================= */
  const pg = $('[data-pg]');
  const chainEl = $('[data-pg-chain]');
  const readout = $('[data-pg-readout]');
  const mode = { theme: 'light', expr: 'neutral', density: 'default', motion: 'standard' };
  const L = () => mode.theme === 'light';
  const DENS = { compact: [16, 12, 36, 12], default: [24, 16, 40, 16], comfortable: [32, 20, 44, 20] }; // card padding, card gap, control md height, padding-x
  const EXPR = {
    neutral: { ring: ['color/border/focus', 'color/violet/600', '#7c3aed'], accent: ['color/interactive/primary/text', L() ? 'color/violet/700' : 'color/violet/400', L() ? '#6d28d9' : '#a88cfb'], font: 'IBM Plex Sans', radius: 999, spec: false, snack: () => L() ? ['color/surface/elevated', 'color/base/white', '#ffffff'] : ['color/surface/elevated', 'color/stone/800', '#292524'] },
    vino: { ring: ['color/border/focus', 'color/violet/600', '#7c3aed'], accent: ['color/brand/accent', 'color/vino/600', '#d33a5d'], font: 'IBM Plex Mono', radius: 999, spec: true, snack: () => ['color/vino/800', '#91233d'] },
    signature: { ring: ['color/brand/accent', 'color/vino/600', '#d33a5d'], accent: ['color/brand/accent', 'color/vino/600', '#d33a5d'], font: 'IBM Plex Mono', radius: 2, spec: true, snack: () => ['color/vino/700', '#ad2849'] },
  };
  const ex = () => {
    const e = EXPR[mode.expr];
    if (mode.expr === 'neutral') e.accent = ['color/interactive/primary/text', L() ? 'color/violet/700' : 'color/violet/400', L() ? '#6d28d9' : '#a88cfb'];
    return e;
  };
  // Each inspectable element: component token → … → raw value, resolved for the current modes
  const CHAINS = {
    'card/bg': () => ['card/bg', 'color/background/canvas', L() ? 'color/base/white' : 'color/stone/950', L() ? '#ffffff' : '#0c0a09'],
    'card/text': () => ['card/text', 'color/text/primary', L() ? 'color/stone/900' : 'color/stone/50', L() ? '#1c1917' : '#fafaf9'],
    'card/text-secondary': () => ['card/text-secondary', 'color/text/secondary', L() ? 'color/stone/800' : 'color/stone/300', L() ? '#292524' : '#d6d3d1'],
    'button/primary/bg': () => ['button/primary/bg', 'color/interactive/primary/bg', 'color/violet/600', '#7c3aed'],
    'button/secondary/border': () => ['button/secondary/border', 'color/border/default', L() ? 'color/stone/200' : 'color/stone/800', L() ? '#e7e5e4' : '#292524'],
    tag: () => ['tag/brand/fg', 'expression/accent-text', ...ex().accent],
    meta: () => ['card/meta', 'expression/meta-font', ex().font],
    'snackbar/bg': () => ['snackbar/bg', 'expression/snackbar-surface', ...ex().snack()],
    focus: () => ['button/focus-ring', 'expression/focus-ring', ...ex().ring],
    'card/padding': () => ['card/padding', 'density/card/padding', `shape/spacing/${DENS[mode.density][0]}`, `${DENS[mode.density][0]}px`],
  };
  const LABELS = { 'card/bg': 'Фон карточки', 'card/text': 'Заголовок', 'card/text-secondary': 'Описание', 'button/primary/bg': 'Основная кнопка', 'button/secondary/border': 'Вторичная кнопка', tag: 'Тег статуса', meta: 'Метаданные', 'snackbar/bg': 'Снекбар', focus: 'Кольцо фокуса', 'card/padding': 'Отступ карточки' };
  let inspected = 'button/primary/bg';
  const showChain = key => {
    inspected = key;
    const c = CHAINS[key]();
    chainEl.innerHTML = `<li class="pg-chain-head">${LABELS[key]}</li>` + c.map((t, i) => {
      const last = i === c.length - 1;
      const layer = last ? 'значение' : i === 0 ? 'компонент' : t.startsWith('color/') && /\/(\d{2,3}|white|black)$/.test(t) || t.startsWith('shape/') ? 'примитив' : 'семантика';
      const sw = last && t.startsWith('#') ? `<i class="pg-sw" style="background:${t}"></i>` : '';
      return `<li><span class="pg-layer">${layer}</span><code>${sw}<span>${esc(t).replaceAll('/', '/<wbr>')}</span></code></li>`;
    }).join('');
    $$('[data-token]', pg).forEach(el => el.classList.toggle('is-inspected', el.dataset.token === key));
  };
  const apply = () => {
    Object.entries(mode).forEach(([k, v]) => { pg.dataset[k] = v; });
    const e = ex(), d = DENS[mode.density];
    const s = pg.style;
    s.setProperty('--pg-ring', e.ring.at(-1));
    s.setProperty('--pg-accent', e.accent.at(-1));
    s.setProperty('--pg-meta-font', e.font === 'IBM Plex Mono' ? 'var(--font-mono)' : 'var(--font-sans)');
    s.setProperty('--pg-tag-radius', `${e.radius}px`);
    s.setProperty('--pg-snack', e.snack().at(-1));
    s.setProperty('--pg-pad', `${d[0]}px`);
    s.setProperty('--pg-gap', `${d[1]}px`);
    s.setProperty('--pg-ctl-h', `${d[2]}px`);
    s.setProperty('--pg-ctl-px', `${d[3]}px`);
    s.setProperty('--pg-dur', mode.motion === 'reduced' || reduceMotion ? '0ms' : '200ms');
    pg.classList.toggle('has-spec', e.spec);
    readout.innerHTML = [
      ['density/card/padding', `${d[0]}`],
      ['density/control/md/height', `${d[2]}`],
      ['duration/normal', mode.motion === 'reduced' ? '0 ms' : '200 ms'],
      ['expression/spec-graphics', String(e.spec)],
    ].map(([k, v]) => `<div><dt><code>${k}</code></dt><dd>${v}</dd></div>`).join('');
    showChain(inspected);
  };
  $$('[data-mode]').forEach(g => radio(g, v => { mode[g.dataset.mode] = v; apply(); }));
  chainEl.setAttribute('aria-live', 'polite');
  $$('[data-token]', pg).forEach(el => {
    // Non-button targets get keyboard access: Tab to focus, Enter/Space act like a click
    if (el.tagName !== 'BUTTON') {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Показать токены: ${LABELS[el.dataset.token]}`);
      el.addEventListener('keydown', e => {
        if (e.target !== el || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        showChain(el.dataset.token);
      });
    }
    el.addEventListener('mouseenter', () => showChain(el.dataset.token));
    el.addEventListener('click', e => { e.stopPropagation(); showChain(el.dataset.token); });
    el.addEventListener('focus', () => showChain(el.dataset.token === 'button/primary/bg' ? 'focus' : el.dataset.token));
  });
  // Padding: hovering the card's edge shows density, the card body shows its background
  $('.pg-card', pg).addEventListener('mousemove', e => {
    if (e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    const p = parseFloat(getComputedStyle(e.currentTarget).paddingLeft);
    const edge = e.clientX - r.left < p || r.right - e.clientX < p || e.clientY - r.top < p || r.bottom - e.clientY < p;
    // mousemove fires every frame: rebuild the chain only when the target changes
    const key = edge ? 'card/padding' : 'card/bg';
    if (key !== inspected) showChain(key);
  });
  apply();

  /* =========================================================
     FIG. 2 — Card slots: insert blocks, keep them across states
     ========================================================= */
  const slotsRoot = $('[data-slots]');
  const card = $('[data-sl-card]');
  const BLOCKS = {
    title: { label: 'Заголовок', html: () => '<p class="slb-title">Исследование онбординга</p>' },
    text: { label: 'Текст', html: () => '<p class="slb-text">Пять интервью: пользователи пропускают обучение и ищут функции в контексте.</p>' },
    tags: { label: 'Теги', html: () => '<div class="slb-tags"><span>Интервью</span><span class="is-brand">Инсайт</span><span>B2B</span></div>' },
    stat: { label: 'Метрика', html: () => '<div class="slb-stat"><b>5</b><span>интервью · 3 инсайта</span></div>' },
    avatars: { label: 'Аватары', html: () => `<div class="slb-avatars">${['ЕМ', 'АК', 'ДС'].map((x, i) => `<span class="t${i}">${x}</span>`).join('')}<span class="more">+2</span></div>` },
    image: { label: 'Изображение', html: () => '<div class="slb-image"><i></i><i></i><i></i></div>' },
    progress: { label: 'Прогресс', html: () => '<div class="slb-progress"><span><i style="width:64%"></i></span><em>64%</em></div>' },
    actions: { label: 'Действия', html: () => '<div class="slb-actions"><span class="p">Открыть</span><span>Поделиться</span></div>' },
  };
  const slotState = { header: ['tags'], content: ['title', 'text'], footer: ['avatars', 'actions'] };
  let target = 'content';
  $('[data-sl-palette]').innerHTML = Object.entries(BLOCKS).map(([k, b]) => `<button type="button" class="sl-add" data-add="${k}">+ ${b.label}</button>`).join('');
  const renderSlots = () => {
    Object.entries(slotState).forEach(([slot, items]) => {
      const box = $(`[data-slot="${slot}"] .sl-items`, card);
      box.innerHTML = items.map((k, i) => `<div class="sl-block" data-i="${i}">${BLOCKS[k].html()}<button type="button" class="sl-remove" aria-label="Убрать «${BLOCKS[k].label}» из ${slot}">×</button></div>`).join('') || '<p class="sl-empty">Пустой слот</p>';
    });
    $$('.sl-slot', card).forEach(s => s.classList.toggle('is-target', s.dataset.slot === target));
    const n = Object.values(slotState).flat().length;
    $('[data-sl-readout]').innerHTML = `Card · Surface=${cap(card.dataset.surface)} · State=${cap(card.dataset.state)}<br>в слотах: ${n} ${n === 1 ? 'блок' : n > 1 && n < 5 ? 'блока' : 'блоков'} · вариантов в библиотеке: 18 · отсоединено инстансов: <b>0</b>`;
  };
  const cap = s => s[0].toUpperCase() + s.slice(1);
  // A slot being edited is always shown: picking or filling a hidden one turns its Show toggle on
  const showSlot = slot => {
    const c = $(`[data-sl-show="${slot}"]`);
    if (c && !c.checked) { c.checked = true; $(`[data-slot="${slot}"]`, card).hidden = false; }
  };
  radio($('[data-sl-target]'), v => { target = v; showSlot(v); renderSlots(); });
  $('[data-sl-palette]').addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    showSlot(target);
    slotState[target].push(b.dataset.add);
    renderSlots();
    const added = $(`[data-slot="${target}"] .sl-block:last-child`, card);
    if (added && !reduceMotion) added.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
  });
  card.addEventListener('click', e => {
    const rm = e.target.closest('.sl-remove');
    if (rm) { const slot = rm.closest('[data-slot]').dataset.slot; slotState[slot].splice(+rm.closest('.sl-block').dataset.i, 1); renderSlots(); return; }
    const slot = e.target.closest('[data-slot]');
    if (slot) { target = slot.dataset.slot; $$('[data-sl-target] [role="radio"]').forEach(x => { x.setAttribute('aria-checked', String(x.dataset.v === target)); x.tabIndex = x.dataset.v === target ? 0 : -1; }); renderSlots(); }
  });
  $$('[data-sl-show]').forEach(c => c.addEventListener('change', () => { $(`[data-slot="${c.dataset.slShow}"]`, card).hidden = !c.checked; }));
  radio($('[data-sl-surface]'), v => { card.dataset.surface = v; renderSlots(); });
  radio($('[data-sl-state]'), v => { card.dataset.state = v; renderSlots(); });
  renderSlots();

  /* =========================================================
     FIG. 3 — Data Table: swap a cell's content through its slot,
     the composition tree follows the selected cell
     ========================================================= */
  const dtTable = $('[data-dt-table]');
  const DT_COLS = ['Задача', 'Статус', 'Прогресс', 'Исполнитель'];
  const DT_ROWS = [
    { task: 'Вход через SSO', st: ['review', 'На ревью'], p: 64, who: ['ЕМ', 'Екатерина М.', 't0'], tags: ['Auth', 'B2B'] },
    { task: 'Экспорт отчёта', st: ['done', 'Готово'], p: 100, who: ['АК', 'Анна К.', 't1'], tags: ['Отчёты'] },
    { task: 'Фильтры таблицы', st: ['progress', 'В работе'], p: 38, who: ['ДС', 'Денис С.', 't2'], tags: ['UI', 'Таблицы'] },
    { task: 'Импорт из CSV', st: ['blocked', 'Блокер'], p: 12, who: ['ОЛ', 'Ольга Л.', 't3'], tags: ['Данные'] },
  ];
  // comp: the library component that sits in the cell's Content slot
  const DT_BLOCKS = {
    text: { label: 'Текст', comp: 'Text', html: r => `<span class="dtb-text">${esc(r.task)}</span>` },
    status: { label: 'Статус', comp: 'Table Status', html: r => `<span class="dtb-status is-${r.st[0]}">${r.st[1]}</span>` },
    progress: { label: 'Прогресс', comp: 'Table Progress', html: r => `<span class="dtb-progress"><span><i style="width:${r.p}%"></i></span><em>${r.p}%</em></span>` },
    avatar: { label: 'Аватар', comp: 'Avatar', html: r => `<span class="dtb-person"><span class="dtb-av ${r.who[2]}">${r.who[0]}</span>${r.who[1]}</span>` },
    tags: { label: 'Теги', comp: 'Tag', html: r => `<span class="dtb-tags">${r.tags.map(t => `<span>${t}</span>`).join('')}</span>` },
    actions: { label: 'Действия', comp: 'Button', html: () => '<span class="dtb-actions"><span class="p">Открыть</span><span aria-hidden="true">⋯</span></span>' },
  };
  const DT_DEFAULT = ['text', 'status', 'progress', 'avatar'];
  const dtCells = DT_ROWS.map(() => [...DT_DEFAULT]);
  const cellVariants = all.find(c => c[0] === 'Table Cell')[1];
  let dtSel = [0, 1];
  const dtColMode = $('[data-dt-col]');
  $('[data-dt-palette]').innerHTML = Object.entries(DT_BLOCKS).map(([k, b]) => `<button type="button" class="sl-add" data-dt-add="${k}" aria-pressed="false">${b.label}</button>`).join('');
  const renderDt = changed => {
    const [sr, sc] = dtSel;
    const refocus = dtTable.contains(document.activeElement);
    dtTable.innerHTML = `<thead><tr>${DT_COLS.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${DT_ROWS.map((row, r) => `<tr>${dtCells[r].map((k, c) => {
      const on = r === sr && c === sc;
      return `<td><button type="button" class="dt-cell${on ? ' is-selected' : ''}" data-r="${r}" data-c="${c}" tabindex="${on ? 0 : -1}" aria-pressed="${on}" aria-label="Строка ${r + 1}, ${DT_COLS[c]}: ${DT_BLOCKS[k].label}">${DT_BLOCKS[k].html(row)}</button></td>`;
    }).join('')}</tr>`).join('')}</tbody>`;
    const key = dtCells[sr][sc];
    $('[data-dt-picked]').textContent = `Строка ${sr + 1} · ${DT_COLS[sc]} → ${DT_BLOCKS[key].comp}`;
    $$('[data-dt-add]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dtAdd === key)));
    $('[data-dt-tree]').innerHTML = [
      [1, 'Data Table', 'слот Body'],
      [2, `Table Row ${sr + 1}`, 'слот Cells'],
      [3, 'Table Cell', `слот Content · ${cellVariants} вариантов`],
    ].map(([n, name, slot]) => `<li style="--lvl:${n - 1}"><b>${n}</b>${name}<span>${slot}</span></li>`).join('')
      + `<li class="leaf" style="--lvl:3"><b>↳</b>${DT_BLOCKS[key].comp}<span>вложенный экземпляр</span></li>`;
    const swapped = dtCells.flat().filter((k, i) => k !== DT_DEFAULT[i % DT_COLS.length]).length;
    $('[data-dt-readout]').innerHTML = `Data Table · ${DT_ROWS.length} строки × ${DT_COLS.length} колонки<br>заменено ячеек: ${swapped} · отсоединено инстансов: <b>0</b>`;
    if (refocus) $(`.dt-cell[data-r="${sr}"][data-c="${sc}"]`, dtTable).focus();
    if (changed && !reduceMotion) changed.forEach(([r, c]) => $(`.dt-cell[data-r="${r}"][data-c="${c}"]`, dtTable).animate([{ opacity: 0, transform: 'translateY(-3px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' }));
  };
  dtTable.addEventListener('click', e => {
    const cell = e.target.closest('.dt-cell');
    if (cell) { dtSel = [+cell.dataset.r, +cell.dataset.c]; renderDt(); }
  });
  // Arrow keys move between cells (one tab stop for the whole table)
  dtTable.addEventListener('keydown', e => {
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!d || !e.target.closest('.dt-cell')) return;
    e.preventDefault();
    dtSel = [Math.min(DT_ROWS.length - 1, Math.max(0, dtSel[0] + d[0])), Math.min(DT_COLS.length - 1, Math.max(0, dtSel[1] + d[1]))];
    renderDt();
  });
  $('[data-dt-palette]').addEventListener('click', e => {
    const b = e.target.closest('[data-dt-add]');
    if (!b) return;
    const [sr, sc] = dtSel;
    const targets = dtColMode.checked ? DT_ROWS.map((_, r) => [r, sc]) : [[sr, sc]];
    targets.forEach(([r, c]) => { dtCells[r][c] = b.dataset.dtAdd; });
    renderDt(targets);
  });
  renderDt();

  /* ---------- FIG. 4 — Avatar Group: Items slot + overflow ---------- */
  const ag = { n: 6, size: 32, overflow: true };
  const TONES = ['#7c3aed', '#d33a5d', '#0e7490', '#a16207', '#15803d', '#57534e'];
  const NAMES = ['ЕМ', 'АК', 'ДС', 'ОЛ', 'ИВ', 'МР', 'ТН', 'ГБ', 'ЮП', 'СЖ', 'НА', 'ВЕ'];
  const agGroup = $('[data-ag-group]');
  const renderAg = () => {
    const visibleMax = ag.size === 24 ? 5 : 4;
    const visible = ag.overflow ? Math.min(ag.n, ag.n > visibleMax ? visibleMax - 1 : visibleMax) : ag.n;
    const rest = ag.n - visible;
    agGroup.style.setProperty('--s', `${ag.size}px`);
    agGroup.innerHTML = NAMES.slice(0, visible).map((x, i) => `<span class="ag-av" style="background:${TONES[i % TONES.length]}" title="${x}">${ag.size === 40 ? x : x[0]}</span>`).join('')
      + (ag.overflow && rest > 0 ? `<span class="ag-av ag-more" aria-label="Ещё ${rest}">+${rest}</span>` : '');
    $('[data-ag-out]').textContent = ag.n;
    $('[data-ag-note]').textContent = ag.overflow && rest > 0
      ? `Видно ${visible}, в «+${rest}» — остальные: total − visible = ${ag.n} − ${visible}`
      : ag.overflow ? 'Все участники помещаются — счётчик скрыт' : 'Show overflow выключен: в слоте все аватары';
  };
  $$('[data-ag-step]').forEach(b => b.addEventListener('click', () => { ag.n = Math.min(12, Math.max(1, ag.n + +b.dataset.agStep)); renderAg(); }));
  radio($('[data-ag-size]'), v => { ag.size = +v; renderAg(); });
  $('[data-ag-overflow]').addEventListener('change', e => { ag.overflow = e.target.checked; renderAg(); });
  renderAg();

  /* =========================================================
     FIG. 5 — Button properties panel
     ========================================================= */
  const BP = {
    Label: { type: 'text', value: 'Сохранить' },
    'Leading icon': { type: 'bool', value: true },
    'Trailing icon': { type: 'bool', value: false },
    Variant: { type: 'variant', value: 'Primary', options: ['Primary', 'Secondary', 'Outline', 'Ghost', 'Danger', 'Success', 'Link'] },
    Size: { type: 'variant', value: 'MD', options: ['XS', 'SM', 'MD', 'LG', 'XL'] },
    State: { type: 'variant', value: 'Default', options: ['Default', 'Hover', 'Pressed', 'Focus', 'Disabled', 'Loading'] },
    Content: { type: 'variant', value: 'Label', options: ['Label', 'Icon only'] },
  };
  const panel = $('[data-bp-panel]');
  const icon = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>';
  const arrow = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.33 8h9.34M8.67 4l4 4-4 4"/></svg>';
  panel.innerHTML = '<p class="bp-head"><span>◇ Button</span><em>Instance</em></p>' + Object.entries(BP).map(([k, p]) => {
    const id = `bp-${k.replace(/\s/g, '-').toLowerCase()}`;
    if (p.type === 'text') return `<label class="bp-row" for="${id}"><span>${k}</span><input id="${id}" data-bp="${k}" value="${esc(p.value)}" maxlength="24"></label>`;
    if (p.type === 'bool') return `<label class="bp-row" for="${id}"><span>${k}</span><input type="checkbox" class="bp-switch" id="${id}" data-bp="${k}"${p.value ? ' checked' : ''}></label>`;
    return `<label class="bp-row" for="${id}"><span>${k}</span><select id="${id}" data-bp="${k}">${p.options.map(o => `<option${o === p.value ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;
  }).join('');
  const renderBtn = () => {
    const v = k => BP[k].value;
    const only = v('Content') === 'Icon only';
    const cls = ['bp-btn', `v-${v('Variant').toLowerCase()}`, `s-${v('Size').toLowerCase()}`, `st-${v('State').toLowerCase()}`, only && 'is-icon'].filter(Boolean).join(' ');
    const loading = v('State') === 'Loading';
    const inner = loading ? '<span class="bp-spin" aria-hidden="true"></span>' + (only ? '' : `<span>${esc(v('Label'))}</span>`)
      : (v('Leading icon') || only ? icon : '') + (only ? '' : `<span>${esc(v('Label') || 'Button')}</span>`) + (v('Trailing icon') && !only ? arrow : '');
    $('[data-bp-preview]').innerHTML = `<button type="button" class="${cls}"${v('State') === 'Disabled' ? ' disabled' : ''} aria-label="${esc(v('Label'))}">${inner}</button>`;
    $('[data-bp-name]').innerHTML = `Variant=${v('Variant')}, Size=${v('Size')}, State=${v('State')}, Content=${v('Content')}<br>height: button/${v('Size').toLowerCase()}/height → density/control/${v('Size').toLowerCase()}/height`;
  };
  panel.addEventListener('input', e => {
    const k = e.target.dataset.bp;
    if (!k) return;
    BP[k].value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    renderBtn();
  });
  renderBtn();
})();
