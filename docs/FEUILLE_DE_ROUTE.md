# Feuille de route

Ce qui reste à faire, les idées en attente et les décisions qui valent pour la suite. Ce qui est
fait n'y reste pas : le fil des sessions est dans `docs/JOURNAL_DE_BORD.md`, le détail des
changements dans `docs/CHANGELOG.md`. Rien ne se lance sans l'accord de Franck.

## À faire

Ordre décidé par Franck le 11/11/2026 : d'abord l'audit et les découpages, puis les restes et
points relevés, puis une discussion pour trier toutes les idées.

### 1. ~~Audit de santé, puis découpage~~ : fait (4.38.0, 11/11/2026)

Audit `/audit-fiche` et corrections (lots A, C, D, E) ; découpage de `css/sheet.css`,
`js/rules/feat-effects.js` et `js/ui/spells.js` au lot D (voir `docs/ARCHITECTURE.md`). Le
prochain audit se fera à la demande de Franck.

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
  français des actions à vérifier dans le livre ; sorts de la Magie des Amazones pas dans le grimoire.

### 3. Idées : ordre validé par Franck le 18/11/2026

Faits en 4.41.0 (18/11/2026) : ~~liste des outils~~, ~~notice « Mode d'emploi », fenêtre
« Nouveautés », personnages d'exemple~~. Faites en 4.42.0 (18/11/2026, **pas encore publiée** :
attend le « Publie » de Franck) : ~~finitions du grimoire~~. Restent, dans l'ordre :

1. **Dégâts en plus sur les armes** : lignes dans le réglage ⚙ (dégâts + raison), « toujours » ou
   « à allumer » (pastille, comme la Rage).
2. **Mode Odyssée désactivable** : un des prochains chantiers, courte étude d'abord.

**À chaque version, désormais** : ajouter l'entrée de la version en tête de `js/data/whats-new.js`
(sinon `npm run check` échoue) et mettre à jour la notice `js/data/help.js`.

Décisions de Franck en attente sur la 4.41.0 :
- « Appliquer à la fiche » (historique) pourrait écrire aussi l'outil quand l'historique donne un
  outil précis (Sage, Criminel…) ; aujourd'hui il ne le fait pas.
- Fenêtre des outils : l'outil précis de l'historique apparaît deux fois (encadré du haut et sa
  catégorie) ; le garder seulement en haut ?
- Personnage d'exemple : jamais envoyé au compte tout seul (« Enregistrer en ligne » pour le
  garder) ; choix prudent, à confirmer.
- Fenêtre « Nouveautés » : montrée une fois aux joueurs qui avaient déjà une fiche sur l'appareil,
  jamais à une toute première visite.

Décisions de Franck en attente sur la 4.42.0 :
- Lancers gratuits sans case dans la fiche, donc pas proposés par « Lancer » : Châtiment divin
  (Châtiment de paladin), Appel de destrier (Fidèle destrier), Arcanum mystique, Contact avec les
  plans (Communication avec le protecteur). Les suivre demanderait une nouvelle clé facultative.
  Pour l'Arcanum, « Lancer » explique la règle mais ne retient pas qu'il a été utilisé.
- Cases de sous-classe partagées entre plusieurs sorts (Ancêtre divin, Créatures
  fantasmagoriques, Ressourcement, Mante de majesté, Troisième œil) : pas reliées à « Lancer ».
- « Retirer les sorts non préparés » : si l'état d'avant ne peut pas être gardé (stockage plein),
  rien n'est retiré ; un sort d'un niveau sans emplacement reste (noté pour plus tard) ; une
  vieille ligne écrite dans un autre format que la base va dans « Gardés ». Choix prudents, à
  confirmer.
- Personnage multiclassé (Clerc / Magicien noté « Clerc ») : un sort présent sur les deux listes
  est proposé au retrait ; ne rien proposer dès que des emplacements ont été ajoutés à la main ?

Petits restes de la 4.42.0 (pas urgents) : sous-classe écrite autrement (« Vie » pour « Domaine
de la Vie ») : ses sorts de domaine non cochés sont proposés au retrait ; Rôdeur : « Lancer
gratuit » seulement si Marque du chasseur est notée au tableau ; phrase pâle sur un bouton
« Lancer gratuit » épuisé (comme les boutons « reste 0 ») ; teintes proches en thème sombre entre
« Pas d'emplacement » et « Lançable en rituel » ; plan de retrait recalculé à chaque rendu du
grimoire (à mesurer sur tablette) ; pas de test automatique du cas « état non gardé ».

Petits restes de la 4.41.0 (pas urgents) : anciens noms « Main de mage », « Armure de mage » (don
Initié à la magie) et arme « Bâton » à renommer d'après le manuel 2024, avec conversion testée des
fiches (chantier à part) ; outils propres à l'Odyssée absents de la liste ; dons qui donnent des
outils (Façonneur…) pas reliés à la fenêtre ; champ « Chercher… » de 38 px de haut (partagé avec
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
- Armes : dans le réglage ⚙ d'une arme, pouvoir ajouter des dégâts supplémentaires avec leur
  raison (ex. « +2d6 contre les dragons » d'une arme tueuse, « +1d6 radiants contre les
  morts-vivants »), affichés à côté des dégâts comme le fait déjà Fureur divine en Rage
  (demande de Franck, 11/11/2026).
- Grimoire, suites possibles (à décider par Franck) : Paladin et Rôdeur traités comme Clerc et
  Druide (fenêtre et rappel de repos long) ou non ; cases de suivi pour les lancers gratuits qui
  n'en ont pas (voir les décisions en attente sur la 4.42.0) ; Magicien : repères pour Maîtrise
  des sorts (18) et Sorts de prédilection (20), qui demanderaient une nouvelle clé (trop tôt selon
  Franck), rappel de Mémorisation de sort au repos court, Aptitude érudite au niveau 3 (2 ou
  3 sorts) ; Barde du Savoir : enregistrer ses deux Découvertes magiques.
- Grimoire : comme les objets magiques, un aspect qui monte en puissance avec le niveau du sort.
- Mode « Odyssée des Seigneurs Dragons » désactivable (demande de Franck, 18/11/2026) : retirer
  ce qui est propre à cette campagne (espèces, sous-classes Seigneur Dragon / Amazone /
  Odysséen, style Hoplite, dragonnets, fonds d'écran…) pour jouer une autre campagne. À étudier :
  inventaire des différences, réglage par fiche ou par appareil, compatibilité des sauvegardes.
- Explications des options (demande de Franck, 18/11/2026) : chaque bouton ou option dit en une
  phrase à quoi il sert, lisible aussi sur tablette (fait pour le grimoire en 4.40.0 et pour les
  nouveautés de la 4.41.0 ; le « Mode d'emploi » explique le reste, onglet par onglet ; une revue
  bouton par bouton de toute la fiche reste possible).
- Outil pour le MJ (« feuille du MJ », demande de Franck, 18/11/2026) : à discuter d'abord.
  Est-ce une bonne idée, et pour quoi faire ? Dans ce projet (même site, même base, lien avec la
  « Vue du groupe ») ou dans un projet séparé (`E:\2 - CODE\<nouveau projet>\`) ? Rien à
  construire avant cette discussion.
- Bilan des capacités pour les autres joueurs (Iria, personnage de Catherine), comme pour Korgul.
- Vue du groupe (demande « synergies entre joueurs ») : PV, CA et perception passive de chaque
  personnage ; gros chantier, il faut décider qui voit quoi.
- Journal de campagne : notes datées par séance, suivi propre à l'Odyssée (serments, quêtes).
- Poids porté : total du matériel comparé à la capacité de charge (gardé en tête, pas utile pour
  le moment).
- Vérification des noms français, classe par classe, d'après les photos du manuel.
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

### Interface

- Polices : Cinzel pour titres et libellés, **Alegreya** pour les textes longs (choix de Franck).
- Tablette : propriétés et notes longues des armes abrégées avec « … » (texte complet au toucher).
- Impression : relevé du personnage (dons non choisis masqués) ; lignes de sorts vides imprimées et
  valeurs très longues coupées dans les cellules : acceptés tels quels.
- Restauration ensorcelée : case dans la fenêtre de repos court. Restauration arcanique et
  Récupération naturelle : rappel, emplacements à décocher soi-même.
- Filtres des armes : pastilles sur une ligne (pas de menu déroulant, ils tiennent à 820 px).
- Magie sauvage : bloc laissé déplié (une ligne, rappels utiles au moment d'agir).
