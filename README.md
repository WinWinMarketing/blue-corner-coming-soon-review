# Blue Corner coming-soon concepts

Five responsive coming-soon directions for Blue Corner, prepared as a public design-review prototype.

## Live review

https://winwinmarketing.github.io/blue-corner-coming-soon-review/

## Directions

1. Ringside Signal
2. Between Rounds
3. The Open Corner
4. First Bell
5. Someone in Your Corner

See [CONCEPT-GOALS.md](CONCEPT-GOALS.md) for the rationale and recommendation.

## Privacy and safety

- Forms are interactive mockups only. They validate locally, then simulate success.
- No details are submitted, stored, tracked, or written to browser storage.
- No analytics, cookies, external fonts, third-party scripts, or API requests are used.
- The review pages request `noindex`, `nofollow`, and `noarchive`, and `robots.txt` disallows crawling.
- A restrictive content security policy blocks network connections and form actions.
- Crisis links point to Canadian 9-8-8 support and Government of Canada guidance.

This repository intentionally contains only the optimized files required for review. Working notes, source-task exports, signed attachment URLs, rejected images, full-resolution art, and screenshots are excluded.

## Deployment

GitHub Pages publishes directly from the `main` branch root with Jekyll disabled. GitHub's `github.io` domain provides HTTPS automatically.

