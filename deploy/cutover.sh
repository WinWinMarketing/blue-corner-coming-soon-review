#!/usr/bin/env bash
# Switch the box from the temporary nip.io verification host to the real domain.
#
# Run ON THE BOX, only AFTER:
#   1. the A records resolve to this server, and
#   2. thebluecorner.ca shows "Verified" in Resend.
#
# Both are checked below and the script refuses to run if either is false —
# flipping EMAIL_FROM to an unverified domain means every send fails 4xx and
# every signup lands in the failure log instead of an inbox.
#
#   sudo bash cutover.sh thebluecorner.ca sharf@thebluecorner.ca
#
# thebluecorner.ca already runs Google Workspace mail, so sharf@ receives today
# and the handover DNS list adds sending records only. The third pre-flight check
# below confirms that: passing an address AT a domain with no MX would send every
# signup notification into a bounce, silently, and it refuses rather than let
# that happen.
set -euo pipefail

DOMAIN="${1:-}"
NOTIFY_TO="${2:-}"
if [[ -z "$DOMAIN" || -z "$NOTIFY_TO" ]]; then
	echo "usage: sudo bash cutover.sh <domain> <notify-address>" >&2
	exit 1
fi
if [[ $EUID -ne 0 ]]; then echo "run with sudo" >&2; exit 1; fi

ENV_FILE=/etc/blue-corner/api.env
BACKUP="/etc/blue-corner/api.env.pre-cutover-$(date +%Y%m%dT%H%M%SZ)"

echo "==> pre-flight"

# 1. Does the domain actually point here?
MY_IP="$(curl -fsS --max-time 10 https://api.ipify.org)"
RESOLVED="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)"
if [[ "$RESOLVED" != "$MY_IP" ]]; then
	echo "REFUSING: $DOMAIN resolves to '${RESOLVED:-nothing}', this box is $MY_IP." >&2
	echo "Wait for DNS to propagate, then re-run." >&2
	exit 1
fi
echo "    DNS  $DOMAIN -> $MY_IP  OK"

# 2. Is the domain verified in Resend? Sending from an unverified domain fails.
KEY="$(grep '^RESEND_API_KEY=' "$ENV_FILE" | cut -d= -f2-)"
STATUS="$(curl -fsS -H "Authorization: Bearer $KEY" https://api.resend.com/domains \
	| tr ',' '\n' | grep -A1 "\"name\":\"$DOMAIN\"" | grep '"status"' | cut -d'"' -f4 || true)"
if [[ "$STATUS" != "verified" ]]; then
	echo "REFUSING: Resend reports $DOMAIN as '${STATUS:-unknown}', not 'verified'." >&2
	echo "Every send would fail and every signup would land in the failure log." >&2
	exit 1
fi
echo "    Resend  $DOMAIN  verified  OK"

# 3. If notifications are aimed at an address on this domain, that domain must
#    actually be able to RECEIVE. The handover DNS list creates sending records
#    only; without an MX on the apex, every notification bounces and every
#    signup is lost silently — the failure log never even sees them, because
#    Resend accepts the message and the bounce happens downstream.
NOTIFY_DOMAIN="${NOTIFY_TO##*@}"
if [[ "$NOTIFY_DOMAIN" == "$DOMAIN" ]]; then
	if ! host -t MX "$DOMAIN" 2>/dev/null | grep -qi "mail is handled"; then
		echo "REFUSING: notifications are aimed at $NOTIFY_TO but $DOMAIN has no MX record," >&2
		echo "so nothing at that domain can receive mail yet. Every signup would bounce." >&2
		echo "Either set up receiving first, or pass an inbox that already works." >&2
		exit 1
	fi
	echo "    MX  $DOMAIN can receive  OK"
else
	echo "    Notify  $NOTIFY_TO (off-domain, no MX needed)  OK"
fi

echo "==> backing up to $BACKUP"
cp -a "$ENV_FILE" "$BACKUP"

echo "==> rewriting $ENV_FILE"
sed -i \
	-e "s|^EMAIL_FROM=.*|EMAIL_FROM=The Blue Corner <noreply@${DOMAIN}>|" \
	-e "s|^EMAIL_TO=.*|EMAIL_TO=${NOTIFY_TO}|" \
	-e "s|^REPLY_TO=.*|REPLY_TO=${NOTIFY_TO}|" \
	-e "s|^ALLOWED_ORIGIN=.*|ALLOWED_ORIGIN=https://${DOMAIN}|" \
	"$ENV_FILE"
chown root:root "$ENV_FILE"; chmod 600 "$ENV_FILE"

echo "==> pointing Caddy at the domain"
echo "BLUE_CORNER_HOST=${DOMAIN}, www.${DOMAIN}" > /etc/default/caddy
# validate does NOT read the systemd EnvironmentFile, so pass it explicitly or
# the placeholder expands to empty and the site block becomes a global block.
env BLUE_CORNER_HOST="${DOMAIN}, www.${DOMAIN}" caddy validate --config /etc/caddy/Caddyfile

echo "==> restarting"
systemctl restart blue-corner-api
systemctl reload caddy || systemctl restart caddy
sleep 8

echo "==> verifying"
systemctl is-active blue-corner-api caddy
curl -fsS localhost:8787/api/health && echo ""
curl -sS -o /dev/null -w "    https://%{host} -> %{http_code} (tls verify %{ssl_verify_result})\n" "https://${DOMAIN}/"
ss -ltnp | grep -q '127.0.0.1:8787' && echo "    API on loopback only  OK"

cat <<DONE

Cutover complete. Still to do by hand:
  - SITE_ORIGIN=https://${DOMAIN} node tools/generate.mjs   (locally, then resync
    the site so og:image stops pointing at the old host)
  - node tools/acceptance.mjs --target https://${DOMAIN}/
  - submit one real signup and confirm it reaches ${NOTIFY_TO}

Rollback: cp $BACKUP $ENV_FILE && systemctl restart blue-corner-api
DONE
