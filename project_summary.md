# Projet : Feuille de Personnage D&D 2024 - Bilan d'Étape

## État au 20 Mai 2026 - V2.9.5 (RESPONSIVE TABLETTE & IMPRESSION PDF)

### ✅ Fonctionnalités Récentes Implémentées (Stories 1 à 11)

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

7. **Story 11 : Responsive Tablette standard (850px) & Mode Impression PDF** 🖨️ :
    - **Refonte de la barre de gestion** : Les boutons d'exportation ont été clarifiés ("Exportation" dans la modale) et le panneau de gestion se minimise désormais automatiquement au chargement si la largeur d'écran est inférieure à 1100px.
    - **Résolution des débordements (850px)** : Remplacement des styles de grilles et conteneurs flex en ligne rigides par des classes CSS responsives. Wrap dynamique de l'en-tête (2x2), de la ligne vitals 1 (CA, Initiative, Perception, Mort) et vitals 2 (PV, Ressource) empêchant tout rognage ou scrollbar horizontal à 850px.
    - **Mode Impression PDF Pro** : Ajout d'une règle `@media print` exhaustive forçant le noir sur blanc haute lisibilité, masquant les outils d'interface superflus, affichant tous les onglets en continu et insérant un saut de page physique (`page-break-before: always;`) avant chaque onglet (4 pages distinctes).

### 🔑 Données Clés
- **URL de Production** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Sauvegarde Cloud** : Supabase implémenté.

### 📋 Prochaines Priorités Techniques (Prêt pour la suite)
- [ ] Valider l'impression PDF en conditions réelles avec le navigateur physique de l'utilisateur.
- [ ] Recueillir les retours de l'utilisateur pour de futures extensions (par exemple, d'autres automatisations de règles D&D 2024).

### 💎 Règles d'Or : Homogénéité et Accessibilité
- **Champs dynamiques (calculés) = Champs éditables classiques**.
- Pour toute nouvelle colonne, tout nouveau champ ou modification HTML induisant des calculs dynamiques : **il est IMPÉRATIF que la police, la graisse (font-weight), la couleur et la taille de la police (généralement `Cinzel`, `0.70rem` ou hérité) correspondent EXACTEMENT aux autres champs adjacents**.
- Ne jamais coder en dur de la couleur ou du gras (`font-weight: 600`) sur un champ généré pour le différencier, sauf accord express de l'utilisateur. Priorité absolue au design "seamless" (intégration parfaite sans distinction des champs codés).
- **Vérification systématique Mode Nuit / Mode Jour** : Chaque modification de couleur, de texte ou d'encadré doit être obligatoirement testée dans les deux thèmes. Il arrive fréquemment qu'une couleur ajoutée soit illisible (manque de contraste) lors du passage de l'un à l'autre.

*Dernière mise à jour : 20/05/2026*
