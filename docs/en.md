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

Put the generated values in `.env`, then run `npm start`. By default, Pi-Lo listens on `127.0.0.1:6944`.

## Remote access

Prefer a VPN (WireGuard/Tailscale) or an HTTPS reverse proxy. Do not expose the dashboard port directly to the public Internet. HTTPS is required in production for secure session cookies.

## VM access

Pi-Lo embeds the configured remote desktop in the dashboard and provides a button to open it in a new tab. It does not run the desktop server itself:

1. Install Apache Guacamole (recommended for RDP/VNC) or noVNC on a host that can reach the VM.
2. Configure the gateway connection to the target desktop (RDP for Windows; a compatible VNC server for Linux desktops).
3. Protect the gateway with HTTPS, its own authentication, and preferably a VPN. Never expose raw VNC/RDP ports to the Internet.
4. Set `VM_CONSOLE_URL=https://your-gateway.example/` in `.env`, using the actual connection launch URL.
5. Restart Pi-Lo with `sudo systemctl restart pi-lo`.

For embedded viewing, the gateway must allow iframe embedding from the Pi-Lo origin. If it blocks framing, use the open-in-new-tab button.

## systemd service

A complete example unit is included in the main README. Verify Linux account and file paths before enabling it.

## Troubleshooting

- Logs: `journalctl -u pi-lo -f`
- Status: `sudo systemctl status pi-lo`
- Ensure Node.js 20+ is installed.
- Check that `.env` contains `SESSION_SECRET` and `ADMIN_PASSWORD_HASH`.
- In production, access the site over HTTPS so the secure session cookie is sent.
