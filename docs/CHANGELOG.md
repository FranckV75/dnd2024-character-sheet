# Changelog — Feuille de Personnage D&D 2024

Toutes les modifications notables du projet sont documentées dans ce fichier. Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [2.9.13] - 2026-07-26 (Story E : Performances & Chargement)
### Added
- Attribut `defer` sur les 15 balises `<script>` dans `index.html` pour débloquer l'analyse du DOM.
- Lazy-loading asynchrone du grimoire de sorts via `fetch('data/spells.json')` réduisant la taille du bundle initial de 446 Ko.
### Changed
- Recompression des 7 images d'arrière-plan WebP (`Fond_*.webp`) réduisant le poids total de 8.8 Mo à 1.16 Mo (-87%).
- Nettoyage des requêtes Google Fonts parasites.

## [2.9.12] - 2026-07-26 (Story D : Outillage & Tests Unitaires)
### Added
- Suite de 22 tests unitaires automatisés (`node --test tests/logic.test.js`) couvrant les calculs D&D 2024 de `logic.js`.
- Configurations ESLint (`.eslintrc.json`), Prettier (`.prettierrc`) et ignore files.
- Pipeline d'intégration continue GitHub Actions (`.github/workflows/ci.yml`).
### Fixed
- Correction complète des problèmes d'encodage UTF-8 (mojibake) dans `script.js` et `storage.js`.

## [2.9.11] - 2026-07-26 (Story C : Démarrage & Synchronisation)
### Added
- Synchronisation réactive Supabase via `sb.auth.onAuthStateChange()` au lieu de délais d'attente fixes.
- Modale de résolution de conflit Cloud vs Local basée sur les horodatages `updated_at`.
- Système de notifications toast `showCloudError()` non-bloquantes en cas de problème réseau.
### Fixed
- Sécurisation par `try/catch` de tous les `JSON.parse` critiques dans `storage.js`.
- Sécurisation du renommage de personnage (création avant suppression).

## [2.9.10] - 2026-07-26 (Story B : Sécurisation Supabase & RLS)
### Added
- Script SQL [supabase/policies.sql](file:///e:/1%20-%20FV/JDR/0_Feuille_de_Perso_Antigravity/supabase/policies.sql) pour l'activation du Row Level Security (RLS) basé sur `auth.uid()`.
### Changed
- Épinglage du SDK Supabase `@2.43.4` avec contrôle d'intégrité SRI.
- Masquage et isolation du client global sous `window.sb`.

## [2.9.9] - 2026-07-26 (Story A : Neutralisation XSS)
### Added
- Intégration de la bibliothèque DOMPurify 3.1.5 (SRI).
- Helper de purification HTML `setRichHTML()` dans `storage.js` avec whitelist stricte.
### Fixed
- Remplacement de 22 points d'injection `innerHTML` vulnérables dans l'ensemble des modules JS.

## [2.9.8] - 2026-07-26 (Combat & Infobulles Sorts)
### Added
- Intégration des options "Bonus" et "Maîtrise" pour le calcul dynamique de la Classe d'Armure.
- Refonte visuelle et animation du bouton d'infobulle des sorts (💬) pour le Mode Nuit et le Mode Jour.
### Fixed
- Déblocage des événements de survol (`mouseover`) des infobulles de sorts lorsque la fiche est en mode verrouillé.

## [2.9.7] - 2026-07-26 (Impression PDF Pro 4 Pages)
### Added
- Feuille de style `@media print` dédiée garantissant le rendu sur **exactement 4 pages PDF**.
- Compacité dynamique des blocs de texte et masquage des éléments d'interface inutiles à l'impression.

## [2.9.5] - 2026-07-20 (Roster Supabase Multi-Personnages)
### Added
- Gestion de plusieurs personnages par compte Supabase.
- Modale "Mes Personnages" pour lister, charger, réinitialiser ou dupliquer des fiches.

## [2.9.0] - 2026-07-10 (Refonte D&D 2024 & 4 Onglets)
### Added
- Architecture à 4 onglets : Caractéristiques & Combat, Aptitudes & Traits, Compétences & Histoire, Magie & Équipement.
- Base de données D&D 2024 de +70 dons classés par palier d'ASI dans `feats-data.js`.
- Colonnes Maîtrise, Propriétés et Munitions pour la gestion des armes 2024.
- Indicateur de niveau de fatigue (0 à 6) dans la section Repos.

---

## [2.2.0] - 2026-02-14
### Added
- Magie & Grimoire (Tab 3) : filtres de sorts, tracker d'emplacements, trésorerie.
- Compétences & Histoire (Tab 2) : Centre de Repos court/long.

## [2.0.0] - 2026-01-29
### Added
- Système d'onglets initial (3 onglets).
- Thème sombre avec variables CSS.

## [1.0.0] - 2026-01-15
### Added
- Version initiale de la feuille de personnage D&D.
