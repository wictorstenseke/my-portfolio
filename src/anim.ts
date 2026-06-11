import gsap from "gsap";

// Page intro. Elements are hidden via `.motion [data-intro]` /
// `.motion [data-scroll-reveal]` in CSS so the page never flashes; gsap
// animates them to visible. Everything animates on load — no scroll triggers.
export function initAnim(): () => void {
  const tl = gsap.timeline({
    defaults: { ease: "power4.out", duration: 1 },
  });

  tl.to(".portrait", {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    rotation: -2.5, // matches the CSS resting tilt so clearProps doesn't snap
    duration: 0.9,
    ease: "back.out(1.6)",
    // drop the hidden-state attribute + inline styles so the CSS
    // hover transform can take over after the intro
    onComplete() {
      const el = document.querySelector(".portrait");
      if (el) {
        el.removeAttribute("data-intro");
        gsap.set(el, { clearProps: "all" });
      }
    },
  })
    .fromTo(
      ".name-line-inner",
      // y:0 wipes the px offset gsap parses out of the CSS translateY(110%)
      // hidden state — without it the lines stay below the clip mask
      { yPercent: 110, y: 0 },
      { yPercent: 0, y: 0, stagger: 0.14, duration: 1.1 },
      "-=0.55"
    )
    .to(".hero-sub", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.7")
    .to(".intro-rest", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.55")
    .to(
      "[data-scroll-reveal]",
      { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.15 },
      "-=0.5"
    );

  return () => {
    tl.kill();
  };
}
