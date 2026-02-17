# Projet : Fiche de Personnage D&D 2024 - Cloud & Cadrage

## État au 17 Février 2026 - POLISH & GALERIE

### ✅ Avancées de la Session

1. **Galerie : Fonds d'Écran Personnalisés & Contrôles** :
    - Ajout de 3 nouveaux fonds officiels : *Iria*, *Hedera*, *Cephalus*.
    - Intégration de sliders de **Cadrage** dans la Toolbar :
        - **Position Y (↕️)** : Permet de monter/descendre l'image pour centrer le sujet.
        - **Zoom (magnifying glass icon)** : Permet de zoomer (max 200%) ou dézoomer/adapter (min 20%).
    - Ces réglages sont persistants (localStorage + Cloud).

2. **Audit & Nettoyage Technique (Refactoring)** :
    - Suppression des doublons de code d'authentification dans `storage.js`.
    - Harmonisation complète des messages utilisateur : remplacement de tous les `alert()` par notre système de modales `showModal()` pour une expérience premium unifiée.
    - Correction de signatures de fonctions (`showModal` dans `import` et `config`).

3. **Grimoire & UI (Précédemment)** :
    - Autocomplétion et filtres de sorts opérationnels.
    - Layout du tableau des sorts stabilisé.

### 🔑 Données de Configuration
- **Site Web** : `https://franckv75.github.io/dnd2024-character-sheet/`
- **Base de Données** : Supabase (Table: `characters`, `campaigns`...)
- **Authentification** : Gestion centralisée via `supabase-config.js`.

### 📋 Prochaines Étapes Validées
- [ ] **Interface "Mes Personnages"** : Un menu pour lister et basculer entre ses différents héros stockés dans le cloud.
- [ ] **Grimoire : Données Étendues** : Ajouter durée, aire d'effet et description complète des sorts depuis les manuels PDF.
- [ ] **Mode "Campagne"** : Partage de données entre joueurs d'une même campagne (Loot commun, Notes).

### 📁 Architecture des Fichiers Modifiés (Session)
| Fichier | Modifications |
|---------|--------------|
| `index.html` | Ajout sliders Toolbar, structure modales |
| `js/ui-toolbar.js` | Logique sliders Zoom/Pos Y, persistance |
| `js/storage.js` | Nettoyage doublons Auth, sauvegarde prefs visuelles |
| `js/supabase-config.js` | Correction showModal, centralisation Auth |
| `js/data.js` | Ajout nouveaux fonds d'écran par défaut |

*Dernière mise à jour : 17/02/2026 22:58*
