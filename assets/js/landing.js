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
    stops.forEach(function (s, i) {
      var n = $('.stop__num', s).getBoundingClientRect();
      var cx = n.left + n.width / 2 - box.left, cy = n.top + n.height / 2 - box.top;
      badges.push([cx, cy]);
      pts.push([cx, cy]);
      if (i < stops.length - 1) { pts.push([cx, s.getBoundingClientRect().bottom - box.top + 28]); return; }
      // the last band ends the section, so the trail stops on it: it runs down
      // beside the picks card, then turns and points straight at its middle
      var pick = $('.ui--picks', s), card = pick.getBoundingClientRect();
      // measured before the stop reveals, the card still sits on its entrance offset
      var lift = parseFloat((getComputedStyle(pick).translate || '').split(' ')[1]) || 0;
      var my = (card.top + card.bottom) / 2 - lift - box.top, cl = card.left - box.left - 16;
      var gap = cl - cx;
      if (gap > 90) {
        pts.push([cx, my - 70]);
        pts.push([cx + gap * .4, my]);
      } else pts.push([cx, my - 40]);
      pts.push([cl, my]);
    });

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
  var scan = $('.scan'), thenNote = $('.tag-note--then'), reels = $$('.reel');
  var G = null, S = null, galTop = 0, galH = 0, panAmp = 3;

  function layoutGallery() {
    [stage, scan, thenNote].concat(reels).forEach(function (el) { el.removeAttribute('style'); });
    G = S = null;
    // The room photo covers the screen. A wide screen sees nearly all of it, so the
    // camera only drifts; a phone sees a third, so it sweeps from the door to the window.
    var W = Math.max(vw, vh * 1264 / 843);
    panAmp = Math.max(3, (W - vw) / 2 / W * 80);
    // the plane and its arrows span half the photo; keep them clear of the tool rail
    scan.style.setProperty('--fit', Math.min(1, vw * .84 / (W * .495)).toFixed(3));
    if (!pinned()) {
      if (moving()) layoutStack();
      return;
    }
    var top = 150, b = 26; // room for the pinned title above the frame
    var avail = (vh - top - 28) * .9;
    var fh0 = Math.min(avail, 660) - 2 * b, fw0 = fh0 * 393 / 852;
    var cy = top + (vh - top) / 2;
    // the three screens sit in a row under the title, each with its caption below
    var gap = 24, capH = 84;
    var rw = Math.min((vw - 80 - 2 * gap) / 3, 460), rh = reelH(rw);
    if (rh + capH > vh - top - 20) { rh = vh - top - 20 - capH; rw = reelW(rh); }
    var x0 = (vw - 3 * rw - 2 * gap) / 2, y0 = top + (vh - top - rh - capH) / 2;
    G = {
      cy: cy,
      phone: { x: vw / 2 - fw0 / 2 - b, y: cy - fh0 / 2 - b, w: fw0 + 2 * b, h: fh0 + 2 * b },
      slots: [0, 1, 2].map(function (i) { return { x: x0 + i * (rw + gap), y: y0, w: rw, h: rh }; })
    };
    stage.style.setProperty('--cy', cy.toFixed(0) + 'px');
    stage.style.setProperty('--fw', fw0.toFixed(1));
    stage.style.setProperty('--fh', fh0.toFixed(1));

    var side = (vw - fw0) / 2 - b;
    var noteW = clamp(side - 28, 150, 240);
    thenNote.style.width = noteW + 'px';
    // left of the phone, below the palette; the chair card sits on its right
    thenNote.style.left = (vw / 2 - fw0 / 2 - b - 40 - noteW).toFixed(0) + 'px';
    thenNote.style.top = (cy + 20).toFixed(0) + 'px';
    galTop = docTop(gallery);
    galH = gallery.offsetHeight;
  }

  // A HaneiAI screen is a 36px title bar and a 10px rim around a 440 × 400 stage.
  function reelH(w) { return 46 + (w - 20) * 400 / 440; }
  function reelW(h) { return 20 + (h - 46) * 440 / 400; }

  // Stacked: the camera view shrinks into a phone, which breaks into three small
  // screens down the page, nudged left, right, left. When a row gives bigger
  // screens (a phone on its side), they sit side by side instead.
  function layoutStack() {
    var top = 76, H = vh - top - 16, gap = 12, slots;
    var cw = Math.min(reelW((H - 2 * gap) / 3), vw * .76, 460);
    var rowW = Math.min((vw - 32 - 2 * gap) / 3, reelW(H), 460);
    if (rowW > cw) {
      var rh0 = reelH(rowW), x0 = (vw - 3 * rowW - 2 * gap) / 2;
      slots = [0, 1, 2].map(function (i) { return { x: x0 + i * (rowW + gap), y: top + (H - rh0) / 2, w: rowW, h: rh0 }; });
    } else {
      var rh = reelH(cw), y0 = top + (H - 3 * rh - 2 * gap) / 2, nudge = Math.min(cw * .22, (vw - 32 - cw) / 2);
      slots = [0, 1, 2].map(function (i) { return { x: (vw - cw) / 2 + (i === 1 ? nudge : -nudge), y: y0 + i * (rh + gap), w: cw, h: rh }; });
    }
    var pw = Math.min(vw * .64, 320, (H - 40) / 2.05), ph = Math.min(H - 40, pw * 2.05);
    S = { phone: { x: (vw - pw) / 2, y: top + H - ph - 8, w: pw, h: ph }, slots: slots };
  }

  /* HaneiRoom's scan plays across the screen, then the phone breaks into HaneiAI's
     three screens. Both run from a 0..1 progress, so the same code serves the
     pinned stage and the stack. */
  var status = $('[data-status]');

  // Scan the room, find the floor, measure it, pick the chair, place that same chair,
  // then tap Buy and open its shop card.
  // `hide` fades the phone's own controls once the view shrinks into a phone.
  function playScan(p, hide) {
    var sweep = ramp(p, .04, .4), keep = 1 - (hide || 0);
    setVars(scan, {
      ui: ramp(p, 0, .06) * keep,
      pan: Math.sin(sweep * Math.PI * 2) * panAmp,
      zoom: lerp(1.08, 1, ease(ramp(p, .34, .46))),
      floor: ease(ramp(p, .38, .5)),
      outline: ramp(p, .42, .54),
      dims: easeBack(ramp(p, .5, .56)),
      marker: ramp(p, .56, .6) * (1 - ramp(p, .78, .82)),
      place: ramp(p, .58, .62) * (1 - ramp(p, .66, .7)),
      sheet: ease(ramp(p, .66, .71)) * (1 - ease(ramp(p, .76, .8))),
      tap: ramp(p, .73, .75) * (1 - ramp(p, .76, .78)),
      chair: easeBack(ramp(p, .79, .85)),
      foot: ramp(p, .82, .87),
      buy: ramp(p, .85, .88) * keep,
      btap: ramp(p, .89, .91) * (1 - ramp(p, .92, .94)),
      deal: ease(ramp(p, .92, .97)) * keep
    });
    status.textContent = p < .38 ? 'Scanning your space…' : p < .66 ? 'Floor found' : p < .82 ? 'Pick a piece' : 'Looks right?';
  }

  // From the phone's rect out to their own places between t0 and t1, a beat apart,
  // tipping as they go; from `out` they lift away again. Scrolling back reverses it all.
  // A screen is live (reels.js loops its demo) only while it sits still in place.
  function playReels(p, L, t0, t1, out) {
    reels.forEach(function (r, i) {
      var d = i * .015, m = ease(ramp(p, t0 + d, t1 + d)), o = ease(ramp(p, out + d, out + .03 + d));
      var a = L.phone, z = L.slots[i];
      setVars(r, {
        x: lerp(a.x, z.x, m), y: lerp(a.y, z.y, m) - o * 80,
        w: lerp(a.w, z.w, m), h: lerp(a.h, z.h, m),
        r: (1 - m) * (i - 1) * 7 + o * (1 - i) * 4,
        o: ramp(p, t0 - .02, t0) * (1 - o), co: ramp(m, .75, 1)
      });
      var live = m > .97 && o < .03;
      if (live !== (r.getAttribute('data-live') === '1')) r.setAttribute('data-live', live ? '1' : '');
    });
  }

  function updateGallery() {
    if (!G) {
      if (!S) return;
      // stacked: one pinned screen; the scan plays, shrinks into a phone, and the phone breaks into three
      var gr = gallery.getBoundingClientRect(), q = clamp(-gr.top / Math.max(gr.height - vh, 1), 0, 1);
      var c = ease(ramp(q, .5, .58)), ph = S.phone;
      playScan(ramp(q, 0, .48), ramp(q, .5, .54));
      setVars(scan, {
        ct: c * ph.y, cx: c * ph.x, cb: c * (vh - ph.y - ph.h), cr: c * 28,
        so: 1 - ramp(q, .6, .63)
      });
      thenNote.style.setProperty('--o', (ramp(q, .5, .54) * (1 - ramp(q, .58, .61))).toFixed(3));
      playReels(q, S, .6, .72, .95);
      return;
    }
    var p = clamp((window.scrollY - galTop) / (galH - vh), 0, 1);
    // the camera view shrinks into a phone, then the phone breaks into three screens
    var k = ease(ramp(p, .62, .7)), ph = G.phone;
    setVars(stage, { fo: ramp(p, .64, .7), head: ramp(p, .68, .74), sp: ramp(p, .72, .76) });
    playScan(ramp(p, .02, .55), ramp(p, .6, .64));
    setVars(scan, {
      ct: k * ph.y, cx: k * ph.x, cb: k * (vh - ph.y - ph.h), cr: k * 24,
      so: 1 - ramp(p, .72, .75)
    });
    thenNote.style.setProperty('--o', (ramp(p, .7, .73) * (1 - ramp(p, .73, .76))).toFixed(3));
    stage.classList.toggle('is-now', p > .74);
    playReels(p, G, .72, .82, .955);
  }

  var duo = $('.duo');
  function updateDuo() {
    var r = duo.getBoundingClientRect();
    duo.style.setProperty('--v', ease(clamp((vh * .9 - r.top) / (vh * .5), 0, 1)).toFixed(4));
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
    var input = $('input[type=email]', form), msg = $('.demo__msg', form), btn = $('button', form);
    var action = cfg.demoForm && cfg.demoForm.action;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (btn.disabled) return;
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
      btn.disabled = true;
      fetch(action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (res) {
          if (res.ok) return;
          // Formspree explains a rejected submission (a bad address, a full quota) in its JSON
          return res.json().catch(function () { return {}; }).then(function (data) {
            var why = data.errors && data.errors.length && data.errors.map(function (e) { return e.message; }).join(' ');
            throw { why: why };
          });
        })
        .then(function () {
          form.reset();
          msg.textContent = 'Got it. We\'ll be in touch about your demo.';
          celebrate();
        })
        .catch(function (err) {
          msg.classList.add('is-error');
          msg.textContent = (err && err.why) || 'That didn\'t go through. Please try again in a moment.';
        })
        .then(function () { btn.disabled = false; });
    });
  }

  // The pitch above the form gives way to the flower in its hard hat, and paper
  // confetti bursts from the button.
  function celebrate() {
    var box = form.closest('.demo__box');
    box.classList.add('is-sent');
    $('.demo__ask', box).setAttribute('aria-hidden', 'true');
    $('.demo__done', box).setAttribute('aria-hidden', 'false');
    if (moving()) confetti(form.closest('.demo'), btn);
  }

  function confetti(host, from) {
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    var W = host.clientWidth, H = host.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.className = 'confetti';
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.scale(dpr, dpr);
    host.appendChild(cv);
    var hb = host.getBoundingClientRect(), fb = from.getBoundingClientRect();
    var ox = fb.left + fb.width / 2 - hb.left, oy = fb.top + fb.height / 2 - hb.top;
    var colors = ['#ff912c', '#ff7a3c', '#253a82', '#93a4de', '#fcc490', '#7fb07a', '#a85a22', '#fffdf8'];
    var bits = [];
    for (var i = 0; i < 150; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * 2.2, v = 7 + Math.random() * 11;
      bits.push({
        x: ox + (Math.random() - .5) * fb.width * .6, y: oy,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * .35,
        w: 6 + Math.random() * 7, h: 4 + Math.random() * 6, flip: Math.random() * Math.PI,
        c: colors[i % colors.length], kind: i % 5 // paper strips mostly, some dots and squiggles
      });
    }
    var t0 = performance.now();
    function frame(now) {
      var t = now - t0;
      ctx.clearRect(0, 0, W, H);
      bits.forEach(function (b) {
        b.vx *= .985; b.vy = b.vy * .985 + .32;
        b.x += b.vx; b.y += b.vy; b.r += b.vr; b.flip += .12;
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.r);
        ctx.globalAlpha = Math.max(0, Math.min(1, (4200 - t) / 800));
        ctx.fillStyle = ctx.strokeStyle = b.c;
        if (b.kind === 3) { ctx.beginPath(); ctx.arc(0, 0, b.h / 2 + 1, 0, Math.PI * 2); ctx.fill(); }
        else if (b.kind === 4) {
          ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
          ctx.moveTo(-b.w, 0); ctx.quadraticCurveTo(-b.w / 2, -5, 0, 0); ctx.quadraticCurveTo(b.w / 2, 5, b.w, 0); ctx.stroke();
        } else { ctx.scale(1, Math.cos(b.flip)); ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); }
        ctx.restore();
      });
      if (t < 4200) window.requestAnimationFrame(frame); else cv.remove();
    }
    window.requestAnimationFrame(frame);
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
    updateDuo();
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
      [comp, stage1, aroundHead, duo, stage, scan, thenNote].concat(reels, planLines, rows).forEach(function (el) { el.removeAttribute('style'); });
      reels.forEach(function (r) { r.removeAttribute('data-live'); });
      // these carry their own layout inline, so only clear what the animation set
      flyers.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; });
      stage.classList.remove('is-now');
      status.textContent = 'Looks right?';
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
