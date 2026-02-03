---
description: Analyse le codebase et produit une spec technique avant implémentation (inspiré BMAD)
---

# Workflow Spec (Inspiré BMAD Quick-Spec)

## Philosophie
**Toujours une spec AVANT de coder.** Ce workflow analyse le projet et produit un plan technique clair avant toute implémentation.

## Étapes

1. **Analyser la demande** :
   - Quel est l'objectif fonctionnel ?
   - Quels utilisateurs sont impactés ?
   - Quelle est la priorité ?

2. **Scanner le codebase** :
   - Quels fichiers existants seront modifiés ?
   - Y a-t-il des dépendances à considérer ?
   - Consulter `/MANUELS` si règle D&D complexe

3. **Produire la Spec Technique** :
   - **Stories** : Liste numérotée des sous-tâches
   - **Fichiers impactés** : Chemin + type de modification
   - **Risques** : Points d'attention, régressions possibles
   - **Critères de validation** : Comment savoir si c'est réussi ?

4. **Attendre validation utilisateur** avant `/dev-story`

## Format de Sortie

```markdown
# Spec : [Nom de la Feature]

## Objectif
[Description en 1-2 phrases]

## Stories
1. [ ] Story 1 : [Description]
2. [ ] Story 2 : [Description]
3. [ ] Story 3 : [Description]

## Fichiers Impactés
| Fichier | Action | Détails |
|---------|--------|---------|
| `script.js` | MODIFIER | Ajouter fonction X |
| `style.css` | MODIFIER | Nouveau composant Y |
| `inventory.js` | CRÉER | Nouveau module |

## Risques
- [ ] Régression possible sur...
- [ ] Dépendance avec...

## Validation
- [ ] Test navigateur : 0 erreur console
- [ ] Test visuel : responsive tablette
- [ ] Test fonctionnel : [critère spécifique]
```

## Enchaînement Recommandé
```
/spec → [Validation User] → /dev-story → /code-review → /audit
```
