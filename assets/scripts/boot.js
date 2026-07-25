(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || !("IntersectionObserver" in window) || !("requestAnimationFrame" in window)) return;

  root.classList.add("reveal-prep");
  let fallbackTimer = 0;
  const cancelFallback = () => {
    window.clearTimeout(fallbackTimer);
    fallbackTimer = 0;
  };
  const release = () => {
    cancelFallback();
    root.classList.remove("reveal-prep");
  };

  fallbackTimer = window.setTimeout(release, 1500);
  window.blueCornerRevealPrep = Object.freeze({ cancelFallback, release });
})();
