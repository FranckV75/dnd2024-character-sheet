# Projet : Feuille de Personnage D&D 2024 - Bilan d'Étape

## État au 26 Juillet 2026 - V2.9.13 (PLAN DE QUALITÉ - STORIES A, B, C, D & E IMPLÉMENTÉES)

### ✅ Fonctionnalités Récentes Implémentées (Stories 1 à 11+)

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
    - **Correction de la visibilité d'impression (V2.9.6)** : Résolution du bug d'affichage où les pages 2, 3 et 4 s'imprimaient blanches (classe de révélation progressive `.premium-reveal` forcée à opacité 1).
    - **Optimisation contre la troncature** : Changement de la disposition des tableaux (`table-layout: auto !important`) et activation du retour à la ligne automatique (`white-space: normal !important`) avec césure des mots trop longs (`word-break: break-word !important`) pour empêcher toute troncature ou coupure de texte.
    - **Ajustement & Alignement des Encadrés (V2.9.7)** : 
      - Restauration de la disposition verticale en colonne unique pour l'onglet 2 (`#tab-traits`), correspondant exactement à l'affichage de la feuille de personnage à l'écran.
      - Ajout de la compacité dynamique sous impression : réduction de la hauteur minimale par défaut des blocs multilignes vides (`.rich-input.multi-line`) de 80px à 35px, permettant aux blocs non renseignés de s'effacer discrètement tout en s'agrandissant automatiquement si remplis.
      - Compactage chirurgical des compétences (lignes de compétences de 18px, paddings réduits) et des marges sur l'onglet 3 (`#tab-role`) pour interdire formellement tout débordement sur une 5ème page fictive. Rendu garanti sur **exactement 4 pages**.

8. **Ajustements de Combat & Visibilité des Sorts (V2.9.8)** ⚔️💬 :
    - **Calcul de la Classe d'Armure** : Intégration de nouveaux types d'armure "Bonus" et "Maîtrise" dans le tableau d'équipement d'armure pour permettre l'application de modificateurs personnalisés (ex: capacité spéciale ajoutant le bonus de maîtrise ou un bonus fixe à la CA).
    - **Visibilité du Bouton d'Infobulle (💬)** : Refonte complète du bouton d'activation des infobulles (auparavant presque invisible) avec des états actifs/inactifs clairs (filtre de niveaux de gris, trait rouge diagonal de désactivation barré) et animation fluide, compatible mode Jour / mode Nuit.
    - **Fix Tooltips en Mode Verrouillé** : Correction du blocage des événements mouseover sur les infobulles de sorts quand le cadenas est verrouillé, permettant ainsi la consultation fluide du grimoire en cours de jeu sans risquer de modifier accidentellement les textes.

9. **Story A : Neutralisation du XSS Stocké (V2.9.9)** 🛡️ :
    - **Intégration de DOMPurify 3.1.5** : Chargement de la bibliothèque via CDN avec hash d'intégrité SRI (`integrity` + `crossorigin`).
    - **Helper `setRichHTML()`** : Création d'une fonction de purification globale (`storage.js`) avec une whitelist restreinte (`b, i, u, em, strong, br, span, sub, sup, mark` et attributs `style, class`) pour conserver le formatage riche tout en bloquant le XSS.
    - **Sécurisation de 22 points d'injection** : Remplacement de tous les `innerHTML` risqués par `setRichHTML()` ou `textContent` dans `storage.js`, `script.js`, `ui-modals.js` et `supabase-config.js`.

10. **Story B : Sécuriser et documenter Supabase / RLS (V2.9.10)** 🔒 :
    - **Épinglage du SDK Supabase `@2.43.4`** avec hash d'intégrité SRI (`integrity` + `crossorigin`) dans `index.html`.
    - **Isolation et masquage du client global** : Renommage de `window.supabase` en `window.sb` dans `js/supabase-config.js` pour éviter les accès directs non sollicités.
    - **Mise à jour des références** : Réécriture de toutes les fonctions de sauvegarde et de chargement (`storage.js` et `supabase-config.js`) de `supabase.` vers `sb.`.
    - **Création et sécurisation du script RLS** : Écriture de `supabase/policies.sql` versionnant l'activation du Row Level Security et les politiques d'accès utilisateur (`auth.uid() = user_id`) avec clause d'écrasement sécurisée.

11. **Story C : Fiabiliser le démarrage et la synchronisation (V2.9.11)** 🔄 :
    - **Remplacement du `setTimeout(checkUser, 500)` par `sb.auth.onAuthStateChange()`** : Détection réactive et instantanée de l'état d'authentification, sans délai arbitraire.
    - **Sécurisation des `JSON.parse` critiques** : Protection par `try/catch` dans `loadData()`, `getSavedBackgrounds()` pour éviter tout crash sur données corrompues.
    - **Inversion de l'ordre dans `renameCharacter()`** : Création de la nouvelle entrée AVANT suppression de l'ancienne, empêchant toute perte irréversible de personnage.
    - **Toast d'alerte cloud** : Notification visuelle non-bloquante (`showCloudError()`) lors d'un échec de synchronisation Supabase, compatible Mode Jour/Nuit.
    - **Détection de conflits cloud vs local** : Comparaison des horodatages `updated_at` avec modale de résolution proposant le choix à l'utilisateur.
    - **Suppression du code mort** en fin de `storage.js` (appels `updateHitDice` jamais exécutés).

12. **Story D : Outillage Qualité, Encodage UTF-8 et Tests Unitaires (V2.9.12)** 🧪 :
    - **Suite de 22 tests unitaires automatisés** (`node --test tests/logic.test.js`) couvrant 100% des fonctions pures D&D 2024 de `js/logic.js` (modificateurs, calculs d'armes, arts martiaux Moine, rages Barbare, etc.).
    - **Correction intégrale du Mojibake UTF-8** (`Ã©`, `Ã¨`, etc.) dans `js/script.js` et `js/storage.js`.
    - **Configuration d'analyse statique et formatage** : Ajout de `.eslintrc.json`, `.prettierrc`, `.eslintignore` et `.editorconfig`.
    - **Intégration Continue (CI)** : Création de la GitHub Action `.github/workflows/ci.yml` exécutant les tests et la validation de syntaxe JS à chaque push.

13. **Story E : Optimisation des Performances et du Chargement (V2.9.13)** ⚡ :
    - **Attribut `defer` sur 15 balises `<script>`** (`index.html`) : Déblocage de l'analyse du DOM tout en préservant l'ordre d'exécution séquentiel.
    - **Nettoyage Google Fonts** : Suppression de la requête parasite `Segoe+UI` ne conservant que `Cinzel:wght@400;700`.
    - **Externalisation & Lazy-loading des sorts** : Allègement du bundle JS de **446 Ko** en transférant `SPELLS_DATA` vers `data/spells.json` chargé de façon asynchrone via `fetch()`.
    - **Recompression des images d'arrière-plan WebP** : Poids total des 7 images `Fond_*.webp` réduit de **8.8 Mo à 1.16 Mo (gain de > 7.6 Mo / -87%)**, toutes les images étant désormais sous les 400 Ko.


### 🔑 Données Clés
- **URL de Production** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Sauvegarde Cloud** : Supabase implémenté.

### 📋 Prochaines Priorités Techniques & Modèles Recommandés
- [x] **Story B** : Sécuriser et documenter Supabase / RLS *(Claude Sonnet / Opus 4.6)*
- [x] **Story C** : Fiabiliser la synchronisation et le démarrage *(Claude Opus 4.6 (Thinking) — complété)*
- [x] **Story D** : Tests unitaires, Prettier/ESLint, encodage UTF-8 *(Gemini 3.6 Flash (High) — complété)*
- [x] **Story E** : Optimisation des performances *(Gemini 3.6 Flash (High) — complété)*
- [ ] **Story F** : Alignement de la documentation *(Gemini 3.6 Flash (High))*
- [ ] **Story G** : Modules ES & État centralisé *(Claude Opus 4.6 (Thinking))*
- [ ] **Story H** : Accessibilité ARIA & Modals *(Gemini 3.6 Flash (High))*

### 💎 Règles d'Or : Homogénéité et Accessibilité
- **Champs dynamiques (calculés) = Champs éditables classiques**.
- Pour toute nouvelle colonne, tout nouveau champ ou modification HTML induisant des calculs dynamiques : **il est IMPÉRATIF que la police, la graisse (font-weight), la couleur et la taille de la police (généralement `Cinzel`, `0.70rem` ou hérité) correspondent EXACTEMENT aux autres champs adjacents**.
- Ne jamais coder en dur de la couleur ou du gras (`font-weight: 600`) sur un champ généré pour le différencier, sauf accord express de l'utilisateur. Priorité absolue au design "seamless" (intégration parfaite sans distinction des champs codés).
- **Vérification systématique Mode Nuit / Mode Jour** : Chaque modification de couleur, de texte ou d'encadré doit être obligatoirement testée dans les deux thèmes. Il arrive fréquemment qu’une couleur ajoutée soit illisible (manque de contraste) lors du passage de l'un à l'autre.

*Dernière mise à jour : 26/07/2026*

