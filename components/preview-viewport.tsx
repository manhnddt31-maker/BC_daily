"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type PreviewViewportProps = {
  canvasWidth: number;
  canvasHeight: number;
  children: ReactNode;
};

export function PreviewViewport({ canvasWidth, canvasHeight, children }: PreviewViewportProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const updateScale = () => {
      if (element.clientWidth > 0) setScale(Math.min(1, element.clientWidth / canvasWidth));
    };
    updateScale();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, [canvasWidth]);

  return (
    <div className="preview-viewport" ref={viewport}>
      <div className="preview-stage" style={{ width: canvasWidth * scale, height: canvasHeight * scale }}>
        <div
          className="preview-scaler"
          style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
