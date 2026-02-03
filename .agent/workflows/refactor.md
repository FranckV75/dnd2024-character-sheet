---
description: Refactorise le code avec tests de non-régression
---

# Workflow Refactorisation Sécurisée

## Étapes

// turbo
1. `git stash` (sauvegarder les modifications en cours si nécessaires)

2. **Analyser le fichier ciblé** pour identifier :
   - Code dupliqué
   - Fonctions trop longues (>50 lignes)
   - Dépendances mal organisées

3. **Effectuer les modifications** en respectant :
   - Une seule responsabilité par fonction
   - Noms descriptifs en français
   - Commentaires JSDoc

// turbo
4. **Tester dans le navigateur** :
   - 0 erreur console obligatoire
   - Vérifier visuellement les fonctionnalités modifiées

5. **Comparer avant/après** :
   - Capture screenshot si changement visuel
   - Confirmer comportement identique

// turbo
6. **Si OK** : `git commit -m "refactor: [description]"`

// turbo
7. **Si KO** : `git stash pop` pour restaurer l'état précédent
