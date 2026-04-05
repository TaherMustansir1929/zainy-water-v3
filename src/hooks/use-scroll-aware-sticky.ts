import { useEffect, useRef, useState } from "react";

export function useScrollAwareSticky() {
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parentElement = parentRef.current;
    if (!parentElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        const boundingRect = entry.boundingClientRect;

        // Always keep visible when there's no content or when intersecting
        if (isIntersecting || boundingRect.height === 0) {
          setIsVisible(true);
          setIsSticky(false);
        } else {
          setIsVisible(true); // Always keep input visible

          // Make input sticky when parent is scrolled up and out of view
          if (boundingRect.bottom < 0) {
            setIsSticky(true);
          } else {
            setIsSticky(false);
          }
        }
      },
      {
        threshold: [0, 0.1],
        rootMargin: "0px 0px -50px 0px", // Trigger when 50px from bottom
      }
    );

    observer.observe(parentElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    parentRef,
    isSticky,
    isVisible,
  };
}
