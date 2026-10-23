/* HaneiAI's three screens in scene 03: Idea Input, Idea Brief, Product sort out.
   Each screen's markup is its finished frame. While landing.js marks a screen
   live (data-live="1"), this rewinds it and loops a short cursor demo, like a
   video; once it stops being live it shows the finished frame again. Every stage is
   drawn at 440 × 400 and scaled to its screen with --s. */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reels = $$('[data-reel]');
  if (!reels.length) return;

  /* ---------------------------------------------------------- scale */
  function fit(view) { view.style.setProperty('--s', (view.clientWidth / 440).toFixed(4)); }
  var views = reels.map(function (r) { return $('.reel__view', r); });
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); });
    views.forEach(function (v) { ro.observe(v); });
  } else {
    views.forEach(fit);
    window.addEventListener('resize', function () { views.forEach(fit); });
  }

  /* ---------------------------------------------------------- player */
  var STOP = {};

  function player(reel, reset, script) {
    var view = $('.reel__view', reel), st = $('.st', reel), cur = $('.reel__cursor', reel);
    var gen = 0, finished = st.innerHTML;

    function sleep(ms) {
      var g = gen;
      return new Promise(function (res, rej) { setTimeout(function () { if (g === gen) res(); else rej(STOP); }, ms); });
    }
    // cursor coordinates are stage pixels, so they hold at any screen size
    function point(el) {
      var s = view.clientWidth / 440, a = st.getBoundingClientRect(), b = el.getBoundingClientRect();
      return { x: (b.left + b.width / 2 - a.left) / s, y: (b.top + b.height / 2 - a.top) / s };
    }
    function move(el, ms) {
      var t = point(el);
      ms = ms || 700;
      cur.style.transitionDuration = ms + 'ms, .3s, .12s';
      cur.style.setProperty('--cx', (t.x - 4).toFixed(1));
      cur.style.setProperty('--cy', (t.y - 2).toFixed(1));
      return sleep(ms + 80);
    }
    function click(el) {
      cur.classList.add('is-down');
      el.classList.add('is-press');
      return sleep(150).then(function () {
        cur.classList.remove('is-down');
        el.classList.remove('is-press');
        return sleep(120);
      });
    }
    async function type(el, text, ms) {
      el.classList.add('is-typing');
      for (var i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await sleep(ms || 60); }
      el.classList.remove('is-typing');
    }
    var api = { sleep: sleep, move: move, click: click, type: type, $: function (s) { return $(s, st); }, $$: function (s) { return $$(s, st); } };

    function start() {
      var g = ++gen;
      reel.classList.add('is-playing');
      (async function () {
        try {
          for (;;) {
            reset(api);
            cur.style.transitionDuration = '0s';
            cur.style.setProperty('--cx', 380);
            cur.style.setProperty('--cy', 370);
            await sleep(500);
            await script(api);
          }
        } catch (e) {
          if (e !== STOP) throw e;
        }
        if (g === gen) reel.classList.remove('is-playing');
      })();
    }
    function stop() {
      gen++;
      reel.classList.remove('is-playing');
      cur.classList.remove('is-down');
      // back to the finished frame, so a screen on its way in or out never shows half a demo
      st.innerHTML = finished;
    }
    return { start: start, stop: stop };
  }

  /* ---------------------------------------------------------- 01 Idea Input */
  var input = {
    reset: function (u) {
      u.$$('[data-type]').forEach(function (el) { el.textContent = ''; });
      u.$$('.st__chips .on, .st__pal .on').forEach(function (el) { el.classList.remove('on'); });
      u.$('[data-count]').textContent = '0';
    },
    play: async function (u) {
      var fields = u.$$('[data-type]');
      for (var f = 0; f < fields.length; f++) {
        var box = fields[f];
        await u.move(box, f ? 600 : 800);
        await u.click(box);
        await u.type(box, box.getAttribute('data-type'), 55);
        if (f === 1) {
          // pick the five words, then the palette, before the budget
          for (var k = 1; k <= 5; k++) {
            var chip = u.$('[data-pick="' + k + '"]');
            await u.move(chip, 420);
            await u.click(chip);
            chip.classList.add('on');
            u.$('[data-count]').textContent = k;
          }
          var add = u.$('[data-add]');
          await u.move(add, 520);
          var sw = u.$$('.st__pal i');
          for (var c = 0; c < sw.length; c++) { await u.click(add); sw[c].classList.add('on'); await u.sleep(120); }
        }
      }
      var next = u.$('[data-next]');
      await u.move(next, 600);
      await u.click(next);
      await u.sleep(1600);
    }
  };

  /* ---------------------------------------------------------- 02 Idea Brief */
  var BRIEF_LINES = ['Reading the brief', 'Matching your palette', 'Checking vendor stock', '9 products found'];
  var brief = {
    reset: function (u) {
      u.$('[data-brief]').textContent = '';
      u.$$('.st__sw .on').forEach(function (el) { el.classList.remove('on'); });
      u.$('[data-search]').classList.remove('show');
      u.$('[data-bar]').style.width = '0%';
      u.$('[data-line]').textContent = '';
    },
    play: async function (u) {
      var out = u.$('[data-brief]'), words = out.getAttribute('data-brief').split(' ');
      for (var i = 1; i <= words.length; i++) { out.textContent = words.slice(0, i).join(' '); await u.sleep(95); }
      var sw = u.$$('.st__sw i');
      for (var c = 0; c < sw.length; c++) { sw[c].classList.add('on'); await u.sleep(140); }
      await u.sleep(500);
      var go = u.$('[data-source]');
      await u.move(go, 800);
      await u.click(go);
      var search = u.$('[data-search]'), bar = u.$('[data-bar]'), line = u.$('[data-line]');
      search.classList.add('show');
      for (var t = 0; t <= 16; t++) {
        bar.style.width = (t / 16 * 100) + '%';
        line.textContent = BRIEF_LINES[Math.min(3, Math.floor(t / 16 * 3.99))];
        await u.sleep(170);
      }
      await u.sleep(1300);
      search.classList.remove('show');
      await u.sleep(900);
    }
  };

  /* ---------------------------------------------------------- 03 Product sort out */
  var sort = {
    reset: function (u) {
      u.$$('[data-card]').forEach(function (el) { el.classList.remove('kept', 'dropped'); });
      u.$('[data-count]').textContent = '0';
      u.$('[data-bubble]').classList.remove('show');
      u.$('[data-done]').classList.remove('show');
    },
    play: async function (u) {
      var cards = u.$$('[data-card]'), n = 0;
      // keep, drop, keep, keep: a ✓ or ✕ on each card's corner
      var picks = [[0, 'y'], [1, 'n'], [2, 'y'], [4, 'y']];
      for (var i = 0; i < picks.length; i++) {
        var card = cards[picks[i][0]], mark = $('.' + picks[i][1], card);
        await u.move(mark, i ? 520 : 800);
        await u.click(mark);
        if (picks[i][1] === 'y') { card.classList.add('kept'); u.$('[data-count]').textContent = ++n; }
        else card.classList.add('dropped');
      }
      var ask = u.$('[data-ask]');
      await u.move(ask, 500);
      await u.click(ask);
      u.$('[data-bubble]').classList.add('show');
      await u.sleep(2000);
      u.$('[data-bubble]').classList.remove('show');
      var exp = u.$('[data-export]');
      await u.move(exp, 700);
      await u.click(exp);
      u.$('[data-done]').classList.add('show');
      await u.sleep(1900);
    }
  };

  /* ---------------------------------------------------------- live */
  var scripts = { input: input, brief: brief, sort: sort };
  reels.forEach(function (reel) {
    var s = scripts[reel.getAttribute('data-reel')];
    if (!s) return;
    var p = player(reel, s.reset, s.play), on = false;
    function sync() {
      var live = reel.getAttribute('data-live') === '1';
      if (live === on) return;
      on = live;
      if (live) p.start(); else p.stop();
    }
    new MutationObserver(sync).observe(reel, { attributes: true, attributeFilter: ['data-live'] });
    sync();
  });
})();
