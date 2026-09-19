/*! Liquid Glass v1.0.0 | Developed by Samanway Koley | Copyright (c) 2026 Samanway Koley | MIT */
(function ($) {
  'use strict';
  if (!$ || ($.fn.liquidGlass && $.fn.liquidGlass.engine === 'image-refraction')) return;

  var NS = 'http://www.w3.org/2000/svg';
  var XLINK = 'http://www.w3.org/1999/xlink';
  var instances = new Map();
  var disabled = new WeakSet();
  var pending = new Set();
  var images = new Map();
  var maps = new Map();
  var frame = 0;
  var sequence = 0;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function readOptions(el) {
    var style = getComputedStyle(el);
    function value(name, fallback, min, max) {
      var n = parseFloat(style.getPropertyValue(name));
      return clamp(Number.isFinite(n) ? n : fallback, min, max);
    }
    var radius = style.borderTopLeftRadius.split(' ')[0];
    var size = Math.min(el.clientWidth, el.clientHeight);
    var r = parseFloat(radius) || 0;
    if (radius.indexOf('%') !== -1) r = size * r / 100;
    return {
      refraction: value('--lg-refraction', 120, 0, 300),
      chroma: value('--lg-chroma', 5, 0, 32),
      edge: value('--lg-edge', 0.08, 0.01, 0.45),
      curvature: value('--lg-curvature', 14, 0, 80),
      blur: value('--lg-blur', 2.5, 0, 60),
      saturate: value('--lg-saturate', 1.55, 0, 4),
      radius: Math.min(r, size / 2),
      source: style.getPropertyValue('--lg-source').trim().replace(/^['"]|['"]$/g, '')
    };
  }

  function findSource(el, selector) {
    if (selector === 'none') return null;
    if (selector && selector !== 'auto') {
      try {
        var explicit = document.querySelector(selector);
        if (explicit && explicit !== el && !el.contains(explicit)) return explicit;
      } catch (e) { /* Invalid selectors leave the regular gloss intact. */ }
    }
    for (var node = el.parentElement; node; node = node.parentElement) {
      if (getComputedStyle(node).backgroundImage !== 'none') return node;
    }
    return null;
  }

  function setStyle(el, key, value) {
    if (el.style[key] !== value) el.style[key] = value;
  }

  function svgNode(name, attributes) {
    var node = document.createElementNS(NS, name);
    Object.keys(attributes || {}).forEach(function (key) {
      node.setAttribute(key, String(attributes[key]));
    });
    return node;
  }

  // Encode a rounded lens's outward normals; negative scale samples inward.
  function displacementMap(w, h, o) {
    var key = [w, h, o.radius, o.edge, o.curvature].join('|');
    if (maps.has(key)) return maps.get(key);
    var ratio = Math.min(1.5, window.devicePixelRatio || 1, 1000 / Math.max(w, h));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(2, Math.round(w * ratio));
    canvas.height = Math.max(2, Math.round(h * ratio));
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable.');
    var pixels = ctx.createImageData(canvas.width, canvas.height);
    var band = Math.max(2, Math.min(w, h) * o.edge + o.curvature * 0.35);
    var r = o.radius;
    for (var y = 0; y < canvas.height; y++) {
      for (var x = 0; x < canvas.width; x++) {
        var px = (x + 0.5) / ratio - w / 2;
        var py = (y + 0.5) / ratio - h / 2;
        var qx = Math.abs(px) - w / 2 + r;
        var qy = Math.abs(py) - h / 2 + r;
        var cx = Math.max(qx, 0);
        var cy = Math.max(qy, 0);
        var length = Math.sqrt(cx * cx + cy * cy);
        var distance = length + Math.min(Math.max(qx, qy), 0) - r;
        var nx = 0;
        var ny = 0;
        if (length > 0.0001) {
          nx = cx / length;
          ny = cy / length;
        } else if (qx > qy) nx = 1;
        else ny = 1;
        nx *= px < 0 ? -1 : 1;
        ny *= py < 0 ? -1 : 1;
        var t = clamp(1 + distance / band, 0, 1);
        var strength = distance > 0 ? 0 : 100 * Math.pow(t, 1 + o.curvature / 24);
        var index = (y * canvas.width + x) * 4;
        pixels.data[index] = Math.round(128 + nx * strength);
        pixels.data[index + 1] = Math.round(128 + ny * strength);
        pixels.data[index + 2] = 128;
        pixels.data[index + 3] = 255;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    var result = canvas.toDataURL('image/png');
    if (maps.size >= 24) maps.delete(maps.keys().next().value);
    maps.set(key, result);
    return result;
  }

  function createFilter() {
    var id = 'lg-optics-' + Date.now().toString(36) + '-' + (++sequence);
    var svg = svgNode('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false', class: 'liquid-glass__definitions' });
    svg.style.cssText = 'position:fixed;width:0;height:0;left:0;top:0;overflow:hidden;pointer-events:none';
    var filter = svgNode('filter', { id: id, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
    var blur = svgNode('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 0, result: 'soft' });
    var saturate = svgNode('feColorMatrix', { in: 'soft', type: 'saturate', values: 1, result: 'scene' });
    var map = svgNode('feImage', { x: 0, y: 0, preserveAspectRatio: 'none', result: 'map' });
    filter.append(blur, saturate, map);
    var neutral = svgNode('feComponentTransfer', { in: 'map', result: 'normals' });
    neutral.append(
      svgNode('feFuncR', { type: 'linear', slope: 1, intercept: -0.5 / 255 }),
      svgNode('feFuncG', { type: 'linear', slope: 1, intercept: -0.5 / 255 })
    );
    filter.appendChild(neutral);
    var displacements = [];
    var matrices = [
      '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
      '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
      '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'
    ];
    for (var i = 0; i < 3; i++) {
      var displacement = svgNode('feDisplacementMap', { in: 'scene', in2: 'normals', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' + i });
      displacements.push(displacement);
      filter.append(displacement, svgNode('feColorMatrix', { in: 'd' + i, type: 'matrix', values: matrices[i], result: 'c' + i }));
    }
    filter.append(
      svgNode('feBlend', { in: 'c0', in2: 'c1', mode: 'screen', result: 'rg' }),
      svgNode('feBlend', { in: 'rg', in2: 'c2', mode: 'screen' })
    );
    svg.appendChild(filter);
    document.body.appendChild(svg);
    return { id: id, svg: svg, filter: filter, blur: blur, saturate: saturate, map: map, displacements: displacements };
  }

  function updateFilter(state, w, h, o) {
    var signature = [w, h, o.radius, o.refraction, o.chroma, o.edge, o.curvature, o.blur, o.saturate].join('|');
    if (state.signature === signature && state.filter) return;
    if (!state.filter) state.filter = createFilter();
    var f = state.filter;
    var bleed = Math.ceil(o.refraction / 2 + o.blur * 3 + o.chroma + 2);
    f.filter.setAttribute('x', String(-bleed));
    f.filter.setAttribute('y', String(-bleed));
    f.filter.setAttribute('width', String(w + bleed * 2));
    f.filter.setAttribute('height', String(h + bleed * 2));
    f.blur.setAttribute('stdDeviation', String(o.blur));
    f.saturate.setAttribute('values', String(o.saturate));
    f.map.setAttribute('width', String(w));
    f.map.setAttribute('height', String(h));
    var mapKey = [w, h, o.radius, o.edge, o.curvature].join('|');
    if (state.mapKey !== mapKey) {
      var data = displacementMap(w, h, o);
      f.map.setAttribute('href', data);
      f.map.setAttributeNS(XLINK, 'href', data);
      state.mapKey = mapKey;
    }
    f.displacements.forEach(function (node, i) {
      node.setAttribute('scale', String(-o.refraction + (i - 1) * o.chroma));
    });
    var url = window.location.href.split('#')[0] + '#' + f.id;
    // A regular filter processes the image plane in Safari, Firefox and Chrome.
    var filterValue = 'url("' + url.replace(/"/g, '%22') + '")';
    setStyle(state.image, 'filter', filterValue);
    setStyle(state.image, 'webkitFilter', filterValue);
    state.signature = signature;
  }

  function imageReady(url) {
    var cached = images.get(url);
    if (cached) return cached.ready;
    var image = new Image();
    cached = { ready: false, image: image };
    images.set(url, cached);
    image.onload = function () { cached.ready = true; scheduleAll(); };
    image.onerror = function () { cached.ready = false; };
    image.src = url;
    if (image.complete && image.naturalWidth > 0) cached.ready = true;
    return cached.ready;
  }

  function backgroundReady(background) {
    var pattern = /url\(\s*(["']?)(.*?)\1\s*\)/g;
    var match;
    var ready = true;
    while ((match = pattern.exec(background))) {
      if (!imageReady(match[2])) ready = false;
    }
    return ready;
  }

  function createState(el) {
    var optics = document.createElement('span');
    optics.className = 'liquid-glass__optics';
    optics.setAttribute('aria-hidden', 'true');
    var backdrop = document.createElement('span');
    backdrop.className = 'liquid-glass__backdrop';
    var image = document.createElement('span');
    image.className = 'liquid-glass__image';
    var scene = document.createElement('span');
    scene.className = 'liquid-glass__scene';
    image.appendChild(scene);
    optics.append(backdrop, image);
    el.prepend(optics);
    el.classList.add('lg-initialized');
    var state = { el: el, optics: optics, image: image, scene: scene, source: null, filter: null, signature: '', mapKey: '', observer: null };
    if (window.ResizeObserver) {
      state.observer = new ResizeObserver(function () { schedule(el); });
      state.observer.observe(el);
    }
    instances.set(el, state);
    return state;
  }

  function alignScene(state, source) {
    var style = getComputedStyle(source);
    var isImage = source.tagName === 'IMG';
    var fixed = !isImage && style.backgroundAttachment.split(',').every(function (value) { return value.trim() === 'fixed'; });
    var rect = fixed ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } : source.getBoundingClientRect();
    var w = fixed ? window.innerWidth : source.offsetWidth;
    var h = fixed ? window.innerHeight : source.offsetHeight;
    var lensRect = state.optics.getBoundingClientRect();
    var sx = lensRect.width / state.optics.clientWidth;
    var sy = lensRect.height / state.optics.clientHeight;
    if (!w || !h || !sx || !sy) return false;
    var ownStyle = state.scene.style;
    setStyle(state.scene, 'width', w + 'px');
    setStyle(state.scene, 'height', h + 'px');
    setStyle(state.scene, 'left', ((rect.left - lensRect.left) / sx) + 'px');
    setStyle(state.scene, 'top', ((rect.top - lensRect.top) / sy) + 'px');
    setStyle(state.scene, 'transform', 'scale(' + (rect.width / w / sx) + ',' + (rect.height / h / sy) + ')');

    if (isImage) {
      var url = source.currentSrc || source.src;
      if (!state.scene.firstElementChild) {
        var copy = document.createElement('img');
        copy.alt = '';
        copy.draggable = false;
        state.scene.appendChild(copy);
      }
      var img = state.scene.firstElementChild;
      if (img.getAttribute('src') !== url) img.setAttribute('src', url);
      img.style.objectFit = style.objectFit;
      img.style.objectPosition = style.objectPosition;
      ownStyle.backgroundImage = 'none';
      ownStyle.backgroundColor = 'transparent';
      ownStyle.borderWidth = '0px';
      ownStyle.padding = '0px';
      return source.complete && source.naturalWidth > 0;
    }

    if (state.scene.firstElementChild) state.scene.replaceChildren();
    ['backgroundImage', 'backgroundColor', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundOrigin', 'backgroundClip', 'backgroundBlendMode'].forEach(function (key) {
      setStyle(state.scene, key, style[key]);
    });
    setStyle(state.scene, 'backgroundAttachment', 'scroll');
    setStyle(state.scene, 'borderWidth', fixed ? '0px' : style.borderWidth);
    setStyle(state.scene, 'padding', fixed ? '0px' : style.padding);
    return style.backgroundImage !== 'none' && backgroundReady(style.backgroundImage);
  }

  function render(el) {
    if (disabled.has(el) || !el.isConnected || !el.classList.contains('liquid-glass')) {
      teardown(el);
      return;
    }
    var state = instances.get(el) || createState(el);
    var o = readOptions(el);
    var source = findSource(el, o.source);
    if (source !== state.source) {
      if (state.observer && state.source) state.observer.unobserve(state.source);
      state.source = source;
      if (state.observer && source) state.observer.observe(source);
    }
    var w = state.optics.clientWidth;
    var h = state.optics.clientHeight;
    var ready = false;
    if (source && w > 1 && h > 1) {
      try {
        ready = alignScene(state, source);
        if (ready) updateFilter(state, w, h, o);
      } catch (error) {
        ready = false;
        if (!state.warned) {
          console.warn('Liquid Glass: image refraction is unavailable; the gloss layers remain active.', error);
          state.warned = true;
        }
      }
    }
    if (el.classList.contains('lg-image-ready') !== ready) el.classList.toggle('lg-image-ready', ready);
  }

  function schedule(el) {
    if (!el || el.nodeType !== 1 || disabled.has(el)) return;
    pending.add(el);
    if (!frame) frame = requestAnimationFrame(flush);
  }

  function scheduleAll() {
    instances.forEach(function (state, el) { schedule(el); });
  }

  function flush() {
    frame = 0;
    var list = Array.from(pending);
    pending.clear();
    list.forEach(render);
    instances.forEach(function (state, el) { if (!el.isConnected) teardown(el); });
  }

  function teardown(el) {
    var state = instances.get(el);
    if (!state) return;
    if (state.observer) state.observer.disconnect();
    if (state.filter) state.filter.svg.remove();
    state.optics.remove();
    instances.delete(el);
    el.classList.remove('lg-initialized', 'lg-image-ready');
  }

  function scan(root) {
    if (root.nodeType === 1 && root.matches('.liquid-glass')) schedule(root);
    if (root.querySelectorAll) root.querySelectorAll('.liquid-glass').forEach(schedule);
  }

  function internal(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    return el && el.closest('.liquid-glass__optics, .liquid-glass__definitions');
  }

  $.fn.liquidGlass = function (action) {
    return this.each(function () {
      if (action === 'destroy') {
        disabled.add(this);
        teardown(this);
      } else {
        disabled.delete(this);
        this.classList.add('liquid-glass');
        schedule(this);
      }
    });
  };
  $.fn.liquidGlass.version = '1.0.0';
  $.fn.liquidGlass.engine = 'image-refraction';

  $(function () {
    scan(document);
    if (window.MutationObserver) {
      new MutationObserver(function (records) {
        var changed = false;
        records.forEach(function (record) {
          if (internal(record.target)) return;
          if (record.type === 'childList') {
            record.addedNodes.forEach(function (node) { if (!internal(node)) { scan(node); changed = true; } });
            record.removedNodes.forEach(function (node) { if (!internal(node)) changed = true; });
          } else changed = true;
          if (record.type === 'attributes' && record.target.classList.contains('liquid-glass')) schedule(record.target);
        });
        if (changed) scheduleAll();
      }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'src', 'href', 'media'] });
    }
    window.addEventListener('resize', scheduleAll, { passive: true });
    window.addEventListener('scroll', scheduleAll, { passive: true, capture: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleAll, { passive: true });
      window.visualViewport.addEventListener('scroll', scheduleAll, { passive: true });
    }
    document.addEventListener('load', scheduleAll, true);
    // Covers stylesheet/CSSOM edits and CSS-only state changes without a render loop.
    window.setInterval(function () {
      if (!document.hidden && instances.size) scheduleAll();
    }, 350);
  });
})(window.jQuery);