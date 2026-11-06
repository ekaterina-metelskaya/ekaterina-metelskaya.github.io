// Вставляется в интерфейс плагина внутри playground (make-playground.js кладёт этот скрипт перед </body> копии dist/ui.html).
// Каталоги библиотеки в демо недоступны: подключение JSON открывает системное окно выбора файла, а создание и сохранение каталога
// требуют настоящей библиотеки Figma. Поэтому отключаются все такие кнопки, где бы они ни встретились:
//   • раздел «Библиотека» целиком (подключить JSON, создать каталог, отключить каталог);
//   • «Подключить JSON» в карточке «Проверка сходства» на сводке компонента;
//   • любая кнопка с подписью каталога («Подключить каталог», «Скачать JSON», «Сохранить в плагине» и т. п.).
// Рядом с кнопкой сказано почему. Кнопка «Назад» и всё остальное работают как обычно. Сам код плагина не меняется.
(() => {
  const NOTE = {
    ru: 'В демо недоступно: для каталогов нужны файлы и настоящая библиотека Figma.',
    en: 'Not available in the demo: catalogs need files and a real Figma library.',
  };
  const CATALOG_BUTTONS = /^(Connect JSON|Подключить JSON|Connect a catalog|Подключить каталог|Replace the catalog|Заменить каталог|Create catalog|Создать каталог|Download JSON|Скачать JSON|Save in the plugin|Сохранить в плагине)$/;
  const text = () => NOTE[document.documentElement.lang === 'ru' ? 'ru' : 'en'];

  const lockButton = (button) => {
    if (!button.disabled) button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    if (button.title !== text()) button.title = text();
  };
  // A one-line explanation under a locked button that has none of its own
  const explainAfter = (button) => {
    const next = button.nextElementSibling;
    if (next && next.hasAttribute('data-demo-note')) {
      if (next.textContent !== text()) next.textContent = text();
      return;
    }
    const note = document.createElement('p');
    note.className = 't-caption t-tertiary';
    note.setAttribute('data-demo-note', '');
    note.textContent = text();
    button.insertAdjacentElement('afterend', note);
  };

  const lock = () => {
    // 1. The Library screen: every button in its body, with one note at the top
    const screen = document.querySelector('.screen--library');
    const body = screen && screen.querySelector('[aria-live]');
    if (body) {
      body.querySelectorAll('button').forEach(lockButton);
      let note = body.querySelector(':scope > [data-demo-note]');
      if (!note) {
        note = document.createElement('p');
        note.className = 't-body-sm t-secondary';
        note.setAttribute('data-demo-note', '');
        body.prepend(note);
      }
      if (note.textContent !== text()) note.textContent = text();
    }
    // 2. Catalog buttons anywhere else (the component summary, the catalog screens)
    document.querySelectorAll('button').forEach((button) => {
      if (!CATALOG_BUTTONS.test(button.textContent.trim())) return;
      lockButton(button);
      if (!button.closest('.screen--library')) explainAfter(button);
    });
  };
  new MutationObserver(lock).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  lock();
})();
