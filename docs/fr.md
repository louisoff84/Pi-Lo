# Documentation Pi-Lo — Français

## Présentation

Pi-Lo est un tableau de bord web léger pour surveiller un Raspberry Pi : processeur, mémoire, température, temps de fonctionnement, disques et processus. L'interface est adaptée aux mobiles et fonctionne en français, anglais et espagnol.

## Installation rapide

```bash
sudo apt update
sudo apt install -y git nodejs npm
git clone https://github.com/louisoff84/Pi-Lo.git
cd Pi-Lo
npm install
cp .env.example .env
``

Générez un secret de session :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
``

Générez un hash bcrypt du mot de passe :

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync(process.argv[1],12))" 'VOTRE_MOT_DE_PASSE_FORT'
``

Renseignez les valeurs dans `.env`, puis lancez `npm start`. Par défaut, le service écoute sur `127.0.0.1:6943`.

## Accès distant

Privilégiez un VPN (WireGuard/Tailscale) ou un reverse proxy HTTPS. Ne redirigez pas directement le port du dashboard sur Internet. En production, utilisez HTTPS afin que le cookie de session sécurisé fonctionne.

## Accès à une VM

Pi-Lo ne fournit pas lui-même un bureau virtuel. Installez une passerelle telle qu'Apache Guacamole ou noVNC, protégez-la par HTTPS et une authentification propre, puis configurez `VM_CONSOLE_URL` dans `.env`. Redémarrez le service après modification.

## Service systemd

Le fichier de service complet se trouve dans le README. Vérifiez les chemins et le compte Linux avant de l'activer.

## Dépannage

- Journaux : `journalctl -u pi-lo -f`
- État : `sudo systemctl status pi-lo`
- Vérifiez que Node.js 20+ est installé.
- Vérifiez que `.env` contient `SESSION_SECRET` et `ADMIN_PASSWORD_HASH`.
- Si le cookie de session ne fonctionne pas, confirmez que vous accédez au site en HTTPS en production.
