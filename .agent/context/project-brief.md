# Feuille de Personnage D&D 2024 - Contexte Projet

## Vue d'Ensemble

Application web interactive pour créer et gérer des personnages D&D 2024.
Développée en Vanilla JS/CSS/HTML sans frameworks externes.

## Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| HTML5 | - | Structure sémantique |
| CSS3 | Variables, Grid, Flexbox | Styling premium |
| JavaScript | ES6+ | Logique et interactions |
| LocalStorage | - | Persistance des données |

## Cibles

- **Tablettes** : 850px - 1100px (priorité haute)
- **Desktop** : > 1100px
- **Mobile** : Non supporté (< 768px intentionnellement exclu)

## Architecture des Fichiers

```
js/
├── script.js       # Point d'entrée, orchestration
├── logic.js        # Calculs D&D purs (sans DOM)
├── storage.js      # LocalStorage, import/export
├── dd_rules.js     # Données des règles D&D 2024
├── data.js         # Données statiques (compétences, etc.)
├── theme.js        # Gestion du thème sombre
├── ui-toolbar.js   # Toolbar, opacité, éditeur de style
├── ui-modals.js    # Système de modales
├── ui-gallery.js   # Galerie de fonds d'écran
└── ui-rest.js      # Système de repos court/long

css/
└── style.css       # Tous les styles (variables CSS, responsive)
```

## Principes de Développement

1. **Fonctions pures** dans `logic.js` (testables, sans effets de bord)
2. **Modularisation UI** : chaque module `ui-*.js` gère une fonctionnalité
3. **Variables CSS** pour couleurs et espacements (thème sombre)
4. **Esthétique Premium** : animations fluides, transitions cubic-bezier
5. **Accessibilité** : aria-labels, contrastes suffisants
6. **Sources Officielles** : Des manuels au format PDF sont disponibles dans `/MANUELS`. Consulte-les prioritairement pour valider toute règle complexe (ex: Odyssée des Seigneurs Dragons, règles D&D 2024).

## Commits

Format conventionnel en anglais :
- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `refactor:` refactorisation sans changement fonctionnel
- `style:` changements CSS/UI
- `docs:` documentation

## Objectif Qualité

- **0 erreur console** à tout moment
- **Score de stabilité** minimum : 9/10
- **Responsive** pixel-perfect sur tablettes

## 🔄 Workflows Hybrides (Inspirés BMAD)

Pour garantir une qualité premium et une traçabilité, nous utilisons un cycle de développement structuré :

1. `/spec` : **Obligatoire AVANT de coder**. Analyse le projet et produit une spec technique avec des stories.
2. `/dev-story` : Implémente une seule story à la fois après validation de la spec.
3. `/code-review` : Validation technique et visuelle après chaque implémentation.
4. `/audit` : Audit QA complet (console, responsive, code mort).

## 🛡️ Règles de Sécurité Critique
- **NE JAMAIS SUPPRIMER NI MODIFIER** le contenu du dossier `.agent/rules/`. Ce dossier est géré automatiquement par l'interface Antigravity lors de la création de règles.
- Toujours privilégier `project-brief.md` comme source de vérité pour le contexte projet.
## 🔮 Roadmap Immédiate (v2.3.0)
- **Grimoire Intelligent** : Auto-complétion des sorts depuis D&D 2024, filtrage avancé, gestion des composantes V/S/M.
- **Spec Technique** : Voir `implementation_plan.md` pour le détail.
