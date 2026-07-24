# Blue Corner coming-soon concepts

One screenshot-faithful Blue Corner coming-soon page and five constrained, additive concept tests prepared as a public design-review prototype.

## Live review

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Directions

1. 01 — Reference master (`04-first-bell`) — no add-on
2. 02 — No perfect words needed (`03-open-corner`)
3. 03 — The first ten minutes (`06-kitchen-light`)
4. 04 — The Corner Standard (`09-listening-room`)
5. 05 — Between-round plan (`11-on-the-other-end`)
6. 06 — Bring someone into your corner (`12-two-ways-in`)

The six retained routes are the only public concept directories. Route `04-first-bell` is ordinal 01 and the immutable reference master. Routes 02–06 use the same masthead, hero, image, copy, core sections, single member form, palette, motion, responsive layout, and shared CSS; each adds exactly one clearly labeled module before signup.

See [CONCEPT-GOALS.md](CONCEPT-GOALS.md) for the rationale behind each direction.

## Content and generation

- `tools/source-copy.mjs` is the single source for the locked reference-site copy.
- `tools/concepts.mjs` fixes the route order, gallery labels, and single shared hero asset.
- `tools/source-copy.mjs` also holds the five approved concept-addition modules.
- `node tools/generate.mjs` rebuilds the gallery and all concept HTML without dependencies or runtime fetching.
- `node tools/check-site.mjs` checks copy parity, page order, local links, security metadata, form hooks, shared brand colours, and font weights. Add `--strict-images` for the final pre-deploy gate.
- Each retained concept keeps an intentionally empty `style.css` for generation compatibility. All route presentation lives in `assets/styles/concept-base.css`; per-concept overrides are rejected.

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
