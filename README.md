# Blue Corner coming-soon concepts

Six responsive coming-soon directions for Blue Corner, normalized to the supplied reference system and prepared as a public design-review prototype.

## Live review

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Directions

1. 03 — The Check-In
2. 04 — At the Corner
3. 06 — Kitchen Light
4. 09 — Listening Room
5. 11 — On the Other End
6. 12 — Two Ways In

The six retained routes are the only public concept directories and share the reference page's section order and responsive system. The site checker rejects any extra route directory.

See [CONCEPT-GOALS.md](CONCEPT-GOALS.md) for the rationale behind each direction.

## Content and generation

- `tools/source-copy.mjs` is the single source for the locked reference-site copy.
- `tools/concepts.mjs` maps the six retained titles, public slugs, descriptions, and tactile material art assets.
- `node tools/generate.mjs` rebuilds the gallery and all concept HTML without dependencies or runtime fetching.
- `node tools/check-site.mjs` checks copy parity, page order, local links, security metadata, form hooks, shared brand colours, and font weights. Add `--strict-images` for the final pre-deploy gate.
- Each retained concept keeps a small `style.css` for hero crop, emphasis, and restrained accent placement; the full reference system lives in `assets/styles/concept-base.css`.

## Privacy and safety

- Forms are interactive mockups only. They validate locally, simulate success, and never submit or store details.
- No analytics, cookies, external fonts, third-party scripts, browser storage, or API requests are used.
- The review pages request `noindex`, `nofollow`, and `noarchive`; `robots.txt` disallows crawling.
- A restrictive content security policy blocks network connections and form actions.
- Crisis links point to Canadian 9-8-8 support and Government of Canada guidance.
- The 85%, #1, and ~300% claims are preserved from the supplied reference copy and must be verified before production launch.

This repository contains only the optimized files required for review. Working notes, signed attachment URLs, rejected images, source-task exports, and full-resolution art are excluded.

## Deployment

GitHub Pages publishes directly from the `main` branch root with Jekyll disabled. GitHub's `github.io` domain provides HTTPS automatically.
