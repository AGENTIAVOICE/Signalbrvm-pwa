# SignalBrvm — PWA

Version web (Progressive Web App) de l'application mobile **SignalBrvm / TradeHome**,
connectée à ton **vrai backend** (`pebble-coaster.vibecode.run`) et à ton **vrai projet Supabase**.
Même palette, même logo, même logique de plans (Gratuit/Pro), mêmes données en direct.

## Ce qui est inclus (v2)

- **Auth** — connexion / inscription (Supabase Auth + `/api/auth/register`)
- **Alertes** — signaux achat/vente en temps réel (Supabase Realtime)
- **Analyses** — liste + vue détail des analyses publiées
- **Marché** — grille des valeurs BRVM (`brvm_cours`), réservé au plan Pro
- **Portefeuille** — allocation cible, test de résistance, rééquilibrage, positions suivies
- **Profil** — infos compte, plan actif, déconnexion, accès Conseils/Formations
- **Abonnement** — demande de passage à Premium/Pro (validation manuelle admin, paiement mobile money)
- **Conseils IA** — choix du profil de risque (Conservateur/Équilibré/Dynamique) → plan d'action généré par Claude via `/api/conseils`
- **Formations** — les 3 niveaux, achat par mobile money (`/api/formations/purchase`), lecture des vidéos débloquées
- **Chat IA flottant** — bulle de chat (Premium/Pro uniquement) branchée sur `/api/chat-brvm` (Claude, grounded sur la formation BRVM)
- **Rafraîchissement des données** — bouton d'actualisation manuelle sur chaque écran, écoute temps réel Supabase (Alertes, Analyses, Marché), filet de sécurité par sondage toutes les 5 min
- **Mise à jour de l'app** — bannière automatique qui prévient les utilisateurs quand tu redéploies une nouvelle version (pas besoin qu'ils désinstallent/réinstallent)
- **Panel Admin** — accessible en tapant 7 fois sur le logo de l'écran de connexion (comme sur mobile) : gestion des utilisateurs (approbation, plan, suppression), validation des abonnements et achats de formations, CRUD complet des alertes/analyses/recommandations
- **Profil investisseur** — quiz complet en 12 questions (identique au mobile), scoring et 5 profils de risque (Sécuritaire/Prudent/Modéré/Dynamique/Agressif), affiché sur l'écran Profil avec score, jauge, horizon et tolérance
- **Écran Paramètres séparé** — accessible via l'icône ⚙️ sur Profil (Notifications, Sécurité, Préférences marché, Support, Légal, Déconnexion)
- **Stats de profil réelles** — Analyses lues / Alertes reçues / Ouvertures, branchées sur les vraies tables Supabase (`user_analysis_reads`, `user_alert_reads`, `user_app_opens`)
- **Lien Formations depuis Analyses** — bouton "BRVM · Nos Formations" en haut de l'écran Analyses
- **Abonnement Pro unique** — offre unique à 100 000 FCFA/an, paiement via Chariow (lien externe sécurisé), activation manuelle par un admin après paiement
- PWA installable (manifest + service worker + icônes générées depuis `icon.png`)

## Accès admin

1. Sur l'écran de connexion, tape **7 fois sur le logo doré** (comme sur l'app mobile)
2. Tu arrives sur `/admin/login` — connecte-toi avec ton compte admin existant (ex: `admin@tradehome.com`)
3. Tu accèdes au panel (4 onglets) : **Utilisateurs**, **Analyses**, **Alertes**, **Formations**

### Utilisateurs
Deux barres de recherche (administrateurs / clients) et 3 sections : Administrateurs, Clients Pro, Clients Gratuits.
Chaque client a un bouton **Activer plan Pro** (gold) ou **Plan Pro actif** (vert), plus Approuver/Rejeter/Supprimer.
C'est ici que tu actives manuellement le plan Pro d'un client après réception d'un paiement Chariow.

### Analyses / Alertes / Formations
Bouton **+** doré en haut à droite ouvre une modale de création (upload d'image/vidéo inclus pour Analyses/Formations).
Toutes les actions (créer, publier, activer/désactiver, supprimer) se répercutent **en temps réel** chez les utilisateurs
via Supabase Realtime — pas besoin qu'ils rechargent la page.

Le token admin est stocké séparément de la session utilisateur classique (indépendant de Supabase Auth côté client, comme sur mobile).

## Paiement Pro & bienvenue automatique

Le paiement se fait via un lien Chariow externe (100 000 FCFA/an, offre Pro unique).
Après paiement, va dans **Admin → Utilisateurs → Activer plan Pro** pour le client concerné.

Dès que tu actives son plan, le client :
1. Le voit se refléter **instantanément** dans l'app (écoute Supabase Realtime sur sa propre ligne `users`) — pas besoin de se reconnecter ni de recharger
2. Reçoit automatiquement une **modale de bienvenue** ("Bienvenue dans Pro 🎉") listant ce qui est débloqué, dès que la transition Gratuit → Pro est détectée

Il n'y a pas (encore) de webhook Chariow pour automatiser l'activation elle-même — seule cette dernière étape reste manuelle.

## Ce qui n'est PAS encore inclus

- Questionnaire complet de **profilage investisseur** multi-parties (remplacé par un choix direct de profil dans Conseils)
- Paramètres avancés (langue, devise, sécurité 2FA, biométrie — non applicable au web)
- Paiement automatisé (Djonanko) — remplacé par une demande manuelle validée par un admin, pour Abonnement comme pour Formations
- Upload de vidéos/images depuis le panel admin (dispo côté backend mais pas encore câblé dans cette UI)

Dis-moi si tu veux que je les ajoute.

## ⚠️ Important — CORS

Ton backend n'autorise en CORS que les domaines `*.vibecode.run` / `*.vibecodeapp.com` / localhost.
Pour que la PWA fonctionne une fois déployée sur Netlify, un **proxy transparent** est déjà configuré
(`netlify.toml` + `public/_redirects`) : le navigateur appelle `/api/*` sur ton propre domaine Netlify,
et Netlify relaie la requête côté serveur vers `pebble-coaster.vibecode.run`. Aucune CORS, aucune
modification du backend nécessaire. **Ne supprime pas ces fichiers.**

## Déploiement sur Netlify

**Option A — Glisser-déposer (le plus simple)**
1. Va sur https://app.netlify.com/drop
2. Dépose le dossier `dist/` (déjà généré, prêt à l'emploi)
3. C'est en ligne.

**Option B — Depuis les sources (recommandé pour pouvoir republier facilement)**
```bash
npm install
npm run build     # génère dist/
```
Puis connecte ce dossier à Netlify (via Git ou `netlify deploy --prod`).
Build command: `npm run build` — Publish directory: `dist` (déjà dans `netlify.toml`).

## ⚠️ Si tu redéploies une nouvelle version et que l'affichage semble figé

Cette PWA utilise un service worker (mise en cache pour le mode hors-ligne). Après un redéploiement,
il arrive que ton navigateur affiche encore l'ancienne version le temps que le nouveau service worker
prenne le relais. Deux façons de forcer la mise à jour :
1. La bannière dorée "Nouvelle version disponible" doit apparaître automatiquement — clique sur **Actualiser**.
2. Si rien n'apparaît : fais un rechargement forcé (Ctrl+Maj+R / Cmd+Maj+R), ou vide le cache du site dans les
   réglages du navigateur, ou désinstalle/réinstalle la PWA si elle est ajoutée à l'écran d'accueil.

## Robustesse

Chaque écran (utilisateur et admin) est maintenant protégé par une "error boundary" : si une donnée
inattendue (ex: un champ `null` en base) provoque une erreur d'affichage sur un écran, seul cet écran
affiche un message "Une erreur est survenue" avec un bouton Recharger — l'en-tête et la barre de
navigation restent toujours visibles et utilisables, au lieu de faire planter toute l'application.

## Profil investisseur — persistance corrigée

Le résultat du quiz (score + profil de risque) est maintenant lu **en priorité depuis Supabase**
(`user_metadata`), avec le localStorage en simple cache local. Avant, la lecture ne vérifiait que le
localStorage : si le cache navigateur était vidé (fréquent sur mobile), l'app oubliait le profil et le
redemandait à tort. Le quiz n'est maintenant proposé qu'une fois, sauf si l'utilisateur clique sur
"Refaire" lui-même.

## Audit complet (boutons & connexions)

Passage systématique sur toute l'app pour vérifier que chaque bouton fait bien quelque chose :
- **6 boutons de l'écran Paramètres étaient inertes** (Sécurité, Préférences marché, Centre d'aide,
  Évaluer l'app, Politique de confidentialité, Conditions d'utilisation) — ils sont maintenant tous
  câblés : changement de mot de passe réel, déconnexion de tous les appareils, FAQ, contact support,
  et le vrai texte légal (politique de confidentialité / CGU) porté depuis l'app mobile.
- Toutes les routes (`navigate(...)`) vérifiées contre les routes déclarées — aucune route morte.
- Tous les appels API vérifiés contre les endpoints backend réels — code mort de l'ancien système
  d'abonnement multi-plans (remplacé par Chariow) supprimé de `lib/api.ts`.
- Aucun bouton sans gestionnaire d'événement dans toute la base de code (vérifié automatiquement).

## Assistant BRVM (chat IA) — configuration requise

Le chat IA tourne désormais sur une **fonction serverless Netlify** (`netlify/functions/chat-brvm.mts`),
indépendante du backend Vibecode. La clé API Anthropic est gardée **côté serveur uniquement** — jamais
dans le code envoyé au navigateur (sinon n'importe quel visiteur pourrait la lire et l'utiliser à tes frais).

**Pour l'activer :**
1. Récupère une clé sur [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys
2. Sur Netlify : **Site configuration → Environment variables → Add a variable**
   - Nom : `ANTHROPIC_API_KEY`
   - Valeur : ta clé (commence par `sk-ant-...`)
3. Redéploie le site (Netlify → Deploys → Trigger deploy) pour que la fonction prenne en compte la variable

**⚠️ Important — déploiement Git/CLI obligatoire pour cette fonctionnalité**
Les fonctions serverless ne sont PAS incluses dans un simple glisser-déposer du dossier `dist/` sur
[app.netlify.com/drop](https://app.netlify.com/drop) (ce mode ne construit pas le projet, donc n'exécute
pas `netlify.toml` ni `netlify/functions/`). Pour que l'Assistant BRVM fonctionne, déploie via Git (connecter
le dépôt à Netlify) ou `netlify deploy --prod` en CLI — les deux modes lancent un vrai build qui inclut
la fonction. Le reste de l'app (alertes, analyses, marché, etc.) continue de fonctionner avec un simple
drag-and-drop de `dist/`, seul le chat IA a besoin du build complet.

Si la clé n'est pas configurée, le chat affiche maintenant clairement le message d'erreur exact (au lieu
de l'avaler silencieusement comme avant) — ça permet de diagnostiquer facilement.

## Fluidité — plus d'effet "web"

Avant, chaque action (supprimer, approuver, publier, activer Pro...) remplaçait toute la liste par un
texte "Chargement…" pendant le rafraîchissement. Comme la page devenait alors beaucoup plus courte,
le navigateur ramenait le défilement en haut — d'où l'impression d'écran qui devient noir puis qui
remonte tout en haut, en devant re-descendre pour vérifier le résultat.

Corrigé partout (admin ET utilisateur) avec deux changements :
1. **Mises à jour optimistes** — supprimer/approuver/publier/activer modifie l'écran **immédiatement**,
   sans attendre la réponse du serveur (qui arrive ensuite en silence pour confirmer).
2. **Rechargements silencieux** — après la confirmation serveur, les données se remplacent en place,
   sans jamais afficher d'état "vide" intermédiaire ni faire bouger le défilement.

Testé et vérifié : le défilement reste stable pendant toute l'opération, aucun flash, aucun retour en haut.

## Développement local

```bash
npm install
npm run dev
```
Le fichier `.env` pointe directement vers ton backend (autorisé en CORS pour localhost).
Le fichier `.env.production` utilise le proxy Netlify à la place.

## Compte de test

Utilise le même compte que sur l'app mobile (même Supabase, mêmes utilisateurs).
