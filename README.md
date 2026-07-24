# Blue Corner coming-soon concepts

One screenshot-faithful Blue Corner coming-soon page and eleven constrained, additive concept tests prepared as a public design-review prototype.

## Live review

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Directions

1. 01 — Reference master (`04-first-bell`) — no add-on
2. 02 — No perfect words needed (`03-open-corner`)
3. 03 — The first ten minutes (`06-kitchen-light`)
4. 04 — The Corner Standard (`09-listening-room`)
5. 05 — Between-round plan (`11-on-the-other-end`)
6. 06 — Bring someone into your corner (`12-two-ways-in`)
7. 07 — Private readiness check (`01-ringside-signal`)
8. 08 — Between-round reset (`02-between-rounds`)
9. 09 — Ask for support (`05-someone-in-your-corner`)
10. 10 — Workday boundary (`07-workday-pause`)
11. 11 — Body-signal check-in (`08-what-hands-say`)
12. 12 — Questions before booking (`10-blue-margin`)

The twelve retained routes are the only public concept directories. Route `04-first-bell` is ordinal 01 and the immutable reference master. Routes 02–12 use the same masthead, hero, image, copy, core sections, single member form, palette, responsive layout, and shared CSS; each adds exactly one clearly labeled module before signup.

See [CONCEPT-GOALS.md](CONCEPT-GOALS.md) for the rationale behind each direction.

## Content and generation

- `tools/source-copy.mjs` is the single source for the locked reference-site copy.
- `tools/concepts.mjs` fixes the twelve-route order, gallery labels, and single shared optimized hero asset.
- `tools/source-copy.mjs` also holds the eleven approved concept-addition modules.
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

## Browser-approved visual baseline

The checker treats these SHA-256 values as the browser-approved visual baseline for 1440, 1024, 768, 390, and 320px:

- Master HTML: `492863f992b7176c3d291bd9a2657eb2cd391db774eff9b4883391210e4ad023`
- Gallery HTML: `4d52e3fd4bbb1dbbaf0aadc46d2e5616cf97566a8bb26411c919ade1224b7320`
- Ring hero WebP: `22bbe8a535d1707c6d7724f9a2d71ea9f1ff8e924d50ea690d2a251062cd07f2`
- Shared concept CSS: `e8706d7d225c5e0baa9a97b7e049d8b84d9295e9acb7dcfad195c5bc4df73045`
- Shared foundation CSS: `6e43251497390a25cdee9bf44bc4680af93bf94eb68c3f67c845e9818a83f0aa`
- Shared runtime: `aa2185bc6286dc5bf2361d4c81b70d0d7db74f95dfe8737a73cb2d76746ba529`

Actual browser screenshot verification and approval of any future hash change remain parent-owned.

## Deployment

GitHub Pages publishes directly from the `main` branch root with Jekyll disabled. GitHub's `github.io` domain provides HTTPS automatically.
