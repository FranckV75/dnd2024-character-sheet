# Projet : Feuille de Personnage D&D 2024 - Bilan d'Étape

## État au 17 Avril 2026 - V2.9 (MULTI-PERSONNAGES & ERGONOMIE TABLETTE)

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
    - L'interception stricte avec le flag `_isLoading` empêche les auto-sauvegardes d'écraser les données lors du chargement initial de la page.

5. **Multi-Personnages & Gestion de Roster (Supabase)** 👥 :
    - La fiche supporte la gestion de multiples personnages par compte grâce à un intercepteur intelligent sur le champ "Nom".
    - Lorsqu'on renomme la fiche, le système propose : "Renommer l'existant" ou "Créer une copie".
    - Ajout d'une modale "Mes Personnages" pour lister, charger, ou supprimer un personnage directement depuis le Cloud.
    - Le bouton "Réinitialiser" a été repensé en "📄 Nouvelle fiche" pour redémarrer une création vierge sans corrompre le personnage actif.

6. **Ergonomie Tablette & Lock Mode (v2.9)** 📱 :
    - Déplacement des boutons "Mode Cinéma" (👁️) et "Cadenas" (🔓) au sommet de la barre de gestion avec une zone de clic agrandie.
    - **Fix Critique (Lock Mode)** : Résolution du bug destructeur où le cadenas convertissait accidentellement les menus déroulants (Dons) en texte éditable, corrompant les sauvegardes.
    - **Fix Scroll Tablette** : Restauration du défilement tactile (`scroll`) sur les blocs de texte verrouillés (Historique, Traits) en supprimant le blocage CSS agressif `user-select: none`.
    - Ajustement du design du curseur d'opacité avec le symbole "Brouillard" (🌫️) pour harmoniser la barre de gestion.
    - Intégration de l'image de fond `Fond_La_Team.webp` à la galerie par défaut.

### 🔑 Données Clés
- **URL de Production** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Sauvegarde Cloud** : Supabase implémenté.

### 📋 Prochaines Priorités Techniques (Prêt pour les Agents)

La prochaine session (identifiée comme la **Story 11**) débutera sur le plan technique suivant, validé par l'utilisateur :
- [ ] **Refonte du Panneau de Gestion Latéral** :
    - Écarter la confusion de nommage ("Sauvegarder/Exporter" vers "Exporter au format JSON", etc.).
- [ ] **Sauvetage du Mode d'Impression PDF** :
    - Plutôt que supprimer l'export, réécriture du CSS `@media print`. Forcer écriture noire sur fond papier blanc, et surtout décomposer la feuille pour imprimer **Un onglet par page séparée** (`page-break-before: always;`).


### 💎 Règles d'Or : Homogénéité et Accessibilité
*Ces règles ont été ajoutées suite à plusieurs régressions visuelles lors d'ajouts de fonctionnalités.*
- **Champs dynamiques (calculés) = Champs éditables classiques**.
- Pour toute nouvelle colonne, tout nouveau champ ou modification HTML induisant des calculs dynamiques : **il est IMPÉRATIF que la police, la graisse (font-weight), la couleur et la taille de la police (généralement `Cinzel`, `0.70rem` ou hérité) correspondent EXACTEMENT aux autres champs adjacents**.
- Ne jamais coder en dur de la couleur ou du gras (`font-weight: 600`) sur un champ généré pour le différencier, sauf accord express de l'utilisateur. Priorité absolue au design "seamless" (intégration parfaite sans distinction des champs codés).
- **Vérification systématique Mode Nuit / Mode Jour** : Chaque modification de couleur, de texte ou d'encadré doit être obligatoirement testée dans les deux thèmes. Il arrive fréquemment qu'une couleur ajoutée soit illisible (manque de contraste) lors du passage de l'un à l'autre.

*Dernière mise à jour : 17/04/2026*
