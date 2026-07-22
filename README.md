# Blue Corner coming-soon concepts

Twelve responsive coming-soon directions for Blue Corner, prepared as a public design-review prototype.

## Live review

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Directions

1. Held Seat
2. Side by Side
3. The Check-In
4. At the Corner
5. The Long Walk
6. Kitchen Light
7. Workday Pause
8. What Hands Say
9. Listening Room
10. Blue Margin
11. On the Other End
12. Two Ways In

See [CONCEPT-GOALS.md](CONCEPT-GOALS.md) for the rationale behind each direction.

## Content and generation

- `tools/source-copy.mjs` is the single source for the locked reference-site copy.
- `tools/concepts.mjs` maps the 12 titles, public slugs, descriptions, and realistic image assets.
- `node tools/generate.mjs` rebuilds the gallery and all concept HTML without dependencies or runtime fetching.
- `node tools/check-site.mjs` checks copy parity, page order, local links, security metadata, form hooks, shared brand colours, and font weights. Add `--strict-images` for the final pre-deploy gate.
- Each concept keeps its own `style.css`; the generator creates a clearly marked empty scaffold only when that file does not exist.

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
