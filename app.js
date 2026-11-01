(function () {
  "use strict";

  var DEVICES = window.FOV_DEVICES;
  var HUMAN = DEVICES.filter(function (d) { return d.isReference; })[0];

  var MAX_WEIGHT_G = 600;
  var MAX_PPD = 70;
  var IDLE_MS = 60000;
  var ATTRACT_STEP_MS = 6000;
  var TWEEN_MS = 350;
  var CLOSEUP_W_DEG = 3;
  var CLOSEUP_H_DEG = 1.86;

  var COLOR_ACCENT = "#ffb547";
  var COLOR_HOLO = "#5fe3f2";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var el = {};
  ["stage", "view", "readout", "hint", "picker", "name", "type", "fact", "optics",
    "details", "compareTable",
    "fovValue", "fovFill", "weightValue", "weightFill", "weightTick",
    "ppdValue", "ppdFill", "ppdTick"].forEach(function (id) {
    el[id] = document.getElementById(id);
  });
  var ctx = el.view.getContext("2d");

  var state = {
    device: DEVICES[2],
    compare: false,
    attract: false,
    x: 0, y: 0,            // window centre, degrees
    w: DEVICES[2].fovH,    // window size, degrees (tweened)
    h: DEVICES[2].fovV
  };

  var geo = { W: 0, H: 0, dpr: 1, s: 1, cx: 0, cy: 0 };
  var layers = { room: null, holo: null, ghost: null };
  var closeups = {};
  var whalePoints = [];
  var tween = null;
  var dirty = true;
  var drag = null;
  var idleTimer = null;
  var attractTimer = null;
  var attractStart = 0;
  var lastReadout = null;
  var buttons = {};

  // --- Whale drawing, in degrees with (0,0) at the centre of vision ---

  function whalePath() {
    var p = new Path2D();
    p.moveTo(-45, -4);
    p.bezierCurveTo(-38, -20, -10, -24, 12, -16);
    p.bezierCurveTo(22, -12, 30, -7, 36, -6);
    p.bezierCurveTo(38, -12, 42, -18, 47, -20);
    p.bezierCurveTo(46, -12, 45, -7, 43, -4);
    p.bezierCurveTo(45, -1, 47, 3, 49, 7);
    p.bezierCurveTo(42, 4, 38, 1, 34, 0);
    p.bezierCurveTo(20, 8, 0, 16, -20, 13);
    p.bezierCurveTo(-33, 11, -42, 6, -45, -4);
    p.closePath();
    p.moveTo(-4, 11);
    p.bezierCurveTo(-2, 13, 0, 18, 2, 26);
    p.bezierCurveTo(-6, 24, -12, 18, -14, 11);
    p.closePath();
    return p;
  }

  function sampleWhale() {
    var probe = document.createElement("canvas").getContext("2d");
    var path = whalePath();
    var offset = 60;   // isPointInPath ignores points left of the canvas origin
    var shifted = new Path2D();
    shifted.addPath(path, new DOMMatrix().translate(offset, offset));
    probe.canvas.width = probe.canvas.height = 120;
    whalePoints = [];
    for (var y = -30; y <= 30; y += 1) {
      for (var x = -50; x <= 50; x += 1) {
        if (probe.isPointInPath(shifted, x + offset, y + offset)) whalePoints.push([x, y]);
      }
    }
  }

  // --- Cached layers, rebuilt only on resize ---

  function makeLayer() {
    var c = document.createElement("canvas");
    c.width = el.view.width;
    c.height = el.view.height;
    var g = c.getContext("2d");
    g.setTransform(geo.dpr * geo.s, 0, 0, geo.dpr * geo.s, geo.dpr * geo.cx, geo.dpr * geo.cy);
    return { canvas: c, g: g };
  }

  function visionEllipse(g) {
    g.beginPath();
    g.ellipse(0, 0, HUMAN.fovH / 2, HUMAN.fovV / 2, 0, 0, Math.PI * 2);
  }

  function buildRoom() {
    var l = makeLayer(), g = l.g;
    g.save();
    visionEllipse(g);
    g.clip();
    g.fillStyle = "#57636b";
    g.fillRect(-100, -68, 200, 136);
    g.fillStyle = "#3a3330";
    g.fillRect(-100, 34, 200, 34);
    g.fillStyle = "#2c3338";
    g.fillRect(-100, 32, 200, 2);

    frame(g, -82, -26, 26, 34, "#a5683f");
    frame(g, 54, -30, 34, 26, "#46729a");
    frame(g, -18, -44, 36, 14, "#7f8f5b");

    // Pedestal with a small sculpture
    g.fillStyle = "#c9ced1";
    g.fillRect(-46, 20, 16, 26);
    g.fillStyle = "#aab0b4";
    g.fillRect(-48, 18, 20, 3);
    g.fillStyle = "#8c6f4d";
    g.beginPath();
    g.ellipse(-38, 12, 5, 7, 0, 0, Math.PI * 2);
    g.fill();

    // Bench
    g.fillStyle = "#1f2529";
    g.fillRect(16, 42, 52, 4);
    g.fillRect(20, 46, 4, 10);
    g.fillRect(60, 46, 4, 10);
    g.restore();

    visionEllipse(g);
    g.strokeStyle = "rgba(242,245,247,0.35)";
    g.lineWidth = 0.5;
    g.stroke();
    layers.room = l.canvas;
  }

  function frame(g, x, y, w, h, color) {
    g.fillStyle = "#20262a";
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  }

  function buildHolo() {
    var l = makeLayer(), g = l.g, path = whalePath();
    var grad = g.createLinearGradient(0, -24, 0, 26);
    grad.addColorStop(0, "#2fb6d6");
    grad.addColorStop(1, "#b5f6fb");
    g.fillStyle = grad;
    g.fill(path);
    g.strokeStyle = "#e6fdff";
    g.lineWidth = 0.5;
    g.stroke(path);

    // Throat grooves
    g.strokeStyle = "rgba(10,60,80,0.55)";
    g.lineWidth = 0.45;
    [4, 7, 10].forEach(function (y) {
      g.beginPath();
      g.moveTo(-40 + y * 0.8, y - 2);
      g.quadraticCurveTo(-24, y + 3, -8, y + 1);
      g.stroke();
    });

    // Eye
    g.fillStyle = "#06303c";
    g.beginPath();
    g.arc(-31, -2, 1.3, 0, Math.PI * 2);
    g.fill();

    // Spots
    g.fillStyle = "rgba(235,255,255,0.65)";
    [[-14, -12], [-4, -14], [6, -11], [15, -9], [-8, -6], [3, -4], [22, -6]].forEach(function (s) {
      g.beginPath();
      g.arc(s[0], s[1], 1, 0, Math.PI * 2);
      g.fill();
    });
    layers.holo = l.canvas;
  }

  function buildGhost() {
    var l = makeLayer(), g = l.g;
    g.setLineDash([1.6, 1.4]);
    g.lineWidth = 0.45;
    g.strokeStyle = "rgba(95,227,242,0.7)";
    g.stroke(whalePath());
    layers.ghost = l.canvas;
  }

  function layout() {
    var r = el.stage.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    geo.W = r.width;
    geo.H = r.height;
    geo.dpr = Math.min(window.devicePixelRatio || 1, 2);
    geo.s = Math.min(geo.W / (HUMAN.fovH + 4), geo.H / (HUMAN.fovV + 4));
    geo.cx = geo.W / 2;
    geo.cy = geo.H / 2;
    el.view.width = Math.round(geo.W * geo.dpr);
    el.view.height = Math.round(geo.H * geo.dpr);
    buildRoom();
    buildHolo();
    buildGhost();
    dirty = true;
  }

  // --- Sharpness close-up: small text rendered at the device's real pixel density ---

  function closeupFor(ppd) {
    if (closeups[ppd]) return closeups[ppd];
    var c = document.createElement("canvas");
    c.width = Math.round(CLOSEUP_W_DEG * ppd);
    c.height = Math.round(CLOSEUP_H_DEG * ppd);
    var g = c.getContext("2d");
    g.fillStyle = "#08161b";
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = COLOR_HOLO;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "700 " + (0.62 * ppd) + "px system-ui, sans-serif";
    g.fillText("WHALE", c.width / 2, c.height * 0.36);
    g.font = (0.27 * ppd) + "px system-ui, sans-serif";
    g.fillText("Can you read this?", c.width / 2, c.height * 0.74);
    closeups[ppd] = c;
    return c;
  }

  function drawCloseup(d) {
    var w = Math.max(104, Math.min(geo.W * 0.26, 220));
    var h = w * CLOSEUP_H_DEG / CLOSEUP_W_DEG;
    var capH = 18;
    var x = geo.W - w - 6;
    var y = geo.H - h - capH - 6;
    var source = closeupFor(d.ppd);

    ctx.fillStyle = "#171e24";
    ctx.fillRect(x - 2, y - 2, w + 4, h + capH + 4);
    ctx.imageSmoothingEnabled = source.width > w * geo.dpr;
    ctx.drawImage(source, x, y + capH, w, h);
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = "#f2f5f7";
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Up close at " + (d.ppdAlt ? "measured " : "") + d.ppd + " PPD", x + 4, y + capH / 2, w - 8);
  }

  // --- Frame ---

  function draw() {
    var d = state.device, W = geo.W, H = geo.H, s = geo.s;
    ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (state.compare) {
      ctx.drawImage(layers.room, 0, 0, W, H);
      ctx.drawImage(layers.ghost, 0, 0, W, H);
      drawCompareOutlines();
      return;
    }

    if (d.seeThrough) {
      ctx.drawImage(layers.room, 0, 0, W, H);
      if (!d.isReference) ctx.drawImage(layers.ghost, 0, 0, W, H);
    }

    if (d.isReference) return;

    var px = geo.cx + (state.x - state.w / 2) * s;
    var py = geo.cy + (state.y - state.h / 2) * s;
    var pw = state.w * s;
    var ph = state.h * s;

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.fillStyle = d.seeThrough ? "rgba(95,227,242,0.08)" : "#0c2240";
    ctx.fillRect(px, py, pw, ph);
    ctx.drawImage(layers.holo, 0, 0, W, H);
    ctx.restore();

    ctx.strokeStyle = COLOR_ACCENT;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    var label = d.fovH + "° × " + d.fovV + "°";
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    var labelW = ctx.measureText(label).width + 10;
    var labelX = Math.max(labelW / 2, Math.min(W - labelW / 2, px + pw / 2));
    var labelY = py > 22 ? py - 11 : py + ph + 11;
    ctx.fillStyle = COLOR_ACCENT;
    ctx.fillRect(labelX - labelW / 2, labelY - 9, labelW, 18);
    ctx.fillStyle = "#1a1204";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelX, labelY + 1);

    drawCloseup(d);
  }

  function drawCompareOutlines() {
    var s = geo.s;
    var placements = {
      moverio: { dy: 0, inside: true },
      magicleap: { below: true, align: "right" },
      hololens: { above: true, align: "left" },
      quest3: { top: true }
    };
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    DEVICES.forEach(function (d) {
      if (d.isReference) return;
      var w = d.fovH * s, h = d.fovV * s;
      var x = geo.cx - w / 2, y = geo.cy - h / 2;
      ctx.strokeStyle = COLOR_ACCENT;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      var p = placements[d.id];
      var tx = geo.cx, ty = geo.cy, align = "center";
      if (p.below) { tx = x + w; ty = y + h + 11; align = "right"; }
      if (p.above) { tx = x; ty = y - 11; align = "left"; }
      if (p.top) { ty = y + 13; }
      if (p.inside) { ty = geo.cy; }
      compareLabel(d.shortName, tx, ty, align);
    });
  }

  function compareLabel(text, x, y, align) {
    var w = ctx.measureText(text).width + 8;
    var left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    ctx.fillStyle = "rgba(6,9,11,0.85)";
    ctx.fillRect(left, y - 9, w, 18);
    ctx.fillStyle = "#f2f5f7";
    ctx.textAlign = "left";
    ctx.fillText(text, left + 4, y + 1);
  }

  function whalePercentVisible() {
    var left = state.x - state.w / 2, right = state.x + state.w / 2;
    var top = state.y - state.h / 2, bottom = state.y + state.h / 2;
    var seen = 0;
    for (var i = 0; i < whalePoints.length; i++) {
      var p = whalePoints[i];
      if (p[0] >= left && p[0] <= right && p[1] >= top && p[1] <= bottom) seen++;
    }
    return Math.round(seen / whalePoints.length * 100);
  }

  function updateReadout() {
    var text;
    if (state.compare) {
      text = "All drawn to scale on your full view";
    } else if (state.device.isReference) {
      text = "No digital image, just your full natural view";
    } else {
      text = "You can see " + whalePercentVisible() + "% of the whale";
      if (!state.device.seeThrough) text += ". The room is blocked";
    }
    if (text !== lastReadout) {
      el.readout.textContent = text;
      lastReadout = text;
    }
  }

  function loop(now) {
    if (state.attract && !reducedMotion) {
      var t = (now - attractStart) / 1000;
      state.x = clampX(Math.sin(t * 0.9) * 26);
      state.y = clampY(Math.sin(t * 0.6) * 8);
      dirty = true;
    }
    if (tween) {
      var k = Math.min(1, (now - tween.start) / TWEEN_MS);
      var e = 1 - (1 - k) * (1 - k);
      state.w = tween.w0 + (tween.w1 - tween.w0) * e;
      state.h = tween.h0 + (tween.h1 - tween.h0) * e;
      state.x = clampX(state.x);
      state.y = clampY(state.y);
      if (k === 1) tween = null;
      dirty = true;
    }
    if (dirty) {
      dirty = false;
      draw();
      updateReadout();
    }
    requestAnimationFrame(loop);
  }

  function clampX(x) {
    var max = Math.max(0, (HUMAN.fovH - state.w) / 2);
    return Math.max(-max, Math.min(max, x));
  }

  function clampY(y) {
    var max = Math.max(0, (HUMAN.fovV - state.h) / 2);
    return Math.max(-max, Math.min(max, y));
  }

  // --- Panel ---

  function setMeter(fill, tick, value, tickValue, max) {
    fill.style.transform = "scaleX(" + Math.min(1, value / max) + ")";
    if (!tick) return;
    tick.hidden = tickValue == null;
    if (tickValue != null) tick.style.left = "calc(" + Math.min(100, tickValue / max * 100) + "% - 1.5px)";
  }

  function coverageLabel(d) {
    var pct = d.fovH * d.fovV / (HUMAN.fovH * HUMAN.fovV) * 100;
    return {
      pct: pct,
      text: d.isReference ? "All of it" : "~" + (pct < 10 ? pct.toFixed(1) : Math.round(pct)) + "% (" + d.fovH + "° × " + d.fovV + "°)"
    };
  }

  function renderPanel() {
    var d = state.device, cov = coverageLabel(d);
    el.details.hidden = false;
    el.compareTable.hidden = true;
    el.name.textContent = d.name;
    el.type.textContent = d.type;
    el.fact.textContent = d.fact;
    el.optics.textContent = d.optics;
    el.fovValue.textContent = cov.text;
    el.weightValue.textContent = d.weightLabel;
    el.ppdValue.textContent = d.ppdLabel;
    setMeter(el.fovFill, null, cov.pct, null, 100);
    setMeter(el.weightFill, el.weightTick, d.weightG || 0, d.weightAltG, MAX_WEIGHT_G);
    setMeter(el.ppdFill, el.ppdTick, d.ppd || 0, d.ppdAlt, MAX_PPD);
  }

  function renderComparePanel() {
    el.details.hidden = true;
    el.compareTable.hidden = false;
    el.name.textContent = "Compare all";
    el.type.textContent = "Sharpness uses measured values where available";
    el.fact.textContent = "As see-through headsets widen their view, they get heavier and less sharp.";
  }

  function buildCompareTable() {
    var rows = DEVICES.filter(function (d) { return !d.isReference; }).map(function (d) {
      return [d.shortName, d.fovH + "° × " + d.fovV + "°", d.weightG + " g", d.ppdShort];
    });
    [["Device", "View", "Weight", "PPD"]].concat(rows).forEach(function (row, i) {
      var tr = document.createElement("tr");
      row.forEach(function (text) {
        var cell = document.createElement(i === 0 ? "th" : "td");
        cell.textContent = text;
        tr.appendChild(cell);
      });
      el.compareTable.appendChild(tr);
    });
  }

  function renderPicker() {
    DEVICES.forEach(function (d) {
      buttons[d.id].setAttribute("aria-pressed", String(!state.compare && d === state.device));
    });
    buttons.compare.setAttribute("aria-pressed", String(state.compare));
  }

  function selectDevice(d, keepPosition) {
    state.device = d;
    state.compare = false;
    if (!keepPosition) { state.x = 0; state.y = 0; }
    if (reducedMotion) {
      state.w = d.fovH;
      state.h = d.fovV;
      tween = null;
    } else {
      tween = { start: performance.now(), w0: state.w, h0: state.h, w1: d.fovH, h1: d.fovV };
    }
    el.view.setAttribute("aria-label", d.name + " field of view: " + d.fovH + " by " + d.fovV + " degrees. Drag or use arrow keys to look around.");
    el.hint.classList.toggle("hidden", !!d.isReference);
    renderPanel();
    renderPicker();
    dirty = true;
  }

  function showCompare() {
    state.compare = true;
    el.hint.classList.add("hidden");
    el.view.setAttribute("aria-label", "All device fields of view drawn to scale inside human vision.");
    renderComparePanel();
    renderPicker();
    dirty = true;
  }

  function buildPicker() {
    DEVICES.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = d.shortName;
      b.addEventListener("click", function () { selectDevice(d); });
      buttons[d.id] = b;
      el.picker.appendChild(b);
    });
    var c = document.createElement("button");
    c.type = "button";
    c.className = "compare";
    c.textContent = "Compare all";
    c.addEventListener("click", showCompare);
    buttons.compare = c;
    el.picker.appendChild(c);
  }

  // --- Dragging the window ---

  el.view.addEventListener("pointerdown", function (e) {
    if (state.compare || state.device.isReference) return;
    el.view.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, px: e.clientX, py: e.clientY, x: state.x, y: state.y };
  });

  el.view.addEventListener("pointermove", function (e) {
    if (!drag || drag.id !== e.pointerId) return;
    state.x = clampX(drag.x + (e.clientX - drag.px) / geo.s);
    state.y = clampY(drag.y + (e.clientY - drag.py) / geo.s);
    el.hint.classList.add("hidden");
    dirty = true;
  });

  function endDrag(e) {
    if (drag && drag.id === e.pointerId) drag = null;
  }
  el.view.addEventListener("pointerup", endDrag);
  el.view.addEventListener("pointercancel", endDrag);

  el.view.addEventListener("keydown", function (e) {
    var step = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[e.key];
    if (!step || state.compare || state.device.isReference) return;
    e.preventDefault();
    state.x = clampX(state.x + step[0]);
    state.y = clampY(state.y + step[1]);
    el.hint.classList.add("hidden");
    dirty = true;
  });

  // --- Kiosk: attract loop while idle, reset when the next visitor arrives ---

  function startAttract() {
    state.attract = true;
    attractStart = performance.now();
    var order = DEVICES.filter(function (d) { return !d.isReference; });
    var i = 0;
    selectDevice(order[0]);
    el.hint.textContent = "Touch to try it";
    el.hint.classList.remove("hidden");
    clearInterval(attractTimer);
    attractTimer = setInterval(function () {
      i = (i + 1) % order.length;
      selectDevice(order[i], true);
      el.hint.classList.remove("hidden");
    }, ATTRACT_STEP_MS);
  }

  function stopAttract() {
    state.attract = false;
    clearInterval(attractTimer);
    el.hint.textContent = "Drag to look around";
    el.hint.classList.toggle("hidden", state.compare || !!state.device.isReference);
  }

  function noteActivity() {
    if (state.attract) stopAttract();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startAttract, IDLE_MS);
  }

  // Capture phase, so attract stops before a button or drag handler runs
  ["pointerdown", "keydown"].forEach(function (type) {
    window.addEventListener(type, noteActivity, true);
  });
  window.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  // --- Start. A #device-id in the URL skips the attract loop (handy for demos). ---

  sampleWhale();
  buildPicker();
  buildCompareTable();
  layout();
  if (window.ResizeObserver) {
    new ResizeObserver(layout).observe(el.stage);
  } else {
    window.addEventListener("resize", layout);
  }

  var hash = location.hash.slice(1);
  var start = DEVICES.filter(function (d) { return d.id === hash; })[0];
  if (start) {
    selectDevice(start);
    idleTimer = setTimeout(startAttract, IDLE_MS);
  } else if (hash === "compare") {
    selectDevice(state.device);
    showCompare();
    idleTimer = setTimeout(startAttract, IDLE_MS);
  } else {
    startAttract();
  }
  requestAnimationFrame(loop);
})();
