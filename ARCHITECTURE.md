# How Astrological Anna works

Context doc for the whole app: the five-stage flow, the four scoring engines, the
reaction system, and the deployment. Read this before changing anything — several
parts look independent but are wired together through shared state.

Companion docs: [README.md](README.md) (what it is + file map),
[SYNASTRY-NOTES.md](SYNASTRY-NOTES.md) (every astrology weight and orb),
[PROTOTYPE-NOTES.md](PROTOTYPE-NOTES.md) (the original Codex voice session).

---

## The shape of it

A **static site with no build step** — plain HTML/CSS/ES5-flavored JS, plus one
serverless function for the AI judge. There is no framework, no bundler, no
package.json to install. That's deliberate: it deploys as files and stays
editable in a single pass.

```
index.html    landing page  ──▶  survey.html  ──▶  five stages, one running score
                                      │
                                      ├── js/survey.js   stages 1–4 + all wiring
                                      ├── js/final.js    stage 5 (standalone module)
                                      ├── assets/*.js    the scoring engines
                                      └── api/judge.js   AI looks judge (Vercel only)
```

`survey.html` holds **all five stages in the DOM at once**. Only one is visible:
`goStage(n)` toggles a `body.s2` / `s3` / `s4` / `s5` class and CSS shows the
matching `<section>`. There's no router and no page navigation between stages —
which is why state survives when you jump backward via the level-map nodes.

### Running it

```bash
cd astrological-anna-dating-app
python3 -m http.server 4173   # http://localhost:4173
```

`file://` mostly works but the camera won't (browsers require a secure context —
`localhost` counts, `file://` doesn't). Live at **https://astrological-anna.vercel.app**.

---

## The five stages, and how the score compounds

Each stage produces **its own 0–100 score** for its reveal ring, and also
contributes a modifier to a **cumulative compatibility number** carried forward
for the final verdict. Those are two different numbers and mixing them up is the
easiest bug to introduce here.

| # | Stage | Engine | Its own score | What it folds into the total |
|---|---|---|---|---|
| 1 | astrology | `assets/synastry.js` | full synastry % | the base number |
| 2 | movie test | `assets/taste.js` | `moviePercent()` | `±25` taste modifier |
| 3 | looks match | `api/judge.js` → AI, else `assets/looks.js` | the looks score | `±18`, scaled from the score |
| 4 | height check | `heightFlag()` in survey.js | `heightPercent()` | the height flag's points |
| 5 | final | `js/final.js` | aggregate of all four | — |

The chain of result objects is `synastryResult → tasteResult → looksResult →
heightResult`, each built by a `withX(base)` function that takes the previous
one and returns a new object with an adjusted `percent` plus merged
green/red flags. **Each stage's NEXT reads the latest available result**
(`looksResult || tasteResult || synastryResult`), so skipping a stage degrades
gracefully instead of throwing.

`playReveal()` is the shared between-stage flash: animated ring, counting
percentage, optional label and punchline, then it calls an `after` callback to
switch stages underneath the flash. Stage 1 passes its verdict text so the age
gate's "absolutely not" has time to read; the others just pass a label.

### The age gate

A birth year under 18 years ago produces `percent: 0` and every `withX()`
function early-returns unchanged — movies, looks, and height cannot rescue a 0.

That path is deliberately **not** treated as a normal low score. Showing a
minor a full chart-compatibility report reads wrong, so stage 1 diverges: the
0% ring plays with the verdict line under it (*"You are a teenager. The
universe (and the law) said absolutely not."*), the flash lingers ~2.5s longer
so it can be read, and then it fades back to the birth form. No report modal,
no stage 2, and the ⓘ escape hatch that normally reveals the full synastry
breakdown **stays hidden for this case**. Pressing NEXT again just replays the
0% — since the downstream scorers also refuse to lift a zero, the gate has no
side door.

---

## Stage 3: Looks Match — two judges

The interesting part of the app. It answers "is this person conventionally
attractive, and are they in Anna's league" — and it does that **twice**, with a
fallback.

### The capture step

Two explicit buttons, because the earlier auto-start version made the browser's
camera-permission dialog appear over text that said "upload":

- **📷 take a photo** → asks for the camera *only then*, shows a live mirrored
  feed, and CAPTURE runs a 3-2-1 countdown + white flash before freezing the
  frame (mirror preserved, so you get the pose you saw).
- **🖼 upload one** → file picker; the photo previews in the frame.

If the camera is denied or missing, the heading swaps to "camera said no 💔
upload one instead" and the upload path carries on. The camera stream is
released whenever you leave stage 3 (`stopBooth()` in `goStage`), so the
recording light doesn't stay on.

Background removal for the polaroid uses **MediaPipe selfie segmentation**,
vendored under `assets/mediapipe/` so it runs offline with no CDN dependency.

### Judge 1 (primary): Claude vision

- **Deployed:** the browser POSTs the photo to `/api/judge` (`api/judge.js`),
  which holds the API key as a Vercel env var. The key never reaches a browser.
- **Local dev:** `assets/looks-ai.js` calls the Anthropic API directly, reading
  the key from `config.local.js` — a **gitignored and vercelignored** file. That
  shortcut is fine on your own machine and must never ship.

Both paths use **`claude-haiku-4-5`** with a strict JSON schema, and the photo is
downscaled to a 768px JPEG first to keep image tokens (and cost) low. Two gotchas
baked in from experience: Haiku **rejects the `effort` parameter** (Opus/Sonnet
only — sending it 400s every request), and `stop_reason: "refusal"` arrives as a
successful HTTP 200, so it's checked explicitly rather than assumed.

The prompt is the actual product here, and it encodes three rules:

1. **Conventional attractiveness dominates.** The system prompt names real
   calibration examples (Matty Healy, ASAP Rocky, young Brad Pitt, Jude
   Bellingham, Michael B. Jordan, Johnny Depp, Clooney) precisely because they
   span every complexion and hair color — the pixel heuristic used to fail
   people like this, which is why the AI judge exists at all.
2. **Personal taste is a small silent nudge**, capped at ±5 and never a
   disqualifier.
3. **No output text may reference any physical feature** — skin tone, ethnicity,
   hair, eyes, weight, age. Flags stay abstract and funny ("bonus points Anna
   refuses to explain"). The joke is Anna's pickiness, never the player's face.

It returns `{score, matched, verdictLine, flags, stats}`. `matched` is true at
62+. `verdictLine` is you-vs-Anna league talk rather than a feature checklist.

### Judge 2 (fallback): local pixel math

`assets/looks.js` is canvas pixel math — skin-tone detection to find a face box,
then mirrored-luminance symmetry, complexion, hair and eye darkness, contrast.
It **always runs**, for two reasons:

1. It produces the **face bounding box** that the polaroid cutout and the stage-4
   standee head both crop from. The AI result borrows that box.
2. It's the automatic fallback when there's no key, the network fails, or the
   model declines.

Its scoring mirrors the AI's philosophy (symmetry −14…+26 dominant, taste
collapsed into one unexplained ±modifier, handsome override waiving deductions),
but it fundamentally cannot recognize a handsome face. **Treat it as a graceful
degradation path, not a second opinion.** It's verified by a synthetic-face
harness — symmetric dark-featured face passes, symmetric blonde passes via the
override, asymmetric fails, no-face fails.

The loading bar ("running the league calculator…") is theater with a real job:
it holds on "anna is deliberating…" until the AI promise resolves, so a slow
call looks intentional rather than frozen.

---

## Reactions: emotions + animations

Two beta panels drive Anna's expression (9 PNG variants) and a background FX
layer (`#fx`: hearts, boom, fire, waterfall, shooting stars — all CSS, no
images). They started as manual dev toggles and are now **automated**.

The automation deliberately **clicks the panel buttons** rather than
manipulating state directly:

```js
setMood('disgusted');   // clicks .moods button[data-img="disgusted"]
setEffect('fire');      // clicks .anims button[data-fx="fire"]
```

That keeps one code path for manual and automatic triggering. **This is why the
panels are hidden with CSS rather than removed from the DOM** — the buttons must
still exist in production for reactions to work.

- **Production hiding:** JS adds `body.prod` when the hostname isn't
  localhost/127.0.0.1; `body.prod .betas { display: none }` hides both panels.
  On localhost you keep the dev tools.
- **Ambient per stage** (`STAGE_FX`): waterfall on astrology, nothing on the
  movie and looks stages (posters and photobooth need visual quiet), shooting
  stars on height and final. Applied on every `goStage`, which doubles as
  cleanup for the previous stage's reaction.
- **Reveal reactions:** any score ≥70 → hearts. Movie score under 40 → Anna
  goes **disgusted** and the screen catches fire. Typing a normie favorite
  triggers that disgust instantly, before the reveal.
- **Ordering matters:** the reaction effect is applied *after* the reveal's
  stage switch (in the same timeout that hides the flash), so hearts survive
  into the next stage instead of being wiped by the new stage's ambient.

Anna's default mood still follows the score via `moodFor()` — love ≥70, neutral
40–69, sad 20–39, scared below — unless a reveal passes an explicit override.

---

## Deployment

Vercel project **dangertesting/astrological-anna**, aliased to
`astrological-anna.vercel.app`. Static files plus one function; builds take
~10 seconds because there's nothing to build.

```bash
vercel deploy --prod --scope dangertesting
```

Key handling, which is the part worth getting right:

| Thing | Where it lives | Committed? | Deployed? |
|---|---|---|---|
| `config.local.js` | your machine only | no (gitignored) | no (`.vercelignore`) |
| `ANTHROPIC_API_KEY` | Vercel env var, encrypted | n/a | server-side only |

Verified after deploy: `/config.local.js` returns **404** in production, and
`/api/judge` answers a POSTed test image with a real verdict. Both are worth
re-checking after any deploy that touches the judge.

**GitHub is connected**, so pushes to `main` auto-deploy. A CLI deploy ships
your local files; a git push ships committed files. If those diverge, the last
one wins — keep them in sync.

---

## Dev hooks

| Hook | Does |
|---|---|
| `?stage=N` | jump straight to a stage |
| `?test=1` | auto-fill birth details and click NEXT |
| `&movies=N` | mark N shelf posters seen, run stage 2 |
| `&year=YYYY` | override the test birth year (age-gate testing) |
| `#love`, `#fire`, … | preselect a mood or effect |
| 🎲 randomize | fills the whole birth card from 14 real cities with lat/lon/tz |
| `?v=` on script tags | cache-busters — bump when a fix "doesn't take" |
| `LooksAI.forgetKey()` | clears a bad key from localStorage |

---

## Production considerations

**Cost.** Only the AI judge costs money — well under a cent per capture on
Haiku 4.5 (it was 2–5¢ on Opus 5 before the swap; `MODEL` at the top of both
`api/judge.js` and `assets/looks-ai.js` is a one-line change either way).
`/api/judge` is **public and unrate-limited**, so a bot could run up credits —
a spend limit in the Anthropic Console is the real backstop.

**Mobile performance — the big one.** The emotion PNGs are enormous:
`portrait.png` 6.5MB, `portrait-cutout.png` 4.5MB, and each of the nine
expression variants ~1.8MB. First load pulls several megabytes before Anna
appears, and each first mood swap stutters. **Resizing to display dimensions
and converting to WebP would cut ~90%** and is the highest-impact fix
outstanding. Everything else is cheap: `stars.mp4` is 200KB, posters 3MB total,
the FX layer is pure CSS.

**Privacy.** With the AI judge, photos go to the Anthropic API (not stored by
the app, not used for training). The fallback pixel judge is fully local. Worth
a line of on-page disclosure if strangers use it.

**Gaps.** No analytics — you can't tell if anyone's using it (`vercel logs`
shows judge calls meanwhile). No rate limiting. The synastry weights, taste
lists, and looks thresholds are all hand-tuned for comedy, not accuracy — which
is the point, but means "wrong" verdicts are usually a tuning question, not a bug.
