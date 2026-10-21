(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------- Spec diagram: authored at 560×500, scale down to fit ---------- */
  const box = $('.diagram-box');
  const diagram = $('.diagram');
  // Up to 560px the diagram is reflowed into a column (styles.css): scaled down it would leave 5–6px captions
  const stacked = matchMedia('(max-width: 560px)');
  const fit = () => {
    if (stacked.matches) { diagram.style.transform = ''; box.style.height = ''; return; }
    const s = Math.min(1, box.clientWidth / 560);
    diagram.style.transform = s < 1 ? `scale(${s})` : '';
    box.style.height = `${500 * s}px`;
  };
  new ResizeObserver(fit).observe(box);
  stacked.addEventListener('change', fit);

  /* ---------- Console line: types the latest event ---------- */
  const consoleEl = $('[data-console]');
  let typing;
  const log = text => {
    clearInterval(typing);
    if (reduceMotion) { consoleEl.textContent = text; return; }
    let i = 0;
    consoleEl.textContent = '';
    typing = setInterval(() => {
      consoleEl.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typing);
    }, 18);
  };

  /* ---------- Unit photo: violet dither ↔ colour photo ---------- */
  const photo = $('.unit-photo');
  const img = $('.photo-img');
  const canvas = $('.photo-dither');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const pixelInput = $('[data-pixel]');
  const contrastInput = $('[data-contrast]');
  const human = $('[data-human]');
  const out = name => $(`[data-out="${name}"]`);

  // Dark → light steps of the accent ramp (violet)
  const PALETTE_VARS = ['--dither-0', '--accent-900', '--accent-600', '--accent-300', '--accent-50'];
  const hexToRgb = h => { const n = parseInt(h.trim().slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const palette = () => { const cs = getComputedStyle(root); return PALETTE_VARS.map(v => hexToRgb(cs.getPropertyValue(v))); };
  const GAMMA = 1.35; // keeps skin tones out of the lightest level so the face stays readable

  const renderDither = () => {
    if (!img.complete || !img.naturalWidth) return;
    const px = +pixelInput.value;
    const w = Math.round(240 / px), h = Math.round(300 / px);
    canvas.width = w; canvas.height = h;

    // object-fit: cover crop
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale, sh = h / scale;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h);
    const d = data.data;
    const c = +contrastInput.value * 2.55;
    const f = (259 * (c + 255)) / (255 * (259 - c));
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const l = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      lum[i] = f * (255 * (l / 255) ** GAMMA - 128) + 128;
    }
    // Floyd–Steinberg to the palette levels
    const PALETTE = palette();
    const levels = PALETTE.length - 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const old = Math.min(255, Math.max(0, lum[i]));
        const q = Math.round((old / 255) * levels);
        const err = old - (q / levels) * 255;
        const [r, g, b] = PALETTE[q];
        d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
        if (x + 1 < w) lum[i + 1] += err * 7 / 16;
        if (y + 1 < h) {
          if (x > 0) lum[i + w - 1] += err * 3 / 16;
          lum[i + w] += err * 5 / 16;
          if (x + 1 < w) lum[i + w + 1] += err / 16;
        }
      }
    }
    ctx.putImageData(data, 0, 0);
  };

  // Stages: empty (placeholder, as in the Figma prototype) → final (colour photo) → preview (dither, via Advanced)
  const phone = matchMedia('(max-width: 720px)');
  const LABELS = { empty: 'Загрузить фото', preview: 'Вернуть цветное фото', final: 'Открыть настройки дизеринга' };
  const label = stage => stage === 'final' && phone.matches ? 'Переключить на дизеринг' : LABELS[stage];
  const helpClick = $('[data-help-click]');
  const touch = matchMedia('(hover: none)');
  const setStage = stage => {
    photo.dataset.stage = stage;
    photo.setAttribute('aria-label', label(stage));
    if (helpClick) helpClick.textContent = `${touch.matches ? 'Нажмите на фото' : 'Клик по фото'} — ${label(stage).toLowerCase()}`;
    $('[data-photo-mode]').textContent = stage === 'final' ? 'Final' : 'Preview';
  };

  const applyHuman = () => {
    const h = +human.value;
    canvas.style.opacity = String(1 - h / 100);
    out('human').textContent = `${h}%`;
    if (photo.dataset.stage !== 'empty') setStage(h >= 50 ? 'final' : 'preview');
  };

  // The photo is fetched only when the visitor asks for it
  let loading;
  const loadPhoto = () => loading ||= new Promise(resolve => {
    photo.classList.add('is-loading');
    $('[data-load-text]').textContent = 'loading human.webp';
    const done = () => { photo.classList.remove('is-loading'); renderDither(); resolve(); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', () => {
      photo.classList.remove('is-loading');
      $('[data-load-text]').textContent = 'human.webp not found';
      loading = null;
    }, { once: true });
    img.src = img.dataset.src;
    // A request cut off on the way (leaving the page mid-load, a flaky network) never fires «load»: ask again once
    setTimeout(() => { if (!(img.complete && img.naturalWidth)) img.src = `${img.dataset.src}?retry=${Date.now()}`; }, 8000);
  });
  // First stage after the placeholder is the plain colour photo
  const ensureLoaded = async () => {
    if (photo.dataset.stage !== 'empty') return;
    await loadPhoto();
    human.value = 100;
    setStage('final');
    applyHuman();
    scan();
    log('> load("human.webp") · color · 240×300');
  };

  let anim;
  const animateHuman = (to, duration = 700) => {
    cancelAnimationFrame(anim);
    const from = +human.value;
    if (reduceMotion) { human.value = to; applyHuman(); return; }
    const t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / duration);
      const e = p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      human.value = Math.round(from + (to - from) * e);
      applyHuman();
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };

  const scan = () => {
    if (reduceMotion) return;
    photo.classList.remove('is-scanning');
    void photo.offsetWidth;
    photo.classList.add('is-scanning');
  };
  photo.addEventListener('animationend', () => photo.classList.remove('is-scanning'));

  photo.addEventListener('click', () => {
    const stage = photo.dataset.stage;
    if (stage === 'empty') { ensureLoaded(); return; }
    if (stage === 'final' && phone.matches) {
      // On a phone the inspector stays as it is: a tap simply switches the photo to dither (the next tap brings colour back)
      renderDither();
      scan();
      animateHuman(0);
      log('> dither.render()');
      return;
    }
    if (stage === 'final') {
      // Pixelation lives in Advanced: open it and point there
      if (inspector.hasAttribute('data-collapsed')) collapseBtn.click();
      setAdvanced(true);
      advBody.classList.remove('is-hinted'); void advBody.offsetWidth; advBody.classList.add('is-hinted');
      log('> hint: crank Advanced → Pixel size / Contrast');
      return;
    }
    scan();
    animateHuman(100);
    log('> layer.render("color")');
  });

  // Touching the dither settings pixelates the photo
  const toDither = async () => {
    await ensureLoaded();
    renderDither();
    if (+human.value > 0 && photo.dataset.stage !== 'preview') animateHuman(0, 400);
  };
  pixelInput.addEventListener('input', () => { out('pixel').textContent = pixelInput.value; toDither(); });
  pixelInput.addEventListener('change', () => log(`> dither.pixel_size = ${pixelInput.value}`));
  contrastInput.addEventListener('input', () => { out('contrast').textContent = contrastInput.value; toDither(); });
  contrastInput.addEventListener('change', () => log(`> dither.contrast = ${contrastInput.value}`));
  human.addEventListener('input', () => { cancelAnimationFrame(anim); ensureLoaded().then(applyHuman); });
  human.addEventListener('change', () => log(`> layer.human = ${human.value}%`));

  setStage('empty');
  applyHuman();

  /* ---------- Callouts: hovering lights up the matching anchor ---------- */
  $$('.callout').forEach(c => {
    const conn = $(`.connector[data-c="${c.dataset.c}"]`);
    c.addEventListener('mouseenter', () => conn.classList.add('is-hot'));
    c.addEventListener('mouseleave', () => conn.classList.remove('is-hot'));
  });

  /* ---------- Boot sequence ----------
     A selection frame with handles starts around the whole screen and collapses
     onto the unit photo, like selecting a layer in Figma. Then the unit comes online. */
  const status = $('[data-status]');
  $$('.callout, .connector').forEach(c => c.style.setProperty('--i', c.dataset.c));

  const goOnline = () => {
    status.classList.remove('is-booting');
    renderStatus();
    log('> unit EM-8+ online · ready for complex problems');
  };
  /* Two blocks, started independently:
     1. Intro — the selection frame collapses onto the unit photo. Once, on the first visit (boot below).
     2. Photo — the colour photo appears in the frame. On every visit, as soon as the unit is on screen
        (after the intro lands, if it plays; later, if the visitor scrolled away first).
     On the first visit block 2 goes on with a short demo: colour → dither → colour, so the visitor sees
     what the photo does and never has to work out how to bring it back. Touching the playground skips the demo.
     ?intro in the address replays everything — the intro frame and the demo — for checking. */
  const replay = new URLSearchParams(location.search).has('intro');
  const demoAllowed = replay || !store.get('em-photo-demo');
  const demo = [];
  // Once the visitor steps in, the demo never starts (not even after the intro lands),
  // and the colour photo comes up on its own instead of waiting for a click
  let demoStopped = false;
  const stopDemo = () => {
    if (demoStopped) return;
    demoStopped = true;
    demo.forEach(clearTimeout); demo.length = 0; store.set('em-photo-demo', '1');
    if (!diagram.classList.contains('is-booting')) ensureLoaded();
  };
  const later = (ms, fn) => { if (!demoStopped) demo.push(setTimeout(fn, ms)); };
  // Block 2: waits until the photo is actually on screen (on phones it sits below the fold), then shows it.
  // Not tied to the demo timers: whatever the visitor does, the photo appears
  let revealArmed = false;
  const armReveal = delay => {
    if (revealArmed) return;
    revealArmed = true;
    if (reduceMotion || !('IntersectionObserver' in window)) { ensureLoaded(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(revealPhoto, delay);
    }, { threshold: .6 });
    io.observe(photo);
  };
  // Any touch of the playground (diagram, inspector, behaviour, help) hands control to the visitor
  $$('.hero .diagram-box, .hero .hero-side').forEach(el => {
    el.addEventListener('pointerdown', stopDemo);
    el.addEventListener('keydown', stopDemo);
  });
  // Back/forward cache: Chrome restores the page exactly as it was left — even with no-store. A photo request that
  // leaving cut off stays pending forever, and a photo that never got its turn would never get one: restart both
  addEventListener('pageshow', e => {
    if (!e.persisted || photo.dataset.stage !== 'empty') return;
    if (loading && !(img.complete && img.naturalWidth)) {
      loading = null;
      photo.classList.remove('is-loading');
      $('[data-load-text]').textContent = 'load human.webp';
    }
    revealArmed = false;
    armReveal(300);
  });
  const revealPhoto = async () => {
    if (photo.dataset.stage !== 'empty') return; // already shown (the visitor clicked it, or touched the playground)
    // Scrolled away during the delay (a header link, say): show it when it is back in view, not off screen
    const r = photo.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { revealArmed = false; armReveal(800); return; }
    await ensureLoaded();
    if (!demoAllowed || demoStopped) return; // later visits: just the photo
    store.set('em-photo-demo', '1');
    later(2600, () => {
      renderDither();
      scan();
      animateHuman(0, 900);
      log('> demo: dither.render() · pixel_size = 2');
    });
    later(5200, () => {
      scan();
      animateHuman(100, 900);
      log('> demo: layer.render("color") · your turn — click the photo');
      demo.length = 0;
    });
  };
  const land = () => {
    diagram.classList.remove('is-booting');
    diagram.classList.add('is-landed');
    setTimeout(scan, 450);
    setTimeout(goOnline, 1100);
    setTimeout(() => diagram.classList.remove('is-landed'), 2000);
    armReveal(1800); // right after «online» (1.1 s) and the callouts settle
  };

  const boot = () => {
    const sel = $('.unit-photo .selection');
    const to = sel.getBoundingClientRect();
    const inView = to.width > 0 && to.top >= 0 && to.top + to.height * .6 <= innerHeight;
    // The intro plays once: on the first visit only (or with ?intro)
    if (reduceMotion || !inView || (store.get('em-booted') && !replay)) {
      goOnline();
      armReveal(demoAllowed ? 1500 : 300);
      return;
    }
    store.set('em-booted', '1');

    status.classList.add('is-booting');
    status.textContent = 'booting';
    diagram.classList.add('is-booting');

    const frame = document.createElement('div');
    frame.className = 'boot-select';
    frame.setAttribute('aria-hidden', 'true');
    frame.innerHTML = '<i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i><span class="size"></span><span class="boot-text"><span class="boot-lines"><span>PORTFOLIO · EM-8+</span><span>open portfolio.fig</span></span></span>';
    document.body.append(frame);

    // Document coordinates, so a scroll during the animation doesn't break the landing
    // clientWidth/Height exclude the scrollbar, so the frame never pushes out a horizontal scroll
    const sx = scrollX, sy = scrollY, pad = 6;
    const vw = root.clientWidth, vh = root.clientHeight;
    const from = { left: sx + pad, top: sy + pad, width: vw - pad * 2, height: vh - pad * 2 };
    const end = { left: sx + to.left, top: sy + to.top, width: to.width, height: to.height };
    const px = r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, `${v}px`]));

    const anim = frame.animate([px(from), px(end)], {
      duration: 1150, delay: 350, easing: 'cubic-bezier(.75, 0, .15, 1)', fill: 'both',
    });

    // Size label counts down from the screen size to the layer size
    const size = $('.size', frame);
    // Scale the lines, not the frame-sized box around them: a scaled full-width box widens the page
    const bootText = $('.boot-lines', frame);
    const W0 = vw, H0 = vh;
    const tick = () => {
      const p = anim.effect.getComputedTiming().progress ?? 0;
      size.textContent = `${Math.round(W0 + (240 - W0) * p)} × ${Math.round(H0 + (300 - H0) * p)}`;
      // Caption shrinks with the frame: code (14px) → code-sm (10px)
      bootText.style.transform = `scale(${1.4 - 0.4 * p})`;
      // Keep the label inside the frame while there is no room below it
      size.classList.toggle('is-inside', frame.getBoundingClientRect().bottom + 32 > innerHeight);
      if (anim.playState !== 'finished') requestAnimationFrame(tick);
    };
    tick();

    anim.finished.then(() => {
      size.textContent = '240 × 300';
      // The placeholder underneath has the same fill, so dropping ours is seamless
      // and lets the two captions cross-fade line by line.
      frame.style.background = 'transparent';
      [...bootText.children].forEach((line, i) => line.animate(
        [{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
         { opacity: 0, transform: 'translateY(-6px)', filter: 'blur(3px)' }],
        { duration: 320, delay: i * 70, easing: 'cubic-bezier(.4, 0, .6, 1)', fill: 'forwards' },
      ));
      land();
      // The real selection is already in place underneath; hand over to it
      frame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 520, fill: 'forwards' })
        .finished.then(() => frame.remove());
    });
  };
  // Wait for layout (fonts can shift the hero) before measuring the target
  (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(boot));

  /* ---------- Inspector ---------- */
  const inspector = $('.inspector');
  const collapseBtn = $('[data-collapse]');
  $('.inspector-head').addEventListener('click', e => {
    if (inspector.hasAttribute('data-collapsed') && !e.target.closest('button')) collapseBtn.click();
  });
  collapseBtn.addEventListener('click', () => {
    const collapsed = inspector.toggleAttribute('data-collapsed');
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.setAttribute('aria-label', collapsed ? 'Развернуть инспектор' : 'Свернуть инспектор');
  });
  // Wherever the side panels wrap under the hero (up to 1360px) the inspector starts folded,
  // so the hero ends sooner and the cases are not pushed a screen down; one click unfolds it
  // A phone shows the trimmed inspector (Layer, Appearance) open: it is short and holds the scheme switch
  if (matchMedia('(max-width: 1360px)').matches && !stacked.matches) collapseBtn.click();

  const advBtn = $('.adv-row');
  const advBody = $('#adv-body');
  // Phone: Advanced lives on the photo itself, the inspector keeps only Layer and Appearance
  const photoAdv = $('[data-photo-adv]');
  const photoAdvBtn = $('.photo-adv-btn', photoAdv);
  const setAdvanced = open => {
    advBtn.setAttribute('aria-expanded', String(open));
    photoAdvBtn.setAttribute('aria-expanded', String(open));
    advBody.hidden = !open;
  };
  const toggleAdvanced = () => setAdvanced(advBody.hidden);
  advBtn.addEventListener('click', toggleAdvanced);
  photoAdvBtn.addEventListener('click', toggleAdvanced);
  const placeAdvanced = () => {
    if (stacked.matches) photoAdv.append(advBody);
    else advBtn.after(advBody);
  };
  placeAdvanced();
  stacked.addEventListener('change', placeAdvanced);

  const callouts = $('[data-callouts]');
  const calloutsToggle = $('[data-toggle-callouts]');
  calloutsToggle.addEventListener('change', () => {
    callouts.hidden = !calloutsToggle.checked;
    log(`> config.spec_callouts = ${calloutsToggle.checked}`);
  });
  const consoleToggle = $('[data-toggle-console]');
  consoleToggle.addEventListener('change', () => { consoleEl.hidden = !consoleToggle.checked; });

  /* Scheme: Default · Accent · Inverse */
  const schemeBtns = $$('[data-scheme]', $('.segmented'));
  const setScheme = (scheme, quiet) => {
    if (scheme === 'default') delete root.dataset.scheme; else root.dataset.scheme = scheme;
    schemeBtns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.scheme === scheme)));
    store.set('em-scheme', scheme);
    renderDither();
    if (!quiet) log(`> appearance.scheme = "${scheme}"`);
  };
  schemeBtns.forEach(b => b.addEventListener('click', () => setScheme(b.dataset.scheme)));
  $('.segmented').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = schemeBtns.indexOf(document.activeElement);
    const next = schemeBtns[(i + (e.key === 'ArrowRight' ? 1 : -1) + schemeBtns.length) % schemeBtns.length];
    next.focus(); setScheme(next.dataset.scheme);
  });
  setScheme(root.dataset.scheme || 'default', true);

  $$('[data-reset]').forEach(b => b.addEventListener('click', () => {
    setScheme('default', true);
    pixelInput.value = 2; out('pixel').textContent = '2';
    contrastInput.value = 0; out('contrast').textContent = '0';
    renderDither();
    cancelAnimationFrame(anim);
    human.value = 0;
    setStage('empty');
    applyHuman();
    if (img.complete && img.naturalWidth) $('[data-load-text]').textContent = 'load human.webp';
    calloutsToggle.checked = true; callouts.hidden = false;
    consoleToggle.checked = true; consoleEl.hidden = false;
    setAdvanced(false);
    resetBehaviour(true);
    scan();
    log('> unit.reset() · factory settings');
  }));

  /* ---------- Behaviour ----------
     Each switch owns one part of the diagram. One render pass reads all of them,
     so effects never overwrite each other and quick toggling stays consistent. */
  const note = $('.behaviour-note');
  const beh = Object.fromEntries($$('[data-beh]').map(cb => [cb.dataset.beh, cb]));
  const CORE = ['ask', 'question', 'talk']; // only these three set the unit status
  const BEH = {
    ask: { key: 'ask_why', warn: 'Симптом устранён. Причина осталась.' },
    question: { key: 'question_requirements', warn: 'Добавили ещё одну функцию. На всякий случай.' },
    talk: { key: 'talk_to_users', warn: 'Пользователям точно понравится. Наверное.' },
    pop: { key: 'make_it_pop', note: 'Сделаю понятнее. Ярче — только если это поможет пользователю.' },
    coffee: { key: 'give_coffee', note: 'Спасибо! Работаем дальше ☕' },
  };
  const on = k => beh[k].checked;
  const callout = n => $(`.callout[data-c="${n}"]`);
  const connector = n => $(`.connector[data-c="${n}"]`);
  const askBadge = $('[data-beh-ask]');
  const questionBadge = $('[data-beh-question]');
  const research = $('[data-beh-research]');
  const RESEARCH = research.innerHTML;
  const setBadge = (el, text, tone) => {
    el.textContent = text;
    el.classList.remove('badge--brand', 'badge--neutral', 'badge--success', 'badge--warning', 'badge--error');
    el.classList.add(`badge--${tone}`);
  };

  // Unit status: all three on → online, one off → needs attention, two or three → unstable
  const unitStatus = () => {
    const off = CORE.filter(k => !on(k)).length;
    return off === 0 ? 'online' : off === 1 ? 'needs attention' : 'unstable';
  };
  const STATUS_TONE = { online: 'success', 'needs attention': 'warning', unstable: 'error' };
  let coffeeTimer = 0;
  function renderStatus() {
    if (coffeeTimer || status.classList.contains('is-booting')) return;
    const s = unitStatus();
    setBadge(status, s, STATUS_TONE[s]);
  }
  // Coffee: «Caffeine +1» for a moment, then whatever the status really is
  const brewCoffee = () => {
    if (status.classList.contains('is-booting')) return;
    clearTimeout(coffeeTimer);
    setBadge(status, 'Caffeine +1', 'brand');
    if (!reduceMotion) status.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: .35 }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    coffeeTimer = setTimeout(() => { coffeeTimer = 0; renderStatus(); }, 1800);
  };
  // Make it pop: a short glow and a thicker frame, settling into a slightly stronger accent
  let popAnim;
  const popPhoto = () => {
    if (reduceMotion) return;
    popAnim?.cancel();
    const c = getComputedStyle(root).getPropertyValue('--accent-600').trim();
    popAnim = $('.selection', photo).animate([
      { boxShadow: `0 0 0 0 ${c}00`, borderWidth: '1.5px' },
      { boxShadow: `0 0 20px 4px ${c}73`, borderWidth: '3px', offset: .35 },
      { boxShadow: `0 0 10px 1px ${c}33`, borderWidth: '2px' },
    ], { duration: 900, easing: 'ease-out' });
  };

  const applyBehaviour = () => {
    // Ask why → COMPLEX PROBLEMS: symptoms only, warning line
    setBadge(askBadge, on('ask') ? 'enabled' : 'symptoms only', on('ask') ? 'brand' : 'warning');
    connector(4).classList.toggle('is-warn', !on('ask'));
    // Question requirements → OVER-ENGINEERING switches on, in warning colour
    setBadge(questionBadge, on('question') ? 'disabled' : 'enabled', on('question') ? 'neutral' : 'warning');
    callout(5).classList.toggle('is-warn', !on('question'));
    connector(5).classList.toggle('is-warn', !on('question'));
    // Talk to users → RESEARCH MODULE runs on assumptions: a warning badge like the other states, the key fades
    research.innerHTML = on('talk') ? RESEARCH : '<span class="badge badge--warning">assumptions only</span>';
    callout(2).classList.toggle('is-dim', !on('talk'));
    connector(2).classList.toggle('is-dim', !on('talk'));
    photo.classList.toggle('is-pop', on('pop'));
    // The caption of each main switch sits under its heading on the diagram
    CORE.forEach(k => {
      const el = $(`[data-beh-note="${k}"]`);
      const show = !on(k);
      if (show && el.hidden && !reduceMotion) el.animate([{ opacity: 0, transform: 'translateY(-2px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
      el.textContent = BEH[k].warn;
      el.hidden = !show;
    });
    renderStatus();
  };
  /* The note is one fixed two-line area for the jokes (Make it pop, Give coffee): the latest replaces the previous.
     The main switches speak on the diagram itself, under their headings. */
  const HINT = 'Снимите галочку — схема покажет последствия.';
  const message = k => (BEH[k].note && on(k) && BEH[k].note) || '';
  let order = []; // switches in the order they were touched
  const showNote = touched => {
    if (touched) order = [...order.filter(k => k !== touched), touched];
    const k = [...order].reverse().find(message);
    const text = k ? message(k) : HINT;
    if (note.textContent === text) return;
    note.textContent = text;
    note.classList.toggle('is-hint', !k);
    if (!reduceMotion) note.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  };
  // One short line for the whole state: what differs from the defaults, and the status
  const SHORT = { ask: 'ask', question: 'req', talk: 'users', pop: 'pop', coffee: 'coffee' };
  const logBehaviour = () => {
    const diff = Object.keys(BEH).filter(k => on(k) !== CORE.includes(k)).map(k => `${on(k) ? '+' : '−'}${SHORT[k]}`);
    log(`> behaviour ${diff.length ? diff.join(' ') : '· all checks on'} → ${unitStatus()}`);
  };
  Object.entries(beh).forEach(([k, cb]) => cb.addEventListener('change', () => {
    stopDemo();
    applyBehaviour();
    showNote(k);
    if (cb.checked && k === 'pop') popPhoto();
    if (cb.checked && k === 'coffee') brewCoffee();
    logBehaviour();
  }));
  function resetBehaviour(quiet) {
    Object.entries(beh).forEach(([k, cb]) => { cb.checked = CORE.includes(k); });
    clearTimeout(coffeeTimer); coffeeTimer = 0;
    popAnim?.cancel();
    order = [];
    applyBehaviour();
    showNote();
    if (!quiet) log('> behaviour.reset() · status: online');
  }
  $('[data-beh-reset]').addEventListener('click', () => resetBehaviour());
  applyBehaviour(); // the browser may restore checkbox states on reload
  showNote(Object.keys(BEH).find(message));

  // Touch screens have no hover: the short help stays open there
  if (touch.matches) $('.help').open = true;

  /* ---------- Case tracks: drag to scroll with a mouse ---------- */
  $$('.track').forEach(track => {
    let startX = 0, startLeft = 0, moved = false, down = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        // Let scroll-snap settle the card after the drag
        requestAnimationFrame(() => track.classList.remove('is-dragging'));
      }
    });
    track.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);

    // Arrows: one card per click; disabled at the ends, hidden when the row fits
    const nav = track.closest('.case-group')?.querySelector('.track-nav');
    const [prev, next] = nav ? $$('.track-btn', nav) : [];
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = track.scrollLeft >= max - 4;
      track.classList.toggle('is-end', atEnd);
      if (!nav) return;
      nav.toggleAttribute('data-fits', max <= 4);
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = atEnd;
    };
    nav?.addEventListener('click', e => {
      const btn = e.target.closest('.track-btn');
      if (!btn) return;
      const card = track.querySelector('.case-card');
      const step = card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
      track.scrollBy({ left: step * +btn.dataset.dir, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    track.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(track);
  });

  /* ---------- «Сработаемся?» ----------
     portfolio_match_interactive_spec.md: every chip is a toggle; remote / hybrid / office exclude each other.
     The result is checked top-down, the first matching state wins:
     nothing → all → office → AI easter egg → something to discuss → match.
     Not a rating: «110%» is a joke, and missing company conditions never make the answer worse. */
  const matchChips = $$('.match-choices .chip');
  if (matchChips.length) {
    const title = $('[data-match-title]');
    const text = $('[data-match-text]');
    const card = $('.match-card');
    const reset = $('[data-match-reset]');
    const kind = (c, k) => (c.dataset.kind || '').split(' ').includes(k);
    const on = c => c.getAttribute('aria-pressed') === 'true';
    const states = {
      empty: ['Проверим совместимость?', 'Здесь появится ответ, как только вы отметите первый вариант.'],
      match: ['Похоже, мы подходим друг другу', 'Если у вас есть задачи, с которыми я могу помочь, пишите.'],
      discuss: ['Давайте обсудим', 'Есть несколько моментов, которые лучше уточнить. Расскажите подробнее о задачах.'],
      office: ['Давайте обсудим', 'Всё зависит от того, где находится офис. И немного от того, что в нём происходит.'],
      vibe: ['Похоже, мы подходим друг другу', 'Могу навайбкодить в том числе. Но от хорошей команды не откажусь.'],
      all: ['110%', 'Кажется, мы вышли в стратосферу.'],
    };
    const result = () => {
      const picked = matchChips.filter(on);
      if (!picked.length) return 'empty';
      const formats = picked.filter(c => kind(c, 'format')).length;
      if (formats === 1 && matchChips.filter(c => !kind(c, 'format')).every(on)) return 'all';
      if (picked.some(c => kind(c, 'office'))) return 'office';
      if (picked.some(c => kind(c, 'vibe'))) return 'vibe';
      if (picked.some(c => kind(c, 'discuss'))) return 'discuss';
      return 'match';
    };
    let last = 'empty';
    const update = () => {
      const state = result();
      reset.hidden = state === 'empty';
      card.dataset.state = state;
      if (state === last) return;
      last = state;
      [title.textContent, text.textContent] = states[state];
      if (!reduceMotion) card.animate([{ opacity: .4, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2, .7, .2, 1)' });
    };
    matchChips.forEach(c => c.addEventListener('click', () => {
      const next = !on(c);
      // Work formats exclude each other
      if (next && kind(c, 'format')) matchChips.filter(x => x !== c && kind(x, 'format')).forEach(x => x.setAttribute('aria-pressed', 'false'));
      c.setAttribute('aria-pressed', String(next));
      update();
    }));
    reset.addEventListener('click', () => {
      matchChips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      update();
      matchChips[0].focus();
    });
    update();
  }

  /* ---------- Reveal on scroll ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    const groups = ['.section-head', '.about-text', '.case-group', '.all-projects', '.step', '.timeline-entry', '.environments', '.match-col > *', '.case-cta-text', '.case-cta-actions'];
    const items = $$(groups.join(','));
    // Stagger siblings that share a parent
    items.forEach(el => {
      const sibs = [...el.parentElement.children].filter(s => items.includes(s));
      el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 70}ms`);
      el.classList.add('reveal');
    });
    const ro = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => ro.observe(el));
  }

  /* ---------- Header: highlight current section ----------
     The current section is the last one whose top has passed 40 % of the screen. Above the first one (the hero) nothing is lit;
     at the very bottom the last one (contacts) is lit, even though it is too short to ever reach that line */
  const sections = $$('.nav a').map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  let current;
  const highlight = () => {
    const doc = document.documentElement;
    const atBottom = scrollY + innerHeight >= doc.scrollHeight - 2;
    const id = (atBottom ? sections.at(-1) : sections.filter(s => s.getBoundingClientRect().top <= innerHeight * .4).at(-1))?.id;
    if (id === current) return;
    current = id;
    // The compact menu (menu.js) copies the same links: keep both in step
    $$('.nav a, .site-menu a').forEach(a => {
      if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; highlight(); }); } }, { passive: true });
  addEventListener('resize', highlight);
  highlight();
})();
