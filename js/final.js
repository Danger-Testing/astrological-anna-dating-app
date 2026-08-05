/* Stage 5: the final verdict. Aggregates the four test scores into one big
   number, shows a mini ring per test, then either opens the gates to Anna's
   socials (>= 70) or offers the consolation lineup. Rendered into #stage5. */
(function () {
  var RING_C = 2 * Math.PI * 34;

  function ring(label, pct) {
    var shown = pct == null ? '—' : pct + '%';
    var off = pct == null ? RING_C : RING_C * (1 - pct / 100);
    return '<div class="fCell"><div class="fRingWrap">' +
      '<svg viewBox="0 0 84 84">' +
      '<circle class="fBg" cx="42" cy="42" r="34"/>' +
      '<circle class="fFill" cx="42" cy="42" r="34" style="stroke-dasharray:' + RING_C + ';stroke-dashoffset:' + RING_C + '" data-off="' + off + '"/>' +
      '</svg><b>' + shown + '</b></div><span>' + label + '</span></div>';
  }

  var CONSOLATION = [
    ['Clairo', 'https://instagram.com/clairo', 'assets/consolation-clairo.png'],
    ['Zooey Deschanel', 'https://instagram.com/zooeydeschanel', 'assets/consolation-zooey-deschanel.png'],
    ['Dakota Johnson', 'https://instagram.com/dakotajohnson', 'assets/consolation-dakota-johnson.png'],
    ['Anne Hathaway', 'https://instagram.com/annehathaway', 'assets/consolation-anne-hathaway.png']
  ];

  function show(s) {
    var parts = [['astrology', s.astro], ['movies', s.movie], ['looks', s.looks], ['height', s.height]];
    var vals = parts.map(function (p) { return p[1]; }).filter(function (v) { return v != null; });
    var agg = Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, vals.length));
    var eligible = agg >= 70;
    var el = document.getElementById('stage5');

    el.innerHTML =
      '<header class="shelfHead"><b>FINAL VERDICT</b></header>' +
      '<div class="fAgg"><b>' + agg + '%</b><span>' + (window.Synastry && Synastry.verdictFor ? Synastry.verdictFor(agg) : '') + '</span></div>' +
      '<div class="fRings">' + parts.map(function (p) { return ring(p[0], p[1]); }).join('') + '</div>' +
      (eligible
        ? '<div class="fAction yes pinkTextBox"><b>SHOOT YOUR SHOT 💘</b>' +
          '<span>Anna has pre-approved this holla</span>' +
          '<div class="fLinks">' +
          '<a class="next fBtn" target="_blank" rel="noopener" href="https://www.instagram.com/hard_boiledbabe/">📸 instagram</a>' +
          '<a class="next fBtn" target="_blank" rel="noopener" href="https://x.com/hard_boiledbabe">🐦 twitter</a>' +
          '</div></div>'
        : '<div class="fAction no pinkTextBox"><b>unfortunately, you are not eligible to holla at Anna</b>' +
          '<span>here are some next best things:</span>' +
          '<div class="fCelebs">' + CONSOLATION.map(function (c) {
            return '<a target="_blank" rel="noopener" href="' + c[1] + '">' +
              '<img src="' + c[2] + '" alt="" loading="lazy">' +
              '<span>' + c[0] + '</span></a>';
          }).join('') + '</div></div>');

    // let the rings paint empty first so the fill animates in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.querySelectorAll('.fFill').forEach(function (f) { f.style.strokeDashoffset = f.dataset.off; });
      });
    });

    var mood = document.querySelector('.moods button[data-img="' + (eligible ? 'starstruck' : 'sad') + '"]');
    if (mood) mood.click();
  }

  window.FinalScreen = { show: show };

  // dev hook: ?final=1&a=72&m=91&l=47&h=64 renders the screen standalone
  var q = new URLSearchParams(location.search);
  if (q.get('final')) {
    document.body.classList.add('s5');
    document.querySelectorAll('.map .node').forEach(function (n, i) {
      n.classList.toggle('active', i === 4);
      n.classList.toggle('done', i < 4);
    });
    show({ astro: +q.get('a') || 72, movie: +q.get('m') || 91, looks: +q.get('l') || 47, height: +q.get('h') || 64 });
  }
})();
