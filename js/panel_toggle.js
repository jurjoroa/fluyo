/* panel_toggle.js — collapse the SELECTION inspector to get the canvas back.
 *
 * WHY
 * The inspector is a fixed column that is only useful while you are EDITING. Reading a diagram —
 * which is what a generated one is for — it is a few hundred pixels of "Nothing selected" and a
 * list of keyboard shortcuts sitting where the drawing wants to be. On a wide diagram that is the
 * difference between fitting a page and scrolling it.
 *
 * The toggle is persisted: someone reading diagrams keeps it shut, someone drawing keeps it open,
 * and neither should have to say so twice.
 *
 * HOW IT STAYS OUT OF UPSTREAM'S WAY
 * Its own file, and it hides rather than removes — every upstream handler that writes into the
 * panel keeps working while it is shut, so reopening shows current state rather than a stale
 * snapshot.
 */
(function () {
  'use strict';

  const KEY = 'fluyo.panelHidden';

  function build() {
    const panel = document.getElementById('propPanel');
    if (!panel || document.getElementById('panelT')) return;

    const style = document.createElement('style');
    style.textContent = `
      body.panelHid #propPanel{display:none}
      #panelT{position:fixed;right:0;top:12px;z-index:36;width:26px;height:26px;border:0;
        border-radius:7px 0 0 7px;background:var(--panel);color:var(--text,#d8dae0);
        cursor:pointer;font-size:13px;line-height:26px;padding:0;
        border-left:1px solid var(--line)}
      #panelT:hover{filter:brightness(1.25)}`;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'panelT';
    document.body.appendChild(btn);

    function apply(hidden) {
      document.body.classList.toggle('panelHid', hidden);
      btn.textContent = hidden ? '‹' : '›';
      btn.title = hidden ? 'Show the selection panel' : 'Hide the selection panel — more canvas';
      localStorage.setItem(KEY, hidden ? '1' : '0');
      // The canvas sizes itself from its container, so it has to be told the container changed.
      window.dispatchEvent(new Event('resize'));
    }

    btn.onclick = () => apply(!document.body.classList.contains('panelHid'));
    apply(localStorage.getItem(KEY) === '1');

    addEventListener('keydown', ev => {
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      // `\` — next to Enter, unused here, and it reads as "fold this away".
      if (ev.key === '\\') { ev.preventDefault(); btn.onclick(); }
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
