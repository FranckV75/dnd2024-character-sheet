# Projet : Fiche de Personnage D&D 2024 - Cloud & Cadrage

## État au 19 Février 2026 - OPTIMISATION & GALERIE

### ✅ Avancées de la Session

1. **Optimisation des Images (Performance)** :
    - Conversion de toutes les images de fond du format PNG (~9 Mo) vers le format **WebP** (~1.3 Mo).
    - Gain de performance majeur : chargement plus rapide et stabilité du LocalStorage (limité à 5 Mo).
    - Standardisation du nommage des fichiers (`Fond_Nom.webp`).

2. **Amélioration de la Galerie** :
    - **Labels dynamiques** : Affichage automatique du nom du personnage sous chaque vignette (ex: "Iria", "Equipe").
    - **Refonte visuelle** : Grid CSS ajusté pour accueillir les noms, style harmonisé avec le thème sombre/clair.
    - **Nettoyage Import URL** : Suppression des références obsolètes (Free.fr) et simplification de l'interface d'ajout par lien externe.

3. **Maintenance & Bugfixes** :
    - Correction des styles CSS de la galerie pour éviter l'overflow des textes.
    - Mise à jour de `js/data.js` pour pointer vers les nouvelles ressources WebP.

### 🔑 Données de Configuration
- **Site Web** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Format Image** : Privilégier le **WebP** pour tout nouvel ajout.

### 📋 Prochaines Étapes Validées
- [ ] **Interface "Mes Personnages"** : Un menu pour lister et basculer entre ses différents héros stockés dans le cloud.
- [ ] **Grimoire : Données Étendues** : Ajouter durée, aire d'effet et description complète des sorts depuis les manuels PDF.
- [ ] **Mode "Campagne"** : Partage de données entre joueurs d'une même campagne (Loot commun, Notes).

### 📁 Architecture des Fichiers Modifiés (Session)
| Fichier | Modifications |
|---------|--------------|
| `js/data.js` | Références aux fichiers .webp renommés |
| `js/ui-gallery.js` | Logique d'affichage des noms (labels) |
| `css/style.css` | Flexbox pour la galerie, hauteur auto des items |
| `index.html` | Nettoyage de la modale galerie (textes) |

*Dernière mise à jour : 19/02/2026 19:30*
