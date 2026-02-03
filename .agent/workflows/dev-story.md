---
description: Implémente une story de la spec technique
---

# Workflow Dev-Story (Inspiré BMAD)

## Philosophie
**Une story à la fois.** Ce workflow implémente une seule story issue d'une spec validée.

## Prérequis
- Une spec technique validée (`/spec` exécuté et approuvé)
- Story à implémenter identifiée

## Étapes

// turbo
1. **Vérifier l'état Git** : `git status` (s'assurer qu'on part d'un état propre)

2. **Implémenter la story** :
   - Modifier les fichiers identifiés dans la spec
   - Respecter les conventions du projet (voir `project-brief.md`)
   - Ajouter les aria-labels si nouveaux éléments interactifs

// turbo
3. **Tester dans le navigateur** :
   - 0 erreur console
   - Vérification visuelle
   - Test de la fonctionnalité

4. **Marquer la story comme terminée** dans la spec

// turbo
5. **Commit atomique** : `git commit -m "feat: [nom de la story]"`

## Critères de Succès
- [ ] Story implémentée selon la spec
- [ ] Tests passés
- [ ] Commit effectué
- [ ] Prêt pour `/code-review`
