/* River Houses, Hveragerði: home slice behaviour. Motion contract: _docs/hveragerdi-villa-2026-11-19/MOTION.md.
   Feedback timings (150/400 ms), header behaviour and the badge spin are measured from findsanctuary.com;
   Lenis and the reveal grammar are authored (the source has none; Sindri asked for them, 19 Nov). */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const desk = matchMedia('(min-width: 1024px)');
  const G = window.gsap, ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce.matches;
  if (motion) { G.registerPlugin(ST); root.classList.add('mo'); }
  const OUT = 'expo.out';

  /* ---------- LENIS (fine pointers only; native touch) ---------- */
  let lenis = null;
  if (motion && fine.matches && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollToEl = (el) => {
    const y = el.getBoundingClientRect().top + scrollY - (desk.matches ? 0 : 0);
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 }); else window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = id === 'top' ? document.body : document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    closeMenu(false);
    scrollToEl(el);
  });

  /* ---------- SPLITTING ---------- */
  const wrapWords = (el, cls) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = cls;
            const i = document.createElement('span'); i.className = cls + '-i'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };
  // lines: words first, then group by offsetTop into .ln > .ln-i (keeps <em> runs inside the line)
  const splitLines = (el) => {
    el.dataset.src = el.innerHTML;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    wrapWords(el, 'wd');
    const words = [...el.querySelectorAll('.wd')];
    const lines = [];
    let top = null;
    words.forEach((w) => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; } lines[lines.length - 1].push(w); });
    const out = lines.map((ws) => {
      const html = ws.map((w) => { const em = w.closest('em'); const t = w.textContent; return em && em !== el ? `<em>${t}</em>` : t; }).join(' ');
      return `<span class="ln" aria-hidden="true"><span class="ln-i">${html}</span></span>`;
    });
    el.innerHTML = out.join('');
    return [...el.querySelectorAll('.ln-i')];
  };
  const restore = (el) => { if (el.dataset.src) { el.innerHTML = el.dataset.src; delete el.dataset.src; el.removeAttribute('aria-label'); } };

  /* ---------- HERO (load) ---------- */
  const hero = document.querySelector('.hero');
  const heroImg = hero.querySelector('img');
  const heroH = hero.querySelector('[data-split]');
  const header = document.querySelector('[data-header]');
  const intro = () => {
    if (!motion) return;
    heroH.dataset.src = heroH.innerHTML;
    heroH.setAttribute('aria-label', heroH.textContent.replace(/\s+/g, ' ').trim());
    wrapWords(heroH, 'w');
    heroH.querySelectorAll('.w').forEach((w) => w.setAttribute('aria-hidden', 'true'));
    const tl = G.timeline();
    tl.fromTo(heroImg, { scale: desk.matches ? 1.08 : 1.04 }, { scale: 1, duration: 1.8, ease: OUT }, 0)
      .to(heroH.querySelectorAll('.w-i'), { yPercent: 0, y: 0, duration: 0.95, ease: OUT, stagger: 0.07 }, 0.2)
      .to([header, hero.querySelector('.hero-place'), hero.querySelector('.hero-pill')], { opacity: 1, duration: 0.7, ease: OUT, stagger: 0.08 }, 0.75)
      .fromTo([hero.querySelector('.hero-place'), hero.querySelector('.hero-pill')], { y: 12 }, { y: 0, duration: 0.7, ease: OUT, stagger: 0.08 }, 0.75)
      // words stay wrapped at their end transform: clearing it would drop them to the CSS start state, and swapping back to
      // plain text nudges the line 2 px (inline-block baseline), so neither happens
    // exit (scrub)
    G.to(hero.querySelector('[data-hero-media]'), { yPercent: desk.matches ? 14 : 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    G.to(hero.querySelector('.hero-content'), { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true } });
  };
  const ready = heroImg.decode ? Promise.race([heroImg.decode().catch(() => {}), new Promise((r) => setTimeout(r, 1000))]) : Promise.resolve();
  ready.then(intro);

  /* ---------- HEADER (source: solid past the hero, hides scrolling down .15s, returns scrolling up) ---------- */
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const solid = y > hero.offsetHeight - header.offsetHeight - 10;
    header.classList.toggle('is-solid', solid);
    const menuOpen = menuEl.classList.contains('is-open');
    if (!menuOpen && y > lastY + 2 && y > header.offsetHeight * 2) header.classList.add('is-hidden');
    if (y < lastY - 2 || y < header.offsetHeight) header.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- MENU (phone; focus-guard: pointer open focuses the panel, keyboard the first link) ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const menuEl = document.getElementById('menu');
  const openMenu = (viaKey) => {
    menuEl.hidden = false; menuEl.classList.add('is-open'); menuBtn.setAttribute('aria-expanded', 'true');
    header.classList.remove('is-hidden'); header.classList.add('is-solid');
    if (lenis) lenis.stop();
    if (motion) {
      G.killTweensOf(menuEl);
      G.fromTo(menuEl, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 0.7, ease: 'power3.inOut' });
      G.fromTo(menuEl.querySelectorAll('.menu-in a, .menu-book'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: OUT, stagger: 0.05, delay: 0.2 });
    } else menuEl.style.clipPath = 'none';
    (viaKey ? menuEl.querySelector('a') : menuEl).focus({ preventScroll: true });
  };
  function closeMenu(refocus = true) {
    if (!menuEl.classList.contains('is-open')) return;
    menuBtn.setAttribute('aria-expanded', 'false');
    const done = () => { menuEl.classList.remove('is-open'); menuEl.hidden = true; onScroll(); };
    if (lenis) lenis.start();
    if (motion) { G.killTweensOf(menuEl); G.to(menuEl, { clipPath: 'inset(0 0 0 100%)', duration: 0.5, ease: 'power3.inOut', onComplete: done }); } else done();
    if (refocus) menuBtn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener('click', (e) => (menuEl.classList.contains('is-open') ? closeMenu() : openMenu(e.detail === 0)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  matchMedia('(min-width: 1200px)').addEventListener('change', (e) => { if (e.matches) closeMenu(false); });

  /* ---------- SCROLL REVEALS ---------- */
  const reveals = () => {
    if (!motion) return;
    document.querySelectorAll('.rv-label').forEach((el) => {
      G.fromTo(el, { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: OUT, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    document.querySelectorAll('[data-lines]').forEach((el) => {
      const lines = splitLines(el);
      G.set(lines, { yPercent: 110 });
      G.to(lines, { yPercent: 0, duration: 1.0, ease: OUT, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onComplete: () => restore(el) });
    });
    document.querySelectorAll('.rv-list').forEach((el) => {
      G.to(el.querySelectorAll(':scope > li, :scope > label'), { opacity: 1, y: 0, duration: 0.7, ease: OUT, stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    document.querySelectorAll('.rv-fade').forEach((el) => {
      G.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: OUT, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    document.querySelectorAll('.rv-img').forEach((el) => {
      const box = el.querySelector('.frame, .car');
      const img = el.querySelectorAll('img');
      const ins = desk.matches ? 14 : 8;
      G.fromTo(box, { clipPath: `inset(${ins}% 0% ${ins}% 0%)` }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: OUT, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      G.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: OUT, clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    // full-bleed still: scale + drift through the section
    const still = document.querySelector('[data-still] img');
    if (still) G.fromTo(still, { scale: 1.15, yPercent: desk.matches ? -6 : 0 }, { scale: 1, yPercent: desk.matches ? 6 : 0, ease: 'none', scrollTrigger: { trigger: '.still', start: 'top bottom', end: 'bottom top', scrub: true } });
    // story band: reading reveal
    const read = document.querySelector('[data-read]');
    if (read) {
      read.setAttribute('aria-label', read.textContent.replace(/\s+/g, ' ').trim());
      wrapWords(read, 'w');
      read.querySelectorAll('.w').forEach((w) => { w.setAttribute('aria-hidden', 'true'); w.style.overflow = 'visible'; });
      const ws = read.querySelectorAll('.w-i');
      G.set(ws, { yPercent: 0, opacity: 0.18 });
      G.to(ws, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: read, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    }
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(reveals));

  /* ---------- EXPAND / COLLAPSE ---------- */
  document.querySelectorAll('[data-more]').forEach((box) => {
    const btn = box.querySelector('.more-btn');
    const body = box.querySelector('.more-body');
    const label = btn.querySelector('span');
    const closedText = label.textContent;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (closedText === 'Read more') label.textContent = open ? 'Read more' : 'Read less';
      if (!motion) { body.hidden = open; return; }
      G.killTweensOf(body);
      if (!open) {
        body.hidden = false;
        const h = body.scrollHeight;
        G.fromTo(body, { height: body.offsetHeight === h ? 0 : body.offsetHeight }, { height: h, duration: 0.6, ease: OUT, onComplete: () => { body.style.height = 'auto'; ST.refresh(); } });
        G.fromTo(body.querySelectorAll('.more-in > *'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: OUT, delay: 0.1, stagger: 0.05 });
      } else {
        G.fromTo(body, { height: body.offsetHeight }, { height: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { body.hidden = true; body.style.height = ''; ST.refresh(); } });
      }
    });
  });

  /* ---------- CAROUSELS (source: Flickity, arrows + drag; here a clip wipe with inner parallax) ---------- */
  document.querySelectorAll('[data-car]').forEach((car) => {
    const cells = [...car.querySelectorAll('.car-cell')];
    const prev = car.querySelector('.arrow--prev'), next = car.querySelector('.arrow--next');
    let i = 0, busy = false;
    cells[0].classList.add('is-on');
    const paint = () => { prev.disabled = i === 0; next.disabled = i === cells.length - 1; };
    const go = (to) => {
      if (busy || to < 0 || to >= cells.length || to === i) return;
      const dir = to > i ? 1 : -1, from = cells[i], into = cells[to];
      i = to; paint();
      into.classList.add('is-on');
      if (!motion) { from.classList.remove('is-on'); return; }
      busy = true;
      const fi = from.querySelector('img'), ii = into.querySelector('img');
      G.set(into, { zIndex: 2, clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' });
      G.set(from, { zIndex: 1 });
      G.timeline({ onComplete: () => { from.classList.remove('is-on'); G.set([from, into, fi, ii], { clearProps: 'all' }); busy = false; } })
        .to(into, { clipPath: 'inset(0 0% 0 0%)', duration: 0.9, ease: OUT }, 0)
        .fromTo(ii, { xPercent: 12 * dir, scale: 1.08 }, { xPercent: 0, scale: 1, duration: 0.9, ease: OUT }, 0)
        .to(fi, { xPercent: -12 * dir, duration: 0.9, ease: OUT }, 0);
    };
    prev.addEventListener('click', () => go(i - 1));
    next.addEventListener('click', () => go(i + 1));
    car.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); });
    let sx = null, sy = null;
    car.addEventListener('pointerdown', (e) => { if (e.target.closest('.arrow')) return; sx = e.clientX; sy = e.clientY; });
    car.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1)); });
    car.addEventListener('pointercancel', () => { sx = null; });
    paint();
  });

  /* ---------- FULL-BLEED RAIL (desktop: drag with inertia; phone: native swipe + snap) ---------- */
  const rail = document.querySelector('[data-rail]');
  if (rail) {
    const btn = document.querySelector('.arrow--rail');
    const imgs = [...rail.querySelectorAll('img')];
    const max = () => rail.scrollWidth - rail.clientWidth;
    let target = 0, cur = 0, raf = 0, drag = null;
    const parallax = () => {
      if (!motion) return;
      const w = innerWidth;
      imgs.forEach((im) => { const r = im.parentElement.getBoundingClientRect(); const p = (r.left + r.width / 2 - w / 2) / w; im.style.transform = `translateX(${(-p * 6).toFixed(2)}%)`; });
    };
    const tick = () => {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.5) cur = target;
      rail.scrollLeft = cur; parallax();
      btn.disabled = target >= max() - 2;
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    const glide = (to) => { target = Math.max(0, Math.min(max(), to)); if (!motion) { rail.scrollLeft = target; cur = target; btn.disabled = target >= max() - 2; return; } if (!raf) raf = requestAnimationFrame(tick); };
    btn.addEventListener('click', () => {
      const cellsX = [...rail.children].map((c) => c.offsetLeft - rail.offsetLeft);
      const nx = cellsX.find((x) => x > rail.scrollLeft + 4);
      glide(nx === undefined ? max() : nx);
    });
    rail.addEventListener('scroll', () => { if (!raf && !drag) { cur = target = rail.scrollLeft; parallax(); btn.disabled = rail.scrollLeft >= max() - 2; } }, { passive: true });
    if (fine.matches) {
      rail.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, s: rail.scrollLeft, v: 0, lx: e.clientX, t: performance.now() }; rail.classList.add('is-drag'); rail.setPointerCapture(e.pointerId); });
      rail.addEventListener('pointermove', (e) => { if (!drag) return; const now = performance.now(); drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.t); drag.lx = e.clientX; drag.t = now; target = cur = Math.max(0, Math.min(max(), drag.s - (e.clientX - drag.x))); rail.scrollLeft = cur; parallax(); });
      const end = () => { if (!drag) return; const fling = -drag.v * 320; drag = null; rail.classList.remove('is-drag'); glide(cur + fling); };
      rail.addEventListener('pointerup', end); rail.addEventListener('pointercancel', end);
    }
    rail.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); glide(target + rail.clientWidth * 0.6); } if (e.key === 'ArrowLeft') { e.preventDefault(); glide(target - rail.clientWidth * 0.6); } });
    parallax();
  }

  /* ---------- PLAN A STAY: the radios set which house the dates line opens ---------- */
  const planBtn = document.querySelector('[data-plan]');
  document.querySelectorAll('.plan-pick input').forEach((r) => r.addEventListener('change', () => { if (r.checked) planBtn.dataset.house = r.value; }));

  /* ---------- BOOKING: SNDR Bókun sheet (Mountain Villas plumbing; preview, nothing is sent) ---------- */
  /* ---------- SNDR BÓKUN: the engine behind the sheet ----------
     Tenant `riverhouses` (04-platform/sndr-platform/src/tenants/riverhouses.ts), demo: true, no notify:
     a request lands in the demo dashboard and nowhere else. Local QA talks to `wrangler dev`
     (launch.json riverhouses-engine, :8792); every other host to the demo Worker on workers.dev.
     GET /booking/nights strikes the taken nights per house (dates only); POST /booking/request is
     re-checked by the engine (capacity, shortest stay, lead time, overlap), so the sheet is never
     the only guard. If the engine cannot be reached, nothing is struck and the sheet says so on send. */
  /* Only local QA has an engine today. The GitHub preview calls nothing (no failed request on a page a
     client sees) and the sheet runs as a plain design preview until Sindri picks where the demo engine lives. */
  const API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://riverhouses.localhost:8792' : null;
  const NIGHTS = { v1: new Set(), v2: new Set() };
  const nightsReady = !API ? Promise.resolve(false) : Promise.all(['v1', 'v2'].map((u) =>
    fetch(`${API}/booking/nights?unit=${u}&days=400`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  )).then((answers) => {
    let got = false;
    answers.forEach((a, i) => { if (a && Array.isArray(a.taken)) { got = true; a.taken.forEach((k) => NIGHTS[i ? 'v2' : 'v1'].add(k)); } });
    return got;
  });
  const submit = async (r, house) => {
    /* No engine answered the nights call (the GitHub preview, before a demo Worker exists): a clean preview
       receipt, said plainly on the done screen, never a connection error. */
    if (!(await nightsReady)) { await new Promise((ok) => setTimeout(ok, 650)); return { ok: true, delivered: false }; }
    try {
      const res = await fetch(`${API}/booking/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: house, date: r.start, endDate: r.end, people: r.guests, lang: 'en',
          customer: { name: r.name, email: r.email, phone: r.phone },
          note: [r.message, 'House rules accepted.'].filter(Boolean).join(' ') }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok !== false) { for (let d = new Date(r.start + 'T00:00:00'); d < new Date(r.end + 'T00:00:00'); d.setDate(d.getDate() + 1)) NIGHTS[house].add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); return { ok: true, delivered: true }; }
      return { ok: false, message: out.message || (out.messages && out.messages[0]) || 'Kristín could not take these dates. Please try other dates.' };
    } catch (_) { return { ok: false, message: 'The request could not reach Kristín. Check your connection and try again; your details are kept.' }; }
  };

  const book = document.getElementById('book');
  if (book && window.mountBooking) {
    const NAME = { v1: 'The Deck Villa', v2: 'The Riverbank Villa' };
    const bar = book.querySelector('.bk-bar');
    const sub = book.querySelector('#bk-sub');
    const houseBtns = [...book.querySelectorAll('.bk-house button')];
    let house = 'v1';
    const booking = window.mountBooking(book, { min: 2, max: 10, guests: 4, submit: (r) => submit(r, house), taken: (k) => NIGHTS.v1.has(k), onStep: (step) => { bar.scrollTop = 0; book.dataset.step = step; } });
    const setHouse = (h) => {
      house = NAME[h] ? h : 'v1';
      houseBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.house === house)));
      sub.textContent = `${NAME[house]}, Hveragerði · The whole house`;
      booking.setHouse(10, (k) => NIGHTS[house].has(k));
    };
    houseBtns.forEach((b) => b.addEventListener('click', () => { if (b.dataset.house !== house) setHouse(b.dataset.house); }));
    let opener = null, closing = null;
    const open = (trigger, viaKey) => {
      closeMenu(false);
      if (closing) { closing.kill(); closing = null; G.killTweensOf([bar, book.querySelector('.bk-bg')]); }
      booking.prepare();
      if (booking.step === 'done') booking.reset();
      const h = trigger && trigger.dataset.house;
      if (h && h !== house) setHouse(h);
      opener = trigger;
      if (lenis) lenis.stop();
      root.classList.add('bk-open');
      if (!book.open) book.showModal();
      if (motion) {
        G.killTweensOf(bar);
        G.fromTo(book.querySelector('.bk-bg'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: OUT });
        G.fromTo(bar, desk.matches || matchMedia('(min-width:768px)').matches ? { xPercent: 100 } : { yPercent: 100 }, { xPercent: 0, yPercent: 0, duration: 0.6, ease: OUT });
      } else G.set && G.set(book.querySelector('.bk-bg'), { opacity: 1 });
      (viaKey ? booking.firstDay() || bar : bar).focus({ preventScroll: true });
    };
    const close = () => {
      if (!book.open) return;
      if (closing) return;
      const fin = () => { closing = null; book.close(); root.classList.remove('bk-open'); if (lenis) lenis.start(); if (opener && opener.focus) opener.focus({ preventScroll: true }); };
      if (motion) {
        G.to(book.querySelector('.bk-bg'), { opacity: 0, duration: 0.45, ease: 'power3.inOut' });
        G.killTweensOf(bar);
        closing = G.to(bar, matchMedia('(min-width:768px)').matches ? { xPercent: 100, duration: 0.45, ease: 'power3.inOut', onComplete: fin } : { yPercent: 100, duration: 0.45, ease: 'power3.inOut', onComplete: fin });
      } else fin();
    };
    book.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    book.querySelectorAll('[data-book-close]').forEach((el) => el.addEventListener('click', close));
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-book]');
      if (!t) return;
      e.preventDefault();
      open(t, e.detail === 0);
    });
    setHouse('v1');
    /* The taken nights arrive a moment after load: repaint, unless the guest is already past the dates. */
    nightsReady.then((got) => { if (got && (!book.open || booking.step === 'dates')) setHouse(house); });
  }

  if (!motion) document.querySelectorAll('.header').forEach((h) => { h.style.opacity = 1; });
  onScroll();
})();
