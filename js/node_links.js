/* node_links.js — a node can link to another PAGE. Double-click to follow it.
 *
 * WHY
 * A multi-page diagram has no navigation except the page rail. An overview page that names every
 * section is a table of contents you have to translate by hand: you read "Library", then hunt the
 * rail for the Library page. With a link, the overview becomes an index you can actually use, and
 * a diagram you can click through is the difference between a picture and a map.
 *
 * CONTRACT
 * `node.linkPage` — the NAME of a target page (matched exactly), or its 0-based index. A name is
 * preferred: page order changes when a page is added, names do not.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * A separate file. It reads the same `doc` / `viewX` / `viewY` / `viewZoom` globals everything
 * else does and only writes `doc.cur`, which is exactly what the page rail writes. The canvas
 * already redraws every frame, so nothing needs to call draw().
 *
 * Double-click, not click: single click is select/drag, and stealing it would break editing.
 */
(function () {
  'use strict';

  function pageIndex(target) {
    if (typeof target === 'number') return target;
    const pages = (window.doc && doc.pages) || [];
    return pages.findIndex(p => p.name === target);
  }

  /* Screen point -> world point, the same transform render.js draws with. */
  function toWorld(ev, cv) {
    const r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left - viewX) / viewZoom,
             y: (ev.clientY - r.top - viewY) / viewZoom };
  }

  function linkedNodeAt(p) {
    const page = (window.doc && doc.pages && doc.pages[doc.cur]) || null;
    if (!page) return null;
    // Topmost first: later nodes render over earlier ones, so they win the hit.
    for (let i = page.nodes.length - 1; i >= 0; i--) {
      const n = page.nodes[i];
      if (n.linkPage === undefined || n.linkPage === null) continue;
      // x,y is the CENTRE of a node in this codebase, not its top-left corner.
      if (Math.abs(p.x - n.x) <= n.w / 2 && Math.abs(p.y - n.y) <= n.h / 2) return n;
    }
    return null;
  }

  function build() {
    const cv = document.getElementById('cv');
    if (!cv || cv._nodeLinksBound) return;
    cv._nodeLinksBound = true;

    cv.addEventListener('dblclick', ev => {
      const n = linkedNodeAt(toWorld(ev, cv));
      if (!n) return;
      const idx = pageIndex(n.linkPage);
      if (idx < 0) return;                 // a link to a page that no longer exists is a no-op
      ev.preventDefault();
      ev.stopPropagation();
      doc.cur = idx;
      if (typeof renderPages === 'function') renderPages();   // keep the rail in sync
      if (typeof fitView === 'function') fitView();
    }, true);

    /* Affordance: a link is invisible unless the cursor says so. Set inline, because
     * interaction.js writes cv.style.cursor on hover and an inline write is the only one that
     * survives it. */
    let armed = false;
    cv.addEventListener('pointermove', ev => {
      const hit = !!linkedNodeAt(toWorld(ev, cv));
      if (hit !== armed) {
        armed = hit;
        if (hit) cv.style.cursor = 'pointer';
      } else if (hit) {
        cv.style.cursor = 'pointer';
      }
    }, true);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
