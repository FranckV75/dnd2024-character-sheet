# Changelog - Feuille de Personnage D&D 2024

Toutes les modifications notables du projet sont documentées ici.

## [Unreleased]

### À venir
- Détection automatique du thème système (prefers-color-scheme)
- Export PDF amélioré
- Mode PWA pour installation tablette

---

## [2.2.0] - 2026-02-14

### Added
- **Magie & Grimoire (Tab 3)** :
    - Filtres de sorts par niveau (0-9) avec boutons stylisés.
    - Tracker d'emplacements de sorts (slots) avec sauvegarde LocalStorage.
    - Design "Grimoire" premium (Cinzel, headers dorés).
    - Trésorerie visuelle avec icônes de pièces métalliques.
- **Compétences & Histoire (Tab 2)** :
    - Intégration du **Centre de Repos** (Court/Long).
    - Thème unifié beige foncé pour les blocs du bas (Odyssée, Apparence, Histoire).

### Changed
- Remplacement de la saisie manuelle de niveau de sort par un **menu déroulant**.
- Augmentation de la hauteur de la table des sorts (600px).
- Harmonisation des styles de bordures et de fonds sur l'ensemble de la fiche.

---

## [2.0.0] - 2026-01-29

### Added
- **Système d'onglets** : 3 onglets (Combat, Compétences, Magie)
- **Mode sombre** complet avec variables CSS
- **Système de repos** court/long avec feedback visuel

### Changed
- **Modularisation complète** : ui-toolbar, ui-modals, ui-gallery, ui-rest
- **Refactoring logic.js** : fonctions pures sans accès DOM

### Removed
- Support mobile (<768px) - Focus sur tablettes/desktop

---

## [1.0.0] - 2026-01-15

### Added
- Version initiale de la feuille de personnage
- Calculs automatiques (modificateurs, bonus de maîtrise)
- Sauvegarde LocalStorage
- Export/Import JSON
- Galerie de fonds d'écran
