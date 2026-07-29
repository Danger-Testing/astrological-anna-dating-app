# How Astrological Anna works

Context doc for the whole app: the five-stage flow, the four scoring engines, the
reaction system, and the deployment. Read this before changing anything — several
parts look independent but are wired together through shared state.

This doc is about **how the running system works**. The companions:

| Doc | Covers |
|---|---|
| [README.md](README.md) | What the app is, the file map, what's left to do |
| [AGENT-NOTES.md](AGENT-NOTES.md) | **Workflows and tooling** — generating Anna's images via the Codex CLI, the cutout/crop scripts, the verification loop, and the multi-agent committing rules |
| [SYNASTRY-NOTES.md](SYNASTRY-NOTES.md) | Every astrology weight, aspect, and orb |
| [PROTOTYPE-NOTES.md](PROTOTYPE-NOTES.md) | The original Codex voice session this grew from |

If you're about to commit, read AGENT-NOTES.md §7 first — several sessions edit
this repo at once and `git add -A` will sweep up their in-flight work.

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

## Stage 2: the movie test

Twelve arthouse posters standing on chrome shelves like Blu-ray cases. Click
one to mark it seen; hover picks it up with a cursor-following 3D tilt, a
gloss highlight tracking the pointer, and a blue spine folded 90° back so it
reads as a physical object rather than a thumbnail.

Posters live in `assets/posters/` (12 files, downscaled to ≤1200px), fetched
from the **IMDb suggestion endpoint**
(`v3.sg.media-imdb.com/suggestion/x/<query>.json`) matched on title + release
year. Note for future asset work: **the iTunes Search API is a dead end for
movies** — it answers HTTP 200 with `resultCount: 0` for every film query,
apparently because Apple emptied that catalog. Wikipedia's API is what the
typed-favorites lookup uses.

Scoring (`assets/taste.js`): each shelf movie seen = +1.5. If you've seen ≤3,
NEXT refuses to advance and demands ≥2 typed favorites instead, classified
against a curated arthouse canon (+7) versus a basic-normie list and franchise
patterns (−9); unknowns score 0. Titles are normalized (lowercase, no
punctuation or diacritics, leading "the" stripped) and **the art list is
checked before the normie patterns**, so Scorsese's *After Hours* never trips
the *After* franchise matcher. The taste modifier is capped at ±25.

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

### Background removal and framing

Background removal uses **MediaPipe selfie segmentation**, vendored under
`assets/mediapipe/` (~6MB, mostly the SIMD WASM binary) so it runs offline
with no CDN dependency. Segmentation starts the instant a photo lands — not on
CAPTURE — so the cutout is usually ready before it's needed. The result,
`lmCut`, is a canvas of the person on transparency.

Everything downstream degrades gracefully: no model means `lmCut` stays null
and the old ellipse crops are used. If the polaroid renders before
segmentation finishes it shows the ellipse and **hot-swaps to the real
silhouette when the mask arrives**.

**Framing is measured from the mask, never from the skin-tone face box.**
`looks.js`'s box is fine for scoring but wrong for framing — a red shirt reads
as skin, the box inflates, and the person renders tiny. So `headMetrics(cut)`
reads the alpha channel instead:

1. Downscale the cutout to ~96px, collect per-row opaque spans.
2. Walk down from the hair. Head width changes gently row to row; shoulders
   arrive as a **sudden widening** (>1.45× the recent median). That jump is
   where the head ends.
3. Return hair-top, near-widest width (85th percentile — hair, not ears), head
   height, and center-x.

The shoulder-jump beats a fixed "head is the top 30%" band because that
assumption breaks on raised arms, hats, and tight headshots.

Two consumers use those metrics, which is why they must stay in sync:

- **The polaroid** (`faceOnWhite`) scales the cutout so the head is ~52% of
  frame width with hair-top at 6% — numbers measured off Anna's real studio
  portrait, so the paired polaroids read as genuinely face-to-face.
- **The stage-4 standee head** (`faceSticker`) crops hair-top to shoulder line
  and nothing below, so only a head lands on the cardboard body.

The sticker cache key includes whether a cutout existed (`src + '#cut'`);
without that, a sticker built before segmentation finished would stick around
forever.

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

## Stage 4: the height check

Two standees on a floor, a dashed line at Anna's height, and a ruler slider.
Anna is **5'2" (`ANNA_IN = 62`)**. Making this read as *true* took three
separate fixes, all of which are load-bearing:

1. **Anna's cutout is sized by its opaque pixels, not its image box.**
   `alphaBounds()` finds the top and bottom of non-transparent pixels, then the
   PNG is stretched so hair-to-shoes spans exactly 62 inches. Without it, the
   transparent padding every PNG cutout carries renders her short of her own
   height line. The laughing/scared variants get re-measured when they swap in,
   since `onload` fires again.
2. **The dashed line is pinned to Anna's rendered head** via
   `getBoundingClientRect()` against the floor — *not* computed from the
   floor's bottom edge, which drifts because the standees' feet don't sit
   exactly on it. Verified by pixel-measuring a screenshot: line at y=301.5,
   hair at y=303 — flush within the line's own thickness.
3. **The head sticker is head-only** (see the framing section above); it used
   to paste in a slab of torso.

Both standees share one pixels-per-inch scale, so the taller one nearly fills
the floor and raising your height visibly shrinks Anna. The proportions are
literally accurate — at 5'9" vs 5'2" they measure 69:62 on screen. It reads
subtle because 7 inches genuinely is only ~10% of a body; that's what it
actually looks like. Anna reacts too: shorter than her → laughing, 6'5"+
(`ANNA_SCARED_AT = 77`) → scared.

---

## Stage 5: final verdict

`js/final.js` renders into `#stage5`: one aggregate ring (average of whichever
stage scores exist) plus a mini ring per test. **≥70 opens the gates** to her
real socials — `instagram.com/hard_boiledbabe` and `x.com/hard_boiledbabe`
(**one** underscore, not two; this shipped wrong once). Below 70 you get the
consolation lineup of celebrity Instagrams instead.

---

## Mobile

`css/mobile.css` is a single `@media (max-width: 700px)` block loaded **after**
every other stylesheet, so it can only override. Desktop rendering is untouched
by design — that was the hard constraint.

**The thesis: Anna is the screen.** She stays large and centered through every
stage so you watch her react while you type, and each stage's controls sit in a
bottom sheet or strip within thumb reach.

The non-obvious parts:

- **She's anchored by the head, not the feet** (`top: 12px; bottom: auto`). A
  bottom-anchored Anna gets her face swallowed by the bottom sheet on short
  screens. Her height is `calc(92dvh - 180px)` so she shrinks *faster* than the
  visible gap does, keeping her eyes above the sheet at any screen height.
- **Stage 1's card becomes a sticky bottom sheet**, capped at 56dvh with 42px
  inputs. Because it's pinned to the bottom, the city autocomplete flips to
  open **upward** (`top: auto; bottom: 100%`).
- **Stage 2's two shelf rows become one horizontal film strip.** The `.shelf`
  wrapper is `display: contents` on desktop (rows stay independent grids) and
  `flex` with scroll-snap on mobile, the rows dissolving into it via
  `display: contents`. Cases are `calc((100vw - 60px) / 3.5)` wide so a
  half-cut poster makes the horizontal scroll discoverable.
- `dvh` with `vh` fallbacks throughout, and `env(safe-area-inset-bottom)` on
  every bottom-anchored element — `viewport-fit=cover` in the viewport meta is
  what makes those insets real.
- **Beta panels are hidden here as well as in prod** — dev tools don't fit a
  phone. Same CSS-only hiding rule, for the same reason: the buttons must stay
  in the DOM for `setMood()`/`setEffect()` to work.

Still open: the Blu-ray pickup tilt is hover-driven, so touch gets
tap-to-select only. A press-tilt would restore the physicality.

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
