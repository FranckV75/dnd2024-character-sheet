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
| 5 bis. Esthétique    | Passe « chic » de toute la fiche en 3 lots (détail ci-dessous)                           | Captures avant/après validées par Franck            | ✅ (validé par Franck)                             |
| 6. Bascule           | Comparaison v3/v4, fusion de `v4` dans `master`                                          | 0 régression, 0 erreur console                      | ✅ publiée le 27/10/2026, validée par Franck (04/11/2026) |

## Étape 6 : bascule (fusion de `v4` dans `master`)

Audits du 26/10/2026 (données, compte en ligne, parité v3/v4, publication, tablettes), puis
corrections dans la v4 : reprise des emplacements de sorts et de la Rage gardés à part par la v3,
grande image de fond v3, dé de vie, nom de ligne en ligne lu autrement par la v3, version en ligne
écrite par un ancien onglet v3 jamais chargée sans question, question « existe déjà en ligne » qui
signale la version la plus récente, perception passive manuelle, infobulles des sorts au doigt,
cibles tactiles, outil `dev/preview.html` limité au poste local (détail : CHANGELOG 4.0.0).

Liste de contrôle pour Franck, au moment de publier :

1. Avant : demander à Catherine d'ouvrir la fiche actuelle, de vérifier qu'elle est là, de se
   connecter (enregistrement en ligne) et d'exporter un fichier JSON (Safari efface le stockage d'un
   site non utilisé depuis 7 jours). Faire de même sur la tablette et l'ordinateur de Franck.
2. Supabase (tableau de bord → Authentication → Policies, table `characters`) : RLS activé et les
   4 règles présentes (SELECT, INSERT, UPDATE, DELETE pour `authenticated`, `auth.uid() = user_id`) ;
   sinon exécuter `supabase/policies.sql` (peut être relancé sans risque). La règle DELETE sert au
   renommage et à « Supprimer » dans « Mes personnages ».
3. Publier entre deux parties. Juste avant, fermer TOUS les onglets de la fiche sur tous les appareils.
4. Après la publication : ouvrir la fiche de nouveau, puis recharger une fois environ 10 minutes plus
   tard (cache GitHub Pages). Ne jamais modifier une fiche dans un onglet ouvert avant la publication,
   ni revenir dessus avec « Précédent ».
5. Prévenir les joueurs : au premier lancement sur un 2ᵉ appareil, la question « Ce personnage existe
   déjà en ligne » peut apparaître une fois ; choisir la version marquée « (plus récente) ».
6. Retour en arrière possible : l'étiquette `v3-final` (à envoyer aussi sur GitHub avant la fusion).
   Après un retour à la v3 : les bonus de combat actifs et les emplacements de sorts utilisés repartent
   de l'état gardé par la v3 dans chaque navigateur, et un texte long saisi sur plusieurs lignes dans la
   v4 peut voir ses lignes collées par la v3 (à relire).

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
- Toutes les animations sont coupées si l'appareil demande moins d'animations, ou avec le bouton
  « Sans animation » de la barre Gestion (retenu sur l'appareil) ; rien n'est animé à l'impression.
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
- Puis étape 6 (bascule).
- Projet « dons actifs » (idée de Franck), classement et lots dans `docs/DONS_ACTIFS.md` ; lots 0 (données)
  et 1 (gains rapides) ✅ faits le 04/11/2026 ; lot 2 (compteurs : Chanceux, Tueur de mages) ✅ et lot 3 (choix mémorisés) ✅ le 06/11/2026 ; lot 6 (sorts donnés par un don, avec Télékinésiste) ✅ le 08/11/2026 ; second don d'origine de l'Humain et dons repliables (pastille du niveau) ✅ le 08/11/2026 ; lot 5 (vitesse, PV temporaires, armures, armes d'hast, poison, et le +1 de tous les dons généraux) ✅ le 09/11/2026. Dons en plus du Guerrier (niveaux 6 et 14) et du Roublard (niveau 10) ✅ le 09/11/2026 ; lot 4 (styles de combat) ✅, lot 7 (Frappe à mains nues et derniers dons) ✅ et lot 8 (faveurs épiques) ✅ le 09/11/2026 : tous les dons du manuel sont gérés. Point de départ : chaque don pertinent choisi dans Aptitudes & Traits,
  à un niveau atteint, ajoute son effet de jeu, comme la Rage pour le Barbare. Cogneur lourd sert de modèle :
  le mécanisme est déjà générique (`FEAT_BUFFS` et `featBuffs` dans `js/rules/weapons.js`, bouton décrit
  dans `BUFF_DEFS` de `js/ui/weapons.js`, effet calculé dans `computeWeapon`).
  1. Lister tous les dons 2024 en trois familles : bouton à activer (ex. Tireur d'élite, Maître des armes
     d'hast), calcul automatique (ex. Robuste pour les PV, Vigilant pour l'initiative, +1 à une
     caractéristique), ou texte seulement.
  2. Franck choisit ceux qui en valent la peine.
  3. Construction avec des tests vérifiés dans le Manuel du joueur 2024 ; bon candidat pour un workflow
     Ultracode (un agent par famille de dons, plus des relecteurs de règles). À regrouper éventuellement
     avec les descriptions des Faveurs épiques.
- ✅ (05/11/2026) Description de chaque botte d'arme (Enchaînement, Renversement,
  Ouverture, Sape, Coup double, Ralentissement, Poussée, Écorchure…) accessible depuis le tableau des armes,
  en infobulle ou petite fenêtre comme les sorts, avec le texte du Manuel du joueur 2024 en français.
  Peut rejoindre le projet « dons actifs ».
- Capacités de sous-classe (`docs/SOUS_CLASSES.md`) : lots 0 à 7 ✅ le 09/11/2026 (4.27.0). Restes du
  lot 7, gardés pour plus tard (décision de Franck du 10/11/2026) :
  - bouton « Monté sur le dragon » (Serment du Seigneur Dragon, niveau 15) et monture de l'Amazone
    (*Trouver une monture*) ;
  - repère de l'Affinité élémentaire dans le grimoire (« +Cha » sur les sorts du type choisi) ;
  - compteur de strophes (Poésie épique) : après avoir tapé un nombre, un toucher immédiat sur « + »
    ou « − » peut être perdu (le bloc se reconstruit).
- Plus tard aussi (idées de Franck) :
  - ✅ (05/11/2026) Configuration des armures : la colonne CA n'est plus saisie, elle est calculée et
    expliquée (bulle au toucher). Un engrenage par ligne règle le bonus magique (+1 à +3), et pour un
    objet hors manuel son type et sa valeur de base. Don Maître des armures intermédiaires compté.
  - ✅ (08/11/2026) Aspect des objets magiques, en crescendo : +1 éveillée (filet et nom en or,
    pastille), +2 enchantée (cadre doré, halo, paillettes), +3 légendaire (cadre parcouru de lumière,
    runes, inscription runique qui défile, braises). Toucher la pastille joue l'enchantement et dit
    l'effet. Bouton « Sans animation » dans la barre Gestion. À vérifier sur l'iPad de Catherine
    (Safari).
  - ✅ (10/11/2026) Blocs repliables (pastille à chevron, retenue sur chaque tablette, tout
    s'imprime) : sous-classe et ses capacités, compagnons, sorts de sous-classe et de dons, armures,
    traits de personnage, Odyssée, apparence, histoire. Magie sauvage laissée dépliée (une ligne,
    rappels utiles au moment d'agir).
  - Idées du 10/11/2026, à traiter plus tard :
    - Bilan de toutes les capacités de Korgul pour qu'elles apparaissent sur la fiche (exemple :
      Sens du danger, un rappel « avantage aux sauvegardes de Dextérité » près de la Dextérité) :
      faire un relevé de ce qui manque et qui serait utile.
    - Grimoire : comme les objets magiques, un aspect qui monte en puissance avec le niveau du sort
      (plus le sort est haut, plus l'effet est spectaculaire).
    - ✅ (4.32.0, 10/11/2026) Niveau : liste de 1 à 20 (molette sur iPad). Reste : points d'expérience : afficher les PX restants
      avant le niveau suivant.
    - ✅ (4.32.0, 10/11/2026) PV en cours de partie : boutons − / + (appui long) et pavé « Dégâts /
      Soins ». Reste : l'étendre si elle est bonne à d'autres compteurs (Rage, points de Ki…).
    - Encadré Armes : un filtre « Magiques », et les filtres (Toutes, Courantes, Guerre, Corps à
      corps, Distance) dans un menu déroulant pour gagner de la place.
  - Idées proposées par Claude le 10/11/2026 (survol du projet, retenues par Franck pour plus tard) :
    - Préférées :
      1. ✅ (4.31.0, 10/11/2026) Assistant de montée de niveau : un bouton « Passer au niveau N » qui liste ce qui change
         (PV, don à choisir, emplacements de sorts, nouvelles capacités).
      2. ✅ (4.30.0, 10/11/2026) Suivi des états (Empoisonné, À terre, Effrayé…) : pastilles à
         cocher dans l'onglet Combat avec le rappel de l'effet.
      3. ✅ (4.29.0, 10/11/2026) Sauvegardes de secours datées : la fiche garde ses 10 derniers
         états, avec un bouton « Revenir à… » dans la barre Gestion.
      4. Lanceur de dés (demande de janvier 2026, voir « Décisions en attente ») : toucher un bonus
         d'attaque ou une compétence lance le dé et affiche le total.
      5. Fiche utilisable sans wifi, installée comme une application sur la tablette (attention aux
         mises à jour, qui doivent toujours arriver).
    - Autres pistes :
      - Bilan des capacités pour les autres joueurs (Iria, personnage de Catherine), comme pour Korgul.
      - Vue du groupe (demande « synergies entre joueurs ») : PV, CA et perception passive de chaque
        personnage ; gros chantier, il faut décider qui voit quoi.
      - Journal de campagne : notes datées par séance, suivi propre à l'Odyssée (serments, quêtes).
      - Concentration : sort en cours et DD de la sauvegarde quand on prend des dégâts (vérifier
        d'abord ce que la fiche suit déjà).
      - Poids porté : total du matériel comparé à la capacité de charge.
      - Vérification des noms français, classe par classe, d'après les photos du manuel (dossier
        privé « Photos Manuel des joueurs FR » des ressources).
      - Mode consultation sur téléphone (lecture seule).
    - Technique : audit de santé (`/audit-fiche`) après les lots de novembre ; découper les plus gros
      fichiers (`css/sheet.css`, `js/rules/feat-effects.js`, `js/ui/spells.js`).

## Corrections de règles apportées (vérifiées dans le Manuel du joueur 2024)

- Paladin et Rôdeur : 2 emplacements de sorts de niveau 1 dès le niveau 1 (la v3 en donnait 0).
- Clerc : Conduit divin à partir du niveau 2 (la v3 l'affichait dès le niveau 1).
- Druide : Forme sauvage à partir du niveau 2, 4ᵉ utilisation au niveau 17 (la v3 : niveau 1 et 14).
- Moine et Ensorceleur : points de discipline / de sorcellerie à partir du niveau 2.
- Moine : la Défense sans armure ne s'applique plus avec un bouclier.
- Les 10 dons de style de combat sont classés « Style de combat » (et non « Général »).
- Druide : maîtrise des armures légères et des boucliers seulement (la v3 ajoutait les armures
  intermédiaires).

## Données à compléter

- ✅ Les 12 Faveurs épiques ont leur description (lot 0 des dons).
- ✅ Don « Cogneur lourd » (nom 2024) : l'ancien nom 2014 « Maître des armes lourdes » est rangé dans
  `aliases` pour la recherche (étape 4). L'identifiant `maitre_des_armes_lourdes_cogneur_lourd` est
  conservé tel quel : les sauvegardes de Korgul l'utilisent.
- ✅ Même cas pour « Perforateur » (alias « Empaleur ») et « Faveur de vision lucide »
  (alias « Faveur de vision véritable »). Sur AideDD, « A|B » = ancien nom | nom officiel WotC France ;
  « vision lucide » confirmé par le glossaire des règles 2024 d'AideDD, « Perforateur » confirmé par
  Franck dans le Manuel des joueurs 2024 en français.

## Changements faits sur `master` (v3) pendant la v4 : ✅ tous repris

- `0aa093a` : connexion Supabase reconnue après une session initiale vide.
- `46043d9` : formulaire de connexion mémorisable par le navigateur (`<form>`, autocomplete,
  PasswordCredential), « Mot de passe oublié ? » (`resetPasswordForEmail`) et fenêtre
  « nouveau mot de passe » (événement `PASSWORD_RECOVERY`), workflow
  `.github/workflows/supabase-keepalive.yml` (empêche la mise en pause du projet Supabase gratuit).
- Supabase (réglé par Franck) : Site URL et Redirect URLs = `https://franckv75.github.io/dnd2024-character-sheet/`.

→ ✅ Repris à l'étape 5 (mot de passe oublié, nouveau mot de passe) ; le workflow keep-alive est dans
  `.github/workflows/`. La connexion par lien magique reste une idée.

## Choix validés à l'étape 4

- Tablette : propriétés et notes longues des armes abrégées avec « … » (texte complet au toucher) : OK.
- Impression : relevé du personnage (dons non choisis masqués) ; lignes de sorts vides imprimées et
  valeurs très longues coupées dans les cellules : acceptés tels quels.
- Restauration ensorcelée : case dans la fenêtre de repos court (points rendus automatiquement).
  Restauration arcanique et Récupération naturelle : rappel, emplacements à décocher soi-même.

## Reprises dans l'interface (étapes 4-5) : ✅ faites

- Armes, armures et sorts modifiables, boutons de repos, bonus de combat, galerie, verrouillage,
  éditeur de style, impression, « Nouvelle fiche » et perception passive manuelle : faits à l'étape 4.
- Les champs courts (scores, PV, niveau…) sont désormais de vrais champs de saisie : une mise en
  forme (gras, couleur) posée en v3 sur ces champs s'affiche en texte simple.

- En v3, les emplacements de sorts cochés et les bonus de combat (Rage…) étaient stockés à part,
  hors de la fiche : ils n'étaient ni exportés ni synchronisés. En v4, ils font partie de la fiche ;
  au premier lancement, ceux que la v3 avait gardés dans le navigateur sont repris (étape 6).

## Décisions prises

- Repos long : tous les dés de vie dépensés sont récupérés (règle 2024, validé par Franck).
- Repos long : fenêtre de confirmation au lieu du bouton à maintenir 2 s de la v3 (validé par Franck).
- Bouclier : bonus de CA seulement si formé aux boucliers, un seul à la fois (PHB 2024).

- Police : Cinzel pour les titres et libellés, une police avec de vraies minuscules pour les textes
  longs (historique, traits, notes) : **Alegreya**, choisie par Franck sur échantillons.
- v3 : workflow keep-alive lancé et « Mot de passe oublié » testé par Franck (OK).

## Décisions en attente


- Demandes non réalisées en v3 : lanceur de dés, synergies entre joueurs (à compléter ?).
