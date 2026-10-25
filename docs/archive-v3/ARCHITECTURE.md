# Architecture — Feuille de Personnage D&D 2024 (V2.9.13)

## Structure des Fichiers

```
0_Feuille_de_Perso_Antigravity/
├── index.html              # Structure HTML sémantique (4 onglets)
├── package.json            # Scripts de test, lint et dépendances dev
├── project_summary.md      # État du projet et suivi des stories (Plan de Qualité)
├── README.md               # Documentation générale du projet
├── css/
│   └── style.css           # Styles globaux, variables CSS, responsive, media print
├── data/
│   └── spells.json         # Base de données de sorts D&D 2024 (lazy-loaded)
├── js/
│   ├── script.js           # Point d'entrée, initialisation, event listeners
│   ├── logic.js            # Calculs D&D purs (fonctions pures sans accès DOM)
│   ├── storage.js          # Synchronisation LocalStorage & Supabase, assainissement DOMPurify
│   ├── supabase-config.js  # Client Supabase sécurisé (window.sb) & gestion du Roster
│   ├── dd_rules.js         # Données des règles D&D 2024 (classes, sous-classes, armures, armes)
│   ├── feats-data.js       # Base de données des dons D&D 2024 (+70 dons avec prérequis)
│   ├── data.js             # Données statiques (compétences, constantes)
│   ├── theme.js            # Gestionnaire de thème sombre / clair
│   ├── ui-toolbar.js       # Toolbar de gestion (opacité, mode verrouillé, mode cinéma)
│   ├── ui-modals.js        # Système de dialogues modaux (Mes Personnages, Import/Export)
│   ├── ui-gallery.js       # Galerie de fonds d'écran WebP
│   └── ui-rest.js          # Repos court, repos long & gestion du niveau de fatigue
├── supabase/
│   └── policies.sql        # Script SQL Row Level Security (RLS) pour Supabase
├── tests/
│   └── logic.test.js       # 22 tests unitaires automatisés pour logic.js (Node Test Runner)
├── .github/
│   └── workflows/
│       └── ci.yml          # Pipeline d'intégration continue GitHub Actions
└── docs/
    ├── ARCHITECTURE.md     # Architecture technique du projet (ce fichier)
    └── CHANGELOG.md        # Historique détaillé des versions
```

## Responsabilités des Modules

### Core & Logique Métier

| Fichier | Responsabilité |
|---------|----------------|
| `script.js` | Initialisation, orchestration du DOM, bindings d'événements, gestion de la navigation à 4 onglets. |
| `logic.js` | Fonctions pures D&D 2024 sans effets de bord (calculs de modificateurs, dés de vie, attaques, arts martiaux, rage, CA d'armures). |
| `storage.js` | Modèle de données, sérialisation/désérialisation, persistance LocalStorage, assainissement HTML via `setRichHTML()` (DOMPurify). |
| `supabase-config.js` | Authentification réactive via `sb.auth.onAuthStateChange()`, requêtes CRUD Cloud et résolution de conflits d'horodatage. |
| `dd_rules.js` | Registre des règles D&D 2024 : listes de classes, sous-classes, types d'armes (propriétés, maîtrise) et catégories d'armures. |
| `feats-data.js` | Dictionnaire des dons D&D 2024 classés par palier d'ASI avec descriptions et filtrage des prérequis. |

### Interface Utilisateur (UI Modules)

| Fichier | Responsabilité |
|---------|----------------|
| `ui-toolbar.js` | Barre de gestion globale, contrôle d'opacité, mode cinéma et verrouillage strict anti-édition des menus déroulants. |
| `ui-modals.js` | Gestionnaire de modales (Roster Supabase "Mes Personnages", import/export JSON, alertes cloud). |
| `ui-gallery.js` | Galerie d'arrière-plans responsives WebP optimisés. |
| `ui-rest.js` | Logique des repos court/long et mise à jour dynamique des cases de niveau de fatigue (0-6). |
| `theme.js` | Basculement fluide entre le Mode Nuit et le Mode Jour. |

## Structure des Onglets HTML

1. **`#tab-combat` (Caractéristiques & Combat)** : Stats principales, sauvegardes, vitals (PV, CA, Initiative, Vitesse, Perception, Mort), Attaques & Armes.
2. **`#tab-traits` (Aptitudes & Traits)** : Capacités de classe, Dons D&D 2024 par palier d'ASI, Traits raciaux, Historique.
3. **`#tab-role` (Compétences & Histoire)** : Compétences (Maîtrise/Expertise), Outils, Langues, Repos & Fatigue, Histoire du personnage.
4. **`#tab-spells` (Magie & Équipement)** : Cartouche magique (DC, Bonus d'attaque), slots de sorts (1-9), grimoire interactif, Équipement & Armures.

## Flux de Données

```
[Saisie Utilisateur]
       │
       ▼
  [script.js] (Événement DOM) ────────► [logic.js] (Calcul pur D&D 2024)
       │                                     │
       ▼                                     ▼
[Mise à jour DOM] ◄────────────────── [Valeur Calculée]
       │
       ▼
 [storage.js] (setRichHTML DOMPurify)
       │
       ├─────────────────────────┐
       ▼                         ▼
[LocalStorage]       [window.sb (Supabase Cloud)]
 (Local Fallback)        (PostgreSQL + RLS)
```

## Normes de Sécurité, Performance & Qualité

- **Sécurité XSS** : Aucun `innerHTML` direct sur contenu utilisateur ; passage obligatoire par `setRichHTML()` avec whitelist DOMPurify strict (`b, i, u, em, strong, br, span, sub, sup, mark`).
- **Sécurité Supabase** : Client isolé sous `window.sb` (SDK v2.43.4 avec SRI) et RLS actif par `auth.uid() = user_id`.
- **Performance** : Tous les scripts portent l'attribut `defer`. La base `spells.json` est chargée asynchroniquement via `fetch()`. Les images d'arrière-plan WebP sont compressées sous 400 Ko.
- **Qualité & CI** : Validation automatique par `node --test tests/logic.test.js` à chaque commit via GitHub Actions.
