# Casper Bot — Analyse par capture d'écran (Order Block / ICT)

Dépose une capture de ton graphique (TradingView, MT5, peu importe la source) → le bot l'analyse selon la grille 5 étoiles order block / ICT enseignée dans les vidéos sources → tu valides ou ajustes les niveaux → exécution réelle (démo) sur ton compte Exness via le pont MT5.

**Plus de flux de données live, plus de scan automatique en continu.** C'est un choix délibéré après plusieurs jours de galère avec les API tierces (Finnhub, FCS) peu fiables sur leurs plans gratuits — l'image que tu fournis est désormais la seule source d'analyse. Moins de pièces mobiles, moins de points de panne.

## 1. Déployer le dashboard (Vercel)

1. Pousse ce dossier sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com) : Add New → Project → Import ton dépôt.
3. Dans **Environment Variables**, ajoute toutes les clés de `.env.example`.
4. **Deploy**.
5. Sur [supabase.com](https://supabase.com) : crée un projet, SQL Editor → colle `supabase/schema.sql` → Run.
6. Ouvre ton URL Vercel → connecte-toi avec le `DASHBOARD_PASSWORD` défini.

## 2. Configurer ton compte Exness

Dans le dashboard → clique le bloc compte dans la sidebar (ou "Réglages") → renseigne login / mot de passe trader / serveur. Modifiable à tout moment depuis là, sans toucher au code.

## 3. Installer le pont MT5 (exécution réelle des ordres)

1. Installe MetaTrader 5, connecte-toi une fois manuellement pour vérifier.
2. Installe Python 3.10+.
3. Dans `mt5-bridge/` : `pip install -r requirements.txt`, crée `.env` avec `API_BASE_URL` (ton URL Vercel) et `BRIDGE_SECRET` (même valeur que sur Vercel).
4. Dans MT5 → Market Watch → Afficher tout, vérifie les noms exacts des symboles et ajuste `SYMBOL_MAP` dans `bridge.py` si besoin.
5. `python bridge.py`.

Le pont interroge le dashboard toutes les 15 secondes pour récupérer les positions validées et les exécuter — aucun port à ouvrir sur ta box.

## Utilisation

1. Choisis l'actif concerné par ta capture (EUR/USD, US Oil, Or, Bitcoin).
2. Dépose l'image (glisser-déposer ou clic).
3. Le bot lit le graphique et applique la grille 5 étoiles de Casper : imbalance, tendance, liquidité, fraîcheur, zone Fibonacci — chaque critère est explicité.
4. Vérifie/ajuste les niveaux d'entrée, stop loss, take profit proposés (**lecture approximative de l'image, pas une donnée de marché garantie** — toujours vérifier avant validation).
5. "Envoyer en file de validation" → apparaît dans la file → "Approuver" → le pont MT5 exécute réellement l'ordre sur ton compte démo.

## Répartition des modèles IA

| Modèle | Rôle |
|---|---|
| `ising-calibration` (vision) | Lecture et notation du graphique déposé — le cœur du bot |
| `nemotron` | Filtre de sécurité final, croise le score avec le contexte macro, affiché en avertissement |
| `muse-glimmer` | Reformulation rapide de la narration |
| `laguna-xs` | Bilan post-trade à la demande (bouton dédié), suggestions de réglages jamais appliquées automatiquement |

## L'image n'est jamais stockée

Reçue en mémoire, envoyée au modèle vision, oubliée dès la réponse renvoyée — aucune écriture sur disque ni en base de données, à aucun moment.

## Sécurité

- Dashboard protégé par mot de passe (`DASHBOARD_PASSWORD`).
- Identifiants MT5 stockés dans Supabase, accessibles uniquement via la clé `service_role` (serveur) et le pont (`BRIDGE_SECRET`).
- Trois secrets distincts à générer toi-même : `BRIDGE_SECRET`, `DASHBOARD_PASSWORD`, et la clé `service_role` de Supabase — jamais dans le code, jamais commités.

## Avertissement

Ceci n'est pas un conseil financier. Les niveaux de prix lus sur une image par un modèle vision sont approximatifs — vérifie-les toujours avant validation. Teste longuement en démo avant d'envisager un compte réel. Les scores "étoiles" sont des heuristiques dérivées de contenus pédagogiques publics, pas une garantie de résultat.
