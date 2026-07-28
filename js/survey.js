/* Survey page: Emotion Beta swapper, birth-detail pickers, city autocomplete,
   the between-stage compatibility reveal, and the full report modal (behind
   the tiny "more info" button). Depends on assets/synastry.js (global `Synastry`). */
(function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ---- Emotion Beta: swap Anna's portrait, toggle steam while angry ---- */
  var moodButtons = document.querySelectorAll('.moods button[data-img]');
  moodButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      $('anna').src = 'assets/' + btn.dataset.img + '.png';
      $('av').classList.toggle('angry', btn.dataset.img === 'angry');
      moodButtons.forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
    });
  });
  /* ---- Animation Beta: layered FX behind Anna (hearts, boom, fire, waterfall, sparkles) ---- */
  var fx = $('fx');
  function rnd(a, b) { return a + Math.random() * (b - a); }
  // Spawns n <span>s into the FX layer; setup(el, i) styles each one.
  // Negative animation delays start every loop mid-flight, so effects fill
  // the screen instantly instead of trickling in.
  function spawn(n, setup) {
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      setup(s, i);
      fx.appendChild(s);
    }
  }
  var EFFECTS = {
    none: function () {},
    hearts: function () {
      spawn(22, function (s) {
        s.className = 'fx-heart';
        s.textContent = '♥';
        s.style.left = rnd(0, 96) + '%';
        s.style.fontSize = rnd(24, 68) + 'px';
        s.style.animationDuration = rnd(3, 6.5) + 's';
        s.style.animationDelay = -rnd(0, 6.5) + 's';
      });
    },
    // CSS-drawn explosions: each site is a fireball + shockwave ring + debris
    // sharing one animation timeline so the phases line up
    boom: function () {
      spawn(9, function (s) {
        s.className = 'fx-boomSite';
        var size = rnd(100, 230);
        s.style.left = rnd(4, 86) + '%';
        s.style.top = rnd(6, 62) + '%';
        s.style.width = size + 'px';
        s.style.height = size + 'px';
        var html = '<i class="fireball"></i><i class="shock"></i>';
        for (var k = 0; k < 7; k++) {
          var ang = rnd(0, Math.PI * 2), dist = rnd(size * .5, size * 1.1);
          html += '<i class="frag" style="--dx:' + Math.round(Math.cos(ang) * dist) +
            'px;--dy:' + Math.round(Math.sin(ang) * dist * .8 - 40) + 'px"></i>';
        }
        s.innerHTML = html;
        var dur = rnd(1.9, 3.4) + 's', delay = -rnd(0, 3.4) + 's';
        s.querySelectorAll('i').forEach(function (el) {
          el.style.animationDuration = dur;
          el.style.animationDelay = delay;
        });
      });
    },
    fire: function () {
      spawn(16, function (s, i) {
        s.className = 'fx-flame';
        s.textContent = '🔥';
        s.style.left = (i * 6.5 - 2) + '%';
        s.style.fontSize = rnd(44, 96) + 'px';
        s.style.animationDuration = rnd(0.35, 0.7) + 's';
        s.style.animationDelay = -rnd(0, 0.7) + 's';
      });
      spawn(10, function (s) {
        s.className = 'fx-ember';
        s.style.left = rnd(0, 98) + '%';
        s.style.animationDuration = rnd(1.6, 3.4) + 's';
        s.style.animationDelay = -rnd(0, 3.4) + 's';
      });
    },
    waterfall: function () {
      spawn(12, function (s) {
        s.className = 'fx-water';
        s.style.left = rnd(0, 94) + '%';
        s.style.width = rnd(22, 70) + 'px';
        s.style.animationDuration = rnd(1.1, 2.2) + 's';
        s.style.animationDelay = -rnd(0, 2.2) + 's';
      });
      spawn(10, function (s) {
        s.className = 'fx-splash';
        var w = rnd(60, 130);
        s.style.left = rnd(0, 92) + '%';
        s.style.width = w + 'px';
        s.style.height = (w * .55) + 'px';
        s.style.animationDuration = rnd(1.2, 2.4) + 's';
        s.style.animationDelay = -rnd(0, 2.4) + 's';
      });
      spawn(14, function (s) {
        s.className = 'fx-drop';
        s.style.left = rnd(1, 97) + '%';
        s.style.setProperty('--dx', rnd(-40, 40).toFixed(0) + 'px');
        s.style.animationDuration = rnd(.9, 1.8) + 's';
        s.style.animationDelay = -rnd(0, 1.8) + 's';
      });
    },
    // shooting stars only: gradient tails streaking diagonally across the sky
    shooting: function () {
      spawn(10, function (s) {
        s.className = 'fx-shoot';
        s.style.left = rnd(25, 96) + '%';
        s.style.top = rnd(2, 68) + '%';
        s.style.width = rnd(90, 200) + 'px';
        s.style.height = rnd(2, 4).toFixed(1) + 'px';
        s.style.animationDuration = rnd(2.2, 5) + 's';
        s.style.animationDelay = -rnd(0, 5) + 's';
      });
    }
  };
  var animButtons = document.querySelectorAll('.anims button[data-fx]');
  animButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      fx.innerHTML = '';
      (EFFECTS[btn.dataset.fx] || EFFECTS.none)();
      animButtons.forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
    });
  });

  /* ---- Beta panels: hide/show toggles (state remembered per panel) ---- */
  document.querySelectorAll('.betaPanel').forEach(function (panel) {
    var key = 'annaBetaClosed:' + panel.id;
    var toggle = panel.querySelector('.betaToggle');
    function apply(closed) {
      panel.classList.toggle('closed', closed);
      toggle.textContent = closed ? '+' : '–';
      toggle.setAttribute('aria-label', (closed ? 'show' : 'hide') + ' panel');
      try { localStorage.setItem(key, closed ? '1' : ''); } catch (e) {}
    }
    toggle.addEventListener('click', function () { apply(!panel.classList.contains('closed')); });
    try { if (localStorage.getItem(key) === '1') apply(true); } catch (e) {}
  });
  // the real state is applied; drop the pre-paint collapse classes from <head>
  document.documentElement.classList.remove('bcA', 'bcM');

  /* ---- Production: the beta panels are dev tools; hide them off-localhost.
     The buttons stay in the DOM so setMood/setEffect keep working. ---- */
  var IS_DEV = /^(localhost|127\.0\.0\.1|::1)$/.test(location.hostname) || location.protocol === 'file:';
  if (!IS_DEV) document.body.classList.add('prod');

  // #love, #angry, #fire, etc. in the URL preselects that mood or effect
  var hash = location.hash.slice(1);
  if (hash) {
    var hashBtn = document.querySelector('.moods button[data-img="' + hash + '"], .anims button[data-fx="' + hash + '"]');
    if (hashBtn) hashBtn.click();
  }

  /* ---- Birth date/time pickers ---- */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function fill(id, opts, placeholder) {
    $(id).innerHTML = '<option value="" disabled selected>' + placeholder + '</option>' +
      opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
  }
  fill('bMonth', MONTHS.map(function (m, i) { return [i + 1, m]; }), 'month');
  fill('bDay', Array.from({ length: 31 }, function (_, i) { return [i + 1, i + 1]; }), 'day');
  fill('bYear', Array.from({ length: 86 }, function (_, i) { return [2015 - i, 2015 - i]; }), 'year');
  fill('bHour', Array.from({ length: 12 }, function (_, i) { return [i + 1, i + 1]; }), 'hh');

  var pm = true;
  var amBtn = $('amBtn'), pmBtn = $('pmBtn');
  amBtn.addEventListener('click', function () { pm = false; amBtn.classList.add('on'); pmBtn.classList.remove('on'); });
  pmBtn.addEventListener('click', function () { pm = true; pmBtn.classList.add('on'); amBtn.classList.remove('on'); });

  /* ---- Location autocomplete ----
     Open-Meteo geocoding: free, no key, returns lat/lon/timezone (which the
     chart math needs). `selected` stays null until a suggestion is picked. */
  var locInput = $('bLoc'), locList = $('locList');
  var selected = null, debounceTimer = null;

  locInput.addEventListener('input', function () {
    selected = null;
    clearTimeout(debounceTimer);
    var q = locInput.value.trim();
    if (q.length < 2) { locList.style.display = 'none'; return; }
    debounceTimer = setTimeout(function () { searchCities(q); }, 280);
  });

  async function searchCities(q) {
    try {
      var r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=en&format=json');
      var j = await r.json();
      var results = j.results || [];
      locList.innerHTML = results.map(function (c, i) {
        return '<div data-i="' + i + '">' + c.name + (c.admin1 ? ', ' + c.admin1 : '') + (c.country ? ', ' + c.country : '') + '</div>';
      }).join('') || '<div>no matches…</div>';
      locList.style.display = 'block';
      locList.querySelectorAll('div[data-i]').forEach(function (d) {
        // mousedown (not click) so the pick lands before the input's blur hides the list
        d.addEventListener('mousedown', function () {
          var c = results[+d.dataset.i];
          selected = { lat: c.latitude, lon: c.longitude, tz: c.timezone };
          locInput.value = c.name + (c.admin1 ? ', ' + c.admin1 : '') + (c.country_code ? ', ' + c.country_code : '');
          locList.style.display = 'none';
        });
      });
    } catch (e) { /* network hiccup: keep the old list, user can retype */ }
  }

  locInput.addEventListener('blur', function () {
    setTimeout(function () { locList.style.display = 'none'; }, 200);
  });

  /* ---- Stage 2: the movie test (Blu-ray shelf) ----
     Posters live in assets/posters/. Click = toggle seen; hover picks the
     case up with a cursor-following 3D tilt + gloss, like handling a Blu-ray. */
  var MOVIES = [
    { slug: 'holy-mountain', title: 'The Holy Mountain', year: 1973 },
    { slug: 'wild-at-heart', title: 'Wild at Heart', year: 1990 },
    { slug: 'paris-texas', title: 'Paris, Texas', year: 1984 },
    { slug: 'vertigo', title: 'Vertigo', year: 1958 },
    { slug: 'three-colours-red', title: 'Three Colours: Red', year: 1994 },
    { slug: 'woman-under-influence', title: 'A Woman Under the Influence', year: 1974 },
    { slug: 'jeanne-dielman', title: 'Jeanne Dielman, 23, quai du Commerce, 1080 Bruxelles', year: 1975 },
    { slug: 'stalker', title: 'Stalker', year: 1979 },
    { slug: 'gilbert-grape', title: "What's Eating Gilbert Grape", year: 1993 },
    { slug: 'cook-thief-wife-lover', title: 'The Cook, the Thief, His Wife & Her Lover', year: 1989 },
    { slug: 'persona', title: 'Persona', year: 1966 },
    { slug: 'brutalist', title: 'The Brutalist', year: 2024 }
  ];
  var seen = {};

  MOVIES.forEach(function (m, i) {
    var c = document.createElement('button');
    c.type = 'button';
    c.className = 'case';
    c.title = m.title + ' (' + m.year + ')';
    c.style.animationDelay = (i * 60) + 'ms';
    c.innerHTML = '<img src="assets/posters/' + m.slug + '.jpg" alt="' + m.title + ' (' + m.year + ') poster" draggable="false">' +
      '<i class="spine"></i><i class="gloss"></i><b class="seenTag">SEEN ✓</b>';
    $(i < 6 ? 'shelfRow1' : 'shelfRow2').appendChild(c);

    // cursor-following tilt: the case leans toward wherever you're gripping it
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = 'translateY(-16px) scale(1.09) rotateY(' + ((x - .5) * 24).toFixed(1) + 'deg) rotateX(' + ((.5 - y) * 18).toFixed(1) + 'deg)';
      c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    c.addEventListener('mouseleave', function () { c.style.transform = ''; });
    c.addEventListener('click', function () {
      seen[m.slug] = !seen[m.slug];
      c.classList.toggle('picked', seen[m.slug]);
      var n = Object.keys(seen).filter(function (k) { return seen[k]; }).length;
      $('seenCount').textContent = n + ' / ' + MOVIES.length + ' seen';
    });
  });

  /* ---- Stage 2b: favorite movies (demanded when they've seen ≤3 of the shelf) ----
     Poster lookup via the Wikipedia API (free, no key, CORS-friendly): search
     "<query> film", use each article's page image (the poster; pilicense=any
     because posters are non-free). No match? Enter adds it as plain text.
     (iTunes Search API was tried first but Apple emptied its movie catalog.) */
  var favs = [];
  var favesBox = $('faves'), favInput = $('favInput'), favList = $('favList'), favChips = $('favChips');
  var favDeb = null;

  function wikiSearch(q, cb) {
    fetch('https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
      encodeURIComponent(q + ' film') +
      '&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=120&pilicense=any&format=json&origin=*')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pages = (j.query && j.query.pages) ? Object.keys(j.query.pages).map(function (k) { return j.query.pages[k]; }) : [];
        pages = pages.filter(function (p) { return !/\(disambiguation\)/i.test(p.title); });
        pages.sort(function (a, b) { return a.index - b.index; });
        cb(pages);
      })
      .catch(function () { cb([]); });
  }

  function renderFavChips() {
    favChips.innerHTML = '';
    favs.forEach(function (f, i) {
      var chip = document.createElement('span');
      chip.className = 'favChip';
      if (f.art) {
        var img = document.createElement('img');
        img.src = f.art;
        img.alt = '';
        chip.appendChild(img);
      }
      var label = document.createElement('span');
      label.textContent = f.title;
      chip.appendChild(label);
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'rm';
      rm.textContent = '×';
      rm.addEventListener('click', function () { favs.splice(i, 1); renderFavChips(); });
      chip.appendChild(rm);
      favChips.appendChild(chip);
    });
  }

  function addFav(title, art) {
    if (!title) return;
    if (favs.some(function (f) { return f.title.toLowerCase() === title.toLowerCase(); })) return;
    favs.push({ title: title, art: art || '' });
    // instant disgust when a normie favorite hits the list
    if (window.Taste && Taste.classify(title) === 'normie') {
      setMood('disgusted');
      setEffect('fire');
    }
    renderFavChips();
    favInput.value = '';
    favList.style.display = 'none';
  }

  favInput.addEventListener('input', function () {
    clearTimeout(favDeb);
    var q = favInput.value.trim();
    if (q.length < 2) { favList.style.display = 'none'; return; }
    favDeb = setTimeout(function () {
      wikiSearch(q, function (res) {
        favList.innerHTML = res.map(function (m, i) {
          return '<div data-i="' + i + '">' +
            (m.thumbnail ? '<img src="' + m.thumbnail.source + '" alt="">' : '') +
            '<span></span></div>';
        }).join('') || '<div>no matches — press Enter to add it anyway</div>';
        var labels = favList.querySelectorAll('div[data-i] span');
        res.forEach(function (m, i) { labels[i].textContent = m.title; });
        favList.style.display = 'block';
        favList.querySelectorAll('div[data-i]').forEach(function (d) {
          d.addEventListener('mousedown', function () {
            var m = res[+d.dataset.i];
            // strip Wikipedia's " (1979 film)" disambiguation for the chip + scoring
            addFav(m.title.replace(/\s*\([^)]*\)\s*$/, ''), m.thumbnail ? m.thumbnail.source : '');
          });
        });
      });
    }, 300);
  });
  favInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); addFav(favInput.value.trim()); }
  });
  favInput.addEventListener('blur', function () {
    setTimeout(function () { favList.style.display = 'none'; }, 200);
  });

  /* ---- Movie-taste scoring: shelf seen-count + judged favorites ---- */
  function seenCount() {
    return Object.keys(seen).filter(function (k) { return seen[k]; }).length;
  }

  function movieMod() {
    var flags = [], mod = 0;
    var n = seenCount();
    if (n) {
      var pts = Math.round(n * 1.5 * 10) / 10;
      mod += pts;
      flags.push({ text: 'you’ve genuinely seen ' + n + ' of the 12 movies on Anna’s shelf', pts: pts, good: true });
    }
    favs.forEach(function (f) {
      var kind = Taste.classify(f.title);
      if (kind === 'art') { mod += 7; flags.push({ text: '“' + f.title + '” — certified Anna-core cinema', pts: 7, good: true }); }
      else if (kind === 'normie') { mod -= 9; flags.push({ text: '“' + f.title + '” — Anna felt physically ill reading this', pts: -9, good: false }); }
    });
    mod = Math.max(-25, Math.min(25, mod));
    return { mod: mod, flags: flags };
  }

  // the movie test's own standalone score (what the stage-2 reveal shows)
  function moviePercent() {
    return Math.max(2, Math.min(99, 50 + Math.round(movieMod().mod * 2)));
  }

  function withMovieTaste(base) {
    if (base.percent === 0) return base; // the age gate has spoken; movies can't save you
    var m = movieMod();
    var pct = Math.max(2, Math.min(99, base.percent + Math.round(m.mod)));
    return {
      percent: pct,
      verdict: Synastry.verdictFor(pct),
      you: base.you, anna: base.anna, aspectCount: base.aspectCount,
      green: m.flags.filter(function (f) { return f.good; }).concat(base.green).slice(0, 6),
      red: m.flags.filter(function (f) { return !f.good; }).concat(base.red).slice(0, 6)
    };
  }

  // ambient background effect per stage; applied on every stage switch,
  // which also cleans up any reaction effect left over from a reveal
  var STAGE_FX = { 1: 'waterfall', 2: 'none', 3: 'none', 4: 'shooting', 5: 'shooting' };

  var curStage = 1;
  var completedThrough = 0;
  /* ---- Mobile: size Anna so her full face always clears the bottom sheet.
     The static CSS guess can't track the sheet's real height, so measure it:
     her chin sits ~62% down the portrait; scale her until the chin lands
     just above whatever sheet the current stage shows. ---- */
  var mobileMQ = window.matchMedia('(max-width: 700px)');
  function sizeAvatar() {
    var av = $('av');
    if (!mobileMQ.matches || document.body.classList.contains('s4') || document.body.classList.contains('s5')) {
      av.style.height = '';
      return;
    }
    var sheet = document.body.classList.contains('s2') ? document.querySelector('.shelfCta')
      : document.body.classList.contains('s3') ? document.querySelector('.booth')
      : document.querySelector('.card');
    if (!sheet) { av.style.height = ''; return; }
    var sheetTop = sheet.getBoundingClientRect().top;
    var avTop = av.getBoundingClientRect().top;
    var h = (sheetTop - avTop - 8) / 0.62;
    if (h > 0 && isFinite(h)) {
      av.style.height = Math.max(180, Math.min(h, window.innerHeight * 0.92)) + 'px';
    }
  }
  window.addEventListener('resize', sizeAvatar);
  window.addEventListener('load', sizeAvatar);

  function goStage(n) {
    if (n > curStage) completedThrough = Math.max(completedThrough, n - 1);
    if (n === 5) completedThrough = 5;
    curStage = n;
    document.body.classList.toggle('s2', n === 2);
    document.body.classList.toggle('s3', n === 3);
    document.body.classList.toggle('s4', n === 4);
    document.body.classList.toggle('s5', n === 5);
    // leaving stage 3 releases the photobooth camera
    if (n !== 3) stopBooth();
    if (n === 4) syncStandees();
    setEffect(STAGE_FX[n] || 'none');
    document.querySelectorAll('.map .node').forEach(function (node, i) {
      node.classList.toggle('active', i === n - 1);
      node.classList.toggle('done', i < completedThrough);
    });
    setTimeout(sizeAvatar, 50); // after the stage's sheet has laid out
  }
  // completed nodes are clickable to go back and redo an earlier stage
  [1, 2, 3].forEach(function (n) {
    var node = document.querySelector('.node.n' + n);
    node.addEventListener('click', function () {
      if (node.classList.contains('done')) goStage(n);
    });
  });

  // opening ambient: the astrology stage pours its waterfall
  // (#hash effect preselects win, for dev)
  if (!location.hash) setEffect(STAGE_FX[1]);

  /* ---- Compatibility reveal: ring + % flashed between stages ----
     Anna reacts to the score: high = love, low = sad, really low = scared. */
  function setMood(img) {
    var btn = document.querySelector('.moods button[data-img="' + img + '"]');
    if (btn) btn.click();
  }
  function setEffect(fx) {
    var btn = document.querySelector('.anims button[data-fx="' + fx + '"]');
    if (btn) btn.click();
  }
  function moodFor(pct) {
    if (pct >= 70) return 'love';
    if (pct >= 40) return 'portrait-cutout';
    if (pct >= 20) return 'sad';
    return 'scared';
  }
  // reveal reactions: a big score floods the screen with hearts
  function fxFor(pct) {
    return pct >= 70 ? 'hearts' : null;
  }
  var RING_C = 2 * Math.PI * 54; // circumference of the r=54 ring
  var revealing = false;
  // react: optional {mood, fx} override for how Anna takes the number
  function playReveal(r, after, label, verdict, react) {
    if (revealing) return;
    revealing = true;
    var reveal = $('reveal'), fill = $('ringFill'), pctEl = $('ringPct');
    reveal.querySelector('.ringLabel').textContent = label || 'cosmic compatibility';
    // optional punchline under the ring (the age gate's "absolutely not");
    // when present the flash lingers long enough to read it
    var linger = verdict ? 2600 : 0;
    $('ringVerdict').textContent = verdict || '';
    fill.style.strokeDasharray = RING_C;
    fill.style.strokeDashoffset = RING_C;
    pctEl.textContent = '0%';
    reveal.classList.add('show');
    var DURATION = 1300, start = null;
    function tick(now) {
      if (!start) start = now;
      var t = Math.min((now - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      var val = Math.round(r.percent * eased);
      pctEl.textContent = val + '%';
      fill.style.strokeDashoffset = RING_C * (1 - val / 100);
      if (t < 1) requestAnimationFrame(tick);
      else setMood((react && react.mood) || moodFor(r.percent)); // she reacts once the number lands
    }
    requestAnimationFrame(tick);
    // swap the stage underneath the flash, then fade it out
    setTimeout(function () { if (after) after(); }, 1500 + linger);
    setTimeout(function () {
      reveal.classList.remove('show');
      revealing = false;
      // reaction effect lands AFTER the stage switch set its ambient,
      // so hearts (etc.) survive into the next stage
      var fx = (react && react.fx) || fxFor(r.percent);
      if (fx) setEffect(fx);
    }, 2100 + linger);
  }

  /* ---- NEXT: validate, compute synastry, advance to the movie test ---- */
  document.querySelector('.card').addEventListener('submit', function (e) { e.preventDefault(); });
  var synastryResult = null;

  $('nextBtn').addEventListener('click', function () {
    var mo = +$('bMonth').value, d = +$('bDay').value, y = +$('bYear').value;
    var h12 = +$('bHour').value, mi = +$('bMin').value;
    if (!mo || !d || !y) { $('bMonth').focus(); return; }
    if (!h12 || $('bHour').value === '') { $('bHour').focus(); return; }
    if ($('bMin').value === '' || isNaN(mi) || mi < 0 || mi > 59) { $('bMin').focus(); return; }
    if (!selected) {
      locInput.focus();
      locList.innerHTML = '<div>type a city and pick it from this list ☝️</div>';
      locList.style.display = 'block';
      setTimeout(function () { locList.style.display = 'none'; }, 2500);
      return;
    }
    var h24 = (h12 % 12) + (pm ? 12 : 0);
    synastryResult = Synastry.compute({ y: y, mo: mo, d: d, h: h24, mi: mi, lat: selected.lat, lon: selected.lon, tz: selected.tz });
    // no chart report for minors — the ⓘ escape hatch stays hidden too
    $('moreInfo').style.display = synastryResult.percent === 0 ? 'none' : 'block';
    if (synastryResult.percent === 0) {
      // teenagers do not advance: 0% ring + the punchline, then back to the
      // form — no chart report for minors, no stage 2
      playReveal(synastryResult, null, 'cosmic compatibility', synastryResult.verdict);
    } else {
      playReveal(synastryResult, function () { goStage(2); });
    }
  });

  /* ---- 🎲 randomize: fill the whole birth card with a random person ---- */
  var RND_CITIES = [
    { name: 'Brooklyn, New York, US', lat: 40.6501, lon: -73.94958, tz: 'America/New_York' },
    { name: 'Los Angeles, California, US', lat: 34.05223, lon: -118.24368, tz: 'America/Los_Angeles' },
    { name: 'Toronto, Ontario, CA', lat: 43.70011, lon: -79.4163, tz: 'America/Toronto' },
    { name: 'London, England, GB', lat: 51.50853, lon: -0.12574, tz: 'Europe/London' },
    { name: 'Paris, Île-de-France, FR', lat: 48.85341, lon: 2.3488, tz: 'Europe/Paris' },
    { name: 'Tokyo, JP', lat: 35.6895, lon: 139.69171, tz: 'Asia/Tokyo' },
    { name: 'Lagos, NG', lat: 6.45407, lon: 3.39467, tz: 'Africa/Lagos' },
    { name: 'São Paulo, BR', lat: -23.5475, lon: -46.63611, tz: 'America/Sao_Paulo' },
    { name: 'Mexico City, MX', lat: 19.42847, lon: -99.12766, tz: 'America/Mexico_City' },
    { name: 'Seoul, KR', lat: 37.566, lon: 126.9784, tz: 'Asia/Seoul' },
    { name: 'Sydney, New South Wales, AU', lat: -33.86785, lon: 151.20732, tz: 'Australia/Sydney' },
    { name: 'Fredericton, New Brunswick, CA', lat: 45.94541, lon: -66.66558, tz: 'America/Moncton' },
    { name: 'Reykjavík, IS', lat: 64.13548, lon: -21.89541, tz: 'Atlantic/Reykjavik' },
    { name: 'Cairo, EG', lat: 30.06263, lon: 31.24967, tz: 'Africa/Cairo' }
  ];
  var DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  $('rndBtn').addEventListener('click', function () {
    function pick(a, b) { return Math.floor(rnd(a, b + 1)); }
    var mo = pick(1, 12);
    $('bMonth').value = mo;
    $('bDay').value = pick(1, DAYS_IN[mo - 1]);
    $('bYear').value = pick(1965, 2004); // adults only; the age gate bites otherwise
    $('bHour').value = pick(1, 12);
    $('bMin').value = pick(0, 59);
    (Math.random() < 0.5 ? amBtn : pmBtn).click();
    var c = RND_CITIES[pick(0, RND_CITIES.length - 1)];
    selected = { lat: c.lat, lon: c.lon, tz: c.tz };
    locInput.value = c.name;
    locList.style.display = 'none';
  });

  // stage 2 NEXT: seen ≤3 of the shelf? then Anna demands ≥2 favorites first.
  // Movie taste folds into the score, then the reveal hands off to stage 3.
  var tasteResult = null;
  $('nextBtn2').addEventListener('click', function () {
    if (!synastryResult) return;
    if (seenCount() <= 3 && favs.length < 2) {
      favesBox.classList.add('show');
      favInput.focus();
      return;
    }
    tasteResult = withMovieTaste(synastryResult);
    // the reveal shows the movie test's OWN score, not the running blend
    var mp = moviePercent();
    // bad taste disgusts her + the screen catches fire
    playReveal({ percent: mp }, function () { goStage(3); }, 'movie compatibility',
      null, mp < 40 ? { mood: 'disgusted', fx: 'fire' } : null);
  });

  /* ---- Stage 3: looks match ----
     Photobooth: live selfie feed -> CAPTURE runs a 3-2-1 countdown + flash
     and snaps the frame -> the two polaroids pair up while the loading bar
     runs -> LOOKS MATCHED or not. Camera denied/unavailable? The upload
     button is the fallback. Looks.analyze (assets/looks.js) is instant
     canvas math; the loading bar is pure theater. */
  var lmFile = $('lmFile'), lmDrop = $('lmDrop'), lmCapture = $('lmCapture');
  var lmImg = null, looksScore = null, looksResult = null;

  /* ---- Real background removal: MediaPipe selfie segmentation (vendored in
     assets/mediapipe/). Kicks off as soon as a photo lands, so the cutout is
     usually ready before CAPTURE. lmCut = canvas of the person with a
     transparent background; null = model unavailable, fall back to the oval. */
  var lmCut = null, segmenter = null;

  function getSegmenter() {
    if (!segmenter && typeof SelfieSegmentation !== 'undefined') {
      segmenter = new SelfieSegmentation({ locateFile: function (f) { return 'assets/mediapipe/' + f; } });
      segmenter.setOptions({ modelSelection: 0 });
    }
    return segmenter;
  }

  function segmentPerson(img, done) {
    var seg = getSegmenter();
    if (!seg) { done(null); return; }
    // cap the working size — full camera frames just slow the model down
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    var k = Math.min(1, 720 / Math.max(iw, ih));
    var w = Math.round(iw * k), h = Math.round(ih * k);
    var src = document.createElement('canvas');
    src.width = w; src.height = h;
    src.getContext('2d').drawImage(img, 0, 0, w, h);
    seg.onResults(function (res) {
      try {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var x = c.getContext('2d');
        x.drawImage(res.segmentationMask, 0, 0, w, h);
        x.globalCompositeOperation = 'source-in';
        x.drawImage(src, 0, 0, w, h);
        done(c);
      } catch (e) { done(null); }
    });
    Promise.resolve().then(function () { return seg.send({ image: src }); })
      .catch(function () { done(null); });
  }

  function startCutout(img) {
    lmCut = null;
    segmentPerson(img, function (c) {
      if (img !== lmImg) return; // a newer photo replaced this one mid-flight
      lmCut = c;
      // if the polaroid is already up with the oval fallback, upgrade it live
      if (c && looksScore && looksScore.stats && looksScore.stats.face &&
          $('lmStage').classList.contains('show')) {
        $('lmYouImg').src = faceOnWhite(lmImg, looksScore.stats.face);
      }
    });
  }
  var boothStream = null, boothOn = false, boothTimer = null;

  function startBooth() {
    if (boothOn) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('lmPrompt').textContent = 'no camera here — upload one instead';
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
      .then(function (stream) {
        boothStream = stream;
        boothOn = true;
        $('boothVid').srcObject = stream;
        $('booth').classList.add('live');
        lmCapture.disabled = false;
      })
      .catch(function () {
        $('lmPrompt').textContent = 'camera said no 💔 upload one instead';
      });
  }
  function stopBooth() {
    if (boothStream) { boothStream.getTracks().forEach(function (t) { t.stop(); }); boothStream = null; }
    clearInterval(boothTimer);
    $('boothCount').classList.remove('show');
    boothOn = false;
    $('booth').classList.remove('live');
  }

  // 3-2-1 -> flash -> freeze the mirrored frame the user was posing in
  function snapBooth() {
    var count = $('boothCount'), n = 3;
    count.textContent = n;
    count.classList.add('show');
    lmCapture.disabled = true;
    boothTimer = setInterval(function () {
      n--;
      if (n > 0) { count.textContent = n; return; }
      clearInterval(boothTimer);
      count.classList.remove('show');
      var flash = $('boothFlash');
      flash.classList.add('go');
      setTimeout(function () { flash.classList.remove('go'); }, 500);
      var vid = $('boothVid');
      var c = document.createElement('canvas');
      c.width = vid.videoWidth || 1280;
      c.height = vid.videoHeight || 720;
      var ctx = c.getContext('2d');
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(vid, 0, 0);
      var url = c.toDataURL('image/jpeg', 0.92);
      var img = new Image();
      img.onload = function () {
        lmImg = img;
        startCutout(img);
        $('lmYouImg').src = url;
        stopBooth();
        runLooks();
      };
      img.src = url;
    }, 800);
  }

  $('lmTake').addEventListener('click', startBooth);
  $('lmPick').addEventListener('click', function () { lmFile.click(); });
  lmFile.addEventListener('change', function () {
    var f = lmFile.files && lmFile.files[0];
    if (!f) return;
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () {
      lmImg = img;
      startCutout(img);
      lmDrop.classList.add('hasPhoto');
      lmDrop.style.backgroundImage = 'url("' + url + '")';
      $('lmInstruction').hidden = true;
      $('lmPrompt').textContent = 'hmm. okay. ready when you are';
      $('lmPrompt').classList.add('ready');
      $('lmMedia').insertBefore($('lmPrompt'), $('booth'));
      lmCapture.disabled = false;
      $('lmYouImg').src = url;
    };
    img.src = url;
  });

  var LM_MSGS = [
    'checking looks compatibility…',
    'measuring facial symmetry…',
    'computing conventional attractiveness…',
    'comparing against anna…',
    'running the league calculator…',
    'anna is deliberating…'
  ];

  lmCapture.addEventListener('click', function () {
    if (boothOn) { snapBooth(); return; }
    if (!lmImg) return;
    runLooks();
  });

  function runLooks() {
    // pixel pass always runs: it finds the face box for the polaroid cutout
    // and the stage-4 standee, and doubles as the fallback judge
    var local = Looks.analyze(lmImg);
    // Keep the uploaded photo rectangular so it matches Anna's polaroid.
    $('lmYouImg').src = lmImg.src;
    // real judge: Claude vision (assets/looks-ai.js) when a key is set;
    // any failure (no key, network, model declined) falls back to the pixels
    var pending = Promise.resolve(local);
    if (window.LooksAI) {
      LooksAI.ensureKey();
      if (LooksAI.ready()) {
        pending = LooksAI.analyze(lmImg).then(function (ai) {
          if (local.stats) ai.stats.face = local.stats.face;
          return ai;
        }).catch(function (e) {
          console.warn('AI judge unavailable, using the pixel judge:', e);
          return local;
        });
      }
    }
    $('stage3').classList.add('hasResult');
    $('lmUpload').style.display = 'none';
    $('lmStage').classList.add('show');
    var bar = $('lmBar'), msg = $('lmMsg'), i = 0;
    var started = Date.now();
    msg.textContent = LM_MSGS[0];
    bar.style.width = Math.round(100 / LM_MSGS.length) + '%';
    var iv = setInterval(function () {
      i++;
      if (i < LM_MSGS.length) {
        msg.textContent = LM_MSGS[i];
        bar.style.width = Math.round((i + 1) / LM_MSGS.length * 96) + '%';
      } else {
        // theater's done but the judge may still be thinking — hold here
        msg.textContent = 'anna is deliberating…';
      }
    }, 620);
    pending.then(function (r) {
      looksScore = r;
      // let the loading theater play through at least once before the verdict
      var wait = Math.max(0, LM_MSGS.length * 620 + 100 - (Date.now() - started));
      setTimeout(function () {
        clearInterval(iv);
        bar.style.width = '100%';
        setTimeout(showLooksVerdict, 350);
      }, wait);
    });
  }

  function showLooksVerdict() {
    $('lmLoad').style.display = 'none';
    var v = $('lmVerdict');
    v.className = 'lmVerdict show ' + (looksScore.matched ? 'yes' : 'no');
    v.innerHTML = '<span class="lmVerdictScore">' + looksScore.score + '/100</span>' +
      '<span class="lmVerdictStatus">' +
      (looksScore.matched ? 'LOOKS MATCHED ' : 'NOT LOOKS MATCHED ') +
      heartSVG(!looksScore.matched) + '</span>' +
      '<small>' + looksScore.verdictLine + '</small>';
    $('lmHeart').innerHTML = heartSVG(!looksScore.matched);
    setMood(looksScore.matched ? 'smug' : 'angry'); // matched: she KNEW she was right about you
    if (looksScore.matched) {
      var heartsBtn = document.querySelector('.anims button[data-fx="hearts"]');
      if (heartsBtn) heartsBtn.click();
    }
    $('lmFoot').classList.add('show');
  }

  /* ---- Looks fold into the running score ---- */
  function withLooks(base) {
    if (!looksScore || base.percent === 0) return base;
    var mod = Math.max(-18, Math.min(18, Math.round((looksScore.score - 55) / 2.2)));
    var pct = Math.max(2, Math.min(99, base.percent + mod));
    return {
      percent: pct,
      verdict: Synastry.verdictFor(pct),
      you: base.you, anna: base.anna, aspectCount: base.aspectCount,
      green: looksScore.flags.filter(function (f) { return f.good; }).slice(0, 2).concat(base.green).slice(0, 6),
      red: looksScore.flags.filter(function (f) { return !f.good; }).slice(0, 2).concat(base.red).slice(0, 6)
    };
  }

  // stage 3 NEXT: fold looks in, then on to the height check
  $('nextBtn3').addEventListener('click', function () {
    if (!synastryResult) return;
    looksResult = withLooks(tasteResult || synastryResult);
    // the reveal shows the looks stage's OWN 0-100 score
    playReveal({ percent: looksScore ? looksScore.score : looksResult.percent }, function () { goStage(4); }, 'looks compatibility');
  });

  /* ---- Stage 4: the height check ----
     Two department-store cardboard standees on a floor: you (head cropped
     from the stage-3 photo via its face box) and Anna. The ruler slider
     resizes your standee live against Anna's dashed height line. */
  var ANNA_IN = 62; // Anna is 5'2"
  var hcIn = 69;    // slider default: 5'9"

  function fmtHeight(inches) {
    var ft = Math.floor(inches / 12);
    var rem = +(inches - ft * 12).toFixed(1);
    return ft + '′' + rem + '″';
  }

  // Head geometry straight from the segmentation mask's alpha channel — the
  // skin-box from looks.js overshoots on red clothes / busy photos, so scale
  // and position come from the actual silhouette instead. Returns head top,
  // head (hair) width and center-x in lmCut pixels, or null.
  function headMetrics(cut) {
    var k = 96 / Math.max(cut.width, cut.height);
    var w = Math.max(1, Math.round(cut.width * k)), h = Math.max(1, Math.round(cut.height * k));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(cut, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data;
    var rows = [], top = -1, bot = -1;
    for (var yy = 0; yy < h; yy++) {
      var mn = 1e9, mx = -1;
      for (var xx = 0; xx < w; xx++) {
        if (d[(yy * w + xx) * 4 + 3] > 128) { if (xx < mn) mn = xx; if (xx > mx) mx = xx; }
      }
      rows.push(mx >= mn ? { mn: mn, mx: mx } : null);
      if (rows[yy]) { if (top < 0) top = yy; bot = yy; }
    }
    if (top < 0 || bot - top < 8) return null;
    // walk down from the hair: head width changes gently row to row, then
    // shoulders arrive as a sudden widening vs the recent rows — that jump is
    // where the head ends (poses with raised arms would fool a fixed % band)
    var widths = [], cxs = [], shoulder = -1;
    for (var y2 = top + Math.max(1, Math.round((bot - top) * 0.02)); y2 <= bot; y2++) {
      var r = rows[y2];
      if (!r) continue;
      var wd = r.mx - r.mn + 1;
      if (widths.length >= 8) {
        var recent = widths.slice(-10).sort(function (a, b) { return a - b; });
        if (wd > recent[Math.floor(recent.length / 2)] * 1.45) { shoulder = y2; break; }
      }
      widths.push(wd);
      cxs.push((r.mx + r.mn) / 2);
      if (y2 - top > (bot - top) * 0.55) { shoulder = y2; break; } // no jump found: assume tight headshot
    }
    if (shoulder < 0) shoulder = bot;
    if (!widths.length) return null;
    widths.sort(function (a, b) { return a - b; });
    return {
      top: top / k,
      width: widths[Math.floor(widths.length * 0.85)] / k, // near-widest = hair
      headH: (shoulder - top) / k,
      cx: cxs.reduce(function (a, b) { return a + b; }, 0) / cxs.length / k
    };
  }

  // JibJab-style head for the standee: with a segmentation cutout it's the
  // real head silhouette (CSS crops it round); otherwise fall back to the
  // ellipse cut around the detected face box
  function faceSticker(img, box) {
    var m = lmCut && headMetrics(lmCut);
    if (m) {
      // just the head: hair top to the shoulder jump, nothing below
      var cropW = m.width * 1.15;
      var cropH = (m.headH || m.width * 1.3) * 1.06;
      var S = 300, SH = Math.max(120, Math.round(S * cropH / cropW));
      var c2 = document.createElement('canvas');
      c2.width = S; c2.height = SH;
      c2.getContext('2d').drawImage(lmCut,
        m.cx - cropW / 2, m.top - cropH * 0.03, cropW, cropH, 0, 0, S, SH);
      return c2.toDataURL('image/png');
    }
    var bw = (box.x1 - box.x0) * img.naturalWidth, bh = (box.y1 - box.y0) * img.naturalHeight;
    var cx = (box.x0 + box.x1) / 2 * img.naturalWidth, cy = (box.y0 + box.y1) / 2 * img.naturalHeight;
    var rx = bw * 0.72, ry = bh * 0.82; // a hair wider/taller than the box for hair + chin
    var W = 300, H = Math.max(200, Math.round(300 * (ry / rx)));
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, W / 2 - 2, H / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill(); // the white border IS a bigger white ellipse underneath
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, W / 2 - 14, H / 2 - 14, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - rx, cy - ry, rx * 2, ry * 2, 14, 14, W - 28, H - 28);
    return c.toDataURL('image/png');
  }
  var stickerUrl = null, stickerFor = '';

  // composed onto a white canvas: the stage-3 polaroid gets a clean white
  // background like Anna's studio shot. With a segmentation cutout (lmCut)
  // it's the person's real silhouette — hair and all; without one it falls
  // back to the old oval crop.
  function faceOnWhite(img, box) {
    var W = 600, H = 800;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    var bw = (box.x1 - box.x0) * img.naturalWidth, bh = (box.y1 - box.y0) * img.naturalHeight;
    var cx = (box.x0 + box.x1) / 2 * img.naturalWidth, cy = (box.y0 + box.y1) / 2 * img.naturalHeight;
    var m = lmCut && headMetrics(lmCut);
    if (m) {
      // face-to-face with Anna: her studio portrait has hair-top ~6% from
      // the top and a head about half the frame wide, so scale the cutout
      // until this head matches that framing
      var scale = (W * 0.52) / m.width;
      ctx.drawImage(lmCut,
        W / 2 - m.cx * scale, H * 0.06 - m.top * scale,
        lmCut.width * scale, lmCut.height * scale);
      return c.toDataURL('image/jpeg', 0.92);
    }
    var rx = bw * 0.85, ry = bh * 1.05;
    var eRx = W * 0.36, eRy = eRx * (ry / rx), ex = W / 2, ey = H * 0.44;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, eRx, eRy, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - rx, cy - ry, rx * 2, ry * 2, ex - eRx, ey - eRy, eRx * 2, eRy * 2);
    ctx.restore();
    return c.toDataURL('image/jpeg', 0.92);
  }

  /* drawn hearts instead of emoji: solid candy heart, optionally cracked */
  function heartSVG(broken) {
    var crack = broken
      ? '<path d="M16 3.5 L12.5 10 L17.5 14.5 L13 20 L16.5 26" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>'
      : '';
    return '<svg class="heartIco" viewBox="0 0 32 30" aria-hidden="true">' +
      '<path d="M16 28.5 C8 21.5 .5 15.5 .5 9 C.5 4.3 4.3 .5 9 .5 C11.9 .5 14.4 2 16 4.3 C17.6 2 20.1 .5 23 .5 C27.7 .5 31.5 4.3 31.5 9 C31.5 15.5 24 21.5 16 28.5 Z" fill="#f14e98" stroke="#a81260" stroke-width="1.4"/>' +
      crack + '</svg>';
  }

  // de-emoji the report modal headers
  (function () {
    var h3s = document.querySelectorAll('.modal h3');
    if (h3s.length >= 2) {
      h3s[0].innerHTML = heartSVG(false) + ' GREEN FLAGS';
      h3s[1].innerHTML = heartSVG(true) + ' RED FLAGS';
    }
  })();

  function syncStandees() {
    var floor = $('hcFloor');
    if (!floor.clientHeight) return;
    // FIXED scale: Anna's standee never changes size — only YOURS grows or
    // shrinks, so it's unambiguous whose height the slider is setting.
    // Scaled to 80in so the scene fills the floor; the rare 6'8"+ standee
    // visually caps at the ceiling while the label keeps the true number.
    var ppi = floor.clientHeight * 0.97 / 80;
    var visIn = Math.min(hcIn, 80);
    var you = $('hcYou'), anna = $('hcAnnaStd');
    you.style.height = (visIn * ppi) + 'px';
    you.style.width = (visIn * ppi * 0.34) + 'px';
    anna.style.height = (ANNA_IN * ppi) + 'px';
    anna.style.width = anna.classList.contains('full') ? 'auto' : (ANNA_IN * ppi * 0.34) + 'px';
    // the full-body PNG has transparent padding around Anna, so height:100%
    // renders her short of her own dashed line — stretch the img so her
    // OPAQUE pixels (hair to shoes) span exactly her 62 inches
    if (anna.classList.contains('full') && annaFullImg && annaTrim) {
      var tf = annaTrim.bot - annaTrim.top;
      var ih = ANNA_IN * ppi / tf;
      var iw = ih * annaFullImg.naturalWidth / annaFullImg.naturalHeight;
      anna.style.width = iw + 'px';
      annaFullImg.style.height = ih + 'px';
      annaFullImg.style.width = 'auto';
      annaFullImg.style.position = 'absolute';
      annaFullImg.style.left = '50%';
      annaFullImg.style.transform = 'translateX(-50%)';
      annaFullImg.style.bottom = (-(1 - annaTrim.bot) * ih) + 'px';
    }
    // Anna reacts to the comparison: shorter than her -> laughing and pointing,
    // 6'5"+ giant looming -> scared, otherwise neutral
    if (annaFullImg) {
      var want = (annaLaughOK && hcIn < ANNA_IN) ? 'assets/anna-fullbody-laughing.png'
        : (annaScaredOK && hcIn >= ANNA_SCARED_AT) ? 'assets/anna-fullbody-scared.png'
        : 'assets/anna-fullbody.png';
      if (annaFullImg.getAttribute('src') !== want) annaFullImg.src = want;
    }
    // pin the dashed line to Anna's actual rendered head (her standee box top
    // == her opaque hair top) — computing it from hcFloor's bottom drifts,
    // since the standees' feet don't sit exactly on hcFloor's bottom edge
    var lineEl = $('hcAnnaLine');
    lineEl.style.bottom = 'auto';
    lineEl.style.top = (anna.getBoundingClientRect().top - floor.getBoundingClientRect().top + 1) + 'px';
    // your own dashed line rides the top of your standee, label on the left
    var youLine = $('hcYouLine');
    youLine.style.bottom = 'auto';
    youLine.style.top = (you.getBoundingClientRect().top - floor.getBoundingClientRect().top + 1) + 'px';
    $('hcYouLabel').textContent = 'you · ' + fmtHeight(hcIn);
    var diff = +(hcIn - ANNA_IN).toFixed(1);
    $('hcLine').textContent = diff === 0 ? 'exactly anna’s height'
      : Math.abs(diff) + '″ ' + (diff > 0 ? 'taller' : 'shorter') + ' than anna';
    var yh = $('hcYouHead');
    if (lmImg) {
      yh.textContent = '';
      var box = (looksScore && looksScore.stats && looksScore.stats.face) ||
        { x0: .3, x1: .7, y0: .12, y1: .5 }; // no face box? assume a centered head
      var stickerKey = lmImg.src + (lmCut ? '#cut' : '');
      if (stickerFor !== stickerKey) {
        stickerUrl = faceSticker(lmImg, box);
        stickerFor = stickerKey;
      }
      yh.classList.add('sticker');
      yh.style.backgroundImage = 'url("' + stickerUrl + '")';
    } else {
      yh.classList.remove('sticker');
      yh.style.backgroundImage = '';
      yh.textContent = '?';
    }
  }

  // if a real full-body Anna cutout exists (assets/anna-fullbody.png, generated
  // separately), use it instead of the cardboard silhouette
  var annaFullImg = null, annaTrim = null, annaScaredOK = false, annaLaughOK = false;
  var ANNA_SCARED_AT = 77; // 6'5"

  // top/bottom of the opaque pixels as fractions of image height (PNG cutouts
  // ship with transparent margins that would otherwise skew the height math)
  function alphaBounds(img) {
    try {
      var k = 64 / img.naturalHeight;
      var w = Math.max(1, Math.round(img.naturalWidth * k)), h = 64;
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, w, h);
      var d = x.getImageData(0, 0, w, h).data;
      var top = -1, bot = -1;
      for (var yy = 0; yy < h; yy++) {
        for (var xx = 0; xx < w; xx++) {
          if (d[(yy * w + xx) * 4 + 3] > 16) { if (top < 0) top = yy; bot = yy; break; }
        }
      }
      return top >= 0 ? { top: top / h, bot: (bot + 1) / h } : null;
    } catch (e) { return null; }
  }

  (function () {
    var img = new Image();
    img.onload = function () { // re-fires when reaction variants swap src
      annaFullImg = img;
      annaTrim = alphaBounds(img);
      var std = $('hcAnnaStd');
      std.classList.add('full');
      if (!img.parentNode) {
        std.innerHTML = '';
        img.alt = 'anna';
        std.appendChild(img);
      }
      if (document.body.classList.contains('s4')) syncStandees();
    };
    img.src = 'assets/anna-fullbody.png';
    // the reaction variants are optional; only swap to one once it's known to exist
    var scared = new Image();
    scared.onload = function () { annaScaredOK = true; };
    scared.src = 'assets/anna-fullbody-scared.png';
    var laugh = new Image();
    laugh.onload = function () { annaLaughOK = true; };
    laugh.src = 'assets/anna-fullbody-laughing.png';
  })();

  $('hcSlider').addEventListener('input', function () {
    hcIn = +this.value;
    syncStandees();
  });
  window.addEventListener('resize', function () {
    if (document.body.classList.contains('s4')) syncStandees();
  });

  /* Anna's height preference: she's 5'2", prefers 5'8"-6'3" with a hard
     minimum of 5'7" (below that: incompatible). Peak zone is 5'10"-6'2"
     and 6'0" on the nose is the single most compatible height. Scary-tall
     kicks in at 6'5" and gets worse from 6'7" up. */
  function heightFlag(inches) {
    var v = fmtHeight(inches);
    if (inches <= ANNA_IN) return { text: v + ' — shorter than Anna herself. she wears heels. constantly.', pts: -26, good: false };
    if (inches < 67) return { text: v + ' — below Anna’s hard minimum of 5′7″. incompatible.', pts: -20, good: false };
    if (inches < 68) return { text: v + ' — scraped past the 5′7″ minimum. Anna noticed the scraping.', pts: 1, good: true };
    if (inches < 70) return { text: v + ' — inside Anna’s range. respectable.', pts: 6, good: true };
    if (inches >= 71.5 && inches <= 72.5) return { text: v + ' — six feet. the most compatible height in existence. Anna already saved your number', pts: 14, good: true };
    if (inches < 75) return { text: v + ' — peak zone (5′10″–6′2″). Anna is very much paying attention', pts: 12, good: true };
    if (inches < 76) return { text: v + ' — 6′3″, the very top of Anna’s range. made it. barely.', pts: 8, good: true };
    if (inches < 77) return { text: v + ' — 6′4″ is pushing it, but Anna will allow it', pts: 2, good: true };
    if (inches < 79) return { text: v + ' — 6′5″+. entering scary-tall territory. Anna is uneasy', pts: -8, good: false };
    return { text: v + ' — 6′7″ and up is genuinely scary tall. Anna has questions (from down here)', pts: -16, good: false };
  }

  // the height test's own standalone score (what the stage-4 reveal shows)
  function heightPercent() {
    return Math.max(2, Math.min(99, 50 + Math.round(heightFlag(hcIn).pts * 3.4)));
  }

  var heightResult = null;
  function withHeight(base) {
    if (base.percent === 0) return base;
    var f = heightFlag(hcIn);
    var pct = Math.max(2, Math.min(99, base.percent + f.pts));
    return {
      percent: pct,
      verdict: Synastry.verdictFor(pct),
      you: base.you, anna: base.anna, aspectCount: base.aspectCount,
      green: (f.good ? [f] : []).concat(base.green).slice(0, 6),
      red: (f.good ? [] : [f]).concat(base.red).slice(0, 6)
    };
  }

  // stage 4 NEXT: fold the height preference in, reveal the height test's
  // OWN score, then hand everything to the final verdict screen
  var heightDone = false;
  $('nextBtn4').addEventListener('click', function () {
    var base = looksResult || tasteResult || synastryResult;
    if (!base) return;
    heightResult = withHeight(base);
    heightDone = true;
    playReveal({ percent: heightPercent() }, function () {
      goStage(5);
      FinalScreen.show({
        astro: synastryResult ? synastryResult.percent : null,
        movie: moviePercent(),
        looks: looksScore ? looksScore.score : null,
        height: heightPercent()
      });
    }, 'height compatibility');
  });

  // ⓘ more info: the report for the test you most recently finished —
  // synastry while on the movie test, movie taste while on looks match,
  // looks while on the height check, height once its NEXT has been clicked.
  $('moreInfo').addEventListener('click', function () {
    if (curStage >= 4 && heightDone) showHeightReport();
    else if (curStage >= 4 && looksScore) showLooksReport();
    else if (curStage === 3 && synastryResult) showTasteReport();
    else if (synastryResult) showResult(synastryResult);
  });

  // shared modal shell; each report fills its own fields
  function openModal(o) {
    document.querySelector('#overlay .modal h2').textContent = o.title;
    $('mPct').textContent = o.pct;
    $('mVerdict').textContent = o.verdict;
    $('mBig3').innerHTML = o.big3;
    $('mGreen').innerHTML = o.green.map(function (f) { return '<li>' + heartSVG(false) + ' ' + f.text + ' <b>(+' + f.pts + ')</b></li>'; }).join('') ||
      '<li>' + o.noGreen + '</li>';
    $('mRed').innerHTML = o.red.map(function (f) { return '<li>' + heartSVG(true) + ' ' + f.text + ' <b>(' + f.pts + ')</b></li>'; }).join('') ||
      '<li>' + o.noRed + '</li>';
    $('mFine').textContent = o.fine;
    $('overlay').style.display = 'flex';
  }

  function showResult(r) {
    openModal({
      title: 'COSMIC COMPATIBILITY',
      pct: r.percent + '%',
      verdict: r.verdict,
      big3: '<b>you:</b> ' + r.you.sun + ' Sun · ' + r.you.moon + ' Moon · ' + r.you.rising + ' rising' +
        '<br><b>anna:</b> ' + r.anna.sun + ' Sun · ' + r.anna.moon + ' Moon · ' + r.anna.rising + ' rising',
      green: r.green,
      red: r.red,
      noGreen: '…the stars found no green flags. oof.',
      noRed: 'no red flags?? suspicious but okay.',
      fine: 'full-chart synastry · ' + r.aspectCount + ' cross-aspects · 10 planets + rising · tropical zodiac'
    });
  }

  function showTasteReport() {
    var m = movieMod(), pct = moviePercent();
    openModal({
      title: 'MOVIE TASTE REPORT',
      pct: pct + '%',
      verdict: Synastry.verdictFor(pct),
      big3: '<b>shelf:</b> ' + seenCount() + ' of 12 seen<br><b>favorites judged:</b> ' +
        (favs.length ? favs.map(function (f) { return '“' + f.title + '”'; }).join(', ') : 'none — the shelf spoke for itself'),
      green: m.flags.filter(function (f) { return f.good; }),
      red: m.flags.filter(function (f) { return !f.good; }),
      noGreen: 'not one point of taste credit. Anna is worried about you.',
      noRed: 'zero taste violations. the shelf approves.',
      fine: 'movie test · shelf watch-count + judged favorites · folded into the running compatibility'
    });
  }

  function showLooksReport() {
    openModal({
      title: 'LOOKS MATCH REPORT',
      pct: looksScore.score + '%',
      verdict: looksScore.verdictLine,
      big3: '<b>result:</b> ' + (looksScore.matched ? 'LOOKS MATCHED' : 'NOT LOOKS MATCHED') +
        '<br><b>bar to clear:</b> ' + Looks.MATCH_AT + '% — Anna grades on her own curve',
      green: looksScore.flags.filter(function (f) { return f.good; }),
      red: looksScore.flags.filter(function (f) { return !f.good; }),
      noGreen: 'the camera found nothing to compliment. brutal.',
      noRed: 'no complaints from Anna. rare.',
      fine: looksScore.stats && looksScore.stats.ai
        ? 'looks match · judged by Claude vision (' + looksScore.stats.model + ') · Anna outsourced her eyes'
        : 'looks match · analyzed entirely in your browser — the photo never leaves your device'
    });
  }

  function showHeightReport() {
    var f = heightFlag(hcIn), pct = heightPercent();
    openModal({
      title: 'HEIGHT COMPATIBILITY',
      pct: pct + '%',
      verdict: Synastry.verdictFor(pct),
      big3: '<b>you:</b> ' + fmtHeight(hcIn) + '<br><b>anna:</b> ' + fmtHeight(ANNA_IN) + ' (heels not included)',
      green: f.good ? [f] : [],
      red: f.good ? [] : [f],
      noGreen: 'the tape measure had nothing nice to say.',
      noRed: 'no height complaints. Anna is looking up. literally.',
      fine: 'height check · Anna’s range 5′8″–6′3″ · hard minimum 5′7″ · peak 6′0″ · scary-tall from 6′5″'
    });
  }

  $('closeM').addEventListener('click', function () { $('overlay').style.display = 'none'; });
  $('overlay').addEventListener('click', function (e) {
    if (e.target.id === 'overlay') e.target.style.display = 'none';
  });

  /* ---- Dev hooks: ?stage=N jumps straight to a stage (looks-match verdict
     works standalone; its NEXT still needs a real stage-1 run). ?test=1
     auto-fills the form and clicks NEXT. ---- */
  var stageParam = +new URLSearchParams(location.search).get('stage');
  if (stageParam >= 2) goStage(Math.min(stageParam, 4));
  if (new URLSearchParams(location.search).get('test')) {
    $('bMonth').value = 3; $('bDay').value = 3;
    $('bYear').value = +new URLSearchParams(location.search).get('year') || 2000;
    $('bHour').value = 10; $('bMin').value = 0;
    amBtn.click();
    selected = { lat: 40.6501, lon: -73.94958, tz: 'America/New_York' };
    locInput.value = 'Brooklyn, New York, US';
    setTimeout(function () { $('nextBtn').click(); }, 400);
    // &movies=N marks N shelf cases seen and runs the stage-2 reveal too
    var nMovies = +new URLSearchParams(location.search).get('movies');
    if (nMovies) setTimeout(function () {
      document.querySelectorAll('.case').forEach(function (c, i) { if (i < nMovies) c.click(); });
      $('nextBtn2').click();
    }, 3200);
  }
})();
