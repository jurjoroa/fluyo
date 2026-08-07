/* hand_tool.js — a hand (pan) tool, so you can drag the canvas with a plain left-click.
 *
 * WHY
 * Panning existed but only as middle-click, right-click or Alt+Drag. None of those is obvious,
 * and none is comfortable on a trackpad — which matters most exactly when you are zoomed in and
 * need to move around. Every canvas editor has a hand; this adds it.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * A separate file that injects its button into the zoom bar. It sits WITH the zoom controls
 * rather than in the shape rail: panning and zooming are the same job — moving the viewport —
 * and the rail is for making things.
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
    const bar = document.getElementById('zoomCtl');
    const cv = document.getElementById('cv');
    if (!bar || !cv || bar.querySelector('.zc-hand')) return;

    // The hand lives WITH the zoom controls, not in the shape rail. Panning and zooming are the
    // same job — moving the viewport — and the rail is for making things. Grouping them puts
    // every navigation control under one thumb.
    const btn = document.createElement('button');
    btn.className = 'zc-hand';
    btn.title = 'Hand — drag to pan (H)';
    btn.innerHTML = HAND_SVG;
    bar.prepend(btn);

    const style = document.createElement('style');
    style.textContent = `
      #zoomCtl .zc-hand{width:34px;height:30px;display:grid;place-items:center;
        border-right:1px solid rgba(255,255,255,.12)}
      #zoomCtl .zc-hand svg{width:16px;height:16px;fill:none;stroke:currentColor;
        stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
      #zoomCtl .zc-hand.on{background:#f0883e;color:#1a1207}
      #zoomCtl .zc-hand.on:hover{background:#f0883e}
      body.light #zoomCtl .zc-hand, body.cream #zoomCtl .zc-hand{
        border-right-color:rgba(0,0,0,.12)}`;
    document.head.appendChild(style);

    // Toggle rather than one-way: clicking the active hand returns you to select, which is what
    // a single navigation button in a toolbar is expected to do.
    btn.addEventListener('click', () => {
      if (typeof setMode === 'function') setMode(mode === 'hand' ? 'select' : 'hand');
    });

    let drag = null;

    // The cursor is set INLINE, not by a CSS class: interaction.js:300 writes `cv.style.cursor`
    // on hover, and an inline style beats any stylesheet rule — so a class-based grab cursor
    // flickers back to default the moment the pointer moves.
    let last = false;   // NOT null — see below
    (function watch() {
      const on = (typeof mode !== 'undefined' && mode === 'hand');
      if (on !== last) {
        last = on;
        document.body.classList.toggle('hand-mode', on);
        btn.classList.toggle('on', on);
        // `hand` is a mode upstream does not know, so nothing in the rail should look active
        // while it is on; upstream owns the state again the moment it is off.
        //
        // `last` starts FALSE rather than null on purpose. With null, the very first frame reads
        // as a hand->select transition and calls syncRail() while the app is still initialising,
        // which left Arrow and Image highlighted at load — a bug this file caused and briefly
        // mistook for upstream's.
        if (on) {
          document.querySelectorAll('.rail button.toggled')
                  .forEach(x => x.classList.remove('toggled'));
        } else if (typeof syncRail === 'function') {
          syncRail();
        }
      }
      // The rail can be re-highlighted after the fact (a drawer opening calls syncRail again),
      // so keep it clear for as long as the hand is the active tool, not just on the transition.
      if (on) {
        const stale = document.querySelector('.rail button.toggled');
        if (stale) stale.classList.remove('toggled');
      }
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

    // move/up live on WINDOW, not on the canvas.
    //
    // Bound to the canvas they only fire while the pointer is over it, so the pan died the moment
    // you crossed onto the rail or the side panel — which is exactly when you need it most, since
    // at high zoom you drag a long way to travel a short distance. setPointerCapture is supposed
    // to prevent that and does in Chromium, but relying on it is the bug: window listeners work
    // whether or not capture is honoured.
    addEventListener('pointermove', ev => {
      if (!drag) return;
      ev.preventDefault();
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
    addEventListener('pointerup', end, true);
    addEventListener('pointercancel', end, true);
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
