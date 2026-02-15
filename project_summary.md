# Projet : Fiche de Personnage D&D 2024 - Cloud & Sync

## État au 15 Février 2026 (Soir) - GRIMOIRE & POLISH

### ✅ Avancées de la Session

1. **Grimoire : Autocomplétion des Sorts** : Système d'autocomplétion fonctionnel dans l'onglet Magie. En tapant les premières lettres d'un sort, un menu déroulant propose les sorts correspondants à la classe sélectionnée. La sélection auto-remplit niveau, école, temps d'incantation, portée et composantes.

2. **Grimoire : Filtres par Niveau** : Les boutons filtres (0-9, Tous) affichent uniquement les sorts du niveau sélectionné. Filtrage compatible avec le tri par colonnes.

3. **Tableau des Sorts : Layout Corrigé** : Résolution des chevauchements de colonnes (Niv, École, C/R/M) via une approche CSS-only (`overflow: hidden`, badges tronqués, checkboxes compactées). L'autocomplétion reste fonctionnelle grâce à une exception `overflow: visible` sur la cellule Nom.

4. **Toolbar : Affichage Optimisé** : Largeur élargie à 260px, header restructuré avec classes CSS propres (`.toolbar-title`, `.auth-status`, `.toolbar-controls`). Le statut d'authentification est compact et ne chevauche plus le titre GESTION.

5. **Persistance Améliorée** :
    - Rich text (couleurs, tailles) dans les stats et XP sauvegardé correctement.
    - Préférences visuelles (opacité, thème sombre) synchronisées dans le cloud.

### 🔑 Données de Configuration
- **Site Web** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Base de Données** : Supabase (Table: `characters`)
- **Login** : Utilisable directement via le bouton "👤 Se connecter".

### 📋 Prochaines Étapes proposées
- [ ] **Interface "Mes Personnages"** : Un menu pour lister et basculer entre ses différents héros stockés dans le cloud.
- [ ] **Grimoire : Données Étendues** : Ajouter durée, aire d'effet et description complète des sorts depuis les manuels PDF.
- [ ] **Export PDF** : Améliorer la mise en page de l'impression/export PDF.
- [ ] **Polissage UI** : Micro-animations et transitions premium restantes.

### 📁 Architecture des Fichiers Modifiés (Session)
| Fichier | Modifications |
|---------|--------------|
| `css/style.css` | Styles tableau sorts, toolbar header, badges école, C/R/M compact |
| `index.html` | Largeurs colonnes sorts, structure header toolbar |
| `js/supabase-config.js` | Affichage auth-status compact |
| `js/script.js` | Autocomplétion sorts, filtres niveau (sessions précédentes) |

*Dernière mise à jour : 15/02/2026 21:39*
