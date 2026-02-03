---
description: Valide la qualité du code après implémentation (inspiré BMAD)
---

# Workflow Code-Review

## Philosophie
**Validation systématique.** Chaque story implémentée passe par cette revue avant d'être considérée comme terminée.

## Étapes

1. **Revue du code modifié** :
   - Les modifications correspondent-elles à la spec ?
   - Respect des conventions (nommage, commentaires, structure)
   - Pas de code mort ou dupliqué

// turbo
2. **Tests automatisés** (si applicables) :
   - Lancer les tests existants
   - Vérifier qu'il n'y a pas de régression

3. **Test navigateur** :
   - Ouvrir `index.html`
   - Vérifier console : 0 erreur
   - Tester la fonctionnalité ajoutée
   - Tester les fonctionnalités adjacentes (régression)

4. **Validation responsive** :
   - Test à 850px (tablette portrait)
   - Test à 1024px (tablette paysage)

5. **Rapport de revue** :
   - ✅ Approuvé : Prêt pour merge/déploiement
   - ⚠️ Corrections mineures : Lister les ajustements
   - ❌ Rejeté : Retour à `/dev-story` avec raisons

## Critères d'Approbation
- [ ] Code conforme à la spec
- [ ] 0 erreur console
- [ ] Fonctionnalité validée
- [ ] Pas de régression
- [ ] Responsive OK
