# Projet : Feuille de Personnage D&D 2024 - Bilan d'Étape

## État au 22 Février 2026 - POLISH, ODYSSÉE & RESPONSIVE

### ✅ Fonctionnalités Récentes Implémentées

1. **Refonte Encadré "Odyssée des Seigneurs Dragons"** ⚔️ :
    - Inversion des champs "Renommée" et "Points de Renommée".
    - Le champ "Points" accepte des valeurs de 0 à 20 maximum.
    - Ajout du calcul dynamique via `updatePalier()` dans `script.js` : le libellé "Palier" se met à jour automatiquement en lisant le nombre de points (Ex: 1-5 = Célébrité locale, 19-20 = Divin).
    - Ajustement visuel des ratios CSS (`class="odyssey-box"`) pour privilégier l'espace alloué au texte du Palier (read-only) par rapport aux points numériques.

2. **Affichage sur Tablette (iPad 11" & Portrait)** 📱 :
    - Correction lourde de la réactivité pour le mode Portrait (limité à ~820px de large).
    - **Gestion du débordement** : Ajout d'un zoom arrière forcé (`zoom: 0.9` en paysage, et `0.75` en portrait) sur le `.sheet-container` pour s'assurer que la feuille entière (1100px nativement) tienne à l'écran sans créer de barre de défilement horizontale désagréable.
    - **Barre d'outils rétractable** : Modification de la Media Query (`max-width: 1100px` au lieu de `900px`). Dès qu'on passe sur un iPad, le panneau noir `#toolbar` se plie sur le côté et révèle son contenu entier uniquement au `hover`, empêchant tout chevauchement avec la zone des Trésors (PO, PP).
    - **Bugfix (Grille Combat)** : Restauration de la colonne des caractéristiques (Force, Dex...) à gauche via la classe ré-intégrée `.combat-grid` qui gère correctement le flex en mobile.

3. **Mode Cinéma & Galerie (Récap)** 🎬 :
    - Mode Cinéma opérationnel via effet glassmorphism (transition 1.2s).
    - Galerie optimisée (WebP), sliders de recadrage (Position Y, Zoom) restorés et persistants.

### 🔑 Données Clés
- **URL de Production** : `https://franckv75.github.io/dnd2024-character-sheet/`

### 📋 Prochaines Priorités Techniques (Prêt pour les Agents)
- [ ] **Restructuration de l'Onglet 3 (Armes & Grimoire)** : Ajout possible d'un ou plusieurs sous-onglets pour la gestion des Armes qui prend beaucoup de place. Alignement des inputs Att/DD et Dégâts avec leurs en-têtes.
- [ ] **Mode Multi-Personnages (Supabase)** : Menu global (lister, basculer).
- [ ] **Grimoire Avancé** : Lier les listes de sorts du PDF officiel D&D 2024.

*Dernière mise à jour : 22/02/2026*
