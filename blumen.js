const cv = document.getElementById("c"), ctx = cv.getContext("2d");
const LW = 400, LH = 500;   // "logische" Größe der Zeichnung
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Kopf-x, Kopf-y, Größe, Blütenblätter, Blütenfarbe, Mitte, Verzögerung (s), Biegung
const FLOWERS = [
    [105, 110, 44, 8, "#ef476f", "#ffd166", 0.0, -40],
    [200,  70, 50, 10, "#ff9f1c", "#7b4a1e", 0.5,  10],
    [298, 120, 42, 7, "#b57bee", "#ffe066", 1.0,  40],
    [150, 200, 36, 6, "#4cc9f0", "#fff3b0", 1.5, -30],
    [255, 205, 38, 9, "#ffffff", "#f4a300", 2.0,  30]
];
const BASE = { x: 200, y: 345 };   // Punkt, an dem alle Stiele starten


const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
const bez = (p0, c, p1, s) => ({
    x: (1 - s) * (1 - s) * p0.x + 2 * (1 - s) * s * c.x + s * s * p1.x,
    y: (1 - s) * (1 - s) * p0.y + 2 * (1 - s) * s * c.y + s * s * p1.y
});

function resize() {
    const dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(cv.width / LW, 0, 0, cv.height / LH, 0, 0);
}

function leaf(x, y, ang, len, k) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = "#3d9a50";
    ctx.beginPath(); ctx.ellipse(len * k * 0.5, 0, len * k * 0.5, len * k * 0.22, 0, 0, 6.283); ctx.fill();
    ctx.restore();
}

function petals(x, y, size, n, col, mid, b, spin) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin + b * 0.5);
    for (let i = 0; i < n; i++) {
        ctx.save(); ctx.rotate(i * 6.283 / n);
        ctx.fillStyle = col; ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, -size * 0.55 * b, size * 0.24 * b, size * 0.5 * b, 0, 0, 6.283);
        ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle = mid;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.22 * (0.4 + 0.6 * b), 0, 6.283); ctx.fill();
    ctx.restore();
}

function draw(t) {
    ctx.clearRect(0, 0, LW, LH);
    const heads = [];
    FLOWERS.forEach(([hx, hy, size, n, col, mid, d, bend], i) => {
        const sway = calm ? 0 : Math.sin(t * 1.3 + i) * 3 * ease((t - d - 3) / 1.5);
        const end = {x: hx + sway, y: hy + size * 0.5};
        const ctrl = {x: (BASE.x + end.x) / 2 + bend, y: (BASE.y + end.y) / 2 + 20};
        const g = ease((t - d) / 1.3);
        if (g <= 0) return;


        ctx.strokeStyle = "#3d9a50";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(BASE.x, BASE.y);
        for (let s = 0.04; s <= g + 0.001; s += 0.04) {
            const p = bez(BASE, ctrl, end, Math.min(s, g));
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        const m1 = bez(BASE, ctrl, end, 0.45), m2 = bez(BASE, ctrl, end, 0.7);
        const lk = ease((g - 0.45) / 0.5);
        leaf(m1.x, m1.y, -2.6, 34, lk);
        leaf(m2.x, m2.y, -0.5, 30, lk);
        heads.push({g, p: bez(BASE, ctrl, end, g), size, n, col, mid, b: ease((t - d - 1) / 1.8), i});
    });

    heads.forEach(h => {
        if (h.b < 0.15) {
            ctx.fillStyle = "#3d9a50";
            ctx.beginPath();
            ctx.arc(h.p.x, h.p.y, 7 * h.g, 0, 6.283);
            ctx.fill();
        }
        if (h.b > 0) petals(h.p.x, h.p.y, h.size, h.n, h.col, h.mid, h.b, h.i);
    });

    // Vase
    ctx.fillStyle = "#4f86b8";
    ctx.beginPath();
    ctx.moveTo(150, 330);
    ctx.lineTo(250, 330);
    ctx.bezierCurveTo(250, 380, 285, 400, 270, 450);
}

    let start = performance.now() - (calm ? 1e5 : 0);
    function loop(now) { draw((now - start) / 1000); requestAnimationFrame(loop); }
    window.addEventListener("resize", resize);
    document.getElementById("again").addEventListener("click", () => { start = performance.now(); });
    resize(); requestAnimationFrame(loop);