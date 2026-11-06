// Вставляется в интерфейс плагина внутри playground (make-playground.js кладёт этот скрипт перед </body> копии dist/ui.html).
// Раздел «Библиотека»: подключение JSON-каталога открывает системное окно выбора файла, а создание каталога требует настоящей
// библиотеки Figma. В демо ни то ни другое невозможно, поэтому кнопки раздела отключены и сказано почему. Кнопка «Назад» и
// шапка работают как обычно. Сам код плагина не меняется.
(() => {
  const NOTE = {
    ru: 'В демо недоступно: для каталогов нужны файлы и настоящая библиотека Figma.',
    en: 'Not available in the demo: catalogs need files and a real Figma library.',
  };
  const lock = () => {
    const screen = document.querySelector('.screen--library');
    const body = screen && screen.querySelector('[aria-live]');
    if (!body) return;
    const lang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
    body.querySelectorAll('button').forEach((button) => {
      if (!button.disabled) button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.title = NOTE[lang];
    });
    let note = body.querySelector('[data-demo-note]');
    if (!note) {
      note = document.createElement('p');
      note.className = 't-body-sm t-secondary';
      note.setAttribute('data-demo-note', '');
      body.prepend(note);
    }
    if (note.textContent !== NOTE[lang]) note.textContent = NOTE[lang];
  };
  new MutationObserver(lock).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  lock();
})();
