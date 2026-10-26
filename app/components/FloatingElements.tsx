"use client";

import { useEffect, useState } from "react";

type FloatingItem = {
  id: number;
  text: string;
  left: string;
  top: string;
  size: string;
  delay: string;
  duration: string;
  typeClass: string;
};

export default function FloatingElements() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    // Generate a fixed set of cute decorative symbols on mount
    const symbols = ["♡", "✦", "✿", "✧", "❀", "♡"];
    const generated: FloatingItem[] = Array.from({ length: 8 }, (_, i) => {
      // Different sizes for visual depth
      const sizes = ["0.9rem", "1.2rem", "1.6rem", "2rem"];
      const sizeVal = sizes[i % sizes.length];
      
      // Select symbol
      const symbol = symbols[i % symbols.length];

      // Assign position grid areas to avoid complete overlap
      const leftPositions = ["5%", "12%", "25%", "45%", "65%", "78%", "88%", "92%"];
      const topPositions = ["15%", "40%", "75%", "25%", "60%", "18%", "82%", "50%"];
      
      // Float types mapped to CSS classes
      const animationTypes = ["float-slow", "float-medium", "float-sway"];
      const typeClass = animationTypes[i % animationTypes.length];

      return {
        id: i,
        text: symbol,
        left: leftPositions[i],
        top: topPositions[i],
        size: sizeVal,
        delay: `${i * 1.5}s`,
        duration: `${15 + (i * 3)}s`,
        typeClass,
      };
    });

    setItems(generated);
  }, []);

  return (
    <div
      className="floating-elements-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className={`floating-item ${item.typeClass}`}
          style={{
            position: "absolute",
            left: item.left,
            top: item.top,
            fontSize: item.size,
            animationDelay: item.delay,
            animationDuration: item.duration,
            color: "rgba(199, 75, 124, 0.18)", // soft pink/rose tint
            fontWeight: 800,
            userSelect: "none",
          }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
