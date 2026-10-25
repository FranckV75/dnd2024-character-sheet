# Architecture — v4

HTML/CSS/JavaScript natifs, modules ES chargés directement par le navigateur (aucune étape de build).

## Arborescence

```
index.html              Page de la fiche (point d'entrée : js/main.js)
css/base.css            Jetons de thème clair / sombre (variables CSS)
js/
├── main.js             Démarrage de l'application
├── data/               Données du jeu (objets exportés, aucun accès au navigateur)
│   ├── constants.js    Caractéristiques, compétences, fonds par défaut
│   ├── dd-rules.js     Classes, sous-classes (dont Odyssée), espèces, historiques,
│   │                   destins héroïques, emplacements de sorts, armes
│   ├── equipment.js    Armures
│   └── feats.js        Dons (Origine, Général, Style de combat, Épique)
├── rules/              Règles D&D 2024 : fonctions pures, testées
│   ├── logic.js        Calculs élémentaires (modificateurs, maîtrise, armes, ressources)
│   └── character.js    Statistiques dérivées d'une fiche complète (deriveCharacter, computeWeapon)
├── state/              Données du personnage
│   ├── schema.js       Format de la fiche (champs, valeurs par défaut)
│   ├── migrate.js      Conversion de toute ancienne sauvegarde vers le format courant
│   ├── store.js        Source unique de vérité + abonnements
│   └── persistence.js  localStorage (mêmes clés que la v3) et fichiers JSON
└── ui/                 Interface (étape 3 et suivantes)
    └── theme.js        Thème clair / sombre
data/spells.json        Base de sorts (chargée à la demande)
assets/backgrounds/     Fonds d'écran WebP
dev/validation.html     Page temporaire de validation des étapes 0 à 2
scripts/serve.js        Serveur local (npm run dev)
scripts/check.js        Garde-fous (npm run check)
tests/                  Tests Node (npm test) ; tests/fixtures/local/ = vraies sauvegardes, non publiées
supabase/policies.sql   Règles de sécurité de la base (inchangées depuis la v3)
```

## Flux de données

```
 Fichier JSON / localStorage / Supabase
                │
                ▼
      state/migrate.js  (toute version → format courant, rapport des conversions)
                │
                ▼
      state/store.js  ◄──────── l'interface écrit chaque modification ici
                │
     ┌──────────┼─────────────────────┐
     ▼          ▼                     ▼
 Affichage   rules/character.js   Sauvegarde automatique
             (valeurs calculées)  (state/persistence.js, Supabase)
```

## Format de la fiche

Dictionnaire « à plat », identique à la v3 (voir `js/state/schema.js`) : une clé par champ
(`char_name`, `str_score`, `skill_prof_athletics`, `feat_4`…) et trois tableaux
(`dynamic_weapons`, `dynamic_spells`, `dynamic_armors`).

- Les champs « riches » (nom, historique, traits…) peuvent contenir de la mise en forme HTML ;
  ils seront toujours affichés à travers DOMPurify.
- Les clés inconnues sont conservées : une fiche enregistrée par la v4 reste lisible par la v3,
  et inversement, tant que les deux versions partagent la base Supabase.
