/* Survey page: Emotion Beta swapper, birth-detail pickers, city autocomplete,
   and the NEXT -> compatibility modal (testing flow).
   Depends on assets/synastry.js (global `Synastry`). */
(function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ---- Emotion Beta: swap Anna's portrait, toggle steam while angry ---- */
  var moodButtons = document.querySelectorAll('.moods button');
  moodButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      $('anna').src = 'assets/' + btn.dataset.img + '.png';
      $('av').classList.toggle('angry', btn.dataset.img === 'angry');
      moodButtons.forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
    });
  });
  // #love, #angry, etc. in the URL preselects that mood
  var hash = location.hash.slice(1);
  if (hash) {
    var hashBtn = document.querySelector('.moods button[data-img="' + hash + '"]');
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

  /* ---- NEXT: validate, compute synastry, show the modal ---- */
  document.querySelector('.card').addEventListener('submit', function (e) { e.preventDefault(); });

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
    var r = Synastry.compute({ y: y, mo: mo, d: d, h: h24, mi: mi, lat: selected.lat, lon: selected.lon, tz: selected.tz });
    showResult(r);
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

  /* ---- Dev hook: ?test=1 auto-fills the form and opens the modal ---- */
  if (new URLSearchParams(location.search).get('test')) {
    $('bMonth').value = 3; $('bDay').value = 3; $('bYear').value = 2000;
    $('bHour').value = 10; $('bMin').value = 0;
    amBtn.click();
    selected = { lat: 40.6501, lon: -73.94958, tz: 'America/New_York' };
    locInput.value = 'Brooklyn, New York, US';
    setTimeout(function () { $('nextBtn').click(); }, 400);
  }
})();
