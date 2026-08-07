/* node_tooltip.js — hover a node to read the text its box could not hold.
 *
 * WHY
 * A generated diagram has labels that are genuinely longer than any box you would want on a
 * canvas — a list of twenty action names, a handler's full docstring line. Truncating loses the
 * information; widening the box to fit the worst case ruins the layout for the other ninety.
 * Hover is the third option: the box stays the size the layout wants, and the text is still there.
 *
 * CONTRACT
 * `node.full` — the untruncated text. Optional. If absent, a node whose visible label ends in an
 * ellipsis falls back to showing that label, so partial adoption still helps.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * Its own file, a DOM element over the canvas, and it reads `doc` / `viewX` / `viewY` / `viewZoom`
 * exactly as the renderer does. It writes nothing.
 */
(function () {
  'use strict';

  function toWorld(ev, cv) {
    const r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left - viewX) / viewZoom,
             y: (ev.clientY - r.top - viewY) / viewZoom };
  }

  function nodeAt(p) {
    const page = (typeof doc !== 'undefined' && doc.pages && doc.pages[doc.cur]) || null;
    if (!page) return null;
    for (let i = page.nodes.length - 1; i >= 0; i--) {
      const n = page.nodes[i];
      // x,y is the CENTRE of a node in this codebase, not its top-left corner.
      if (Math.abs(p.x - n.x) <= n.w / 2 && Math.abs(p.y - n.y) <= n.h / 2) return n;
    }
    return null;
  }

  function textFor(n) {
    if (!n) return '';
    if (n.full) return n.full;
    // Only offer a tooltip where something was actually cut — otherwise every hover pops a box
    // repeating what you can already read, which is worse than no tooltip.
    return /…\s*$/.test(n.label || '') ? n.label : '';
  }

  function build() {
    const cv = document.getElementById('cv');
    if (!cv || cv._tipBound) return;
    cv._tipBound = true;

    const tip = document.createElement('div');
    tip.id = 'nodeTip';
    document.body.appendChild(tip);

    const style = document.createElement('style');
    style.textContent = `
      #nodeTip{position:fixed;z-index:60;max-width:520px;padding:9px 12px;border-radius:8px;
        background:rgba(18,18,22,.97);color:#e8eaed;border:1px solid rgba(255,255,255,.14);
        font:14px/1.45 -apple-system,BlinkMacSystemFont,sans-serif;white-space:pre-wrap;
        box-shadow:0 6px 22px rgba(0,0,0,.45);pointer-events:none;display:none}
      body.light #nodeTip,body.cream #nodeTip{background:rgba(255,255,255,.98);color:#1f2328;
        border-color:rgba(0,0,0,.16)}`;
    document.head.appendChild(style);

    let showing = null;
    cv.addEventListener('pointermove', ev => {
      const n = nodeAt(toWorld(ev, cv));
      const text = textFor(n);
      if (!text) {
        if (showing) { tip.style.display = 'none'; showing = null; }
        return;
      }
      if (showing !== n) {
        tip.textContent = text;
        tip.style.display = 'block';
        showing = n;
      }
      // Flip to the other side near the viewport edge rather than running off it.
      const pad = 16;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let x = ev.clientX + pad, y = ev.clientY + pad;
      if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
      if (y + h > innerHeight - 8) y = ev.clientY - h - pad;
      tip.style.left = Math.max(8, x) + 'px';
      tip.style.top = Math.max(8, y) + 'px';
    });

    cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; showing = null; });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
