# Feuille de route — reconstruction v4

Chaque étape se termine par un jalon validé par Franck.

| Étape | Contenu | Jalon de validation | État |
|---|---|---|---|
| 0. Mise en place | Branche `v4`, structure, serveur local, garde-fous (`npm run check`), CI, `CLAUDE.md` | Page vide sans erreur console | ✅ |
| 1. Règles métier | `js/rules/` pur + données `js/data/` sans `window`, tests étendus, corrections de règles | Tests verts, règles vérifiées dans les manuels | 🔄 |
| 2. État & sauvegarde | Store unique, schéma, migration v3, localStorage, import/export JSON | Les sauvegardes de Korgul se chargent sans perte | ⏳ |
| 3. HTML & CSS | 4 onglets, thèmes, tablette 768–1100 px, sans `!important` ni handlers inline | Rendu validé à 820, 1024, 1280 px dans les 2 thèmes | ⏳ |
| 4. Fonctionnalités | Combat, dons, compétences, repos, grimoire, verrouillage, galerie, impression | Validation par lots | ⏳ |
| 5. Cloud | Supabase (auth, roster, conflits) sur la même base que la v3 | Synchronisation testée | ⏳ |
| 6. Bascule | Comparaison v3/v4, fusion de `v4` dans `master` | 0 régression, 0 erreur console | ⏳ |

## Décisions en attente

- Police des textes longs (Cinzel n'a pas de minuscules).
- Demandes non réalisées en v3 : lanceur de dés, synergies entre joueurs (à compléter ?).
