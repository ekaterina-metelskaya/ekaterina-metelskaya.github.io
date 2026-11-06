(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Fictional content: channels in the spirit of video creators ---------- */
  // Avatars are round, like channel pictures on video platforms. Without footage
  // they show a CSS still; with a clip (CLIPS below) they get a frame from an open movie.
  // genre: the “Genres” tab groups channels by it · locked: not in the viewer's subscription (opens the paywall)
  const GENRES = [
    { id: 'cinema', name: 'Movies', icon: '<path d="M3 6.5h14v9H3z"/><path d="M3 6.5l2.5-3h2.5l-2.5 3M8 6.5l2.5-3H13l-2.5 3M13 6.5l2.5-3H17"/>' },
    { id: 'series', name: 'Series', icon: '<rect x="2.5" y="4" width="15" height="10" rx="1.5"/><path d="M7 17h6M10 14v3"/>' },
    { id: 'docs', name: 'Documentaries', icon: '<circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/>' },
    { id: 'kids', name: 'Animation', icon: '<circle cx="10" cy="11" r="5.5"/><circle cx="5" cy="5" r="2.2"/><circle cx="15" cy="5" r="2.2"/><path d="M8 12.5c1 1 3 1 4 0"/>' },
    { id: 'sport', name: 'Sports', icon: '<circle cx="10" cy="10" r="7"/><path d="M10 6.5l3.3 2.4-1.3 3.9H8l-1.3-3.9z"/>' },
  ];
  const CHANNELS = [
    { n: 7, name: 'Night City', handle: '@nightcity', scene: 'neon', genre: 'cinema',
      shows: ['Night Express', 'Lights After Midnight', 'Sleepless City', 'Neon Chronicles', 'The Last Tram', 'Street Stories', 'Short Film', 'Midnight on Film', 'Neighborhood Chronicles', 'Night Broadcast'] },
    { n: 8, name: 'Northern Lights', handle: '@nordlight', scene: 'ice', genre: 'series',
      shows: ['The Station “Polar”', 'Series “Northern Wind”, 4 episode', 'Series “Northern Wind”, 5 episode', 'Ice and Steel', 'The Glow', 'Wintering', 'Series “Northern Wind”, 6 episode', 'Map of the Cold', 'Drift', 'White Silence'] },
    { n: 9, name: 'Film Frame', handle: '@kinokadr', scene: 'dusk', genre: 'cinema',
      shows: ['Film “City at Sunset”', 'Behind the Scenes of “Neon”', 'Series “City at Sunset”, 1 episode', 'Shot Breakdown', 'Series “City at Sunset”, 2 episode', 'Premiere. Film “The Station”', 'Director’s Cut', 'Series “City at Sunset”, 3 episode', 'Behind the Camera', 'Late-Night Screening'] },
    { n: 10, name: 'The Road', handle: '@roadmovie', scene: 'desert', genre: 'docs', locked: true,
      shows: ['Road South', 'Route 66 Kilometers', 'Dust and Wind', 'Film “Two Sisters”', 'Fellow Travelers', 'Freeze Frame', 'Road South. Final', 'Highway', 'Sunset on the Road', 'Route Map'] },
    { n: 11, name: 'The Lab', handle: '@thelab', scene: 'lab', genre: 'docs',
      shows: ['Science at Night', 'How Memory Works', 'Robots Among Us', 'Experiments', 'The Lab. Episode 12', 'Tomorrow Today', 'Machines and People', 'Code and Hardware', 'Experiment', 'Ask a Scientist'] },
    { n: 12, name: 'Misty Mountains', handle: '@mistypeaks', scene: 'fog', genre: 'series',
      shows: ['Mountains in the Mist', 'Series “The Fog”, 1 episode', 'Quiet Sounds', 'Series “The Fog”, 2 episode', 'Birds and Bells', 'Bedtime Stories', 'Series “The Fog”, 3 episode', 'The Trail', 'Voices of the Forest', 'Before Dawn'] },
    { n: 13, name: 'Cartoon Friday', handle: '@multfriday', scene: 'meadow', genre: 'kids',
      shows: ['Animated film “Firefly Island”', 'Spring Forest', 'Animated film “The Llama and the Mountains”', 'The Rabbit and the Butterflies', 'Animated film “Firefly Island”, 2', 'Let’s Draw', 'The Dragon and the Girl', 'Fairy Patrol', 'Animated film “The Rabbit”', 'Lullaby'] },
    { n: 14, name: 'Arena', handle: '@arena', scene: 'lab', genre: 'sport', locked: true,
      shows: ['Football: Matchday Highlights', 'Tennis Final', 'Morning Warm-up', 'Basketball Playoffs', 'Hockey Highlights', 'Sports News', 'Football Live', 'Cycling: Stage 5', 'Boxing: Champions Night', 'Today’s Highlights'] },
  ];
  const SCENES = ['dusk', 'neon', 'ice', 'lab', 'desert', 'fog', 'meadow'];
  // One broadcast grid for all channels; "now" is 12:40 today
  const SLOTS = ['06:30', '07:15', '08:40', '10:15', '11:15', '12:15', '13:00', '15:00', '16:30', '18:00', '19:30'];
  const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
  const NOW = toMin('12:40');
  // Archive: 14 days back; the programme is published 2 days ahead
  const ARCHIVE_DAYS = 14, AHEAD_DAYS = 2;
  const TODAY = ARCHIVE_DAYS;
  const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS = Array.from({ length: ARCHIVE_DAYS + 1 + AHEAD_DAYS }, (_, i) => {
    const d = new Date(2025, 4, 15 + i - ARCHIVE_DAYS);
    const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    const off = i - TODAY;
    const near = Math.abs(off) <= 1;
    return { short: WEEK[d.getDay()], date, near, label: off === 0 ? 'Today' : off === -1 ? 'Yesterday' : off === 1 ? 'Tomorrow' : WEEK[d.getDay()] };
  });
  // Footage is the same for the same show (episodes of a series share it) and differs between shows:
  // 7 clips × 3 framings, picked by the show's name
  const hash = str => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const showKey = title => title.replace(/,?s*d+(s*серия)?$/i, '').replace(/.s*(Финал|Выпуск d+)$/i, '');
  const looksFor = title => { const h = hash(showKey(title)); return { scene: SCENES[h % SCENES.length], frame: (h >>> 3) % 3 }; };
  const programmeFor = (ci, day) => {
    const c = CHANNELS[ci];
    return SLOTS.slice(0, -1).map((t, i) => {
      const end = SLOTS[i + 1];
      const s = toMin(t), e = toMin(end);
      const state = day < TODAY ? 'rec' : day > TODAY ? 'next' : e <= NOW ? 'rec' : s <= NOW ? 'live' : 'next';
      const title = c.shows[(i + day * 3) % c.shows.length];
      const p = state === 'live' ? (NOW - s) / (e - s) : 0;
      return { t, end, s: s * 60, e: e * 60, day, title, state, ...looksFor(title), p, ci, id: `${ci}:${day}:${i}` };
    });
  };
  // A title that already has “” is not wrapped once more
  const quote = t => /[“”]/.test(t) ? t : `“${t}”`;
  const liveIndex = list => list.findIndex(p => p.state === 'live');
  const FILMS = [
    { title: 'City at Sunset', genre: 'Drama · 2024', scene: 'dusk', desc: 'An architect returns home to finish his father’s house and finds the city has changed more than he has.' },
    { title: 'Neon', genre: 'Thriller · 2025', scene: 'neon', free: true, desc: 'A night-shift taxi driver is the only witness to a disappearance no one has reported.' },
    { title: 'The Station', genre: 'Sci-fi · 2025', scene: 'ice', desc: 'A shift at a polar station is ending when an impossible signal arrives from orbit.' },
    { title: 'Synthesis', genre: 'Sci-fi · 2024', scene: 'lab', free: true, desc: 'An engineer reconstructs a memory from a neural map and finds memories that aren’t his.' },
    { title: 'Road South', genre: 'Road movie · 2023', scene: 'desert', desc: 'Two sisters drive across the desert toward the sea, hoping to settle an old family feud.' },
    { title: 'The Fog', genre: 'Mystery · 2025', scene: 'fog', desc: 'Sounds disappear from a mountain town: first the birds, then the bells, then people’s voices.' },
    { title: 'The Meadow', genre: 'Family · 2025', scene: 'meadow', desc: 'A friendly giant protects a forest clearing from three troublemakers, in his own inventive way.' },
  ];

  /* ---------- Footage: clips from open movies in assets/video/ ---------- */
  // Listed here, not fetched from a JSON file: a page opened from disk (file://) may not fetch its neighbours,
  // and the players then fell back to the CSS stills. A missing file still falls back (the error handler below)
  // The base comes from this script's own address, so it is the same on /cases/ and /en/cases/
  const CLIP_BASE = document.currentScript ? new URL('../assets/video/', document.currentScript.src).href : '../assets/video/';
  const CLIPS = Object.fromEntries(['dusk', 'desert', 'ice', 'fog', 'meadow', 'neon', 'lab'].map(k => [k, { video: `${k}.mp4`, poster: `${k}.jpg` }]));
  // Figures on screen: footage plays only there, so off-screen videos don't eat the CPU
  const onScreen = new Set();
  const shown = el => onScreen.has(el.closest('.fig'));
  // frame: 0 — the whole shot, 1/2 — a closer crop of its left/right part (different shows on one clip)
  const setScene = (el, scene, { video = false, frame = 0 } = {}) => {
    el.className = el.className.replace(/\bscene--\w+/g, '').trim() + ` scene--${scene}`;
    el.dataset.scene = scene;
    el.dataset.video = video ? '1' : '';
    el.dataset.frame = frame;
    paintClip(el);
  };
  // Pausing the player freezes its footage; the off-screen observer must not restart it
  const setPaused = (el, paused) => {
    el.toggleAttribute('data-paused', paused);
    const v = el.querySelector(':scope > video.scene-media');
    if (v) paused ? v.pause() : shown(el) && v.play().catch(() => {});
  };
  const paintClip = el => {
    const clip = CLIPS[el.dataset.scene];
    let v = el.querySelector(':scope > .scene-media');
    if (!clip) { v?.remove(); return; }
    const wantVideo = el.dataset.video === '1' && !reduceMotion && clip.video;
    const tag = wantVideo ? 'VIDEO' : 'IMG';
    if (!v || v.tagName !== tag) {
      v?.remove();
      v = document.createElement(tag);
      v.className = 'scene-media';
      v.alt = '';
      if (wantVideo) Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'metadata' });
      v.addEventListener('error', () => v.remove(), { once: true });
      el.prepend(v);
    }
    const src = CLIP_BASE + (wantVideo ? clip.video : clip.poster);
    if (v.getAttribute('src') !== src) {
      v.setAttribute('src', src);
      if (wantVideo) { v.poster = CLIP_BASE + clip.poster; if (shown(el) && !el.hasAttribute('data-paused')) v.play().catch(() => {}); }
    }
  };
  const paintAvatar = el => {
    const clip = CLIPS[el.dataset.avatar];
    if (clip?.poster) el.style.backgroundImage = `url("${CLIP_BASE}${clip.poster}")`;
  };
  const avatar = c => `<span class="avatar scene--${c.scene}" data-avatar="${c.scene}" style="${CLIPS[c.scene]?.poster ? `background-image:url('${CLIP_BASE}${CLIPS[c.scene].poster}')` : ''}" aria-hidden="true"></span>`;
  // Scenes written in the page itself (posters, the localization demo) get their frames right away
  $$('.scene[data-scene]').forEach(paintClip);
  $$('[data-avatar]').forEach(paintAvatar);
  // Pause footage that is off screen
  const media = new IntersectionObserver(entries => entries.forEach(e => {
    onScreen[e.isIntersecting ? 'add' : 'delete'](e.target);
    $$('video.scene-media', e.target).forEach(v => e.isIntersecting && !v.closest('[data-paused]') ? v.play().catch(() => {}) : v.pause());
  }));
  $$('.fig').forEach(f => media.observe(f));

  /* ---------- Clock: the demo day runs in real time from 12:40 ---------- */
  const born = Date.now();
  const clock = (withSec = true) => {
    const s = NOW * 60 + Math.floor((Date.now() - born) / 1000);
    const hh = String(Math.floor(s / 3600) % 24).padStart(2, '0');
    const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return withSec ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  };
  const fmt = sec => [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, Math.floor(sec % 60)].map(n => String(n).padStart(2, '0')).join(':');
  const bell = '<svg class="bell" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M4 11V7a4 4 0 018 0v4l1.2 1.5H2.8z"/><path d="M6.5 14a1.6 1.6 0 003 0"/></svg>';

  /* ---------- Scale fixed-size device screens to their boxes ---------- */
  const fitTo = (box, el, w, h) => {
    box.parentElement.classList.add('is-fit'); // drops the unscaled 960px fallback before measuring
    const s = Math.min(1, box.clientWidth / w);
    el.style.transform = `scale(${s})`;
    box.style.height = `${h * s}px`;
  };
  // Fit right away too: the observer's first callback can be late (background tabs)
  $$('[data-tv-box]').forEach(box => {
    const tv = $('.tv', box);
    fitTo(box, tv, 960, 540);
    new ResizeObserver(() => fitTo(box, tv, 960, 540)).observe(box);
  });
  // Phone: the column shows the whole screen as a preview; “Fullscreen” opens the demo large
  // (browser full screen and landscape where the phone allows, a fixed overlay otherwise, e.g. iPhone)
  $$('[data-tv-box]').forEach(box => {
    const wrap = box.closest('.tv-wrap');
    const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn--outline btn--sm tv-expand' });
    const hint = Object.assign(document.createElement('p'), { className: 'tv-expand-hint t-code-sm', textContent: 'Turn your phone sideways for a bigger view' });
    const isFull = () => wrap.classList.contains('is-expanded');
    const set = on => {
      wrap.classList.toggle('is-expanded', on);
      document.documentElement.classList.toggle('tv-expand-open', on);
      btn.textContent = on ? 'Collapse' : 'Fullscreen';
    };
    set(false);
    btn.addEventListener('click', async () => {
      if (isFull()) {
        set(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        return;
      }
      set(true);
      try { await wrap.requestFullscreen(); await screen.orientation.lock('landscape'); } catch {}
    });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isFull()) set(false); });
    box.closest('.tv-scroll').after(btn);
    wrap.append(hint);
  });
  const phoneBox = $('.phone-box');
  const phone = $('[data-phone]');
  const fitPhone = () => {
    const s = Math.min(.8, phoneBox.parentElement.clientWidth / 360);
    phone.style.transform = `scale(${s})`;
    phoneBox.style.width = `${360 * s}px`;
    phoneBox.style.height = `${780 * s}px`;
  };
  fitPhone();
  new ResizeObserver(fitPhone).observe(phoneBox.parentElement);

  /* =========================================================
     Phone: “Genres / TV guide”, archive days, live ↔ record in the top player, reminders, paywall
     ========================================================= */
  const phScene = $('[data-ph-scene]');
  const phMark = $('[data-ph-mark]');
  const phTime = $('[data-ph-time]');
  const phFill = $('[data-ph-fill]');
  const phTrack = $('.ph-track', phone);
  const phLive = $('[data-ph-golive]');
  const phPause = $('[data-ph-pause]');
  const phWall = $('[data-ph-paywall]');
  const phStatus = $('.ph-status span', phone);
  const genresPanel = $('[data-ph-panel="genres"]');
  const epgPanel = $('[data-ph-panel="epg"]');
  const phDays = $('[data-ph-days]');
  const phRows = $('[data-ph-rows]');
  const phToast = $('[data-ph-toast]');
  // The player plays a moment of the broadcast: a day + seconds since midnight.
  // At "now" it is “Live”; paused or rewound behind it — “Recording”, and “В эфир” brings it back.
  const ph = { ch: 2, day: TODAY, genre: null, posDay: TODAY, pos: 0, anchor: Date.now(), paused: false, shownId: null };
  const phReminders = new Set();
  const nowSec = () => NOW * 60 + (Date.now() - born) / 1000;
  const phPos = () => ph.paused ? ph.pos : ph.pos + (Date.now() - ph.anchor) / 1000;
  const seekTo = (day, sec) => Object.assign(ph, { posDay: day, pos: sec, anchor: Date.now() });
  const isLive = () => !ph.paused && ph.posDay === TODAY && nowSec() - phPos() < 1.5;
  const locked = () => !!CHANNELS[ph.ch].locked;
  const phCurrent = () => {
    const list = programmeFor(ph.ch, ph.posDay);
    const pos = phPos();
    return list.find(p => pos >= p.s && pos < p.e) ?? (pos < list[0].s ? list[0] : list.at(-1));
  };

  /* “Genres”: genres of channels → channels of the genre */
  const genreIcon = g => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${g.icon}</svg>`;
  const lock = '<svg class="lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>';
  const renderPhGenres = () => {
    const current = CHANNELS[ph.ch].genre;
    if (!ph.genre) {
      genresPanel.innerHTML = GENRES.map(g => `<button type="button" class="ph-genre${g.id === current ? ' is-on' : ''}" data-genre="${g.id}">
        ${genreIcon(g)}<span>${g.name}</span><small>${CHANNELS.filter(c => c.genre === g.id).length}</small>
      </button>`).join('');
      return;
    }
    const g = GENRES.find(x => x.id === ph.genre);
    genresPanel.innerHTML = `<button type="button" class="ph-genre-back" data-genre-back>${genreIcon(g)}<span>${g.name}</span><small>All genres</small></button>` +
      CHANNELS.map((c, i) => [c, i]).filter(([c]) => c.genre === g.id).map(([c, i]) => {
        const live = programmeFor(i, TODAY).find(p => p.state === 'live');
        return `<button type="button" class="ph-ch${i === ph.ch ? ' is-on' : ''}" data-i="${i}">
          ${avatar(c)}
          <span><span class="ph-name">${esc(c.name)}</span><br><span class="ph-sub${c.locked ? ' is-tariff' : ''}">${c.locked ? `${lock}Included with subscription` : `${esc(quote(live.title))}`}</span></span>
        </button>`;
      }).join('');
  };

  /* “TV guide”: 14 days of archive, today, 2 days ahead */
  phDays.innerHTML = DAYS.map((d, i) => `<button type="button" role="tab" aria-selected="${i === ph.day}" data-day="${i}">${d.label}<small>${d.near ? `${d.short}, ` : ''}${d.date}</small></button>`).join('');
  const renderPhEpg = () => {
    const cur = isLive() || locked() ? null : phCurrent();
    phRows.innerHTML = programmeFor(ph.ch, ph.day).map((p, i) => {
      const on = phReminders.has(p.id);
      const badge = p.state === 'rec' ? '<span class="ph-badge rec">Recording</span>' : p.state === 'live' ? '<span class="ph-badge live">Live</span>' : on ? '<span class="ph-badge bell-on">Reminder set</span>' : '';
      const cls = [p.state === 'live' && 'is-live', p.state === 'next' && 'is-future', on && 'is-reminded', cur?.id === p.id && 'is-playing'].filter(Boolean).join(' ');
      const label = p.state === 'next' ? ` aria-pressed="${on}" aria-label="${esc(p.title)}, ${p.t}: ${on ? 'cancel reminder' : 'remind me when it starts'}"` : '';
      return `<button type="button" class="ph-pr ${cls}" data-i="${i}"${label} style="--p:${(p.p * 100).toFixed(0)}%">
        <span class="ph-pr-time">${p.t} – ${p.end} ${badge}</span>
        <span class="ph-pr-title">${esc(p.title)}</span>
        ${p.state === 'next' ? bell : ''}
      </button>`;
    }).join('');
  };

  /* Player */
  const syncPause = () => {
    $('use', phPause).setAttribute('href', ph.paused ? '#i-play' : '#i-pause');
    phPause.setAttribute('aria-label', ph.paused ? 'Resume' : 'Pause');
  };
  let shownShow = null;
  const phTick = () => {
    phStatus.textContent = clock(false);
    if (locked()) return;
    // Can't run ahead of the broadcast
    if (ph.posDay === TODAY && phPos() > nowSec()) seekTo(TODAY, nowSec());
    const p = phCurrent();
    // The archive ends with the day's last show
    if (!ph.paused && phPos() >= p.e) { ph.pos = p.e - 1; ph.paused = true; setPaused(phScene, true); syncPause(); }
    const live = isLive();
    const t = fmt(phPos());
    phTime.innerHTML = live
      ? `${t} <span class="ph-state">● Live</span>`
      : `${t} <span class="ph-state is-rec">● Recording</span> ${DAYS[p.day].date} ${esc(quote(p.title))}`;
    phTrack.classList.toggle('is-record', !live);
    phFill.style.width = `${Math.min(100, (phPos() - p.s) / (p.e - p.s) * 100).toFixed(2)}%`;
    phLive.hidden = live;
    if (p.id !== shownShow) { setScene(phScene, p.scene, { video: true, frame: p.frame }); shownShow = p.id; }
    const key = `${p.id}:${live}`;
    if (key !== ph.shownId) { ph.shownId = key; renderPhEpg(); }
  };
  const setChannel = i => {
    ph.ch = i;
    const c = CHANNELS[i];
    phMark.innerHTML = `${avatar(c)}<span>${esc(c.name)}</span>`;
    phone.classList.toggle('is-locked', !!c.locked);
    phWall.hidden = !c.locked;
    ph.shownId = shownShow = null;
    // Not in the subscription: the channel's still under the paywall, nothing plays
    if (c.locked) { setScene(phScene, c.scene); phLive.hidden = true; }
  };
  const goLive = () => {
    seekTo(TODAY, nowSec());
    ph.paused = false;
    setPaused(phScene, false);
    syncPause();
    phTick();
    renderPhEpg();
  };
  const play = (day, sec) => {
    seekTo(day, sec);
    ph.paused = false;
    setPaused(phScene, false);
    syncPause();
    phTick();
  };
  let toastTimer;
  const phSay = text => {
    phToast.textContent = text;
    phToast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { phToast.hidden = true; }, 2200);
  };
  setChannel(ph.ch);
  renderPhGenres();
  goLive();
  setInterval(phTick, 1000);
  // Rows and panel share the phone as offset parent; keep one past show above the live one
  // Scroll so the show before the live one starts exactly under the sticky date tabs: no half-cut row peeks out
  // Scroll so a whole row starts exactly under the sticky date tabs — ideally the show before the live one.
  // Near the end of the day the list can't scroll that far: then take the nearest row boundary that it can reach
  const liveTop = () => {
    const live = $('.ph-pr.is-live', phRows); if (!live) return 0;
    const max = epgPanel.scrollHeight - epgPanel.clientHeight;
    const tops = [...phRows.children].map(r => r.offsetTop - epgPanel.offsetTop - phDays.offsetHeight);
    const want = (live.previousElementSibling || live).offsetTop - epgPanel.offsetTop - phDays.offsetHeight;
    return Math.max(0, ...tops.filter(t => t <= Math.min(want, max) + .5));
  };
  const dayIntoView = () => { const b = $(`[data-day="${ph.day}"]`, phDays); phDays.scrollLeft = b.offsetLeft - (phDays.clientWidth - b.offsetWidth) / 2; };
  epgPanel.scrollTop = liveTop();
  dayIntoView();
  // Fonts change the row heights: line the list up again once they are in
  document.fonts?.ready.then(() => { epgPanel.scrollTop = liveTop(); dayIntoView(); });

  $$('[data-ph-tab]').forEach(tab => tab.addEventListener('click', () => {
    $$('[data-ph-tab]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    const epg = tab.dataset.phTab === 'epg';
    epgPanel.hidden = !epg;
    genresPanel.hidden = epg;
    if (epg) dayIntoView();
  }));
  genresPanel.addEventListener('click', e => {
    const g = e.target.closest('[data-genre]');
    if (g) { ph.genre = g.dataset.genre; renderPhGenres(); genresPanel.scrollTop = 0; return; }
    if (e.target.closest('[data-genre-back]')) { ph.genre = null; renderPhGenres(); return; }
    const b = e.target.closest('.ph-ch');
    if (!b) return;
    setChannel(+b.dataset.i);
    renderPhGenres();
    if (locked()) renderPhEpg(); else goLive();
  });
  phDays.addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    ph.day = +b.dataset.day;
    $$('[data-day]', phDays).forEach(x => x.setAttribute('aria-selected', String(x === b)));
    renderPhEpg();
    dayIntoView();
    epgPanel.scrollTo({ top: liveTop(), behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  phRows.addEventListener('click', e => {
    const b = e.target.closest('.ph-pr');
    if (!b) return;
    const p = programmeFor(ph.ch, ph.day)[+b.dataset.i];
    if (p.state === 'next') {
      phReminders.has(p.id) ? phReminders.delete(p.id) : phReminders.add(p.id);
      renderPhEpg();
      phSay(phReminders.has(p.id) ? `We’ll remind you 5 minutes before ${quote(p.title)}` : 'Reminder canceled');
      $(`.ph-pr[data-i="${b.dataset.i}"]`, phRows)?.focus({ preventScroll: true });
      return;
    }
    if (locked()) { phSay('This channel requires a subscription'); return; }
    if (p.state === 'live') { goLive(); return; }
    // A past show plays right in the top player — no separate screen
    play(p.day, p.s);
  });
  phLive.addEventListener('click', goLive);
  phPause.addEventListener('click', () => {
    if (locked()) return;
    if (ph.paused) { ph.anchor = Date.now(); ph.paused = false; } else { ph.pos = phPos(); ph.paused = true; }
    setPaused(phScene, ph.paused);
    syncPause();
    phTick();
  });
  // Both the broadcast and records can be rewound; rewinding the broadcast turns it into a record
  phTrack.addEventListener('click', e => {
    if (locked()) return;
    const p = phCurrent();
    const r = phTrack.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    let sec = p.s + k * (p.e - p.s);
    if (p.day === TODAY) sec = Math.min(sec, nowSec());
    seekTo(p.day, sec);
    phTick();
  });
  $('[data-ph-subscribe]').addEventListener('click', () => phSay('Subscriptions aren’t available in this demo'));

  /* =========================================================
     Smart TV: sequential focus with a remote
     Channels switch the picture as soon as the focus lands on them; shows only on OK.
     → moves from channels to the side column: full screen · previous / live / next · “Full TV guide”.
     Full screen: OK on a channel or a show, the icon, or the green button. Full programme: the yellow one.
     ========================================================= */
  const tv = $('[data-tv]');
  const tvScene = $('[data-tv-scene]');
  const chList = $('[data-tv-channels]');
  const prList = $('[data-tv-programs]');
  const fullBtn = $('[data-tv-full]');
  const fullTip = $('[data-tv-full-tip]');
  const fsBar = $('[data-tv-fs]');
  const epgList = $('[data-tv-epg]');
  const epgDays = $('[data-tv-days]');
  const epgChannel = $('[data-tv-epg-ch]');
  const tvToast = $('[data-tv-toast]');
  const tvWall = $('[data-tv-paywall]');
  const tvWallBtn = $('[data-tv-subscribe]');
  const liveView = $('[data-tv-view="live"]');
  const epgView = $('[data-tv-view="epg"]');
  // side: 0 — full-screen icon, 1–3 — previous / live / next show, 4 — “Full TV guide”
  const state = { view: 'live', zone: 'channels', ch: 2, side: 2, playing: null, epg: 0, epgTop: 0, posDay: TODAY, pos: 0, anchor: Date.now(), paused: false, fsBtn: 'play' };
  const tvReminders = new Set();
  const VISIBLE = 7, EPG_VISIBLE = 9;
  const liveOf = ci => programmeFor(ci, TODAY).find(p => p.state === 'live');
  const peekFor = ci => {
    const list = programmeFor(ci, TODAY);
    const L = liveIndex(list);
    return [list[L - 1], list[L], list[L + 1]];
  };
  // The full programme is one list through all days, like on the TV
  const allFor = ci => DAYS.flatMap((_, d) => programmeFor(ci, d));
  const badgeFor = p => p.state === 'rec' ? '<span class="st-badge">● Recording</span>'
    : p.state === 'live' ? '<span class="st-badge live">▸ Live</span>'
    : tvReminders.has(p.id) ? `<span class="st-badge bell-on">${bell}Reminder set</span>` : '';
  const row = (p, cls = '') => `<li class="tv-pr ${[p.state === 'live' && 'is-live', p.state === 'next' && 'is-future', state.playing?.id === p.id && p.state === 'rec' && 'is-playing', cls].filter(Boolean).join(' ')}" style="--p:${(p.p * 100).toFixed(0)}%"><span class="t">${p.t}</span><span class="title">${esc(p.title)}</span>${badgeFor(p)}</li>`;

  const renderChannels = () => {
    const top = Math.max(0, Math.min(state.ch - 3, CHANNELS.length - VISIBLE));
    chList.innerHTML = CHANNELS.slice(top, top + VISIBLE).map((c, k) => {
      const i = top + k;
      const cls = [state.playing?.ci === i && 'is-on-air', i === state.ch && (state.zone === 'channels' ? 'is-focus' : 'is-selected')].filter(Boolean).join(' ');
      return `<li class="tv-ch ${cls}"><span class="n">${c.n}</span>${avatar(c)}<span class="name">${esc(c.name)}</span>${c.locked ? lock : ''}<svg class="chev"><use href="#i-chevron"/></svg></li>`;
    }).join('');
  };
  const renderSide = () => {
    const side = state.zone === 'side' ? state.side : -1;
    // A channel outside the subscription puts “Подключить” where the full-screen icon was
    const locked = !!CHANNELS[state.ch].locked;
    fullBtn.classList.toggle('is-focus', side === 0 && !locked);
    tvWallBtn.classList.toggle('is-focus', side === 0 && locked);
    fullTip.hidden = side !== 0 || locked;
    prList.innerHTML = peekFor(state.ch).map((p, k) => row(p, side === k + 1 ? 'is-focus' : '')).join('') +
      `<li class="tv-pr is-all${side === 4 ? ' is-focus' : ''}"><span class="tv-key-ico"><svg><use href="#i-epg"/></svg><i class="key-yellow"></i></span><span>Full TV guide</span></li>`;
  };
  const renderEpg = () => {
    const c = CHANNELS[state.ch];
    epgChannel.innerHTML = `${avatar(c)}<span>${esc(c.name)}</span>`;
    const all = allFor(state.ch);
    if (state.epg < state.epgTop) state.epgTop = state.epg;
    if (state.epg >= state.epgTop + EPG_VISIBLE) state.epgTop = state.epg - EPG_VISIBLE + 1;
    const shown = all.slice(state.epgTop, state.epgTop + EPG_VISIBLE);
    epgList.innerHTML = shown.map((p, k) => row(p, state.epgTop + k === state.epg ? 'is-focus' : '')).join('');
    // The date sits next to the first row of each day (and the top row, if its day started above)
    epgDays.innerHTML = shown.map((p, k) => {
      const first = k === 0 || shown[k - 1].day !== p.day;
      const d = DAYS[p.day];
      return `<li class="${p.day === TODAY ? 'is-today' : ''}">${first ? `${d.short}. ${d.date}` : ''}</li>`;
    }).join('');
    $('[data-tv-epg-up]').classList.toggle('is-off', state.epgTop === 0);
    $('[data-tv-epg-down]').classList.toggle('is-off', state.epgTop + EPG_VISIBLE >= all.length);
  };
  /* Playback on the TV: a moment of the broadcast (day + seconds), like on the phone.
     At "now" it's “Live”; paused or rewound — “Recording”; the “Live” button brings it back. */
  const tvPos = () => state.paused ? state.pos : state.pos + (Date.now() - state.anchor) / 1000;
  const tvSeek = (day, sec) => Object.assign(state, { posDay: day, pos: sec, anchor: Date.now() });
  const tvLive = () => !state.paused && state.posDay === TODAY && nowSec() - tvPos() < 1.5;
  const tvShow = () => {
    const list = programmeFor(state.playing.ci, state.posDay);
    const pos = tvPos();
    return list.find(p => pos >= p.s && pos < p.e) ?? (pos < list[0].s ? list[0] : list.at(-1));
  };

  // Full-screen player controls, as in the product: left — playback, right — programme and settings
  const ico = d => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const FS_BTNS = [
    { id: 'prev', label: 'Previous show', icon: ico('<path d="M4.5 3.5v9M12 3.5L6.5 8l5.5 4.5z"/>') },
    { id: 'rew', label: 'Back 5 minutes', icon: ico('<path d="M8 3.5L2.5 8 8 12.5zM13.5 3.5L8 8l5.5 4.5z"/>') },
    { id: 'min', label: 'Collapse', key: 'green', icon: ico('<path d="M6 2.5V6H2.5M10 2.5V6h3.5M13.5 10H10v3.5M2.5 10H6v3.5"/>') },
    { id: 'play', label: 'Pause', icon: ico('<path d="M5 3.5v9l7-4.5z"/>') },
    { id: 'fwd', label: 'Forward 5 minutes', icon: ico('<path d="M2.5 3.5L8 8l-5.5 4.5zM8 3.5L13.5 8 8 12.5z"/>') },
    { id: 'next', label: 'Next show', icon: ico('<path d="M11.5 3.5v9M4 3.5L9.5 8 4 12.5z"/>') },
    { id: 'live', label: 'Live', icon: ico('<path d="M2 3.5L7 8l-5 4.5zM7 3.5L12 8l-5 4.5zM13.5 3.5v9"/>') },
    { id: 'epg', label: 'TV guide', key: 'yellow', right: true, icon: '<svg><use href="#i-epg"/></svg>' },
    { id: 'audio', label: 'Audio/subtitles', right: true, icon: '<svg><use href="#i-note"/></svg>' },
    { id: 'hd', label: 'Quality', right: true, icon: ico('<rect x="2" y="4" width="12" height="8" rx="1"/><path d="M4.8 6.3v3.4M4.8 8h2.2M7 6.3v3.4M9 6.3v3.4h1.1a1.7 1.7 0 000-3.4z"/>') },
    { id: 'fav', label: 'Add to favorites', right: true, icon: '<svg><use href="#i-heart"/></svg>' },
  ];
  const favs = new Set();
  // “Live” appears only when there's somewhere to return to
  const fsButtons = () => FS_BTNS.filter(b => b.id !== 'live' || !tvLive());
  const fsLine = () => {
    const p = tvShow();
    const live = tvLive();
    return `<b class="fs-time">${fmt(tvPos())}</b>${live
      ? '<span class="fs-state">▸ Live</span>'
      : `<span class="fs-state is-rec">● Recording</span><span class="fs-what">${DAYS[p.day].date} ${esc(quote(p.title))}</span>`}`;
  };
  const fsFill = () => { const p = tvShow(); return Math.min(100, (tvPos() - p.s) / (p.e - p.s) * 100).toFixed(2); };
  const renderFs = () => {
    if (!state.playing || state.view !== 'full') return;
    const p = tvShow();
    const c = CHANNELS[p.ci];
    const list = programmeFor(p.ci, p.day);
    const i = list.findIndex(x => x.id === p.id);
    const peek = [list[i - 1], p, list[i + 1]].filter(Boolean);
    const btns = fsButtons();
    if (!btns.some(b => b.id === state.fsBtn)) state.fsBtn = 'play';
    const btn = b => `<button type="button" class="fs-btn${b.id === state.fsBtn ? ' is-focus' : ''}" data-fs="${b.id}" aria-label="${b.id === 'play' && state.paused ? 'Watch' : b.label}" tabindex="-1">${b.id === 'play' && !state.paused ? ico('<path d="M5 3.5v9M11 3.5v9"/>') : b.icon}${b.key ? `<i class="key-${b.key}"></i>` : ''}<span class="fs-label">${b.id === 'play' ? (state.paused ? 'Watch' : 'Pause') : b.id === 'fav' && favs.has(p.ci) ? 'In favorites' : b.label}</span></button>`;
    fsBar.innerHTML = `
      <div class="fs-info">
        <p class="fs-ch">${avatar(c)}<span>${esc(c.name)}</span></p>
        ${peek.map(x => `<p class="fs-pr${x.id === p.id ? ' is-now' : ''}"><span>${x.t}</span>${esc(x.title)}</p>`).join('')}
      </div>
      <div class="fs-bottom">
        <p class="fs-line">${fsLine()}</p>
        <span class="fs-track"><i style="width:${fsFill()}%"></i></span>
        <div class="fs-ctrls">
          <div>${btns.filter(b => !b.right).map(btn).join('')}</div>
          <div>${btns.filter(b => b.right).map(btn).join('')}</div>
        </div>
      </div>`;
    fsBar.classList.toggle('is-fav', favs.has(p.ci));
  };
  let recFlag;
  // The record badge in the corner of the small screen
  const syncFlag = () => {
    const rec = state.playing && !tvLive();
    if (!rec) { recFlag?.remove(); recFlag = null; return; }
    if (!recFlag) { recFlag = Object.assign(document.createElement('span'), { className: 'tv-rec-flag' }); tv.append(recFlag); }
    const p = tvShow();
    recFlag.innerHTML = `<b>● Recording</b> ${DAYS[p.day].date} ${esc(quote(p.title))}`;
  };
  // Plays a show on the screen: the live one of a channel, or a record from its start.
  // A channel outside the subscription shows the paywall over its still instead.
  const showOnTv = (ci, p = liveOf(ci)) => {
    const c = CHANNELS[ci];
    tvWall.hidden = !c.locked;
    tv.classList.toggle('is-locked', !!c.locked);
    if (c.locked) { setScene(tvScene, c.scene); state.playing = null; syncFlag(); return; }
    state.playing = p;
    tvSeek(p.day, p.state === 'live' ? nowSec() : p.s);
    state.paused = false;
    setPaused(tvScene, false);
    setScene(tvScene, p.scene, { video: true, frame: p.frame });
    syncFlag();
  };
  const tvGoLive = () => showOnTv(state.playing.ci);
  // Every second: the clock runs, a record can roll into the next show
  const tvTick = () => {
    if (!state.playing) return;
    if (state.posDay === TODAY && tvPos() > nowSec()) tvSeek(TODAY, nowSec());
    const p = tvShow();
    if (p.id !== state.playing.id) {
      state.playing = p;
      setScene(tvScene, p.scene, { video: true, frame: p.frame });
      if (state.view === 'live') renderSide();
      if (state.view === 'full') renderFs();
    }
    syncFlag();
    if (state.view === 'full') {
      const line = $('.fs-line', fsBar), fill = $('.fs-track i', fsBar);
      if (line) line.innerHTML = fsLine();
      if (fill) fill.style.width = `${fsFill()}%`;
    }
  };
  setInterval(tvTick, 1000);
  let tvToastTimer;
  const tvSay = text => {
    tvToast.innerHTML = `${bell}${esc(text)}`;
    tvToast.hidden = false;
    clearTimeout(tvToastTimer);
    tvToastTimer = setTimeout(() => { tvToast.hidden = true; }, 2400);
  };
  const render = () => {
    tv.dataset.view = state.view;
    liveView.hidden = state.view !== 'live';
    epgView.hidden = state.view !== 'epg';
    fsBar.hidden = state.view !== 'full';
    renderChannels(); renderSide(); renderEpg(); renderFs();
  };
  const fullScreen = () => {
    if (CHANNELS[state.ch].locked || !state.playing) { tvSay('This channel requires a subscription'); return; }
    state.view = 'full';
    // On a record the focus waits on “Live” — the way back to the broadcast
    state.fsBtn = tvLive() ? 'play' : 'live';
  };
  const openEpg = () => {
    const all = allFor(state.ch);
    state.epg = all.findIndex(p => p.state === 'live');
    state.epgTop = Math.max(0, state.epg - 4);
    state.view = 'epg';
  };
  // OK on a show: record → plays it, live → back to the broadcast, both full screen; future → reminder
  const choose = p => {
    if (p.state === 'next') {
      tvReminders.has(p.id) ? tvReminders.delete(p.id) : tvReminders.add(p.id);
      tvSay(tvReminders.has(p.id) ? `We’ll remind you when ${quote(p.title)} at ${p.t}` : 'Reminder canceled');
      return;
    }
    showOnTv(p.ci, p);
    fullScreen();
  };
  // Neighbouring show, across midnight too
  const neighbour = (p, d) => {
    const list = programmeFor(p.ci, p.day);
    const i = list.findIndex(x => x.id === p.id);
    if (list[i + d]) return list[i + d];
    const day = p.day + d;
    if (day < 0 || day >= DAYS.length) return null;
    const other = programmeFor(p.ci, day);
    return d < 0 ? other.at(-1) : other[0];
  };
  const fsAct = id => {
    const p = tvShow();
    if (id === 'min') { state.view = 'live'; return; }
    if (id === 'epg') { openEpg(); return; }
    if (id === 'live') { tvGoLive(); state.fsBtn = 'play'; return; }
    if (id === 'play') {
      if (state.paused) { state.anchor = Date.now(); state.paused = false; } else { state.pos = tvPos(); state.paused = true; }
      setPaused(tvScene, state.paused);
      return;
    }
    if (id === 'rew' || id === 'fwd') {
      const list = programmeFor(p.ci, state.posDay);
      let sec = tvPos() + (id === 'rew' ? -300 : 300);
      sec = Math.max(list[0].s, Math.min(sec, list.at(-1).e - 1));
      if (state.posDay === TODAY && sec >= nowSec()) { tvGoLive(); return; }
      if (state.paused) state.pos = sec;
      tvSeek(state.posDay, sec);
      return;
    }
    if (id === 'prev' || id === 'next') {
      const q = neighbour(p, id === 'prev' ? -1 : 1);
      if (!q) { tvSay('No earlier recordings available'); return; }
      if (q.state === 'next') { tvSay('This show hasn’t started yet. Set a reminder in the TV guide.'); return; }
      showOnTv(q.ci, q);
      return;
    }
    if (id === 'audio') { tvSay('Audio: Russian · subtitles off'); return; }
    if (id === 'hd') { tvSay('Quality: Auto, currently HD'); return; }
    if (id === 'fav') { favs.has(p.ci) ? favs.delete(p.ci) : favs.add(p.ci); tvSay(favs.has(p.ci) ? 'Channel added to favorites' : 'Channel removed from favorites'); }
  };

  const press = key => {
    if (state.view === 'full') {
      const btns = fsButtons().map(b => b.id);
      const i = btns.indexOf(state.fsBtn);
      if (key === 'ArrowLeft') state.fsBtn = btns[Math.max(0, i - 1)];
      if (key === 'ArrowRight') state.fsBtn = btns[Math.min(btns.length - 1, i + 1)];
      if (key === 'Enter') fsAct(state.fsBtn);
      // Back and the green button return to the small screen; yellow opens the programme
      if (key === 'Backspace' || key === 'Escape' || key === 'Green') state.view = 'live';
      if (key === 'Yellow') openEpg();
      render();
      return;
    }
    if (key === 'Green') { if (state.view !== 'epg') fullScreen(); render(); return; }
    if (key === 'Yellow') { openEpg(); render(); return; }
    if (state.view === 'epg') {
      const all = allFor(state.ch);
      if (key === 'Backspace' || key === 'Escape' || key === 'ArrowLeft') state.view = 'live';
      if (key === 'ArrowUp') state.epg = Math.max(0, state.epg - 1);
      if (key === 'ArrowDown') state.epg = Math.min(all.length - 1, state.epg + 1);
      if (key === 'Enter') choose(all[state.epg]);
      render();
      return;
    }
    if (state.zone === 'channels') {
      const was = state.ch;
      if (key === 'ArrowUp') state.ch = Math.max(0, state.ch - 1);
      if (key === 'ArrowDown') state.ch = Math.min(CHANNELS.length - 1, state.ch + 1);
      // Zapping: the picture follows the focus
      if (state.ch !== was) showOnTv(state.ch);
      if (key === 'Enter') fullScreen();
      if (key === 'ArrowRight') { state.zone = 'side'; state.side = CHANNELS[state.ch].locked ? 0 : 2; }
    } else {
      if (key === 'ArrowUp') state.side = Math.max(0, state.side - 1);
      if (key === 'ArrowDown') state.side = Math.min(4, state.side + 1);
      if (key === 'ArrowLeft' || key === 'Backspace' || key === 'Escape') state.zone = 'channels';
      if (key === 'Enter') {
        if (state.side === 0) CHANNELS[state.ch].locked ? tvSay('Subscriptions aren’t available in this demo') : fullScreen();
        else if (state.side === 4) openEpg();
        else choose(peekFor(state.ch)[state.side - 1]);
      }
    }
    render();
  };
  // Mouse on the full-screen controls
  fsBar.addEventListener('click', e => {
    const b = e.target.closest('[data-fs]');
    if (!b) return;
    state.fsBtn = b.dataset.fs;
    fsAct(b.dataset.fs);
    render();
  });

  const tvRemote = $('[data-tv-remote]');
  // The on-screen remote shows which button the keyboard pressed
  const flashKey = (remote, key) => {
    const btn = $(`[data-key="${key === 'Escape' ? 'Backspace' : key}"]`, remote);
    if (btn) { btn.classList.add('is-pressed'); setTimeout(() => btn.classList.remove('is-pressed'), 120); }
  };
  const KEYS = { g: 'Green', G: 'Green', y: 'Yellow', Y: 'Yellow' };
  tv.addEventListener('keydown', e => {
    const key = KEYS[e.key] || e.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace', 'Escape', 'Green', 'Yellow'].includes(key)) return;
    e.preventDefault();
    press(key);
    flashKey(tvRemote, key);
  });
  $$('[data-key]', tvRemote).forEach(b => b.addEventListener('click', () => press(b.dataset.key)));
  fullBtn.addEventListener('click', () => { fullScreen(); render(); });
  showOnTv(state.ch);
  render();
  $('[data-tv-subscribe]').addEventListener('click', () => tvSay('Subscriptions aren’t available in this demo'));

  /* =========================================================
     Autoplay: the trailer reveals from the top-right corner of the screen.
     Hypothesis — it starts by itself after 3 s; final — only on OK on “Trailer”.
     ========================================================= */
  const ap = $('[data-ap]');
  const shelf = $('[data-ap-shelf]');
  const open = $('[data-ap-open]');
  const apBg = $('[data-ap-scene]', open);
  const countdown = $('[data-ap-countdown]', open);
  const trailerBtn = $('[data-ap-trailer]', open);
  const primaryBtn = $('[data-ap-primary]', open);
  const apRemote = $('[data-ap-remote]');
  const featureText = $('.ap-feature-text', ap);
  let apMode = 'auto';
  let apTimers = [];
  // Remote focus: a poster on the shelf, then a button in the card (0 — “Watch фильм”, 1 — “Trailer”)
  let apFocus = 1, apBtn = 0;
  // Posters carry no titles: the name is in the artwork and on the card once it opens
  shelf.innerHTML = FILMS.map((f, i) => `
    <li class="ap-card" tabindex="0" role="button" data-i="${i}" aria-label="${esc(f.title)}">
      <div class="ap-poster"><div class="scene scene--${f.scene}" data-scene="${f.scene}"></div><p class="ap-poster-title">${esc(f.title)}</p></div>
      ${f.free ? '<span class="ap-free">Free</span>' : ''}
    </li>`).join('');

  const cards = $$('.ap-card', shelf);
  const CARD_STEP = 142, SHELF_VIEW = 924; // card + gap · visible width of the shelf
  // The featured block follows the focused poster; the shelf scrolls to keep it in view
  const renderApFocus = () => {
    const inCard = !open.hidden;
    cards.forEach((c, i) => c.classList.toggle('is-focus', !inCard && i === apFocus));
    [primaryBtn, trailerBtn].forEach((b, i) => b.classList.toggle('is-focus', inCard && !open.classList.contains('is-auto') && i === apBtn));
    const shift = Math.max(0, Math.min((apFocus + 1) * CARD_STEP - SHELF_VIEW + 40, cards.length * CARD_STEP - SHELF_VIEW + 40));
    shelf.style.transform = `translateX(${-shift}px)`;
    const f = FILMS[apFocus];
    setScene($('[data-ap-feature]'), f.scene);
    featureText.innerHTML = `<p class="ap-genre">${esc(f.genre)}</p><p class="ap-feature-title">${esc(f.title)}</p>`;
  };

  const clearAp = () => { apTimers.forEach(clearTimeout); apTimers = []; };
  const playTrailer = () => {
    clearAp();
    countdown.hidden = true;
    open.classList.add('is-auto');
    setScene(apBg, apBg.dataset.scene, { video: true });
  };
  const stopTrailer = () => {
    clearAp();
    open.classList.remove('is-auto');
    if (apBg.dataset.scene) setScene(apBg, apBg.dataset.scene);
  };
  const openFilm = card => {
    const f = FILMS[+card.dataset.i];
    stopTrailer();
    setScene(apBg, f.scene);
    $('[data-ap-title]', open).textContent = f.title;
    $('[data-ap-genre]', open).textContent = f.genre;
    $('[data-ap-desc]', open).textContent = f.desc;
    open.hidden = false;
    if (!reduceMotion) open.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    apFocus = +card.dataset.i;
    apBtn = 0;
    renderApFocus();
    if (apMode !== 'auto') { countdown.hidden = true; return; }
    // Hypothesis: the trailer starts by itself almost at once — no time to read the description
    countdown.hidden = false;
    countdown.textContent = 'Starting trailer…';
    apTimers.push(setTimeout(playTrailer, 1200));
  };
  const closeFilm = () => {
    stopTrailer();
    open.hidden = true;
    renderApFocus();
  };
  shelf.addEventListener('click', e => { const c = e.target.closest('.ap-card'); if (c) openFilm(c); });
  $('[data-ap-close]').addEventListener('click', closeFilm);
  const watchFilm = () => {
    clearAp();
    countdown.hidden = false;
    countdown.textContent = 'Movies can’t play in this demo — try Trailer';
  };
  trailerBtn.addEventListener('click', () => { playTrailer(); renderApFocus(); });
  primaryBtn.addEventListener('click', watchFilm);
  // Remote: ← → on the shelf and between the buttons, OK, Back from the trailer to the card and from the card to the shelf
  const pressAp = key => {
    const back = key === 'Backspace' || key === 'Escape';
    if (open.hidden) {
      if (key === 'ArrowLeft') apFocus = Math.max(0, apFocus - 1);
      if (key === 'ArrowRight') apFocus = Math.min(cards.length - 1, apFocus + 1);
      if (key === 'Enter') { openFilm(cards[apFocus]); return; }
    } else if (open.classList.contains('is-auto')) {
      if (back) { stopTrailer(); apBtn = 1; }
    } else {
      if (key === 'ArrowLeft') apBtn = 0;
      if (key === 'ArrowRight') apBtn = 1;
      if (key === 'Enter') { if (apBtn) playTrailer(); else watchFilm(); }
      if (back) { closeFilm(); return; }
    }
    renderApFocus();
  };
  ap.addEventListener('keydown', e => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace', 'Escape'].includes(e.key)) return;
    e.preventDefault();
    pressAp(e.key);
    flashKey(apRemote, e.key);
  });
  $$('[data-key]', apRemote).forEach(b => b.addEventListener('click', () => pressAp(b.dataset.key)));
  renderApFocus();
  $$('[data-ap-mode]').forEach(b => b.addEventListener('click', () => {
    apMode = b.dataset.apMode;
    $$('[data-ap-mode]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    closeFilm();
  }));

  /* =========================================================
     Readability: distance, short sight and colour-vision simulation
     ========================================================= */
  const rd = $('[data-rd]');
  const dist = $('[data-rd-distance]');
  const distOut = $('[data-rd-out]');
  const myopia = $('[data-rd-myopia]');
  const applyDistance = () => {
    const d = +dist.value;
    distOut.textContent = `${d} m`;
    // Short sight adds its own blur that grows with the distance
    const blur = (d - 1) * 0.35 + (myopia.checked ? 0.8 + (d - 1) * 0.45 : 0);
    $$('.rd-zoom', rd).forEach(z => {
      z.style.setProperty('--s', (1 / Math.sqrt(d)).toFixed(3));
      z.style.setProperty('--b', `${blur.toFixed(2)}px`);
    });
  };
  dist.addEventListener('input', applyDistance);
  myopia.addEventListener('change', applyDistance);
  $('[data-rd-vision]').addEventListener('change', e => { rd.dataset.vision = e.target.value; });
  applyDistance();

  /* =========================================================
     Localization: strings of different length (checked with Lokalise in Figma).
     Rules: ellipsis + “Show more” for long texts, titles only on the film card,
     buttons adapted by meaning rather than translated word for word.
     ========================================================= */
  const STR = {
    ru: { genres: 'Жанры', epg: 'Телепрограмма', record: '● Запись', show: '«Город на закате», 2 сезон, 14 серия', watch: 'Смотреть', trailer: 'Трейлер', tariff: 'Тариф «Премиум HD + Кино»', film1: 'Город на закате', film2: 'Дорога на юг', film3: 'Туман', home: 'Главная', tv: 'ТВ', premieres: 'Премьеры', cinema: 'Кино', account: 'Кабинет', more: 'Развернуть' },
    en: { genres: 'Genres', epg: 'TV guide', record: '● Recording', show: '“City at Sunset”, season 2, episode 14', watch: 'Watch now', trailer: 'Trailer', tariff: '“Premium HD + Movies” plan', film1: 'City at Sunset', film2: 'Road to the South', film3: 'The Fog', home: 'Home', tv: 'TV', premieres: 'Premieres', cinema: 'Movies', account: 'Account', more: 'Show more' },
    de: { genres: 'Genres', epg: 'Fernsehprogramm', record: '● Aufnahme', show: '„Stadt im Sonnenuntergang“, Staffel 2, Folge 14', watch: 'Jetzt ansehen', trailer: 'Vorschau ansehen', tariff: 'Tarif „Premium HD + Filme“', film1: 'Stadt im Sonnenuntergang', film2: 'Straße nach Süden', film3: 'Der Nebel', home: 'Startseite', tv: 'Fernsehen', premieres: 'Premieren', cinema: 'Filme', account: 'Benutzerkonto', more: 'Mehr anzeigen' },
  };
  // Pseudo-localization: every vowel doubled (“Genres” → “Жаанрыы”) — the same words, ~40% longer and still readable.
  // Appending a cut-off copy of the word (“Genres Жа”) read as a bug in the demo, not as a stress test
  const stretch = t => t.replace(/[аеёиоуыэюя]/gi, '$&$&');
  STR.long = Object.fromEntries(Object.entries(STR.ru).map(([k, v]) => [k, stretch(v)]));
  // Not a literal translation: a shorter word with the same meaning (stretched too for the +40% language)
  const ADAPTED = {
    en: { watch: 'Watch' },
    de: { epg: 'TV-Programm', watch: 'Ansehen', trailer: 'Trailer', home: 'Start', tv: 'TV', account: 'Konto' },
    long: { epg: stretch('Программа'), home: stretch('Домой'), account: stretch('Профиль'), more: stretch('Ещё') },
  };
  const LESS = { ru: 'Свернуть', en: 'Show less', de: 'Weniger', long: stretch('Свернуть') };
  const loc = $('[data-loc]');
  const report = $('[data-loc-report]');
  const rules = $('[data-loc-rules]');
  const more = $('[data-loc-more]');
  const titleRow = $('.loc-row', loc);
  let lang = 'en';
  const fill = str => $$('[data-t]', loc).forEach(el => { el.textContent = str[el.dataset.t]; el.classList.remove('is-overflow'); });
  const renderLoc = () => {
    // First the plain translation without the rules: which strings don't fit their containers
    loc.classList.remove('is-ruled');
    titleRow.classList.remove('is-open');
    fill(STR[lang]);
    const over = $$('[data-t]', loc).filter(el => el.offsetParent && el.scrollWidth > el.clientWidth + 1);
    const bad = over.length;
    if (rules.checked) {
      const str = { ...STR[lang], ...ADAPTED[lang] };
      fill(str);
      loc.classList.add('is-ruled');
      more.textContent = str.more;
    } else over.forEach(el => el.classList.add('is-overflow'));
    const title = $('.loc-title', loc);
    more.hidden = !(rules.checked && title.scrollWidth > title.clientWidth + 1);
    report.className = 'loc-report t-code-sm ' + (bad && !rules.checked ? 'is-bad' : 'is-ok');
    report.textContent = !bad ? 'All text fits'
      : rules.checked ? `Without the rules, text overflowed in: ${bad}. Ellipses and “Show more”, titles on the film card and shorter button labels make everything fit`
      : `Text that doesn’t fit: ${bad} — we’d catch this in the design before QA`;
  };
  more.addEventListener('click', () => {
    const on = titleRow.classList.toggle('is-open');
    more.textContent = on ? LESS[lang] : { ...STR[lang], ...ADAPTED[lang] }.more;
  });
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    $$('[data-lang]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    renderLoc();
  }));
  rules.addEventListener('change', renderLoc);
  (document.fonts?.ready ?? Promise.resolve()).then(renderLoc);
})();
