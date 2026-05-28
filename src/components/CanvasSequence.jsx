"use client";
import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 240;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getBeatOpacity(progress, start, end) {
  if (progress <= start || progress >= end) return 0;
  const range = end - start;
  const fadeLen = range * 0.22;
  const inP = clamp((progress - start) / fadeLen, 0, 1);
  const outP = clamp((progress - (end - fadeLen)) / fadeLen, 0, 1);
  return Math.min(easeInOutCubic(inP), 1 - easeInOutCubic(outP));
}

function getBeatY(progress, start, end) {
  const range = end - start;
  const fadeLen = range * 0.22;
  const inP = clamp((progress - start) / fadeLen, 0, 1);
  const outP = clamp((progress - (end - fadeLen)) / fadeLen, 0, 1);
  return lerp(36, 0, easeInOutCubic(inP)) + lerp(0, -36, easeInOutCubic(outP));
}

export default function CanvasSequence() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafRef = useRef(null);
  const beatRefsRef = useRef([]);
  const progressBarRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  // Preload frames
  useEffect(() => {
    const imgs = new Array(TOTAL_FRAMES);
    let done = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;
      img.onload = img.onerror = () => {
        done++;
        setLoadedCount(done);
        if (done === TOTAL_FRAMES) setLoading(false);
      };
      imgs[i - 1] = img;
    }
    imagesRef.current = imgs;
  }, []);

  // Scroll → progress
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const scrolled = Math.max(0, -el.getBoundingClientRect().top);
      targetProgressRef.current = clamp(scrolled / scrollable, 0, 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // RAF render loop — all DOM manipulation, zero setState
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const BEATS_CONFIG = [
      { start: 0.0,  end: 0.18 },
      { start: 0.22, end: 0.42 },
      { start: 0.46, end: 0.64 },
      { start: 0.67, end: 0.84 },
      { start: 0.87, end: 1.01 },
    ];

    let lastDrawnFrame = -1;

    const tick = () => {
      // Smooth lerp toward target
      currentProgressRef.current = lerp(currentProgressRef.current, targetProgressRef.current, 0.085);
      const p = currentProgressRef.current;

      // Canvas frame — read imagesRef directly (no stale closure on `loading`)
      const imgs = imagesRef.current;
      if (imgs.length === TOTAL_FRAMES) {
        const frameIdx = clamp(Math.round(p * (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1);
        if (frameIdx !== lastDrawnFrame) {
          const img = imgs[frameIdx];
          if (img && img.complete && img.naturalWidth > 0) {
            ctx.fillStyle = "#050505";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
            lastDrawnFrame = frameIdx;
          }
        }
      }

      // Progress bar
      if (progressBarRef.current) {
        progressBarRef.current.style.height = `${p * 100}%`;
      }

      // Beat overlays — direct DOM mutation, never setState
      BEATS_CONFIG.forEach((beat, i) => {
        const el = beatRefsRef.current[i];
        if (!el) return;
        const opacity = getBeatOpacity(p, beat.start, beat.end);
        const y = getBeatY(p, beat.start, beat.end);
        el.style.opacity = opacity;
        el.style.transform = el.dataset.align === "center"
          ? `translate(-50%, calc(-50% + ${y}px))`
          : `translateY(calc(-50% + ${y}px))`;
        el.style.pointerEvents = opacity > 0.05 ? "auto" : "none";
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← empty: loop runs once, reads refs live — never restarts

  return (
    <>
      {/* ── Scroll container (500vh drives sticky canvas) ── */}
      <div
        ref={containerRef}
        id="overview"
        style={{ position: "relative", height: "500vh", background: "#050505" }}
      >
        {/* Sticky viewport */}
        {/* overflow must NOT be set here — breaks sticky in Safari + Chrome */}
        <div style={{ position: "sticky", top: 0, height: "100vh" }}>

          {/* Loading bar */}
          {loading && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 60,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "#050505",
            }}>
              <div style={{
                width: "220px", height: "1px",
                background: "rgba(255,255,255,0.08)", borderRadius: "2px",
                overflow: "hidden", marginBottom: "20px",
              }}>
                <div style={{
                  height: "100%",
                  width: `${(loadedCount / TOTAL_FRAMES) * 100}%`,
                  background: "linear-gradient(90deg,#FF6A00,#FF9A00)",
                  transition: "width 0.08s linear",
                }} />
              </div>
              <p style={{
                fontSize: "10px", letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "var(--font-inter),sans-serif",
              }}>
                Initialising sequence
              </p>
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{ display: "block", position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />

          {/* Ambient glow */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
            background: "radial-gradient(ellipse 55% 35% at 50% 60%, rgba(255,106,0,0.055) 0%, transparent 65%)",
          }} />

          {/* Vignette */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
            background: "radial-gradient(ellipse 130% 100% at 50% 50%, transparent 35%, rgba(5,5,5,0.72) 100%)",
          }} />

          {/* Film grain */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
            opacity: 0.032,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "300px 300px",
          }} />

          {/* ── BEAT 0: HERO ── */}
          <div
            ref={el => beatRefsRef.current[0] = el}
            data-align="center"
            style={{
              position: "absolute", zIndex: 10,
              left: "50%", top: "50%",
              transform: "translate(-50%, calc(-50% + 36px))",
              textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: 0, pointerEvents: "none",
              maxWidth: "700px", width: "90vw",
              willChange: "opacity, transform",
            }}
          >
            <p className="beat-label">Mirrorless · Professional</p>
            <h1 className="beat-h1">
              Sony Alpha <span style={{ color: "#FF6A00" }}>α6000</span>
            </h1>
            <p className="beat-sub">Capture every moment.</p>
            <p className="beat-body" style={{ maxWidth: "420px" }}>
              Professional speed and stunning image quality<br />
              in a compact mirrorless design.
            </p>
            <div className="beat-scroll-hint">
              <span className="scroll-arrow">↓</span>&nbsp;Scroll to explore
            </div>
          </div>

          {/* ── BEAT 1: AUTOFOCUS ── */}
          <div
            ref={el => beatRefsRef.current[1] = el}
            data-align="left"
            style={{
              position: "absolute", zIndex: 10,
              left: "clamp(32px, 8vw, 120px)", top: "50%",
              transform: "translateY(calc(-50% + 36px))",
              textAlign: "left",
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              opacity: 0, pointerEvents: "none",
              maxWidth: "500px",
              willChange: "opacity, transform",
            }}
          >
            <p className="beat-label" id="autofocus">Autofocus System</p>
            <h2 className="beat-h2">
              Fast.<br />Precise.<br />
              <span style={{ color: "#FF6A00" }}>Instant.</span>
            </h2>
            <p className="beat-body">
              179 phase-detection autofocus points deliver lightning-fast subject tracking.
              Capture fleeting moments with precision engineered for creators.
            </p>
            <div className="beat-stat-row">
              <div className="beat-stat">
                <span className="stat-num">179</span>
                <span className="stat-label">AF Points</span>
              </div>
              <div className="beat-stat">
                <span className="stat-num">11fps</span>
                <span className="stat-label">Burst Speed</span>
              </div>
            </div>
          </div>

          {/* ── BEAT 2: SENSOR ── */}
          <div
            ref={el => beatRefsRef.current[2] = el}
            data-align="right"
            style={{
              position: "absolute", zIndex: 10,
              right: "clamp(32px, 8vw, 120px)", top: "50%",
              transform: "translateY(calc(-50% + 36px))",
              textAlign: "right",
              display: "flex", flexDirection: "column", alignItems: "flex-end",
              opacity: 0, pointerEvents: "none",
              maxWidth: "500px",
              willChange: "opacity, transform",
            }}
          >
            <p className="beat-label" id="sensor">APS-C Sensor</p>
            <h2 className="beat-h2">
              Exceptional<br />detail in every{" "}
              <span style={{ color: "#FF6A00" }}>frame.</span>
            </h2>
            <ul className="beat-list" style={{ textAlign: "right", alignItems: "flex-end" }}>
              <li>24.3MP APS-C CMOS sensor for maximum clarity</li>
              <li>Rich color reproduction across the full tonal range</li>
              <li>Stunning low-light performance up to ISO 25600</li>
            </ul>
            <div className="beat-stat-row">
              <div className="beat-stat" style={{ alignItems: "flex-end" }}>
                <span className="stat-num">24.3MP</span>
                <span className="stat-label">Resolution</span>
              </div>
              <div className="beat-stat" style={{ alignItems: "flex-end" }}>
                <span className="stat-num">25600</span>
                <span className="stat-label">Max ISO</span>
              </div>
            </div>
          </div>

          {/* ── BEAT 3: LENS ── */}
          <div
            ref={el => beatRefsRef.current[3] = el}
            data-align="left"
            style={{
              position: "absolute", zIndex: 10,
              left: "clamp(32px, 8vw, 120px)", top: "50%",
              transform: "translateY(calc(-50% + 36px))",
              textAlign: "left",
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              opacity: 0, pointerEvents: "none",
              maxWidth: "500px",
              willChange: "opacity, transform",
            }}
          >
            <p className="beat-label" id="lens">16–50mm Kit Lens</p>
            <h2 className="beat-h2">
              Engineered optics.<br />
              <span style={{ color: "#FF6A00" }}>Cinematic</span> results.
            </h2>
            <p className="beat-body">
              Versatile 16–50mm power zoom for everyday creativity.
              Precision-crafted elements deliver sharpness, depth, and natural rendering.
            </p>
            <p className="beat-body" style={{ marginTop: "12px", color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
              Built for creators, travelers, and storytellers.
            </p>
          </div>

          {/* ── BEAT 4: REASSEMBLY CTA ── */}
          <div
            ref={el => beatRefsRef.current[4] = el}
            data-align="center"
            style={{
              position: "absolute", zIndex: 10,
              left: "50%", top: "50%",
              transform: "translate(-50%, calc(-50% + 36px))",
              textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: 0, pointerEvents: "none",
              maxWidth: "680px", width: "90vw",
              willChange: "opacity, transform",
            }}
          >
            <h2 className="beat-h1" style={{ fontSize: "clamp(38px, 6vw, 72px)" }}>
              Create without limits.
            </h2>
            <p className="beat-sub" style={{ marginBottom: "8px" }}>
              Sony Alpha a6000 — compact power for modern creators.
            </p>
            <p style={{
              color: "rgba(255,255,255,0.35)", fontSize: "13px",
              fontFamily: "var(--font-inter),sans-serif",
              letterSpacing: "0.02em", marginBottom: "40px",
            }}>
              Designed for photography, filmmaking, and everyday storytelling.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="cta-primary">Explore Sony α6000</button>
              <button className="cta-secondary">View full specifications</button>
            </div>
          </div>

          {/* Scroll progress indicator */}
          <div style={{
            position: "absolute", right: "28px", top: "50%",
            transform: "translateY(-50%)", zIndex: 20,
          }}>
            <div style={{
              width: "1px", height: "80px",
              background: "rgba(255,255,255,0.1)", borderRadius: "1px",
              overflow: "hidden",
            }}>
              <div
                ref={progressBarRef}
                style={{
                  width: "100%", height: "0%",
                  background: "linear-gradient(180deg,#FF6A00,#FF9A00)",
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Specs section ── */}
      <SpecsSection />
    </>
  );
}

// ── Specs ──────────────────────────────────────────────────────────────────
const SPECS = [
  ["Sensor", "24.3MP APS-C CMOS"],
  ["Autofocus", "179-pt Phase Detection"],
  ["ISO Range", "100–25600 (exp)"],
  ["Burst Rate", "11 fps continuous"],
  ["Stabilisation", "Optical SteadyShot"],
  ["Video", "1080p @ 60fps"],
  ["Lens", "16–50mm Power Zoom"],
  ["Mount", "Sony E-Mount"],
  ["Display", '3.0" Tilting TFT LCD'],
  ["EVF", "XGA OLED Tru-Finder"],
  ["Connectivity", "Wi-Fi · NFC · USB"],
  ["Weight", "344g body + lens"],
];

function SpecsSection() {
  return (
    <section id="specs" style={{
      background: "#050505",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      padding: "120px clamp(32px, 8vw, 120px) 100px",
      position: "relative",
    }}>
      {/* Top orange line accent */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "500px", height: "1px",
        background: "linear-gradient(90deg,transparent,rgba(255,106,0,0.6),transparent)",
      }} />

      <p style={{
        fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase",
        color: "rgba(255,106,0,0.85)", fontFamily: "var(--font-inter),sans-serif",
        fontWeight: 500, marginBottom: "16px",
      }}>Technical Specifications</p>

      <h2 style={{
        fontSize: "clamp(32px,4vw,52px)", fontWeight: 700,
        letterSpacing: "-0.04em", lineHeight: 1.1,
        fontFamily: "var(--font-inter),sans-serif",
        color: "#fff", marginBottom: "64px", maxWidth: "480px",
      }}>
        Built with<br />
        <span style={{ color: "rgba(255,255,255,0.3)" }}>engineering precision.</span>
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px", overflow: "hidden",
      }}>
        {SPECS.map(([label, value]) => (
          <SpecCard key={label} label={label} value={value} />
        ))}
      </div>

      <div style={{ marginTop: "72px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <button className="cta-primary">Explore Sony α6000</button>
        <button className="cta-secondary">View full specifications</button>
      </div>

      <p style={{
        marginTop: "40px", fontSize: "12px",
        color: "rgba(255,255,255,0.18)",
        fontFamily: "var(--font-inter),sans-serif",
        lineHeight: 1.7, maxWidth: "480px",
      }}>
        Sony Alpha a6000 with SELP1650 16–50mm f/3.5–5.6 OSS Power Zoom lens.
        All specifications are approximate and subject to change.
      </p>
    </section>
  );
}

function SpecCard({ label, value }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "28px 30px",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: hovered ? "#0A0A0C" : "#050505",
        transition: "background 0.2s ease",
      }}
    >
      <p style={{
        fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-inter),sans-serif",
        fontWeight: 500, marginBottom: "10px",
      }}>{label}</p>
      <p style={{
        fontSize: "16px", fontWeight: 500, color: "#fff",
        fontFamily: "var(--font-inter),sans-serif", letterSpacing: "-0.01em",
      }}>{value}</p>
    </div>
  );
}
