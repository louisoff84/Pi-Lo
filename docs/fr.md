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

Renseignez les valeurs dans `.env`, puis lancez `npm start`. Par défaut, le service écoute sur `127.0.0.1:6944`.

## Accès distant

Privilégiez un VPN (WireGuard/Tailscale) ou un reverse proxy HTTPS. Ne redirigez pas directement le port du dashboard sur Internet. En production, utilisez HTTPS afin que le cookie de session sécurisé fonctionne.

## Accès à une VM

Pi-Lo affiche le bureau distant dans un cadre intégré, avec un bouton pour l’ouvrir dans un nouvel onglet. Il ne crée pas lui-même le serveur de bureau :

1. Installez Apache Guacamole (recommandé pour RDP/VNC) ou noVNC sur une machine qui peut joindre la VM.
2. Configurez la connexion vers le bureau cible dans la passerelle (RDP pour Windows, VNC pour un bureau Linux compatible).
3. Protégez la passerelle par HTTPS, son authentification propre et, idéalement, un VPN. N'exposez jamais directement les ports VNC/RDP sur Internet.
4. Définissez `VM_CONSOLE_URL=https://votre-passerelle.example/` dans `.env`, en utilisant l’URL de lancement réelle de la connexion.
5. Redémarrez Pi-Lo avec `sudo systemctl restart pi-lo`.

Pour l’affichage intégré, la passerelle doit autoriser l’intégration iframe depuis l’origine Pi-Lo. Si elle la bloque, utilisez le bouton d’ouverture dans un nouvel onglet.

## Service systemd

Le fichier de service complet se trouve dans le README. Vérifiez les chemins et le compte Linux avant de l'activer.

## Dépannage

- Journaux : `journalctl -u pi-lo -f`
- État : `sudo systemctl status pi-lo`
- Vérifiez que Node.js 20+ est installé.
- Vérifiez que `.env` contient `SESSION_SECRET` et `ADMIN_PASSWORD_HASH`.
- Si le cookie de session ne fonctionne pas, confirmez que vous accédez au site en HTTPS en production.
