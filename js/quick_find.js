/* quick_find.js — press "/" and type to jump to any element on any page.
 *
 * WHY
 * A generated diagram is a MAP, and a map you can only browse is half a map. With 30+ pages and
 * ~700 tagged elements, "where is the thing that handles X?" was answered by opening pages one
 * by one and reading. Agents got a query tool (the generator's map_query.py); this is the same
 * answer for a human inside the viewer: type a few letters, land on the box, selected and
 * centred.
 *
 * CONTRACT
 * Searches every page's nodes over `tag` + label + page name. Enter (or click) jumps via
 * window.fluyoTag(tag) — tag_link.js owns the jump, this file only finds. Esc closes. "/" is
 * ignored while typing in an input/textarea/contenteditable.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * Its own file and its own DOM overlay. Reads `doc` (a top-level `let` in a classic script — a
 * global binding, NOT window.doc) and calls only window.fluyoTag. All state hoisted to the top
 * of build() — the page_sidebar TDZ streak taught that lesson three times in one day.
 */
(function () {
  'use strict';

  function rows() {
    const out = [];
    if (typeof doc === 'undefined' || !doc.pages) return out;
    doc.pages.forEach(function (p) {
      (p.nodes || []).forEach(function (n) {
        if (!n.tag) return;
        const first = String(n.label || '').split('\n')[0];
        out.push({ tag: n.tag, page: p.name, text: first,
                   hay: (n.tag + ' ' + first + ' ' + p.name).toLowerCase() });
      });
    });
    return out;
  }

  function build() {
    if (document.getElementById('qfWrap')) return;

    /* All state first — a `place()` called above a `const` cost a day of invisible sidebars. */
    let items = [];
    let sel = 0;

    const style = document.createElement('style');
    style.textContent = `
      #qfWrap{position:fixed;inset:0;z-index:80;display:none;background:rgba(0,0,0,.35);
        align-items:flex-start;justify-content:center;padding-top:12vh}
      #qfBox{width:min(680px,92vw);background:var(--panel,#22242a);border:1px solid var(--line,#3a3d45);
        border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.5);overflow:hidden}
      #qfIn{width:100%;box-sizing:border-box;padding:14px 16px;font:16px -apple-system,BlinkMacSystemFont,sans-serif;
        background:transparent;color:var(--text,#e8eaed);border:0;outline:0;
        border-bottom:1px solid var(--line,#3a3d45)}
      #qfList{max-height:46vh;overflow-y:auto}
      .qfRow{padding:9px 16px;cursor:pointer;font:14px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;
        color:var(--text,#e8eaed);display:flex;gap:10px;align-items:baseline}
      .qfRow.on{background:rgba(120,140,255,.18)}
      .qfRow .tg{font-family:ui-monospace,monospace;font-size:12px;opacity:.75;white-space:nowrap;
        max-width:38%;overflow:hidden;text-overflow:ellipsis}
      .qfRow .tx{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .qfRow .pg{font-size:12px;opacity:.55;white-space:nowrap}
      #qfNone{padding:14px 16px;font:13px -apple-system,sans-serif;opacity:.6}`;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'qfWrap';
    wrap.innerHTML = '<div id="qfBox"><input id="qfIn" placeholder="Jump to… (tag, label or page)">' +
                     '<div id="qfList"></div></div>';
    document.body.appendChild(wrap);
    const input = wrap.querySelector('#qfIn');
    const list = wrap.querySelector('#qfList');

    function close() { wrap.style.display = 'none'; }
    function open() {
      wrap.style.display = 'flex';
      input.value = '';
      render('');
      input.focus();
    }

    function go(i) {
      const r = items[i];
      if (!r) return;
      close();
      if (typeof window.fluyoTag === 'function') window.fluyoTag(r.tag);
    }

    function render(q) {
      const ql = q.trim().toLowerCase();
      const all = rows();
      items = ql
        ? all.filter(function (r) { return r.hay.indexOf(ql) !== -1; })
             /* tag hits outrank body hits — `auth` should find auth:summary first */
             .sort(function (a, b) {
               return (a.tag.toLowerCase().indexOf(ql) === -1 ? 1 : 0)
                    - (b.tag.toLowerCase().indexOf(ql) === -1 ? 1 : 0);
             })
        : all;
      items = items.slice(0, 12);
      sel = 0;
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div id="qfNone">nothing matches — the map may need regenerating</div>';
        return;
      }
      items.forEach(function (r, i) {
        const div = document.createElement('div');
        div.className = 'qfRow' + (i === sel ? ' on' : '');
        div.innerHTML = '<span class="tg"></span><span class="tx"></span><span class="pg"></span>';
        div.children[0].textContent = r.tag;
        div.children[1].textContent = r.text;
        div.children[2].textContent = r.page;
        div.onmouseenter = function () { mark(i); };
        div.onclick = function () { go(i); };
        list.appendChild(div);
      });
    }

    function mark(i) {
      sel = i;
      Array.prototype.forEach.call(list.children, function (el, k) {
        el.classList.toggle('on', k === sel);
      });
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); close(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); go(sel); }
      else if (ev.key === 'ArrowDown') { ev.preventDefault(); mark(Math.min(sel + 1, items.length - 1)); list.children[sel] && list.children[sel].scrollIntoView({block: 'nearest'}); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); mark(Math.max(sel - 1, 0)); list.children[sel] && list.children[sel].scrollIntoView({block: 'nearest'}); }
    });
    wrap.addEventListener('click', function (ev) { if (ev.target === wrap) close(); });

    addEventListener('keydown', function (ev) {
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === '/') { ev.preventDefault(); open(); }
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
