/* HaneiRoom landing page · scroll story
   No dependencies. Pinned scenes use CSS position: sticky inside tall sections,
   so scrolling stays native; this file only reads scroll progress and writes
   transforms, stroke offsets and classes. Everything is readable without it. */
(() => {
  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const win = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqPin = matchMedia('(min-width: 1024px) and (min-height: 640px)');
  let motion = !mqReduce.matches;
  let pin = motion && mqPin.matches;
  let mpin = motion && !pin; // small screens: chapters 1–3 become sticky one-screen frames
  let vh = innerHeight;

  /* ------------------------------------------------------------ link config */
  const conf = window.HANEI_CONFIG || {};
  [['[data-cta]', conf.cta], ['[data-contact]', conf.contact], ['[data-appstore]', conf.appStore]].forEach(([sel, c]) => {
    if (!c) return;
    $$(sel).forEach((a) => {
      if (c.href) a.setAttribute('href', c.href);
      if (c.label) a.firstChild.textContent = c.label;
      if (c.newTab) { a.target = '_blank'; a.rel = 'noopener'; }
    });
  });

  /* ------------------------------------------------------------ nav */
  const toggle = $('.nav__toggle');
  const menu = $('#nav-menu');
  const closeMenu = (focus) => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    if (focus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    if (open) $('a', menu).focus();
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(false); });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
  });
  d.addEventListener('click', (e) => {
    if (menu.classList.contains('is-open') && !e.target.closest('.nav__bar')) closeMenu(false);
  });

  // Highlight the nav link for the section in view. "Our Story" covers both story chapters.
  const navMap = { idea: 'idea', story: 'idea', how: 'how', 'meet-hanei': 'meet-hanei' };
  const navLinks = $$('.nav__links ul a');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const target = navMap[en.target.id];
      navLinks.forEach((a) => {
        if (target && a.getAttribute('href') === '#' + target) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach((s) => navIO.observe(s));

  /* ------------------------------------------------------------ progress rail */
  const rail = $('[data-rail]');
  const chapters = $$('[data-chapter]');
  const railList = $('.rail__list', rail);
  const railLinks = chapters.map((sec) => {
    const li = d.createElement('li');
    const a = d.createElement('a');
    a.href = '#' + sec.id;
    a.innerHTML = '<span></span>';
    a.firstChild.textContent = sec.dataset.chapter;
    a.setAttribute('aria-label', sec.dataset.chapter);
    li.append(a);
    railList.append(li);
    return { sec, li, a, top: 0 };
  });

  /* ------------------------------------------------------------ sketch engine */
  function makeSketch(svg) {
    const steps = {};
    $$('.sk-step', svg).forEach((g) => {
      const items = [...g.children].map((el) => ({
        el,
        dash: el.tagName === 'path' && !el.classList.contains('dash') && !el.classList.contains('fillshape'),
        last: -1,
      }));
      steps[g.dataset.step] = (steps[g.dataset.step] || []).concat(items);
    });
    return { svg, steps };
  }
  // Reveal every stroke of a step in sequence across its [start, end] window.
  function drawSketch(sk, windows, p) {
    let tip = null;
    for (const step in sk.steps) {
      const w = windows[step];
      if (!w) continue;
      const local = win(p, w[0], w[1]);
      const items = sk.steps[step];
      const n = items.length;
      const span = Math.max(.08, Math.min(.5, 3 / n));
      items.forEach((it, i) => {
        const s = (i / n) * (1 - span);
        const t = clamp((local - s) / span);
        if (Math.abs(t - it.last) < .002) return;
        it.last = t;
        if (it.dash) it.el.style.strokeDashoffset = (1.05 * (1 - t)).toFixed(4);
        else it.el.style.opacity = t.toFixed(3);
        if (t > 0 && t < 1 && it.dash && !it.el.classList.contains('p2')) tip = { el: it.el, t };
      });
    }
    return tip;
  }
  const sketches = {};
  $$('[data-sketch]').forEach((svg) => { sketches[svg.dataset.sketch] = makeSketch(svg); });

  // A small pencil that follows the stroke being drawn.
  function makePencil(host) {
    const s = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 30 200');
    s.setAttribute('class', 'sketch-pencil');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<use href="#tool-pencil"/>';
    host.append(s);
    return s;
  }
  function movePencil(pencil, sk, tip) {
    if (!pencil) return;
    if (!tip) { pencil.style.opacity = '0'; return; }
    const len = tip.el.getTotalLength();
    const pt = tip.el.getPointAtLength(len * tip.t);
    const m = tip.el.getScreenCTM();
    const host = pencil.parentNode.getBoundingClientRect();
    if (!m) return;
    const x = m.a * pt.x + m.c * pt.y + m.e - host.left;
    const y = m.b * pt.x + m.d * pt.y + m.f - host.top;
    pencil.style.opacity = '1';
    pencil.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(210deg)`;
  }

  /* ------------------------------------------------------------ scenes */
  const hero = $('[data-scene="hero"]');
  $$('[data-depth]', hero).forEach((el) => el.style.setProperty('--d', el.dataset.depth));

  const idea = $('[data-scene="idea"]');
  const ideaSteps = $$('.steps__item', idea);
  const ideaReveal = $$('[data-reveal-step]', idea);
  const ideaBoard = $('.idea__board', idea);
  const ideaPencil = makePencil(ideaBoard);
  const stepBars = $$('[data-steps-bar] i', idea);
  const IDEA_PIN = { 1: [.02, .18], 2: [.2, .42], 3: [.44, .6], 5: [.8, .92] };
  const IDEA_FLOW = { 1: [0, .3], 2: [.3, .7], 3: [.7, 1] };
  const ideaStepAt = [.2, .44, .62, .8];
  const ideaRevealAt = { 2: .24, 3: .5, 4: .62, 5: .8 };

  const story = $('[data-scene="story"]');
  const archive = $('[data-archive]', story);
  const archPencil = $('[data-archive-pencil]', story);
  const archFront = $('.archive-front', story);
  const stamp = $('[data-stamp]', story);
  const storyPencil = makePencil($('.blueprint', story));
  const V1_PIN = { 1: [.03, .2], 2: [.2, .32], 3: [.32, .46], 4: [.52, .64] };
  const V1_FLOW = { 1: [0, .35], 2: [.35, .55], 3: [.55, .75], 4: [.8, 1] };

  const how = $('[data-scene="how"]');
  const chatMsgs = $$('[data-msg]', how);
  const chatTyping = $('[data-typing]', how);
  const chatStep = $('[data-chat-step]', how);
  const SUMMARY_AT = chatMsgs.findIndex((m) => m.querySelector('.msg__quote'));
  let chatShown = -1;

  const reveal = $('[data-scene="reveal"]');
  const wire = $('[data-wireframe]', reveal);
  const phoneWrap = $('.phone-wrap', reveal);
  const tabs = $$('[role="tab"]', reveal);
  const panels = $$('[role="tabpanel"]', reveal);
  const caption = $('[data-tab-caption]', reveal);
  const TAB_AT = [.42, .6, .78];
  const TAB_TARGET = [.36, .51, .69, .9];
  let activeTab = 0;

  function setTab(i, { focus = false } = {}) {
    if (i === activeTab && !focus) return;
    activeTab = i;
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].classList.toggle('is-active', on);
    });
    caption.textContent = panels[i].dataset.caption;
    if (focus) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      setTab(i);
      if (pin) {
        const r = reveal.getBoundingClientRect();
        const top = scrollY + r.top + TAB_TARGET[i] * (reveal.offsetHeight - vh);
        scrollTo({ top, behavior: motion ? 'smooth' : 'auto' });
      }
    });
    t.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
      if (!(e.key in keys)) return;
      e.preventDefault();
      let n = keys[e.key] === 'first' ? 0 : keys[e.key] === 'last' ? tabs.length - 1 : (i + keys[e.key] + tabs.length) % tabs.length;
      setTab(n, { focus: true });
      tabs[n].click();
    });
  });

  /* progress of a pinned section (0 at pin start, 1 at release) */
  const pinProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - vh));
  };
  /* progress of an element moving through the viewport (flow mode) */
  const flowProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((vh * .92 - r.top) / Math.max(1, r.height * .9));
  };

  function updateHero() {
    if (!pin && !mpin) { hero.style.removeProperty('--hp'); hero.style.removeProperty('--open'); return; }
    const hp = pinProgress(hero);
    hero.style.setProperty('--hp', hp.toFixed(4));
    hero.style.setProperty('--open', ease(win(hp, .12, .92)).toFixed(4));
  }

  function updateIdea() {
    const sk = sketches.idea;
    let p, tip;
    if (!motion) {
      drawSketch(sk, IDEA_FLOW, 1);
      drawSketch(sketches['idea-phone'], { 5: [0, 1] }, 1);
      return;
    }
    if (pin || mpin) {
      p = pinProgress(idea);
      tip = drawSketch(sk, IDEA_PIN, p);
      const edges = [0, ...ideaStepAt, 1];
      stepBars.forEach((bar, i) => bar.style.setProperty('--f', win(p, edges[i], edges[i + 1]).toFixed(3)));
      const tip2 = drawSketch(sketches['idea-phone'], IDEA_PIN, p);
      const active = ideaStepAt.filter((v) => p >= v).length;
      ideaSteps.forEach((li, i) => {
        li.classList.toggle('is-active', i === active);
        li.classList.toggle('is-done', i < active);
      });
      let k4 = 0;
      ideaReveal.forEach((el) => {
        const step = el.dataset.revealStep;
        const at = ideaRevealAt[step] + (step === '4' ? (k4++) * .028 : 0);
        el.classList.toggle('on', p >= at);
      });
      movePencil(ideaPencil, sk, tip || null);
    } else {
      p = flowProgress($('.drafting', idea));
      drawSketch(sk, IDEA_FLOW, p);
      drawSketch(sketches['idea-phone'], { 5: [0, 1] }, flowProgress($('.concept', idea)));
      movePencil(ideaPencil, sk, null);
    }
  }

  const storyGrid = $('.story__grid', story);
  const storyCopy = $('.story__copy', story);
  const storyTrack = $('.story__track', story);
  // small screens: the whole frame is sticky, so read progress off the track that follows it
  function trackProgress() {
    const t = storyTrack.getBoundingClientRect();
    return clamp((storyGrid.offsetHeight - t.top) / Math.max(1, t.height));
  }
  function updateStory() {
    const sk = sketches.v1;
    if (!motion) { drawSketch(sk, V1_FLOW, 1); stamp.classList.add('on'); return; }
    if (pin || mpin) {
      const p = pin ? pinProgress(story) : trackProgress();
      const tip = drawSketch(sk, V1_PIN, p);
      if (mpin) {
        // the description gives way to the demo; the title stays
        const dd = ease(win(p, .02, .14));
        story.style.setProperty('--d', dd.toFixed(4));
        storyCopy.classList.toggle('desc-off', dd > .98);
      }
      stamp.classList.toggle('on', p >= .62);
      // the box rises, its flaps open, the sheet and a pencil drop in, the flaps close
      story.style.setProperty('--b', ease(win(p, .64, .74)).toFixed(4));
      story.style.setProperty('--flap', (ease(win(p, .72, .79)) * (1 - ease(win(p, .93, .985)))).toFixed(4));
      archive.style.setProperty('--a', ease(win(p, .78, .89)).toFixed(4));
      story.style.setProperty('--c', ease(win(p, .84, .92)).toFixed(4));
      movePencil(storyPencil, sk, tip);
    } else {
      const p = flowProgress($('.blueprint', story));
      drawSketch(sk, V1_FLOW, p);
      stamp.classList.toggle('on', p >= .95);
      archive.style.removeProperty('--a');
      ['--b', '--flap', '--c', '--d'].forEach((v) => story.style.removeProperty(v));
      storyCopy.classList.remove('desc-off');
      movePencil(storyPencil, sk, null);
    }
  }

  // Chapter 3: the brief as a chat, one message per stretch of scroll,
  // with typing dots just before each of Hanei's replies
  const chatAt = chatMsgs.map((_, i) => .04 + i * (.86 / (chatMsgs.length - 1)));
  let chatTypingOn = null;
  function updateHow() {
    const p = motion && (pin || mpin) ? pinProgress(how) : 1;
    const shown = motion ? chatAt.filter((t) => p >= t).length : chatMsgs.length;
    if (shown !== chatShown) {
      chatShown = shown;
      chatMsgs.forEach((m, i) => m.classList.toggle('on', i < shown));
      const answers = chatMsgs.slice(0, shown).filter((m) => m.classList.contains('msg--you')).length;
      chatStep.textContent = `Step ${Math.min(5, answers) + (shown > SUMMARY_AT ? 1 : 0)}/6`;
    }
    const next = chatMsgs[shown];
    const typing = !!(motion && next && next.classList.contains('msg--hanei') && p >= chatAt[shown] - .035);
    if (typing !== chatTypingOn) { chatTypingOn = typing; chatTyping.classList.toggle('on', typing); }
  }

  function updateReveal() {
    if (!motion) return;
    if (pin) {
      const p = pinProgress(reveal);
      drawSketch(sketches.wire, { 1: [0, .14] }, p);
      wire.style.setProperty('--w', ease(win(p, .16, .3)).toFixed(4));
      setTab(TAB_AT.filter((v) => p >= v).length);
    } else {
      const p = flowProgress(phoneWrap);
      drawSketch(sketches.wire, { 1: [0, .45] }, p);
      wire.style.setProperty('--w', ease(win(p, .55, .9)).toFixed(4));
    }
  }

  function updateRail() {
    const max = Math.max(1, d.documentElement.scrollHeight - vh);
    rail.style.setProperty('--page', (scrollY / max).toFixed(4));
    let cur = 0;
    railLinks.forEach((r, i) => { if (scrollY + vh * .4 >= r.top) cur = i; });
    railLinks.forEach((r, i) => {
      if (i === cur) r.a.setAttribute('aria-current', 'true');
      else r.a.removeAttribute('aria-current');
    });
  }

  /* ------------------------------------------------------------ measure + loop */
  function measure() {
    vh = innerHeight;
    const max = Math.max(1, d.documentElement.scrollHeight - vh);
    railLinks.forEach((r) => {
      r.top = r.sec.getBoundingClientRect().top + scrollY;
      r.li.style.top = (clamp(r.top / max) * 100).toFixed(2) + '%';
    });
    // phone scale: fit the pinned card in the viewport, or the column on small screens
    const byHeight = pin ? (vh - 300) / 650 : 1;
    const byWidth = (phoneWrap.parentElement.clientWidth - 8) / 300;
    phoneWrap.style.setProperty('--ps', clamp(Math.min(byHeight, byWidth), .55, 1).toFixed(3));
    stringNotes();
    measureStoryNote();
    measureArchive();
  }

  /* small screens: the Chapter 2 note's full height and its title-only height, for the crop-up */
  function measureStoryNote() {
    const st = story.style;
    if (!mpin) { st.removeProperty('--full'); st.removeProperty('--mini'); return; }
    const h2 = $('h2', storyCopy);
    const pad = parseFloat(getComputedStyle(storyCopy).paddingBottom);
    st.setProperty('--full', storyCopy.scrollHeight + 'px');
    st.setProperty('--mini', Math.ceil(h2.offsetTop + h2.offsetHeight + pad) + 'px');
  }

  /* where the sheet and pencil must travel to land inside the box (layout offsets ignore transforms) */
  function measureArchive() {
    if (!pin && !mpin) return;
    const wall = archive.parentElement;
    const bw = archFront.offsetWidth, bh = archFront.offsetHeight;
    const bx = wall.clientWidth / 2 - bw / 2, by = archFront.offsetTop;
    const bodyBottom = by + bh * 244 / 260, bodyH = bh * 152 / 260, innerW = bw * 250 / 320;
    const w = archive.offsetWidth, h = archive.offsetHeight;
    const sc = Math.min(innerW * .8 / w, bodyH * .78 / h);
    archive.style.setProperty('--s', sc.toFixed(4));
    archive.style.setProperty('--dx', (bx + bw / 2 - w * sc / 2 - archive.offsetLeft).toFixed(1));
    archive.style.setProperty('--dy', (bodyBottom - 30 - h * sc - archive.offsetTop).toFixed(1));
    story.style.setProperty('--pdx', (bx + bw * .7 - archPencil.offsetLeft - archPencil.offsetWidth / 2).toFixed(1));
    story.style.setProperty('--pdy', (bodyBottom - 20 - archPencil.offsetTop - archPencil.offsetHeight).toFixed(1));
  }

  const scenes = [
    [hero, updateHero], [idea, updateIdea], [story, updateStory], [how, updateHow], [reveal, updateReveal],
  ];
  function update() {
    for (const [el, fn] of scenes) {
      const r = el.getBoundingClientRect();
      if (r.bottom > -vh * .5 && r.top < vh * 1.5) fn();
    }
    updateRail();
  }
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };
  addEventListener('scroll', onScroll, { passive: true });
  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { measure(); update(); }, 120);
  });

  function setMode() {
    motion = !mqReduce.matches;
    pin = motion && mqPin.matches;
    root.classList.toggle('motion', motion);
    root.classList.toggle('rm', !motion);
    mpin = motion && !pin;
    root.classList.toggle('pin', pin);
    root.classList.toggle('mpin', mpin);
    if (!motion) {
      // reduced motion: show every scene in its finished state
      $$('.sketch path, .sketch text, .sketch circle').forEach((el) => { el.style.strokeDashoffset = ''; el.style.opacity = ''; });
      Object.values(sketches).forEach((sk) => Object.values(sk.steps).forEach((items) => items.forEach((it) => { it.last = -1; })));
      $$('[data-reveal-step], [data-stamp]').forEach((el) => el.classList.add('on'));
      archive.style.removeProperty('--a');
    }
    measure();
    scenes.forEach(([, fn]) => fn());
    updateRail();
  }
  mqReduce.addEventListener('change', setMode);
  mqPin.addEventListener('change', setMode);

  /* doodles around the featured chair: drawn once, when the board comes into view */
  function drawDoodles() {
    const sk = sketches['board-doodles'];
    const wins = { 1: [0, .4], 2: [.3, .75], 3: [.6, 1] };
    if (!motion) { drawSketch(sk, wins, 1); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((en) => en.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now() + 200;
      const step = (now) => {
        const t = clamp((now - t0) / 1800);
        drawSketch(sk, wins, t);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .35 });
    io.observe(sk.svg);
  }

  /* a loose string between the two pinned notes on the left wall */
  const hnotes = $('[data-hnotes]');
  function stringNotes() {
    if (!hnotes || !hnotes.offsetParent) return;
    const box = hnotes.getBoundingClientRect();
    const a = $('.hnote--1', hnotes).getBoundingClientRect();
    const b = $('.hnote--2', hnotes).getBoundingClientRect();
    const x1 = a.left + a.width * .5 - box.left, y1 = a.top - box.top + 2;
    const x2 = b.left + b.width * .5 - box.left, y2 = b.top - box.top + 2;
    const cx = Math.min(x1, x2) - 60, cy = (y1 + y2) / 2 + 30;
    $('.hnotes__string path', hnotes).setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }

  /* flow sections fade in once */
  const fadeEls = $$('.finish__head, .ftab');
  const howFlow = $$('[data-reveal-step], [data-stamp]');
  if (motion) {
    fadeEls.forEach((el) => el.classList.add('fade'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: .15 });
    fadeEls.forEach((el) => io.observe(el));
    // without pinning, reveal the scene extras as they enter the viewport
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting && !pin && !mpin) en.target.classList.add('on'); });
    }, { threshold: .3 });
    howFlow.forEach((el) => { if (!el.matches('[data-stamp]')) io2.observe(el); });
  }

  /* ------------------------------------------------------------ chapter 5 furniture loop */
  const cyc = $('[data-cycle]');
  const cycItems = $$('.cycle__item', cyc);
  const cycName = $('[data-cycle-name]');
  const cycCat = $('[data-cycle-cat]');
  const cycToggle = $('[data-cycle-toggle]');
  let cycIdx = 0, cycTimer = 0, cycVisible = false, cycPaused = false;
  function cycShow(i) {
    cycItems[cycIdx].classList.remove('is-on');
    cycIdx = i;
    const it = cycItems[i];
    it.classList.add('is-on');
    cycName.textContent = it.dataset.name;
    cycCat.textContent = it.dataset.cat;
  }
  function cycRun() {
    clearInterval(cycTimer);
    if (motion && cycVisible && !cycPaused) cycTimer = setInterval(() => cycShow((cycIdx + 1) % cycItems.length), 2600);
  }
  new IntersectionObserver((entries) => { cycVisible = entries[0].isIntersecting; cycRun(); }, { threshold: .2 }).observe(cyc);
  cycToggle.addEventListener('click', () => {
    cycPaused = !cycPaused;
    cycToggle.setAttribute('aria-pressed', String(cycPaused));
    cycToggle.textContent = cycPaused ? 'Play' : 'Pause';
    cycRun();
  });
  mqReduce.addEventListener('change', cycRun);

  /* ------------------------------------------------------------ start */
  setMode();
  drawDoodles();
  addEventListener('load', () => { measure(); update(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { measure(); update(); });
})();
