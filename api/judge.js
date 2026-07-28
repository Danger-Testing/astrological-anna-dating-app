/* Vercel serverless function: the deployed site's looks-match judge.
   Holds ANTHROPIC_API_KEY as a server env var so the key never ships to
   browsers. Accepts {image: <base64 jpeg>} and returns the same result
   shape as assets/looks-ai.js produces client-side. */

const MODEL = 'claude-haiku-4-5';

const SCHEMA = {
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

const SYSTEM = [
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  const image = req.body && req.body.image;
  if (!image || typeof image !== 'string' || image.length > 2_000_000) {
    return res.status(400).json({ error: 'missing or oversized image' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'judge not configured' });
  }

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
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
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: 'Judge this photo for the looks match stage.' }
        ]
      }]
    })
  });

  if (!r.ok) {
    return res.status(502).json({ error: 'api ' + r.status });
  }
  const j = await r.json();
  if (j.stop_reason === 'refusal') {
    return res.status(502).json({ error: 'model declined' });
  }
  try {
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const out = JSON.parse(text);
    return res.status(200).json({
      score: Math.max(1, Math.min(100, Math.round(out.score))),
      matched: !!out.matched,
      verdictLine: out.verdictLine || 'Anna is deliberating in silence',
      flags: (out.flags || []).slice(0, 4),
      stats: { ai: true, model: MODEL }
    });
  } catch (e) {
    return res.status(502).json({ error: 'bad judge output' });
  }
};
