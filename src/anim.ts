// Page intro. Elements are hidden via `.motion [data-intro]` /
// `.motion [data-scroll-reveal]` in CSS so the page never flashes; the
// Web Animations API animates them to visible. Everything animates on
// load — no scroll triggers. Timings mirror the original gsap timeline:
// portrait 0s, name lines 0.35s (+0.14 stagger), sub 0.89s, intro rest
// 1.14s, reveals 1.44s (+0.15 stagger).

const quintOut = "cubic-bezier(0.23, 1, 0.32, 1)"; // gsap power4.out
const backOut = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // gsap back.out(1.6)

export function initAnim(): () => void {
  const anims: Animation[] = [];

  // run an animation, then hand the element back to its resting CSS state
  const play = (
    el: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    settle: (el: HTMLElement) => void,
  ) => {
    const anim = el.animate(keyframes, { fill: "both", ...options });
    anims.push(anim);
    anim.finished
      .then(() => {
        // settle + cancel in the same microtask: one style recalc, no flash
        settle(el as HTMLElement);
        anim.cancel();
      })
      .catch(() => {}); // canceled mid-flight by cleanup — fine
  };

  const dropAttr = (attr: string) => (el: HTMLElement) => {
    el.removeAttribute(attr);
  };

  document.querySelectorAll(".portrait").forEach((el) => {
    play(
      el,
      [
        {
          opacity: 0,
          visibility: "hidden",
          transform: "translateY(10px) scale(0.7) rotate(0deg)",
        },
        {
          opacity: 1,
          visibility: "visible",
          // matches the CSS resting tilt so the handoff doesn't snap
          transform: "translateY(0) scale(1) rotate(-2.5deg)",
        },
      ],
      { duration: 900, easing: backOut },
      // drop the hidden-state attribute so the CSS hover transform
      // can take over after the intro
      dropAttr("data-intro"),
    );
  });

  document.querySelectorAll(".name-line-inner").forEach((el, i) => {
    play(
      el,
      [{ transform: "translateY(110%)" }, { transform: "translateY(0%)" }],
      { duration: 1100, delay: 350 + i * 140, easing: quintOut },
      // `.motion .name-line-inner` keeps its hidden transform forever, so
      // pin the resting state inline once the intro is done
      (target) => {
        target.style.transform = "translateY(0%)";
      },
    );
  });

  const fadeUp: Keyframe[] = [
    { opacity: 0, visibility: "hidden", transform: "translateY(16px)" },
    { opacity: 1, visibility: "visible", transform: "translateY(0px)" },
  ];

  document.querySelectorAll(".hero-sub").forEach((el) => {
    play(el, fadeUp, { duration: 800, delay: 890, easing: quintOut }, dropAttr("data-intro"));
  });

  document.querySelectorAll(".intro-rest").forEach((el) => {
    play(el, fadeUp, { duration: 800, delay: 1140, easing: quintOut }, dropAttr("data-intro"));
  });

  document.querySelectorAll("[data-scroll-reveal]").forEach((el, i) => {
    play(
      el,
      fadeUp,
      { duration: 800, delay: 1440 + i * 150, easing: quintOut },
      dropAttr("data-scroll-reveal"),
    );
  });

  return () => {
    for (const anim of anims) anim.cancel();
  };
}
