# Feuille de Personnage D&D 2024 — v4 (reconstruction)

Application web (HTML/CSS/JS natifs, modules ES, aucun framework, aucune étape de build) pour gérer
des personnages **D&D 2024** et **L'Odyssée des Seigneurs Dragons**, en français.

Franck n'est pas développeur : expliquer simplement, poser des questions en cas de doute,
ne jamais publier (push, déploiement) sans son accord explicite.

## Contexte

- Ancienne version (v3, cassée puis réparée a minima) : `E:\2 - CODE\0_Feuille_de_Perso_Antigravity`
  — sert de référence fonctionnelle, **ne pas la modifier** sauf demande expresse.
- Ressources (anciennes versions, manuels PDF, idées, demandes des joueurs) :
  `E:\2 - CODE\Ressources_0_Feuille_de_Perso_Antigravity`.
- Manuels qui font foi pour les règles : `E:\2 - CODE\0_Feuille_de_Perso_Antigravity\Manuels\`
  et `...\Ressources_0_Feuille_de_Perso_Antigravity\Documentation\`.
- Dépôt GitHub : `FranckV75/dnd2024-character-sheet`. `master` = site en ligne (v3, GitHub Pages).
  Ce dossier travaille sur la branche **`v4`** ; la bascule vers `master` se fera à la fin (étape 6).
- Feuille de route : `docs/ROADMAP.md`. Architecture : `docs/ARCHITECTURE.md`.

## Commandes

- `npm run dev` → serveur local sur http://localhost:8080
- `npm test` → tests unitaires (Node test runner)
- `npm run check` → syntaxe + imports + règles HTML + encodage + tests. **Doit passer avant tout commit.**

## Règles d'architecture

1. **Fonctions pures** pour toute règle de jeu dans `js/rules/` : pas de DOM, pas de `window`,
   pas de `localStorage`. Chaque règle est couverte par un test dans `tests/`.
2. **Données** de règles dans `js/data/` : objets exportés, jamais assignés à `window`.
3. **État** : une seule source de vérité, `js/state/store.js`. L'interface lit le store et
   écrit dedans ; elle ne sert jamais de stockage.
4. **Format de sauvegarde compatible v3** : le personnage est un dictionnaire « à plat »
   (`char_name`, `str_score`, `skill_prof_athletics`, `dynamic_weapons`…), identique à celui de la v3,
   car l'ancien site et le nouveau partagent la même base Supabase pendant la transition.
   Ne jamais renommer ni supprimer une clé existante ; toute conversion passe par `js/state/migrate.js`
   et est testée sur des fiches fictives (`tests/fixtures/*.json`, publiées) et sur les vraies
   sauvegardes de Korgul (`tests/fixtures/local/`, **jamais publiées** : le dépôt GitHub est public).
5. **Aucun gestionnaire inline** (`onclick=`…) dans le HTML : `addEventListener` uniquement.
   Aucune fonction exposée sur `window`.
6. **Sécurité** : jamais de `innerHTML` avec du contenu utilisateur sans passer par DOMPurify.

## Règles d'interface (héritées de la v3)

- **0 erreur console**, à tout moment.
- **Cibles** : tablettes **768 px → 1100 px** (priorité haute ; inclut l'iPad A16 en portrait ≈ 820 px)
  et desktop > 1100 px. Mobile < 768 px non supporté.
- **Homogénéité typographique** : un champ calculé a exactement la même police, taille, graisse
  et couleur que les champs voisins. Rien de codé en dur pour « distinguer » un champ calculé.
- **Police** : Cinzel pour titres et libellés. Attention, Cinzel n'a **pas de minuscules** ;
  le choix d'une police lisible pour les textes longs est une décision en attente de Franck.
- **Modes clair et sombre** : toute couleur passe par une variable CSS et est vérifiée dans les deux thèmes.
- Impression : la feuille doit rester imprimable (A4).

## Commits

Format conventionnel en anglais (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `test:`, `chore:`),
un commit par étape logique, `npm run check` vert avant chaque commit.
