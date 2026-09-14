"use client";

import { useEffect } from "react";

const desktopPanels = "main.home-page > section, main.home-page ~ footer.site-footer";

export function HomeSectionScroll() {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 900px) and (min-height: 760px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let accumulated = 0;
    let lastWheelAt = 0;
    let lockedUntil = 0;
    let gestureLocked = false;

    function onWheel(event: WheelEvent) {
      if (!desktop.matches || event.ctrlKey || event.shiftKey || event.defaultPrevented) return;
      if (!event.deltaY) return;
      event.preventDefault();

      const now = performance.now();
      const freshGesture = now - lastWheelAt > 180;
      if (freshGesture) accumulated = 0;
      lastWheelAt = now;
      if (gestureLocked) {
        if (!freshGesture || now < lockedUntil) return;
        gestureLocked = false;
      }

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      accumulated += event.deltaY * unit;
      if (Math.abs(accumulated) < 24) return;

      const direction = Math.sign(accumulated);
      accumulated = 0;
      const panels = Array.from(document.querySelectorAll<HTMLElement>(desktopPanels));
      const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      const currentY = window.scrollY + headerHeight;
      const tops = panels.map((panel) => panel.offsetTop);
      let nearest = tops.reduce(
        (best, top, index) =>
          Math.abs(top - currentY) < Math.abs(tops[best] - currentY) ? index : best,
        0,
      );
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 4) nearest = panels.length - 1;
      const destination = tops[nearest + direction];
      if (destination === undefined) return;

      gestureLocked = true;
      lockedUntil = now + 700;
      window.scrollTo({
        top: Math.round(destination - headerHeight),
        behavior: reducedMotion.matches ? "instant" : "smooth",
      });
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    document.documentElement.dataset.homeScrollReady = "true";
    return () => {
      window.removeEventListener("wheel", onWheel);
      delete document.documentElement.dataset.homeScrollReady;
    };
  }, []);

  return null;
}
