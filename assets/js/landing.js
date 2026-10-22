/* HaneiRoom landing page: scroll progress for the three chapters.
   One passive scroll listener feeds a single requestAnimationFrame update.
   Geometry is measured on resize only. Without motion every scene is left in
   its finished state by the CSS, and only the trail and the app scale run. */
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
  var mess = $('.mess'), comp = $('.mess__comp');
  var planLines = $$('.mess__plan .l');
  var messTop = 0, messH = 0;

  function updateMess() {
    var y = window.scrollY - messTop;
    var p = pinned() ? clamp(y / (messH - vh), 0, 1) : clamp(y / (messH * .8), 0, 1);
    comp.style.setProperty('--e', ease(ramp(p, 0, .75)).toFixed(4));
    var d = ramp(p, .1, .8), n = planLines.length;
    planLines.forEach(function (l, i) {
      var s = i / n * .65;
      l.style.strokeDashoffset = (1 - ramp(d, s, s + .35)).toFixed(3);
    });
    comp.style.setProperty('--plan-o', ramp(p, .4, .65).toFixed(3));
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
    var top = 72, b = 26;
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

  function updateGallery() {
    if (!G) return;
    var p = clamp((window.scrollY - galTop) / (galH - vh), 0, 1);
    var m = ease(ramp(p, .2, .56)), t = ease(ramp(p, .14, .5));
    var fw = lerp(G.fw0, G.fw1, m), fh = lerp(G.fh0, G.fh1, m);
    stage.style.setProperty('--fw', fw.toFixed(1));
    stage.style.setProperty('--fh', fh.toFixed(1));
    ui.style.setProperty('--ui-s', (fw / 1000).toFixed(4));
    ui.style.setProperty('--ui-o', ramp(p, .3, .5).toFixed(3));
    phone.style.setProperty('--px', (G.px1 * t).toFixed(1));
    phone.style.setProperty('--pr', (-6 * t).toFixed(2));
    phone.style.setProperty('--ps', lerp(1, G.ps1, t).toFixed(4));
    phone.style.setProperty('--tape-o', ramp(p, .38, .5).toFixed(3));
    thenNote.style.setProperty('--o', ramp(p, .48, .6).toFixed(3));
    nowNote.style.setProperty('--o', ramp(p, .62, .74).toFixed(3));
  }

  function updateAround() {
    var r = aroundHead.getBoundingClientRect();
    aroundHead.style.setProperty('--h', ease(clamp((vh - r.top) / (vh * .7), 0, 1)).toFixed(4));
  }

  /* ---------------------------------------------------------- loop */
  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    messTop = docTop(mess);
    messH = mess.offsetHeight;
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
      [comp, aroundHead].forEach(function (el) { el.removeAttribute('style'); });
      planLines.forEach(function (l) { l.removeAttribute('style'); });
    }
    measure();
  }

  setMode();
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
