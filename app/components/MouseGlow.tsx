"use client";

import { useEffect, useRef, useState } from "react";

export default function MouseGlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if the device supports hover (is likely a desktop with a mouse)
    const hoverMediaQuery = window.matchMedia("(hover: hover)");
    if (!hoverMediaQuery.matches) {
      return; // Skip on mobile/touch devices
    }
    
    setShouldRender(true);

    const mouse = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const tick = () => {
      // Linear interpolation: current = current + (target - current) * factor
      // A factor of 0.08 gives a dreamy, slightly lagging follow effect
      current.x += (mouse.x - current.x) * 0.08;
      current.y += (mouse.y - current.y) * 0.08;

      if (containerRef.current) {
        // Center the glow at the cursor (using half of its size)
        containerRef.current.style.transform = `translate3d(${current.x - 200}px, ${current.y - 200}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!mounted || !shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className="custom-mouse-glow"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255, 182, 217, 0.22) 0%, rgba(255, 240, 210, 0.12) 60%, transparent 100%)",
        filter: "blur(20px)",
        pointerEvents: "none",
        zIndex: 1,
        willChange: "transform",
      }}
    />
  );
}
