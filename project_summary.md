# 📜 Fiche D&D 2024 - Synthèse du Projet

> **Document de référence** pour les futures sessions de développement.  
> Dernière mise à jour : 14 février 2026

---

## 🏗️ Architecture Technique

### Structure des Fichiers
```
0_Feuille_de_Perso_Antigravity/
├── index.html          # Structure HTML principale (~630 lignes)
├── css/
│   └── style.css       # Styles globaux + Dark Mode (~1650 lignes)
├── js/
│   ├── data.js         # Constantes (SKILLS, DEFAULT_BGS)
│   ├── dd_rules.js     # Règles D&D 2024 (classes, espèces, etc.)
│   ├── logic.js        # Calculs D&D purs (sans DOM)
│   ├── storage.js      # Gestion localStorage + import/export JSON
│   ├── script.js       # Orchestrateur principal (init, events, DOM)
│   ├── theme.js        # Gestion du Dark Mode
│   └── ui-*.js         # Modules UI (toolbar, modals, rest, gallery)
├── task.md             # Suivi des tâches (Grimoire Intelligent)
└── docs/               # Documentation (CHANGELOG, ARCHITECTURE)
```

### Principe de Séparation des Responsabilités
- **`logic.js`** : Fonctions pures (calculs D&D 2024). Aucun accès DOM.
- **`storage.js`** : Gestion localStorage + import/export JSON.
- **`script.js`** : Orchestrateur, gestions des filtres et slots de sorts.
- **`ui-*.js`** : Modules spécialisés pour l'interface (séparation des modales, toolbar, etc.).

---

## 🎮 Logique de Jeu Implémentée

### Magie & Grimoire (D&D 2024)
- **Multi-filtres** : Sélection multiple de niveaux (0-9) via un Set actif.
- **Lignes Vides** : Toujours visibles pour permettre l'ajout rapide de sorts personnalisés.
- **Slots Tracker** : Compteur d'emplacements avec boutons `+` et `-` manuels.
- **Sauvegarde** : Les slots utilisés et max sont persistés par niveau dans LocalStorage.

### Dés de Vie (Hit Dice)
- **Total** = Niveau du personnage (calculé automatiquement).
- **Régénération** : Sélecteur dynamique mis à jour à chaque changement de niveau.

### Ressources de Classe
Gérées par `getClassResourceInfo(level, className, mods)` :
- Barbare (Rages), Barde (Inspiration), Moine (Ki), Paladin (Conduit Divin), etc.

---

## ✅ Tâches Réalisées (Dernières)

- [x] **Story 1 (Grimoire)** : Multi-filtrage des sorts et visibilité des lignes vides.
- [x] **Story 4 (Grimoire)** : Boutons d'ajustement manuel (+/-) pour les emplacements de sorts.
- [x] **Dark Mode CSS** : Correction de la lisibilité des menus déroulants de niveau de sort en mode sombre.
- [x] **Modularisation JS** : Extraction des fonctionnalités UI dans des fichiers dédiés.

---

## 📌 En cours (Roadmap : Grimoire Intelligent)

1. **Extraction de la Base de Sorts** (Story 2) : Importation des 391 sorts AideDD D&D 2024.
2. **Auto-complétion** (Story 3) : Remplissage intelligent des champs de sorts lors de la saisie.
3. **Automatisation Slots** (Story 4) : Calcul automatique des slots max selon le niveau officiel de la classe.
4. **UX Finish** (Story 5) : Tri des colonnes, badges visuels pour les écoles de magie.
