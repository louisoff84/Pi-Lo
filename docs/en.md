# Pi-Lo Documentation — English

## Overview

Pi-Lo is a lightweight web dashboard for Raspberry Pi monitoring: CPU, memory, temperature, uptime, disks and processes. The responsive interface supports French, English and Spanish.

## Quick installation

```bash
sudo apt update
sudo apt install -y git nodejs npm
git clone https://github.com/louisoff84/Pi-Lo.git
cd Pi-Lo
npm install
cp .env.example .env
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Generate a bcrypt password hash:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync(process.argv[1],12))" 'YOUR_STRONG_PASSWORD'
```

Put the generated values in `.env`, then run `npm start`. By default, Pi-Lo listens on `127.0.0.1:6943`.

## Remote access

Prefer a VPN (WireGuard/Tailscale) or an HTTPS reverse proxy. Do not expose the dashboard port directly to the public Internet. HTTPS is required in production for secure session cookies.

## VM access

Pi-Lo does not itself provide a virtual desktop. Set up a gateway such as Apache Guacamole or noVNC, secure it with HTTPS and its own authentication, then set `VM_CONSOLE_URL` in `.env`. Restart the service after changing configuration.

## systemd service

A complete example unit is included in the main README. Verify Linux account and file paths before enabling it.

## Troubleshooting

- Logs: `journalctl -u pi-lo -f`
- Status: `sudo systemctl status pi-lo`
- Ensure Node.js 20+ is installed.
- Check that `.env` contains `SESSION_SECRET` and `ADMIN_PASSWORD_HASH`.
- In production, access the site over HTTPS so the secure session cookie is sent.
