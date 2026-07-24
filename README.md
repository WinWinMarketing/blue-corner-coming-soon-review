# The Blue Corner

One canonical, responsive coming-soon homepage for The Blue Corner:

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Build

`node tools/generate.mjs` rebuilds only the root `index.html` and safely removes any stale `concepts/` directory. No variants, gallery, or route-specific styles are generated.

`node tools/check-site.mjs` validates the single-page source, local assets, CSP, Typekit contract, core sections, form privacy, and deterministic baselines. Use `node tools/check-site.mjs --strict-images` before publishing.

## Privacy and safety

- The form validates only in the browser and neither sends nor stores details.
- Patient/Therapist selection is required before local success feedback.
- The page uses licensed Adobe Typekit Proxima Nova Condensed; it is not copied or self-hosted.
- The CSP blocks connections and form actions while allowing only `https://use.typekit.net` for stylesheet and font loading.
- Crisis links point to Canadian 9-8-8 support and Government of Canada guidance.
- The 85%, #1, and ~300% claims remain design-review copy and require source verification before production launch.

GitHub Pages publishes from the repository root with Jekyll disabled.
