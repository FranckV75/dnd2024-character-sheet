# Feuille de route — reconstruction v4

Chaque étape se termine par un jalon validé par Franck.

| Étape | Contenu | Jalon de validation | État |
|---|---|---|---|
| 0. Mise en place | Branche `v4`, structure, serveur local, garde-fous (`npm run check`), CI, `CLAUDE.md` | Page vide sans erreur console | ✅ |
| 1. Règles métier | `js/rules/` pur + données `js/data/` sans `window`, tests étendus, corrections de règles | Tests verts, règles vérifiées dans les manuels | ✅ |
| 2. État & sauvegarde | Store unique, schéma, migration v3, localStorage, import/export JSON | Les sauvegardes de Korgul se chargent sans perte | 🔄 |
| 3. HTML & CSS | 4 onglets, thèmes, tablette 768–1100 px, sans `!important` ni handlers inline | Rendu validé à 820, 1024, 1280 px dans les 2 thèmes | ⏳ |
| 4. Fonctionnalités | Combat, dons, compétences, repos, grimoire, verrouillage, galerie, impression | Validation par lots | ⏳ |
| 5. Cloud | Supabase (auth, roster, conflits) sur la même base que la v3 | Synchronisation testée | ⏳ |
| 6. Bascule | Comparaison v3/v4, fusion de `v4` dans `master` | 0 régression, 0 erreur console | ⏳ |

## Corrections de règles apportées (vérifiées dans le Manuel du joueur 2024)

- Paladin et Rôdeur : 2 emplacements de sorts de niveau 1 dès le niveau 1 (la v3 en donnait 0).
- Clerc : Conduit divin à partir du niveau 2 (la v3 l'affichait dès le niveau 1).
- Druide : Forme sauvage à partir du niveau 2, 4ᵉ utilisation au niveau 17 (la v3 : niveau 1 et 14).
- Moine et Ensorceleur : points de discipline / de sorcellerie à partir du niveau 2.
- Moine : la Défense sans armure ne s'applique plus avec un bouclier.
- Les 10 dons de style de combat sont classés « Style de combat » (et non « Général »).

## Données à compléter

- Les 12 Faveurs épiques n'ont pas de description.

## Décisions en attente

- Police des textes longs (Cinzel n'a pas de minuscules).
- Demandes non réalisées en v3 : lanceur de dés, synergies entre joueurs (à compléter ?).
