/* hand_tool.js — a hand (pan) tool, so you can drag the canvas with a plain left-click.
 *
 * WHY
 * Panning existed but only as middle-click, right-click or Alt+Drag. None of those is obvious,
 * and none is comfortable on a trackpad — which matters most exactly when you are zoomed in and
 * need to move around. Every canvas editor has a hand; this adds it.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * A separate file. The rail already binds any button carrying `data-mode`, so the tool registers
 * itself by injecting one — `setMode('hand')` and the toggled state come free.
 *
 * The drag itself is handled in the CAPTURE phase and stops propagation, so upstream's pointerdown
 * (which would start a selection marquee) never runs. That is why this needs no edit to
 * interaction.js.
 *
 * Shortcuts: H for hand, V for select (V is upstream's). Space is deliberately NOT used — it is
 * already play/pause here, and quietly stealing it would break a documented shortcut.
 */
(function () {
  'use strict';

  const HAND_SVG =
    '<svg viewBox="0 0 24 24"><path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12' +
    'm0-1a1.5 1.5 0 0 1 3 0v1.5m0-.5a1.5 1.5 0 0 1 3 0V16a5 5 0 0 1-5 5h-2.5a5 5 0 0 1-4-2L5 15.5' +
    'a1.6 1.6 0 0 1 2.6-1.8L8 14"/></svg>';

  function build() {
    const rail = document.querySelector('.rail');
    const cv = document.getElementById('cv');
    if (!rail || !cv || rail.querySelector('[data-mode="hand"]')) return;

    const btn = document.createElement('button');
    btn.dataset.mode = 'hand';
    btn.title = 'Hand — drag to pan (H)';
    btn.innerHTML = HAND_SVG + 'Hand';
    // Directly after Select, where every other editor puts it.
    const sel = rail.querySelector('[data-mode="select"]');
    sel ? sel.after(btn) : rail.prepend(btn);

    // Upstream binds rail clicks ONCE at load, over the buttons that existed then — an injected
    // button gets no handler and silently does nothing when clicked. Bind it here.
    btn.addEventListener('click', () => {
      if (typeof setMode === 'function') setMode('hand');
    });

    let drag = null;

    // The cursor is set INLINE, not by a CSS class: interaction.js:300 writes `cv.style.cursor`
    // on hover, and an inline style beats any stylesheet rule — so a class-based grab cursor
    // flickers back to default the moment the pointer moves.
    let last = null;
    (function watch() {
      const on = (typeof mode !== 'undefined' && mode === 'hand');
      if (on !== last) { last = on; document.body.classList.toggle('hand-mode', on); }
      if (on) cv.style.cursor = drag ? 'grabbing' : 'grab';
      requestAnimationFrame(watch);
    })();

    cv.addEventListener('pointerdown', ev => {
      if (typeof mode === 'undefined' || mode !== 'hand') return;
      if (ev.button !== 0) return;               // let middle/right keep their existing behaviour
      ev.preventDefault();
      ev.stopPropagation();                       // upstream must not start a marquee
      drag = { x: ev.clientX, y: ev.clientY, ox: viewX, oy: viewY };
      document.body.classList.add('hand-dragging');
      cv.setPointerCapture && cv.setPointerCapture(ev.pointerId);
    }, true);

    cv.addEventListener('pointermove', ev => {
      if (!drag) return;
      ev.preventDefault();
      ev.stopPropagation();
      viewX = drag.ox + (ev.clientX - drag.x);
      viewY = drag.oy + (ev.clientY - drag.y);
    }, true);

    const end = ev => {
      if (!drag) return;
      drag = null;
      document.body.classList.remove('hand-dragging');
      if (ev && ev.pointerId != null && cv.releasePointerCapture) {
        try { cv.releasePointerCapture(ev.pointerId); } catch (e) {}
      }
    };
    cv.addEventListener('pointerup', end, true);
    cv.addEventListener('pointercancel', end, true);
    addEventListener('blur', () => end());

    addEventListener('keydown', ev => {
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === 'h' || ev.key === 'H') {
        ev.preventDefault();
        if (typeof setMode === 'function') setMode(mode === 'hand' ? 'select' : 'hand');
      }
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
