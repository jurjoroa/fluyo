/* tag_link.js — deep-link to a node by its TAG: ?tag=documents/dynamic-button
 *
 * WHY
 * A generated diagram renumbers its node ids every run — they are layout, not identity. A `tag`
 * on a node is identity: the name of the real thing it renders, stable across regenerations.
 * This file makes tags addressable: a URL can land on one box, centred and selected, which is
 * what lets OTHER tools point into the diagram — an app's dev overlay, a failing guard's output,
 * a commit message — instead of saying "open the map and hunt".
 *
 * CONTRACT
 * `node.tag` — any string, expected unique per document. `?tag=<value>` jumps to its page and
 * centres it. `window.fluyoTag(value)` does the same from the console or another script.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * Its own file. Writes `doc.cur` (what the page rail writes) and the view globals (what the zoom
 * controls write). A missing tag is a console note, never a throw — a stale link into a
 * regenerated diagram must degrade to "opened the diagram", not to a broken page.
 */
(function () {
  'use strict';

  function jump(tag) {
    if (typeof doc === 'undefined' || !doc.pages) return false;
    for (let pi = 0; pi < doc.pages.length; pi++) {
      const n = (doc.pages[pi].nodes || []).find(x => x.tag === tag);
      if (!n) continue;
      doc.cur = pi;
      if (typeof renderTabs === 'function') renderTabs();
      const wrap = document.getElementById('wrap');
      if (wrap) {
        const r = wrap.getBoundingClientRect();
        viewZoom = 1;
        viewX = r.width / 2 - n.x;
        viewY = r.height / 2 - n.y;
      }
      // Select it so the standard selection ring marks WHICH box the link meant.
      if (typeof selN !== 'undefined' && selN && selN.clear) {
        selN.clear();
        selN.add(n.id);
      }
      return true;
    }
    console.warn('[tag_link] no node carries tag:', tag,
                 '— the diagram may have been regenerated since this link was made');
    return false;
  }

  window.fluyoTag = jump;

  function boot() {
    const tag = new URLSearchParams(location.search).get('tag');
    if (!tag) return;
    // The document arrives async with ?ejemplo= — wait for it, same as the sidebar does.
    (function tryJump(left) {
      if (jump(tag) || left <= 0) return;
      setTimeout(() => tryJump(left - 1), 120);
    })(50);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
