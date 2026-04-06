# Projet : Feuille de Personnage D&D 2024 - Bilan d'Étape

## État au 6 Avril 2026 - REFONTE STRUCTURELLE V2.4 TERMINÉE

### ✅ Fonctionnalités Récentes Implémentées (Stories 1 à 10)

1. **Architecture Globale à 4 Onglets** 📑 :
    - La navigation est refaite sur 4 onglets : Caractéristiques & Combat, Aptitudes & Traits, Compétences & Histoire, Magie & Équipement.
    - Le `localStorage` et les champs existants (`data-name`) ont survécu au déplacement HTML.

2. **Refonte D&D 2024 (Armes, Armures & Dons)** ⚔️🛡️ :
    - Scraping exhaustif de plus de 70 dons D&D 2024 (`feats-data.js`) avec affichage dynamique par palier d'ASI (Niv 1, 4, 8, etc.) en gérant les prérequis et descriptions automatiques.
    - Les armes ont gagné les colonnes Maîtrise, Propriétés et Munitions avec autocomplétion des données 2024.
    - Le bloc Armures gère désormais l'encombrement, la Furtivité et intègre les règles 2024.
    - Une case "Niveau de Fatigue D&D 2024" (de 0 à 6) a été intégrée dans la section Repos.

3. **Optimisations Esthétiques & Grimoire** 🎨 :
    - Ajustement chirurgical des boîtes "Outils" et "Langues" dans l'onglet Compétences avec un ascenseur propre (max 2/5 lignes) pour correspondre au design premium du Charisme.
    - Ajout du cartouche "Alignement".
    - La très laborieuse case à cocher "Préparé" du Grimoire a été repensée comme une **zone de texte centré** avec totale rétrocompatibilité.

4. **Correctifs Multiples & Persistance** 💾 :
    - Les menus de "Sous-classe" reconnaissent bien l'architecture des règles révisée.
    - Les données des Dons dans l'onglet des Traits (basées sur `.dataset.name` et non leur `.name`) sont maintenant scannées adéquatement par les fonctions de `localStorage`/`Supabase`.

### 🔑 Données Clés
- **URL de Production** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Sauvegarde Cloud** : Supabase implémenté.

### 📋 Prochaines Priorités Techniques (Prêt pour les Agents)

La prochaine session (identifiée comme la **Story 11**) débutera sur le plan technique suivant, validé par l'utilisateur :
- [ ] **Refonte du Panneau de Gestion Latéral** :
    - Écarter la confusion de nommage ("Sauvegarder/Exporter" vers "Exporter au format JSON", etc.).
- [ ] **Sauvetage du Mode d'Impression PDF** :
    - Plutôt que supprimer l'export, réécriture du CSS `@media print`. Forcer écriture noire sur fond papier blanc, et surtout décomposer la feuille pour imprimer **Un onglet par page séparée** (`page-break-before: always;`).

*Dernière mise à jour : 06/04/2026*
