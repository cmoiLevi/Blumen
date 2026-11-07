const cv = document.getElementById("c"), ctx = cv.getContext("2d");
const LW = 400, LH = 500;          // "logische" Größe der Zeichnung
const TAU = 6.283;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const BASE = { x: 200, y: 400 };   // Punkt, an dem alle Stiele zusammenlaufen

// Blume: Kopf-x, Kopf-y, Größe, Sorte, Blütenblätter, Farbe, Mitte, Verzögerung (s), Biegung
const FLOWERS = [
  [200,  85, 48, "rose",  0,  "#e63946", "",        0.30,   8],
  [135, 110, 42, "daisy", 10, "#ffffff", "#f4a300", 0.55, -35],
  [265, 110, 42, "daisy", 9,  "#ffd166", "#7b4a1e", 0.80,  35],
  [ 85, 170, 40, "tulip", 0,  "#ff7aa2", "",        1.05, -45],
  [315, 170, 40, "tulip", 0,  "#b57bee", "",        1.30,  45],
  [160, 175, 46, "rose",  0,  "#ff9f1c", "",        1.55, -20],
  [240, 175, 44, "daisy", 12, "#4cc9f0", "#fff3b0", 1.80,  20],
  [120, 235, 38, "daisy", 8,  "#ef476f", "#ffd166", 2.05, -35],
  [200, 215, 42, "tulip", 0,  "#ffb703", "",        2.30,   0],
  [280, 235, 38, "rose",  0,  "#c77dff", "",        2.55,  35]
].sort((a, b) => a[1] - b[1]);     // untere Blumen werden zuletzt gemalt, also vorne

// Schleierkraut: Kopf-x, Kopf-y, Verzögerung, Biegung
const FILLER = [[70, 215, 0.9, -30], [330, 215, 1.4, 30], [105, 70, 0.6, -20],
  [295, 70, 1.0, 20], [200, 35, 0.4, 0], [170, 140, 1.7, -10]];
// Große Blätter am Papierrand: Winkel, Länge, Verzögerung
const LEAVES = [[-2.7, 95, 0.1], [-2.35, 115, 0.2], [-1.95, 100, 0.3],
  [-1.2, 100, 0.3], [-0.8, 115, 0.2], [-0.45, 95, 0.1]];

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
const bez = (p0, c, p1, s) => ({
  x: (1 - s) * (1 - s) * p0.x + 2 * (1 - s) * s * c.x + s * s * p1.x,
  y: (1 - s) * (1 - s) * p0.y + 2 * (1 - s) * s * c.y + s * s * p1.y
});
const curve = (end, bend) => ({ x: (BASE.x + end.x) / 2 + bend, y: (BASE.y + end.y) / 2 + 20 });

function resize() {
  const dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect();
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  ctx.setTransform(cv.width / LW, 0, 0, cv.height / LH, 0, 0);
}

function stem(ctrl, end, g, w) {
  ctx.strokeStyle = "#3d9a50"; ctx.lineWidth = w; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(BASE.x, BASE.y);
  for (let s = 0.04; s <= g + 0.001; s += 0.04) {
    const p = bez(BASE, ctrl, end, Math.min(s, g)); ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

function leaf(x, y, ang, len, k, color) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(len * k * 0.5, 0, len * k * 0.5, len * k * 0.22, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * k * 0.95, 0); ctx.stroke();   // Blattader
  ctx.restore();
}

function sprig(p, k) {
  for (let j = 0; j < 8; j++) {
    const a = j * 2.4, r = (6 + j * 2.2) * k;
    ctx.fillStyle = "#f3ecff"; ctx.strokeStyle = "rgba(120,100,160,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 3.5 * k, 0, TAU);
    ctx.fill(); ctx.stroke();
  }
}

function daisy(size, n, col, mid, b) {
  for (let i = 0; i < n; i++) {
    ctx.save(); ctx.rotate(i * TAU / n);
    ctx.fillStyle = col; ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -size * 0.55 * b, size * 0.24 * b, size * 0.5 * b, 0, 0, TAU);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = mid;
  ctx.beginPath(); ctx.arc(0, 0, size * 0.22 * (0.4 + 0.6 * b), 0, TAU); ctx.fill();
}

function rose(size, col, b) {
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    ctx.arc(k % 2 ? 2 : -2, k * 1.5 - 3, size * (0.52 - k * 0.1) * b, 0, TAU);
    ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = k % 2 ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.14)"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.22)"; ctx.lineWidth = 1; ctx.stroke();
  }
}

function tulip(size, col, b) {
  const w = size * 0.62 * b, h = size * 1.1 * b;
  const cup = (rot, shade) => {
    ctx.save(); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(-w * 0.75, -h * 0.6, 0, -h);
    ctx.quadraticCurveTo(w * 0.75, -h * 0.6, w / 2, 0);
    ctx.quadraticCurveTo(0, h * 0.15, -w / 2, 0);
    ctx.fillStyle = col; ctx.fill();
    if (shade) { ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.fill(); }
    ctx.strokeStyle = "rgba(0,0,0,.2)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  };
  cup(-0.45 * b, true); cup(0.45 * b, true); cup(0, false);
}

function bloom([, , size, type, n, col, mid], p, b, i) {
  ctx.save(); ctx.translate(p.x, p.y);
  if (type === "tulip") tulip(size, col, b);
  else {
    ctx.rotate(i + b * 0.5);   // leichte Drehung beim Öffnen
    if (type === "rose") rose(size, col, b); else daisy(size, n, col, mid, b);
  }
  ctx.restore();
}

// Papier: Rückseite hinter den Stielen, Vorderseite davor
function paperFrontPath() {
  ctx.beginPath(); ctx.moveTo(96, 310); ctx.lineTo(200, 345); ctx.lineTo(304, 310);
  ctx.lineTo(214, 478); ctx.lineTo(186, 478); ctx.closePath();
}
function paperBack() {
  ctx.fillStyle = "#b98d5f";
  ctx.beginPath(); ctx.moveTo(108, 325); ctx.lineTo(292, 325); ctx.lineTo(214, 470); ctx.lineTo(186, 470);
  ctx.closePath(); ctx.fill();
}
function paperFront() {
  paperFrontPath(); ctx.fillStyle = "#e2b783"; ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.18)";                       // Falte
  ctx.beginPath(); ctx.moveTo(200, 345); ctx.lineTo(304, 310); ctx.lineTo(214, 478); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(200, 345); ctx.lineTo(200, 478); ctx.stroke();
  paperFrontPath(); ctx.stroke();
  ctx.save(); paperFrontPath(); ctx.clip();                       // Band nur auf dem Papier
  ctx.fillStyle = "#d62839";
  ctx.beginPath(); ctx.moveTo(130, 388); ctx.quadraticCurveTo(200, 404, 270, 388);
  ctx.lineTo(270, 402); ctx.quadraticCurveTo(200, 418, 130, 402); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function bow(s) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(200, 401); ctx.scale(s, s);
  ctx.fillStyle = "#d62839"; ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1;
  [[-22, -0.5], [22, 0.5]].forEach(([x, r]) => {
    ctx.beginPath(); ctx.ellipse(x, 0, 20, 11, r, 0, TAU); ctx.fill(); ctx.stroke();
  });
  [[-1, 1], [1, 1]].forEach(([dir]) => {
    ctx.beginPath(); ctx.moveTo(dir * 2, 3); ctx.lineTo(dir * 24, 44); ctx.lineTo(dir * 14, 46);
    ctx.lineTo(dir * -2, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fillStyle = "#b01e2e"; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function draw(t) {
  ctx.clearRect(0, 0, LW, LH);
  const pa = ease(t / 0.9);                                       // Papier gleitet ein
  const paper = (fn) => { ctx.save(); ctx.globalAlpha = pa; ctx.translate(0, (1 - pa) * 60); fn(); ctx.restore(); };

  paper(paperBack);

  LEAVES.forEach(([ang, len, d]) => leaf(200, 345, ang, len, ease((t - d) / 1.2), "#2e7d46"));

  FILLER.forEach(([hx, hy, d, bend]) => {
    const g = ease((t - d) / 1.3);
    if (g <= 0) return;
    const end = { x: hx, y: hy }, ctrl = curve(end, bend);
    stem(ctrl, end, g, 2);
    sprig(bez(BASE, ctrl, end, g), ease((t - d - 0.8) / 1.2));
  });

  const heads = [];
  FLOWERS.forEach((f, i) => {
    const [hx, hy, size, type, , , , d, bend] = f;
    const g = ease((t - d) / 1.3);
    if (g <= 0) return;
    const sway = calm ? 0 : Math.sin(t * 1.3 + i) * 3 * ease((t - d - 3) / 1.5);
    const end = { x: hx + sway, y: hy + (type === "tulip" ? 4 : size * 0.4) };
    const ctrl = curve(end, bend);
    stem(ctrl, end, g, 4);
    if (g > 0.5) {
      const m = bez(BASE, ctrl, end, 0.55);
      leaf(m.x, m.y, i % 2 ? -0.7 : -2.4, 30, ease((g - 0.5) / 0.5), "#3d9a50");
    }
    heads.push({ f, i, g, p: bez(BASE, ctrl, end, g), b: ease((t - d - 1) / 1.8) });
  });

  heads.forEach(({ f, i, g, p, b }) => {
    if (b < 0.15) { ctx.fillStyle = "#3d9a50"; ctx.beginPath(); ctx.arc(p.x, p.y, 7 * g, 0, TAU); ctx.fill(); }
    if (b > 0) bloom(f, p, b, i);
  });

  paper(paperFront);
  bow(ease((t - 5) / 0.8));                                       // Schleife zum Schluss
}

let start = performance.now() - (calm ? 1e5 : 0);
function loop(now) { draw((now - start) / 1000); requestAnimationFrame(loop); }
window.addEventListener("resize", resize);
document.getElementById("again").addEventListener("click", () => { start = performance.now(); });
resize(); requestAnimationFrame(loop);
