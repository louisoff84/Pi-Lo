# Pi-Lo — Guide front-end noVNC

Ce guide explique comment afficher le bureau distant dans l’onglet **Bureau distant** de Pi-Lo. Pi-Lo affiche l’interface web noVNC dans une iframe, mais ne démarre pas lui-même le serveur VNC.

## Architecture

- **Pi-Lo** : tableau de bord Node.js, port local 6944 par défaut.
- **Serveur VNC** : partage l’écran du bureau Linux cible.
- **noVNC + websockify** : permet au navigateur de se connecter à VNC via WebSocket.
- **HTTPS / reverse proxy** : chiffre l’accès au navigateur.

Ne publiez jamais directement le port VNC (souvent 5900) sur Internet. Préférez un VPN et protégez aussi noVNC par authentification.

## 1. Installer noVNC

Sur la machine Linux qui héberge le bureau cible, par exemple Debian ou Raspberry Pi OS :

    sudo apt update
    sudo apt install -y git python3 python3-numpy
    sudo apt install -y novnc websockify

Les noms de paquets varient selon la distribution. Si ces paquets sont indisponibles, suivez les instructions officielles : https://github.com/novnc/noVNC et https://github.com/novnc/websockify.

Il faut également un **serveur VNC** opérationnel sur le bureau cible. noVNC n’inclut pas de serveur VNC. Vérifiez d’abord que le serveur VNC fonctionne et qu’il n’est accessible que depuis la passerelle autorisée.

## 2. Tester la passerelle noVNC

Exemple de test, si les fichiers noVNC sont dans /usr/share/novnc et si le serveur VNC écoute localement sur le port 5900 :

    websockify --web=/usr/share/novnc 6080 127.0.0.1:5900

Le port 6080 n’est qu’un exemple. Le chemin du dossier noVNC peut être différent selon le paquet. Cette commande est destinée au test ; pour une utilisation permanente, configurez un service systemd et un reverse proxy. Ne rendez pas ce port public directement sans HTTPS et contrôle d’accès.

Ouvrez l’interface noVNC depuis le réseau privé pour vérifier que le bureau est accessible. Le chemin de la page est généralement /vnc.html, mais dépend de l’installation.

## 3. Mettre noVNC derrière HTTPS

En production, configurez un reverse proxy HTTPS (Caddy ou Nginx, par exemple) devant noVNC. Le proxy doit prendre en charge **WebSocket** et transmettre les en-têtes Upgrade et Connection. Ajoutez une authentification à la passerelle et, si possible, limitez son accès à votre VPN.

L’URL finale peut ressembler à ceci :

    https://remote.example.com/vnc.html

Remplacez remote.example.com par votre vrai domaine et vérifiez que le certificat est valide. Si Pi-Lo est ouvert en HTTPS, n’utilisez pas une URL noVNC en HTTP : le navigateur peut bloquer le contenu mixte.

## 4. Relier noVNC à Pi-Lo

Sur le Raspberry Pi qui exécute Pi-Lo :

    cd ~/Pi-Lo
    nano .env

Définissez l’URL de lancement noVNC (remplacez le domaine d’exemple par votre URL réelle) :

    VM_CONSOLE_URL=https://remote.example.com/vnc.html

Enregistrez le fichier, puis redémarrez Pi-Lo :

    sudo systemctl restart pi-lo
    sudo systemctl status pi-lo --no-pager

Connectez-vous au tableau de bord, ouvrez **Bureau distant**, puis rechargez la page. Le bouton **Ouvrir dans un nouvel onglet** permet de vérifier si le problème vient de l’iframe ou de noVNC lui-même.

## 5. Autoriser l’iframe

La passerelle distante doit autoriser l’origine de Pi-Lo à l’intégrer. Si sa réponse contient Content-Security-Policy avec frame-ancestors ou X-Frame-Options interdisant l’intégration, le navigateur bloquera l’iframe. Autorisez uniquement l’origine Pi-Lo que vous contrôlez ; ne désactivez pas globalement les protections du navigateur.

Pi-Lo accepte une URL de console en HTTPS ou sur la même origine. Si Pi-Lo et noVNC utilisent deux domaines distincts, gardez les deux en HTTPS et configurez correctement les règles d’intégration et l’authentification. La connexion noVNC reste séparée de la session Pi-Lo.

## 6. Dépannage

- **Écran vide dans Pi-Lo** : ouvrez l’URL noVNC dans un nouvel onglet. Si elle ne fonctionne pas seule, corrigez d’abord noVNC/VNC.
- **WebSocket refusé** : vérifiez que le reverse proxy transmet les connexions WebSocket et consultez les journaux de websockify.
- **Iframe bloquée** : contrôlez frame-ancestors et X-Frame-Options sur la réponse noVNC.
- **Erreur de contenu mixte** : servez Pi-Lo et noVNC en HTTPS.
- **Demande répétée de mot de passe** : vérifiez l’authentification de la passerelle et les cookies.
- **Service inaccessible** : contrôlez DNS, certificat TLS, reverse proxy et journaux.

Diagnostic de Pi-Lo :

    sudo systemctl status pi-lo --no-pager
    sudo journalctl -u pi-lo -n 100 --no-pager

## Liens officiels

- noVNC : https://github.com/novnc/noVNC
- Documentation noVNC : https://novnc.com/noVNC/docs/README.md
- websockify : https://github.com/novnc/websockify

**Sécurité :** ne publiez pas VNC/RDP brut sur Internet. Utilisez HTTPS, une authentification indépendante et de préférence un VPN.
