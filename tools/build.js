// Собирает сайт: тексты из content/<язык>/*.md + вёрстка из templates/ → index.html, projects.html, cases/*.html.
// Запуск из корня репозитория:
//   node tools/build.js                      все готовые языки (русский — в корень сайта, остальные — в папку /<язык>/)
//   node tools/build.js --lang en            только один язык, в том числе черновик (для просмотра перевода)
//   node tools/build.js --lang en --extract-ui   дописать в content/en/ui.json все строки интерфейса, у которых ещё нет перевода
// Тексты правятся только в content/<язык>/, готовые .html перезаписываются при каждой сборке.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), s); };

// ---------- Языки ----------
// content/<язык>/ — все тексты одного языка: *.md (одинаковые имена и структура у всех языков), match-texts.json.gz и ui.json.
// ui.json — словарь «русская строка из вёрстки или сборки → перевод»: меню, кнопки, подписи схем и демо в templates/.
// Вёрстка (templates/) общая и остаётся русской: при сборке не-русского языка её строки подменяются по ui.json.
// Русский собирается в корень сайта, остальные — в /<код>/ (en → /en/index.html, /en/cases/…).
// Язык с `draft: true` в шапке content/<язык>/home.md не попадает в обычную сборку и на сайт: его собирают явно, --lang <код>.
const LANGS = { ru: { out: '', locale: 'ru_RU' }, en: { out: 'en/', locale: 'en_US' } };
const argv = process.argv.slice(2);
const flag = n => argv.includes(n);
const argLang = flag('--lang') ? argv[argv.indexOf('--lang') + 1] : null;
if (argLang && !LANGS[argLang]) throw new Error(`Неизвестный язык «${argLang}». Доступны: ${Object.keys(LANGS).join(', ')}`);
const isReady = code => {
  if (code === 'ru') return true;
  if (!fs.existsSync(path.join(root, `content/${code}/home.md`))) return false;
  return parseMd(`content/${code}/home.md`).data.draft !== 'true';
};
let L; // язык, который собирается сейчас: { code, content, out, up }
let ui = {}; // перевод строк интерфейса для текущего языка
const uiSeen = new Set(); // все русские строки, запрошенные при сборке этого языка
const uiMissing = new Set(); // из них те, у которых нет перевода
const CYR = /[А-Яа-яЁё]/;
// Строка интерфейса → перевод. Для русского — как есть; без перевода остаётся русский текст и строка попадает в отчёт
const T = s => {
  if (L.code === 'ru') return s;
  uiSeen.add(s);
  const v = ui[s];
  if (typeof v === 'string' && v.trim()) return v;
  if (CYR.test(s)) uiMissing.add(s);
  return s;
};
// Все русские тексты и атрибуты в куске вёрстки → перевод. Не трогает script, style, комментарии и служебные атрибуты
const SKIP_ATTR = new Set(['href', 'src', 'class', 'id', 'style', 'download', 'for', 'name', 'd']);
const translateHtml = html => L.code === 'ru' ? html : html.replace(/(<(script|style)\b[\s\S]*?<\/\2>)|(<!--[\s\S]*?-->)|(<[^>]*>)|([^<]+)/gi, (m, skip, _t, comment, tag, text) => {
  if (skip || comment) return m;
  if (tag) return tag.replace(/(\s([\w:-]+)=")([^"]*)"/g, (a, pre, name, val) => !SKIP_ATTR.has(name) && CYR.test(val) ? `${pre}${T(val.replace(/\s+/g, ' ')).replace(/"/g, '&quot;')}"` : a);
  return CYR.test(text) ? text.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, a, core, b) => a + T(core.replace(/\s+/g, ' ')) + b) : text;
});
// Файл вёрстки (шаблон, блоки схем, обложки) сразу в нужном языке
const readT = f => translateHtml(read(f));

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
  const parts = readT(file).split(/<!-- block: ([\w-]+) -->\n?/);
  for (let i = 1; i < parts.length; i += 2) out[parts[i]] = parts[i + 1].trim();
  return out;
};

// {{ключ}} в шаблоне → значение из шапки md. Неизвестный ключ — ошибка, чтобы пустые места не попали на сайт
const fill = (html, vars, file) => html.replace(/\{\{([\w.-]+)\}\}/g, (_, k) => {
  if (!(k in vars)) throw new Error(`${file}: нет значения для {{${k}}}`);
  return vars[k];
});
const textVars = (data, prefix = '') => Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'string').map(([k, v]) => [prefix + k, inline(v)]));

// Всё ниже зависит от языка и выполняется для каждого языка отдельно. Тело функции не сдвинуто вправо,
// чтобы не менять отступы в HTML внутри шаблонных строк (они попадают в готовые страницы).
function buildLang(code) {
L = { code, content: `content/${code}`, out: LANGS[code].out, up: LANGS[code].out ? '../' : '' };
ui = code === 'ru' || !fs.existsSync(path.join(root, `${L.content}/ui.json`)) ? {} : JSON.parse(read(`${L.content}/ui.json`));
uiSeen.clear(); uiMissing.clear();
const writePage = (f, s) => write(L.out + f, s);
const published = Object.keys(LANGS).filter(isReady);

const home = parseMd(`${L.content}/home.md`);
const shared = textVars(home.data, 'home.');

// ---------- Карточки кейсов ----------
const covers = {
  // NDA-кейсы: ключевая иллюстрация кейса (templates/partials/cover-*.html, стили в kv.css) под стеклом NDA
  ...Object.fromEntries(['control', 'planning', 'docs'].map(k => [k, `<div class="cover cover-kv kv-bg kv-${k}"><div class="kv-art" aria-hidden="true">${readT(`templates/partials/cover-${k}.html`)}</div><div class="crystal-panel kv-nda">NDA</div></div>`])),
  tv: `<div class="cover cover-tv"><div class="cover-art">${readT('templates/partials/cover-tv.html')}</div></div>`,
  ca: `<div class="cover cover-ca"><div class="cover-art">${readT('templates/partials/cover-ca.html')}</div></div>`,
  invino: `<div class="cover cover-invino"><div class="cover-art">${readT('templates/partials/cover-invino.html')}</div></div>`,
};
// Порядок, обложка и тип каждого проекта. Тексты карточек — в шапке content/<язык>/<slug>.md (card_title, card_text, card_tags, card_result)
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
].map(([id, label]) => [id, T(label)]);
const content = Object.fromEntries(projectList.map(([slug]) => [slug, parseMd(`${L.content}/${slug}.md`)]));

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
            ${wip ? art.replace(/<\/div>$/, `<span class="badge badge--wip cover-badge">${T('Ещё в работе')}</span></div>`) : art}
            <div class="card-meta">${d.card_tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            <h4 class="t-heading-sm">${inline(d.card_title)}</h4>
            <p class="t-body">${inline(d.card_text)}</p>${d.card_result ? `
            <p class="card-result t-label-mono">${inline(d.card_result)}</p>` : ''}
            ${wip
              ? `<span class="btn btn--link card-link is-disabled"><span>${T('Кейс скоро появится')}</span></span>`
              : `<a class="btn btn--link card-link" href="cases/${slug}.html" draggable="false"><span>${T('Открыть кейс')}</span><svg><use href="#i-arrow-right"/></svg></a>`}
          </li>`;
};

// «Сработаемся?»: тексты — готовые абзацы из content/match-texts.json.gz (portfolio_match_copy_v11: match-texts.json),
// логика совместимости — portfolio_match_logic_v3.md. Тексты не собираются из частей: main.js вычисляет ключ сценария
// и выводит title и абзацы paragraphs (или ai_paragraphs) этого ключа как есть, каждый — отдельным <p>.
// Ключ — «роль|сценарий|формат|extras:<буквы>»:
// no-tasks — нет предметных задач; one:<подпись чипа> — одна; multi:<буквы групп по порядку групп роли> — две и больше;
// product|all — все восемь задач продуктового дизайнера. Формат — none / remote / hybrid / office.
// extras — отмеченные дополнительные условия буквами в порядке extra_order (IADF) или «-».
// AI-инструменты в ключ не входят: при отмеченном чипе показываются ai_paragraphs того же ключа, заголовок не меняется.
// Пасхалки — всплывающие подсказки у чипов «AI-инструменты» и «Офис»; на итог не влияют.
// data-tip-sides — где main.js пробует открыть подсказку, по порядку: справа от чипа, над ним, под ним.
// AI — всегда под чипом: он последний в наборе, ниже только свободное место. Офис — справа, сверху или снизу, где закрывает меньше.
// Подсказки всплывают поверх страницы и места не резервируют: отступы между группами одинаковые
// Словарь у каждого языка свой и хранится в репозитории сжатым: content/<язык>/match-texts.json.gz (≈190 КБ вместо 11,5 МБ).
// Чтобы обновить тексты, положите новый словарь как content/<язык>/match-texts.json и запустите сборку:
// она возьмёт его и сама пересоберёт архив. Сам .json в git не попадает (.gitignore)
const zlib = require('zlib');
const matchJson = `${L.content}/match-texts.json`;
const matchGz = `${L.content}/match-texts.json.gz`;
const matchSource = fs.existsSync(path.join(root, matchJson))
  ? read(matchJson)
  : zlib.gunzipSync(fs.readFileSync(path.join(root, matchGz))).toString('utf8');
const matchTexts = JSON.parse(matchSource);
if (fs.existsSync(path.join(root, matchJson))) {
  fs.writeFileSync(path.join(root, matchGz), zlib.gzipSync(Buffer.from(matchSource, 'utf8'), { level: 9 }));
  console.log(`${matchGz} обновлён из ${matchJson}`);
}
const AI_TIP = matchTexts.ai_behavior.tooltip;
const OFFICE_TIP = T('Телепортацию пока не внедрила. Географию можно обсудить');
const tipFor = id => `
              <span class="match-tip t-body-sm" id="tip-${id}" role="tooltip">${id === 'office' ? OFFICE_TIP : AI_TIP}</span>`;
// Роли и порядок чипов задач на сайте; подписи совпадают с subject_tasks словаря, они же — ключ data-task
const matchRoles = [
  { id: 'product', tasks: ['Сложные сценарии', 'Продуктовые гипотезы', 'UX-исследования', 'От идеи до релиза', 'Самостоятельное ведение', 'Дизайн-системы', 'Продуктовые метрики', 'Новые продукты'] },
  { id: 'uxui', tasks: ['UX-сценарии', 'Сложные интерфейсы', 'Структура интерфейсов', 'Прототипирование', 'UI и адаптивы', 'UX-тестирование', 'Дизайн-системы'] },
  { id: 'ds', tasks: ['Библиотеки компонентов', 'Токены и переменные', 'Состояния компонентов', 'UX-паттерны', 'Документация', 'Развитие библиотек'] },
  { id: 'research', tasks: ['Глубинные интервью', 'UX-тестирования', 'CJM и сценарии', 'Проверка гипотез', 'Анализ результатов', 'Опросы', 'Конкурентный анализ'] },
].map(r => ({ ...r, tasks: r.tasks.map(T), label: matchTexts.roles[r.id].label }));
const matchFormats = [['remote', 'Удалёнка'], ['hybrid', 'Гибрид'], ['office', 'Офис']].map(([id, label]) => [id, T(label)]);
// Дополнительные условия — из словаря, в порядке extra_order; буква — ключ data-extra
const matchExtras = [...matchTexts.extra_order].map(id => [id, matchTexts.extra_conditions[id]]);
// Ключ сценария — тот же расчёт, что matchKey в js/main.js (держать одинаковыми)
const matchKey = (role, tasks, format, extras) => {
  const r = matchTexts.roles[role];
  const tail = `${format}|extras:${extras || '-'}`;
  if (!tasks.length) return `${role}|no-tasks|${tail}`;
  if (tasks.length === 1) return `${role}|${r.single_key_prefix}${tasks[0]}|${tail}`;
  if (role === 'product' && tasks.length === r.subject_tasks.length) return `${role}|all|${tail}`;
  const groups = Object.keys(r.groups).filter(g => r.groups[g].some(t => tasks.includes(t))).join('');
  return `${role}|${r.multi_key_prefix}${groups}|${tail}`;
};
// Сборка падает, если у чипа нет строки в словаре или какой-то набор отметок не находит готового текста
const subsets = list => Array.from({ length: 1 << list.length }, (_, mask) => list.filter((_, i) => mask & (1 << i)));
for (const r of matchRoles) {
  const known = matchTexts.roles[r.id].subject_tasks;
  if (r.tasks.length !== known.length || r.tasks.some(t => !known.includes(t))) throw new Error(`${matchJson}: задачи роли ${r.id} не совпадают с чипами`);
  for (const tasks of subsets(r.tasks)) for (const format of Object.keys(matchTexts.format_codes)) for (const extras of subsets([...matchTexts.extra_order])) {
    const key = matchKey(r.id, tasks, format, extras.join(''));
    const entry = matchTexts.cases[key];
    if (!entry || !entry.title || !entry.paragraphs?.length || !entry.ai_paragraphs?.length) throw new Error(`${matchJson}: нет текста для ${key}`);
  }
}
// В словаре почти 10 МБ повторов: у 4928 ключей всего несколько заголовков и ~170 разных абзацев. Для сайта каждая строка
// хранится один раз (strings), а ключ — ссылками: [заголовок, [[вид, абзац], …], [[вид, абзац], …] для AI].
// Это та же информация без потерь — сборка сразу разворачивает её обратно и сверяет с исходником.
// Файл не встраивается в страницу: main.js подгружает js/match-texts.js, когда посетитель подходит к блоку или отмечает первый чип
const matchStrings = [];
const matchRef = new Map();
const ref = s => { if (!matchRef.has(s)) { matchRef.set(s, matchStrings.length); matchStrings.push(s); } return matchRef.get(s); };
const matchKinds = ['experience', 'conditions', 'format'];
const packParagraphs = list => list.map(p => {
  if (!matchKinds.includes(p.kind)) throw new Error(`${matchJson}: неизвестный вид абзаца ${p.kind}`);
  return [matchKinds.indexOf(p.kind), ref(p.text)];
});
const matchCases = Object.fromEntries(Object.entries(matchTexts.cases).map(([key, c]) => [key, [ref(c.title), packParagraphs(c.paragraphs), packParagraphs(c.ai_paragraphs)]]));
const unpack = list => list.map(([k, i]) => ({ kind: matchKinds[k], text: matchStrings[i] }));
for (const [key, c] of Object.entries(matchTexts.cases)) {
  const [t, p, ai] = matchCases[key];
  if (matchStrings[t] !== c.title || JSON.stringify(unpack(p)) !== JSON.stringify(c.paragraphs) || JSON.stringify(unpack(ai)) !== JSON.stringify(c.ai_paragraphs)) throw new Error(`${matchJson}: ${key} не совпал после упаковки`);
}
const matchPayload = JSON.stringify({
  start: matchTexts.start_empty,
  roles: Object.fromEntries(Object.entries(matchTexts.roles).map(([id, r]) => [id, { groups: r.groups, all: r.subject_tasks.length, one: r.single_key_prefix, multi: r.multi_key_prefix }])),
  kinds: matchKinds,
  strings: matchStrings,
  cases: matchCases,
});
const matchFile = `js/match-texts${code === 'ru' ? '' : '.' + code}.js`; // у каждого языка свой файл словаря
write(matchFile, `// Собрано tools/build.js из ${matchJson} — не править вручную\nwindow.MATCH_TEXTS = ${matchPayload};\n`);
const matchTextsSrc = `${matchFile}?v=${require('crypto').createHash('md5').update(matchPayload).digest('hex').slice(0, 8)}`;
const dot = '<span class="dot"><img src="assets/chip-check.svg" alt=""></span>';
const chip = (text, attrs) => `
              <button type="button" class="chip" aria-pressed="false" ${attrs}>${dot}<span class="chip-text">${text}</span></button>`;
const taskChips = r => [
  ...r.tasks.map(t => chip(t, `data-group="task" data-task="${t}"`)),
  chip(T('AI-инструменты'), `data-group="task" data-kind="ai" data-tip-sides="below" aria-describedby="tip-${r.id}"`),
  tipFor(r.id),
].join('');
const chipGroup = (title, body) => `
          <fieldset class="chip-group">
            <legend class="t-label-mono">${title}</legend>${body}
          </fieldset>`;
// All task sets share one grid cell, so the area is as tall as the longest set and does not jump when the role changes.
// data-texts — the dictionary file main.js loads; its texts skip the build typograph, so main.js adds the non-breaking spaces itself
const chips = [
  chipGroup(T('01 / Кого вы ищете'), `
            <div class="chips">${matchRoles.map(r => chip(r.label, `data-group="role" data-role="${r.id}"`)).join('')}
            </div>`),
  chipGroup(T('02 / С какими задачами'), `
            <div class="match-tasks" data-texts="${matchTextsSrc}">
              <p class="match-tasks-hint t-body" data-tasks-hint>${T('Выберите роль, чтобы увидеть задачи')}</p>${matchRoles.map(r => `
              <div class="chips" data-tasks="${r.id}">${taskChips(r)}
              </div>`).join('')}
            </div>`),
  chipGroup(T('03 / Что вы предлагаете'), `
            <div class="chips" role="group" aria-label="${T('Формат работы')}">${matchFormats.map(([id, t]) => chip(t, `data-group="format" data-format="${id}"${id === 'office' ? ' data-tip-sides="right above below" aria-describedby="tip-office"' : ''}`)).join('')}${tipFor('office')}
            </div>
            <div class="chips" role="group" aria-label="${T('Дополнительные условия')}">${matchExtras.map(([id, t]) => chip(t, `data-group="extra" data-extra="${id}"`)).join('')}
            </div>`),
].join('');

// Типограф: неразрывные пробелы, чтобы предлоги, союзы и тире не висели на краю строки.
// Меняет только текст между тегами; script, style, code, pre и svg не трогает.
// Записан кодом  , а не самим символом: невидимый неразрывный пробел легко потерять при правке или копировании
const NB = '\u00a0';
const SHORT = 'для|без|под|над|при|про|или|что|как|это|все|его|её|их';
const typo = text => text
  .replace(new RegExp(`(^|[\\s(«„"—])([а-яёa-z]{1,2}|${SHORT}) (?=\\S)`, 'gi'), `$1$2${NB}`)
  .replace(new RegExp(`(^|[\\s(«„"—])([а-яёa-z]{1,2}|${SHORT}) (?=\\S)`, 'gi'), `$1$2${NB}`) // «и в», «а с» подряд
  .replace(/ (—|–)(?=\s)/g, `${NB}$1`)
  .replace(/ (ли|же|бы|ль|ж|б)(?=[\s.,!?;:)»]|$)/gi, `${NB}$1`)
  .replace(/(\d[+%]?) (?=[а-яё%])/gi, `$1${NB}`)
  // Результаты «в 8 раз быстрее», «в 3 раза меньше»: число, «раз» и следующее слово переносятся только целиком
  .replace(/(\d\sраза?) (?=[а-яё])/gi, `$1${NB}`)
  .replace(/\bSmart TV\b/g, `Smart${NB}TV`)
  // «по-прежнему», «онлайн-кинотеатр»: не переносить по дефису. После дефиса — WORD JOINER (U+2060):
  // неразрывный дефис U+2011 есть не во всех шрифтах, а невидимый джойнер не требует глифа и не меняет вид дефиса.
  // Длинные составные слова не трогаем, чтобы они не вылезали из узких карточек
  .replace(/(?<![\wа-яё-])[\wа-яё]+(?:-[\wа-яё]+)+(?![\wа-яё-])/gi, w => w.length > 24 ? w : w.replace(/-/g, '-⁠'));
// Правила типографа русские; у других языков текст остаётся как написан
const typograph = html => L.code !== 'ru' ? html : html.replace(
  /(<(script|style|code|pre|svg|textarea)\b[\s\S]*?<\/\2>)|(<[^>]*>)|([^<]+)/gi,
  (m, skip, _t, tag, text) => text ? typo(text) : m,
);

// Open Graph и Twitter Card: превью ссылки в мессенджерах и соцсетях из <title> и description страницы
// (у главной — свои og_title и og_description из content/home.md). Картинки рисует tools/og.js:
// общая обложка сайта в корне (og-image-<язык>.png; у языка без своей картинки — русская), у кейсов — assets/og/<ключ>.png.
// Картинку для английских страниц рисует node tools/og.js en.
// Соцсетям нужны абсолютные адреса, поэтому SITE_URL — адрес сайта; другой можно задать при сборке: SITE_URL=https://… node tools/build.js
const SITE_URL = (process.env.SITE_URL || 'https://metelskaya.design').replace(/\/$/, '');
const siteImageFile = fs.existsSync(path.join(root, `og-image-${code}.png`)) ? `og-image-${code}.png` : 'og-image-ru.png';
const SITE_IMAGE = [siteImageFile, T('Екатерина Метельская — Product Designer')];
const ogImages = {
  'index.html': SITE_IMAGE, 'projects.html': SITE_IMAGE, 'privacy.html': SITE_IMAGE,
  ...Object.fromEntries(Object.entries({ 'production-control.html': 'control', 'planning.html': 'planning', 'documentation.html': 'docs', 'sweet-tv.html': 'tv', 'in-vino.html': 'invino' })
    .map(([p, key]) => [p, [`assets/og/${code === 'ru' ? '' : code + '/'}${key}.png`]])),
};
const esc = s => s.replace(/"/g, '&quot;');
const pageUrl = (lang, page) => `${SITE_URL}/${LANGS[lang].out}${page === 'index.html' ? '' : page}`;
// Ссылки между языковыми версиями страницы (только если готов больше чем один язык)
const withAlternates = (html, page) => published.length < 2 ? html : html.replace(/(<meta name="description" content="[^"]*">)/,
  `$1\n${[...published.map(c => [c, c]), ['x-default', 'ru']].map(([h, c]) => `<link rel="alternate" hreflang="${h}" href="${pageUrl(c, page)}">`).join('\n')}`);
const withOg = (html, page, og = {}) => {
  if (html.includes('property="og:')) return html;
  const title = og.title || (/<title>([^<]*)<\/title>/.exec(html) || [])[1];
  const desc = og.description || (/<meta name="description" content="([^"]*)">/.exec(html) || [])[1];
  if (!title || !desc) return html;
  const tags = [
    ['og:type', html.includes('class="case-hero"') ? 'article' : 'website'],
    ['og:site_name', T('Екатерина Метельская')],
    ['og:locale', LANGS[code].locale],
    ['og:title', title],
    ['og:description', desc],
    ['og:url', pageUrl(code, page)],
  ];
  const [image, alt] = ogImages[page.replace('cases/', '')] || [];
  if (image) tags.push(['og:image', `${SITE_URL}/${image}`], ['og:image:width', '1200'], ['og:image:height', '630'], ['og:image:alt', alt || title]);
  const meta = tags.map(([p, v]) => `<meta property="${p}" content="${esc(v)}">`);
  if (image) meta.push('<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:image" content="${SITE_URL}/${image}">`);
  return html.replace(/(<meta name="description" content="[^"]*">)/, `$1\n${meta.join('\n')}`);
};
// ?v=<хэш содержимого> у своих css и js: после правки браузер и GitHub Pages берут новый файл, а не старый из кэша
const crypto = require('crypto');
const versioned = html => html.replace(/(<(?:script|link)\b[^>]*?(?:src|href)=")((?:\.\.\/)?((?:css|js|assets\/fonts)\/[\w.-]+\.(?:css|js)))"/g,
  (m, head, url, file) => `${head}${url}?v=${crypto.createHash('md5').update(read(file)).digest('hex').slice(0, 8)}"`);
// Google Analytics по согласию: загрузчик в начале <head>, сразу после <meta charset> — кодировка должна
// оставаться в первых 1024 байтах, иначе браузеры и сборщики превью ссылок могут прочитать кириллицу неверно
// (templates/partials/gtag.html); баннер согласия и js/consent.js перед </body> (templates/partials/consent.html) — на каждой странице
const withGtag = html => html.replace(/<head>\r?\n<meta charset="utf-8">\r?\n/, m => m + read('templates/partials/gtag.html').replace(/\r\n/g, '\n'));
const withConsent = (html, page) => html.replace(/<\/body>/, () => readT('templates/partials/consent.html').replace(/\r\n/g, '\n').split('{{root}}').join(page.startsWith('cases/') ? '../' : '') + '</body>');
const withAnalytics = (html, page) => html.replace(/<script src=/, `<script src="${page.startsWith('cases/') ? '../' : ''}js/analytics.js"></script>\n<script src=`);
// Не-русский язык лежит на уровень глубже (/en/…), а css, js и assets остаются в корне сайта: их адреса получают ещё один «../»
const relocate = html => L.up ? html.replace(/="((?:\.\.\/)?(?:assets|css|js)\/)/g, `="${L.up}$1`) : html;
const withLang = html => html.replace(/<html lang="[\w-]+">/, `<html lang="${code}">`);
// Переключатель языка в шапке: сегментный «RU | EN». Текущий язык подсвечен и не кликается (aria-current), доступные — ссылки
// на ту же страницу на другом языке. Подписи и aria-label — на языке самого сегмента, поэтому не переводятся.
// Пока второй язык в черновике, на обычной сборке русской версии переключателя нет
const LANG_LINK = { ru: ['RU', 'Русский'], en: ['EN', 'English'] };
const withLangSwitch = (html, page) => {
  const depth = (page.startsWith('cases/') ? 1 : 0) + (L.up ? 1 : 0);
  if (!Object.keys(LANGS).some(c => c !== code && published.includes(c))) return html;
  const items = Object.keys(LANGS).filter(c => c === code || published.includes(c)).map(c => {
    const [label, name] = LANG_LINK[c];
    return c === code
      ? `<span class="is-current" lang="${c}" aria-current="true" title="${name}">${label}</span>`
      : `<a href="${'../'.repeat(depth)}${LANGS[c].out}${page}" hreflang="${c}" lang="${c}" aria-label="${name}" title="${name}">${label}</a>`;
  }).join('');
  const group = `<div class="lang-switch" role="group" aria-label="Language / Язык">${items}</div>`;
  return html.replace(/(<div class="header-right">)/, `$1\n      ${group}`);
};
// Скрипты со строками интерфейса у не-русских языков свои: js/<имя>.<язык>.js (main.en.js и т. д.) вместо js/<имя>.js.
// Если перевода скрипта нет (analytics.js, consent.js, covers.js не содержат текста), остаётся общий
const localizeScripts = html => code === 'ru' ? html : html.replace(/(<script\b[^>]*\bsrc=")((?:\.\.\/)?js\/[\w-]+)\.js"/g,
  (m, head, base) => fs.existsSync(path.join(root, `${base.replace(/^\.\.\//, '')}.${code}.js`)) ? `${head}${base}.${code}.js"` : m);
// Резюме: у русской версии assets/Metelskaya-Ekaterina-CV.pdf, у остальных языков — assets/Metelskaya-Ekaterina-CV-<язык>.pdf
// (если файла нет, остаётся русское). Меняется и ссылка, и имя скачиваемого файла
const CV_NAME = 'Metelskaya-Ekaterina-CV';
const localizeCv = html => code === 'ru' || !fs.existsSync(path.join(root, `assets/${CV_NAME}-${code}.pdf`)) ? html
  : html.split(`${CV_NAME}.pdf`).join(`${CV_NAME}-${code}.pdf`);
const finish = (html, page, og) => relocate(withLang(withGtag(versioned(localizeCv(localizeScripts(typograph(withAnalytics(withConsent(withLangSwitch(withAlternates(withOg(html, page, og), page), page), page), page))))))));

// ---------- Главная ----------
{
  const file = `${L.content}/home.md`;
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
  const html = fill(readT('templates/index.html'), vars, 'templates/index.html')
    .replace(/<!--CARD:([\w-]+)-->/g, (_, slug) => card(slug))
    .replace('<!--CHIPS-->', chips.trim());
  writePage('index.html', finish(html, 'index.html', { title: d.og_title, description: d.og_description }));
}

// ---------- Все проекты ----------
{
  const openCases = projectList.filter(p => p[2] !== 'wip');
  const inProgress = projectList.filter(p => p[2] === 'wip');
  // Формы слова через «|»: у русского три («проект|проекта|проектов»), у остальных языков две («project|projects»)
  const plural = (n, forms) => {
    const f = T(forms).split('|');
    return `${n} ${f.length === 3 ? (n % 10 === 1 && n % 100 !== 11 ? f[0] : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? f[1] : f[2]) : (n === 1 ? f[0] : f[1])}`;
  };
  // {projects} и {wip} в переводе ставятся там, где нужны число проектов и число проектов в разработке
  const count = T('{projects}, из них {wip} в разработке').replace('{projects}', plural(projectList.length, 'проект|проекта|проектов')).replace('{wip}', inProgress.length);
  const filters = [['all', T('Все'), projectList.length], ...projectTypes.map(([id, t]) => [id, t, openCases.filter(p => p[2] === id).length]), ['wip', T('В разработке'), inProgress.length]]
    .map(([id, t, n], i) => `
          <button type="button" class="chip" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-filter="${id}">${t}<span class="chip-count">${n}</span></button>`).join('');
  const html = fill(readT('templates/projects.html'), { ...textVars(parseMd(`${L.content}/projects.md`).data), ...shared }, 'templates/projects.html')
    .replace('<!--FILTERS-->', filters.trim())
    .replace('<!--COUNT-->', count)
    .replace('<!--PROJECTS-->', [...openCases, ...inProgress].map(([slug, , type]) => card(slug, ` data-type="${type}"`)).join('').trim());
  writePage('projects.html', finish(html, 'projects.html'));
}

// ---------- Политика конфиденциальности ----------
{
  const file = `${L.content}/privacy.md`;
  const { data, body } = parseMd(file);
  const text = sections(body, file).map(s => `      <h2 class="t-heading-sm">${inline(s.text)}</h2>\n      ${s.chunks.map(c => chunk(c, {}, file)).join('\n      ')}`).join('\n');
  const html = fill(readT('templates/privacy.html'), { ...textVars(data), ...shared }, 'templates/privacy.html').replace('<!--BODY-->', text);
  writePage('privacy.html', finish(html, 'privacy.html'));
}

// ---------- Кейсы ----------
// templates/cases/<slug>.html — вёрстка страницы, <slug>.blocks.html — схемы, content/<язык>/<slug>.md — текст
for (const f of fs.readdirSync(path.join(root, 'templates/cases')).filter(f => /^[\w-]+\.html$/.test(f) && !f.endsWith('.blocks.html'))) {
  const slug = f.replace('.html', '');
  const file = `${L.content}/${slug}.md`;
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
  const html = fill(readT(`templates/cases/${f}`), vars, `templates/cases/${f}`)
    .replace('<!--TOC-->', toc)
    .replace('<!--BODY-->', article + '\n    <span data-content-end aria-hidden="true" style="display:block;height:1px"></span>')
    .replace('<!--COVER:tv-->', readT('templates/partials/cover-tv.html'))
    .replace('<!--COVER:ca-->', readT('templates/partials/cover-ca.html'))
    .replace('<!--COVER:control-->', readT('templates/partials/cover-control.html'))
    .replace('<!--COVER:planning-->', readT('templates/partials/cover-planning.html'))
    .replace('<!--COVER:docs-->', readT('templates/partials/cover-docs.html'))
    .replace('<!--COVER:invino-->', readT('templates/partials/cover-invino.html').split('src="assets/').join('src="../assets/'));
  writePage(`cases/${slug}.html`, finish(html, `cases/${slug}.html`));
}

// ---------- Перевод интерфейса: отчёт и заготовка ui.json ----------
if (code !== 'ru') {
  const uiFile = `${L.content}/ui.json`;
  if (flag('--extract-ui')) {
    // Дописывает недостающие строки с пустым значением. Готовые переводы и их порядок не меняются
    const merged = { ...ui };
    for (const s of uiSeen) if (!(s in merged)) merged[s] = '';
    write(uiFile, JSON.stringify(merged, null, 2) + '\n');
    console.log(`${uiFile}: ${Object.keys(merged).length} строк, без перевода ${Object.values(merged).filter(v => !String(v).trim()).length}`);
  } else if (uiMissing.size) {
    console.warn(`[${code}] ${uiMissing.size} строк интерфейса без перевода остаются русскими. Список: node tools/build.js --lang ${code} --extract-ui, затем заполнить ${uiFile}`);
  }
}
console.log(`Готово [${code}]: ${L.out}index.html, projects.html, privacy.html, cases/*.html`);
}

// ---------- Запуск ----------
for (const code of argLang ? [argLang] : Object.keys(LANGS).filter(isReady)) buildLang(code);
