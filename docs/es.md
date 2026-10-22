# Documentación de Pi-Lo — Español

## Descripción

Pi-Lo es un panel web ligero para supervisar Raspberry Pi: CPU, memoria, temperatura, tiempo activo, discos y procesos. La interfaz adaptable está disponible en francés, inglés y español.

## Instalación rápida

```bash
sudo apt update
sudo apt install -y git nodejs npm
git clone https://github.com/louisoff84/Pi-Lo.git
cd Pi-Lo
npm install
cp .env.example .env
```

Genera un secreto de sesión:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Genera un hash bcrypt para la contraseña:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync(process.argv[1],12))" 'TU_CONTRASEÑA_SEGURA'
```

Añade los valores a `.env` y ejecuta `npm start`. Por defecto, Pi-Lo escucha en `127.0.0.1:6943`.

## Acceso remoto

Se recomienda una VPN (WireGuard/Tailscale) o un proxy inverso HTTPS. No expongas directamente el puerto del panel a Internet. En producción se requiere HTTPS para la cookie de sesión segura.

## Acceso a una VM

Pi-Lo no incluye un escritorio virtual propio. Configura una pasarela como Apache Guacamole o noVNC, protégela con HTTPS y autenticación independiente y define `VM_CONSOLE_URL` en `.env`. Reinicia el servicio después de cambiar la configuración.

## Servicio systemd

El README principal incluye un ejemplo completo. Comprueba el usuario de Linux y las rutas antes de activarlo.

## Solución de problemas

- Registros: `journalctl -u pi-lo -f`
- Estado: `sudo systemctl status pi-lo`
- Comprueba que Node.js 20+ esté instalado.
- Comprueba que `.env` contenga `SESSION_SECRET` y `ADMIN_PASSWORD_HASH`.
- En producción, accede por HTTPS para que funcione la cookie segura.
