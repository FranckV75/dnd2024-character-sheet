# Journal de bord

Le fil des sessions de travail. Franck le fait lire en début de session ; Claude le tient à jour
en fin de session :

- **En ce moment** est réécrit à chaque fin de session : état actuel, ce qui attend, ce qui reste.
- **Sessions** : une entrée par session, la plus récente en premier, avec un titre qui dit sur quoi
  on a travaillé (il change si le sujet change en route). 5 à 10 lignes : décisions et choses
  laissées de côté. Le détail des changements est dans `docs/CHANGELOG.md`, les idées dans
  `docs/FEUILLE_DE_ROUTE.md`.
- Quand le fichier devient long, les vieilles entrées partent dans `docs/journal/<année>.md`.

## En ce moment

- **Prête, pas publiée** : version **4.49.0** (25/11/2026), commitée sur `v4`, rien de poussé :
  remarques de Franck sur l'onglet Combat, d'après ses choix sur maquettes (« A · 4 colonnes »,
  Épuisement « option 1 »). Pièce « Inspiration héroïque » dans sa propre colonne en mode
  Odyssée, petits − / + autour du titre des PV (aussi ceux des compagnons), Épuisement centré,
  renommée aérée, bouclier de la CA plafonné. Nouveautés écrites, mode d'emploi relu
  (`npm run notice`). Attend le « Publie » de Franck.
- **En ligne** : version **4.48.1**, publiée le 25/11/2026 avec l'accord de Franck (« Publie »),
  version en ligne vérifiée (0 erreur console) : mode d'emploi relu en entier et corrigé,
  relecture systématique à chaque version (`npm run notice`). Avant elle, la **4.48.0**
  (25/11/2026) : suites du grimoire (Paladin et Rôdeur, cases des
  lancers gratuits de classe, Magicien 5 / 18 / 20, Découvertes magiques du Barde du Savoir),
  groupe « Autres » de la liste des armures, outils des dons et de l'historique.
  En attente : les décisions sur la 4.48.0 (choix prudents faits sans Franck), la 4.44.0 et la
  4.45.0, point 3 de `docs/FEUILLE_DE_ROUTE.md`. Étude `docs/etudes/EXPLICATIONS.md` à lire
  par Franck (rien de déployé).
- **Suite** : multiclassage (attend les réponses de Franck), ou une idée du point 3. Noté le
  25/11/2026 pour plus tard : objets « Autres » magiques (cape, anneau… : point 3, idée 2). Laissés de
  côté par Franck le 23/11/2026 : suites du mode Odyssée, bilans des autres joueurs.
- **Serveur de travail** : `npm run dev` n'écoute plus que l'ordinateur (127.0.0.1 et ::1) et ne
  sert jamais `.git` ; relancé le 22/11/2026 avec cette protection (vérifié avec netstat).
- **Multiclassage** : étude faite et contre-vérifiée (`docs/etudes/MULTICLASSAGE.md`). Rien de
  construit : attend les réponses de Franck (14 questions, section 8) et les photos du chapitre 2
  du manuel français (section 9).
- **Vérifications sur tablette** : faites par Franck le 21/11/2026 sur Android et PC, et la
  4.44.0 sur tablette le 22/11/2026 : tout est bon ; reste l'iPad de Patricia (liste ci-dessous, elle fait foi et s'allonge à chaque version).
- **À chaque version** : entrée en tête de `js/data/whats-new.js`, puis `npm run notice` et
  relecture des entrées du mode d'emploi qu'il liste (rien de faux, rester court).
- **Petits champs sur iPad** : ne rien changer tant que Franck n'a pas d'info sur le zoom.
- **GitHub** : anciens commits (PDF, vieilles sauvegardes, adresse Gmail) purgés par le support
  le 12/11/2026 (ticket 4978665) ; vérifié le 18/11 : 404 partout. Dossier clos.
- **Emplacement** : le dépôt est désormais `E:\2 - CODE\Feuille de perso\Code\` (voir
  `E:\2 - CODE\LISEZ-MOI.md`).
- **Manuel français** : les photos de Franck font foi pour les noms français. Elles sont rangées,
  avec un index (`INDEX.md`), dans
  `..\Ressources\Photos Manuel des joueurs FR\` (à côté du dépôt).
  Ce dossier est privé et ne va jamais dans le dépôt. Les textes de la fiche sont des résumés,
  jamais le texte du livre (le dépôt est public).

### À vérifier par Franck (reste : l'iPad de Patricia)

À voir sur tablette quand la 4.49.0 sera en ligne (Android, PC, et iPad de Patricia) :
- Onglet Combat, mode Odyssée : quatre colonnes (Bonus de maîtrise, Points de Foi, Inspiration
  héroïque, Vitesse) ; la rangée n'est plus trop haute, le bouclier de la CA ne s'allonge plus.
  Mode décoché : la colonne disparaît, la pièce reprend la place des Points de Foi.
- Petits − / + autour de « PV actuels » et « PV temp. », et du titre « PV » des compagnons :
  faciles à toucher ? Le bouton « Dégâts / Soins » reste sous la valeur.
- Épuisement : le chiffre bien au milieu de ses deux boutons, sans petites flèches.
- La fenêtre « Nouveautés de la version 4.49.0 » s'affiche une fois et se lit en entier.

À voir sur tablette maintenant que la 4.48.0 est en ligne (Android, PC, et iPad de Patricia) :
- Paladin 5 : cases « Châtiment de paladin » et « Fidèle destrier » dans le bandeau de l'onglet
  Combat et dans le bloc « Sorts de classe » du grimoire ; « Lancer » coche la case.
- « Préparer mes sorts » d'un Paladin ou d'un Rôdeur : la ligne « Un seul échange… » se lit.
- Magicien 18 / 20 et Barde du Savoir 6 : les menus du bloc tiennent dans la largeur ; le long
  menu des Découvertes magiques reste confortable au doigt.
- Armures : groupe « Autres » en bas de la liste ▾ ; la ligne choisie (Armure du mage…) a une
  case Commentaire haute à 820 px : gênant ou pas ? Toucher la CA de la ligne montre ses
  conditions.
- « Appliquer à la fiche » d'un Sage écrit « Matériel de calligraphe » dans la case Outils ;
  fenêtre des outils : encadré « D'où viennent vos outils ».
- La fenêtre « Nouveautés de la version 4.48.0 » s'affiche une fois et se lit en entier.

À voir sur tablette maintenant que la 4.47.1 est en ligne (Android, PC, et iPad de Patricia) :
- La fenêtre « Nouveautés de la version 4.47.1 » s'affiche une fois et se lit en entier.
- Fiche déjà remplie : le don d'origines (Vigilant, Chanceux…) se lit sans ligne « Prérequis ».

À voir sur tablette maintenant que la 4.47.0 est en ligne (Android, PC, et iPad de Patricia) :
- Onglet Combat, mode Odyssée : la pièce « Inspiration héroïque » sous la pastille des Points de
  Foi passe de « Non disponible » (vide, pointillés) à « Disponible » (dorée) au toucher, aussi
  fiche verrouillée. Mode décoché : la pièce seule à la place de la case, sans − / +.
- Petits − / + de part et d'autre de « Points de Foi » et « Points de renommée » : faciles à
  toucher, sans mordre sur les traits pointillés ; toucher le titre entre eux ouvre-t-il le clavier
  (comme avant) ? Gênant ou pas ?
- Armes : toucher le nom vide ou le bouton ▾ ouvre la liste (4 groupes, dégâts, ✓) sans clavier ;
  sur l'iPad, le ▾ reste-t-il doré après le toucher (comme au grimoire) ?
- « Configuration de l'arme » : changer un réglage puis « Annuler » pose la question ; « Continuer
  à modifier » garde les réglages. Android : le geste retour pose aussi la question.
- Armures : toucher le nom vide ou le bouton ▾ ouvre la liste (4 groupes, CA, ✓) sans clavier ;
  la roue dentée d'une armure pose la même question qu'une arme quand on la ferme sans appliquer.
- iPad : « Non disponible » se coupe proprement sur deux lignes sous la pièce.

À voir sur tablette maintenant que la 4.46.0 est en ligne (Android, PC, et iPad de Patricia) :
- Mode Odyssée, Humain ou Champion niveau 10 : le bouton « Inspiration héroïque » sous la pastille
  des Points de Foi s'allume (doré) et s'éteint au toucher, aussi fiche verrouillée ; il est absent
  pour un Elfe et en mode coupé.
- Fenêtre « Points de Foi » : « Dépenser 1 point », « 3 points », « 5 points » retirent les points ;
  un bouton grisé quand il en manque ; le bouton + de la case les rend.
- Barre du haut : un message coupé par « … » se déplie au toucher et se replie au toucher suivant.
  Sur l'iPad (Safari) : la barre dépliée pousse-t-elle la page d'une ligne quand on a défilé ?
- Barbare en Harnois, Rage allumée : pastille rouge « Rage sans effet », dégâts sans +2, halo
  éteint ; décocher l'armure remet tout.
- Onglet Combat, mode Odyssée : « Bonus de maîtrise », « Points de Foi » et « Vitesse » alignés.
  Sur l'iPad, il faut iPadOS 17 ou plus récent ; sinon les cases restent lisibles mais décalées.
- La fenêtre « Nouveautés de la version 4.46.0 » s'affiche une fois et se lit en entier.
- Thème sombre : la pastille +1/+2/+3 des armes et armures magiques (or bruni, chiffre crème) se
  lit bien.
- Impression : le titre de la classe part avec ses capacités ; une case vide reste avec son titre.
- Colonne Dégâts à 820 px : « Supériorité » est-il coupé avec un trait d'union (« Supé-riorité ») ?
  (Décision en attente, point 1 de la feuille de route.)

Vérifié par Franck le 21/11/2026 sur sa tablette Android (Lenovo P12) et sur son PC : tout est
bon (Nouveautés, en-tête, historique, ouverture des fiches, rappels de Korgul, Mode d'emploi et
son impression, dégâts en plus des armes et leur impression, Fougue, Concentration, traits
d'espèce au repos, espèce et historique, outils, saisie fluide, grimoire : « Au combat »,
« Lancer », « Lancer gratuit », sorts d'espèce, « Préparer mes sorts », « Retirer les sorts non
préparés », losanges fixes, personnages d'exemple et « Revenir à… »).

4.44.0 vérifiée par Franck sur sa tablette le 22/11/2026 : la case « Mode Odyssée » fonctionne,
le reste est bon. Seul défaut vu : mode coché, la case disait encore « Inspiration héroïque ou
points de Foi » (corrigé en 4.45.0).

À voir sur tablette maintenant que la 4.45.0 est en ligne (Android, PC, et iPad si possible) :
- Mode Odyssée coché : la case s'appelle « Points de Foi » ; la pastille dorée dessous (« +5 par
  niveau ») donne le bon nombre (bonus de maîtrise + Sagesse) ; la toucher ouvre la fenêtre
  « Points de Foi » (faveurs à 1, 3 et 5 points, « Possible » ou « Il manque… » selon la case),
  qui se lit en entier et se ferme par « Fermer » ; son bouton « Les dieux de Thyléa » ouvre la
  liste des dieux par-dessus, et « Retour » revient aux faveurs.
- « Passer au niveau » : la fenêtre a une ligne « Points de Foi » et la case devient « N/N ».
- Mode décoché : « Inspiration héroïque », les boutons vont de 0 à 1 ; « + » à 1 le dit en haut.

Reste à voir sur l'iPad (Franck n'en a pas : c'est celui de Patricia, pas de retour pour
l'instant) :
- Safari zoome-t-il quand on touche les petits champs (notes des armes, listes des dons,
  Outils et Langues) ? Si oui, décider s'il faut agrandir leur police.
- Onglet Combat : le dégât en plus est abrégé par « … » sur une ligne dans le tableau des armes.
- Aucune fenêtre n'est coupée ; la saisie est fluide.
- Si l'occasion se présente : l'ancien site (v3) ouvre toujours une fiche enregistrée par la v4.

### Ensuite, sur demande de Franck seulement

Ordre décidé le 11/11/2026 (détail dans `docs/FEUILLE_DE_ROUTE.md`) :
1. ~~audit et découpage~~ : faits (4.38.0) ; second audit le 22/11/2026, corrections et
   découpage du grimoire et des armes en 4.46.0 (publiée le 23/11/2026), point 1 de `docs/FEUILLE_DE_ROUTE.md` ;
2. ~~restes et points relevés~~ : faits (4.39.0) ; restent les décisions listées au point 2 de
   `docs/FEUILLE_DE_ROUTE.md` ;
3. ~~discussion pour trier les idées~~ : faite le 18/11/2026. Ordre validé par Franck : liste des
   outils et notice (faits, 4.41.0), finitions du grimoire (faites, 4.42.0), dégâts en plus sur
   les armes et étude du mode Odyssée désactivable (faits, 4.43.0), mode Odyssée (fait, 4.44.0,
   publié), étude du multiclassage (faite). Reste le multiclassage à construire, après
   les réponses de Franck. Détail et décisions en attente au point 3 de
   `docs/FEUILLE_DE_ROUTE.md`.

## Sessions

### 25/11/2026 (soir) — Onglet Combat : petits − / + des PV, Inspiration héroïque en colonne, Épuisement centré (4.49.0, pas publiée)

- Remarques de Franck (captures) : − / + au titre partout comme les Points de Foi, Épuisement mal
  centré, titre de la renommée à l'étroit, rangée du haut trop haute en mode Odyssée (bouclier
  allongé, Bonus de maîtrise décentré). Maquettes faites dans une session annexe (planches dans
  le dossier de notes partagé, pages de maquettes supprimées).
- Choix de Franck : « A · 4 colonnes » (l'Inspiration a sa colonne ; rangée de 220 à 120 px à
  1366 px) et Épuisement « option 1 » (en ligne, 0 centré : les flèches du navigateur retirées).
  Puis « fais le » pour les PV des compagnons, les Nouveautés, la version et ces notes.
- Colonne des Points de Foi plus large (102 px souris, 114 px doigt) : ses petits boutons ne
  touchent plus les traits pointillés (marges mesurées de 768 à 1920 px).
- Vérifié à 768, 820, 1101, 1366 et 1920 px, clair et sombre, Odyssée oui et non, 0 erreur
  console ; impression seulement simulée à l'écran (le PDF d'Edge sans fenêtre bloquait).

### 25/11/2026 — Mode d'emploi relu en entier, relecture à chaque version (4.48.1, publiée le 25/11/2026)

- Question de Franck : le mode d'emploi est-il mis à jour à chaque version ? Oui, mais rien ne
  forçait à relire une rubrique devenue fausse. Demande : le relire en entier et que ce soit
  systématique, sans le compliquer ni rien y laisser de faux.
- Workflow : quatre relecteurs Opus 5.5 (un par groupe de rubriques) ont vérifié chaque phrase
  dans le code, puis un contre-vérificateur par groupe a revérifié chaque réécriture. 86 entrées :
  54 justes, 32 réécrites (une dizaine fausses, 13 trop compliquées). Trois entrées ajoutées.
- Systématique : champ `files` sur chaque entrée, `npm run notice` (liste de relecture avant
  publication), test qui exige que tout fichier de `js/ui/` soit cité ou déclaré interne, règle
  dans CLAUDE.md. Essayée sur la 4.48.0 : elle aurait listé 23 entrées, dont celle des armures.
- Rappel : le français, toujours, dans les messages à Franck (noté en mémoire le 23/11).

### 23/11/2026 (nuit) — Suites du grimoire, armures « Autres », outils des dons, étude des explications (4.48.0, publiée le 25/11/2026)

- Demande de Franck : lancer trois chantiers (grimoire, armures « Autres », outils) et une étude
  (explications bouton par bouton, proposition seulement) ; mode Odyssée et bilan d'Iria laissés
  de côté. Fait par un workflow : un agent Fable 5.2 par chantier dans sa copie Git, deux
  relecteurs Opus 5.5 chacun (code et sauvegarde ; règles, noms et tablette), un correcteur ; 25
  remarques, aucune grave, toutes corrigées ou soumises à Franck.
- Aucune nouvelle clé de premier niveau : les cases vont dans `subclass_uses`, les sorts choisis
  dans `subclass_choices` (groupe `wizard`, champs `discovery1/2` du Collège du Savoir). Une fiche
  qui ne s'en sert pas reste identique (testé).
- Le guide du joueur de l'Odyssée n'introduit aucun outil : pas de groupe Odyssée.
- Au passage : la table « Façonnage rapide » du don Façonneur s'affichait collée (les tableaux
  sont filtrés) ; elle est réécrite en lignes.
- Fusion dans `v4`, 2 049 tests ; vérifié à l'écran à 820 px (clair et sombre) sur des fiches de
  test : Paladin 5, Magicien 20, Barde du Savoir 6, Occultiste 17, outils d'un Artisan ;
  0 erreur console.
- Publiée le 25/11/2026 sur le « Publie » de Franck (`v4` et `master` = même commit), version en
  ligne vérifiée.

### 23/11/2026 (soir) — Noms du manuel : dons, espèces, aptitudes et outils (4.47.1, publiée le 23/11/2026)

- Demande de Franck : vérifier sur les photos les noms français des dons, espèces, aptitudes et
  outils. Six agents en parallèle (lecture seule) ont lu toutes les photos utiles (dons, espèces,
  outils, historiques, douze classes et leurs sous-classes) ; Claude a revu chaque écart sur la
  photo avant de corriger.
- Résultat : espèces, outils, historiques, noms et niveaux des aptitudes, colonnes des tables :
  conformes. Une quinzaine de libellés corrigés (Chouette, Coup de bélier, Frappe de la Bête, bête
  primitive, Perception de l'invisible, Déplacement sinueux, Compréhension supérieure, Soigneur de
  bataille, Faveur de Résistance aux énergies, « Dons : Origines », « aptitude » dans les
  prérequis, points de Sorcellerie…). Clés enregistrées inchangées.
- « Médecin de combat » avait été choisi le 04/11, avant les photos ; le livre dit « Soigneur de
  bataille » : le test qui imposait l'ancien nom est inversé.
- Vérifié à l'écran sur une fiche de test du navigateur intégré, 0 erreur console ; 1 844 tests.
- 7 petites questions posées à Franck ; il a répondu à trois dans des conversations annexes et à
  toutes les autres par « C'est ok pour moi ». Faits : plus de prérequis pour les dons d'origines,
  « Sorts de Vagabond féerique (Présents de Féerie) », « Sorts mécaniques (Manifestations de
  l'ordre) ». Le reste gardé tel quel.
- Pour mémoire : le script de remplacement maison coupait au premier « => » (deux tests cassés,
  remis depuis le commit puis refaits à la main).
- Publiée le 23/11/2026 sur le « Publie » de Franck (`v4` et `master` = même commit), version en
  ligne vérifiée.

### 23/11/2026 — Décisions sur la 4.46.0, puis 4.47.0 : pièce « Inspiration héroïque », petits − / +, listes des armes et des armures, confirmation des fenêtres d'arme et d'armure, noms du manuel (publiée le 23/11/2026)

- Franck a tranché toutes les décisions de la 4.46.0 (tablette essayée) ; il a demandé
  l'Inspiration héroïque pour tous en mode Odyssée et une confirmation avant de fermer la fenêtre
  de l'arme.
- Maquettes de la pièce refaites trois fois : ni oui / non ni case ronde ; « Disponible » /
  « Non disponible » validé (« Ok pour moi »). Boutons autour du titre : sa proposition 1.
- Retour de Franck : le trait pointillé mordait sur les petits boutons ; écart de 5 à 7 px depuis.
- Relecture par deux agents (code, affichage) : forme « 0/3 » perdue, Échap répété qui fermait la
  fenêtre de l'arme, case en texte libre qui disparaissait pendant la frappe, « Non disponible »
  gris à l'impression : corrigés et testés (1 809 tests).
- Franck a vu « Bâton » au lieu de « Bâton de combat » : corrigé, avec 9 noms de sorts de la liste
  du Magicien (« Main du mage », « Terreur »…). Anciens noms toujours reconnus, fiches non
  réécrites.
- Franck a demandé ensuite, en une fois (ultracode permis) : la comparaison la plus complète
  possible des listes de sorts des autres classes, et une liste des armures comme celle des armes
  (manuel seul pour l'instant, saisie libre toujours possible). Les huit listes de classe ont été
  lues deux fois chacune par des agents, sans désaccord à arbitrer sauf deux lignes ; la base n'avait
  plus que 2 noms faux (« Hérissement de projectiles », « Marche sur l'onde ») et une école fausse
  (Otiluke : Abjuration). Deux écoles où le manuel se contredit lui-même : question à Franck.
  Table des armures vérifiée sur la photo p. 219 : rien à corriger.
- Franck a validé toutes les décisions de la 4.47.0 (« Ok pour tout ») : d'où la même
  confirmation pour les réglages de l'armure. Écoles : Évocation pour les deux sorts, avec ses
  raisons (Sphère de feu : errata officiel d'octobre 2026 ; Aura du croisé : la description du sort
  prime sur la liste du Paladin, sans errata).
- Tout publié en une fois, sur le « Publie » de Franck : 4.47.0 en ligne le 23/11/2026.

### 22/11/2026 — Audit de santé, puis lots A à F : petites corrections, Inspiration héroïque en mode Odyssée, ménage, découpage du grimoire et des armes, « Dépenser » (4.46.0, publiée le 23/11/2026)

- Audit `/audit-fiche` de la 4.45.0 : fiche en bonne santé, aucun défaut grave ; un point de
  sécurité sur le PC (serveur de travail ouvert au Wi-Fi), de petites corrections, du ménage.
- Décision de Franck : les textes des sorts et des dons repris d'AideDD restent tels quels dans
  le dépôt public, il l'assume (lot E clos). Les points de Foi ne remplacent pas l'Inspiration
  héroïque : bouton à part en mode Odyssée (lot B).
- Lots faits sur `v4`, puis une relecture adverse et un correcteur : halo de Rage éteint en
  armure lourde, alignement du groupe Bonus de maîtrise / Points de Foi / Vitesse, « + » qui ne
  baisse plus « 4/3 », contrôles de `npm run check` renforcés, case vide gardée avec son titre à
  l'impression. 1786 tests verts, vérifications à l'écran de 768 à 1280 px, clair et sombre,
  0 erreur console.
- Laissé à Franck : colonne Dégâts et noms d'armes magiques coupés sur tablette (élargir ou
  accepter le trait d'union) et les autres questions du point 1 de la feuille de route.
- 4.46.0 publiée le 23/11/2026 sur le « Publie » de Franck (v4 et master = même commit).

### 22/11/2026 — 4.44.0 et 4.45.0 publiées : « Points de Foi », faveurs, dieux de Thyléa, Inspiration héroïque

- 4.44.0 publiée après le « Publie » de Franck, version en ligne vérifiée. Franck l'a regardée
  sur sa tablette : la case fonctionne ; mode coché, le libellé devait être « Points de Foi » seul.
- Règles relues : guide du MJ de l'Odyssée p. 92 (à chaque niveau, points de Foi remis à 0 puis
  bonus de maîtrise + Sagesse) ; manuel 2024 (Inspiration héroïque : une seule à la fois).
- Choix de Franck : pastille du nombre par niveau et remise par « Passer au niveau » (« N/N ») ;
  Inspiration limitée à 1 mode coupé ; au moins 1 point de Foi par niveau.
- Fait en 4.45.0 : tests verts, essai à l'écran à 820 px clair et 768 px sombre (21 contrôles sur
  21, 0 erreur console).
- Demande de Franck avant de publier : une fenêtre des usages des points de Foi. Règle relue sur
  la page « Sacrifices et prières » (Ressources/Manuels) : faveurs mineure (1), majeure (3),
  grande (5), par prière ou sacrifice. Faite en 4.45.0 (toucher la pastille), résumée avec nos
  mots ; 27 contrôles sur 27 à 820 px clair et 768 px sombre, 0 erreur.
- Puis, à sa demande, le bouton « Les dieux de Thyléa » : domaines et alignements du guide du
  joueur (p. 9-10), faveurs de chaque dieu d'après la fiche de la table (photo envoyée par
  Franck). Narsus est sur cette fiche mais pas dans le guide du joueur : la fenêtre le dit.
  32 contrôles sur 32 à 820 px clair et 768 px sombre, 0 erreur.
- 4.45.0 publiée le 22/11/2026 après le « Publie » de Franck, version en ligne vérifiée.

### 21/11/2026 — Tablette, « XP » (4.43.1), mode Odyssée désactivable (4.44.0), étude du multiclassage

- Franck a fait toutes les vérifications en attente sur sa tablette Android (Lenovo P12) et son
  PC : tout est bon. Il n'a pas d'iPad (celui du groupe est à Patricia) : les points iPad restent.
- Les « points de Foi » viennent de l'Odyssée : règle « Sacrifices et prières » du guide du MJ,
  page déjà rangée dans `..\Ressources\Manuels\`. Question 5 de l'étude réglée sans photo.
- Demande de Franck : « XP » au lieu de « PX » partout dans ce qui s'affiche, et le palier du
  niveau suivant entre parenthèses sous la case. Fait en 4.43.1 : 1580 tests, essai à 768, 820,
  1024 et 1366 px (clair et sombre), 0 erreur console. Clés de sauvegarde inchangées.
- Publié le 21/11/2026 après le « Publie » de Franck (`v4` puis `master`), version en ligne
  vérifiée.
- Réponses de Franck aux questions du mode Odyssée : tout comme conseillé, sauf la case, qu'il
  veut dans le menu « Gestion » plutôt que dans l'encadré (noté dans l'étude, section 6).
- Mode Odyssée construit en 4.44.0 (Fable 5.2, une réalisation, deux relectures, une correction) :
  clé facultative `odyssey_mode` = "off" écrite seulement quand on touche la case, retirée quand
  on recoche (fiche strictement identique). Revérifié par Claude : `npm run check` vert, 35
  contrôles sur 35 à 820 px clair et 768 px sombre, 0 erreur console. Publié le 22/11/2026
  après le « Publie » de Franck, version en ligne vérifiée.
- Étude du multiclassage faite puis contre-vérifiée : option « cases actuelles + une clé
  facultative pour les classes en plus », 5 lots en 3 versions. 14 questions et des photos du
  chapitre 2 du manuel français à demander à Franck.

### 19/11/2026 — Dégâts en plus sur les armes (4.43.0) et étude du mode Odyssée

- Deux chantiers menés en parallèle en ultracode (accord de Franck) : les dégâts en plus (un
  réalisateur, deux relecteurs, un correcteur) et l'étude du mode Odyssée (une étude, une
  contre-vérification). Puis vérification par l'orchestrateur : 1579 tests, relecture des règles
  de sauvegarde et de repos, essai au doigt simulé à 820 et 768 px sur une fiche de test (ajout
  par la roue dentée, pastille, détail, rechargement, repos long, saisie fausse, retrait : le
  réglage redevient exactement celui d'avant), 0 erreur console.
- Choix de fond : tout est rangé dans `weaponConfig` de la ligne d'arme (propriété facultative
  `extraDamage`, état allumé compris), aucune nouvelle clé. L'état allumé suit ainsi l'arme
  (suppression, filtre) et l'ancien site le recopie sans le lire.
- Défauts trouvés par les relecteurs et corrigés : message d'erreur hors de l'écran dans la
  fenêtre ; texte « complet » coupé dans la barre du haut (remplacé par un détail sous l'arme) ;
  lignes d'armes trop hautes (un dégât en plus = une ligne) ; clavier ouvert après la corbeille.
- Étude Odyssée rangée dans `docs/etudes/MODE_ODYSSEE.md` : réglage par fiche conseillé, actif
  par défaut ; 7 questions pour Franck dans la feuille de route.
- Franck a demandé de garder en mémoire toutes les vérifications sur tablette : section « À
  vérifier par Franck » ci-dessus, à lui ressortir quand il aura le temps.
- Publié le 19/11/2026 après le « Publie » de Franck (`v4` puis `master`), version en ligne
  vérifiée.

### 18/11/2026 — Finitions du grimoire (4.42.0)

- Quatre finitions faites en ultracode (un réalisateur, deux relecteurs, un correcteur), puis
  vérifiées par l'orchestrateur sur des fiches de test (toucher simulé, 0 erreur console,
  1531 tests) : mention « Pas d'emplacement », « Lancer gratuit » dans « Lancer », bouton
  « Retirer les sorts non préparés », « Rituels du livre » repliés en vue « Au combat ».
- Aucune nouvelle clé dans la fiche ; une préférence d'appareil (`dd2024_spell_book_rituals_open`).
- Défauts trouvés par les relecteurs et corrigés : le retrait emportait une ligne réécrite hors de
  la colonne Note (elle va maintenant dans « Gardés ») ; mentions trop petites au doigt (44 px) ;
  « Lancer » sur un sort d'Arcanum mystique disait « Aucun emplacement » (il explique l'Arcanum).
- Laissé de côté : lancers gratuits sans case (Châtiment divin, Appel de destrier, Arcanum
  mystique…), cas du multiclassage au retrait, Magicien 18/20. Voir la feuille de route.
- Publiée le 18/11/2026 avec l'accord de Franck. Franck veut à terme faire évoluer la fiche vers
  le multiclassage : noté comme chantier à venir dans la feuille de route.

### 18/11/2026 — Liste des outils, mode d'emploi, nouveautés, personnages d'exemple (4.41.0)

- Tri des idées avec Franck : ordre validé (voir la feuille de route) ; « Mon tour », création
  guidée, vue du groupe, journal de campagne et outil du MJ gardés pour plus tard.
- Deux lots en ultracode (chacun réalisé, relu par deux vérificateurs, corrigé) : fenêtre
  « Outils maîtrisés » (37 outils du manuel, rien de nouveau dans la sauvegarde) ; « Mode
  d'emploi » en 12 rubriques, imprimable ; fenêtre « Nouveautés » ; Guerrier 3 et Magicienne 5
  d'exemple.
- Sécurité de l'exemple : il passe par le même chemin que « Nouvelle fiche », n'est jamais envoyé
  au compte tout seul, même après un retour par « Revenir à… » (défaut trouvé par un relecteur,
  corrigé et testé). Relu aussi par Claude, puis essayé au doigt sur une fiche de test.
- Choix faits sans Franck, à lui confirmer : « Nouveautés » montrée une fois aux joueurs déjà
  venus ; les états d'un exemple ne chassent jamais de « Revenir à… » le dernier état d'une
  autre fiche.
- Laissé de côté : anciens noms « Main de mage », « Armure de mage », « Bâton » (demandent une
  conversion des fiches) ; rien n'a été essayé sur une vraie tablette.

### 18/11/2026 — Grimoire adapté à la classe (4.40.0)

- GitHub a confirmé la purge (ticket 4978665) ; vérifié : 404 partout. Dossier clos.
- Règles de préparation des 8 classes de lanceurs vérifiées dans le manuel, puis 3 lots (ultracode,
  chacun relu par deux vérificateurs et corrigé) : liste fixe du Barde / Ensorceleur / Occultiste,
  vue « Au combat » et « Lancer » ; fenêtre « Préparer mes sorts » (Clerc, Druide, Paladin,
  Rôdeur) ; repères du Magicien (livre, coût de copie, rituels). Passe de finitions : une phrase
  d'explication lisible sur tablette pour chaque nouvelle option (idée de Franck).
- Après essai d'une fiche de Magicien 5 (« Magotest », dans le navigateur interne) : liste des
  sorts au toucher de la case du nom, filtrée par niveau, choix « — » et bouton ✕ sur la ligne
  de saisie (demandes de Franck, ajoutées à la 4.40.0).
- Aucune nouvelle clé de sauvegarde. Suites possibles notées au point 3 de la feuille de route.
- Idées de Franck notées : mode Odyssée désactivable, explications des options, outil pour le MJ
  (à discuter d'abord, y compris s'il va dans ce projet).

### 11/11/2026 (soir) — Maîtrises d'armes, espèces de l'Odyssée, dragonnets (4.39.0)

- Case « Maîtrises d'armes » réaffichée (décision de Franck : utile pour noter une maîtrise
  exceptionnelle ; le calcul passe par le réglage « Arme maîtrisée : Oui » de l'arme). Dans les
  vieilles fiches de Korgul, ce champ contient une liste d'armes portées : à Franck de le revoir.
- Espèces de l'Odyssée lues dans le guide (six lecteurs en parallèle) et ajoutées ; les anciens
  traits venaient d'autres livres (Theros…).
- Dragonnets vérifiés sur AideDD et le SRD 5.2 (sources identiques) : CA, sauvegardes, souffles.
- Restes des sous-classes faits. Décisions en attente : point 2 de la feuille de route.
- Textes des sorts d'AideDD : expliqué à Franck (site public ≠ texte libre ; seul le SRD l'est) ;
  aucune décision, rien changé.

### 11/11/2026 — Audit de santé et corrections (4.38.0)

- Audit `/audit-fiche` (7 angles, ultracode) : calculs, sauvegardes et sécurité en ordre.
  Défauts confirmés : « null » sous l'historique, saisie lente, anciens commits encore visibles
  sur GitHub (Franck a écrit au support : lot B, en attente).
- Corrigés : lot A (null, vitesse), lot E (fausse question « Deux versions », en-tête sur trois
  lignes partout, hauteur des fenêtres sur iPad), lot C (noms et pages du livre français), lot D
  (découpage des gros fichiers, doublons, DOMPurify 3.4.17). Chaque lot relu par deux vérificateurs.
- Laissé de côté, à décider : police des petits champs sur iPad ; retour à l'ancien site qui
  efface une classe ou un don qu'il ne connaît pas (aucune parade sans toucher à la v3) ; ancien
  champ « Armes » non affiché ; textes des sorts repris d'AideDD ; réunir les lectures de
  sous-classe et les deux mécanismes de repli (changeraient la fiche).
- Ordre des chantiers revu par Franck : audit, puis restes, puis tri de toutes les idées.

### 11/11/2026 — Journal de bord et rangement des dossiers

- `E:\2 - CODE` réorganisé avec un dossier par projet, chacun avec `Code\` (le dépôt),
  `Ressources\` (manuels, photos du manuel FR, idées des joueurs, fonds d'écran, sauvegardes) et
  `Archives\` (anciennes versions, dépôt d'avant le nettoyage). Description dans
  `E:\2 - CODE\LISEZ-MOI.md`. Les documents du dépôt renvoient à `..\Ressources\` en chemins relatifs.
- Copie de sécurité complète avant le rangement : `E:\2 - CODE - Copie 11-11-26` (Franck la
  supprimera lui-même dans quelques semaines).

- L'ancienne note de passage `docs/PROCHAINE_SESSION.md` devient ce journal, au nom fixe (choix de
  Franck) : le sujet de chaque session est dans le titre de son entrée, pas dans le nom du fichier.
- `docs/ROADMAP.md` allégée et renommée `docs/FEUILLE_DE_ROUTE.md` (choix de Franck) : il n'y
  reste que ce qui est à faire et les décisions qui valent pour la suite ; l'historique des étapes
  est résumé ici.
- Les deux études terminées (dons actifs, sous-classes) rangées dans `docs/etudes/`, avec la date
  et l'état en tête ; le code y renvoie toujours.
- Entrées anciennes ajoutées ci-dessous (25/10 → 09/11), reconstituées d'après `docs/CHANGELOG.md`.

### 10/11/2026 (soir) — Espèces, historiques, rappels de classe et Concentration (4.35 → 4.37)

- Restes des classes (4.35.0) : vitesse du Moine et du Barbare, cases Fougue / Inflexible / Coup de
  chance, filtre « Magiques », pages françaises des Bottes d'arme.
- Encadré « Espèce & historique » (4.36.0). Décisions de Franck : l'historique est un rappel ; le
  bouton « Appliquer » coche les compétences et remplit le don de niveau 1 s'il est vide, jamais
  les caractéristiques. Les sorts d'espèce ne comptent pas dans les sorts préparés.
- Rappels des capacités de classe près des valeurs et Concentration (4.37.0). Les capacités à
  déclencher (réactions, relances) restent dans le texte des aptitudes.
- Relectures « ultracode » des trois lots : tous les défauts confirmés corrigés.
- Laissés de côté : poids porté (plus tard), dragonnets (photos du Manuel des monstres), espèces de
  l'Odyssée.

### 10/11/2026 — Sous-classes, file d'attente autonome, classes du Manuel français (4.28 → 4.34)

- Projet des sous-classes terminé (`docs/etudes/SOUS_CLASSES.md`), blocs repliables, noms du Manuel
  français ; publié en 4.28.1.
- File d'attente : sauvegardes de secours datées, suivi des états, assistant de montée de niveau
  (4.29 à 4.31), puis PX restants, boutons − / +, Bourse, aptitudes de base des 12 classes, sorts
  préparés permis, noms français (le Sorcier devient l'Occultiste) ; publié en 4.34.0.

### 09/11/2026 — Dons, règles de classe, sécurité, puis sous-classes (4.8 → 4.27)

- Suite des dons actifs (4.8 à 4.15) : dons restants, faveurs épiques, règles de classe.
- Protection des données, vitesse, ménage du code, sécurité (4.16 à 4.19).
- Étude des sous-classes (`docs/etudes/SOUS_CLASSES.md`) : 60 sous-classes relues (48 du Manuel,
  12 de l'Odyssée), erreurs relevées, découpage en 8 lots ; Franck a validé, les lots 0 à 7 sont
  faits dans la journée (4.20 à 4.27).

### 04/11 → 08/11/2026 — Dons actifs, Bottes d'arme, CA calculée (4.1 → 4.7)

- 04/11 : Franck valide la v4 en ligne. Étude des dons actifs (`docs/etudes/DONS_ACTIFS.md`) : ce que
  chaque don change sur la fiche (calcul, texte, choix, compteur, bouton) ; premiers lots (4.1).
- 05/11 → 08/11 : Bottes d'arme (4.2), Classe d'armure calculée (4.3), objets magiques et suite des
  dons (4.4 à 4.7).

### 25/10 → 27/10/2026 — Reconstruction de la fiche (v4, jusqu'à 4.0.0)

- La v3 (cassée puis réparée a minima) est reconstruite : règles en fonctions pures testées, une
  seule source de vérité, même format de sauvegarde que la v3 (base Supabase partagée).
- Étapes 0 à 5, passe esthétique (polices Cinzel et Alegreya, thèmes clair et sombre), puis bascule :
  la 4.0.0 remplace la v3 en ligne le 27/10 (la v3 reste sous l'étiquette `v3-final`).
