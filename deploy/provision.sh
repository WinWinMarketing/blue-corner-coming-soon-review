#!/usr/bin/env bash
# Provision a fresh Ubuntu 24.04 Lightsail instance to serve the Blue Corner
# coming-soon page. Idempotent: safe to re-run.
#
#   sudo bash provision.sh
#
# Deliberately no Docker. This box runs one static site and one Node process;
# a daemon plus ~150 MB of RSS buys nothing here and makes the box harder to
# hand to a client. Caddy and systemd are already init-managed and auditable.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "run with sudo" >&2; exit 1; fi

echo "==> packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg debian-keyring debian-archive-keyring \
	apt-transport-https ufw fail2ban unattended-upgrades

echo "==> node 24"
# Ubuntu 24.04 ships Node 18. The API needs a modern runtime, and the Next.js
# app that may later share this box pins engines.node 24.x.
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v24.* ]]; then
	curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
	apt-get install -y -qq nodejs
fi
node -v

echo "==> caddy"
if ! command -v caddy >/dev/null 2>&1; then
	curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
		| gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
	curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
		> /etc/apt/sources.list.d/caddy-stable.list
	apt-get update -qq
	apt-get install -y -qq caddy
fi
caddy version

echo "==> caddy environment drop-in"
# The packaged caddy.service has NO EnvironmentFile, but deploy/Caddyfile uses
# {$BLUE_CORNER_HOST}. Without this the placeholder expands to empty, the site
# block degenerates into a global options block, and Caddy fails to start with
# a misleading "unrecognized global option: encode". A drop-in, not an edit to
# the packaged unit, which an apt upgrade would overwrite.
install -d -m 0755 /etc/systemd/system/caddy.service.d
cat > /etc/systemd/system/caddy.service.d/override.conf <<'UNIT'
[Service]
EnvironmentFile=/etc/default/caddy
UNIT
touch /etc/default/caddy
systemctl daemon-reload

echo "==> service account and directories"
id -u bluecorner >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin bluecorner
install -d -o root -g root -m 0755 /srv/blue-corner
install -d -o root -g root -m 0755 /opt/blue-corner/api
# 0700 root: the API key lives here and the service user must not be able to
# read it. systemd loads EnvironmentFile as root before dropping privileges.
install -d -o root -g root -m 0700 /etc/blue-corner
# Holds personal information when a send fails, so it is the service user's and
# nobody else's.
install -d -o bluecorner -g bluecorner -m 0700 /var/lib/blue-corner

echo "==> firewall"
ufw --force default deny incoming
ufw --force default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

echo "==> sshd"
sshd_set() {
	local key="$1" value="$2"
	if grep -qE "^\s*#?\s*${key}\b" /etc/ssh/sshd_config; then
		sed -i -E "s|^\s*#?\s*${key}\b.*|${key} ${value}|" /etc/ssh/sshd_config
	else
		printf '%s %s\n' "$key" "$value" >> /etc/ssh/sshd_config
	fi
}
sshd_set PasswordAuthentication no
sshd_set PermitRootLogin no
sshd_set ChallengeResponseAuthentication no
sshd -t
systemctl reload ssh

echo "==> fail2ban + unattended upgrades"
systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> done"
echo "Next: install the Caddyfile, /etc/default/caddy, api.env and the systemd unit."
