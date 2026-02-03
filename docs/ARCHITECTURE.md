# Architecture - Feuille de Personnage D&D 2024

## Structure des Fichiers

```
0_Feuille_de_Perso_Antigravity/
├── index.html              # Page principale (structure HTML)
├── css/
│   └── style.css           # Styles globaux, variables, responsive
├── js/
│   ├── script.js           # Point d'entrée, initialisation
│   ├── logic.js            # Calculs D&D (modificateurs, bonus)
│   ├── storage.js          # LocalStorage, sauvegarde/chargement
│   ├── dd_rules.js         # Données des règles (classes, races)
│   ├── data.js             # Données statiques (compétences)
│   ├── theme.js            # Gestion thème clair/sombre
│   ├── ui-toolbar.js       # Toolbar flottante
│   ├── ui-modals.js        # Dialogues modaux
│   ├── ui-gallery.js       # Galerie de fonds
│   └── ui-rest.js          # Repos court/long
├── .agent/
│   ├── workflows/          # Workflows Antigravity
│   └── context/            # Contexte projet
└── docs/
    ├── ARCHITECTURE.md     # Ce fichier
    └── CHANGELOG.md        # Historique des versions
```

## Responsabilités des Modules

### Core

| Fichier | Responsabilité |
|---------|----------------|
| `script.js` | Initialisation, orchestration, event listeners |
| `logic.js` | Calculs D&D purs (calcMod, getProficiencyBonus) |
| `storage.js` | Sérialisation/désérialisation, LocalStorage |
| `dd_rules.js` | Données des règles D&D 2024 |
| `data.js` | Liste des compétences, constantes |

### UI Modules

| Fichier | Responsabilité |
|---------|----------------|
| `ui-toolbar.js` | Panneau Gestion (opacité, fond, export) |
| `ui-modals.js` | Fenêtres modales (confirmation, import) |
| `ui-gallery.js` | Sélection de fonds d'écran |
| `ui-rest.js` | Boutons repos court/long |
| `theme.js` | Toggle mode sombre/clair |

## Flux de Données

```
[Utilisateur] 
    ↓ (input)
[script.js] → appelle → [logic.js] (calculs)
    ↓                        ↓
[DOM Updates]          [storage.js] (sauvegarde)
```

## CSS Architecture

- **Variables** : Définies dans `:root` et `[data-theme="dark"]`
- **Breakpoints** : 900px (tablette portrait), 1100px (tablette paysage)
- **Animations** : `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design)
