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
    sparkles: function () {
      spawn(18, function (s) {
        s.className = 'fx-spark';
        s.textContent = '✨';
        s.style.left = rnd(0, 96) + '%';
        s.style.top = rnd(2, 88) + '%';
        s.style.fontSize = rnd(18, 52) + 'px';
        s.style.animationDuration = rnd(1.2, 2.8) + 's';
        s.style.animationDelay = -rnd(0, 2.8) + 's';
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

  function goStage(n) {
    document.body.classList.toggle('s2', n === 2);
    document.querySelectorAll('.map .node').forEach(function (node, i) {
      node.classList.toggle('active', i === n - 1);
      node.classList.toggle('done', i < n - 1);
    });
  }
  // completed node 1 is clickable to go back and fix birth details
  document.querySelector('.node.n1').addEventListener('click', function () {
    if (document.body.classList.contains('s2')) goStage(1);
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
    playReveal(synastryResult, function () { goStage(2); });
  });

  // stage 2 NEXT: stages 3-5 don't exist yet, so just replay the reveal
  // (movie taste doesn't move the score yet)
  $('nextBtn2').addEventListener('click', function () {
    if (synastryResult) playReveal(synastryResult);
  });

  // temporary escape hatch to the full synastry report
  $('moreInfo').addEventListener('click', function () {
    if (synastryResult) showResult(synastryResult);
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

  /* ---- Dev hook: ?test=1 auto-fills the form and clicks NEXT ---- */
  if (new URLSearchParams(location.search).get('test')) {
    $('bMonth').value = 3; $('bDay').value = 3; $('bYear').value = 2000;
    $('bHour').value = 10; $('bMin').value = 0;
    amBtn.click();
    selected = { lat: 40.6501, lon: -73.94958, tz: 'America/New_York' };
    locInput.value = 'Brooklyn, New York, US';
    setTimeout(function () { $('nextBtn').click(); }, 400);
  }
})();
