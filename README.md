# Pi-Lo

**Pi-Lo** is a lightweight, multilingual Raspberry Pi management dashboard inspired by the idea of a personal remote-control panel. It is designed to run on modest hardware such as a Raspberry Pi 3 A+.

- System overview: CPU, memory, temperature, uptime and disk usage
- Read-only process monitor
- Password-protected session and rate-limited login
- Embedded remote desktop/VM console (Apache Guacamole or noVNC), with a fallback link in a new tab
- French, English and Spanish interface
- Responsive web interface
- Express/Node.js backend

> **Important:** Pi-Lo does not magically create remote VM access. To control a VM, configure a remote console gateway (for example Apache Guacamole or noVNC) separately, secure it with HTTPS and its own authentication, and set `VM_CONSOLE_URL`. Pi-Lo itself does not expose a shell or start/stop arbitrary processes. The remote desktop is provided by a separately installed gateway; it is not a built-in VNC/RDP server.

## Requirements

- Raspberry Pi OS or another Linux distribution
- Node.js 20 or newer
- Network access to install npm dependencies

## Installation

```bash
sudo apt update
sudo apt install -y nodejs npm
git clone https://github.com/louisoff84/Pi-Lo.git
cd Pi-Lo
npm install
cp .env.example .env
```

Generate a session secret and password hash:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "const b=require('bcryptjs'); console.log(b.hashSync(process.argv[1],12))" 'REPLACE_WITH_A_STRONG_PASSWORD'
``

Edit `.env`, paste the generated values into `SESSION_SECRET` and `ADMIN_PASSWORD_HASH`. Set `HOST=127.0.0.1` if using a local reverse proxy; use `HOST=0.0.0.0` only if you intentionally want LAN access and have configured the firewall. In production, HTTPS is required for secure session cookies.

Start:

```bash
npm start
```

Open `http://127.0.0.1:6944` locally. For remote access, prefer WireGuard/Tailscale or a reverse proxy with HTTPS. Do not port-forward port 6944 directly to the public Internet.

## Run as a systemd service

Create `/etc/systemd/system/pi-lo.service` (adjust the directory and user):

```ini
[Unit]
Description=Pi-Lo Raspberry Pi Dashboard
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=louis
WorkingDirectory=/home/louis/Pi-Lo
Environment=NODE_ENV=production
EnvironmentFile=/home/louis/Pi-Lo/.env
ExecStart=/usr/bin/node /home/louis/Pi-Lo/server.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pi-lo
sudo systemctl status pi-lo
journalctl -u pi-lo -f
```

## Remote desktop / VM console

Pi-Lo displays the configured remote desktop inside the dashboard and also provides a fallback link to open it in a new tab. The actual desktop transport is handled by a gateway, not by Pi-Lo itself.

1. Install and configure **Apache Guacamole** (recommended for RDP/VNC desktops) or **noVNC** on a host that can reach the VM.
2. Configure a connection to the target VM/desktop in that gateway. For Windows, use RDP through Guacamole; for Linux, configure a VNC server on the desktop host.
3. Publish the gateway only through HTTPS, enable its own authentication, and restrict access with a VPN where possible. Never expose raw VNC/RDP ports to the Internet.
4. Put the gateway's actual launch URL in `.env`, for example `VM_CONSOLE_URL=https://remote.example.com/`.
5. Restart Pi-Lo: `sudo systemctl restart pi-lo`.

Pi-Lo accepts HTTPS URLs or same-origin URLs. The gateway must permit iframe embedding for the embedded view to work; if it blocks framing, use the “Open in new tab” fallback or adjust the gateway's frame policy only for your trusted Pi-Lo origin. Authentication remains managed by the gateway.

## Languages

Use the language selector in the sidebar: Français (FR), English (EN), Español (ES).

## Security notes

- Use a unique, long password and a random session secret.
- Keep Node.js and dependencies updated.
- Use a VPN or HTTPS reverse proxy for remote access.
- Keep the app bound to localhost when using a reverse proxy.
- Do not expose VNC/RDP/SSH ports directly to the Internet.
- The current process page is read-only; no process-kill or shell endpoint is provided.
- The default in-memory Express session store is suitable for a small personal setup, not a large or multi-instance deployment. For a public multi-user deployment, use a persistent session store and review the deployment configuration.

## Documentation

- [Français](docs/fr.md)
- [English](docs/en.md)
- [Español](docs/es.md)

## License

MIT — see [LICENSE](LICENSE).
