# Projet : Feuille de Personnage D&D 2024 - Bilan d'Étape

## État au 20 Février 2026 - IMMERSION & GALERIE

### ✅ Fonctionnalités Récentes Implémentées

1. **Mode Cinéma (Vue Immersive)** 🎬 :
    - Ajout d'un bouton fixe "Œil" en haut à gauche de la page.
    - Masque instantanément l'intégralité de l'interface (`.sheet-container`, `#toolbar`) pour ne laisser apparaître que l'illustration de fond (transition fluide de `1.2s`).
    - Le bouton devient une "Croix" pour sortir du mode.

2. **Cadrage Personnalisé du Fond d'Écran** 📐 :
    - Restauration et amélioration des *sliders* "Position Verticale" et "Zoom".
    - Ils permettent d'ajuster l'image uploadée ou choisie depuis la barre de gestion. L'impact est immédiat sur `body.style` (*background-size* et *background-position*).
    - Sauvegarde automatique dans le LocalStorage (`dd2024_bg_pos_y` et `dd2024_bg_zoom`) pour persistance entre les rechargements.

3. **Optimisation Majeure de la Galerie** 🖼️ :
    - **Performances** : Migration de tous les fonds PNG originaux vers le WebP (réduction moyenne de 85% de la taille des fichiers).
    - **UI** : Les intitulés (ex: *Equipe*, *Iria*, *Fafnir*) s'affichent correctement sous les miniatures, suite à la correction d'une contrainte CSS (`overflow: hidden` et `height: 80px`).

### 🔑 Données Clés
- **URL de Production** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Recommandation Import** : Conserver le format WebP pour tout futur fond d'écran.

### 📋 Prochaines Priorités Techniques
- [ ] **Interface "Mes Personnages"** : Menu global permettant la gestion (lister, créer, basculer) de plusieurs fiches (lié à l'implémentation Supabase).
- [ ] **Grimoire Avancé (Base de Données)** : Ajouter la durée, l'aire d'effet et la description textuelle native des sorts (parsing du PDF officiel D&D 2024).
- [ ] **Mode Campagne / Groupe** : Partage conditionnel des objets ou du butin.

### 📁 Architecture Révisée
| Fichier | État & Rôle |
|---------|-------------|
| `index.html` | Intégration du bouton `cinema-btn` hors flux et sliders cadrage dans `#toolbar-content`. |
| `js/ui-toolbar.js` | Gère l'opacité, le *toggle* du Mode Cinéma et l'appel aux CSS `updateBgZoom` / `updateBgPosY`. |
| `css/style.css` | Styles *glassmorphism* pour le Mode Cinéma (`.cinema-mode`), display *flex* pour les `.gallery-item`. |

*Dernière mise à jour : 20/02/2026*
