# AUREON Trading Academy

Tableau de bord de trading & formation avec **données de marché réelles** et **calendrier économique réel**.
Le **tableau de bord est la page d'accueil**, la connexion et l'inscription sont fonctionnelles, et **aucun signal de trading ni analyse IA** n'est généré.

## ✨ Ce qui est inclus (site prêt à l'emploi)
Dossier : [`trading-academy/design-prototype`](trading-academy/design-prototype)

| Fichier | Rôle |
|---|---|
| `index.html` | Tableau de bord = **page d'entrée** (l'ancienne page marketing a été supprimée) |
| `login.html` / `register.html` | Connexion & inscription **fonctionnelles** (validation + session) |
| `auth.js` | Authentification côté client (localStorage, mot de passe haché SHA-256) |
| `app.js` | Données de marché réelles + calendrier économique réel + graphiques |
| `styles.css` | Design system (dark, glassmorphism néon) |
| `calendar.json` | Instantané réel du calendrier (repli hors-ligne) |

## 📊 Données réelles (gratuites, sans clé API)
- **Forex** — Frankfurter (taux de référence BCE) : prix **+ date valide**, variation quotidienne réelle
- **Crypto** — CoinGecko : prix, variation 24h, horodatage temps réel
- **Métaux** (Or / Argent / Platine) — gold-api.com : prix + horodatage
- **Force des devises** — calculée à partir des variations quotidiennes réelles
- **Calendrier économique** — ForexFactory (faireconomy) en direct via lecteur Jina, avec repli sur `calendar.json` (événements datés : impact, prévision, précédent)

## ✅ Modifications demandées
- [x] Accès **direct au tableau de bord** (suppression de la page d'accueil marketing)
- [x] **Connexion / inscription** corrigées et fonctionnelles
- [x] **Suppression de tous les signaux et analyses IA** (carte « Derniers signaux », colonne « Signal », « Scanner IA », menu Signaux)
- [x] **Prix de chaque marché réels et datés**
- [x] **Calendrier économique réel** avec détails (impact, prévision, précédent)

## ▶️ Lancer en local
```bash
cd trading-academy/design-prototype
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/
```
Un petit serveur HTTP est recommandé (les appels réseau vers les API échouent en `file://`).

## Note
Le dépôt contient aussi un **squelette full-stack optionnel** (Django + React) issu du générateur ; le site fonctionnel ci-dessus est indépendant et se suffit à lui-même.
