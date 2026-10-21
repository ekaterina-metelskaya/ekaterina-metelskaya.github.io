(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reading progress ---------- */
  const progress = $('.read-progress');
  const article = $('.prose');
  const onScroll = () => {
    const r = article.getBoundingClientRect();
    const total = r.height - innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, -r.top / total));
    progress.style.setProperty('--p', `${p * 100}%`);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Cover art: scale the 420×180 card illustration to fit the banner ---------- */
  $$('.case-cover--art').forEach(cover => {
    const art = $('.cover-art', cover);
    if (!art) return;
    new ResizeObserver(() => {
      art.style.setProperty('--art-s', Math.min(cover.clientWidth / 420, cover.clientHeight / 180).toFixed(3));
    }).observe(cover);
  });

  /* ---------- Margin: hints join the caption; takeaways line up with the text they sum up ---------- */
  // Case template (body.v2): a hint is an action, not part of the caption — it goes above the scheme,
  // in the same violet line with a cursor icon as the hints next to «Стало»
  // Touch screens cannot hover: hints and labels written for a mouse carry their own touch wording
  if (matchMedia('(hover: none)').matches) {
    $$('[data-touch]').forEach(el => {
      const text = [...el.childNodes].reverse().find(n => n.nodeType === 3 && n.textContent.trim());
      if (text) text.textContent = el.dataset.touch; else el.textContent = el.dataset.touch;
    });
    $$('[data-touch-label]').forEach(el => el.setAttribute('aria-label', el.dataset.touchLabel));
  }
  if (document.body.classList.contains('v2')) {
    const cursor = '<svg class="ico-cursor" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5l9 5.2-3.9 1.1-1.6 3.9z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg>';
    const toHint = (t, cls) => {
      const hint = document.createElement('p');
      hint.className = cls;
      hint.innerHTML = cursor;
      hint.append(t.textContent.trim());
      return hint;
    };
    $$('.fig > .try').forEach(t => {
      t.closest('.fig').prepend(toHint(t, 'fig-try fig-try--top'));
      t.remove();
    });
    // Every other hint (next to a demo, outside a figure) gets the same look, where it stands
    $$('.prose .try').forEach(t => t.replaceWith(toHint(t, 'fig-try fig-try--inline')));
  }
  $$('.prose .try').forEach(t => {
    // Grey hint, accent only on the leading word
    const m = t.firstChild?.nodeType === 3 && /^(Попробуйте:?)[\s ]*/.exec(t.firstChild.textContent);
    if (!m) return;
    t.firstChild.textContent = t.firstChild.textContent.slice(m[0].length);
    const lead = document.createElement('span');
    lead.className = 'try-lead';
    lead.textContent = m[1] + ' ';
    t.prepend(lead);
  });
  $$('.fig').forEach(fig => {
    const cap = $(':scope > figcaption', fig);
    $$(':scope > .try', fig).forEach(t => cap?.append(t));
  });
  const placeNotes = () => $$('.prose .insight').forEach(note => {
    // Start of the run of paragraphs right before the note; after a figure — level with its bottom
    let anchor = null;
    for (let el = note.previousElementSibling; el?.tagName === 'P' && !el.classList.contains('section-num'); el = el.previousElementSibling) anchor = el;
    const prev = note.previousElementSibling;
    // A wide figure already fills the margin: the note simply follows it
    if (!anchor && prev?.classList.contains('fig--wide')) return note.style.removeProperty('--y');
    const y = anchor ? anchor.offsetTop : prev ? prev.offsetTop + prev.offsetHeight - note.offsetHeight : 0;
    note.style.setProperty('--y', `${Math.round(y)}px`);
  });
  new ResizeObserver(placeNotes).observe(article);

  /* ---------- Contents ----------
     The full list stands at the top of the margin and scrolls away with it, so it never meets the margin notes.
     Once it is out of view (and always on narrow screens) a compact «Содержание» menu in the header takes over */
  const toc = $('.toc');
  const header = $('.site-header .wrap');
  let drop = null;
  if (toc && header) {
    drop = document.createElement('details');
    drop.className = 'toc-drop';
    drop.innerHTML = '<summary aria-label="Содержание"><span class="toc-drop-label">Содержание</span><span class="toc-drop-step"></span><span class="toc-drop-current"></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>';
    const list = $('ol', toc).cloneNode(true);
    list.className = 'toc-drop-list';
    drop.append(list);
    // A permanent way out of a long case, next to the contents
    const back = document.createElement('a');
    back.className = 'header-back';
    back.setAttribute('aria-label', 'Все кейсы');
    back.href = '../projects.html';
    back.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.67 8H3.33M7.33 4l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Все кейсы</span>';
    $('.logo', header).after(back, drop);
    // Shown only once the hero's own «Все кейсы» has scrolled away, so the link never appears twice
    const heroBack = $('.case-hero .back');
    if (heroBack) new IntersectionObserver(([e]) => {
      root.classList.toggle('hero-back-away', !e.isIntersecting && e.boundingClientRect.top < 0);
    }, { rootMargin: '-69px 0px 0px 0px' }).observe(heroBack);
    else root.classList.add('hero-back-away');
    drop.addEventListener('click', e => { if (e.target.closest('a')) drop.open = false; });
    document.addEventListener('click', e => { if (drop.open && !drop.contains(e.target)) drop.open = false; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') drop.open = false; });
    new IntersectionObserver(([e]) => {
      const gone = !e.isIntersecting && e.boundingClientRect.top < 0;
      document.documentElement.classList.toggle('toc-away', gone);
      if (!gone) drop.open = false;
    }, { rootMargin: '-69px 0px 0px 0px' }).observe(toc);
  }

  /* ---------- Table of contents: highlight the current section (in the list and in the header menu) ---------- */
  const tocLinks = new Map();
  $$('.toc a, .toc-drop a').forEach(a => {
    const id = a.getAttribute('href').slice(1);
    tocLinks.set(id, [...(tocLinks.get(id) || []), a]);
  });
  const current = drop && $('.toc-drop-current', drop);
  const step = drop && $('.toc-drop-step', drop);
  // The current section is the last one whose top has passed a reading line a third down the screen.
  // At the very bottom the last sections can't reach that line, so the last one takes over
  const sections = [...tocLinks.keys()].map(id => document.getElementById(id)).filter(Boolean);
  let active = null;
  const setActive = id => {
    if (id === active) return;
    active = id;
    tocLinks.forEach(links => links.forEach(a => a.removeAttribute('aria-current')));
    const links = tocLinks.get(id) || [];
    links.forEach(a => a.setAttribute('aria-current', 'true'));
    if (current && links[0]) current.textContent = links[0].lastChild.textContent.trim();
    if (step) step.textContent = `${sections.findIndex(s => s.id === id) + 1}/${sections.length}`;
  };
  const pickSection = () => {
    if (!sections.length) return;
    const line = innerHeight * 0.35;
    let id = sections[0].id;
    sections.forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    const last = sections[sections.length - 1];
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2 && last.getBoundingClientRect().top < innerHeight) id = last.id;
    setActive(id);
  };
  addEventListener('scroll', pickSection, { passive: true });
  addEventListener('resize', pickSection);
  pickSection();

  /* ---------- FIG. 2: repeatable blocks ---------- */
  const repeat = $('[data-repeat]');
  if (repeat) {
  const itemTpl = repeat.firstElementChild.cloneNode(true);
  const widths = ['w70', 'w50', 'w80', 'w60'];
  $('[data-add]').addEventListener('click', () => {
    if (repeat.children.length >= 4) return;
    const item = itemTpl.cloneNode(true);
    $('.wf-row', item).className = `wf-row ${widths[repeat.children.length % widths.length]}`;
    repeat.append(item);
    if (!reduceMotion) item.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200 });
  });
  repeat.addEventListener('click', e => {
    const btn = e.target.closest('.wf-remove');
    if (!btn || repeat.children.length <= 1) return;
    btn.closest('.wf-item').remove();
  });
  }

  /* ---------- FIG. 3: inline validation, required check, drafts ---------- */
  const form = $('[data-demo="form"]');
  if (form) {
  const range = $('[data-range]', form);
  const required = $('[data-required]', form);
  const draft = $('.wf-draft', form);
  const hints = { range: 'Целое число от 0 до 100', comment: 'Заполните перед завершением' };

  const setField = (input, state, msg) => {
    const field = input.closest('.wf-field');
    field.classList.toggle('is-invalid', state === 'invalid');
    field.classList.toggle('is-valid', state === 'valid');
    input.setAttribute('aria-invalid', String(state === 'invalid'));
    $('.wf-hint', field).textContent = msg;
  };
  const checkRange = () => {
    const v = range.value.trim();
    if (!v) { setField(range, 'idle', hints.range); return false; }
    if (!/^\d+$/.test(v)) { setField(range, 'invalid', 'Только цифры, без букв и знаков'); return false; }
    if (+v > 100) { setField(range, 'invalid', `Больше 100 — максимум 100`); return false; }
    setField(range, 'valid', 'Значение в допустимом диапазоне');
    return true;
  };
  const checkRequired = strict => {
    if (required.value.trim()) { setField(required, 'valid', hints.comment); return true; }
    setField(required, strict ? 'invalid' : 'idle', strict ? 'Обязательное поле — заполните, чтобы завершить' : hints.comment);
    return false;
  };

  let draftTimer;
  const saveDraft = () => {
    draft.classList.remove('is-saved');
    draft.textContent = 'Сохраняю черновик…';
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const t = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      draft.textContent = `Черновик сохранён · ${t}`;
      draft.classList.add('is-saved');
    }, 600);
  };

  range.addEventListener('input', () => { checkRange(); saveDraft(); });
  required.addEventListener('input', () => { checkRequired(false); saveDraft(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = [checkRange() || (range.value.trim() === '' && (setField(range, 'invalid', 'Обязательное поле'), false)), checkRequired(true)].every(Boolean);
    if (ok) {
      draft.textContent = 'Готово — данные отправлены';
      draft.classList.add('is-saved');
      return;
    }
    form.querySelector('[aria-invalid="true"]')?.focus();
    if (!reduceMotion) { form.classList.remove('is-shake'); void form.offsetWidth; form.classList.add('is-shake'); }
  });
  }

  /* ---------- Segmented controls: click and arrow keys ---------- */
  const segment = (group, onChange) => {
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
      const b = items[(items.indexOf(document.activeElement) + d + items.length) % items.length];
      b.focus(); pick(b);
    });
    pick(items.find(b => b.getAttribute('aria-checked') === 'true') || items[0]);
  };

  /* ---------- Planning · FIG. 2: three ways to show the data ---------- */
  const views = $('[data-seg="views"]');
  if (views) {
    const fig = views.closest('.fig');
    const verdict = $('[data-verdict]', fig);
    const notes = {
      wide: ['Привычно: так данные выглядели в Excel', 'Столбцы от A до CZ: нужное приходится искать прокруткой, контекст теряется'],
      new: ['Компактно и по-новому', 'Непривычная структура отпугнула участников тестирования, адаптация заняла бы слишком много времени'],
      nested: ['Видны связи, детали раскрываются по мере необходимости', 'Сначала встретили скептически — на задачах оказались удобнее остальных'],
    };
    segment(views, v => {
      $$('[data-view]', fig).forEach(el => { el.hidden = el.dataset.view !== v; });
      const [plus, minus] = notes[v];
      verdict.innerHTML = `<div class="is-plus"><dt>Плюсы</dt><dd>${plus}</dd></div><div class="is-minus"><dt>${v === 'nested' ? 'Нюанс' : 'Минусы'}</dt><dd>${minus}</dd></div>`;
    });
    $('[data-nested]', fig).addEventListener('click', e => {
      const row = e.target.closest('.pl-parent');
      if (!row) return;
      const open = row.getAttribute('aria-expanded') !== 'true';
      row.setAttribute('aria-expanded', String(open));
      const kids = row.nextElementSibling;
      kids.hidden = !open;
      if (open && !reduceMotion) kids.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180 });
    });
  }

  /* ---------- Planning · FIG. 3: confirm changes in place, keep a history ---------- */
  const changes = $('[data-changes]');
  if (changes) {
    const count = $('[data-ch-count]', changes);
    const history = $('[data-ch-history]', changes);
    const toggle = $('[data-ch-history-toggle]', changes);
    const time = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    toggle.addEventListener('click', () => {
      history.hidden = !history.hidden;
      toggle.setAttribute('aria-expanded', String(!history.hidden));
    });
    changes.addEventListener('click', e => {
      const btn = e.target.closest('[data-ok], [data-no]');
      if (!btn) return;
      const row = btn.closest('.is-changed');
      const ok = btn.hasAttribute('data-ok');
      row.classList.remove('is-changed');
      row.classList.add(ok ? 'is-ok' : 'is-declined');
      $('.pl-acts', row).innerHTML = `<span class="pl-done">${ok ? 'Подтверждено' : 'Отклонено'}</span>`;
      count.textContent = $$('.is-changed', changes).length;
      $('.pl-history-empty', history)?.remove();
      const li = document.createElement('li');
      li.textContent = `${time()} · ${row.dataset.change} · ${ok ? 'подтверждено' : 'отклонено, значение сохранено'}`;
      history.prepend(li);
    });
  }

  /* ---------- Documentation · FIG. 3: the summary filters the list it sits on ---------- */
  const dcList = $('[data-dc-list]');
  if (dcList) {
    const rows = $$('.dc-rows li', dcList);
    const sums = $$('.dc-sum', dcList);
    sums.forEach(b => { const f = b.dataset.f; $('b', b).textContent = f === 'all' ? rows.length : rows.filter(r => r.dataset.s === f).length; });
    dcList.addEventListener('click', e => {
      const b = e.target.closest('.dc-sum');
      if (!b) return;
      const f = b.getAttribute('aria-pressed') === 'true' && b.dataset.f !== 'all' ? 'all' : b.dataset.f;
      sums.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.f === f)));
      rows.forEach(r => { r.hidden = f !== 'all' && r.dataset.s !== f; });
    });
  }

  /* ---------- Documentation · FIG. 4: different content, one structure ---------- */
  const dcSeg = $('[data-seg="section"]');
  if (dcSeg) {
    const fig = dcSeg.closest('.fig');
    const groups = $('[data-dc-groups]', fig);
    const title = $('[data-dc-title]', fig);
    const note = $('[data-dc-note]', fig);
    const feedback = $('[data-dc-feedback]', fig);
    // [title, groups: [name, fields], field that users wanted elsewhere: [field, from group, to group]]
    const sections = [
      ['Раздел 1', [['Основные сведения', ['Наименование', 'Номер', 'Тип']], ['Сроки', ['Дата начала', 'Срок действия']], ['Ответственные', ['Исполнитель', 'Согласующий']], ['Связи', ['Связанные записи']]], ['Срок действия', 1, 0]],
      ['Раздел 2', [['Основные сведения', ['Наименование', 'Категория']], ['Сроки', ['Плановая дата', 'Фактическая дата']], ['Ответственные', ['Ответственный']], ['Связи', ['Основание', 'Приложения']]], ['Основание', 3, 0]],
      ['Раздел 3', [['Основные сведения', ['Наименование', 'Номер', 'Версия']], ['Сроки', ['Дата пересмотра']], ['Ответственные', ['Владелец', 'Проверяющий']], ['Связи', ['Заменяет', 'Заменён']]], ['Проверяющий', 2, 1]],
    ];
    let current = 0;
    const render = () => {
      const [name, list, [field, from, to]] = sections[current];
      const moved = feedback.checked;
      const data = list.map(([g, fields]) => [g, fields.filter(f => !(moved && f === field))]);
      if (moved) data[to][1].push(field);
      title.textContent = name;
      groups.innerHTML = data.map(([g, fields]) => `<div class="dc-group"><span class="dc-group-name">${g}</span>${fields.map(f => `<span class="dc-field${moved && f === field ? ' is-moved' : ''}">${f}</span>`).join('')}</div>`).join('');
      note.textContent = moved
        ? `«${field}» перенесли из группы «${list[from][0]}» в «${list[to][0]}» — так пользователям удобнее, структура осталась прежней`
        : 'Шапка со статусом, группы полей, черновик и действия — одинаковы во всех разделах';
    };
    feedback.addEventListener('change', render);
    segment(dcSeg, v => { current = +v; render(); });
  }

  /* ---------- Reveal on scroll ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    const items = $$('.case-hero .wrap > *, .prose section > *, .case-next');
    items.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    items.forEach((el, i) => {
      if (el.closest('.case-hero')) el.style.setProperty('--d', `${Math.min(i, 6) * 60}ms`);
      io.observe(el);
    });
  }
})();
