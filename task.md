# v2.3.0 — Grimoire Intelligent

## Story 1 : Fix Filtres & Multi-sélection
- [x] Refondre `filterSpells()` pour garder les lignes vides visibles
- [x] Permettre la sélection multiple de niveaux (toggle)
- [x] Afficher un compteur "X sorts / Y total" (Logique implémentée dans script.js)

## Story 2 : Base de Données des Sorts D&D 2024
- [x] Créer `js/spells-data.js` avec l'extraction AideDD (Complete: 391 spells extracted)
- [x] Structure : name, vo, level, school, castTime, range, duration, components, concentration, ritual, classes

## Story 3 : Auto-complétion & Remplissage
- [x] Ajouter sélecteur "Classe" (filtrage contextuel basé sur char_class)
- [x] Dropdown dynamique sur le champ "Nom" filtré par classe + texte saisi
- [x] Remplissage automatique des champs (niveau, temps, portée, C/R/M, notes) à la sélection

## Story 4 : Emplacements de Sorts
- [x] Ajouter boutons ± pour ajustement manuel des slots max
- [x] Ajouter table `SPELL_SLOTS` dans `dd_rules.js` (full/half/pact, niv 1-20)
- [x] Calcul automatique des slots basés sur le niveau et la classe du personnage

## Story 5 : UX Polish
- [x] Tri par colonne (nom, niveau, école)
- [x] Colonne "École" avec badge coloré
- [x] Checkbox "Préparé" par sort
