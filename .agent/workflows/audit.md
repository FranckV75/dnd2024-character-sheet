---
description: Effectue un audit QA complet du projet (console, responsive, code)
---

# Workflow Audit QA

## Étapes

1. **Ouvrir le navigateur** sur `index.html`
2. **Vérifier la console** pour erreurs ReferenceError/TypeError
3. **Tester la navigation** entre tous les onglets (3 onglets)
4. **Tester le responsive** :
   - Redimensionner à 850px (tablette portrait)
   - Redimensionner à 1024px (tablette paysage)
5. **Audit JS** :
   - Scanner les fichiers pour code mort ou doublons
   - Vérifier les appels entre modules
6. **Audit CSS** :
   - Vérifier les variables du mode sombre
   - Confirmer l'absence de styles mobiles (<768px)
7. **Générer un rapport** avec :
   - Score de stabilité (1-10)
   - Bugs critiques
   - Suggestions d'amélioration
