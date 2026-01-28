# 📜 Fiche D&D 2024 - Synthèse du Projet

> **Document de référence** pour les futures sessions de développement.  
> Dernière mise à jour : 28 janvier 2026

---

## 🏗️ Architecture Technique

### Structure des Fichiers
```
0_Feuille_de_Perso_Antigravity/
├── index.html          # Structure HTML principale (585 lignes)
├── css/
│   └── style.css       # Styles globaux (~1476 lignes)
├── js/
│   ├── data.js         # Constantes (SKILLS, DEFAULT_BGS)
│   ├── logic.js        # Calculs D&D purs (sans DOM)
│   ├── storage.js      # Gestion localStorage + import/export JSON
│   ├── script.js       # Orchestrateur principal (init, events, DOM)
│   └── ui.js           # Fonctions UI (modals, tabs, backgrounds)
├── task.md             # Suivi des tâches (checklist)
└── *.json              # Fichiers de personnages (ex: Korgul)
```

### Principe de Séparation des Responsabilités
- **`logic.js`** : Fonctions pures (calcMod, calculateProficiencyBonus, getClassResourceInfo, calculateDerivedStats). Aucun accès DOM.
- **`storage.js`** : Lecture/écriture localStorage, nettoyage des données legacy, import/export JSON.
- **`script.js`** : Point d'entrée, appelle logic.js et met à jour le DOM.
- **`ui.js`** : Gestion des modals, onglets, galerie de fonds.

---

## 🎮 Logique de Jeu Implémentée

### Dés de Vie (Hit Dice)
| Classe | Type de Dé |
|--------|-----------|
| Barbare | D12 |
| Guerrier, Paladin, Rôdeur | D10 |
| Barde, Clerc, Druide, Moine, Roublard, Occultiste | D8 |
| Ensorceleur, Magicien | D6 |

- **Total** = Niveau du personnage (calculé automatiquement via `char_level`).
- **Sélecteur dynamique** : Le dropdown "X / Total" se régénère quand le niveau change.
- **Persistance** : `hd_current` et `hd_type` sont sauvegardés dans localStorage.

### Ressources de Classe
Gérées par `getClassResourceInfo(level, className, mods)` :
- **Barbare** : Rages (2 à 6 selon niveau)
- **Barde** : Inspiration Bardique (= mod CHA, min 1)
- **Moine** : Points de Ki (= niveau)
- **Paladin** : Conduit Divin (2 à 3)
- Etc.

### Calculs Automatiques
- **Bonus de Maîtrise** : `Math.ceil(level / 4) + 1`
- **Modificateur de carac** : `Math.floor((score - 10) / 2)`
- **Initiative** : Mod DEX (affiché avec signe)
- **Perception Passive** : 10 + Mod SAG + (Maîtrise si applicable)

---

## 🎨 Charte Graphique (État Validé)

### Police Globale
- **Tous les champs de saisie** (`.rich-input`) : `'Cinzel', serif`
- **Poids** : `font-weight: 600` (Semi-Bold par défaut), `800` pour les stats importantes
- **Taille des valeurs de l'en-tête** :
  - Bonus, Inspiration, Vitesse : `1.5rem`
  - Classe d'Armure : `1.8rem` (non modifiée, référence visuelle)
  - Initiative, Perception Passive : `1.5rem` (harmonisé avec Row 1)

### Alignement de l'En-tête
- **Row 1** (Bonus, Inspi, Speed) : Flex column, `justify-content: space-between`, labels en haut, valeurs en bas.
- **Row 2** (AC, Init, Perc) : Labels en haut, valeurs centrées dans l'espace restant pour s'aligner avec le centre de l'hexagone AC.

### Classes CSS Clés
```css
.header-stat-col { /* Colonnes de stats avec alignement vertical */ }
.header-stat-label { min-height: 2.2em; /* Espace uniforme pour labels 2 lignes */ }
.header-stat-label.small { font-size: 0.6rem; /* Pour "Inspiration Héroïque..." */ }
.header-stat-val-small { font-size: 1.5rem; font-weight: 800; font-family: 'Cinzel'; }
.vitals-box { justify-content: flex-start; /* Label top */ }
.vitals-box .rich-input { flex-grow: 1; align-items: center; /* Value centered */ }
```

### Couleurs & Thème
- **Bordures** : `#8b4513` (SaddleBrown)
- **Accent** : `var(--accent-color)` (utilisé pour les ressources de classe)
- **Fond** : Images personnalisées via galerie (Fond_Fafnir.png, etc.)

---

## ✅ Tâches Réalisées (Historique)

- [x] Correction du bug bandeau d'outils (script error)
- [x] Implémentation logique des Dés de Vie (Hit Dice)
- [x] Refonte affichage PV / DV (homogénéisation)
- [x] Alignement en-tête (Bonus, Inspi, Vitesse)
- [x] Alignement Vitals (CA, Init, Perception)
- [x] Unification Police Globale (Cinzel)
- [x] Architecture modulaire JS (séparation responsabilités)

---

## 📌 Règles de Collaboration avec l'Agent

1. **Avant toute modification de code**, l'agent doit proposer :
   - Le **Modèle** suggéré (ex: Gemini 3 Pro High, Claude Sonnet 4.5)
   - Le **Mode** (Planning vs Fast)
2. **Attendre validation** de l'utilisateur avant d'exécuter.
3. **Communiquer en français**.
4. **Commits Git** : Toujours proposer un message de commit clair avant exécution.

---

## 🔮 Pistes d'Amélioration (Non implémentées)

- [ ] Mode sombre (Dark Mode)
- [ ] Page d'accueil pour sélection de JSON
- [ ] Optimisation/Refactoring JS avancé
- [ ] Export PDF de la fiche
- [ ] Gestion multi-personnages

---

*Ce document peut être lu par un nouvel agent pour reprendre le contexte instantanément.*
