# The Blue Corner

One canonical, responsive coming-soon homepage for The Blue Corner, plus a plain privacy page:

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Structure

Five screens, each closing on the navy crisis band:

1. **Hero** — Nobody Fights Alone.
2. **The numbers** — the four statistics on a navy band.
3. **Four rooms** — depression as four ordinary-looking scenes.
4. **The corner and its plan** — "Not a clinic. A Corner." over "We start with therapy." on one screen.
5. **Sign-up** — Be first in the corner.

The light sign-off row (wordmark, links, copyright) runs once, at the end.

## Build

`node tools/generate.mjs` rebuilds `index.html` and `privacy.html` and safely removes any stale `concepts/` directory. It also re-derives every `?v=` cache key from its file's SHA-256, so keys can never drift from their contents.

`node tools/check-site.mjs` validates the two pages, local assets, CSP, Typekit contract, the locked copy and section structure, form privacy, and the accessibility contracts. Use `node tools/check-site.mjs --strict-images` before publishing.

`node tools/acceptance.mjs` drives the rendered pages in headless Chromium at 2048x870, 2048x1020, 2048x989, 390x844 and 320x700. `check-site.mjs` is static analysis and can only prove the source says the right thing; the acceptance run proves the runtime facts it cannot reach: that the hero actually animates on first paint, that scrolling stops when the wheel stops, that the scrollbar thumb reveals and hides without shifting layout, that a crisis band closes all five screens with fifteen 44px tap targets, that the statistics kicker holds one line, that every highlight carries optical bleed on both sides, that nothing overflows horizontally at 320px, that keyboard focus and form validation survive, and that every `?v=` cache key matches its file's content hash. It also sweeps 830–1200px viewport heights, because spacing that steps at a breakpoint fits at the tested height and overflows 20px above it. Add `--target <url>` to run it against a deployed build and `--shots <dir>` to capture screenshots. It SKIPS cleanly when playwright-core or a local Chromium is unavailable.

`node tools/make-dns-pdf.mjs` renders `docs/DNS-SETUP.md` to `docs/DNS-SETUP.pdf` — the branded, print-ready guide handed to the domain owner. Re-run it after any edit to the markdown, particularly when the forwarding destination is filled in or the DKIM key is regenerated, or the PDF silently goes stale. Like `acceptance.mjs` it borrows playwright-core from a sibling checkout and SKIPS cleanly when that or a local Chromium is unavailable.

`node tools/recolor-hero.mjs` regenerates the hero art from the original reference photograph. It recolours only two masks — the ropes to brand yellow and the corner pad to brand blue — and asserts that every decoded pixel outside those masks is byte-identical to the source. Never hand-edit the generated `-brand-v4.webp`.

The two local Latin font subsets come from the supplied feedback artifact: Archivo is scoped to the three reviewed sections (rooms, corner/plan, and sign-up), and JetBrains Mono only to plan-status labels.

## Outstanding — needs photography, not code

Two items from the 2026-07-26 design review cannot be finished without a shoot. The layouts are built and locked; each is a one-element swap when the images land.

- **Hero — a man in the chair holding a ring card reading HELP IS ON THE WAY.** Same corner, same lighting, same crop; a real-looking man 30s–50s in ordinary clothes, seated leaning slightly forward, holding the card at chest height with both hands, looking down the lens. Level and unperformed — a smile turns a suicide-prevention page into a stunt. The lettered-chair placeholder currently shipping is temporary pending commissioned casting; it keeps the identical layout and is not the final hero.
- **Four rooms — generated review placeholders now fill the four slots**: unmade bed and lit phone; garage, cans, empty chair and TV glow; desk at dusk with the chair empty; kitchen table with two mugs and a pulled-away chair. They are not final photography: commissioned or properly licensed shots in the same grade remain required before public launch.

## The sign-up endpoint

The form is live. It posts JSON to `POST /api/signup` on the same origin, and `server/signup-api.mjs`
emails the details to the team through Resend. There is no database.

`server/signup-api.mjs` runs on Node builtins only — this repo has no `package.json` and no
dependencies, and the endpoint keeps it that way. It binds to `127.0.0.1:8787` and is only ever
reached through Caddy. Required environment: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`,
`ALLOWED_ORIGIN`. It refuses to start without the first three, because an endpoint that accepts
signups it cannot deliver is worse than one that is loudly down.

Deployment files are in `deploy/`. The DNS handover guide for the domain owner is
`docs/DNS-SETUP.md`. Full threat model and controls are in `SECURITY.md`.

## Privacy and safety

- The form sends. `privacy.html` and `SECURITY.md` describe exactly what it collects and where it
  goes, and **must be updated in the same change** as any alteration to the form or the endpoint.
- Express consent is required: an unticked, never-pre-ticked checkbox gates submission, both in the
  browser and again on the server. CASL needs it before a launch email can go to a Canadian address.
- Someone ticking "Patient" on a mental-health site is health-adjacent personal information. Treat
  every submitted value as sensitive.
- The sign-up card carries no standing notice. The element remains as the form's only *visible*
  message surface — the per-field messages are screen-reader-only — so it rests empty, holds its
  reserved height, and paints on a validation error or a failed send.
- Patient/Therapist selection is required before submission.
- The page uses licensed Adobe Typekit Proxima Nova Condensed; it is not copied or self-hosted.
- The CSP allows exactly one same-origin connection and no form actions, plus `https://use.typekit.net`
  for stylesheet and font loading. `check-site.mjs` fails if the runtime gains a second network call
  or any absolute URL.
- The crisis band repeats on every screen: 9-8-8 call and text as yellow tap targets, 9-1-1 for immediate danger, and the helpline named so nobody has to guess who answers. It is two blocks — the named helpline beside its numbers. It no longer repeats "Nobody fights alone."; that line belongs to the hero, and saying it five more times added a third stacked row and ~50px of height to every screen.
- The 85%, #1, and 3× claims remain design-review copy and require source verification before production launch. "3×" is stated as a multiple of the help-seeking baseline; confirm against the CMAJ figure before it goes public, since "3× more" and "300% more" are not the same quantity.

## Where it runs

The site is served from its own AWS Lightsail instance by Caddy, with `server/signup-api.mjs` behind
it as a systemd service. See `deploy/README.md`.

The GitHub Pages build at `https://winwinmarketing.github.io/blue-corner-coming-soon-review/` was the
original review host and predates the endpoint — the form there cannot send, because Pages has no
server. It is `noindex` so it does not compete. Pages publishes from the repository root with Jekyll
disabled; `.nojekyll` exists for that reason alone and is inert everywhere else.

`tools/template.mjs` has one absolute URL, `SITE_ORIGIN`, used for `og:image` because scrapers do not
resolve relative URLs. Everything else on both pages is project-relative, which is why the site drops
into any web root unchanged. Override it at build time:

```
SITE_ORIGIN=https://example.ca node tools/generate.mjs
```
