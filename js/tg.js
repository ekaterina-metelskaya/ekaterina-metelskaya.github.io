// Telegram buttons (a.tg): open Ekaterina's chat with a draft message built from the visitor's
// «Сработаемся?» picks. t.me/<username>?text=<draft> is an official deep link: the client pre-enters
// the text, the visitor only taps send. The text is also copied to the clipboard for clients that
// ignore ?text=. Selection state mirrors read() in js/main.js — the scripts stay independent.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const on = c => c.getAttribute('aria-pressed') === 'true';
  const label = c => c.querySelector('.chip-text').textContent.trim();

  const collect = () => {
    const choices = document.querySelector('.match-choices');
    if (!choices) return '';
    const chips = $$('.chip', choices);
    const role = chips.find(c => c.dataset.group === 'role' && on(c));
    const roleId = role?.dataset.role;
    const set = roleId && choices.querySelector(`[data-tasks="${roleId}"]`);
    const tasks = set ? $$('[data-task]', set).filter(on).map(c => c.dataset.task) : [];
    if (set && $$('[data-kind="ai"]', set).some(on)) tasks.push('AI-инструменты');
    const format = chips.find(c => c.dataset.group === 'format' && on(c));
    const extras = chips.filter(c => c.dataset.group === 'extra' && on(c)).map(label);

    const lines = ['Здравствуйте! Смотрел(а) ваше портфолио.'];
    if (role) lines.push(`Ищу: ${label(role)}`);
    if (tasks.length) lines.push(`Задачи: ${tasks.join(', ')}`);
    if (format) lines.push(`Формат: ${label(format)}`);
    if (extras.length) lines.push(`Условия: ${extras.join(', ')}`);
    return lines.length > 1 ? lines.join('\n') : lines[0];
  };

  document.addEventListener('click', e => {
    const a = e.target.closest('a.tg');
    if (!a) return;
    e.preventDefault();
    const text = collect();
    try { navigator.clipboard?.writeText(text); } catch (err) {}
    window.open(`${a.href}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
})();
