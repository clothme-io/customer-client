import { useEffect, useRef, useState } from "react";

export function LandingReveal({ children, className = "", delay = 0, eager = false }) {
  const ref = useRef(null);
  // Above-the-fold content should paint visible immediately (avoids blank→fade on home load).
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager) return;

    const node = ref.current;
    if (!node) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div
      ref={ref}
      className={`landing-reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
