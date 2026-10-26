# Architecture — v4

HTML/CSS/JavaScript natifs, modules ES chargés directement par le navigateur (aucune étape de build).

## Arborescence

```
index.html              Page de la fiche : barre « Gestion », en-tête, 4 onglets (point d'entrée : js/main.js)
css/                    Une feuille par fonctionnalité ; toute couleur vient de base.css
├── base.css            Jetons de thème clair / sombre (variables CSS), typographie
├── sheet.css           Mise en page de la fiche, tablettes 768–1100 px
├── components.css      Boutons, fenêtres, auto-complétion, cases des tableaux (partagés)
├── toolbar.css         Barre « Gestion », mode cinéma, fenêtres d'import / export
├── account.css         Compte en ligne, « Mes personnages », questions de synchronisation
├── gallery.css         Fond d'écran, opacité de la fiche, galerie
├── weapons.css · armors.css · spells.css · rest.css · style-editor.css
├── motion.css          Mouvements (ouverture en cascade, onglets, survol, thème, cinéma)
├── feedback.css        Réactions au jeu (Rage, jauge de PV, valeurs qui changent)
└── print.css           Impression A4 (media="print")
js/
├── boot-theme.js       Thème mémorisé posé avant le premier affichage (pas de flash clair)
├── main.js             Démarrage de l'application, sauvegarde automatique dans le navigateur
├── data/               Données du jeu (objets exportés, aucun accès au navigateur)
│   ├── constants.js    Caractéristiques, compétences, fonds par défaut
│   ├── dd-rules.js     Classes, sous-classes (dont Odyssée), espèces, historiques,
│   │                   destins héroïques, emplacements de sorts, armes
│   ├── equipment.js    Armures
│   ├── feats.js        Dons (Origine, Général, Style de combat, Épique)
│   └── spells.js       Chargement à la demande de data/spells.json
├── rules/              Règles D&D 2024 : fonctions pures, testées
│   ├── logic.js        Calculs élémentaires (modificateurs, maîtrise, armes, ressources)
│   ├── character.js    Statistiques dérivées d'une fiche complète (deriveCharacter, computeWeapon)
│   ├── weapons.js      Tableau des armes (filtres, bonus de combat, configuration)
│   ├── armors.js       Armures (CA, bouclier, armure équipée)
│   ├── spells.js       Grimoire (recherche, tri, filtres, emplacements de sorts)
│   ├── rest.js         Repos court et repos long
│   └── gallery.js      Réglages d'apparence (validation des fonds, _visual_prefs)
├── cloud/              Sauvegarde en ligne (Supabase, même table que la v3)
│   ├── client.js       Client Supabase (clé publique ; sécurité par RLS)
│   ├── repository.js   Lecture, création seule, mise à jour / suppression conditionnelles
│   ├── sync.js         Décisions pures (vérification, empreinte du contenu, bascule v3)
│   └── controller.js   Synchronisation complète, sans DOM (testée scénario par scénario)
├── state/              Données du personnage
│   ├── schema.js       Format de la fiche (champs, valeurs par défaut)
│   ├── migrate.js      Conversion de toute ancienne sauvegarde vers le format courant,
│   │                   reprise de l'état de jeu que la v3 gardait à part dans le navigateur
│   ├── store.js        Source unique de vérité + abonnements
│   └── persistence.js  localStorage (mêmes clés que la v3) et fichiers JSON
└── ui/                 Interface (un module par fonctionnalité, initialisé par main.js)
    ├── sheet.js        Construit la fiche, relie chaque champ data-field au store,
    │                   affiche les valeurs calculées (data-out)
    ├── tabs.js · theme.js · lock.js · toolbar.js · account.js · gallery.js
    ├── weapons.js · armors.js · spells.js · rest.js · style-editor.js
    ├── motion.js · feedback.js · ornaments.js
    ├── modal.js · autocomplete.js · cell-text.js · dom.js   (briques partagées)
    └── sanitize.js     Nettoyage du texte riche via DOMPurify
data/spells.json        Base de sorts (chargée à la demande)
assets/backgrounds/     Fonds d'écran WebP fournis
dev/preview.html        Outil de capture : charge une fiche d'exemple (localhost seulement)
dev/validation.html     Ancienne page de validation des étapes 0 à 2 (lecture d'une fiche)
dev/polices.html        Échantillons de polices pour les textes longs (choix fait : Alegreya)
scripts/serve.js        Serveur local (npm run dev)
scripts/check.js        Garde-fous (npm run check)
tests/                  Tests Node (npm test) ; tests/fixtures/local/ = vraies sauvegardes, non publiées
supabase/policies.sql   Règles de sécurité de la base (inchangées depuis la v3)
docs/archive-v3/        Documents de la v3
.agent/                 Ancienne configuration d'agent de la v3 (Antigravity), à ne pas modifier
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

## Liaison interface ↔ personnage

- Chaque champ de saisie porte `data-field="<clé de la sauvegarde>"` (ex. `data-field="str_score"`).
  Toute saisie appelle `store.update()` ; tout changement du store ré-affiche la fiche.
- Les valeurs calculées portent `data-out="<nom>"` (ex. `data-out="mod:str"`), remplies à partir de
  `deriveCharacter()`. Elles ne sont jamais enregistrées : la fiche recalcule tout au chargement.
- Les champs courts sont de vrais `<input>` (texte simple) ; les textes longs sont des zones
  `contenteditable` (`data-kind="rich"`) nettoyées par DOMPurify.
- Un champ en cours de saisie n'est jamais réécrit (le curseur ne saute pas).

## Sauvegarde en ligne

- Table Supabase `characters` partagée avec la v3 : (user_id, name) unique, `data` = la fiche,
  `updated_at` = version.
- La fiche retient sa « base » (personnage lié, version connue, empreinte du contenu), enregistrée
  dans le navigateur avec la fiche, au même instant (`dd2024_cloud_sync`).
- Écritures sûres : création seule pour une nouvelle fiche ou un import ; mise à jour seulement si la
  version en ligne est toujours celle connue ; sinon une question est posée (fermée = rien n'est écrasé).
- Toute opération commencée avant un changement de fiche ou de compte est abandonnée sans rien écrire.
- Tests : `tests/cloud.test.js`, `tests/cloud-controller.test.js` (faux Supabase réaliste).

## Format de la fiche

Dictionnaire « à plat », identique à la v3 (voir `js/state/schema.js`) : une clé par champ
(`char_name`, `str_score`, `skill_prof_athletics`, `feat_4`…) et trois tableaux
(`dynamic_weapons`, `dynamic_spells`, `dynamic_armors`).

- Les champs « riches » (nom, historique, traits…) peuvent contenir de la mise en forme HTML ;
  ils seront toujours affichés à travers DOMPurify.
- Les clés inconnues sont conservées par la v4 : une fiche enregistrée par la v4 reste lisible par
  la v3, et inversement. Attention : la v3, elle, reconstruit la fiche à partir de sa page et perd en
  enregistrant les clés qu'elle ne connaît pas (`combat_buffs`, `spell_slots_state`).
- Clés propres à la v4 : `combat_buffs` (bonus de combat actifs) et `spell_slots_state` (emplacements
  de sorts). En v3, cet état était gardé à part dans le navigateur (`combat_buffs`, `spell_slots`) :
  la v4 le reprend une fois, dans la fiche v3 du navigateur (`importV3DeviceState`).
- Une fiche sans la clé `spell_slots_state` n'a jamais été enregistrée par la v4 (`isV3Save`) : la
  synchronisation ne charge jamais en silence une version en ligne écrite par la v3 (onglet resté
  ouvert après la bascule), elle pose la question.

## Bascule v3 → v4 (premier lancement dans un navigateur)

- Même adresse, mêmes clés `localStorage`, même table Supabase : la fiche v3 du navigateur est reprise.
- Nom de ligne en ligne : la v3 nommait la ligne d'après le texte affiché du champ Nom ; une mise en
  forme au milieu d'un mot y ajoutait un espace (« Korgul B rise-Crâne »). Au premier lancement, la
  v4 retrouve cette ligne grâce à `dd2024_active_char_name` et la renomme (création sous le nouveau
  nom, puis suppression de l'ancienne seulement si elle n'a pas changé) au lieu de créer un doublon.
- Dé de vie : la v3 imposait celui de la classe à chaque ouverture ; la migration fait de même pour
  une sauvegarde v3 (jamais pour une fiche déjà enregistrée par la v4).
