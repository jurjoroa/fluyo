/* i18n.js — runtime English translation layer.
 *
 * WHY IT WORKS THIS WAY
 * The editor's copy is hardcoded Spanish across index.html and a few JS files. The obvious fix is
 * to rewrite the markup with data-i18n keys — but that touches nearly every line of upstream's
 * HTML and makes every future merge from itsnect/fluyo a conflict.
 *
 * Instead this walks the DOM once at boot and swaps text nodes and attributes against a
 * dictionary. Upstream markup stays untouched, `git pull` stays clean, and adding a language is
 * one object. The cost is that a string upstream changes will silently stop translating — so
 * `missing()` logs anything Spanish-looking it could not match, which is how the dictionary
 * gets maintained rather than rotting.
 *
 * Language: ?lang=es to force Spanish, otherwise English. Choice persists in localStorage.
 */
(function () {
  'use strict';

  const ES2EN = {
    // ── top bar
    'Ejemplo': 'Example', 'Ejemplos': 'Examples', 'Limpiar página': 'Clear page',
    'Fondo oscuro': 'Dark', 'Fondo crema': 'Cream', 'Fondo claro': 'Light',
    'Fondo': 'Background', 'Cuadrícula': 'Grid', 'Ajustar a rejilla': 'Snap to grid',
    '⏸ Pausa': '⏸ Pause', '▶ Presentar': '▶ Present', '💾 Guardar': '💾 Save',
    '📂 Abrir': '📂 Open', '⬇ Exportar': '⬇ Export',
    'Pausa': 'Pause', 'Presentar': 'Present', 'Guardar': 'Save', 'Abrir': 'Open',
    'Exportar': 'Export', 'Reanudar': 'Resume',

    // ── left toolbar
    'Mover': 'Select', 'Flecha': 'Arrow', 'Caja': 'Box', 'BD': 'DB', 'Rombo': 'Diamond',
    'Círculo': 'Circle', 'Hex': 'Hex', 'Texto': 'Text', 'Código': 'Code',
    'Iconos': 'Icons', 'Imagen': 'Image', 'GIFs': 'GIFs',

    // ── right panel
    'Selección': 'Selection', 'Nada seleccionado.': 'Nothing selected.',
    'Animación': 'Animation', 'Velocidad de flujo': 'Flow speed',
    'Puntos por flecha': 'Dots per arrow', 'Una pelota por ruta': 'One ball per route',
    'Animar aparición': 'Animate build-in', 'Intervalo aparición': 'Build-in interval',
    'Fondo del panel': 'Panel background', 'Relleno de la forma': 'Shape fill',
    'Color': 'Colour', 'Borde': 'Border', 'Fuente': 'Font', 'Negrita': 'Bold',
    'Pulso': 'Pulse', 'Orden': 'Order', 'Etiqueta': 'Label', 'Ancho': 'Width',
    'Alto': 'Height', 'Forma': 'Shape', 'Icono': 'Icon',

    // ── help text
    'Rueda ratón': 'Mouse wheel', 'Ctrl+Rueda': 'Ctrl+Wheel', 'mover ·': 'pan ·', 'zoom.': 'zoom.',
    'Clic derecho': 'Right-click', 'Clic central': 'Middle-click',
    'Alt+Arrastrar': 'Alt+Drag', 'para pan.': 'to pan.',
    'un dedo': 'one finger', 'mueve el plano,': 'moves the canvas,',
    'dos dedos': 'two fingers', 'hacen zoom, doble toque edita.': 'zoom, double-tap edits.',
    'arrastra una flecha azul': 'drag the blue arrow', 'para conectar.': 'to connect.',
    'Arrastra en el vacío': 'Drag on empty space',
    'para seleccionar varios;': 'to select several;',
    '+clic suma o quita.': '+click adds or removes.',
    'copiar ·': 'copy ·', 'cortar ·': 'cut ·', 'pegar ·': 'paste ·',
    'duplicar ·': 'duplicate ·', 'todo.': 'all.', 'deshacer ·': 'undo ·',
    'rehacer.': 'redo.', 'borra.': 'deletes.', 'cancela.': 'cancels.',
    'Supr': 'Del',
    'presenta a pantalla completa;': 'presents full screen;',
    'cambian de página.': 'change page.',
    'puntos huecos': 'hollow points',
    'Forma del menú izquierdo → clic en el lienzo.':
      'Pick a shape on the left, then click the canvas.',
    'Pasa el mouse sobre un nodo (o selecciónalo) y':
      'Hover a node (or select it) and',
    'Con una flecha seleccionada, arrastra los': 'With an arrow selected, drag its',
    'para doblarla; doble clic en un codo lo elimina.':
      'to bend it; double-click an elbow to remove it.',
    'Pega imágenes con': 'Paste images with',
    'Doble clic = editar texto.': 'Double-click = edit text.',

    // ── animation help
    'La aparición usa el «orden» de cada nodo. Las flechas aparecen cuando ambos nodos son visibles.':
      'Build-in uses each node’s “order”. Arrows appear once both nodes are visible.',

    // ── dialogs / toasts (js/export.js, js/state.js)
    'Página 1': 'Page 1', 'Página': 'Page', 'Nueva página': 'New page',
    'El archivo no es un diagrama Fluyo válido.': 'That file is not a valid Fluyo diagram.',
    'No se pudo restaurar la sesión guardada.': 'Could not restore the saved session.',
    '¿Borrar todo el contenido de esta página?': 'Delete everything on this page?',
    'Sesión guardada': 'Saved session', 'Restaurar': 'Restore', 'Descartar': 'Discard',
    'Éxito anim': 'Success anim',

    // ── footer
    'Docs': 'Docs', 'Privacidad': 'Privacy', 'Soporte': 'Support', 'Términos': 'Terms',
    'Contribuye en GitHub': 'Contribute on GitHub',

    // ── panel controls, tooltips and long help copy
    'El loop de flujo se ajusta solo para que el GIF sea cíclico. La transparencia en GIF es de bordes duros (limitación del formato); para bordes suaves usa PNG.': 'The flow loop self-adjusts so the GIF cycles cleanly. GIF transparency is hard-edged (a format limitation); for soft edges export PNG.',
    'Una sola pelota recorre la cadena entera (nodo 1 → nodo 2 → nodo 3) en vez de puntos sueltos en cada flecha; en las bifurcaciones se parte y sigue por todas las ramas': 'A single ball travels the whole chain (node 1 → node 2 → node 3) instead of loose dots on each arrow; at a branch it splits and follows every route',
    'Elige una forma o icono a la izquierda y haz clic aquí — o pulsa «Ejemplo»':
      'Pick a shape or icon on the left and click here — or hit “Example”',
    'o': 'or',
    'Éxito': 'Success',
    'Móvil': 'Mobile',
    'Búsqueda': 'Search',
    'Mensajería': 'Messaging',
    'Integración': 'Integration',
    'Métricas': 'Metrics',
    'Almacén': 'Store',
    'Hexágono': 'Hexagon',
    'Base de datos': 'Database',
    'Decisión': 'Decision',
    'Solo texto': 'Text only',
    'Se animan en el lienzo y en el GIF exportado. Cambia su color desde el panel.': 'They animate on the canvas and in the exported GIF. Change their colour in the panel.',
    'Forma del menú izquierdo → clic en el lienzo.': 'Pick a shape on the left, then click the canvas.',
    'Táctil:': 'Touch:',
    'Pasa el mouse sobre un nodo (o selecciónalo) y': 'Hover a node (or select it) and',
    'Doble clic = editar texto.': 'Double-click = edit text.',
    'Con una flecha seleccionada, arrastra los': 'With an arrow selected, drag the',
    'Pega imágenes con': 'Paste images with',
    'Texto (Enter = nueva línea)': 'Text (Enter = new line)',
    'Tamaño de texto': 'Text size',
    'Tipografía': 'Font',
    'Color del texto': 'Text colour',
    'Color de línea / borde': 'Line / border colour',
    'Teñir el icono con el color': 'Tint the icon with the colour',
    'Estilo de borde': 'Border style',
    'Sólido —': 'Solid —',
    'Posición del texto': 'Text position',
    'Fondo del texto': 'Text background',
    'Lista propia (separadas por espacios o comas)': 'Custom list (space or comma separated)',
    'Fondo del resaltado': 'Highlight background',
    'Texto del resaltado': 'Highlight text',
    '⬇ Al fondo': '⬇ To back',
    'Orden de aparición': 'Build-in order',
    'Sale por': 'Exits via',
    'Entra por': 'Enters via',
    'Puntos (esta flecha)': 'Dots (this arrow)',
    'Color de línea': 'Line colour',
    'Color de puntos': 'Dot colour',
    'Línea punteada': 'Dashed line',
    'Flujo de puntos': 'Dot flow',
    'Con «una pelota por ruta» las flechas se encadenan: sale una pelota de cada nodo de origen y recorre el diagrama entero. Al llegar a un nodo que se abre en varias ramas, la pelota se parte y sigue por todas a la vez.': 'With “one ball per route” the arrows chain up: a ball leaves each source node and travels the whole diagram. Where a node branches, the ball splits and follows every branch at once.',
    'Úsalo con tu IA vía MCP': 'Use it with your AI via MCP',
    'Exportar página actual': 'Export current page',
    'Fondo transparente': 'Transparent background',
    'Duración (s)': 'Duration (s)',
    'Se encontró una sesión guardada localmente. ¿Quieres restaurarla?': 'A locally saved session was found. Restore it?',
    'Tema del lienzo': 'Canvas theme',
    'Tipografía global — cambia la fuente de todo el diagrama': 'Global font — changes the whole diagram',
    'Ajustar el movimiento a la cuadrícula (desactivado = movimiento libre)': 'Snap movement to the grid (off = free movement)',
    'Color de fondo personalizado del lienzo': 'Custom canvas background colour',
    'Quitar fondo personalizado': 'Remove custom background',
    'Modo presentación (P): pantalla completa, una página por diapositiva': 'Presentation mode (P): full screen, one page per slide',
    'Guardar archivo .fluyo.json (Ctrl+S)': 'Save .fluyo.json file (Ctrl+S)',
    'Abrir archivo guardado': 'Open a saved file',
    'Propiedades de la selección': 'Selection properties',
    'Conectar con clics (C)': 'Connect by clicking (C)',
    'Bloque de código con palabras clave resaltadas': 'Code block with highlighted keywords',
    'Insertar imagen (o pega con Ctrl+V)': 'Insert image (or paste with Ctrl+V)',
    'GIFs animados (cargando, error, éxito…)': 'Animated GIFs (loading, error, success…)',
    'Editar texto': 'Edit text',
    'Automático (según la forma y el tema)': 'Automatic (from shape and theme)',
    'Color de texto personalizado': 'Custom text colour',
    'Color de línea o borde': 'Line or border colour',
    'Color personalizado del borde': 'Custom border colour',
    'Cuentagotas: tomar un color del lienzo': 'Eyedropper: pick a colour from the canvas',
    'Automático (semitransparente)': 'Automatic (semi-transparent)',
    'Color de relleno personalizado': 'Custom fill colour',
    'Sin fondo': 'No background',
    'Fondo de texto personalizado': 'Custom text background',
    'Del tema': 'From theme',
    'Fondo de resaltado personalizado': 'Custom highlight background',
    'Color de texto del resaltado personalizado': 'Custom highlight text colour',
    'Enviar al fondo': 'Send to back',
    'Subir una capa': 'Bring forward',
    'Bajar una capa': 'Send backward',
    'Color de línea de la flecha': 'Arrow line colour',
    'Color de línea personalizado': 'Custom line colour',
    'Color de los puntos animados': 'Animated dot colour',
    'Color de puntos personalizado': 'Custom dot colour',
    'Enlaces del proyecto': 'Project links',
    'Salir de la presentación (Esc)': 'Exit presentation (Esc)',
    'Salir de la presentación': 'Exit presentation',
    'Fluyo es libre y de código abierto. ¡Tu contribución es bienvenida! ⭐':
      'Fluyo is free and open source. Contributions welcome! ⭐',
  };

  const params = new URLSearchParams(location.search);
  const forced = params.get('lang');
  if (forced) { try { localStorage.setItem('fluyo.lang', forced); } catch (e) {} }
  let LANG = forced || (() => { try { return localStorage.getItem('fluyo.lang'); } catch (e) { return null; } })() || 'en';

  const SPANISH = /[áéíóúñ¿¡ÁÉÍÓÚÑ]|\b(el|la|los|las|una?|del?|con|para|por|que|más|página|flecha|guardar|abrir|cerrar|fondo|texto)\b/i;
  const missing = new Set();

  // Whitespace-insensitive index. HTML wraps long help copy across lines, so the text node the
  // walker sees has newlines and runs of spaces the dictionary key does not. Two long paragraphs
  // stayed Spanish purely because of that.
  const NORM = new Map();
  const squash = x => x.replace(/\s+/g, ' ').trim();
  for (const [k, v] of Object.entries(ES2EN)) NORM.set(squash(k), v);

  function tr(s) {
    if (!s) return s;
    // Strip a leading bullet or marker before lookup: several strings render as "• Foo" and the
    // dictionary should key on "Foo", not on the decoration around it.
    const key = s.trim().replace(/^[•·▸\-–—]\s*/, '');
    if (!key) return s;
    if (Object.prototype.hasOwnProperty.call(ES2EN, key)) {
      return s.replace(key, ES2EN[key]);
    }
    const hit = NORM.get(squash(key));
    if (hit) return s.replace(key, hit);
    if (SPANISH.test(key) && key.length > 2) missing.add(key);
    return s;
  }

  function walk(root) {
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (it.nextNode()) nodes.push(it.currentNode);
    for (const n of nodes) {
      const p = n.parentElement;
      if (!p || p.tagName === 'SCRIPT' || p.tagName === 'STYLE') continue;
      const out = tr(n.nodeValue);
      if (out !== n.nodeValue) n.nodeValue = out;
    }
    for (const el of root.querySelectorAll('[title],[placeholder],[aria-label],[data-tip]')) {
      for (const a of ['title', 'placeholder', 'aria-label', 'data-tip']) {
        const v = el.getAttribute(a);
        if (v) { const o = tr(v); if (o !== v) el.setAttribute(a, o); }
      }
    }
    for (const o of root.querySelectorAll('option')) {
      const t = tr(o.textContent); if (t !== o.textContent) o.textContent = t;
    }
  }

  function apply() {
    if (LANG !== 'en') return;
    walk(document.body);
    document.documentElement.lang = 'en';
    // The right panel and page tabs are re-rendered by the app, so re-translate on change.
    const mo = new MutationObserver(ms => {
      for (const m of ms) for (const n of m.addedNodes) {
        if (n.nodeType === 1) walk(n);
        else if (n.nodeType === 3) { const o = tr(n.nodeValue); if (o !== n.nodeValue) n.nodeValue = o; }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    if (missing.size) {
      console.info('[i18n] %d untranslated Spanish string(s) — add them to ES2EN in js/i18n.js:',
                   missing.size, [...missing]);
    }
  }

  // Canvas text is painted with fillText and never enters the DOM, so the walker cannot reach it.
  // Exposing the translator lets those call sites opt in explicitly.
  window.fluyoT = s => (LANG === 'en' ? tr(s) : s);

  window.fluyoI18n = {
    get lang() { return LANG; },
    set(l) { try { localStorage.setItem('fluyo.lang', l); } catch (e) {} location.reload(); },
    missing: () => [...missing],
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
