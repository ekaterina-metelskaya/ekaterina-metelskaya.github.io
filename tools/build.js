// Собирает сайт: тексты из content/*.md + вёрстка из templates/ → index.html, projects.html, cases/*.html.
// Запуск из корня репозитория: node tools/build.js
// Тексты правятся только в content/, готовые .html в корне и в cases/ перезаписываются при каждой сборке.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), s); };

// ---------- Markdown ----------
// Поддерживается то, что нужно кейсам: абзацы, **жирный**, *курсив*, [ссылки](url), списки, цитаты,
// заголовки ## / ### с атрибутами {#id .class ключ="значение"} и вставка блоков из шаблона строкой [[имя]].
// HTML внутри текста передаётся как есть.

// Шапка файла между --- и ---: «ключ: значение» и списки из строк «  - пункт»
function parseMd(file) {
  const src = read(file).replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  const data = {};
  let list = null;
  for (const line of (m ? m[1] : '').split('\n')) {
    if (!line.trim()) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && list) { list.push(item[1]); continue; }
    const kv = /^([\w.-]+):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`${file}: не понимаю строку шапки «${line}»`);
    data[kv[1]] = kv[2] === '' ? (list = []) : kv[2];
    if (kv[2] !== '') list = null;
  }
  return { data, body: m ? src.slice(m[0].length) : src };
}

const inline = s => String(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

// {#id .class key="value" flag} → { id, class, key, flag: true }
const parseAttrs = s => {
  const a = {}; const cls = [];
  for (const [, id, c, k, v, flag] of (s || '').matchAll(/#([\w-]+)|\.([\w-]+)|([\w-]+)="([^"]*)"|([\w-]+)/g)) {
    if (id) a.id = id; else if (c) cls.push(c); else if (k) a[k] = v; else a[flag] = true;
  }
  if (cls.length) a.class = cls.join(' ');
  return a;
};
const heading = line => {
  const m = /^(#{2,3})\s+(.*?)\s*(?:\{([^}]*)\})?\s*$/.exec(line);
  return m && { level: m[1].length, text: m[2], attrs: parseAttrs(m[3]) };
};

// Текст → дерево: разделы ## с подразделами ###; chunks — абзацы, списки, цитаты, [[блоки]]
function sections(body, file) {
  const out = []; let sec = null; let sub = null;
  for (const chunk of body.split(/\n\s*\n/).map(c => c.trim()).filter(Boolean)) {
    const h = heading(chunk.split('\n')[0]);
    if (h) {
      if (chunk.includes('\n')) throw new Error(`${file}: после заголовка «${h.text}» нужна пустая строка`);
      if (h.level === 2) { sec = { ...h, chunks: [], subs: [] }; sub = null; out.push(sec); }
      else { if (!sec) throw new Error(`${file}: ### до первого ##`); sub = { ...h, chunks: [] }; sec.subs.push(sub); }
      continue;
    }
    if (!sec) throw new Error(`${file}: текст до первого заголовка ##`);
    (sub || sec).chunks.push(chunk);
  }
  return out;
}

// Один кусок текста → HTML. blocks — именованные блоки из шаблона кейса
function chunk(c, blocks, file) {
  const ref = /^\[\[([\w-]+)\]\]$/.exec(c);
  if (ref) {
    if (!(ref[1] in blocks)) throw new Error(`${file}: нет блока [[${ref[1]}]] в шаблоне`);
    return blocks[ref[1]];
  }
  const lines = c.split('\n');
  if (lines.every(l => /^- /.test(l))) return `<ul>\n${lines.map(l => `        <li>${inline(l.slice(2))}</li>`).join('\n')}\n      </ul>`;
  if (lines.every(l => /^\d+\. /.test(l))) return `<ol>\n${lines.map(l => `        <li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('\n')}\n      </ol>`;
  if (lines.every(l => /^>/.test(l))) {
    const ps = lines.map(l => l.replace(/^>\s?/, '')).join('\n').split(/\n\s*\n/).map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean);
    // Цитата, которая начинается с **подписи**, — это врезка «Что вынесла»
    const label = /^\*\*([^*]+)\*\*$/.exec(ps[0]);
    if (label) return `<aside class="insight">\n        <p class="t-label-mono">${label[1]}</p>\n${ps.slice(1).map(p => `        <p>${inline(p)}</p>`).join('\n')}\n      </aside>`;
    return `<blockquote>\n${ps.map(p => `        <p>${inline(p)}</p>`).join('\n')}\n      </blockquote>`;
  }
  return `<p>${inline(lines.join(' '))}</p>`;
}

// Шаблон блоков: <!-- block: имя --> ... до следующего такого комментария
const parseBlocks = file => {
  if (!fs.existsSync(path.join(root, file))) return {};
  const out = {};
  const parts = read(file).split(/<!-- block: ([\w-]+) -->\n?/);
  for (let i = 1; i < parts.length; i += 2) out[parts[i]] = parts[i + 1].trim();
  return out;
};

// {{ключ}} в шаблоне → значение из шапки md. Неизвестный ключ — ошибка, чтобы пустые места не попали на сайт
const fill = (html, vars, file) => html.replace(/\{\{([\w.-]+)\}\}/g, (_, k) => {
  if (!(k in vars)) throw new Error(`${file}: нет значения для {{${k}}}`);
  return vars[k];
});
const textVars = (data, prefix = '') => Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'string').map(([k, v]) => [prefix + k, inline(v)]));

const home = parseMd('content/home.md');
const shared = textVars(home.data, 'home.');

// ---------- Карточки кейсов ----------
const covers = {
  // NDA-кейсы: ключевая иллюстрация кейса (templates/partials/cover-*.html, стили в kv.css) под стеклом NDA
  ...Object.fromEntries(['control', 'planning', 'docs'].map(k => [k, `<div class="cover cover-kv kv-bg kv-${k}"><div class="kv-art" aria-hidden="true">${read(`templates/partials/cover-${k}.html`)}</div><div class="crystal-panel kv-nda">NDA</div></div>`])),
  tv: `<div class="cover cover-tv"><div class="cover-art">${read('templates/partials/cover-tv.html')}</div></div>`,
  ca: `<div class="cover cover-ca"><div class="cover-art">${read('templates/partials/cover-ca.html')}</div></div>`,
  invino: `<div class="cover cover-invino"><div class="cover-art">${read('templates/partials/cover-invino.html')}</div></div>`,
};
// Порядок, обложка и тип каждого проекта. Тексты карточек — в шапке content/<slug>.md (card_title, card_text, card_tags, card_result)
const projectList = [
  ['production-control', 'control', 'internal'],
  ['planning', 'planning', 'internal'],
  ['documentation', 'docs', 'internal'],
  ['sweet-tv', 'tv', 'public'],
  ['in-vino', 'invino', 'own'],
  ['re-instance', 'ca', 'wip'],
];
// Страница «Все проекты» (projects.html): все проекты в одной сетке по типу; проекты в разработке — последними и со своим фильтром.
// Подпись над заголовком считает кейсы отдельно от проектов в разработке, чтобы не обещать материалов, которые пока нельзя открыть
const projectTypes = [
  ['internal', 'Внутренние системы'],
  ['public', 'Публичные продукты'],
  ['own', 'Собственные инструменты'],
];
const content = Object.fromEntries(projectList.map(([slug]) => [slug, parseMd(`content/${slug}.md`)]));

// «Ещё в работе» sits on the cover, not among the tags: next to two tags it wrapped onto a second line,
// and the shared row grid then pushed the titles down on every card in the row
const card = (slug, attrs = '') => {
  const entry = projectList.find(p => p[0] === slug);
  if (!entry) throw new Error(`Нет проекта ${slug} в projectList`);
  const d = content[slug].data;
  // Кейс в разработке: карточка видна, но не открывается
  const wip = entry[2] === 'wip';
  const art = covers[entry[1]];
  return `
          <li class="case-card${wip ? ' is-disabled' : ' is-linked'}"${wip ? ' aria-disabled="true"' : ''}${attrs}>
            ${wip ? art.replace(/<\/div>$/, '<span class="badge badge--wip cover-badge">Ещё в работе</span></div>') : art}
            <div class="card-meta">${d.card_tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            <h4 class="t-heading-sm">${inline(d.card_title)}</h4>
            <p class="t-body">${inline(d.card_text)}</p>${d.card_result ? `
            <p class="card-result t-label-mono">${inline(d.card_result)}</p>` : ''}
            ${wip
              ? '<span class="btn btn--link card-link is-disabled"><span>Кейс скоро появится</span></span>'
              : `<a class="btn btn--link card-link" href="cases/${slug}.html" draggable="false"><span>Открыть кейс</span><svg><use href="#i-arrow-right"/></svg></a>`}
          </li>`;
};

// «Сработаемся?» (portfolio_match_interactive_spec.md): three groups, all chips multi-select.
// data-kind drives the result in main.js: format — remote / hybrid / office, mutually exclusive;
// discuss — worth talking over; vibe — the AI easter egg; office — its own «Давайте обсудим»
const matchGroups = [
  ['01 / Кого вы ищете', [['Продуктовый дизайнер'], ['UX/UI-дизайнер'], ['Дизайнер дизайн-систем'], ['UX-исследователь']]],
  ['02 / С какими задачами', [['Полный цикл дизайна'], ['Самостоятельное ведение продукта'], ['Сложные интерфейсы'], ['UX-исследования'], ['Информационная архитектура'], ['Дизайн-системы'], ['Продуктовые метрики', 'discuss'], ['Прототипирование'], ['AI-инструменты', 'vibe']]],
  ['03 / Что вы предлагаете', [['Удалёнка', 'format'], ['Гибрид', 'format'], ['Офис', 'format office'], ['Гибкий график'], ['Влияние на продукт']]],
];
const dot = '<span class="dot"><img src="assets/chip-check.svg" alt=""></span>';
const chips = matchGroups.map(([title, items]) => `
          <fieldset class="chip-group">
            <legend class="t-label-mono">${title}</legend>
            <div class="chips">${items.map(([t, kind]) => `
              <button type="button" class="chip" aria-pressed="false"${kind ? ` data-kind="${kind}"` : ''}>${dot}${t}</button>`).join('')}
            </div>
          </fieldset>`).join('');

// Типограф: неразрывные пробелы, чтобы предлоги, союзы и тире не висели на краю строки.
// Меняет только текст между тегами; script, style, code, pre и svg не трогает.
const NB = ' ';
const SHORT = 'для|без|под|над|при|про|или|что|как|это|все|его|её|их';
const typo = text => text
  .replace(new RegExp(`(^|[\\s(«„"—])([а-яёa-z]{1,2}|${SHORT}) (?=\\S)`, 'gi'), `$1$2${NB}`)
  .replace(new RegExp(`(^|[\\s(«„"—])([а-яёa-z]{1,2}|${SHORT}) (?=\\S)`, 'gi'), `$1$2${NB}`) // «и в», «а с» подряд
  .replace(/ (—|–)(?=\s)/g, `${NB}$1`)
  .replace(/ (ли|же|бы|ль|ж|б)(?=[\s.,!?;:)»]|$)/gi, `${NB}$1`)
  .replace(/(\d[+%]?) (?=[а-яё%])/gi, `$1${NB}`)
  .replace(/\bSmart TV\b/g, `Smart${NB}TV`)
  // «по-прежнему», «онлайн-кинотеатр»: не переносить по дефису. После дефиса — WORD JOINER (U+2060):
  // неразрывный дефис U+2011 есть не во всех шрифтах, а невидимый джойнер не требует глифа и не меняет вид дефиса.
  // Длинные составные слова не трогаем, чтобы они не вылезали из узких карточек
  .replace(/(?<![\wа-яё-])[\wа-яё]+(?:-[\wа-яё]+)+(?![\wа-яё-])/gi, w => w.length > 24 ? w : w.replace(/-/g, '-⁠'));
const typograph = html => html.replace(
  /(<(script|style|code|pre|svg|textarea)\b[\s\S]*?<\/\2>)|(<[^>]*>)|([^<]+)/gi,
  (m, skip, _t, tag, text) => text ? typo(text) : m,
);

// Open Graph: превью ссылки в мессенджерах из <title>, description и картинки assets/og/<ключ>.png (рисует tools/og.js).
// SITE_URL — адрес сайта после публикации, например 'https://<логин>.github.io/<репозиторий>'. Мессенджерам нужен абсолютный адрес картинки:
// пока SITE_URL пустой, ссылка относительная и превью с картинкой может не показаться. Можно задать и при сборке: SITE_URL=https://… node tools/build.js
const SITE_URL = process.env.SITE_URL || '';
if (!SITE_URL) console.warn('⚠ SITE_URL не задан: og:image будет относительным, превью в Telegram и LinkedIn придёт без картинки');
const ogImages = { 'index.html': 'home', 'projects.html': 'home', 'production-control.html': 'control', 'planning.html': 'planning', 'documentation.html': 'docs', 'sweet-tv.html': 'tv', 'in-vino.html': 'invino' };
const esc = s => s.replace(/"/g, '&quot;');
const withOg = (html, page) => {
  if (html.includes('property="og:')) return html;
  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1];
  const desc = (/<meta name="description" content="([^"]*)">/.exec(html) || [])[1];
  if (!title || !desc) return html;
  const tags = [
    ['og:type', html.includes('class="case-hero"') ? 'article' : 'website'],
    ['og:site_name', 'Екатерина Метельская'],
    ['og:locale', 'ru_RU'],
    ['og:title', title],
    ['og:description', desc],
  ];
  const key = ogImages[page.replace('cases/', '')];
  if (key) {
    const rel = `${page.startsWith('cases/') ? '../' : ''}assets/og/${key}.png`;
    tags.push(['og:image', SITE_URL ? `${SITE_URL.replace(/\/$/, '')}/assets/og/${key}.png` : rel], ['og:image:width', '1200'], ['og:image:height', '630'], ['og:image:alt', title]);
  }
  const meta = tags.map(([p, v]) => `<meta property="${p}" content="${esc(v)}">`);
  if (key) meta.push('<meta name="twitter:card" content="summary_large_image">');
  return html.replace(/(<meta name="description" content="[^"]*">)/, `$1\n${meta.join('\n')}`);
};
const finish = (html, page) => typograph(withOg(html, page));

// ---------- Главная ----------
{
  const file = 'content/home.md';
  const d = home.data;
  const vars = { ...textVars(d), ...shared, badges: d.badges.map(b => `<li class="badge badge--brand">${inline(b)}</li>`).join('\n          ') };
  for (const s of sections(home.body, file)) {
    const id = s.attrs.id;
    const ps = s.chunks.map(c => chunk(c, {}, file));
    Object.assign(vars, {
      [`${id}.label`]: s.attrs.label || '',
      [`${id}.title`]: inline(s.text),
      [`${id}.text`]: ps.join('\n      '),
      // Первый абзац без обёртки <p> — для мест, где у абзаца в шаблоне свой класс
      [`${id}.lead`]: s.chunks[0] ? inline(s.chunks[0].replace(/\n/g, ' ')) : '',
      [`${id}.steps`]: s.subs.map((st, i) => `<li class="step"><span class="num t-label-mono">${String(i + 1).padStart(2, '0')}</span><h3 class="t-title">${inline(st.text)}</h3><p class="t-body">${inline(st.chunks.join(' '))}</p></li>`).join('\n      '),
      [`${id}.entries`]: s.subs.map(e => `<article class="timeline-entry">
        <p class="when t-label-mono">${e.attrs.when || ''}</p>
        <div class="body">
          <div class="head">
            <h3 class="t-heading-md">${inline(e.text)}</h3>
            <p class="t-body-lg">${inline(e.attrs.role || '')}</p>
          </div>
          <div class="t-body timeline-text">
            ${e.chunks.map(c => chunk(c, {}, file)).join('\n            ')}
          </div>
        </div>
      </article>`).join('\n      '),
    });
  }
  const html = fill(read('templates/index.html'), vars, 'templates/index.html')
    .replace(/<!--CARD:([\w-]+)-->/g, (_, slug) => card(slug))
    .replace('<!--CHIPS-->', chips.trim());
  write('index.html', finish(html, 'index.html'));
}

// ---------- Все проекты ----------
{
  const openCases = projectList.filter(p => p[2] !== 'wip');
  const inProgress = projectList.filter(p => p[2] === 'wip');
  const plural = (n, [one, few, many]) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many}`;
  const count = `${plural(projectList.length, ['проект', 'проекта', 'проектов'])}, из них ${inProgress.length} в разработке`;
  const filters = [['all', 'Все', projectList.length], ...projectTypes.map(([id, t]) => [id, t, openCases.filter(p => p[2] === id).length]), ['wip', 'В разработке', inProgress.length]]
    .map(([id, t, n], i) => `
          <button type="button" class="chip" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-filter="${id}">${t}<span class="chip-count">${n}</span></button>`).join('');
  const html = fill(read('templates/projects.html'), { ...textVars(parseMd('content/projects.md').data), ...shared }, 'templates/projects.html')
    .replace('<!--FILTERS-->', filters.trim())
    .replace('<!--COUNT-->', count)
    .replace('<!--PROJECTS-->', [...openCases, ...inProgress].map(([slug, , type]) => card(slug, ` data-type="${type}"`)).join('').trim());
  write('projects.html', finish(html, 'projects.html'));
}

// ---------- Кейсы ----------
// templates/cases/<slug>.html — вёрстка страницы, <slug>.blocks.html — схемы, content/<slug>.md — текст
for (const f of fs.readdirSync(path.join(root, 'templates/cases')).filter(f => /^[\w-]+\.html$/.test(f) && !f.endsWith('.blocks.html'))) {
  const slug = f.replace('.html', '');
  const file = `content/${slug}.md`;
  const { data, body } = content[slug] || parseMd(file);
  const blocks = parseBlocks(`templates/cases/${slug}.blocks.html`);
  const secs = sections(body, file);

  // Содержание: разделы с sub="01" вкладываются в предыдущий пункт верхнего уровня, notoc — не попадает в содержание
  const top = [];
  for (const s of secs.filter(s => !s.attrs.notoc)) {
    const text = inline(s.attrs.toc || s.text);
    if (s.attrs.sub && top.length) top[top.length - 1].subs.push(`<li><a href="#${s.attrs.id}"><span class="toc-num">${s.attrs.sub}</span>${text}</a></li>`);
    else top.push({ head: `<li><a href="#${s.attrs.id}">${text}</a>`, subs: [] });
  }
  const toc = `<ol>\n${top.map(t => `      ${t.head}${t.subs.length ? `\n        <ol class="toc-sub">\n          ${t.subs.join('\n          ')}\n        </ol>\n      ` : ''}</li>`).join('\n')}\n    </ol>`;

  const article = secs.map(s => {
    const cls = s.attrs.class ? ` class="${s.attrs.class}"` : '';
    const label = s.attrs.label ? `\n      <p class="t-label-mono section-num">${s.attrs.label}</p>` : '';
    return `    <section id="${s.attrs.id}"${cls}>${label}
      <h2 class="t-heading-lg">${inline(s.text)}</h2>
      ${s.chunks.map(c => chunk(c, blocks, file)).join('\n      ')}
    </section>`;
  }).join('\n\n');

  const vars = {
    ...textVars(data),
    ...shared,
    facts: (data.facts || []).map(x => { const [k, ...v] = x.split(': '); return `<div><dt class="t-label-mono">${k}</dt><dd>${inline(v.join(': '))}</dd></div>`; }).join('\n          '),
    points: (data.points || []).map(x => `<li>${inline(x)}</li>`).join('\n              '),
  };
  const html = fill(read(`templates/cases/${f}`), vars, `templates/cases/${f}`)
    .replace('<!--TOC-->', toc)
    .replace('<!--BODY-->', article)
    .replace('<!--COVER:tv-->', read('templates/partials/cover-tv.html'))
    .replace('<!--COVER:ca-->', read('templates/partials/cover-ca.html'))
    .replace('<!--COVER:control-->', read('templates/partials/cover-control.html'))
    .replace('<!--COVER:planning-->', read('templates/partials/cover-planning.html'))
    .replace('<!--COVER:docs-->', read('templates/partials/cover-docs.html'))
    .replace('<!--COVER:invino-->', read('templates/partials/cover-invino.html').split('src="assets/').join('src="../assets/'));
  write(`cases/${slug}.html`, finish(html, `cases/${slug}.html`));
}
console.log('Готово: index.html, projects.html, cases/*.html');
