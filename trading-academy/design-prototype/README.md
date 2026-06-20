# AUREON — Prototype (site statique)

Le tableau de bord est la **page d'accueil** (`index.html`). L'ancienne page marketing a été supprimée.

## Pages
- `index.html` → tableau de bord (page d'entrée)
- `login.html` → connexion (fonctionnelle)
- `register.html` → inscription (fonctionnelle)
- `auth.js` → authentification côté client (localStorage + mot de passe haché SHA-256)
- `app.js` → données de marché **réelles** + calendrier économique réel + charts
- `styles.css` → design system
- `calendar.json` → instantané réel du calendrier (repli hors-ligne)

## Données réelles (gratuites, sans clé API)
- **Forex** : Frankfurter (taux BCE) — prix + dates valides
- **Crypto** : CoinGecko — prix + variation 24h + horodatage
- **Métaux** : gold-api.com — prix + horodatage
- **Calendrier économique** : ForexFactory (faireconomy) via lecteur Jina, repli `calendar.json`
- **Force des devises** : calculée à partir des variations quotidiennes réelles

Aucun signal de trading ni analyse IA n'est généré.

## Lancer
Ouvrir `index.html` via un petit serveur (pour les appels réseau) :
```bash
python3 -m http.server 8000
# puis http://localhost:8000/
```
