# The Blue Corner

One canonical, responsive coming-soon homepage for The Blue Corner:

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Build

`node tools/generate.mjs` rebuilds only the root `index.html` and safely removes any stale `concepts/` directory. No variants, gallery, or route-specific styles are generated.

`node tools/check-site.mjs` validates the single-page source, local assets, CSP, Typekit contract, core sections, form privacy, and deterministic baselines. Use `node tools/check-site.mjs --strict-images` before publishing.

`node tools/acceptance.mjs` drives the rendered page in headless Chromium at 2048x870, 2048x1020, 2048x989, 390x844 and 320x700. `check-site.mjs` is static analysis and can only prove the source says the right thing; the acceptance run proves the runtime facts it cannot reach — that the hero actually animates on first paint, that scrolling stops when the wheel stops, that the scrollbar thumb reveals and hides without shifting layout, that the roadmap table measures ~418px, that every highlight carries optical bleed on both sides, that the conversion copy is exactly two lines, that nothing overflows horizontally at 320px, that keyboard focus and form validation survive, and that every `?v=` cache key matches its file's content hash. Add `--target <url>` to run it against a deployed build and `--shots <dir>` to capture screenshots. It SKIPS cleanly when playwright-core or a local Chromium is unavailable.

`node tools/recolor-hero.mjs` regenerates the hero art from the original reference photograph. It recolours only two masks — the ropes to brand yellow and the rear corner pad to brand navy — and asserts that every decoded pixel outside those masks is byte-identical to the source. Never hand-edit the generated `-brand-v3.webp`.

## Privacy and safety

- The form validates only in the browser and neither sends nor stores details.
- Patient/Therapist selection is required before local success feedback.
- The page uses licensed Adobe Typekit Proxima Nova Condensed; it is not copied or self-hosted.
- The CSP blocks connections and form actions while allowing only `https://use.typekit.net` for stylesheet and font loading.
- Crisis links point to Canadian 9-8-8 support and Government of Canada guidance.
- The 85%, #1, and ~300% claims remain design-review copy and require source verification before production launch.

GitHub Pages publishes from the repository root with Jekyll disabled.
