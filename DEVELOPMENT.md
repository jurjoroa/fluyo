# Developing this fork

Working notes for the `english` branch. Clone of `itsnect/fluyo` (MIT), **not** a GitHub fork —
`origin` still points upstream, so every addition lives in its own file wherever possible and
merges from upstream stay clean.

Driven by a real consumer: spillit generates a 33-page architecture diagram
(`checks/gen_architecture_diagram.py`) and every feature below exists because that diagram could
not say something true without it.

## What we added, and why

| file | what | why it was needed |
|---|---|---|
| `js/i18n.js` | runtime DOM-walk translation, 88 strings | upstream is Spanish-only; `?lang=es` still works |
| `js/zoom_controls.js` | `− 100% + ⤢`, Cmd±/0, Shift+1 | zoom existed only as Ctrl+Wheel, undiscoverable |
| `js/hand_tool.js` | hand/pan tool in the zoom bar | panning was middle-click or Alt+drag only |
| `js/geometry.js` | **self-loop routing** | a node that feeds itself had no path |
| `js/config.js` + `render.js` + `export.js` | **`node.iconSvg`** | a diagram of an app wants that app's own icons |

## Self-loops (`selfLoopPoints`, geometry.js)

An edge whose `from === to`. Upstream had no case: both anchors resolve on the same box, so
`orthoRoute` returned a degenerate zig-zag **straight through the node** — five points on one axis,
crossing the box twice. It read as a strike-through, not a loop.

A node feeding itself is ordinary in a real flow: a retry, a debounce that waits and repeats, a
poller, a watcher. Without it the only way to draw a cycle is a dummy neighbour node, which says
"two things" where the truth is "one thing that repeats".

Three cases, and the third is the one that bites:

- **same side** → a flat bump offset along the box
- **adjacent sides** → out, turn the corner, back in
- **opposite sides** (`s→n`, `e→w`) → must route **around a flank**

> Going out one side and straight to the other draws a segment through the middle of the box.
> Verify with **segment-vs-box intersection**, never by checking whether the corner *points* sit
> outside — they do, and the segment between them still crosses. That mistake passed a first test
> and had to be caught again.

Returns points only, so the renderer and the dot animation treat a self-loop like any other edge.
The dot travelling round the cycle is what makes it read as a cycle.

## Custom icons (`node.iconSvg`)

The 80 built-ins are cloud/infra glyphs (`kafka`, `s3`, `dynamo`, …). A diagram **of an
application** wants that application's own icons — the ones a user already recognises from its
sidebar. No mapping onto an infra set is faithful, only "close".

`iconSvg` takes raw inner markup on a 24×24 grid and gets the same pill + tint treatment as a
built-in, so a custom glyph doesn't look pasted on.

> Threaded through **`render.js` AND `export.js`**. An exporter that ignored it would produce a PNG
> that quietly disagreed with the canvas — the worst kind of bug, because the artifact people share
> is the one that's wrong.

## Traps this codebase has, learned the hard way

**`node.x, node.y` is the CENTRE, not the top-left.** Verified against `anchorPt`: a node at
`x=100, w=200` anchors its EAST side at `x=200`, which is only true for a centre. Any layout code
treating it as a corner is off by half the node's size in both axes — and it *looks* plausible on a
uniform grid, which is how it survived.

**Text does not clip.** A label wider than its box renders straight over its neighbour. This is
invisible in the JSON and only shows as a page that looks broken. Consumers must wrap to the box:
roughly `chars_per_line = w / (fs * 0.75)` for the default sans stack — a 560px box at `fs=12` fits
~62 characters. A single token can still overflow (`subprocess.run(osascript)` is 25 chars in a
210px box) and needs hard breaking.

**`shape` defaults matter.** A bare `text` node is a floating caption with no edge to it; `rect`
reads as a thing. A diagram made of `text` nodes looks like loose notes.

**Rail clicks are bound once at load.** An injected button gets no handler unless it binds its own
(`hand_tool.js`). And `interaction.js:300` writes `cv.style.cursor` inline on hover, which beats any
stylesheet rule — a class-based cursor flickers back to default the moment the pointer moves.

**Pointer listeners belong on `window`, not the canvas.** Bound to the canvas, a drag dies the
moment the pointer crosses onto the rail or a side panel — exactly when you need it at high zoom.
`setPointerCapture` is supposed to prevent that and does in Chromium; relying on it is the bug.

**Watch out for init-time state transitions.** A `requestAnimationFrame` watcher whose `last`
starts at `null` reads frame 1 as a transition and can fire side effects while the app is still
initialising. `hand_tool.js` did this and left rail buttons highlighted at load — a bug this file
*caused* and which was briefly mistaken for upstream's.

## Running it

    python3 dev_server.py        # http://127.0.0.1:8900, live reload (gitignored)

Load a diagram with `?ejemplo=<slug>` (registered in `js/examples.js`). That path deliberately
bypasses the saved-session prompt, which is why seeding `localStorage` alone does **not** work.

## If you contribute upstream

i18n and the self-loop are the two genuinely general additions — neither is spillit-specific and
both are things any user would want. `iconSvg` is general too but changes a public contract, so it
would need discussion. Keep each in its own file and the diff stays reviewable.
