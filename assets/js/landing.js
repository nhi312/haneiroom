/* HaneiRoom landing page: scroll progress for the three chapters.
   One passive scroll listener feeds a single requestAnimationFrame update.
   Geometry is measured on resize only. Without motion every scene is left in
   its finished state by the CSS, and only the trail, the app scale, the torn
   edges and the demo form run. */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------- outside links */
  var cfg = window.HANEI_CONFIG || {};
  if (cfg.cta && cfg.cta.href) {
    $$('[data-cta]').forEach(function (a) {
      a.setAttribute('href', cfg.cta.href);
      if (cfg.cta.newTab) { a.target = '_blank'; a.rel = 'noopener'; }
    });
  }

  /* ---------------------------------------------------------- modes */
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqPin = window.matchMedia('(min-width: 1024px) and (min-height: 620px)');
  function setMode() {
    var reduce = mqReduce.matches;
    root.classList.toggle('rm', reduce);
    root.classList.toggle('motion', !reduce);
    root.classList.toggle('pin', !reduce && mqPin.matches);
  }
  function moving() { return root.classList.contains('motion'); }
  function pinned() { return root.classList.contains('pin'); }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeIn(t) { return t * t * t; }
  function easeBack(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function setVars(el, vars) { for (var k in vars) el.style.setProperty('--' + k, vars[k].toFixed(4)); }
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

  /* Catmull-Rom through points, as an SVG path. */
  function curve(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += 'C' + [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]]
        .map(function (v) { return v.toFixed(1); }).join(' ');
    }
    return d;
  }

  var vw = 0, vh = 0;
  var nav = $('[data-nav]');

  /* ---------------------------------------------------------- 01 the mess */
  // The tools sit there, the confusion piles on, then both fly out and leave
  // the chair, the plan and its measurements.
  var mess = $('.mess'), stage1 = $('.mess__stage'), comp = $('.mess__comp');
  var planLines = $$('.mess__plan .l');
  var flyers = $$('.mess__comp .mi, .mess__comp .cf');
  var cards = $$('.sorted .sc');
  var messTop = 0, messH = 0, live = [];

  function layoutMess() {
    messTop = docTop(mess);
    messH = mess.offsetHeight;
    var w = comp.clientWidth, h = comp.clientHeight;
    var tools = 0, mixed = 0;
    live = flyers.filter(function (el) { return el.offsetParent !== null; }).map(function (el) {
      var isCf = el.classList.contains('cf');
      var cx = el.offsetLeft / w - .5, cy = el.offsetTop / h - .62;
      var len = Math.hypot(cx, cy) || 1;
      var k = isCf ? mixed++ : tools++;
      return { el: el, cf: isCf, k: k, r: parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0, dx: cx / len, dy: cy / len, spin: k % 2 ? 1 : -1 };
    });
    live.forEach(function (it) {
      var n = it.cf ? mixed : tools;
      it.tin = .08 + it.k * (.28 / n);
      it.tout = .46 + ((it.k * 7) % n) / n * .18 + (it.cf ? 0 : .04);
    });
  }

  function updateMess() {
    var p = clamp((window.scrollY - messTop) / Math.max(1, messH - vh), 0, 1);
    var w = comp.clientWidth;
    live.forEach(function (it) {
      var x = ramp(p, it.tout, it.tout + .1), out = easeIn(x);
      var tx = out * it.dx * w * 1.1, ty = out * it.dy * w * 1.1;
      var rot = it.r + out * it.spin * 140, sc = 1 - .3 * out, op = 1 - ramp(x, .5, 1);
      if (it.cf) {
        var e = ramp(p, it.tin, it.tin + .07), bk = easeBack(e);
        tx += (1 - bk) * it.dx * w * .25;
        ty += (1 - bk) * (it.dy * w * .25 - 40);
        rot += (1 - bk) * it.spin * 30;
        sc *= .5 + .5 * bk;
        op *= Math.min(1, e * 3);
      } else {
        var drift = ease(ramp(p, 0, .4)) * w * .025;
        tx += it.dx * drift;
        ty += it.dy * drift;
      }
      it.el.style.transform = 'translate(-50%,-50%) translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      it.el.style.opacity = op.toFixed(3);
    });
    var d = ramp(p, .14, .42), n = planLines.length;
    planLines.forEach(function (l, i) {
      var s = i / n * .65;
      l.style.strokeDashoffset = (1 - ramp(d, s, s + .35)).toFixed(3);
    });
    setVars(comp, { 'plan-o': ramp(p, .12, .24), clean: ramp(p, .58, .66), e: ease(ramp(p, .5, .6)), fade: ramp(p, .62, .7), bgin: ramp(p, .62, .72) });
    cards.forEach(function (c, i) { c.style.setProperty('--s', ease(ramp(p, .66 + i * .025, .74 + i * .025)).toFixed(3)); });
    setVars(stage1, { swap: ramp(p, .56, .66) });
  }

  /* ---------------------------------------------------------- 02 the trail */
  var proc = $('.process'), trail = $('.trail');
  var reveal = $('.trail__reveal'), dash = $('.trail__dash'), head = $('.trail__head');
  var stops = $$('[data-stop]');
  var trailLen = 0, procTop = 0, samples = [], stopLens = [];

  function buildTrail() {
    var box = proc.getBoundingClientRect();
    var w = box.width, h = proc.offsetHeight;
    var headBox = $('.process__head').getBoundingClientRect();
    var pts = [[w / 2, headBox.bottom - box.top + 12]];
    var badges = [];
    stops.forEach(function (s) {
      var n = $('.stop__num', s).getBoundingClientRect();
      var cx = n.left + n.width / 2 - box.left, cy = n.top + n.height / 2 - box.top;
      badges.push([cx, cy]);
      pts.push([cx, cy]);
      pts.push([cx, s.getBoundingClientRect().bottom - box.top + 28]);
    });
    pts.push([w / 2, h - 70]);

    trail.setAttribute('viewBox', '0 0 ' + w.toFixed(0) + ' ' + h.toFixed(0));
    var d = curve(pts);
    dash.setAttribute('d', d);
    reveal.setAttribute('d', d);
    trailLen = dash.getTotalLength();
    reveal.style.strokeDasharray = trailLen + ' ' + trailLen;

    // y of the trail along its length, made monotonic so a small overshoot never stalls it
    samples = [];
    var maxY = -Infinity, k = 400;
    for (var i = 0; i <= k; i++) {
      var l = trailLen * i / k, pt = dash.getPointAtLength(l);
      maxY = Math.max(maxY, pt.y);
      samples.push({ l: l, y: maxY, x: pt.x, py: pt.y });
    }
    stopLens = badges.map(function (b) {
      var best = 0, bestD = Infinity;
      samples.forEach(function (s) {
        var dd = (s.x - b[0]) * (s.x - b[0]) + (s.py - b[1]) * (s.py - b[1]);
        if (dd < bestD) { bestD = dd; best = s.l; }
      });
      return best;
    });

    var end = dash.getPointAtLength(trailLen), before = dash.getPointAtLength(trailLen - 16);
    var a = Math.atan2(end.y - before.y, end.x - before.x), r = 20;
    head.setAttribute('d', 'M' + (end.x + Math.cos(a + 2.4) * r).toFixed(1) + ' ' + (end.y + Math.sin(a + 2.4) * r).toFixed(1) +
      'L' + end.x.toFixed(1) + ' ' + end.y.toFixed(1) +
      'L' + (end.x + Math.cos(a - 2.4) * r).toFixed(1) + ' ' + (end.y + Math.sin(a - 2.4) * r).toFixed(1));
    procTop = docTop(proc);
  }

  function drawnLength() {
    if (!moving()) return trailLen;
    var line = window.scrollY + vh * .62 - procTop;
    var lo = 0, hi = samples.length - 1;
    if (samples[0].y > line) return 0;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (samples[mid].y <= line) lo = mid; else hi = mid - 1;
    }
    return samples[lo].l;
  }

  function updateTrail() {
    if (!trailLen) return;
    var drawn = drawnLength();
    reveal.style.strokeDashoffset = (trailLen - drawn).toFixed(1);
    head.style.opacity = drawn >= trailLen - 4 ? 1 : 0;
    stops.forEach(function (s, i) { s.classList.toggle('is-on', drawn >= stopLens[i] - 6); });
  }

  /* ---------------------------------------------------------- 03 what changed */
  var aroundHead = $('[data-around]');
  var gallery = $('.gallery'), stage = $('.gallery__stage');
  var inner = $('.frame__inner'), ui = $('.app__ui');
  var phone = $('.phone'), thenNote = $('.tag-note--then'), nowNote = $('.tag-note--now');
  var G = null, galTop = 0, galH = 0;

  function uiWidth() {
    var w = parseFloat(getComputedStyle(inner).getPropertyValue('--ui-w')) || 1000;
    return w;
  }

  function layoutGallery() {
    [stage, phone, thenNote, nowNote, ui].forEach(function (el) { el.removeAttribute('style'); });
    G = null;
    if (!pinned()) {
      ui.style.setProperty('--ui-s', (inner.clientWidth / uiWidth()).toFixed(4));
      return;
    }
    var top = 150, b = 26; // room for the pinned title above the frame
    var avail = (vh - top - 28) * .9;
    var fh0 = Math.min(avail, 660) - 2 * b, fw0 = fh0 * 393 / 852;
    var fw1 = Math.min(vw * (vw < 1280 ? .54 : .58), 980), fh1 = fw1 * .625;
    if (fh1 + 2 * b > avail) { fh1 = avail - 2 * b; fw1 = fh1 / .625; }
    var side = (vw - fw1 - 2 * b) / 2;
    var pw1 = clamp(side - 64, 110, 190);
    var cy = top + (vh - top) / 2;
    G = {
      fw0: fw0, fh0: fh0, fw1: fw1, fh1: fh1,
      ps1: pw1 / fw0, px1: -(fw1 / 2 + b + side / 2) + 6
    };
    stage.style.setProperty('--cy', cy.toFixed(0) + 'px');
    phone.style.setProperty('--pw', fw0.toFixed(1));

    var noteW = clamp(side - 28, 150, 240);
    thenNote.style.width = noteW + 'px';
    thenNote.style.left = (vw / 2 + G.px1 - noteW / 2).toFixed(0) + 'px';
    thenNote.style.top = (cy + fh0 * G.ps1 / 2 + 22).toFixed(0) + 'px';
    var nowW = clamp(side + 20, 170, 250);
    nowNote.style.width = nowW + 'px';
    nowNote.style.left = (vw / 2 + fw1 / 2 + b - 44).toFixed(0) + 'px';
    nowNote.style.top = (cy - fh1 / 2 + 36).toFixed(0) + 'px';
    galTop = docTop(gallery);
    galH = gallery.offsetHeight;
  }

  /* The v1 scan plays inside the phone, then the app makes a project. Both run
     from a 0..1 progress, so the same code serves the pinned frame and the stack. */
  var wires = $$('.ar__wire'), status = $('[data-status]');
  var proj = $('[data-proj]'), projSw = $$('.proj__sw i', proj);
  var projStatus = $('[data-status-done]', proj);

  // Kreativ-style: pan to capture the room, map it, pick a piece, place it, move and turn it, buy it.
  function playScan(p) {
    var sweep = ramp(p, .04, .3), turn = ease(ramp(p, .68, .82)), face = Math.cos(turn * Math.PI);
    setVars(phone, {
      pan: Math.sin(sweep * Math.PI * 2) * 5,
      cap: ramp(p, .02, .06) * (1 - ramp(p, .3, .34)),
      prog: sweep,
      frame: ramp(p, .02, .08) * (1 - ramp(p, .84, .92)),
      status: ramp(p, .02, .08),
      mesh: ramp(p, .28, .32) * (1 - .7 * ramp(p, .84, .94)),
      pins: ramp(p, .4, .46) * (1 - ramp(p, .84, .92)),
      sheet: ease(ramp(p, .46, .52)) * (1 - ease(ramp(p, .57, .62))),
      tap: ramp(p, .52, .55) * (1 - ramp(p, .57, .6)),
      ghost: ramp(p, .58, .62),
      chair: easeBack(ramp(p, .6, .68)),
      mx: lerp(-16, 0, ease(ramp(p, .68, .8))),
      face: (face < 0 ? -1 : 1) * Math.max(Math.abs(face), .3),
      turnui: ramp(p, .66, .7) * (1 - ramp(p, .82, .86)),
      spin: turn * 40,
      buy: ramp(p, .86, .92)
    });
    var d = ramp(p, .28, .46);
    wires.forEach(function (w, i) { w.style.strokeDashoffset = (1 - ramp(d, i * .3, i * .3 + .7)).toFixed(3); });
    status.textContent = p < .3 ? 'Move around to scan the room' : p < .46 ? 'Room mapped' : p < .6 ? 'Pick a piece to try'
      : p < .84 ? 'Move it, turn it' : 'Looks right? Buy the exact piece.';
    phone.classList.toggle('is-placed', p > .86);
  }

  function playApp(p) {
    // cursor coordinates are in the app panel: New Project, then the new card's arrow
    var move = ease(ramp(p, .06, .26)), next = ease(ramp(p, .8, .9));
    setVars(ui, {
      co: ramp(p, 0, .06) * (1 - ramp(p, .94, 1)),
      cx: lerp(lerp(560, 74, move), 304, next),
      cy: lerp(lerp(430, 150, move), 312, next),
      press: ramp(p, .26, .3) * (1 - ramp(p, .32, .36))
    });
    setVars(proj, { in: ease(ramp(p, .32, .46)), glow: ramp(p, .72, .78) * (1 - ramp(p, .9, .98)) });
    projSw.forEach(function (sw, i) { sw.style.setProperty('--sw', ramp(p, .48 + i * .05, .52 + i * .05).toFixed(3)); });
    projStatus.textContent = p > .76 ? 'Status: Done' : 'Status: Draft';
  }

  function updateGallery() {
    if (!G) {
      // stacked: each demo plays as it crosses the screen
      var ph = phone.getBoundingClientRect(), fr = inner.getBoundingClientRect();
      playScan(clamp((vh * .85 - ph.top) / (ph.height + vh * .25), 0, 1));
      playApp(clamp((vh * .9 - fr.top) / (fr.height + vh * .35), 0, 1));
      return;
    }
    var p = clamp((window.scrollY - galTop) / (galH - vh), 0, 1);
    var m = ease(ramp(p, .46, .66)), t = ease(ramp(p, .44, .6));
    var fw = lerp(G.fw0, G.fw1, m), fh = lerp(G.fh0, G.fh1, m);
    stage.style.setProperty('--fw', fw.toFixed(1));
    stage.style.setProperty('--fh', fh.toFixed(1));
    ui.style.setProperty('--ui-s', (fw / 1000).toFixed(4));
    ui.style.setProperty('--ui-o', ramp(p, .5, .64).toFixed(3));
    phone.style.setProperty('--px', (G.px1 * t).toFixed(1));
    phone.style.setProperty('--pr', (-6 * t).toFixed(2));
    phone.style.setProperty('--ps', lerp(1, G.ps1, t).toFixed(4));
    phone.style.setProperty('--tape-o', ramp(p, .54, .6).toFixed(3));
    thenNote.style.setProperty('--o', ramp(p, .58, .68).toFixed(3));
    nowNote.style.setProperty('--o', ramp(p, .9, .97).toFixed(3));
    stage.classList.toggle('is-now', p > .52);
    playScan(ramp(p, .02, .42));
    playApp(ramp(p, .66, .96));
  }

  var venn = $('.venn');
  function updateVenn() {
    var r = venn.getBoundingClientRect();
    venn.style.setProperty('--v', ease(clamp((vh * .9 - r.top) / (vh * .5), 0, 1)).toFixed(4));
  }

  function updateAround() {
    var r = aroundHead.getBoundingClientRect();
    aroundHead.style.setProperty('--h', ease(clamp((vh - r.top) / (vh * .7), 0, 1)).toFixed(4));
  }

  /* ---------------------------------------------------------- book a demo */
  var demo = $('.demo'), rows = $$('.demo__row');
  function updateDemo() {
    var r = demo.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    var p = (vh - r.top) / (vh + r.height);
    rows.forEach(function (row) {
      row.style.setProperty('--shift', ((p - .5) * 260 * parseFloat(row.dataset.row)).toFixed(1));
    });
  }

  var form = $('[data-demo-form]');
  if (form) {
    var input = $('input', form), msg = $('.demo__msg', form);
    var action = cfg.demoForm && cfg.demoForm.action;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = input.checkValidity() && input.value.trim() !== '';
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      msg.classList.toggle('is-error', !ok);
      if (!ok) { msg.textContent = 'That email doesn\'t look right. Mind checking it?'; input.focus(); return; }
      if (!action) {
        msg.classList.add('is-error');
        msg.textContent = 'Demo sign-up isn\'t connected yet, so nothing was sent.';
        return;
      }
      msg.textContent = 'Sending…';
      fetch(action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          msg.textContent = 'Got it. We\'ll be in touch about your demo.';
        })
        .catch(function () {
          msg.classList.add('is-error');
          msg.textContent = 'That didn\'t go through. Please try again in a moment.';
        });
    });
  }

  /* ---------------------------------------------------------- torn paper */
  function rng(seed) {
    return function () { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  }
  // A ripped top edge: a slow wave plus fine jitter, as a clip-path polygon.
  // `wave` adds the slow curve; fiber and paper share a phase so the white rim follows it.
  function tear(seed, base, amp, wave, phase) {
    var r = rng(seed), pts = [], x = 0;
    if (wave === undefined) { wave = amp * .5; phase = seed; }
    while (x < 100) {
      var y = base + Math.sin(x * .09 + phase) * wave + Math.sin(x * .21 + phase * 2) * wave * .25 + (r() - .5) * amp;
      pts.push(x.toFixed(2) + '% ' + y.toFixed(1) + 'px');
      x += .4 + r() * 1.4;
    }
    pts.push('100% ' + base + 'px', '100% 100%', '0% 100%');
    return 'polygon(' + pts.join(',') + ')';
  }
  function cutTears() {
    $$('.tear-edge').forEach(function (t, i) {
      $('.tear__fiber', t).style.clipPath = tear(31 + i * 17, 10, 10);
      $('.tear__paper', t).style.clipPath = tear(32 + i * 17, 17, 9);
    });
    stops.forEach(function (st, i) {
      var phase = 1 + i * 2.1;
      $('.stop__fiber', st).style.clipPath = tear(71 + i * 13, 30, 8, 22, phase);
      $('.stop__paper', st).style.clipPath = tear(72 + i * 13, 37, 7, 22, phase);
    });
  }

  /* ---------------------------------------------------------- loop */
  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    layoutMess();
    buildTrail();
    layoutGallery();
    update();
  }

  function update() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
    updateTrail();
    if (!moving()) return;
    updateMess();
    updateAround();
    updateGallery();
    updateVenn();
    updateDemo();
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; update(); });
  }

  var resizeTimer = 0;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(measure, 120);
  }
  function onModeChange() {
    setMode();
    if (!moving()) {
      [comp, stage1, aroundHead, ui, proj, venn].concat(planLines, rows).forEach(function (el) { el.removeAttribute('style'); });
      // these carry their own layout inline, so only clear what the animation set
      flyers.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; });
      projSw.forEach(function (el) { el.style.removeProperty('--sw'); });
      wires.forEach(function (w) { w.removeAttribute('style'); });
      phone.classList.remove('is-placed');
      stage.classList.remove('is-now');
      status.textContent = 'Looks right? Buy the exact piece.';
      projStatus.textContent = 'Status: Done';
    }
    measure();
  }

  setMode();
  cutTears();
  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  [mqReduce, mqPin].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onModeChange);
    else if (mq.addListener) mq.addListener(onModeChange);
  });
  // Heights settle as fonts and images arrive.
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
})();
