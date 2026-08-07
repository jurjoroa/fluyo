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
    // `doc` arrives ASYNC when a diagram is loaded with ?ejemplo=<slug> — it is fetched after
    // DOMContentLoaded. Bailing out here permanently is why the sidebar silently never appeared:
    // the script ran, found no doc, and returned for good. Wait for it instead.
    // NOT `window.doc`: state.js declares `let doc = …` at the top level of a classic script,
    // which creates a global BINDING and not a property of window — so `window.doc` is undefined
    // forever and this guard looped until the heat death of the tab. Reference the binding.
    if (typeof doc === 'undefined' || !doc.pages) { setTimeout(build, 60); return; }

    // Inserted as a FLEX SIBLING immediately after the tool rail, not positioned over it.
    // The app's shell is `rail | stage`; this makes it `rail | pages | stage`, so the tool rail
    // stays first and the page list sits beside it the way an app puts navigation beside its
    // toolbar. Fixed positioning at left:0 simply covered the rail.
    const rail = document.querySelector('.rail');
    const stage = document.querySelector('.stage');
    const side = document.createElement('nav');
    side.id = 'pageSide';

    /* WHERE the page list lives is a preference, not a fact: a wide diagram wants it out of the
     * way on the right, a tall one wants the bottom back, and a reader browsing pages wants it
     * left next to the tools. Persisted, because having to re-choose it every reload is worse
     * than not offering the choice. */
    const KEY = 'fluyo.pagesPos';
    let pos = localStorage.getItem(KEY) || 'left';

    function place(next) {
      pos = next;
      localStorage.setItem(KEY, pos);
      document.body.classList.toggle('pagesBottom', pos === 'bottom');
      side.classList.toggle('vert', pos !== 'bottom');
      if (pos === 'bottom') {
        // Hand the job back to upstream's footer rather than reimplementing a horizontal strip.
        side.remove();
        document.body.classList.remove('hasSide');
        document.body.classList.remove('pagesRight');
        if (typeof renderTabs === 'function') renderTabs();
        if (typeof syncToggle === 'function') syncToggle();
        return;
      }
      document.body.classList.add('hasSide');
      document.body.classList.toggle('pagesRight', pos === 'right');
      if (pos === 'right' && stage && stage.parentNode) {
        stage.parentNode.insertBefore(side, stage.nextSibling);
      } else if (rail && rail.parentNode) {
        rail.parentNode.insertBefore(side, rail.nextSibling);
      } else {
        document.body.appendChild(side);
      }
      shown = -1;            // force a repaint into the re-inserted element
      if (typeof syncToggle === 'function') syncToggle();
    }

    const style = document.createElement('style');
    style.textContent = `
      #pageSide{flex:0 0 ${WIDTH}px;width:${WIDTH}px;overflow-y:auto;
        background:var(--panel);border-right:1px solid var(--line)
        font:13px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;padding:8px 0 24px}
      #pageSide.hid{display:none}
      body.pagesRight #pageSide{border-right:0;border-left:1px solid var(--line)}
      #pageSide .pos{display:flex;gap:3px;padding:2px 10px 8px;
        border-bottom:1px solid var(--line);margin-bottom:4px}
      #pageSide .pos button{flex:1;height:24px;border:0;border-radius:5px;cursor:pointer;
        background:rgba(127,127,127,.12);color:inherit;font-size:13px;line-height:24px;padding:0}
      #pageSide .pos button:hover{background:rgba(127,127,127,.24)}
      #pageSide .pos button.on{background:#f0883e;color:#1a1207}
      /* The page list moves; it does not appear twice. The footer bar is upstream's and stays in
         the DOM so renderTabs() keeps working — it is only hidden. */
      body.hasSide #pagesBar{display:none}

      #pageSide h4{margin:12px 14px 5px;font-size:10.5px;letter-spacing:.09em;
        text-transform:uppercase;color:#8b8f98;font-weight:600}
      #pageSide a{display:block;padding:6px 14px;color:#d8dae0;text-decoration:none;
        cursor:pointer;border-left:2px solid transparent;white-space:nowrap;overflow:hidden;
        text-overflow:ellipsis}
      #pageSide a:hover{background:rgba(255,255,255,.06)}
      #pageSide a.on{background:rgba(240,136,62,.16);border-left-color:#f0883e;color:#fff}
      #pageSideT{position:fixed;left:${WIDTH + 64}px;top:12px;z-index:36;width:26px;height:26px;
        border:0;border-radius:0 7px 7px 0;background:rgba(18,18,22,.94);color:#d8dae0;
        cursor:pointer;font-size:13px;line-height:26px;padding:0;
        border-right:1px solid rgba(255,255,255,.10)}
      body.sideHid #pageSideT{left:64px}
      body.pagesBottom #pageSideT{left:64px}
      body.pagesRight #pageSideT{left:auto;right:0;border-radius:7px 0 0 7px}
      #pageSide a{color:var(--text,#d8dae0)}
      body.light #pageSideT,body.cream #pageSideT{background:rgba(255,255,255,.95);color:#20242b}`;
    document.head.appendChild(style);
    place(pos);              // honour the saved preference on load, not just on click

    const toggle = document.createElement('button');
    toggle.id = 'pageSideT';
    toggle.title = 'Show / hide the page list';
    toggle.textContent = '‹';
    document.body.appendChild(toggle);
    toggle.onclick = () => {
      // From the bottom bar there is no picker on screen — it left with the sidebar — so this
      // button is the way back. Without it, choosing "bottom" is a one-way door, which is the
      // kind of trap that makes a preference worse than no preference at all.
      if (pos === 'bottom') { place('left'); return; }
      const hid = side.classList.toggle('hid');
      document.body.classList.toggle('sideHid', hid);
      toggle.textContent = hid ? '›' : '‹';
    };
    function syncToggle() {
      toggle.textContent = pos === 'bottom' ? '☰' : (side.classList.contains('hid') ? '›' : '‹');
      toggle.title = pos === 'bottom' ? 'Bring the page list back to the side'
                                      : 'Show / hide the page list';
    }

    let shown = -1;
    function paint() {
      // Rebuild only when the selection or the page set changes — this runs on every frame.
      const sig = doc.cur + '|' + doc.pages.length + '|' + doc.pages.map(p => p.name).join('');
      if (sig === shown) return;
      shown = sig;
      side.innerHTML = '';
      const bar = document.createElement('div');
      bar.className = 'pos';
      bar.title = 'Where the page list sits';
      for (const [key, glyph, tip] of [['left', '⇤', 'Dock left'],
                                       ['right', '⇥', 'Dock right'],
                                       ['bottom', '⇩', 'Back to the bottom bar']]) {
        const b = document.createElement('button');
        b.textContent = glyph;
        b.title = tip;
        if (key === pos) b.className = 'on';
        b.onclick = () => place(key);
        bar.appendChild(b);
      }
      side.appendChild(bar);
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
