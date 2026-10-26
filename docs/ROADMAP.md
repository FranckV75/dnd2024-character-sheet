# Feuille de route — reconstruction v4

Chaque étape se termine par un jalon validé par Franck.

| Étape                | Contenu                                                                                  | Jalon de validation                                 | État                                               |
| -------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| 0. Mise en place     | Branche `v4`, structure, serveur local, garde-fous (`npm run check`), CI, `CLAUDE.md`    | Page vide sans erreur console                       | ✅                                                  |
| 1. Règles métier     | `js/rules/` pur + données `js/data/` sans `window`, tests étendus, corrections de règles | Tests verts, règles vérifiées dans les manuels      | ✅                                                  |
| 2. État & sauvegarde | Store unique, schéma, migration v3, localStorage, import/export JSON                     | Les sauvegardes de Korgul se chargent sans perte    | ✅ (validé par Franck)                             |
| 3. HTML & CSS        | 4 onglets, thèmes, tablette 768–1100 px, sans `!important` ni handlers inline            | Rendu validé à 820, 1024, 1280 px dans les 2 thèmes | ✅ (validé par Franck)                             |
| 4. Fonctionnalités   | Combat, dons, compétences, repos, grimoire, verrouillage, galerie, impression            | Validation par lots                                 | ✅ (validé par Franck)                             |
| 5. Cloud             | Supabase (auth, roster, conflits) sur la même base que la v3                             | Synchronisation testée                              | ✅ (testé par Franck)                              |
| 5 bis. Esthétique    | Passe « chic » de toute la fiche en 3 lots (détail ci-dessous)                           | Captures avant/après validées par Franck            | ✅ lots 1 à 3 faits (à valider par Franck)         |
| 6. Bascule           | Comparaison v3/v4, fusion de `v4` dans `master`                                          | 0 régression, 0 erreur console                      | ⏳                                                  |

## Étape 5 bis : passe esthétique (avant la bascule)

Demandée par Franck après l'étape 5 : une fiche « 12 sur 10 », chic et classe, avec un effet « waouh »,
dans le même esprit que la barre « Gestion » redessinée (verre dépoli, double filet doré, icônes dorées).
Préalables déjà faits : lisibilité du thème clair, cases des tableaux qui passent à la ligne, fiche
translucide façon v3 (deux tons, suivant le curseur d'opacité), barre « Gestion » ordonnée et figée.
Chaque lot est construit par un workflow (constructeurs en parallèle, trois relecteurs indépendants,
un correcteur), puis vérifié à la main et commité localement sur `v4` (rien n'est publié).

### Lot 1 : finitions chic — ✅ fait (commit `b095127`)

- Titres de section : icônes dorées dessinées à la place des emojis, filet doré qui s'estompe avec un losange.
- Onglets « marque-pages de grimoire » : onglet actif doré avec soulignement lumineux, une icône par onglet.
- En-tête : nom du personnage en titre de parchemin (grand, doré, gravé), chevrons dorés sur les listes.
- Boutons de la fiche (filtres d'armes, Rage, Ajouter, repos, roues, corbeilles) dans le style de la barre.
- Cases à cocher dorées (maîtrises, expertises, jets contre la mort, rages) avec un éclat quand on coche.
- Pièces de monnaie en relief (cuivre, argent, électrum, or, platine).
- Grands chiffres (CA, PV, caractéristiques) d'aspect gravé.
- Fenêtres (connexion, galerie, import, « Mes personnages »…) en verre dépoli à double filet doré.
- Textes longs (traits, capacités, compagnons, histoire) : la case s'agrandit, plus de texte caché
  (point 1 du lot 3, avancé ici).
- Retouches ensuite demandées par Franck : poing vu de face pour la Force, sablier pour le repos court,
  plus aucun emoji dans les fenêtres d'import et d'export.

### Lot 2 : effets « waouh » — ✅ fait (commit `87f73f8`)

- Ouverture : la fiche apparaît en fondu, les cadres se posent en cascade (moins d'une seconde).
- Changement d'onglet en fondu glissé.
- Survol (ordinateur seulement) : les petites cartes se soulèvent, avec un reflet doré rare et discret.
- Passage clair / sombre : le nouveau thème se dévoile en cercle depuis le bouton.
- Mode cinéma : lent zoom de l'illustration.
- Rage activée : lueur de braise autour des PV, des Rages et des armes, bouton Rage incandescent.
- Jauge de PV sous « PV actuels » (laiton → cuivre → braise, PV temporaires en argent).
- Les valeurs calculées pulsent brièvement en doré quand elles changent.
- Toutes les animations sont coupées si l'appareil demande moins d'animations ; rien n'est animé à l'impression.
- À ressentir en vrai par Franck (rythme des animations, surtout la Rage) et à ajuster si besoin.

### Lot 3 : lisibilité et confort — ✅ fait (commit `4ea9505`)

- Grimoire : seuls les sorts remplis s'affichent, plus une seule ligne de saisie « Nouveau sort… » (elle
  n'entre dans la sauvegarde qu'au premier caractère tapé ; les lignes vides de la sauvegarde restent
  intactes) ; les sorts non préparés sont plus discrets dès qu'un sort est marqué préparé.
- Personnage sans magie de classe : le grimoire et les cases d'incantation se replient en une courte
  mention avec un bouton « Ouvrir le grimoire » (choix mémorisé dans le navigateur) ; à l'impression,
  seule la mention apparaît.
- Dons : un emplacement atteint mais vide est signalé en doré ; les niveaux à venir sont atténués avec
  « À venir », et un don déjà prévu pour plus tard porte « Actif au niveau N ».
- Compétences : celles qui sont maîtrisées ressortent (nom plus marqué, bonus doré, léger fond chaud),
  les expertises un cran de plus, les autres plus discrètes mais lisibles.
- Revue de toute la fiche comme un joueur sur iPad : bonus d'attaque sur une seule ligne, jets de
  sauvegarde plus grands (maîtrisés en gras), taille minimale des petits libellés, contrastes renforcés,
  colonnes du grimoire sans mots coupés à 820 px.
- Ensuite (fait) : les tableaux d'armes et d'armures n'affichent plus qu'une ligne vide de saisie.

### Après la passe esthétique

- ✅ Bouton « Cogneur lourd » à côté de « Rage » dans le tableau des armes (bonus de maîtrise aux
  dégâts avec une arme Lourde), proposé seulement si le don est choisi à un niveau atteint.
- Autres fonctions envisagées par Franck : à préciser.
- Puis étape 6 (bascule).

## Corrections de règles apportées (vérifiées dans le Manuel du joueur 2024)

- Paladin et Rôdeur : 2 emplacements de sorts de niveau 1 dès le niveau 1 (la v3 en donnait 0).
- Clerc : Conduit divin à partir du niveau 2 (la v3 l'affichait dès le niveau 1).
- Druide : Forme sauvage à partir du niveau 2, 4ᵉ utilisation au niveau 17 (la v3 : niveau 1 et 14).
- Moine et Ensorceleur : points de discipline / de sorcellerie à partir du niveau 2.
- Moine : la Défense sans armure ne s'applique plus avec un bouclier.
- Les 10 dons de style de combat sont classés « Style de combat » (et non « Général »).

## Données à compléter

- Les 12 Faveurs épiques n'ont pas de description (à rechercher, pas urgent).
- ✅ Don « Cogneur lourd » (nom 2024) : l'ancien nom 2014 « Maître des armes lourdes » est rangé dans
  `aliases` pour la recherche (étape 4). L'identifiant `maitre_des_armes_lourdes_cogneur_lourd` est
  conservé tel quel : les sauvegardes de Korgul l'utilisent.
- ✅ Même cas pour « Perforateur » (alias « Empaleur ») et « Faveur de vision lucide »
  (alias « Faveur de vision véritable »). Sur AideDD, « A|B » = ancien nom | nom officiel WotC France ;
  « vision lucide » confirmé par le glossaire des règles 2024 d'AideDD, « Perforateur » confirmé par
  Franck dans le Manuel des joueurs 2024 en français.

## Changements faits sur `master` (v3) depuis le début de la v4, à reporter

- `0aa093a` : connexion Supabase reconnue après une session initiale vide.
- `46043d9` : formulaire de connexion mémorisable par le navigateur (`<form>`, autocomplete,
  PasswordCredential), « Mot de passe oublié ? » (`resetPasswordForEmail`) et fenêtre
  « nouveau mot de passe » (événement `PASSWORD_RECOVERY`), workflow
  `.github/workflows/supabase-keepalive.yml` (empêche la mise en pause du projet Supabase gratuit).
- Supabase (réglé par Franck) : Site URL et Redirect URLs = `https://franckv75.github.io/dnd2024-character-sheet/`.

→ Étape 5 : reprendre ces comportements (et envisager la connexion par lien magique).
→ Étape 6 : fusionner `master` dans `v4` avant la bascule, pour garder au minimum le workflow keep-alive.

## Choix validés à l'étape 4

- Tablette : propriétés et notes longues des armes abrégées avec « … » (texte complet au toucher) : OK.
- Impression : relevé du personnage (dons non choisis masqués) ; lignes de sorts vides imprimées et
  valeurs très longues coupées dans les cellules : acceptés tels quels.
- Non traités : Restauration ensorcelée, Récupération arcanique (« 1 fois par repos long ») restent des rappels.

## À reprendre dans l'interface (étapes 4-5)

- Étape 3 : armes, armures et sorts sont affichés en lecture seule ; ajout, modification et
  suppression des lignes à l'étape 4 (ainsi que boutons de repos, bonus de combat, galerie,
  verrouillage, éditeur de style, impression, « Nouvelle fiche » et bascule perception passive manuelle).
- Les champs courts (scores, PV, niveau…) sont désormais de vrais champs de saisie : une mise en
  forme (gras, couleur) posée en v3 sur ces champs s'affiche en texte simple.

- En v3, les emplacements de sorts cochés et les bonus de combat (Rage…) étaient stockés à part,
  hors de la fiche : ils n'étaient ni exportés ni synchronisés. En v4, ils feront partie de la fiche.

## Décisions prises

- Repos long : tous les dés de vie dépensés sont récupérés (règle 2024, validé par Franck).
- Repos long : fenêtre de confirmation au lieu du bouton à maintenir 2 s de la v3 (validé par Franck).
- Bouclier : bonus de CA seulement si formé aux boucliers, un seul à la fois (PHB 2024).

- Police : Cinzel pour les titres et libellés, une police avec de vraies minuscules pour les textes
  longs (historique, traits, notes) : **Alegreya**, choisie par Franck sur échantillons.
- v3 : workflow keep-alive lancé et « Mot de passe oublié » testé par Franck (OK).

## Décisions en attente


- Demandes non réalisées en v3 : lanceur de dés, synergies entre joueurs (à compléter ?).
