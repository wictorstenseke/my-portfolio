import preact from "@preact/preset-vite";
import { defineConfig, type Plugin } from "vite";

// The font is referenced from fontsource's CSS, so the browser only discovers
// it after HTML -> CSS -> @font-face. Preloading the latin subset (the one
// every visitor needs) from <head> starts that fetch immediately. Build-only:
// dev has no bundle and doesn't need the optimization.
function preloadLatinFont(): Plugin {
  let base = "/";
  return {
    name: "preload-latin-font",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((f) =>
          /instrument-sans-latin-wght-normal-[^.]+\.woff2$/.test(f),
        );
        if (!font) return;
        return [
          {
            tag: "link",
            attrs: {
              rel: "preload",
              as: "font",
              type: "font/woff2",
              href: base + font,
              crossorigin: "",
            },
            injectTo: "head",
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [preact(), preloadLatinFont()],
  build: {
    cssMinify: "lightningcss",
  },
});
