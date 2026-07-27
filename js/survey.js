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

  function withMovieTaste(base) {
    if (base.percent === 0) return base; // the age gate has spoken; movies can't save you
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
    var pct = Math.max(2, Math.min(99, base.percent + Math.round(mod)));
    return {
      percent: pct,
      verdict: Synastry.verdictFor(pct),
      you: base.you, anna: base.anna, aspectCount: base.aspectCount,
      green: flags.filter(function (f) { return f.good; }).concat(base.green).slice(0, 6),
      red: flags.filter(function (f) { return !f.good; }).concat(base.red).slice(0, 6)
    };
  }

  function goStage(n) {
    document.body.classList.toggle('s2', n === 2);
    document.body.classList.toggle('s3', n === 3);
    // photobooth camera only runs while stage 3 is showing its upload step
    if (n === 3) startBooth(); else stopBooth();
    document.querySelectorAll('.map .node').forEach(function (node, i) {
      node.classList.toggle('active', i === n - 1);
      node.classList.toggle('done', i < n - 1);
    });
  }
  // completed nodes are clickable to go back and redo an earlier stage
  [1, 2].forEach(function (n) {
    var node = document.querySelector('.node.n' + n);
    node.addEventListener('click', function () {
      if (node.classList.contains('done')) goStage(n);
    });
  });

  /* ---- Compatibility reveal: ring + % flashed between stages ----
     Anna reacts to the score: high = love, low = sad, really low = scared. */
  function setMood(img) {
    var btn = document.querySelector('.moods button[data-img="' + img + '"]');
    if (btn) btn.click();
  }
  function moodFor(pct) {
    if (pct >= 70) return 'love';
    if (pct >= 40) return 'portrait-cutout';
    if (pct >= 20) return 'sad';
    return 'scared';
  }
  var RING_C = 2 * Math.PI * 54; // circumference of the r=54 ring
  var revealing = false;
  function playReveal(r, after) {
    if (revealing) return;
    revealing = true;
    var reveal = $('reveal'), fill = $('ringFill'), pctEl = $('ringPct');
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
      else setMood(moodFor(r.percent)); // she reacts once the number lands
    }
    requestAnimationFrame(tick);
    // swap the stage underneath the flash, then fade it out
    setTimeout(function () { if (after) after(); }, 1500);
    setTimeout(function () { reveal.classList.remove('show'); revealing = false; }, 2100);
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
    $('moreInfo').style.display = 'block';
    if (synastryResult.percent === 0) {
      // teenagers do not advance: reveal the 0, let her be scared, show the receipt
      playReveal(synastryResult, function () { showResult(synastryResult); });
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
    playReveal(tasteResult, function () { goStage(3); });
  });

  /* ---- Stage 3: looks match ----
     Photobooth: live selfie feed -> CAPTURE runs a 3-2-1 countdown + flash
     and snaps the frame -> the two polaroids pair up while the loading bar
     runs -> LOOKS MATCHED or not. Camera denied/unavailable? The upload
     button is the fallback. Looks.analyze (assets/looks.js) is instant
     canvas math; the loading bar is pure theater. */
  var lmFile = $('lmFile'), lmDrop = $('lmDrop'), lmCapture = $('lmCapture');
  var lmImg = null, looksScore = null, looksResult = null;
  var boothStream = null, boothOn = false, boothTimer = null;

  function startBooth() {
    if (boothOn || lmImg) return; // already live, or a photo is already locked in
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
      .then(function (stream) {
        boothStream = stream;
        boothOn = true;
        $('boothVid').srcObject = stream;
        $('booth').classList.add('live');
        lmCapture.disabled = false;
      })
      .catch(function () { /* denied or no camera: the upload button stays */ });
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
        $('lmYouImg').src = url;
        stopBooth();
        runLooks();
      };
      img.src = url;
    }, 800);
  }

  lmDrop.addEventListener('click', function () { lmFile.click(); });
  lmFile.addEventListener('change', function () {
    var f = lmFile.files && lmFile.files[0];
    if (!f) return;
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () {
      lmImg = img;
      lmDrop.classList.add('hasPhoto');
      lmDrop.style.backgroundImage = 'url("' + url + '")';
      lmDrop.querySelector('b').textContent = 'hmm. okay. ready when you are';
      lmCapture.disabled = false;
      $('lmYouImg').src = url;
    };
    img.src = url;
  });

  var LM_MSGS = [
    'checking looks compatibility…',
    'measuring facial symmetry…',
    'checking hair darkness…',
    'estimating eye color…',
    'running the blonde detector…',
    'consulting anna’s type…'
  ];

  lmCapture.addEventListener('click', function () {
    if (boothOn) { snapBooth(); return; }
    if (!lmImg) return;
    runLooks();
  });

  function runLooks() {
    looksScore = Looks.analyze(lmImg);
    $('lmUpload').style.display = 'none';
    $('lmStage').classList.add('show');
    var bar = $('lmBar'), msg = $('lmMsg'), i = 0;
    msg.textContent = LM_MSGS[0];
    bar.style.width = Math.round(100 / LM_MSGS.length) + '%';
    var iv = setInterval(function () {
      i++;
      if (i < LM_MSGS.length) {
        msg.textContent = LM_MSGS[i];
        bar.style.width = Math.round((i + 1) / LM_MSGS.length * 100) + '%';
      } else {
        clearInterval(iv);
        setTimeout(showLooksVerdict, 350);
      }
    }, 620);
  }

  function showLooksVerdict() {
    $('lmLoad').style.display = 'none';
    var v = $('lmVerdict');
    v.className = 'lmVerdict show ' + (looksScore.matched ? 'yes' : 'no');
    // headline the flag that matches the verdict's mood
    var pool = looksScore.flags.filter(function (f) { return f.good === looksScore.matched; });
    v.innerHTML = (looksScore.matched ? 'LOOKS MATCHED 💘' : 'NOT LOOKS MATCHED 💔') +
      (pool.length ? '<small>' + pool[0].text + '</small>' : '');
    $('lmHeart').textContent = looksScore.matched ? '💘' : '💔';
    setMood(looksScore.matched ? 'love' : 'angry');
    if (looksScore.matched) {
      var heartsBtn = document.querySelector('.anims button[data-fx="hearts"]');
      if (heartsBtn) heartsBtn.click();
    }
    $('lmScoreLine').textContent = 'looks score: ' + looksScore.score + ' / 100';
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

  // stage 3 NEXT: fold looks in; stages 4-5 don't exist yet, so the adjusted
  // reveal is the end of the road for now.
  $('nextBtn3').addEventListener('click', function () {
    if (!synastryResult) return;
    looksResult = withLooks(tasteResult || synastryResult);
    playReveal(looksResult);
  });

  // temporary escape hatch to the full synastry report
  $('moreInfo').addEventListener('click', function () {
    var r = looksResult || tasteResult || synastryResult;
    if (r) showResult(r);
  });

  function showResult(r) {
    $('mPct').textContent = r.percent + '%';
    $('mVerdict').textContent = r.verdict;
    $('mBig3').innerHTML = '<b>you:</b> ' + r.you.sun + ' Sun · ' + r.you.moon + ' Moon · ' + r.you.rising + ' rising' +
      '<br><b>anna:</b> ' + r.anna.sun + ' Sun · ' + r.anna.moon + ' Moon · ' + r.anna.rising + ' rising';
    $('mGreen').innerHTML = r.green.map(function (f) { return '<li>💖 ' + f.text + ' <b>(+' + f.pts + ')</b></li>'; }).join('') ||
      '<li>…the stars found no green flags. oof.</li>';
    $('mRed').innerHTML = r.red.map(function (f) { return '<li>💔 ' + f.text + ' <b>(' + f.pts + ')</b></li>'; }).join('') ||
      '<li>no red flags?? suspicious but okay.</li>';
    $('mFine').textContent = 'full-chart synastry · ' + r.aspectCount + ' cross-aspects · 10 planets + rising · tropical zodiac';
    $('overlay').style.display = 'flex';
  }

  $('closeM').addEventListener('click', function () { $('overlay').style.display = 'none'; });
  $('overlay').addEventListener('click', function (e) {
    if (e.target.id === 'overlay') e.target.style.display = 'none';
  });

  /* ---- Dev hooks: ?stage=N jumps straight to a stage (looks-match verdict
     works standalone; its NEXT still needs a real stage-1 run). ?test=1
     auto-fills the form and clicks NEXT. ---- */
  var stageParam = +new URLSearchParams(location.search).get('stage');
  if (stageParam >= 2) goStage(Math.min(stageParam, 3));
  if (new URLSearchParams(location.search).get('test')) {
    $('bMonth').value = 3; $('bDay').value = 3;
    $('bYear').value = +new URLSearchParams(location.search).get('year') || 2000;
    $('bHour').value = 10; $('bMin').value = 0;
    amBtn.click();
    selected = { lat: 40.6501, lon: -73.94958, tz: 'America/New_York' };
    locInput.value = 'Brooklyn, New York, US';
    setTimeout(function () { $('nextBtn').click(); }, 400);
  }
})();
