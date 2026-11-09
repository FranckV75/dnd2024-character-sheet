# Architecture — v4

HTML/CSS/JavaScript natifs, modules ES chargés directement par le navigateur (aucune étape de build).

## Arborescence

```
index.html              Page de la fiche : barre « Gestion », en-tête, 4 onglets (point d'entrée : js/main.js)
css/                    Une feuille par fonctionnalité ; toute couleur passe par une variable CSS
│                       (thèmes dans base.css, variables locales dans magic, gallery, style-editor, print)
├── base.css            Jetons de thème clair / sombre (variables CSS), typographie
├── sheet.css           Mise en page de la fiche, tablettes 768–1100 px
├── components.css      Boutons, fenêtres, auto-complétion, cases des tableaux (partagés)
├── toolbar.css         Barre « Gestion », mode cinéma, fenêtres d'import / export
├── account.css         Compte en ligne, « Mes personnages », questions de synchronisation
├── gallery.css         Fond d'écran, opacité de la fiche, galerie
├── weapons.css · armors.css · spells.css · rest.css · style-editor.css
├── magic.css           Armes et armures magiques (+1 à +3 de plus en plus marqués, enchantement)
├── motion.css          Mouvements (ouverture en cascade, onglets, survol, thème, cinéma) ;
│                       seule règle autorisée à utiliser !important : « Sans animation »
├── feedback.css        Réactions au jeu (Rage, jauge de PV, valeurs qui changent)
└── print.css           Impression A4 (media="print")
js/
├── boot-theme.js       Thème et choix « Sans animation » mémorisés, posés avant le premier
│                       affichage (pas de flash clair)
├── main.js             Démarrage de l'application (une étape en échec n'empêche ni la barre
│                       Gestion ni l'enregistrement), branchement de l'enregistrement automatique
├── data/               Données du jeu (objets exportés ; seul spells.js charge un fichier)
│   ├── constants.js    Caractéristiques, compétences, fonds par défaut
│   ├── dd-rules.js     Classes, sous-classes (dont Odyssée), espèces, historiques,
│   │                   destins héroïques, emplacements de sorts, armes
│   ├── equipment.js    Armures
│   ├── feats.js        Dons (Origine, Général, Style de combat, Épique)
│   ├── feat-spells.js  Sorts permis par les dons à sorts (tirés de data/spells.json, testés)
│   ├── weapon-masteries.js  Bottes d'armes (Weapon Mastery, PHB 2024) : textes et règles
│   └── spells.js       Chargement à la demande de data/spells.json
├── rules/              Règles D&D 2024 : fonctions pures, testées
│   ├── logic.js        Calculs élémentaires (modificateurs, maîtrise, armes, ressources)
│   ├── character.js    Statistiques dérivées d'une fiche complète (deriveCharacter, computeWeapon)
│   ├── weapons.js      Tableau des armes (filtres, bonus de combat, configuration)
│   ├── class-features.js  Capacités de classe calculées (Aura de protection, Touche-à-tout,
│   │                   Défense sans armure de sous-classe) et maîtrise des armes
│   ├── armors.js       Tableau des armures (types, ligne d'armure) ; le calcul de CA est dans
│   │                   character.js (computeArmorClass, armorLine), réexporté ici
│   ├── weapon-masteries.js  Bottes d'armes : botte d'une arme, effet affiché
│   ├── spells.js       Grimoire (recherche, tri, filtres, emplacements de sorts)
│   ├── feats.js · feat-effects.js · feat-uses.js · feat-choices.js
│   │                   Dons : emplacements atteints, effets, usages dépensés, choix mémorisés
│   ├── feat-spells.js  Sorts donnés par un don (lot 6) : DD du don, lancers gratuits
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
│   ├── persistence.js  localStorage (mêmes clés que la v3), copie de secours d'une sauvegarde
│   │                   illisible, fichiers JSON (un JSON qui n'est pas une fiche est refusé)
│   ├── local-save.js   Enregistrement automatique dans le navigateur et reprise de la fiche
│   │                   enregistrée par un autre onglet (sans DOM, testé avec plusieurs onglets)
│   └── other-tab.js    Fiche enregistrée par un autre onglet : reprise et fusion (pure)
└── ui/                 Interface (un module par fonctionnalité, initialisé par main.js)
    ├── sheet.js        Construit la fiche, relie chaque champ data-field au store,
    │                   affiche les valeurs calculées (data-out)
    ├── tabs.js · theme.js · lock.js · toolbar.js · account.js · gallery.js
    ├── weapons.js · armors.js · spells.js · rest.js · style-editor.js
    ├── motion.js · feedback.js · ornaments.js
    ├── motion-pref.js  Animations en marche ou coupées (appareil ou bouton « Sans animation »,
    │                   retenu sur l'appareil, jamais dans la sauvegarde)
    ├── magic.js        Aspect des armes et armures magiques (pastille, décors, enchantement)
    ├── calc-bubble.js  Bulle de calcul : détail d'une valeur calculée (CA d'une armure, écusson CA)
    ├── modal.js · autocomplete.js · cell-text.js · dom.js   (briques partagées)
    ├── boot-notices.js Avis du démarrage (mise en forme indisponible, sauvegarde illisible)
    └── sanitize.js     Nettoyage du texte riche via DOMPurify (sans attribut data-* ni aria-*)
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
.agent/                 Ancienne configuration d'agent de la v3 (Antigravity) : rules/ et context/,
                        à ne pas modifier (anciennes procédures workflows/ supprimées en 4.18.0)
.claude/skills/         Procédures pour Claude Code (audit-fiche : audit complet de la fiche)
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
- Un texte saisi ne peut jamais se faire passer pour un élément de la fiche : DOMPurify retire tout
  attribut `data-*` / `aria-*`, les recherches de la page (`sheetElements`, dom.js) ignorent ce qui
  est placé dans un champ riche, et un nom lu dans un attribut (`data-out`, `data-icon`) n'est
  cherché que parmi les clés propres (`Object.hasOwn` : « __proto__ » ne désigne rien).
- DOMPurify non chargé (connexion coupée au premier chargement) : les textes longs s'affichent sans
  mise en forme (retours à la ligne gardés), en lecture seule, avec un bandeau ; ils ne sont jamais
  réenregistrés à partir de cet affichage simplifié.
- Règle de sécurité de la page (Content-Security-Policy, balise `<meta>` de index.html, car GitHub
  Pages ne permet pas d'en-têtes) : scripts du site et des deux bibliothèques figées seulement
  (DOMPurify, Supabase), échanges réseau avec la base Supabase du projet seulement, polices Google,
  images du site, de l'appareil (data:, blob:) ou d'une adresse http(s) (fond saisi par le joueur). Ajouter une bibliothèque ou un service
  oblige à compléter cette règle (sinon : erreur console « violates the following Content Security
  Policy directive »).
- Fond d'écran d'une fiche importée depuis un fichier : une image d'un autre site n'est pas chargée
  (sauf si l'appareil la connaît déjà) et la fiche prend le fond de l'appareil, pour que l'adresse ne
  soit pas chargée plus tard (autre onglet, fiche en ligne) ; le joueur peut l'ajouter depuis « Fonds ».
- Le contrôle automatique `.github/workflows/supabase-keepalive.yml` vérifie aussi, tous les
  3 jours, qu'une lecture sans connexion ne voit aucune fiche (règles RLS actives).

## Plusieurs onglets dans le même navigateur

- Tous les onglets partagent la même sauvegarde (`dd2024_char`). Chaque onglet retient le texte
  qu'il a lu ou écrit en dernier ; s'il a changé (événement `storage`, ou retour sur l'onglet :
  `visibilitychange`, `pageshow`, `focus`, car Safari peut geler un onglet), la fiche enregistrée
  est reprise (`store.replace(fiche, { source: 'other-tab' })`) sans être réécrite, avec un message
  (js/state/local-save.js, décision dans js/state/other-tab.js).
- Saisies de cet onglet gardées par-dessus la fiche reprise : celles pas encore enregistrées
  (enregistrement différé de 0,6 s ; même champ modifié des deux côtés : celui de cet onglet
  l'emporte), et celles enregistrées moins de 0,6 s avant l'arrivée de l'autre fiche si l'autre
  onglet n'a pas touché ce champ (il a écrit au même instant sans les voir : onglets en arrière-plan,
  dont les minuteries partent ensemble, ou trois onglets). Au-delà, l'autre onglet a forcément vu la
  saisie : sa fiche fait foi (une valeur remise en arrière là-bas est respectée). Autre personnage
  ouvert là-bas (nom changé) : rien n'est ajouté, la saisie est signalée.
- Une fusion est réenregistrée après le délai habituel, jamais tout de suite : le navigateur prévient
  clé par clé, et la base de synchronisation, écrite juste après la fiche, arrive souvent dans un
  second événement (63 fois sur 64 dans Edge). Elle est ainsi reprise avant d'être réécrite.
- La base de synchronisation enregistrée avec la fiche est reprise aussi (controller.js) ; quand
  l'autre onglet ne change que la base (envoi en ligne réussi), `adoptStoredBase` la reprend. Même
  personnage : une opération en ligne en cours continue (une création réussie lie la fiche) ; une
  question ouverte est abandonnée si le lien change. Un nouveau nom repris d'un autre onglet n'y
  déclenche pas la question du renommage (posée dans l'onglet où il a été tapé).
- Tableaux d'armes et d'armures : une fiche reprise ne reconstruit pas les lignes (le curseur reste),
  et une ligne lue avant une fenêtre (suppression, réglages) est retrouvée par son contenu
  (`locateRow`).
- Tests : `tests/local-save.test.js` (navigateur simulé à plusieurs onglets, tests/helpers/tabs.js,
  avec l'ordre des événements mesuré dans Edge).

## Sauvegarde en ligne

- Table Supabase `characters` partagée avec la v3 : (user_id, name) unique, `data` = la fiche,
  `updated_at` = version.
- La fiche retient sa « base » (personnage lié, version connue, empreinte du contenu), enregistrée
  dans le navigateur avec la fiche, au même instant (`dd2024_cloud_sync`).
- Empreintes toujours calculées sur la forme normalisée de la fiche (`sheetFingerprint` : celle
  qu'elle aura une fois relue, `migrateCharacter`) : un espace final ou une caractéristique vidée ne
  font plus poser de fausse question. Une base de la v4.15 (empreinte de la fiche en mémoire) est
  reconnue et convertie au premier chargement.
- Écritures sûres : création seule pour une nouvelle fiche ou un import ; mise à jour seulement si la
  version en ligne est toujours celle connue ; sinon une question est posée (fermée = rien n'est écrasé).
- Toute opération commencée avant un changement de fiche ou de compte est abandonnée sans rien écrire.
- Tests : `tests/cloud.test.js`, `tests/cloud-controller.test.js`, `tests/cloud-normalized.test.js`
  (faux Supabase réaliste ; bases v4.15 des 11 fiches de test).

## Format de la fiche

Dictionnaire « à plat », identique à la v3 (voir `js/state/schema.js`) : une clé par champ
(`char_name`, `str_score`, `skill_prof_athletics`, `feat_4`…) et trois tableaux
(`dynamic_weapons`, `dynamic_spells`, `dynamic_armors`).

- Les champs « riches » (nom, historique, traits…) peuvent contenir de la mise en forme HTML ;
  ils seront toujours affichés à travers DOMPurify.
- Les clés inconnues sont conservées par la v4 : une fiche enregistrée par la v4 reste lisible par
  la v3, et inversement. Attention : la v3, elle, reconstruit la fiche à partir de sa page et perd en
  enregistrant les clés qu'elle ne connaît pas (`combat_buffs`, `spell_slots_state`, `feat_uses`,
  `feat_choices`, `feat_0`, `feat_2`, `feat_6`, `feat_7`, `feat_10`, `feat_14`) : `V4_ONLY_KEYS`, `js/cloud/sync.js`.
- Clés propres à la v4 : `combat_buffs` (bonus de combat actifs), `spell_slots_state` (emplacements
  de sorts) et `feat_uses` (usages dépensés des dons à cases, `{ idDuDon: nombre }`, facultative :
  absente = rien de dépensé ; `js/rules/feat-uses.js`) et `feat_choices` (choix des dons : caractéristique,
  compétence, type de dégâts, sorts choisis par leur nom anglais, `{ "niveau": { idDuDon: { champ: valeur } } }`,
  facultative ; `js/rules/feat-choices.js`). Les lancers gratuits des sorts de dons sont dans `feat_uses`, sous
  des clés `"idDuDon@niveau:partie"` (0 ou 1 ; `js/rules/feat-spells.js`) ; la fiche n'écrit jamais ces sorts
  dans `dynamic_spells`. En v3, cet état était gardé à part dans le navigateur (`combat_buffs`, `spell_slots`) :
  la v4 le reprend une fois, dans la fiche v3 du navigateur (`importV3DeviceState`).
- `feat_0` : second don d'origine de l'Humain (trait Polyvalent), acquis au niveau 1, en plus de `feat_1`
  (historique). Absente d'une fiche vierge, ajoutée quand on la remplit ; elle ne compte que si l'espèce
  est Humain (`isHuman`, `js/rules/feats.js`) et n'est jamais effacée si l'espèce change. Son numéro 0
  sert aussi de clé dans `feat_choices` (`"0"`) et `feat_uses` (`"idDuDon@0:partie"`) ; ordre de la fiche
  et niveau d'acquisition : `FEAT_SLOT_ORDER` et `featSlotLevel` (`js/state/schema.js`).
- `feat_6`, `feat_14` (Guerrier) et `feat_10` (Roublard) : dons de classe en plus (PHB 2024, Amélioration
  de caractéristique répétée). Absentes d'une fiche vierge, ajoutées quand on les remplit ; elles ne comptent
  que pour leur classe (`CLASS_FEAT_SLOTS`, `js/state/schema.js` ; `featSlotCounts`, `js/rules/feats.js`) et
  ne sont jamais effacées si la classe change (la fiche montre « Réservé aux Guerriers »).
- `feat_2` : style de combat (PHB 2024, capacité Fighting Style) du Guerrier (acquis au niveau 1), du Paladin
  et du Rôdeur (niveau 2) ; un don de la catégorie Style de combat, ou `guerrier_beni` / `guerrier_druidique`
  (à la place du style, `STYLE_ALTERNATIVES`, `js/rules/feats.js`). `feat_7` : second style du Champion.
  Niveau d'acquisition selon la classe : `featSlotLevelFor`. Défense est comptée dans la CA calculée
  (`computeArmorClass`), Archerie dans l'attaque (`computeWeapon`), Duel par un bouton de combat
  (`combat_buffs.dueling`).
- Faveurs épiques : boutons de combat `combat_buffs.peerlessAim` (Visée infaillible, simple mémo « utilisée
  ce tour ») et `combat_buffs.nightSpirit` (Dans l'ombre : repère « Résistance (ombre) » près de la CA).
- Dons repliés (pastille du niveau, onglet Aptitudes & Traits) : retenus sur l'appareil seulement
  (`localStorage` `dd2024_feats_folded`, liste « emplacement:don »), jamais dans la fiche.
- Effets des dons (`featEffects`, `js/rules/feat-effects.js`) : des notes rangées par zone de la fiche
  (`FEAT_ZONES` : caractéristiques, CA, initiative, vitesse, jets contre la mort, PV max, sauvegardes,
  compétences…) et par emplacement (`featSlot:<niveau>`). Une zone affiche un repère « dont +X grâce à… »
  (bouton `data-feat-zone` d'`index.html`) ; la valeur saisie n'est jamais modifiée. Une note marquée
  `restKind: 'short'` n'apparaît que dans la fenêtre du repos court (Repas reconstituant du Chef cuisinier),
  une note `restKind: 'long'` que dans celle du repos long (Fabrication rapide du Façonneur).
- Faveurs épiques (lot 8) : leur +1 (jusqu'à 30) et leurs autres choix sont dans `feat_choices`
  (`ability`, `expertise` pour Faveur de compétence, `energy1` / `energy2` pour Faveur de résistance
  aux énergies) ; leurs cases dans `feat_uses` (`faveur_de_recuperation` : dés dépensés sur 10,
  `faveur_de_recuperation_rempart` : Dernier rempart, `faveur_du_destin`). Un compteur a sa propre clé
  quand un don en a plusieurs (champ `feat` de FEAT_COUNTERS).
- Frappe à mains nues : une entrée du catalogue `DD_RULES.weapons` (catégorie « Mains nues », hors table
  des armes du Manuel), reconnue par `isUnarmedStrike` (`js/rules/weapons.js` : sa catégorie, ou son nom).
  `computeWeapon` choisit son dé (Arts martiaux du Moine, Bagarreur de tavernes 1d4, style Combat à mains
  nues 1d6) ; les rappels réservés aux armes n'y sont pas (`WEAPON_ONLY_FEATS`, `feat-effects.js`). Arts
  martiaux (Moine sans armure ni bouclier, armes de Moine de corps à corps et mains nues) : dé seulement
  s'il est plus gros que celui de l'arme, Dextérité par `weaponStatOverride` (`js/rules/character.js`),
  partagée avec les bottes d'armes.
- Capacités de classe et maîtrise des armes (`js/rules/class-features.js`, lot A) : Aura de protection
  (Paladin 6) et Touche-à-tout (Barde 2) sont comptées par `deriveCharacter` (`saves[id].aura`,
  `skills[id].jack`) et expliquées par des notes `classFeature: true` mêlées aux notes des dons
  (`classFeatureNotes`, zones `saves.<id>` et `skills.<id>`). La sous-classe est lue par `subclassId`
  (nom du menu, nom anglais, saisie libre sans accents). `computeArmorClass` prend la meilleure Défense sans
  armure de `unarmoredDefenseOptions` (Barbare, Moine — bouclier permis pour La Voie du bouclier de l'Odyssée —,
  Sorcellerie draconique, Collège de la Danse).
  `weaponProficiency` dit si une arme est maîtrisée (réglage `proficiency` de `weaponConfig`, puis classe
  — `weaponProf` de `dd-rules.js` : `martial`, `martial-light`, `martial-finesse` —, don, sous-classe :
  Collège de la Vaillance, Roublard L'Odysséen dont le trident compte comme Finesse) ;
  sans maîtrise, `computeWeapon` n'ajoute pas le bonus de maîtrise à l'attaque et `weaponFeatNotes` met
  le rappel « Sans maîtrise » en tête des notes de l'arme (pastille ⚠ orange sous le bonus d'attaque).
- Le +1 des dons généraux sans autre choix vient du champ « asi » de `js/data/feats.js`
  (`GENERAL_ASI_RULES`, `js/rules/feat-choices.js`) : un menu « Caractéristique +1 » s'il y a un choix,
  sinon une caractéristique fixe sans menu (Gaillard : Constitution). Rien n'est ajouté à la valeur saisie.
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
