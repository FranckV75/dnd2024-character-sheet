# Projet : Fiche de Personnage D&D 2024 - Cloud & Sync

## État au 15 Février 2026

### 🚀 Objectif Actuel
Transformer la feuille de personnage locale en une application web complète avec sauvegarde cloud sécurisée et accès multi-plateformes.

### ✅ Accomplissements récents
1. **Intégration GitHub** : Dépôt créé à l'adresse `https://github.com/FranckV75/dnd2024-character-sheet`.
2. **Synchronisation Supabase** : 
    - Table `characters` créée avec colonnes `id`, `name`, `data`, `user_id`, `updated_at`.
    - Système de sauvegarde "Local-first" (LocalStorage -> Cloud).
3. **Authentification (Supabase Auth)** :
    - Système d'email/mot de passe activé.
    - Fenêtre de connexion intégrée à l'application.
    - Sécurité RLS (Row Level Security) configurée : chaque utilisateur ne peut voir/modifier que ses propres personnages.
4. **Déploiement GitHub Pages** :
    - Application accessible en ligne à l'adresse : `https://franckv75.github.io/dnd2024-character-sheet/`.
    - Correction du bug `openAuthModal` qui empêchait la connexion sur le site en ligne.
5. **Protection Traduction** : Ajout de la balise `<meta name="google" content="notranslate">` pour éviter que le traducteur automatique ne casse le code.

### 🔑 Configuration Technique
- **Base de données** : Supabase (Table `characters`).
- **Lien Public** : `https://franckv75.github.io/dnd2024-character-sheet/`.
- **Nouveau Workflow** : Commande `/update-summary` créée pour assurer la continuité.

### � Prochaines Étapes
- [ ] **Galerie de Personnages** : Menu pour choisir quel personnage charger parmi ceux sauvegardés dans le cloud.
- [ ] **Gestion des Sorts** : Amélioration du Grimoire (autocomplétion, filtres avancés).
- [ ] **Optimisation UI** : Polissage premium (animations, transitions fluides).

*Dernière mise à jour effectuée par Antigravity.*
