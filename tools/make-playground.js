// Готовит playground для кейса Re:Instance: берёт из проекта плагина (папка Re_Instance) окно «Figma» с имитацией кода
// (scripts/preview-host.html) и свежую сборку интерфейса (dist/ui.html) — так же, как Re_Instance/scripts/build-preview.mjs
// собирает preview/index.html, но не трогая файлы плагина. Результат — встраиваемая страница
// assets/re-instance/playground.html. Код плагина не меняется, правки делаются только в копии:
//   • убраны служебная панель разработчика и вид «Компоненты» (UI kit): остаётся работающий плагин;
//   • вместо тестового файла плагина — демо-файл «Field Notes» (tools/playground/dataset.js): те же сообщения и форматы,
//     другие данные; рядом с окном плагина холст с карточками-примерами (tools/playground/canvas.js), их можно выделять;
//   • язык интерфейса берётся из адреса: playground.html?lang=en или ?lang=ru (по умолчанию — настройка плагина, иначе en);
//   • подписи самого окна («Плагин закрыт» и т. п.) переводятся для ?lang=en.
// Запуск из корня репозитория: node tools/make-playground.js "E:/Work/Petproj/Plugins/Re-Instance/Re_Instance"
// Перед этим соберите плагин (npm run build в Re_Instance), чтобы dist/ui.html был свежим: старый preview/index.html
// мог отстать от исходников (в нём, например, был не исправленный hover выбранной карточки различий).
// После пересборки плагина запустите заново и закоммитьте новый assets/re-instance/playground.html.
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) throw new Error('Укажите папку Re_Instance плагина: node tools/make-playground.js <путь>');
const pluginFile = f => path.join(dir, f);
for (const f of ['scripts/preview-host.html', 'dist/ui.html']) if (!fs.existsSync(pluginFile(f))) throw new Error(`Нет файла ${pluginFile(f)}: нужна папка Re_Instance со сборкой (npm run build)`);
let html = fs.readFileSync(pluginFile('scripts/preview-host.html'), 'utf8');
const part = f => fs.readFileSync(path.join(__dirname, 'playground', f), 'utf8');
// Интерфейс плагина кладётся в страницу строкой JS; «<» экранируется, чтобы «</script>» внутри не закрыл тег (как в build-preview.mjs)
const embed = text => JSON.stringify(text).replace(/</g, '\\u003c');

const fail = what => { throw new Error(`В превью плагина не нашлось: ${what}. Скрипт нужно обновить под новую версию превью`); };
const rep = (from, to) => {
  if (typeof from === 'string' ? !html.includes(from) : !from.test(html)) fail(String(from).slice(0, 80));
  html = html.replace(from, () => to);
};

// 1. Свежий интерфейс плагина; без UI kit: вид «Компоненты» недоступен, его страница не нужна
// В копию интерфейса добавляется tools/playground/plugin-lock.js: кнопки раздела «Библиотека» отключены (файлы и библиотека Figma в демо недоступны)
let pluginUi = fs.readFileSync(pluginFile('dist/ui.html'), 'utf8');
const bodyEnd = pluginUi.lastIndexOf('</body>');
if (bodyEnd < 0) fail('</body> в dist/ui.html');
pluginUi = pluginUi.slice(0, bodyEnd) + `<script>\n${part('plugin-lock.js')}</script>\n` + pluginUi.slice(bodyEnd);
rep("/*__PLUGIN_UI__*/ ''", embed(pluginUi));
rep("/*__SHOWCASE_UI__*/ ''", "''");

// 2. Оформление, холст и размещение: плагин справа (или под холстом на узкой странице)
rep('</head>', `    <style id="embed">\n${part('embed.css')}    </style>\n  </head>`);
rep('<section class="window"', '<section class="fn-panel" id="fn-panel" aria-label="Field Notes"></section>\n\n      <section class="window"');

// 3. Данные: демо-файл «Field Notes» вместо тестового файла плагина (перед сборкой наборов данных)
rep('const SMALL_DATA = {', `${part('dataset.js')}\n      const SMALL_DATA = {`);
// «Большой файл» не нужен: вместо него те же данные
rep(/const BIG_DATA = buildBig\(\);[\s\S]*?for \(const part of BIG_DATA\.PARTS\)[^\n]*\n/, 'const BIG_DATA = SMALL_DATA;\n');

// 4. Поиск по выделению считает выделенные на холсте карточки; локальные компоненты — те, что на холсте
rep('return { total: state.selection * 7, frames: onPage.slice(0, state.selection) };',
  'return { total: Math.max(1, state.selectedIds.length) * 7, frames: onPage.filter((f) => state.selectedIds.includes(f.frameId)) };');
rep(/const owners = \[[\s\S]*?\]\.filter\(\(\) => scope === 'file' \|\| state\.pageId === '0:1'\);/, `const owners = [
          { nodeId: '1:10', name: 'Card', kind: 'component', pageId: '0:1', pageName: 'Field Notes', path: ['Local source components'], componentIds: ['1:10'] },
          { nodeId: '1:15', name: 'Card / Token', kind: 'component', pageId: '0:1', pageName: 'Field Notes', path: ['Local source components'], componentIds: ['1:15'] },
          { nodeId: '16:67', name: 'Card / Field alert', kind: 'component', pageId: '0:1', pageName: 'Field Notes', path: ['New local components'], componentIds: ['16:67'] },
          { nodeId: '16:100', name: 'Card / Route note', kind: 'component', pageId: '0:1', pageName: 'Field Notes', path: ['New local components'], componentIds: ['16:100'] },
        ].filter((o) => scope !== 'selection' || state.selectedIds.includes(o.nodeId) || frames.some((f) => SOURCES[f.sourceKey] && SOURCES[f.sourceKey].componentId === o.componentIds[0]));`);

// 5. «Перейти к слою» подсвечивает карточку на холсте
rep('function focusNode(nodeId) {', 'function focusNode(nodeId) {\n        if (window.__canvasFocus && window.__canvasFocus(nodeId)) return;');

// 6. Размер окна не берётся из сохранённого (его ширину задаёт страница)
rep("const size = JSON.parse(localStorage.getItem('re-instance/window-size/v2'));", 'const size = null;');

// 7. Язык интерфейса плагина из ?lang=
rep("const state = { theme: 'light'", "const embedLang = new URLSearchParams(location.search).get('lang');\n      const state = { theme: 'light'");
rep("${saved.locale ?? 'en'}", "${embedLang === 'ru' || embedLang === 'en' ? embedLang : saved.locale ?? 'en'}");

// 7a. Язык страницы главнее сохранённого выбора: плагин при запуске получает настройки из общего хранилища сайта, где мог
// остаться язык с другой версии (русская/английская страницы одного origin), и переключился бы на него
rep('state.settings = normalize(storageGet());',
  "state.settings = { ...normalize(storageGet()), ...(embedLang === 'ru' || embedLang === 'en' ? { locale: embedLang } : {}) };");

// 8. Холст и подписи окна на английском для ?lang=en. Вставляется перед первым запуском load();
rep('\n      load();\n    </script>', `
${part('canvas.js')}
      if (embedLang === 'en') {
        document.documentElement.lang = 'en';
        document.title = 'Re:Instance preview';
        document.getElementById('window').setAttribute('aria-label', 'Plugin window');
        document.getElementById('close').setAttribute('aria-label', 'Close plugin');
        document.getElementById('frame').setAttribute('title', 'Re:Instance plugin interface');
        document.querySelector('.closed span').textContent = 'Plugin closed';
        document.getElementById('open').textContent = 'Open Re:Instance';
      }
      load();
    </script>`);

const out = path.join(__dirname, '..', 'assets', 're-instance', 'playground.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`assets/re-instance/playground.html (${(html.length / 1024).toFixed(0)} КБ)`);
