/* page_sidebar.js — pages as a grouped SIDEBAR instead of a single row of tabs.
 *
 * WHY
 * The footer tab bar works for the four or five pages a hand-drawn diagram has. A generated one
 * has thirty-seven, and they stop being a row and become a horizontal scroll with no structure:
 * every page looks equally important and you cannot tell a flow from a section from the index.
 *
 * A sidebar with GROUPS is how the applications these diagrams describe present their own
 * navigation — a section, then its sub-items. Reading the diagram then feels like reading the app.
 *
 * CONTRACT
 * `page.group` — an optional heading a page belongs under. Pages with no group fall into the
 * first, unlabelled group, so a document that never sets it renders exactly as it did before.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * Its own file. It writes only `doc.cur`, the same thing the footer bar writes, and calls
 * upstream's `renderTabs()` so the footer stays in sync rather than being replaced — closing the
 * sidebar leaves a working editor.
 */
(function () {
  'use strict';

  const WIDTH = 232;

  function groupsOf(pages) {
    const out = new Map();
    pages.forEach((pg, i) => {
      const key = pg.group || "";
      if (!out.has(key)) out.set(key, []);
      out.get(key).push({ pg, i });
    });
    return out;
  }

  function build() {
    if (document.getElementById('pageSide')) return;
    const stage = document.querySelector('.stage');
    if (!stage || !window.doc) return;

    const side = document.createElement('nav');
    side.id = 'pageSide';
    document.body.appendChild(side);

    const style = document.createElement('style');
    style.textContent = `
      #pageSide{position:fixed;left:0;top:0;bottom:0;width:${WIDTH}px;z-index:35;overflow-y:auto;
        background:rgba(18,18,22,.94);border-right:1px solid rgba(255,255,255,.10);
        font:13px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;padding:10px 0 24px;
        backdrop-filter:blur(6px)}
      #pageSide.hid{transform:translateX(-100%)}
      #pageSide h4{margin:14px 14px 6px;font-size:10.5px;letter-spacing:.09em;
        text-transform:uppercase;color:#8b8f98;font-weight:600}
      #pageSide a{display:block;padding:6px 14px;color:#d8dae0;text-decoration:none;
        cursor:pointer;border-left:2px solid transparent;white-space:nowrap;overflow:hidden;
        text-overflow:ellipsis}
      #pageSide a:hover{background:rgba(255,255,255,.06)}
      #pageSide a.on{background:rgba(240,136,62,.16);border-left-color:#f0883e;color:#fff}
      #pageSideT{position:fixed;left:${WIDTH}px;top:12px;z-index:36;width:26px;height:26px;
        border:0;border-radius:0 7px 7px 0;background:rgba(18,18,22,.94);color:#d8dae0;
        cursor:pointer;font-size:13px;line-height:26px;padding:0;
        border-right:1px solid rgba(255,255,255,.10)}
      body.sideHid #pageSideT{left:0;border-radius:0 7px 7px 0}
      body.light #pageSide,body.cream #pageSide{background:rgba(255,255,255,.95);
        border-right-color:rgba(0,0,0,.12)}
      body.light #pageSide a,body.cream #pageSide a{color:#20242b}
      body.light #pageSideT,body.cream #pageSideT{background:rgba(255,255,255,.95);color:#20242b}`;
    document.head.appendChild(style);

    const toggle = document.createElement('button');
    toggle.id = 'pageSideT';
    toggle.title = 'Show / hide the page list';
    toggle.textContent = '‹';
    document.body.appendChild(toggle);
    toggle.onclick = () => {
      const hid = side.classList.toggle('hid');
      document.body.classList.toggle('sideHid', hid);
      toggle.textContent = hid ? '›' : '‹';
    };

    let shown = -1;
    function paint() {
      // Rebuild only when the selection or the page set changes — this runs on every frame.
      const sig = doc.cur + '|' + doc.pages.length + '|' + doc.pages.map(p => p.name).join('');
      if (sig === shown) return;
      shown = sig;
      side.innerHTML = '';
      for (const [heading, entries] of groupsOf(doc.pages)) {
        if (heading) {
          const h = document.createElement('h4');
          h.textContent = heading;
          side.appendChild(h);
        }
        for (const { pg, i } of entries) {
          const a = document.createElement('a');
          a.textContent = pg.name;
          a.title = pg.name;
          if (i === doc.cur) a.className = 'on';
          a.onclick = () => {
            doc.cur = i;
            if (typeof clearSel === 'function') clearSel();
            if (typeof renderTabs === 'function') renderTabs();   // keep the footer in sync
            if (typeof fitView === 'function') fitView();
          };
          side.appendChild(a);
        }
      }
    }
    (function loop() { paint(); requestAnimationFrame(loop); })();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
