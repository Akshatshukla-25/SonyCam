"use client";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        height: "64px",
        transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease",
        background: scrolled ? "rgba(5,5,5,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      {/* Brand */}
      <div style={{
        fontSize: "17px",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "#fff",
        fontFamily: "var(--font-inter), -apple-system, sans-serif",
        userSelect: "none",
      }}>
        Sony{" "}
        <span style={{ color: "#FF6A00", fontWeight: 700 }}>α</span>
        6000
      </div>

      {/* Center links */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "36px",
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
      }}>
        {["Overview", "Autofocus", "Sensor", "Lens", "Gallery", "Specs"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            style={{
              fontSize: "13px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.65)",
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "color 0.2s ease",
              fontFamily: "var(--font-inter), -apple-system, sans-serif",
            }}
            onMouseEnter={e => e.target.style.color = "#fff"}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.65)"}
          >
            {item}
          </a>
        ))}
      </div>

      {/* CTA */}
      <button
        style={{
          padding: "8px 20px",
          borderRadius: "100px",
          fontSize: "13px",
          fontWeight: 500,
          fontFamily: "var(--font-inter), -apple-system, sans-serif",
          color: "#fff",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={e => {
          e.target.style.background = "rgba(255,106,0,0.15)";
          e.target.style.borderColor = "rgba(255,106,0,0.5)";
          e.target.style.color = "#FF6A00";
        }}
        onMouseLeave={e => {
          e.target.style.background = "rgba(255,255,255,0.06)";
          e.target.style.borderColor = "rgba(255,255,255,0.15)";
          e.target.style.color = "#fff";
        }}
      >
        Explore α6000
      </button>
    </nav>
  );
}
