/* Looks Match: fully client-side "attractiveness" heuristics for stage 3.
   Same energy as synastry.js — hand-rolled, tuned for fun, zero science
   certification. No photo ever leaves the browser: everything is canvas
   pixel math on a downscaled copy.

   How it "sees":
   - Skin pixels found via the classic YCbCr rule (Cb 77-127, Cr 133-173);
     their 10th-90th percentile bounding box is treated as the face.
   - Hair = the band above the face box; eyes = the darkest pixels in the
     upper-middle of the face box; complexion = mean skin luminance;
     symmetry = mean |left - right| luminance mirrored across the face box.

   Anna's type (the weights): symmetrical/handsome first, darker complexion,
   dark hair, dark eyes. Blonde/light-eyed costs points — UNLESS the symmetry
   score is top-tier, in which case the handsome override waives penalties. */
var Looks = (function () {
  'use strict';

  var MATCH_AT = 62; // base 50 ± feature points; Anna is picky

  function luma(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

  function isSkin(r, g, b) {
    var cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    var cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
  }

  function percentile(sorted, p) {
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  }

  // img: a loaded <img>. Returns {score, matched, flags:[{text,pts,good}], stats}
  function analyze(img) {
    var W = 160;
    var H = Math.max(1, Math.round(img.naturalHeight * (W / img.naturalWidth)));
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    var d = ctx.getImageData(0, 0, W, H).data;

    function px(x, y) { var i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; }

    // -- find the face: skin-pixel cloud, trimmed to its 10-90th percentiles --
    var xs = [], ys = [], skinL = [], allL = [];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var p = px(x, y), L = luma(p[0], p[1], p[2]);
        allL.push(L);
        if (isSkin(p[0], p[1], p[2])) { xs.push(x); ys.push(y); skinL.push(L); }
      }
    }

    if (skinL.length < W * H * 0.02) {
      return {
        score: 25, matched: false,
        flags: [{ text: 'Anna couldn’t even find a face in this photo', pts: -25, good: false }],
        stats: { noFace: true }
      };
    }

    xs.sort(function (a, b) { return a - b; });
    ys.sort(function (a, b) { return a - b; });
    var fx0 = percentile(xs, 0.10), fx1 = percentile(xs, 0.90);
    var fy0 = percentile(ys, 0.10), fy1 = percentile(ys, 0.90);
    var fw = Math.max(8, fx1 - fx0), fh = Math.max(8, fy1 - fy0);

    // -- complexion: mean skin luminance (darker = more Anna's type) --
    var skinLuma = skinL.reduce(function (a, b) { return a + b; }, 0) / skinL.length;

    // -- hair: strip covering just above + the top of the face box. Both dark
    //    and blonde hair often pass the skin rule and merge INTO the box, so
    //    the box top is usually hair; taking the darkest 40% of the strip
    //    keeps sky behind the head from washing out the reading. --
    var hy0 = Math.max(0, Math.round(fy0 - fh * 0.25));
    var hy1 = Math.min(H - 1, Math.round(fy0 + fh * 0.3));
    var hx0 = Math.round(fx0 + fw * 0.15), hx1 = Math.round(fx1 - fw * 0.15);
    var hL = [];
    for (y = hy0; y < hy1; y++) {
      for (x = hx0; x <= hx1; x++) { p = px(x, y); hL.push(luma(p[0], p[1], p[2])); }
    }
    hL.sort(function (a, b) { return a - b; });
    var hairN = Math.ceil(hL.length * 0.4);
    var hairLuma = hL.length > 50
      ? hL.slice(0, hairN).reduce(function (a, b) { return a + b; }, 0) / hairN
      : null;

    // -- eyes: darkest 15% of the upper-middle face band --
    var eL = [];
    for (y = Math.round(fy0 + fh * 0.3); y < fy0 + fh * 0.6; y++) {
      for (x = fx0; x <= fx1; x++) { p = px(x, y); eL.push(luma(p[0], p[1], p[2])); }
    }
    eL.sort(function (a, b) { return a - b; });
    var eyeLuma = eL.length > 20
      ? eL.slice(0, Math.ceil(eL.length * 0.15)).reduce(function (a, b) { return a + b; }, 0) / Math.ceil(eL.length * 0.15)
      : null;

    // -- symmetry: mirrored luminance difference across the face box --
    var diffSum = 0, diffN = 0;
    for (y = fy0; y <= fy1; y++) {
      for (x = fx0; x <= fx0 + Math.floor(fw / 2); x++) {
        var a = px(x, y), b = px(fx1 - (x - fx0), y);
        diffSum += Math.abs(luma(a[0], a[1], a[2]) - luma(b[0], b[1], b[2]));
        diffN++;
      }
    }
    var symScore = Math.max(0, Math.min(1, (48 - diffSum / diffN) / 40)); // 0..1

    // -- photogenic-ness: overall contrast as a stand-in for a good photo --
    var mean = allL.reduce(function (a, b) { return a + b; }, 0) / allL.length;
    var sd = Math.sqrt(allL.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / allL.length);

    // -- Anna's scoring: base 50, features push it around --
    var flags = [], score = 50;
    var handsome = symScore >= 0.72; // the override: too handsome to penalize

    var symPts = Math.round(symScore * 16);
    score += symPts;
    if (symScore >= 0.72) flags.push({ text: 'genuinely symmetrical face — Anna noticed immediately', pts: symPts, good: true });
    else if (symScore >= 0.45) flags.push({ text: 'face is acceptably symmetrical', pts: symPts, good: true });
    else flags.push({ text: 'the two halves of this face are having an argument', pts: symPts, good: false });

    var tonePts = skinLuma < 95 ? 10 : skinLuma < 130 ? 7 : skinLuma < 165 ? 4 : skinLuma < 200 ? 1 : 0;
    score += tonePts;
    if (tonePts >= 7) flags.push({ text: 'darker complexion — exactly Anna’s type', pts: tonePts, good: true });
    else if (tonePts >= 4) flags.push({ text: 'complexion passes the vibe check', pts: tonePts, good: true });

    if (hairLuma !== null) {
      var hairPts = hairLuma < 75 ? 10 : hairLuma < 115 ? 6 : hairLuma < 160 ? 2 : (handsome ? 0 : -8);
      score += hairPts;
      if (hairPts >= 6) flags.push({ text: 'dark hair detected — big points with Anna', pts: hairPts, good: true });
      else if (hairPts < 0) flags.push({ text: 'blonde alert 🚨 Anna does not do blondes', pts: hairPts, good: false });
      else if (hairPts === 0 && hairLuma >= 160) flags.push({ text: 'blonde… but the handsome override waives the penalty', pts: 0, good: true });
    }

    if (eyeLuma !== null) {
      var eyePts = eyeLuma < 65 ? 6 : eyeLuma < 95 ? 3 : eyeLuma > 120 ? (handsome ? 0 : -4) : 1;
      score += eyePts;
      if (eyePts >= 3) flags.push({ text: 'dark eyes — Anna is listening', pts: eyePts, good: true });
      else if (eyePts < 0) flags.push({ text: 'light eyes, and not handsome enough to get away with it', pts: eyePts, good: false });
      else if (eyePts === 0) flags.push({ text: 'light eyes forgiven — that face is doing the heavy lifting', pts: 0, good: true });
    }

    var photoPts = sd > 55 ? 4 : sd > 40 ? 2 : 0;
    score += photoPts;
    if (photoPts === 4) flags.push({ text: 'photogenic — this photo has production value', pts: 4, good: true });

    score = Math.max(1, Math.min(100, Math.round(score)));
    return {
      score: score,
      matched: score >= MATCH_AT,
      flags: flags,
      stats: { skinLuma: Math.round(skinLuma), hairLuma: hairLuma && Math.round(hairLuma), eyeLuma: eyeLuma && Math.round(eyeLuma), symScore: +symScore.toFixed(2), contrast: Math.round(sd) }
    };
  }

  return { analyze: analyze, MATCH_AT: MATCH_AT };
})();
