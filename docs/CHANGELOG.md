# Changelog — Feuille de Personnage D&D 2024

Toutes les modifications notables du projet sont documentées dans ce fichier. Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [4.0.0-alpha.4] - 2026-10-25 (Reconstruction v4 : étape 5, branche `v4`)
### Added
- Compte en ligne (même base Supabase que la v3) : connexion avec mot de passe mémorisable, création de compte, mot de passe oublié, « Mes personnages » (ouvrir, supprimer), renommage / copie.
- Synchronisation sûre : version en ligne jamais écrasée si elle a changé ailleurs, nouvelle fiche ou import en création seule, questions dont la fermeture n'écrase rien, opérations périmées abandonnées, suivi enregistré avec la fiche (plusieurs onglets).
- 46 scénarios de synchronisation testés (faux Supabase réaliste), vérifiés par trois relectures indépendantes et des tests de mutation.
### Changed
- Tableaux d'armes, d'armures et de sorts : les cases passent à la ligne et s'agrandissent au lieu de tronquer le texte (nom complet de l'arme, dégâts, propriétés) ; plus de défilement interne.
- Valeurs des tableaux en Alegreya (en-têtes en Cinzel) : plus lisibles, mots jamais coupés à 820 px ; colonne des propriétés élargie sur tablette.
- Fiche transparente façon v3 : les cadres de texte suivent le curseur d'opacité (deux tons, l'illustration se voit à travers), verre dépoli derrière la fiche, ombre et reflet légers sur les cadres ; l'hexagone de la CA garde son contour.
### Fixed
- Champ en cours de saisie rafraîchi quand une autre version de la fiche est chargée.
- Noms v3 sur plusieurs lignes lus comme la v3 (« Kor gul »).

## [4.0.0-alpha.3] - 2026-10-25 (Reconstruction v4 : étape 4, branche `v4`)
### Added
- Tableaux d'armes, d'armures et de sorts modifiables avec auto-complétion depuis le manuel, filtres, configuration d'arme, bonus de combat (Rage, Attaque sournoise, Marque du chasseur).
- Grimoire : emplacements de sorts cochables (magie de pacte comprise), tri, infobulles de description.
- Repos court (dés de vie, minimum 1 PV par dé) et repos long conformes au PHB 2024.
- Barre « Gestion » repliable : verrou, mode cinéma, import/export (fichier ou presse-papiers), nouvelle fiche, impression, galerie de fonds, cadrage et opacité.
- Éditeur de style (gras, italique, souligné, tailles, couleurs lisibles dans les deux thèmes).
- Impression A4 : 4 pages, une par section, noir sur blanc quel que soit le thème.
### Fixed
- Bouclier sans formation sans effet sur la CA ; un seul bouclier compte.
- Sauvegarde automatique faite immédiatement à l'import et à la fermeture de la page ; messages d'état préservés.
- Tableau des armes sans défilement latéral à 820 px ; couleurs de texte v3 lisibles en thème sombre ; barres de défilement sombres ; texte riche nettoyé plus strictement ; aucune erreur console.

## [4.0.0-alpha.2] - 2026-10-25 (Reconstruction v4 : étape 3, branche `v4`)
### Added
- Fiche complète sur 4 onglets (en-tête, caractéristiques, combat, traits, dons, compétences, Odyssée, magie, trésor), reliée au store avec sauvegarde automatique dans le navigateur.
- Thèmes clair et sombre (palette v3), mise en page tablette 768–1100 px sans défilement horizontal (vérifiée à 820, 1024 et 1280 px).
- Textes longs en police à vraies minuscules (Alegreya, choisie par Franck sur la page `dev/polices.html`).
- Import / export JSON depuis la barre « Gestion ».
- Palier de renommée de l'Odyssée calculé par le moteur de règles.
### Fixed
- Cases à cocher toujours rondes, texte « 18(16) » qui ne déborde plus, aucun `!important` ni gestionnaire inline.

## [4.0.0-alpha.1] - 2026-10-25 (Reconstruction v4 : étapes 0 à 2, branche `v4`)
### Added
- Nouvelle structure (`js/data`, `js/rules`, `js/state`, `js/ui`), serveur local sans dépendance, garde-fous `npm run check` et CI.
- Moteur de règles pur `js/rules/character.js` : CA, sauvegardes, compétences, sorts, armes, épuisement.
- État unique (`js/state/store.js`), migration de toutes les anciennes sauvegardes (`js/state/migrate.js`), sauvegarde locale et fichiers JSON compatibles v3.
- Page de validation temporaire `dev/validation.html`.
- 109 tests (règles, données, migration, vraies sauvegardes de Korgul en local).
### Fixed
- Règles corrigées d'après le Manuel du joueur 2024 (emplacements Paladin/Rôdeur au niveau 1, Conduit divin, Forme sauvage, points de discipline et de sorcellerie, Défense sans armure du Moine avec bouclier).
- Dons de style de combat classés « Style de combat ».

## [3.1.1] - 2026-10-25 (Réparation express de la v3, branche `master`)
### Fixed
- L'application redémarre (déclaration `switchTab` dupliquée), boutons du grimoire et « Nouvelle fiche » réparés, chargement des sorts rétabli.

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
