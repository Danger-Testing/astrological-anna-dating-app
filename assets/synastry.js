/* Full-chart tropical synastry between a user and Anna.
   Requires astronomy.browser.min.js (global `Astronomy`). */
(function () {
  var ANNA = { y: 1996, mo: 10, d: 19, h: 21, mi: 36, lat: 45.9454, lon: -66.6656, tz: 'America/Moncton', name: 'Anna' };
  var OBLIQUITY = 23.4367 * Math.PI / 180;
  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  var ELEMENTS = ['fire', 'earth', 'air', 'water'];
  var PLANETS = [
    { key: 'Sun', body: 'Sun', w: 4 }, { key: 'Moon', body: 'Moon', w: 4 },
    { key: 'Mercury', body: 'Mercury', w: 2.5 }, { key: 'Venus', body: 'Venus', w: 3.5 },
    { key: 'Mars', body: 'Mars', w: 3 }, { key: 'Jupiter', body: 'Jupiter', w: 2 },
    { key: 'Saturn', body: 'Saturn', w: 2 }, { key: 'Uranus', body: 'Uranus', w: 1 },
    { key: 'Neptune', body: 'Neptune', w: 1 }, { key: 'Pluto', body: 'Pluto', w: 1 }
  ];
  var ASPECTS = [
    { name: 'conjunct', deg: 0, orb: 8, val: 0.9 },
    { name: 'sextile', deg: 60, orb: 4, val: 0.6 },
    { name: 'square', deg: 90, orb: 6, val: -0.8 },
    { name: 'trine', deg: 120, orb: 6, val: 1.0 },
    { name: 'quincunx', deg: 150, orb: 3, val: -0.3 },
    { name: 'opposite', deg: 180, orb: 7, val: -0.55 }
  ];
  var GLOSS = {
    conjunct: 'fused energy', sextile: 'easy chemistry', square: 'friction (the spicy kind)',
    trine: 'effortless flow', quincunx: 'awkward adjustment', opposite: 'magnetic tug-of-war'
  };

  function tzOffsetMin(epochMs, tz) {
    var dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    var p = {};
    dtf.formatToParts(new Date(epochMs)).forEach(function (x) { p[x.type] = x.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
    return (asUTC - epochMs) / 60000;
  }
  function utcFromLocal(b) {
    var guess = Date.UTC(b.y, b.mo - 1, b.d, b.h, b.mi);
    for (var i = 0; i < 3; i++) guess = Date.UTC(b.y, b.mo - 1, b.d, b.h, b.mi) - tzOffsetMin(guess, b.tz) * 60000;
    return new Date(guess);
  }
  function norm(d) { d = d % 360; return d < 0 ? d + 360 : d; }
  function eclipticLon(ra, dec) { // ra hours, dec degrees -> ecliptic-of-date longitude
    var a = ra * 15 * Math.PI / 180, d = dec * Math.PI / 180;
    var lam = Math.atan2(Math.sin(a) * Math.cos(OBLIQUITY) + Math.tan(d) * Math.sin(OBLIQUITY), Math.cos(a));
    return norm(lam * 180 / Math.PI);
  }
  function ascendant(date, lat, lon) {
    var gst = Astronomy.SiderealTime(date); // hours
    var ramc = norm(gst * 15 + lon) * Math.PI / 180;
    var phi = lat * Math.PI / 180;
    var asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(OBLIQUITY) + Math.tan(phi) * Math.sin(OBLIQUITY)));
    asc = norm(asc * 180 / Math.PI);
    var mc = norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(OBLIQUITY)) * 180 / Math.PI);
    if (norm(asc - mc) > 180) asc = norm(asc + 180); // asc must lie east of MC
    return asc;
  }
  function chart(b) {
    var date = utcFromLocal(b);
    var obs = new Astronomy.Observer(b.lat, b.lon, 0);
    var points = {};
    PLANETS.forEach(function (p) {
      var eq = Astronomy.Equator(Astronomy.Body[p.body], date, obs, true, true);
      points[p.key] = eclipticLon(eq.ra, eq.dec);
    });
    points.Ascendant = ascendant(date, b.lat, b.lon);
    return { points: points, date: date };
  }
  function sign(lon) { return SIGNS[Math.floor(norm(lon) / 30)]; }
  function element(lon) { return ELEMENTS[Math.floor(norm(lon) / 30) % 4]; }
  function sep(a, b) { var d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; }

  function synastry(user) {
    var cu = chart(user), ca = chart(ANNA);
    var all = PLANETS.map(function (p) { return { key: p.key, w: p.w }; }).concat([{ key: 'Ascendant', w: 3 }]);
    var found = [], score = 0;
    all.forEach(function (pu) {
      all.forEach(function (pa) {
        var d = sep(cu.points[pu.key], ca.points[pa.key]);
        ASPECTS.forEach(function (asp) {
          var off = Math.abs(d - asp.deg);
          if (off <= asp.orb) {
            var tight = 1 - off / asp.orb * 0.5;
            var pts = asp.val * pu.w * pa.w * tight;
            score += pts;
            found.push({ text: 'Your ' + pu.key + ' ' + asp.name + " Anna's " + pa.key + ' — ' + GLOSS[asp.name], pts: Math.round(pts * 10) / 10, good: asp.val > 0 });
          }
        });
      });
    });
    var aspectCount = found.length;
    // chart-level modifiers (see SYNASTRY-NOTES.md): Anna is an air-sign
    // loyalist — air placements score up, heavy water scores down, and
    // Moon/Venus/Mars sign chemistry is weighted on top of the aspects.
    var mods = [];
    var airN = 0, waterN = 0, airW = 0, waterW = 0;
    all.forEach(function (p) { // weighted: a water Sun drags far more than Pluto in a water sign
      var e = Math.floor(norm(cu.points[p.key]) / 30) % 4;
      if (e === 2) { airN++; airW += p.w; }
      if (e === 3) { waterN++; waterW += p.w; }
    });
    if (airN) mods.push({ text: airN + ' of your 11 placements are in air signs — Anna’s native element', pts: airW * 1.4, good: true });
    if (waterN) mods.push({ text: waterN + ' of your 11 placements are in water signs — heavy water drowns Anna’s air', pts: -waterW * 1.4, good: false });
    function feeds(a, b) { return (a === 'fire' && b === 'air') || (a === 'air' && b === 'fire') || (a === 'earth' && b === 'water') || (a === 'water' && b === 'earth'); }
    ['Moon', 'Venus', 'Mars'].forEach(function (k) {
      var su = sign(cu.points[k]), sa = sign(ca.points[k]);
      var eu = element(cu.points[k]), ea = element(ca.points[k]);
      if (su === sa) mods.push({ text: 'Your ' + k + ' and Anna’s ' + k + ' are both in ' + su + ' — matching ' + k + ' signs', pts: 6, good: true });
      else if (eu === ea) mods.push({ text: 'Your ' + k + ' (' + su + ') shares the ' + eu + ' element with Anna’s ' + k + ' (' + sa + ')', pts: 4, good: true });
      else if (feeds(eu, ea)) mods.push({ text: 'Your ' + k + ' (' + su + ', ' + eu + ') feeds Anna’s ' + k + ' (' + sa + ', ' + ea + ')', pts: 3, good: true });
      else mods.push({ text: 'Your ' + k + ' (' + su + ', ' + eu + ') clashes with Anna’s ' + k + ' (' + sa + ', ' + ea + ')', pts: -4, good: false });
    });
    var modSum = mods.reduce(function (s, m) { return s + m.pts; }, 0);
    var raw = 50 + score / 2.2 + modSum;
    var pct = Math.round(50 + (raw - 50) * 1.15); // stretch for more spread
    pct = Math.max(2, Math.min(99, pct));
    mods.forEach(function (m) { m.pts = Math.round(m.pts * 10) / 10; });
    found = found.concat(mods);
    found.sort(function (a, b) { return Math.abs(b.pts) - Math.abs(a.pts); });
    var verdict = pct >= 80 ? 'Anna might actually want to date you.'
      : pct >= 60 ? 'The stars are… intrigued. There is something here.'
      : pct >= 40 ? 'The stars say: mid. Proceed with caution.'
      : pct >= 20 ? 'Venus is fighting for her life here.'
      : 'The universe said absolutely not.';
    function big3(c) { return { sun: sign(c.points.Sun), moon: sign(c.points.Moon), rising: sign(c.points.Ascendant) }; }
    return {
      percent: pct, verdict: verdict,
      green: found.filter(function (f) { return f.good; }).slice(0, 5),
      red: found.filter(function (f) { return !f.good; }).slice(0, 5),
      you: big3(cu), anna: big3(ca),
      aspectCount: aspectCount
    };
  }
  window.Synastry = { compute: synastry, ANNA: ANNA };
})();
