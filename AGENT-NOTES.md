# Agent Notes — how this project is actually built

Written for the next agent picking this up cold. `README.md` says *what* the app
is, `ARCHITECTURE.md` explains *how it runs* (stage flow, the two looks judges,
reactions, deployment), and `SYNASTRY-NOTES.md` documents the scoring math.
**This file is the missing fourth piece: the workflows, tooling, and hard-won
gotchas** — how Anna's images get generated, how work gets verified, and the
traps that already burned an agent once. Don't re-derive these; they cost real
time and credits to learn.

Everything here was verified on this machine (macOS, Safari, no build step).

---

## 1. Generating Anna's images with the local Codex CLI

Every Anna expression (`assets/love.png`, `angry.png`, `smug.png`, …) was
generated with the **Codex CLI that ships inside the Codex desktop app**. It has
image generation built in and runs on the user's existing Codex login — **no API
key needed**.

**The binary is not on PATH.** Use the full path:

```
/Applications/Codex.app/Contents/Resources/codex
```

(Confirmed working: `codex-cli 0.146.0-alpha.3.1`.)

### The invocation that works

```bash
cd /tmp/anna-emotions                      # a scratch dir with reference.png in it
/Applications/Codex.app/Contents/Resources/codex exec \
  --skip-git-repo-check \
  -s workspace-write \
  -i reference.png \
  - < prompt.txt
```

| Flag | Why |
|---|---|
| `exec` | non-interactive: run one prompt, do the work, exit |
| `--skip-git-repo-check` | required when the cwd isn't a git repo |
| `-s workspace-write` | sandbox policy that lets it save files into the cwd |
| `-i reference.png` | attach a reference image to the prompt |
| `- < prompt.txt` | **read the prompt from stdin** — see the gotcha below |

### ⚠️ THE GOTCHA THAT LOSES AGENTS

`-i` is **variadic** (it accepts multiple filenames). If you pass the prompt as a
plain trailing argument after `-i`, **`-i` swallows the prompt string as a
filename**, Codex then reads an empty prompt from stdin, prints
`No prompt provided via stdin.`, and exits having done nothing. Exit code is 0,
so it looks like success.

```bash
# ✗ BROKEN — silently does nothing
codex exec -i reference.png "generate four expressions..."

# ✓ WORKS — pass `-` and pipe the prompt via stdin
codex exec -i reference.png - < prompt.txt
```

This exact failure is what happened on the first attempt, and it's what left
another agent "lost" until the pattern was written down.

### Prompting it (treat Codex as an agent, not an image API)

Tell it that it *has* an image tool, describe the reference, describe each
output, and **name the exact output filenames**. The working template:

```
You have an image generation tool. The attached reference.png (also in this
directory) is 'Anna' — a photorealistic head-and-shoulders portrait,
front-facing, dark purple hair with bangs, blue eyes, black off-shoulder top,
plain white background. Generate FOUR expression variants of this exact same
woman — same identity, same framing, same hair, same black off-shoulder top,
same plain white background, photorealistic:
1. smug-raw.png — one eyebrow raised, knowing sideways smirk, quietly judging you
2. laughing-raw.png — head tipped back, eyes squeezed shut, huge open laugh
3. disgusted-raw.png — recoiling "ew" face, nose scrunched, upper lip curled
4. starstruck-raw.png — awestruck, huge sparkling wide eyes, amazed open smile
Save each file at exactly those names in the current working directory. Do not
create any other files. If your image tool returns files with other names,
rename them to match.
```

Details that materially improve results:

- **Put `reference.png` in the cwd *and* attach it with `-i`.** Codex then does
  identity-preserving *edits* of it rather than generating a new person.
- **Restate the invariants** every time ("same identity, same framing, same
  black off-shoulder top, same plain white background") or she drifts.
- **Name files with a `-raw` suffix.** Codex output is opaque/white-background;
  `-raw` marks "not yet cut out" so the pipeline stays obvious.
- **Ask for no extra files**, or it leaves intermediates around.

### Practicalities

- A 4-image run takes a few minutes → **run it in the background** and check
  after. The tail of stdout is Codex's final message listing what it created.
- Costs the user's Codex credits (~40–55k tokens per 4-image run). **If
  generation dies, check the balance before debugging the command** — this
  happened twice and both times it was funds, not code.
- Sessions log to `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`; generated
  images also land under `~/.codex/generated_images/<session-id>/` if you need
  to recover them.
- Regenerating a whole set is cheap and safe — that's how the entire emotion
  set got remade when Anna's face was replaced. Don't hand-patch faces.

---

## 2. Post-processing: transparent cutouts (all local, no network)

Codex returns images on a **white background**. The site needs transparent
cutouts. Two committed tools do this:

### `tools/cutout.swift` — background removal

Uses macOS Vision (`VNGenerateForegroundInstanceMaskRequest`) + CoreImage
`CIBlendWithMask`. Runs offline, needs no packages, works on macOS 14+.

```bash
swift tools/cutout.swift input-raw.png output.png
```

Full pipeline for a new expression set:

```bash
cd assets
for e in smug laughing disgusted starstruck; do
  swift ../tools/cutout.swift /tmp/anna-emotions/$e-raw.png $e.png
done
```

Verify with `sips -g hasAlpha -g pixelWidth -g pixelHeight file.png`.
**Note:** when you view a cutout in an image previewer it may *look* like it has
a black or white background — that's the renderer compositing it. Check
`hasAlpha` / sample a corner pixel's alpha instead of trusting your eyes.

### `tools/crop.swift` — crop a region out (top-left origin coords)

```bash
swift tools/crop.swift in.png out.png <x> <yTop> <w> <h>
```

### Extracting the steam (the `angry` special case)

`angry.png` originally had comic steam **baked in and overlapping her hair**, so
a rectangular crop dragged hair along with it. What worked:

1. Regenerate the angry face **with no steam at all** (explicitly: "absolutely
   NO steam, NO smoke, NO clouds, NO comic effects").
2. Extract the steam from the *old* baked-in image by **luminance masking** —
   bright steam pixels survive, dark hair pixels drop out — via Pillow:

```python
from PIL import Image, ImageChops
im = Image.open('angry-old.png').convert('RGBA')
crop = im.crop(box)
lum  = crop.convert('L')
ramp = lum.point(lambda v: 0 if v < 90 else (255 if v > 190 else int((v-90)*255/100)))
crop.putalpha(ImageChops.multiply(crop.getchannel('A'), ramp))
crop.crop(crop.getbbox()).save('steam-left.png')
```

3. Overlay `steam-left.png` / `steam-right.png` on the avatar and animate them
   with CSS (see `.sL` / `.sR` in `css/survey.css`), shown only when `.avatar`
   has `.angry`.

**Bug worth remembering:** a global `.avatar img { height: 100% }` rule stretched
the steam sprites into invisible full-height columns and centered the smoke
inside them — so the steam appeared to blast out of her *arms*. Fixed with
`.avatar img.steam { height: auto; object-fit: unset }`. If a positioned overlay
lands somewhere baffling, check for an inherited sizing rule first.

---

## 3. The verification loop (how to actually see your work)

There is **no build step**. Serve statically and drive Safari:

```bash
cd "/Users/carlostmayers/app danger/astrological-anna-dating-app"
python3 -m http.server 3001
```

Navigate the existing tab and screenshot **just the Safari window**:

```bash
osascript -e 'tell application "Safari" to set URL of current tab of front window to "http://localhost:3001/survey.html?stage=4"'
sleep 2.5
WID=$(osascript -e 'tell application "Safari" to id of front window')
screencapture -x -o -l "$WID" /tmp/shot.png
```

Then `Read` the PNG. Hard-won details:

- **Re-fetch the window ID every time.** It goes stale (`could not create image
  from window`) and a stale `-l` silently captures the wrong window — that
  produced two screenshots of an unrelated browser page mid-session.
- **Safari caches aggressively.** Append a throwaway `?v=N` (bump it each time)
  or a fix will look like it "didn't take." Multiple rounds were wasted staring
  at stale CSS.
- Screenshot at a moment that proves the thing: reveals auto-dismiss in ~2.1s,
  so time the `sleep` to land mid-animation.
- **Don't tell the user something works because the code looks right.** Every
  visual claim in this project was screenshot-verified, and roughly a third of
  the time the screenshot disagreed with the code.

### Dev hooks

Full table is in **`ARCHITECTURE.md` → Dev hooks** (`?stage=N`, `?test=1`,
`&movies=N`, `&year=YYYY`, `#love`/`#fire`…). One more that lives in
`js/final.js` and isn't in that table:

```
survey.html?final=1&a=88&m=95&l=76&h=81     # stage 5 standalone with those four scores
```

These exist purely so a screenshot can capture a deep state in one step. **Add
new hooks rather than clicking through five stages by hand** — every visual fix
in this project was verified through one.

---

## 4. Astrology engine notes (see SYNASTRY-NOTES.md for the scoring rubric)

- `assets/astronomy.browser.min.js` — vendored astronomy-engine (MIT), real
  ephemeris. `assets/synastry.js` builds both natal charts and cross-aspects them.
- **Anna's birth data is hardcoded** in `synastry.js`: 1996-10-19 21:36,
  Fredericton NB (45.9454, −66.6656, `America/Moncton`).
  She is **Libra Sun · Aquarius Moon · Gemini rising** — all air, which is why
  the scoring rewards air placements and punishes heavy water.
- **The bug to never reintroduce:** planet positions must be **geocentric**
  (`GeoVector` + `Rotation_EQJ_ECT`), not topocentric (`Equator(...)` with an
  Observer). Anna's Moon sits at **0.44° Aquarius** — right on the Capricorn
  cusp — and topocentric parallax (up to ~1° for the Moon) flipped it into
  Capricorn. The user caught this immediately. Astrology uses geocentric.
- **Tune scoring by running it headless in Node**, not by clicking the UI:

```bash
cd assets && node -e "
global.window = global;
global.Astronomy = require('./astronomy.browser.min.js');   // must assign the global
require('./synastry.js');
console.log(window.Synastry.compute({y:1998,mo:10,d:2,h:12,mi:15,lat:51.51,lon:-0.13,tz:'Europe/London'}));
"
```

Running a spread of ~7 test birthdays this way is how the score range got
widened from a mushy 40–70 to a spread 37–99. Do that before claiming a scoring
change "adds variation."

---

## 5. Design direction (what "good" means here)

The target is **2009 Japanese Nintendo DS menu**, not generic web UI. Rules
established by user feedback, in the user's words where possible:

- **Font:** self-hosted **M PLUS Rounded 1c** (`assets/fonts/`, weights 500/800)
  — Japanese *maru gothic* (rounded gothic), the closest web font to
  Tomodachi-Collection-era DS type. Applied site-wide via `--font-round` in
  `css/base.css`. Never fall back to Arial; that's what got called
  "extremely vibe-coded."
- **NO text shadows. Anywhere.** All 20 were stripped. Nintendo text is solid
  color on a clean surface. Where a shadow was faking contrast, replace it with
  a **solid color** (`--pink`, `--pink-heading`), don't soften the shadow. The
  only survivor is the glow on the floating-hearts FX (that's VFX, not type).
- **Palette:** one pink system, defined as vars in `css/base.css`. Primary
  `--pink: #f14e98`, chrome/silver secondary. The Emotion Beta pinks are the
  canonical ones — everything else was pulled to match them.
- **Buttons:** chunky, rounded, hard offset shadow that collapses on `:active`
  (physical press). See `.next` and the landing `.candy`.
- **Watch contrast on the pale sky.** The star video's top is nearly white, so
  white text vanishes there. Stages 4/5 explicitly override to solid pinks.

---

## 6. Product decisions that are easy to accidentally regress

The stage flow itself is documented in `ARCHITECTURE.md`. These are the specific
corrections the user made — undoing any of them re-breaks something:

- **Every reveal shows that stage's OWN standalone score**, with its own label
  ("movie compatibility", "looks compatibility") — *not* the running blend. One
  blended number made every stage feel identical, which was the complaint. The
  cumulative blend still exists, but only behind `ⓘ more info` and in stage 5.
- **Under-20 forces a hard 0% AND must not advance.** It plays the reveal, Anna
  goes scared, then it stays on stage 1 and shows the receipt. Letting a
  teenager into stage 2 is a bug.
- **Stage 5 gate is ≥70%**: socials (`@hard_boiledbabe`, IG + X) above, the
  consolation lineup (Clairo, Zooey Deschanel, Dakota Johnson, Anne Hathaway)
  below.
- Anna's reaction per score is deliberate characterization — e.g. **smug** on a
  looks match, because she's not flattered, she's *validated*.

### Height stage — the UX trap
Originally the scene auto-zoomed so the **taller** figure filled the floor,
which meant dragging your height **visibly shrank Anna** — reading as "I'm
changing Anna's height." Fix: **fixed pixels-per-inch** so Anna's standee never
changes size, only yours. Your height is a **second dashed measuring line** at
your head (labeled `you · 5′9″`) mirroring Anna's line — not a giant floating
number. Also removed the `transition: height` on the standee, which made width
snap while height lagged (a rubber-band warble while dragging).

---

## 7. ⚠️ Multiple agents work in this repo at once — read this before committing

At peak there were **four Claude sessions plus Codex runs** editing this repo
simultaneously (survey stages, mobile CSS, Vercel deploy, face tracking).

**Do not `git add -A`.** I did, and it swept other sessions' uncommitted
working-tree changes into commits under my name — which made `git log` lie about
who wrote the text shadows the user later objected to. **Stage only the files
you actually touched** (`git add js/final.js css/final.css`).

When shared files (`survey.html`, `js/survey.js`, `css/survey.css`) have another
session's work in flight, a clean pattern is: commit *your* new standalone
module, and leave the small one-line hooks into shared files unstaged to ride
along with that session's next commit.

**To attribute a change you didn't make**, don't trust `git log` — grep the
session transcripts for a distinctive value (a hex color, a selector):

```bash
cd ~/.claude/projects/-Users-carlostmayers-app-danger
grep -c "baffc9" *.jsonl        # which session wrote this exact color
```

That's how the mystery text shadows were traced to a specific session in
seconds. Codex sessions live in `~/.codex/sessions/` and their `cwd` field tells
you which project they were touching.

Also: **the user stops the localhost server sometimes.** If it dies twice in a
row, that's deliberate — ask rather than restarting a third time.

---

## 8. Fast orientation for a new thread

```bash
cd "/Users/carlostmayers/app danger/astrological-anna-dating-app"
python3 -m http.server 3001          # then open http://localhost:3001
git log --oneline -15                # what landed recently
git status --short                   # is another session mid-edit?
```

- Repo: **https://github.com/Danger-Testing/astrological-anna-dating-app**
- Deployed (by another session): `astrological-anna.vercel.app` — may lag local.
- `api/judge.js` calls Claude server-side and reads `ANTHROPIC_API_KEY` from the
  environment; the key must never ship to the client.
- Read `README.md` for structure, `SYNASTRY-NOTES.md` for scoring, this file for
  tooling and traps.
