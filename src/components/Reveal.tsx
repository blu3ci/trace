"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className,
  delay = 0,
  animationClassName = "slide-in-from-bottom-6",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  animationClassName?: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setHasEntered(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        "motion-reduce:opacity-100",
        hasEntered
          ? `animate-in fade-in ${animationClassName} duration-700 fill-mode-both motion-reduce:animate-none`
          : "opacity-0",
        className,
      )}
      style={hasEntered && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
