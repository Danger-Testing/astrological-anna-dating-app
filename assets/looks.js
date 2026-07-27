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

   The weights: conventional attractiveness (symmetry) dominates the score,
   and the verdict is framed as you-vs-Anna league talk. Anna's personal
   taste still nudges the number a little, but it's a small silent modifier —
   the output never says what it measured, and a top-tier symmetry score
   (the handsome override) zeroes out any taste deductions entirely. */
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
        verdictLine: 'Anna couldn’t even find a face in this photo',
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

    // -- scoring: base 50; conventional attractiveness carries the verdict --
    var flags = [], score = 50;
    var handsome = symScore >= 0.72; // the override: too handsome to deduct from

    // symmetry is the main event: -14 (rough) to +26 (jury didn't deliberate)
    var symPts = Math.round((symScore - 0.35) * 40);
    score += symPts;
    if (handsome) flags.push({ text: 'conventionally handsome — the jury didn’t even deliberate', pts: symPts, good: true });
    else if (symScore >= 0.45) flags.push({ text: 'solid bone structure — Anna looked twice', pts: symPts, good: true });
    else flags.push({ text: 'the camera caught an asymmetry Anna couldn’t unsee', pts: symPts, good: false });

    // Anna's taste: a small private nudge. Never itemized, never explained,
    // and any deduction is waived when the face is objectively handsome.
    var taste = skinLuma < 130 ? 4 : skinLuma < 180 ? 2 : 0;
    if (hairLuma !== null) taste += hairLuma < 115 ? 4 : hairLuma < 160 ? 1 : (handsome ? 0 : -4);
    if (eyeLuma !== null) taste += eyeLuma < 95 ? 2 : eyeLuma > 120 ? (handsome ? 0 : -2) : 1;
    taste = Math.max(-6, Math.min(10, taste));
    score += taste;
    if (taste > 4) flags.push({ text: 'bonus points Anna refuses to explain', pts: taste, good: true });
    else if (taste < 0) flags.push({ text: 'points deducted for reasons Anna declines to specify', pts: taste, good: false });

    var photoPts = sd > 55 ? 6 : sd > 40 ? 3 : 0;
    score += photoPts;
    if (photoPts === 6) flags.push({ text: 'photogenic — this photo has production value', pts: 6, good: true });

    score = Math.max(1, Math.min(100, Math.round(score)));
    // the verdict is you-vs-Anna, not a feature checklist
    var verdictLine =
      score >= 82 ? 'somehow more attractive than Anna. she’s rattled.' :
      score >= MATCH_AT ? 'attractiveness: evenly matched. Anna accepts.' :
      score >= 48 ? 'so close — but Anna is slightly out of your league' :
      'Anna is, respectfully, way out of your league';
    return {
      score: score,
      matched: score >= MATCH_AT,
      verdictLine: verdictLine,
      flags: flags,
      stats: {
        skinLuma: Math.round(skinLuma), hairLuma: hairLuma && Math.round(hairLuma), eyeLuma: eyeLuma && Math.round(eyeLuma), symScore: +symScore.toFixed(2), contrast: Math.round(sd),
        // normalized face box (0-1 of the photo) — stage 4 crops the standee head from this
        face: { x0: fx0 / W, x1: fx1 / W, y0: fy0 / H, y1: fy1 / H }
      }
    };
  }

  return { analyze: analyze, MATCH_AT: MATCH_AT };
})();
