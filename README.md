# 🐉 Feuille de Personnage D&D 2024 — v4

Feuille de personnage interactive pour **Dungeons & Dragons 2024** et la campagne
**L'Odyssée des Seigneurs Dragons**, optimisée pour tablette et ordinateur.

Site en ligne : https://franckv75.github.io/dnd2024-character-sheet/ (publié depuis `master`).
La v4 est une reconstruction complète ; elle reprend automatiquement les fiches de la v3 (même
adresse, même stockage du navigateur, même compte en ligne). L'ancienne version est conservée
sous l'étiquette `v3-final`.

## Lancer en local

Prérequis : [Node.js](https://nodejs.org) 22 ou plus. Aucune dépendance à installer.

```bash
npm run dev     # serveur local → http://localhost:8080
npm test        # tests unitaires
npm run check   # tous les contrôles (à lancer avant chaque commit)
```

## Après une publication

GitHub Pages garde les fichiers en cache 10 minutes. Juste après une publication, un navigateur
peut encore afficher l'ancienne version, ou mélanger anciens et nouveaux fichiers (fiche vide ou
incomplète) : attendre 10 minutes, puis recharger la page.

## Documentation

- [Feuille de route](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Historique des versions](docs/CHANGELOG.md)
- Archives de la v3 : `docs/archive-v3/`

Les règles D&D 2024 sont la propriété de Wizards of the Coast.
