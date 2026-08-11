# Deploying the Blue Corner coming-soon page

The site runs on its own AWS Lightsail instance: Caddy serves the static files and reverse-proxies
`/api/signup` to `server/signup-api.mjs`, which runs as a systemd service.

There is no Docker, no build step, and no dependencies. Deploying is copying files.

## Layout on the server

| Path | Contents | Mode |
|---|---|---|
| `/srv/blue-corner` | the static site (everything except `tools/`, `server/`, `deploy/`, `docs/`) | `0755 root` |
| `/opt/blue-corner/api/signup-api.mjs` | the endpoint | `0755 root` |
| `/etc/blue-corner/api.env` | `RESEND_API_KEY` and friends | **`0600 root`** |
| `/var/lib/blue-corner/failed-signups.jsonl` | recovery log, written only when a send fails | **`0600 bluecorner`** |
| `/etc/caddy/Caddyfile` | from `deploy/Caddyfile` | `0644 root` |
| `/etc/default/caddy` | sets `BLUE_CORNER_HOST` | `0644 root` |
| `/etc/systemd/system/blue-corner-api.service` | from `deploy/blue-corner-api.service` | `0644 root` |

## First run

```sh
sudo bash provision.sh                       # node 24, caddy, ufw, fail2ban, users, dirs
sudo install -m 0644 Caddyfile /etc/caddy/Caddyfile
sudo install -m 0644 blue-corner-api.service /etc/systemd/system/
sudo cp api.env.example /etc/blue-corner/api.env
sudo chmod 600 /etc/blue-corner/api.env      # then edit it and fill in the key
echo 'BLUE_CORNER_HOST=<host>' | sudo tee /etc/default/caddy

# ALWAYS before reloading. Pass the host explicitly: `caddy validate` does not
# read the systemd EnvironmentFile, so without it {$BLUE_CORNER_HOST} expands to
# empty and you get a misleading "unrecognized global option: encode".
sudo env BLUE_CORNER_HOST=<host> caddy validate --config /etc/caddy/Caddyfile
sudo systemctl daemon-reload
sudo systemctl enable --now blue-corner-api
sudo systemctl reload caddy
```

## Publishing a site change

Regenerate locally first — `index.html` is generated and byte-compared, so it must be rebuilt, not
edited:

```sh
node tools/generate.mjs
node tools/check-site.mjs --strict-images
```

Then sync everything except the tooling:

```sh
rsync -av --delete \
  --exclude 'tools/' --exclude 'server/' --exclude 'deploy/' --exclude 'docs/' \
  --exclude '.git/' --exclude '.github/' --exclude '*.md' \
  ./ ubuntu@<ip>:/tmp/blue-corner-site/
ssh ubuntu@<ip> 'sudo rsync -av --delete /tmp/blue-corner-site/ /srv/blue-corner/'
```

Caddy picks it up immediately; there is nothing to restart. Then verify against the live host:

```sh
node tools/acceptance.mjs --target https://<host>/
```

## Verifying before DNS exists

`nip.io` resolves `<dashed-ip>.nip.io` to that IP with no setup, so Caddy can obtain a real
Let's Encrypt certificate and the whole production path can be exercised before the domain is
pointed anywhere:

```sh
echo 'BLUE_CORNER_HOST=203-0-113-5.nip.io' | sudo tee /etc/default/caddy
sudo systemctl reload caddy
```

Set `EMAIL_FROM=onboarding@resend.dev` in `api.env` for this phase — Resend's sandbox sender needs no
verified domain, so real end-to-end sends work before the owner touches DNS. Switch it to the real
address once the domain shows **Verified** in Resend.

Remember to set `ALLOWED_ORIGIN` to match whichever host is live, or every POST is refused.

## Cutover to the real domain

Use `cutover.sh` rather than editing by hand — it refuses to run unless both preconditions hold:

```sh
sudo bash cutover.sh thebluecorner.ca sharf@thebluecorner.ca
```

It checks that (1) the domain actually resolves to this box, and (2) Resend reports the domain as
**verified**. The second matters most: flipping `EMAIL_FROM` to an unverified domain means every send
fails 4xx and every signup lands in the failure log instead of an inbox, silently. Both refusals have
been tested. It backs up `api.env` to `api.env.pre-cutover-<timestamp>` before touching anything.

Then, locally, so `og:image` stops pointing at the old host:

```sh
SITE_ORIGIN=https://thebluecorner.ca node tools/generate.mjs
node tools/check-site.mjs --strict-images
# resync (see "Publishing a site change")
node tools/acceptance.mjs --target https://thebluecorner.ca/
```

Finally submit one real signup and confirm it arrives.

The DNS records the domain owner has to add are in `../docs/DNS-SETUP.md`.

### Sender state

| Phase | `EMAIL_FROM` | Why |
|---|---|---|
| Pre-DNS testing | `noreply@winwinmarketing.ca` | Already verified in Resend, so delivery to any inbox works. Resend's `onboarding@resend.dev` sandbox only delivers to the account owner, which blocks testing against a real signup address. |
| After cutover | `noreply@thebluecorner.ca` | Set by `cutover.sh`, once Resend reports the domain verified. |

## Checks worth running after any change

```sh
sudo systemctl status blue-corner-api --no-pager
curl -fsS localhost:8787/api/health                     # {"ok":true}
sudo ss -ltnp | grep 8787                               # MUST be 127.0.0.1, never 0.0.0.0
sudo journalctl -u blue-corner-api -n 50 --no-pager     # must contain no names/emails/phones
curl -sI https://<host>/ | grep -Ei 'strict-transport|x-frame|x-content-type|^server'
```
