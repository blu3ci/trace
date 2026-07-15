"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className,
  delay = 0,
  animationClassName = "slide-in-from-bottom-6",
  triggerOnMount = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  animationClassName?: string;
  triggerOnMount?: boolean;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (triggerOnMount) {
      let animationFrame = requestAnimationFrame(() => {
        animationFrame = requestAnimationFrame(() => setHasEntered(true));
      });
      const fallbackTimer = window.setTimeout(() => setHasEntered(true), 120);

      return () => {
        cancelAnimationFrame(animationFrame);
        window.clearTimeout(fallbackTimer);
      };
    }

    const element = elementRef.current;
    if (!element) return;

    const revealIfVisible = () => {
      const { bottom, top } = element.getBoundingClientRect();
      const isVisible = top < window.innerHeight * 0.92 && bottom > 0;

      if (!isVisible) return;

      setHasEntered(true);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setHasEntered(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    observer.observe(element);
    const animationFrame = requestAnimationFrame(revealIfVisible);
    const fallbackTimer = window.setTimeout(revealIfVisible, 180);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(fallbackTimer);
    };
  }, [triggerOnMount]);

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
