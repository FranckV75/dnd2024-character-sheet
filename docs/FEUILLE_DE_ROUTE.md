# Feuille de route

Ce qui reste à faire, les idées en attente et les décisions qui valent pour la suite. Ce qui est
fait n'y reste pas : le fil des sessions est dans `docs/JOURNAL_DE_BORD.md`, le détail des
changements dans `docs/CHANGELOG.md`. Rien ne se lance sans l'accord de Franck.

## À faire

Ordre décidé par Franck le 11/11/2026 : d'abord l'audit et les découpages, puis les restes et
points relevés, puis une discussion pour trier toutes les idées.

### 1. ~~Audits de santé et découpages~~ : faits (4.38.0, 11/11/2026 ; 4.46.0, 22/11/2026)

Premier audit `/audit-fiche` et corrections en 4.38.0 (lots A, C, D, E) : découpage de
`css/sheet.css`, `js/rules/feat-effects.js` et un premier découpage de `js/ui/spells.js`. Le
grimoire et le tableau des armes avaient regrossi depuis (audit du 22/11/2026) : le découpage du
grimoire a été refait en 4.46.0 (`js/ui/spells.js` de 1 334 à 452 lignes) et celui des armes fait
(`js/ui/weapons.js` de 1 233 à 247 lignes ; voir `docs/ARCHITECTURE.md`). Le prochain audit se
fera à la demande de Franck.

Fait en 4.46.0 (22/11/2026, publiée le 23/11/2026), d'après l'audit du
22/11/2026 :
- ~~Lot A, petites corrections~~ : serveur de travail réservé à l'ordinateur (et contrôle dans
  `npm run check`) ; question « Modifié par l'ancienne version » qui n'est plus posée pour rien,
  et dont le texte cite tout ce qui serait perdu ; Rage sans effet en armure lourde (avertissement
  près du bouton, halo éteint) ; titres gardés avec leur contenu à l'impression ; message coupé
  de la barre du haut lisible au toucher.
- ~~Lot B~~ : bouton « Inspiration héroïque » sous les Points de Foi en mode Odyssée, quand il sert.
- ~~Lot C, ménage du code~~ : code mort, une seule lecture des compteurs, un seul `plainText`,
  largeur de la barre du haut définie une fois, tests du mode Odyssée sur le fonctionnement,
  commentaires, couleurs en variables (pastille magique en thème sombre) et contrôle des couleurs
  en dur dans `npm run check` ; `docs/ARCHITECTURE.md` complété.
- ~~Lot D~~ : découpage du grimoire et du tableau des armes (voir plus haut), sans changement pour
  le joueur.
- ~~Lot E, textes AideDD~~ : clos par la décision de Franck du 22/11/2026 (voir « Décisions qui
  valent pour la suite »).
- ~~Lot F~~ : boutons « Dépenser » dans la fenêtre « Points de Foi ».

~~Décisions de Franck sur la 4.46.0~~ : toutes prises le 23/11/2026 (tablette essayée par
Franck). Gardés tels quels : abréviation « Supériori… » des dégâts (le toucher déplie la ligne
entière dessous, ce qui lui convient), clé du bouton Inspiration hors de la fiche vierge, phrase
de rappel près de « Dépenser », pastille magique en sombre, réserve de 3 lignes des libellés,
ordre du texte « Modifié par l'ancienne version », commits signés Fable. Demandés et faits en
4.47.0 : Inspiration héroïque pour tous en mode Odyssée, confirmation avant de fermer
« Configuration de l'arme ».

Petits restes de la 4.46.0 (pas urgents) : le Déplacement rapide du Barbare (+3 m sans armure
lourde) n'a pas été revu ; sur ordinateur, la ligne du compte (« Non connecté… ») peut aussi être
coupée sans toucher pour la lire ; mode coupé, une Inspiration héroïque notée à part en mode
Odyssée n'est pas reprise (la pièce lit alors la case ; elle revient si l'on recoche) ; un champ inconnu d'une très vieille fiche fait encore poser la
question de l'ancienne version (aucune vraie fiche concernée) ; au premier chargement d'un
navigateur neuf, la ligne Nom / Classe de l'en-tête bouge parfois de 2 px (déjà avant) ; le
remplacement de la fiche pendant une saisie de sort n'a pas été rejoué à l'écran après le
découpage ; l'alignement Bonus de maîtrise / Points de Foi / Vitesse demande iPadOS 17 ou plus
récent (sinon cases lisibles mais décalées) ; le serveur de travail refuse aussi `.gitignore` et
`.github` (sans gêne pour la fiche).

### 2. Restes et points relevés : faits (4.39.0), décisions en attente

Faits en 4.39.0 (case Maîtrises d'armes, espèces de l'Odyssée, dragonnets 2024, restes des
sous-classes). Restent des décisions de Franck :
- Espèces de l'Odyssée : type de créature (Humanoïde ou Fée, le guide ne le dit pas) ; afficher
  ou non les bonus de caractéristiques et langues du guide (format 2014) ; limite du Regard
  pétrifiant ; humeur de la Sirène et chiffres du taureau (Rage maudite) restés en texte ;
  Chevelure serpentine sans Dextérité aux dégâts (lecture du livre à confirmer).
- Goliath : la fiche signale maintenant sa vitesse 2024 (10,5 m) ; à garder ou non.
- Dragonnets 2024 : le second souffle (sommeil, répulsion…) n'a plus de recharge ; garder la règle
  du pacte de l'Odyssée (une fois par repos) ? Noms des actions pris chez AideDD (Saignée…).
- Monté sur le dragon : remplacer vraiment la Perception passive par celle du dragon ?
- Monture d'Outremonde (Amazone) : case pour l'action bonus (une fois par repos long) ; noms
  français des actions à vérifier dans le livre ; ~~sorts de la Magie des Amazones pas dans le
  grimoire~~ (faits en 4.50.0, publiée le 26/11/2026 : bloc « Sorts de sous-classe », toujours préparés).

### 3. Idées : ordre validé par Franck le 18/11/2026

Faits en 4.41.0 (18/11/2026) : ~~liste des outils~~, ~~notice « Mode d'emploi », fenêtre
« Nouveautés », personnages d'exemple~~. Faites en 4.42.0 (18/11/2026, publiée) :
~~finitions du grimoire~~. Faits en 4.43.0 (19/11/2026, publiée) : ~~dégâts en plus sur les
armes~~, ~~étude du mode Odyssée désactivable~~ (`docs/etudes/MODE_ODYSSEE.md`). Fait en 4.43.1
(21/11/2026, publiée) : ~~« XP » au lieu de « PX » et palier du niveau suivant sous la case
XP~~. Fait en 4.44.0 (21/11/2026, publiée le 22/11/2026) : ~~mode Odyssée désactivable~~ (case
« Mode Odyssée » du menu « Gestion », d'après les réponses de Franck du 21/11/2026, section 6 de
l'étude). Fait en 4.45.0 (22/11/2026, publiée le 22/11/2026) : ~~« Points de Foi » (maîtrise +
Sagesse par niveau, remis par « Passer au niveau »), fenêtre des faveurs à 1, 3 et 5 points
(toucher la pastille) avec le rappel des dieux de Thyléa et Inspiration héroïque limitée à 1 mode
coupé~~. Faite le 21/11/2026 : ~~étude du multiclassage~~ (`docs/etudes/MULTICLASSAGE.md`). Faits en
4.46.0 (22/11/2026, publiée le 23/11/2026) : ~~bouton « Dépenser » des points de Foi~~ et ~~Inspiration
héroïque en mode Odyssée~~ (point 1, audit du 22/11/2026). Faits en 4.47.0 (23/11/2026, publiée le
23/11/2026) : ~~pièce « Inspiration héroïque » « Disponible / Non disponible » dans les deux modes~~,
~~petits − / + autour du titre (Points de Foi, renommée)~~, ~~liste des armes à parcourir (bouton ▾)~~,
~~confirmation avant de fermer « Configuration de l'arme »~~ (maquettes validées par Franck),
~~liste des armures à parcourir (bouton ▾, armures et bouclier du manuel seulement)~~, ~~noms des
sorts de toutes les listes de classe~~, ~~confirmation avant de fermer les réglages de l'armure~~,
~~« Sphère de feu » en Évocation~~ (décisions de Franck du 23/11/2026). Fait en 4.47.1
(23/11/2026, publiée le 23/11/2026) : ~~noms du manuel pour les dons, espèces, aptitudes et outils~~.
Faits en 4.48.0 (23/11/2026, publiée le 25/11/2026) : ~~suites du grimoire~~ (Paladin et Rôdeur,
cases des lancers gratuits de classe, Magicien 5 / 18 / 20, Découvertes magiques du Barde du
Savoir), ~~groupe « Autres » de la liste des armures~~, ~~outils des dons et de l'historique~~.
Fait en 4.48.1 (publiée le 25/11/2026) : ~~mode d'emploi relu en entier face à la fiche~~
et relecture systématique à chaque version (`npm run notice`, demande de Franck).
Faits en 4.49.0 (25/11/2026, publiée le 25/11/2026) : ~~petits − / + autour du titre des PV (et des
PV des compagnons)~~, ~~Inspiration héroïque dans sa propre colonne en mode Odyssée~~ (rangée du
haut moins haute), ~~Épuisement centré~~, ~~titre de la renommée aéré~~ (choix de Franck sur
maquettes, 25/11/2026).
Faits en 4.50.0 (25-26/11/2026, publiée le 26/11/2026) : ~~un personnage d'exemple par classe~~ (douze, niveaux 3
à 15, dont un Paladin 10 du Seigneur Dragon avec ses dragons ; demande de Franck). Puis les trois
manques vus en route : ~~sorts de la Magie des Amazones donnés~~ (Injonction 3, Appel de destrier 5,
Hâte 9, Confusion 13, Double illusoire 17 ; noms du guide reconnus) ; ~~Arcanum mystique hors du
compte des préparés~~ (une ligne par niveau, lancée seulement par sa case) ; ~~chakram dans la liste
des armes~~ (Odyssée, à distance, sans botte ; le style Armes de lancer y est toujours compté).
Choix à confirmer par Franck : « tromperie » du guide lue comme Double illusoire ; chakram sans botte
d'arme (le guide est écrit pour l'ancienne édition) et seulement lancé.
Fait en 4.51.0 (26/11/2026, pas encore publiée) : ~~objets « Autres » magiques~~ (cape, anneau,
bracelets, pierre de Ioun, robe : aspect magique selon leur rareté du DMG 2024, CA inchangée ;
une ligne écrite à la main reçoit une rareté par la roue dentée). Choix à confirmer par Franck :
paliers des décors (peu commun et rare : comme +1 ; très rare : +2 ; légendaire : +3), pastille
« ✦ » au lieu d'un « +N ».
Étude faite le 23/11/2026 : ~~explications des options~~ (`docs/etudes/EXPLICATIONS.md`,
proposition, rien n'est déployé ; Franck choisit ce qui est utile). Laissés de côté par Franck
le 23/11/2026 : suites du mode Odyssée (choix de la campagne dans « Nouvelle fiche », exemples
mode coupé) et bilans des autres joueurs (trop tôt). Reste :

1. **Multiclassage** : l'étude est faite et contre-vérifiée, rien n'est construit. Elle conseille
   de garder « Classe » (classe de départ) et « Niveau » (niveau total) et d'ajouter une seule clé
   facultative pour les classes en plus (aucune fiche actuelle ne change). Gros chantier, 5 lots
   publiés en 3 versions, en commençant par un socle invisible. Avant de construire : les
   14 questions de l'étude (section 8) et les photos du chapitre 2 du manuel français
   (section 9, sans doute p. 41-45).

Décisions de Franck en attente sur la 4.44.0 (mode Odyssée) :
- Toucher la case coupe le mode tout de suite et la barre du haut explique aussitôt (pas de
  fenêtre de confirmation avant) ; recocher remet la fiche strictement comme avant.
- Menu « Gestion » ouvert sur tablette : la barre du haut garde la place d'une deuxième ligne de
  message (17 px de plus, une ligne vide quand le message est court).
- Encadré « Odyssée » vidé à la main, mode coupé : il reste à l'écran jusqu'au verrou, au
  rechargement ou à l'impression (pour corriger une renommée mise à 0 par erreur).
- Encadré caché : pour y écrire un destin, il faut d'abord recocher la case (dit dans la notice).

Petits restes de la 4.45.0 (pas urgents) : mode coupé, une vieille valeur au-delà de 1 (« 3 »,
« 2/3 ») n'est pas corrigée d'elle-même : la pièce la montre « Disponible » et un toucher écrit 0
(ou « 0/3 », 4.47.0). La pastille des points de
Foi suit la Sagesse de la fiche, objets magiques compris seulement s'ils sont saisis dans la case
Sagesse. ~~La fenêtre des faveurs ne retire pas les points elle-même~~ : boutons « Dépenser »
en 4.46.0.

Petits restes de la 4.44.0 (pas urgents) : une fiche vierge dont on a seulement décoché le mode
perd ce réglage à la reconnexion (taper un nom suffit ; à revoir avec le choix de la campagne dans
« Nouvelle fiche ») ; l'ancien site efface le réglage s'il réenregistre la fiche (comme toutes les
clés propres à la v4) ; sur ordinateur, le message de la case est court, le détail est dans
l'infobulle. Suites voulues par Franck, plus tard (laissées de côté le 23/11/2026) : choix de la
campagne dans « Nouvelle fiche » ; personnages d'exemple mode coupé d'office.

Décisions de Franck en attente sur la 4.43.0 (dégâts en plus) :
- Repos court : il n'éteint pas les pastilles (comme la Rage) ; seul le repos long les éteint.
- Tableau : un dégât en plus tient sur une ligne, abrégé par « … » (sur tablette en portrait
  même une raison courte est abrégée) ; le texte entier se lit sur la pastille ou en touchant les
  dégâts. L'autre choix (deux lignes par dégât) allonge les lignes d'armes.
- Impression : les « À allumer » sont cités sous l'arme (« Selon le cas : … », petit italique
  d'environ 7 pt), jamais dans la case. Taille à grossir ?
- Limites : 4 lignes par arme, raison de 40 caractères, dés d4 à d20, pas de soustraction, pas
  de champ à part pour le type de dégâts (il s'écrit dans la raison).
- Rappels des dons qui citent les dégâts de l'arme (Maître d'hast, arme lancée, attaque Légère) :
  ils reprennent les dégâts en plus, pastilles allumées comprises ; la botte Enchaînement non.
- Ancien site (v3) : appliquer SON réglage d'arme efface les dégâts en plus de cette arme (comme
  « Arme maîtrisée » depuis la 4.15.0). Rien à corriger ; à savoir tant que la v3 sert encore.

Petits restes de la 4.43.0 (pas urgents) : « Appliquer » dans le réglage retire une ligne
illisible ou une propriété inconnue (fichier retouché à la main seulement) ; un onglet de
l'ancien site resté ouvert voit une pastille allumée comme un vrai changement des armes (question
de conflit au lieu d'un choix automatique) ; toucher les dégâts d'une arme sans dégât en plus ne
dit rien ; sur ordinateur, la colonne des messages coupe les phrases des pastilles (texte entier
au survol) ; l'affichage suppose que les dégâts en plus sont à la fin du texte des dégâts (un
seul test le vérifie). Défauts plus anciens vus au passage, non touchés : le tableau des armes
peut défiler de 8 px dans son cadre ; à 768 px « Ralentissement » et l'en-tête « Notes » se
coupent ; à 1024 px « FOR : +6 » passe sur deux lignes.

~~Décisions de Franck sur la 4.47.0~~ : toutes prises le 23/11/2026 (« Ok pour tout »). Gardés
tels quels : une arme déjà dans le tableau reste choisissable (✓ sans griser) ; l'Attaque à mains
nues en dernier, groupe « Sans arme » ; mode coupé, une case « Inspiration héroïque » en texte
libre garde sa case à saisir. Demandé et fait : la fenêtre de réglages de l'armure demande aussi
confirmation avant de fermer sans appliquer. Écoles où le manuel se contredit : Évocation pour les
deux (« Sphère de feu » : listes de classe et errata officiel d'octobre 2026 ; « Aura du croisé » :
description du sort, la liste du Paladin dit Transmutation sans errata).
- ~~Liste des armures : un groupe « Autres » (anneau, cape, sort…)~~ : fait en 4.48.0, liste de
  départ de 8 entrées dans `js/data/armor-others.js`, à compléter par Franck.

Décisions de Franck en attente sur la 4.48.0 (choix prudents faits sans lui) :
- Paladin / Rôdeur : « un seul sort par repos long » est rappelé et suivi pendant que la fenêtre
  est ouverte, sans rien bloquer ; la fenêtre ne retient pas l'échange d'une ouverture à l'autre
  (il faudrait une nouvelle clé facultative).
- Cases des lancers gratuits de classe visibles à deux endroits (bandeau de l'onglet Combat et
  bloc « Sorts de classe ») ; un Occultiste 17 a 5 groupes de cases dans le bandeau.
- Arcanum mystique : une case par niveau de sort (6 à 9), pas par sort nommé.
- Magicien 18 / 20 : seuls les sorts du livre sont proposés (pas ceux d'un don ou de l'espèce,
  même copiés) ; Maîtrise des sorts : seulement les sorts lancés en une action (règle 2024).
- Armures « Autres » : noms des objets (VF 2014) à valider ; les lignes de sort (Armure du mage,
  Bouclier de la foi, Peau d'écorce) restent cochées après un repos (le joueur les décoche) ;
  Armure du mage et la Robe de l'archimage sont notées comme un bonus (+3, +5) : à décocher en
  armure ; Peau d'écorce est un simple rappel (ne compte pas) ; une même entrée active deux fois
  s'additionne, avec un avertissement.
- Outils : les outils de classe (Barde, Roublard…) ne sont pas une « source » de la fenêtre, donc
  l'avancement d'un don (Musicien « 3 sur 3 ») les compte aussi ; une phrase le dit. Case Outils
  qui contient « Aucun » : gardée, l'outil s'écrit à la suite (on ne réécrit jamais).
- Le guide du joueur de l'Odyssée n'introduit aucun outil (seul le Satyre en donne un au choix) :
  pas de groupe Odyssée dans la liste.

Petits restes de la 4.47.0 (pas urgents) : sur ordinateur, la phrase du bouton ▾ des armes et des armures est coupée dans la colonne étroite des messages (comme
celle du grimoire ; texte entier au toucher) ; toucher le titre « Points de Foi », « Points de
renommée » ou « PV actuels », entre ses petits boutons, ouvre le clavier de la case (comme avant) ; sur Android, un
geste retour répété dans « Configuration de l'arme » finit par la fermer sans question (Chrome
l'impose ; Échap au clavier, lui, pose toujours la question).

~~Décisions de Franck sur la 4.47.1~~ : toutes prises le 23/11/2026 (« C'est ok pour moi », et
trois réponses données dans des conversations annexes). Gardés tels quels : « Formes du cercle
améliorées » (le livre imprime « améliorés », coquille) ; « Tempérée » / « Tropicale » au Cercle
de la Terre ; Lames psychiques à 18/36 m (le livre imprime 12/36 m, sans doute une coquille :
60/120 pieds) ; « Boîtes de jeux » et « Instruments de musique » en groupes à part dans la fenêtre
des outils (plus clair) ; ordre des options du Cœur sauvage de la fiche. Faits en 4.47.1 : plus de
prérequis affiché pour les dons d'origines (le livre n'en met aucun) ; « Sorts de Vagabond
féerique (Présents de Féerie) » et « Sorts mécaniques (Manifestations de l'ordre) », les deux
tables du livre gardées en lignes à part sous le nom de leur aptitude (identifiants inchangés).

**À chaque version, désormais** : ajouter l'entrée de la version en tête de `js/data/whats-new.js`
(sinon `npm run check` échoue), puis lancer `npm run notice` et relire face à la fiche chaque entrée
du mode d'emploi qu'il liste : rien de faux, rester court (décision de Franck du 25/11/2026).

Décisions de Franck en attente sur la 4.41.0 :
- ~~« Appliquer à la fiche » (historique) écrit aussi l'outil précis (Sage, Criminel…)~~ : fait
  en 4.48.0 (demande de Franck du 23/11/2026).
- Fenêtre des outils : l'outil précis de l'historique apparaît deux fois (encadré du haut et sa
  catégorie) ; le garder seulement en haut ?
- Personnage d'exemple : jamais envoyé au compte tout seul (« Enregistrer en ligne » pour le
  garder) ; choix prudent, à confirmer.
- Fenêtre « Nouveautés » : montrée une fois aux joueurs qui avaient déjà une fiche sur l'appareil,
  jamais à une toute première visite.

Décisions de Franck en attente sur la 4.42.0 :
- ~~Lancers gratuits sans case (Châtiment divin, Appel de destrier, Arcanum mystique, Contact
  avec les plans)~~ : cases faites en 4.48.0, rangées dans la clé facultative `subclass_uses`.
- Cases de sous-classe partagées entre plusieurs sorts (Ancêtre divin, Créatures
  fantasmagoriques, Ressourcement, Mante de majesté, Troisième œil) : pas reliées à « Lancer ».
- « Retirer les sorts non préparés » : si l'état d'avant ne peut pas être gardé (stockage plein),
  rien n'est retiré ; un sort d'un niveau sans emplacement reste (noté pour plus tard) ; une
  vieille ligne écrite dans un autre format que la base va dans « Gardés ». Choix prudents, à
  confirmer.
- Personnage multiclassé (Clerc / Magicien noté « Clerc ») : un sort présent sur les deux listes
  est proposé au retrait. Réponse de Franck (18/11/2026) : à traiter dans le chantier
  « Multiclassage », pas avant (l'étude prévoit une protection dès sa première version visible).

Petits restes de la 4.42.0 (pas urgents) : sous-classe écrite autrement (« Vie » pour « Domaine
de la Vie ») : ses sorts de domaine non cochés sont proposés au retrait ; ~~Rôdeur : « Lancer
gratuit » seulement si Marque du chasseur est notée au tableau~~ (bloc « Sorts de classe »,
4.48.0) ; phrase pâle sur un bouton
« Lancer gratuit » épuisé (comme les boutons « reste 0 ») ; teintes proches en thème sombre entre
« Pas d'emplacement » et « Lançable en rituel » ; plan de retrait recalculé à chaque rendu du
grimoire (à mesurer sur tablette) ; pas de test automatique du cas « état non gardé ».

Petits restes de la 4.41.0 (pas urgents) : ~~anciens noms « Main de mage », « Armure de mage » et
arme « Bâton »~~ (renommés en 4.47.0, voir « Noms du manuel » plus bas) ; ~~outils propres à
l'Odyssée~~ (il n'y en a pas) ; ~~dons qui donnent des outils (Façonneur…) pas reliés à la
fenêtre~~ (4.48.0) ; champ « Chercher… » de 38 px de haut (partagé avec
« Préparer mes sorts ») ; textes de « Revenir à… » sans espaces insécables ; impression de la
notice non essayée sur une vraie tablette.

Plus tard (bonnes idées, pas maintenant) : aide « Mon tour » (ce que le personnage peut faire à
son tour), création guidée d'un personnage de niveau 1, vue du groupe, journal de campagne, outil
du MJ. Pas prioritaires : lanceur de dés, fiche sans wifi.

Détail des idées :

- Lanceur de dés (demande de janvier 2026) : toucher un bonus d'attaque ou une compétence lance le
  dé et affiche le total. Pas prioritaire pour l'instant.
- Fiche utilisable sans wifi, installée comme une application sur la tablette (attention aux
  mises à jour, qui doivent toujours arriver). Chantier seul. Pas prioritaire pour l'instant.
- ~~Grimoire, suites~~ : faites en 4.48.0 (Paladin et Rôdeur, cases des lancers gratuits de
  classe, Maîtrise des sorts, Sorts de prédilection, Mémorisation de sort, Découvertes magiques).
  Restent : Aptitude érudite du Magicien (niveau 3) ; cases de sous-classe partagées entre
  plusieurs sorts pas reliées à « Lancer » (voir la 4.42.0).
- Grimoire : comme les objets magiques, un aspect qui monte en puissance avec le niveau du sort.
- Explications des options (demande de Franck, 18/11/2026) : chaque bouton ou option dit en une
  phrase à quoi il sert, lisible aussi sur tablette (fait pour le grimoire en 4.40.0 et pour les
  nouveautés de la 4.41.0 ; le « Mode d'emploi » explique le reste, onglet par onglet). Revue
  bouton par bouton faite le 23/11/2026 : `docs/etudes/EXPLICATIONS.md` (178 contrôles, 40 phrases
  utiles, candidats au retrait, trois façons d'afficher). Rien n'est déployé : à Franck de dire
  ce qu'il garde.
- Outil pour le MJ (« feuille du MJ », demande de Franck, 18/11/2026) : à discuter d'abord.
  Est-ce une bonne idée, et pour quoi faire ? Dans ce projet (même site, même base, lien avec la
  « Vue du groupe ») ou dans un projet séparé (`E:\2 - CODE\<nouveau projet>\`) ? Rien à
  construire avant cette discussion.
- Bilan des capacités pour les autres joueurs (Iria, personnage de Catherine), comme pour Korgul.
  Laissé de côté le 23/11/2026 (trop tôt ; peut-être pour tous les personnages plus tard).
- Vue du groupe (demande « synergies entre joueurs ») : PV, CA et perception passive de chaque
  personnage ; gros chantier, il faut décider qui voit quoi.
- Journal de campagne : notes datées par séance, suivi propre à l'Odyssée (serments, quêtes).
- Poids porté : total du matériel comparé à la capacité de charge (gardé en tête, pas utile pour
  le moment).
- ~~Vérification des noms français d'après les photos du manuel~~ : faite. Armes, armures et
  listes de sorts en 4.47.0 ; dons, espèces, outils, historiques, aptitudes des 12 classes et des
  48 sous-classes du manuel en 4.47.1 (23/11/2026 : une quinzaine de libellés corrigés, voir
  `docs/CHANGELOG.md`). Les sorts et sous-classes de l'Odyssée (Néréide : « Marche sur l'eau »)
  suivent leur propre livre. Pages non vérifiées faute de liste dans la fiche : options de
  Métamagie, Manifestations occultes.
- Mode consultation sur téléphone (lecture seule).
- Connexion par lien magique (courriel), en plus du mot de passe.

## Aide-mémoire : publier un changement délicat

Pour une publication qui touche la sauvegarde ou la synchronisation (repris de la bascule v3 → v4) :

1. Avant : demander à Catherine d'ouvrir la fiche, de vérifier qu'elle est là, de se connecter
   (enregistrement en ligne) et d'exporter un fichier JSON (Safari efface le stockage d'un site non
   utilisé depuis 7 jours). Faire de même sur la tablette et l'ordinateur de Franck.
2. Supabase (tableau de bord → Authentication → Policies, table `characters`) : RLS activé et les
   4 règles présentes (SELECT, INSERT, UPDATE, DELETE pour `authenticated`, `auth.uid() = user_id`) ;
   sinon exécuter `supabase/policies.sql` (peut être relancé sans risque).
3. Publier entre deux parties, tous les onglets de la fiche fermés sur tous les appareils.
4. Après : rouvrir la fiche, puis recharger une fois environ 10 minutes plus tard (cache GitHub
   Pages). Ne jamais modifier une fiche dans un onglet ouvert avant la publication.
5. Retour en arrière possible vers la v3 : étiquette `v3-final`.

## Décisions qui valent pour la suite

### Règles (vérifiées dans le Manuel des joueurs 2024)

- Paladin et Rôdeur : 2 emplacements de sorts de niveau 1 dès le niveau 1 (la v3 en donnait 0).
- Clerc : Conduit divin à partir du niveau 2. Druide : Forme sauvage à partir du niveau 2,
  4ᵉ utilisation au niveau 17 ; maîtrise des armures légères et des boucliers seulement.
- Moine et Ensorceleur : points de discipline / de sorcellerie à partir du niveau 2. Moine : la
  Défense sans armure ne s'applique pas avec un bouclier.
- Les 10 dons de style de combat sont classés « Style de combat » (et non « Général »).
- Repos long : tous les dés de vie dépensés sont récupérés, après une fenêtre de confirmation.
- Bouclier : bonus de CA seulement si formé aux boucliers, un seul à la fois.
- Rage du Barbare : sans effet en armure lourde (p. 51). La fiche n'éteint jamais le bouton ; elle
  ne compte pas ses effets et le dit (4.46.0).
- Mode Odyssée (guide du MJ de l'Odyssée p. 92) : les points de Foi remplacent les points de héros
  du guide du MJ, pas l'Inspiration héroïque du manuel ; les deux existent ensemble (4.46.0).
- Historique : un rappel ; « Appliquer » coche les compétences et remplit le don de niveau 1 s'il
  est vide, jamais les caractéristiques. Une valeur saisie n'est jamais modifiée par la fiche
  (seulement des mentions « dont +X »).

### Données et sauvegarde

- Anciens noms de dons gardés pour la recherche (`aliases`) : « Maître des armes lourdes » pour
  Cogneur lourd, « Empaleur » pour Perforateur, « Faveur de vision véritable » pour Faveur de vision
  lucide. L'identifiant `maitre_des_armes_lourdes_cogneur_lourd` reste tel quel : les sauvegardes de
  Korgul l'utilisent.
- Anciens noms de classes et sous-classes lus (`aliasesFr`, `DD_RULES.namesOf`) : une fiche
  enregistrée avec « Sorcier » s'affiche « Occultiste » sans être réécrite.
- Emplacements de sorts utilisés et bonus de combat (Rage…) font partie de la fiche (en v3 ils
  étaient gardés à part dans le navigateur, repris au premier lancement de la v4).
- Textes des sorts et des dons repris d'AideDD (391 sorts, 76 dons, déjà en v3) : ils restent tels
  quels dans le dépôt public. Décision de Franck du 22/11/2026, qui l'assume (lot E de l'audit
  clos). Les textes écrits pour la fiche restent des résumés, jamais le texte des manuels.

### Interface

- Polices : Cinzel pour titres et libellés, **Alegreya** pour les textes longs (choix de Franck).
- Tablette : propriétés et notes longues des armes abrégées avec « … » (texte complet au toucher).
- Impression : relevé du personnage (dons non choisis masqués) ; lignes de sorts vides imprimées et
  valeurs très longues coupées dans les cellules : acceptés tels quels.
- Restauration ensorcelée : case dans la fenêtre de repos court. Restauration arcanique et
  Récupération naturelle : rappel, emplacements à décocher soi-même.
- Filtres des armes : pastilles sur une ligne (pas de menu déroulant, ils tiennent à 820 px).
- Magie sauvage : bloc laissé déplié (une ligne, rappels utiles au moment d'agir).
