/* Looks Match AI judge: sends the captured photo to the Claude API (Opus 5,
   vision) and gets back a real conventional-attractiveness verdict in the
   same result shape as assets/looks.js — {score, matched, verdictLine,
   flags, stats}. survey.js falls back to the local pixel heuristic when no
   API key is set, the network fails, or the model declines.

   The API key is asked for once and kept in localStorage — fine for this
   local personal app, but NEVER ship this pattern on a public site (anyone
   could read the key). If this deploys, move the call to a tiny server. */
var LooksAI = (function () {
  'use strict';

  var KEY_STORAGE = 'annaAnthropicKey';
  var MODEL = 'claude-haiku-4-5';

  function getKey() {
    // config.local.js (gitignored) wins; localStorage is the fallback
    if (window.ANNA_ANTHROPIC_KEY) return window.ANNA_ANTHROPIC_KEY;
    try { return localStorage.getItem(KEY_STORAGE) || ''; } catch (e) { return ''; }
  }

  // No more paste-a-key dialog: local dev gets the key from config.local.js,
  // the deployed site goes through /api/judge (key lives in a Vercel env var).
  function ensureKey() { return getKey(); }

  // Always worth trying — a failed attempt falls back to the pixel judge
  function ready() { return true; }

  // Downscale + JPEG so a phone photo doesn't cost 4k image tokens
  function toBase64Jpeg(img) {
    var MAX = 768;
    var scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85).split(',')[1];
  }

  var SCHEMA = {
    type: 'object',
    properties: {
      score: { type: 'integer' },
      matched: { type: 'boolean' },
      verdictLine: { type: 'string' },
      flags: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            pts: { type: 'integer' },
            good: { type: 'boolean' }
          },
          required: ['text', 'pts', 'good'],
          additionalProperties: false
        }
      }
    },
    required: ['score', 'matched', 'verdictLine', 'flags'],
    additionalProperties: false
  };

  var SYSTEM = [
    'You are the judging engine for "Astrological Anna", a satirical dating mini-game.',
    'The player uploads their own photo, consenting to a playful rating: Anna — a fictional, picky, theatrical character — decides whether they are "looks matched" with her.',
    '',
    'Judge PRIMARILY conventional attractiveness: does this person read as conventionally good-looking or handsome, the way a casting director would call someone classically attractive? Be generous with genuinely attractive people of every ethnicity, complexion, hair color, and style — for calibration, people like Matty Healy, ASAP Rocky, young Brad Pitt, Jude Bellingham, Michael B. Jordan, Johnny Depp, or George Clooney would all clearly match.',
    '',
    'Secondarily, Anna has a slight private preference for longer, curlier, darker hair. Apply it only as a small nudge (at most ±5 points), never as a disqualifier — a genuinely attractive person matches regardless of hair.',
    '',
    'Scoring: 0–100 integer; "matched" is true when score >= 62. Calibrate: clearly conventionally attractive → 72–95; pleasant but ordinary → 45–61; only genuinely unflattering photos land below 45. If no human face is clearly visible: score 25, matched false, verdictLine "Anna couldn\'t even find a face in this photo".',
    '',
    'verdictLine: ONE short you-vs-Anna league line, e.g. "somehow more attractive than Anna. she\'s rattled." / "attractiveness: evenly matched. Anna accepts." / "Anna is slightly out of your league" / "Anna is, respectfully, way out of your league".',
    '',
    'flags: 2–4 short playful items {text, pts, good} whose pts roughly sum to score minus 50. STRICT RULE for all output text: never mention or allude to skin tone, ethnicity, hair color or texture, eye color, weight, age, or any specific physical feature. Keep praise and dings abstract and funny — "conventionally handsome — the jury didn\'t even deliberate", "bonus points Anna refuses to explain", "the camera caught an angle Anna couldn\'t unsee", "photogenic — this photo has production value". Be playful and warm, never cruel; the joke is Anna\'s pickiness, not the player\'s face.'
  ].join('\n');

  // img: a loaded <img>. Resolves to the Looks-shaped result; rejects on any
  // failure (missing key, network, refusal, bad JSON) so the caller can fall
  // back to the local heuristic. With no local key (the deployed site), the
  // photo goes to our own /api/judge function, which holds the key server-side.
  function analyze(img) {
    var key = getKey();
    if (!key) return analyzeViaApi(img);
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        // no `effort` — Haiku 4.5 rejects it (Opus/Sonnet-tier parameter)
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: toBase64Jpeg(img) } },
            { type: 'text', text: 'Judge this photo for the looks match stage.' }
          ]
        }]
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('api ' + r.status);
      return r.json();
    }).then(function (j) {
      if (j.stop_reason === 'refusal') throw new Error('model declined');
      var text = (j.content || []).filter(function (b) { return b.type === 'text'; })
        .map(function (b) { return b.text; }).join('');
      var out = JSON.parse(text);
      var score = Math.max(1, Math.min(100, Math.round(out.score)));
      return {
        score: score,
        matched: !!out.matched,
        verdictLine: out.verdictLine || 'Anna is deliberating in silence',
        flags: (out.flags || []).slice(0, 4),
        stats: { ai: true, model: MODEL }
      };
    });
  }

  // Deployed path: POST the photo to the Vercel function (api/judge.js)
  function analyzeViaApi(img) {
    return fetch('/api/judge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: toBase64Jpeg(img) })
    }).then(function (r) {
      if (!r.ok) throw new Error('judge api ' + r.status);
      return r.json();
    });
  }

  function forgetKey() {
    try {
      localStorage.removeItem(KEY_STORAGE);
      localStorage.removeItem(KEY_STORAGE + ':declined');
    } catch (e) {}
  }

  return { analyze: analyze, ready: ready, ensureKey: ensureKey, forgetKey: forgetKey };
})();
