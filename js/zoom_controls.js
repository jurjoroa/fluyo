/* zoom_controls.js — visible zoom controls for the canvas.
 *
 * WHY
 * Zoom existed but only as Ctrl+Wheel, which is undiscoverable and awkward on a trackpad — the
 * only hint is a line of help text in the side panel. This adds the control every canvas editor
 * has: − / percentage / + / fit, plus the keyboard shortcuts people already expect.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * A separate file that reads and writes the existing `viewZoom` / `viewX` / `viewY` globals. It
 * touches no upstream function, so merges from itsnect/fluyo stay clean. The canvas already
 * redraws every frame (requestAnimationFrame loop in render.js), so changing the view variables
 * is enough — nothing needs to call draw().
 *
 * Zoom is anchored to the CENTRE of the viewport, not the cursor. Button zoom that jumps toward
 * wherever the pointer happens to rest feels broken; wheel zoom keeps its cursor anchoring.
 */
(function () {
  'use strict';

  const MIN = 0.1, MAX = 5, STEP = 1.2;

  function el(tag, attrs, txt) {
    const e = document.createElement(tag);
    Object.assign(e, attrs || {});
    if (txt != null) e.textContent = txt;
    return e;
  }

  function build() {
    const stage = document.querySelector('.stage');
    if (!stage || document.getElementById('zoomCtl')) return;

    const bar = el('div', { id: 'zoomCtl' });
    const out = el('button', { className: 'zc-pct', title: 'Reset to 100% (Ctrl/Cmd+0)' }, '100%');
    const minus = el('button', { className: 'zc-b', title: 'Zoom out (Ctrl/Cmd+−)' }, '−');
    const plus = el('button', { className: 'zc-b', title: 'Zoom in (Ctrl/Cmd++)' }, '+');
    const fit = el('button', { className: 'zc-b zc-fit', title: 'Fit page to screen (Shift+1)' }, '⤢');
    bar.append(minus, out, plus, fit);
    stage.appendChild(bar);

    /* Anchor on the viewport centre so the drawing does not lurch toward the pointer. */
    function zoomBy(factor) {
      const wrap = document.getElementById('wrap');
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2;
      const next = Math.min(MAX, Math.max(MIN, viewZoom * factor));
      const wx = (cx - viewX) / viewZoom;
      const wy = (cy - viewY) / viewZoom;
      viewZoom = next;
      viewX = cx - wx * viewZoom;
      viewY = cy - wy * viewZoom;
      if (typeof commitEditBox === 'function') commitEditBox();
    }

    function reset() {
      const wrap = document.getElementById('wrap');
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2;
      const wx = (cx - viewX) / viewZoom, wy = (cy - viewY) / viewZoom;
      viewZoom = 1;
      viewX = cx - wx; viewY = cy - wy;
      if (typeof commitEditBox === 'function') commitEditBox();
    }

    minus.onclick = () => zoomBy(1 / STEP);
    plus.onclick = () => zoomBy(STEP);
    out.onclick = reset;
    fit.onclick = () => { if (typeof fitView === 'function') fitView(); };

    /* Keep the readout honest — wheel zoom and fitView change viewZoom behind our back. */
    let shown = null;
    (function sync() {
      const pct = Math.round(viewZoom * 100);
      if (pct !== shown) { shown = pct; out.textContent = pct + '%'; }
      requestAnimationFrame(sync);
    })();

    addEventListener('keydown', ev => {
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (ev.ctrlKey || ev.metaKey) {
        if (ev.key === '=' || ev.key === '+') { ev.preventDefault(); zoomBy(STEP); }
        else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); zoomBy(1 / STEP); }
        else if (ev.key === '0') { ev.preventDefault(); reset(); }
      } else if (ev.key === '!' || (ev.shiftKey && ev.key === '1')) {
        ev.preventDefault();
        if (typeof fitView === 'function') fitView();
      }
    });
  }

  const css = `
  #zoomCtl{position:absolute;right:14px;bottom:14px;z-index:40;display:flex;align-items:stretch;
    gap:1px;background:rgba(20,20,24,.86);border:1px solid rgba(255,255,255,.14);
    border-radius:9px;overflow:hidden;backdrop-filter:blur(6px);
    box-shadow:0 4px 16px rgba(0,0,0,.35);font:13px/1 -apple-system,BlinkMacSystemFont,sans-serif}
  #zoomCtl button{background:none;border:0;color:#e8eaed;cursor:pointer;padding:0;
    font:inherit;transition:background .12s}
  #zoomCtl button:hover{background:rgba(255,255,255,.12)}
  #zoomCtl button:active{background:rgba(255,255,255,.2)}
  #zoomCtl .zc-b{width:32px;height:30px;font-size:16px;line-height:1}
  #zoomCtl .zc-pct{min-width:52px;height:30px;font-variant-numeric:tabular-nums;
    border-left:1px solid rgba(255,255,255,.12);border-right:1px solid rgba(255,255,255,.12)}
  #zoomCtl .zc-fit{border-left:1px solid rgba(255,255,255,.12);font-size:14px}
  body.light #zoomCtl, body.cream #zoomCtl{background:rgba(255,255,255,.9);
    border-color:rgba(0,0,0,.14)}
  body.light #zoomCtl button, body.cream #zoomCtl button{color:#1f2328}
  `;
  document.head.appendChild(el('style', {}, css));

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
