/* HaneiRoom landing page: the hero's tape, then scroll progress for HaneiRoom and HaneiAI.
   One passive scroll listener feeds a single requestAnimationFrame update.
   Geometry is measured on resize only. Without motion every scene is left in
   its finished state by the CSS, and only the app scale, the HaneiAI anchor
   and the demo form run. */
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

  var vw = 0, vh = 0;
  var nav = $('[data-nav]');

  /* ---------------------------------------------------------- 01 the tape */
  // Marks each tape along one edge: a tick every centimetre (data-step units), a
  // longer one every half and a number every whole. The paths never change, so this
  // runs once; the tick sizes follow the tape's width (data-edge is half of it).
  function markTape() {
    var NS = 'http://www.w3.org/2000/svg';
    $$('.ruler').forEach(function (svg) {
      var path = $('.ruler__path', svg), ticks = $('.ruler__ticks', svg);
      if (!path || !path.getTotalLength) return;
      var edge = +svg.dataset.edge, step = +svg.dataset.step, u = edge / 21;
      var len = path.getTotalLength(), d = '', k = 0;
      for (var l = step; l < len - step; l += step, k++) {
        var a = path.getPointAtLength(l), b = path.getPointAtLength(l + 1);
        var tx = b.x - a.x, ty = b.y - a.y, n = Math.hypot(tx, ty) || 1;
        var nx = -ty / n, ny = tx / n, size = (k % 10 === 9 ? 15 : k % 5 === 4 ? 10 : 6) * u;
        d += 'M' + (a.x + nx * edge).toFixed(1) + ' ' + (a.y + ny * edge).toFixed(1) +
          'L' + (a.x + nx * (edge - size)).toFixed(1) + ' ' + (a.y + ny * (edge - size)).toFixed(1);
        if (k % 10 === 9) {
          var t = document.createElementNS(NS, 'text');
          t.setAttribute('transform', 'translate(' + (a.x - nx * 2 * u).toFixed(1) + ' ' + (a.y - ny * 2 * u).toFixed(1) + ') rotate(' + (Math.atan2(ty, tx) * 180 / Math.PI).toFixed(1) + ')');
          t.setAttribute('text-anchor', 'middle');
          t.textContent = (k + 1) / 10;
          ticks.appendChild(t);
        }
      }
      var marks = document.createElementNS(NS, 'path');
      marks.setAttribute('d', d);
      ticks.insertBefore(marks, ticks.firstChild);
    });
  }

  /* ---------------------------------------------------------- 02 HaneiRoom, then HaneiAI */
  var gallery = $('.gallery'), stage = $('.gallery__stage'), mark = $('.gallery__mark');
  var scan = $('.scan'), scanView = $('.scan__view'), pitch = $('.pitch'), reels = $$('.reel');
  var bridge = $('.bridge'), aiHead = $('.ai-head'), desk = $('.deskwin');
  var G = null, S = null, galTop = 0, galH = 0, panAmp = 3;
  var FB = 7; // the phone's bezel, as .frame's --b
  var PK = 1.4; // how much bigger the pieces stand on a phone-sized screen, as .scan's --chair-k there
  var full = null, screen = null; // the camera view at full size, and the phone screen it shrinks into

  function layoutGallery() {
    [stage, scan, scanView, pitch, bridge, aiHead, desk].concat(reels).forEach(function (el) { el.removeAttribute('style'); });
    G = S = null;
    galTop = docTop(gallery);
    galH = gallery.offsetHeight;
    // The room photo covers the screen. A wide screen sees nearly all of it, so the
    // camera only drifts; a phone sees a third, so it sweeps from the door to the window.
    var W = Math.max(vw, vh * 1264 / 843);
    panAmp = Math.max(3, (W - vw) / 2 / W * 80);
    // the plane and its arrows span half the photo; keep them clear of the tool rail
    scan.style.setProperty('--fit', Math.min(1, vw * .84 / (W * .495)).toFixed(3));
    // The phone's screen is laid out at its own size (an iPhone's 393 × 852, or this
    // phone's own screen) and scaled into the bezel, so its controls and shop card sit
    // where the app puts them. The room photo refits to it like it does to any screen.
    var sw = vw <= 480 ? vw : 393, sh = vw <= 480 ? vh : 852;
    full = { w: scan.clientWidth || vw, h: scan.clientHeight || vh, fit: fitFor(vw, vh), k: vw <= 767 ? PK : 1 };
    screen = { w: sw, h: sh, fit: fitFor(sw, sh), k: PK };
    if (!pinned()) {
      if (moving()) layoutStack();
      placeMark(.88);
      return;
    }
    var top = 96, b = FB;
    var avail = (vh - top - 28) * .9;
    var fh0 = Math.min(avail, 660) - 2 * b, fw0 = fh0 * 393 / 852;
    var cy = top + (vh - top) / 2;
    // HaneiAI's window sits under its title, the three screens in a row inside it,
    // each with its caption below
    var wtop = 84 + aiHead.offsetHeight + 18, bar = 40, pad = 22, gap = 24, capH = 84;
    var inner = vh - 20 - wtop - bar - 2 * pad;
    var rw = Math.min((vw - 120 - 2 * pad - 2 * gap) / 3, 440), rh = reelH(rw);
    if (rh + capH > inner) { rh = inner - capH; rw = reelW(rh); }
    var ww = 3 * rw + 2 * gap + 2 * pad, wh = bar + 2 * pad + rh + capH;
    var wx = (vw - ww) / 2, wy = wtop + (vh - 20 - wtop - wh) / 2;
    G = {
      cy: cy,
      phone: { x: vw / 2 - fw0 / 2, y: cy - fh0 / 2, w: fw0, h: fh0 },
      desk: { x: wx, y: wy, w: ww, h: wh },
      slots: [0, 1, 2].map(function (i) { return { x: wx + pad + i * (rw + gap), y: wy + bar + pad, w: rw, h: rh }; })
    };
    stage.style.setProperty('--cy', cy.toFixed(0) + 'px');
    stage.style.setProperty('--fw', fw0.toFixed(1));
    stage.style.setProperty('--fh', fh0.toFixed(1));

    // the pitch, then "Love what you see?", hold the left of the phone; the plan sheet and chair card its right
    var pitchW = clamp((vw - fw0) / 2 - b - 72, 260, 360);
    [pitch, bridge].forEach(function (el) {
      el.style.width = pitchW + 'px';
      el.style.left = (vw / 2 - fw0 / 2 - b - 40 - pitchW).toFixed(0) + 'px';
    });
    placeMark(.9);
  }

  // The HaneiAI link scrolls to where the three screens are playing, or to its
  // title when the page doesn't pin.
  function placeMark(at) {
    mark.style.top = (moving() ? at * (galH - vh) : aiHead.offsetTop).toFixed(0) + 'px';
  }

  function fitFor(w, h) { var W = Math.max(w, h * 1264 / 843); return Math.min(1, w * .84 / (W * .495)); }

  // The camera view's box eases from the full screen into the phone's screen
  // (rect `ph`, corner radius `rad`), refitting the room and the chair as it goes.
  function shrinkScan(k, ph, rad) {
    var sc = lerp(1, ph.w / screen.w, k);
    scanView.style.setProperty('--scw', lerp(full.w, screen.w, k).toFixed(1) + 'px');
    scanView.style.setProperty('--sch', lerp(full.h, screen.h, k).toFixed(1) + 'px');
    scanView.style.setProperty('--scx', (k * ph.x).toFixed(1) + 'px');
    scanView.style.setProperty('--scy', (k * ph.y).toFixed(1) + 'px');
    scanView.style.setProperty('--scs', sc.toFixed(4));
    scanView.style.setProperty('--scr', (k * rad / sc).toFixed(1) + 'px');
    setVars(scan, { fit: lerp(full.fit, screen.fit, k), 'chair-k': lerp(full.k, screen.k, k) });
  }

  // A HaneiAI screen is a 36px title bar and a 10px rim around a 440 × 400 stage.
  function reelH(w) { return 46 + (w - 20) * 400 / 440; }
  function reelW(h) { return 20 + (h - 46) * 440 / 400; }

  // Stacked: the camera view shrinks into a phone, which opens into HaneiAI's
  // window holding three small screens down the page. When a row gives bigger
  // screens (a phone on its side), they sit side by side instead.
  function layoutStack() {
    var bar = 30, pad = 10, gap = 10, slots;
    var top = 72 + aiHead.offsetHeight + 12 + bar + pad, H = vh - top - 12 - pad;
    var cw = Math.min(reelW((H - 2 * gap) / 3), vw - 32 - 2 * pad, 460);
    var rowW = Math.min((vw - 32 - 2 * pad - 2 * gap) / 3, reelW(H), 460);
    if (rowW > cw) {
      var rh0 = reelH(rowW), x0 = (vw - 3 * rowW - 2 * gap) / 2;
      slots = [0, 1, 2].map(function (i) { return { x: x0 + i * (rowW + gap), y: top + (H - rh0) / 2, w: rowW, h: rh0 }; });
    } else {
      var rh = reelH(cw), y0 = top + (H - 3 * rh - 2 * gap) / 2;
      slots = [0, 1, 2].map(function (i) { return { x: (vw - cw) / 2, y: y0 + i * (rh + gap), w: cw, h: rh }; });
    }
    var a = slots[0], z = slots[2];
    var dk = { x: a.x - pad, y: a.y - pad - bar, w: z.x + z.w - a.x + 2 * pad, h: z.y + z.h - a.y + 2 * pad + bar };
    // the phone sits under the pitch while it holds
    var py = 84 + pitch.offsetHeight + 20 + FB, ph = Math.max(vh - 16 - FB - py, 160), pw = Math.min(vw * .64, 320, ph * screen.w / screen.h);
    ph = pw * screen.h / screen.w;
    S = { phone: { x: (vw - pw) / 2, y: py, w: pw, h: ph }, desk: dk, slots: slots };
    ['px', 'py', 'pw', 'ph'].forEach(function (k, i) { stage.style.setProperty('--' + k, [S.phone.x, S.phone.y, pw, ph][i].toFixed(1)); });
  }

  /* HaneiRoom's scan plays across the screen, the phone holds beside its pitch, then
     it opens into HaneiAI's desktop window, which splits into three screens. All of
     it runs from a 0..1 progress, so the same code serves the pinned stage and the stack. */
  var status = $('[data-status]');

  // Scan the room, find the floor, measure it, pick three pieces from the tray, place
  // the chair and table, hang the print, swap the seat for another and back, then tap
  // Buy and open the shop card.
  function playScan(p) {
    var sweep = ramp(p, .04, .32);
    setVars(scan, {
      ui: ramp(p, 0, .05),
      pan: Math.sin(sweep * Math.PI * 2) * panAmp,
      zoom: lerp(1.08, 1, ease(ramp(p, .28, .38))),
      floor: ease(ramp(p, .32, .42)),
      outline: ramp(p, .36, .46),
      dims: easeBack(ramp(p, .44, .49)),
      marker: ramp(p, .48, .51) * (1 - ramp(p, .66, .69)),
      place: ramp(p, .49, .52) * (1 - ramp(p, .53, .56)),
      sheet: ease(ramp(p, .54, .58)) * (1 - ease(ramp(p, .7, .73))),
      k1: easeBack(ramp(p, .59, .605)), k2: easeBack(ramp(p, .615, .63)), k3: easeBack(ramp(p, .64, .655)),
      tap: ramp(p, .675, .685) * (1 - ramp(p, .69, .7)),
      chair: easeBack(ramp(p, .71, .76)), table: easeBack(ramp(p, .745, .795)), poster: ease(ramp(p, .79, .83)),
      foot: ramp(p, .73, .8),
      swp: ramp(p, .84, .865) * (1 - ramp(p, .92, .94)),
      sw: ease(ramp(p, .865, .88)) * (1 - ease(ramp(p, .895, .91))),
      buy: ramp(p, .93, .95),
      btap: ramp(p, .955, .965) * (1 - ramp(p, .966, .975)),
      deal: ease(ramp(p, .965, .995))
    });
    status.textContent = p < .32 ? 'Scanning your space…' : p < .54 ? 'Floor found' : p < .71 ? 'Pick your pieces' : p < .79 ? 'Placing 3 pieces' : p < .84 ? 'Posters too' : p < .93 ? 'Swap and compare' : 'Looks right?';
  }

  // The phone (screen plus bezel) grows into HaneiAI's window between t0 and t1,
  // and lifts away with the screens from `out`.
  function playDesk(p, L, t0, t1, out) {
    var k = ease(ramp(p, t0, t1)), o = ease(ramp(p, out, out + .03));
    var a = L.phone, z = L.desk, f = { x: a.x - FB, y: a.y - FB, w: a.w + 2 * FB, h: a.h + 2 * FB };
    setVars(desk, {
      x: lerp(f.x, z.x, k), y: lerp(f.y, z.y, k) - o * 80, w: lerp(f.w, z.w, k), h: lerp(f.h, z.h, k),
      rad: lerp(47, 22, k), o: ramp(p, t0 - .01, t0 + .01) * (1 - o), bo: ramp(k, .6, 1)
    });
  }

  // Into the window, a beat apart: each screen rises from the middle of the window to
  // its own place, tipping a little as it goes; from `out` they lift away again.
  // Scrolling back reverses it all. A screen is live (reels.js loops its demo) only
  // while it sits still in place.
  function playReels(p, L, t0, t1, out) {
    var mid = L.desk.x + L.desk.w / 2;
    reels.forEach(function (r, i) {
      var d = i * .015, m = ease(ramp(p, t0 + d, t1 + d)), o = ease(ramp(p, out + d, out + .03 + d));
      var z = L.slots[i];
      setVars(r, {
        x: lerp(lerp(z.x, mid - z.w / 2, .6), z.x, m), y: z.y + (1 - m) * 60 - o * 80,
        w: z.w, h: z.h,
        r: (1 - m) * (i - 1) * 4 + o * (1 - i) * 4,
        o: ramp(m, 0, .4) * (1 - o), co: ramp(m, .75, 1)
      });
      var live = m > .97 && o < .03;
      if (live !== (r.getAttribute('data-live') === '1')) r.setAttribute('data-live', live ? '1' : '');
    });
  }

  // The pitch and the bridge show only while the phone holds still; the pitch takes clicks then.
  function show(el, o) {
    el.style.setProperty('--o', o.toFixed(3));
    el.style.pointerEvents = o > .5 ? '' : 'none';
  }

  function updateGallery() {
    var L = G || S;
    if (!L) return;
    var p = clamp((window.scrollY - galTop) / Math.max(galH - vh, 1), 0, 1);
    if (!G) {
      // stacked: one pinned screen; the scan plays and shrinks into a phone that holds
      // under the pitch, then opens into the window and its three small screens
      playScan(ramp(p, 0, .46));
      setVars(stage, { fo: ramp(p, .51, .56), sp: ramp(p, .735, .755) });
      shrinkScan(ease(ramp(p, .47, .54)), L.phone, 34);
      setVars(scan, { so: 1 - ramp(p, .735, .755) });
      show(pitch, ramp(p, .54, .58) * (1 - ramp(p, .62, .65)));
      show(bridge, ramp(p, .645, .675) * (1 - ramp(p, .72, .745)));
      show(aiHead, ramp(p, .78, .82) * (1 - ramp(p, .955, .975)));
      playDesk(p, L, .735, .79, .95);
      playReels(p, L, .795, .86, .95);
      return;
    }
    // the camera view shrinks into the phone, which holds beside the pitch, then
    // "Love what you see?", then grows into HaneiAI's window and its three screens
    setVars(stage, { fo: ramp(p, .58, .62), sp: ramp(p, .755, .775) });
    playScan(ramp(p, .02, .54));
    shrinkScan(ease(ramp(p, .55, .61)), L.phone, 40);
    setVars(scan, { so: 1 - ramp(p, .755, .775) });
    show(pitch, ramp(p, .61, .645) * (1 - ramp(p, .68, .71)));
    show(bridge, ramp(p, .7, .73) * (1 - ramp(p, .79, .82)));
    show(aiHead, ramp(p, .8, .84) * (1 - ramp(p, .955, .975)));
    playDesk(p, L, .755, .81, .955);
    playReels(p, L, .815, .87, .955);
  }

  // the two product cards slide in from their own sides
  var duo = $('.duo');
  function updateDuo() {
    var r = duo.getBoundingClientRect();
    duo.style.setProperty('--v', ease(clamp((vh * .9 - r.top) / (vh * .5), 0, 1)).toFixed(4));
  }

  /* ---------------------------------------------------------- closing */
  // the rest of the room slides in beside the one chair
  var closeEl = $('[data-close]');
  function updateClose() {
    var r = closeEl.getBoundingClientRect();
    closeEl.style.setProperty('--v', ease(clamp((vh * .95 - r.top) / (vh * .5), 0, 1)).toFixed(4));
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

  /* ---------------------------------------------------------- loop */
  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    layoutGallery();
    update();
  }

  function update() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
    if (!moving()) return;
    updateGallery();
    updateDuo();
    updateClose();
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
      [duo, closeEl, stage, scan, scanView, pitch, bridge, aiHead, desk].concat(reels, rows).forEach(function (el) { el.removeAttribute('style'); });
      reels.forEach(function (r) { r.removeAttribute('data-live'); });
      status.textContent = 'Looks right?';
    }
    measure();
  }

  setMode();
  markTape();
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
  // the browser jumps to #ai before the anchor has moved to the screens, so go again
  window.addEventListener('load', function () {
    measure();
    if (window.location.hash === '#ai') mark.scrollIntoView();
  });
})();
