# Changelog - Feuille de Personnage D&D 2024

Toutes les modifications notables du projet sont documentées ici.

## [Unreleased]

### À venir
- Détection automatique du thème système (prefers-color-scheme)
- Export PDF amélioré
- Mode PWA pour installation tablette

---

## [2.1.0] - 2026-01-29

### Added
- **Micro-animations premium** sur les onglets (fadeInUp, hover effects)
- **Panneau Gestion rétractable** sur tablettes portrait (<900px)
- **Attributs ARIA** sur les boutons de suppression (accessibilité)

### Changed
- Transition toolbar avec cubic-bezier Material Design

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
