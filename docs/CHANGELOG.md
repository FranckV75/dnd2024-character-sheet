# Changelog — Feuille de Personnage D&D 2024

Toutes les modifications notables du projet sont documentées dans ce fichier. Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [4.37.0] - 2026-11-10 (Rappels des capacités, Concentration)
### Added
- Rappels des capacités de classe et de sous-classe près des valeurs concernées, comme ceux des
  dons : « Avantage (Sens du danger) » près de la sauvegarde de Dextérité, « Avantage (Instinct
  sauvage) » près de l'Initiative, Esquive totale, Savoir-faire (compétences maîtrisées), Aura de
  courage, Charmantes défenses, Résistance aux sorts… Ceux de la Rage s'allument avec le bouton
  Rage. Survivant discipliné et Esprit fuyant signalent les cases de maîtrise à cocher.
- Rôdeur niveau 6 (Arpenteur) : « dont +3 m » et « Escalade et nage = Vitesse » près de la Vitesse.
- Concentration : menu du sort en cours en tête de l'encadré « États » (sorts « C » du grimoire et
  sorts donnés qui la demandent), rappelé dans le titre de l'encadré même replié. Le pavé
  « Dégâts / Soins » donne le jet de Constitution chiffré (DD, bonus, Avantage du Mage de guerre)
  et met fin à la Concentration à 0 PV. Un état Neutralisé (ou qui l'entraîne) et la Rage du
  Barbare la signalent avec un bouton « Terminer » ; Chasseur implacable (Rôdeur 13) : aucun jet
  pour marque du chasseur. Clé de sauvegarde facultative `concentration`, ignorée par la v3.
### Fixed
- Nom des boutons de repli des encadrés : seul le titre, sans ce qu'un module y ajoute.

## [4.36.0] - 2026-11-10 (Espèces et historiques)
### Added
- Onglet Aptitudes & Traits : encadré « Espèce & historique ».
  - Espèce : les traits des 10 espèces du Manuel des joueurs (résumés), ceux des niveaux suivants
    sous « À venir ». Menu de l'option (lignage elfique ou gnome, ascendance draconique ou gigante,
    héritage fiélon) et de la caractéristique de ses sorts, verrouillés avec la fiche. Repères
    calculés : Vision dans le noir (36 m pour le Drow), Résistances, Souffle du Drakéide (dés selon
    le niveau, DD de Constitution). Les espèces de l'Odyssée renvoient au livre.
  - Historique : ce qu'il donne (caractéristiques, don d'origine, compétences, outil, équipement),
    avec un repère « À vérifier » pour ce qui manque sur la fiche. Bouton « Appliquer à la fiche »
    (fiche déverrouillée, après confirmation) : coche les deux compétences et choisit le don de
    niveau 1 s'il est vide. Les caractéristiques et les outils ne sont jamais modifiés.
- Onglet Magie : bloc « Sorts d'espèce » (Lumière de l'Aasimar, sorts des lignages et héritages),
  avec DD, attaque et cases de lancer gratuit ; ils ne comptent ni dans les sorts préparés ni dans
  les sorts mineurs.
- Onglet Combat : cases des traits d'espèce à usages limités (Souffle, Poussée d'adrénaline,
  Acharnement, Mains guérisseuses…) et des lancers gratuits de sorts d'espèce, vidées au repos.
- Repères près des valeurs : Résistances de l'espèce près de la CA, « dont +1,5 m » de l'Elfe
  sylvestre près de la Vitesse (valeur saisie jamais modifiée).
- Clé de sauvegarde facultative `species_choices` (option et caractéristique), ignorée par la v3.
### Changed
- Menus Espèce et Historique triés par ordre alphabétique français.

## [4.35.0] - 2026-11-10 (Restes des classes, filtre Magiques)
### Added
- Vitesse : repère « dont +4,5 m (sans armure ni bouclier) » pour le Déplacement sans armure du
  Moine (+3 m au niveau 2 jusqu'à +9 m au niveau 18) et « dont +3 m » pour le Déplacement rapide du
  Barbare (niveau 5). La Vitesse saisie n'est jamais modifiée.
- Cases à cocher dans l'onglet Combat : Fougue (Guerrier, 2 au niveau 17, repos court), Inflexible
  (Guerrier, 1 / 2 / 3 aux niveaux 9 / 13 / 17, repos long), Coup de chance (Roublard 20, repos
  court). Enregistrées dans la clé facultative `subclass_uses` existante (« fighter.fougue »).
- Armes : filtre « Magiques » (armes avec un bonus magique de +1 à +3).
### Changed
- Bottes d'arme : pages du Manuel des joueurs français pour la capacité de classe (Barbare p. 51,
  Guerrier p. 105, Paladin p. 147, Rôdeur p. 157, Roublard p. 167, Botte tactique p. 106) ; la
  fenêtre précise quelle édition cite chaque page.
- « Formes du cercle améliorées » (faute d'accord du livre corrigée).

## [4.34.0] - 2026-11-10 (Classes du Manuel français, PX et compteurs)
### Added
- Capacités de classe : les aptitudes de base des 12 classes (résumés, pas le texte du livre) en
  tête de l'encadré « Capacités de classe », repliables une à une ; celles des niveaux suivants
  grisées sous « À venir ». Au-dessus, les colonnes de la table de la classe au niveau du personnage
  (Rages 4, Dégâts de Rage +2…) avec le prochain changement (« 5 au niv. 12 »)
  (`js/data/class-progression.js`, `js/rules/class-progression.js`, `js/ui/class-progression.js`).
- Onglet Magie : « Préparés : 7 / 9 · Sorts mineurs : 3 / 4 » selon la table de la classe ; en
  rouge, avec un message, quand on a préparé plus que permis. Les sorts déjà donnés par la classe
  (Marque du chasseur, Châtiment divin…), la sous-classe ou un don ne comptent pas, même notés au
  grimoire. Des sorts mineurs en plus de la table ne sont qu'un rappel, pas une erreur (une espèce,
  un don ou une option de classe en donnent d'autres).
- Assistant « Passer au niveau N » : il nomme les nouvelles aptitudes de base et le nombre de sorts
  mineurs et de sorts préparés en plus (fin des renvois « voir le manuel »).
- Points d'expérience : « Encore X PX avant le niveau N » sous la case ; bouton « + PX » (pavé de
  chiffres) ; le « + » du niveau s'allume quand le seuil est atteint (`js/rules/experience.js`).
- Boutons − / + sur Épuisement (0 à 6), Inspiration héroïque, Points de renommée (Odyssée) et PV
  des compagnons ; bouton « Bourse : gagner / dépenser » sous les pièces (refuse de dépenser plus
  que ce qu'on a) (`js/rules/counters.js`, `js/ui/counters.js`). Une case qui contient du texte
  (« 2 (Chanceux) ») n'est jamais réécrite : un message invite à la corriger à la main.
- Numéro de version affiché en haut à droite, sous l'état de l'enregistrement.
### Changed
- Noms alignés sur le Manuel des joueurs français (photos de Franck) : le Sorcier devient
  l'Occultiste, 26 sous-classes changent de nom (Protecteur Fiélon, Voie du Zélateur, Credo de
  l'Ombre, Domaine de la Ruse, Cercle des Astres…), environ 160 aptitudes de sous-classe et les
  aptitudes de base (Points de Credo, Ennemi juré, Forme sauvage, Conduit divin, Second souffle,
  Témérité, Bottes d'arme, Botte tactique, Restauration magique, Combattant béni, Ordre primitif).
  Une fiche enregistrée avec un ancien nom (« Sorcier », « Patron Fiélon ») s'affiche avec le
  nouveau, sans être réécrite : l'ancien site lit toujours les mêmes fiches.
- Espèces, origines et états relus sur le manuel et son glossaire : taille Moyenne du Drakéide, du
  Nain, de l'Elfe et de l'Orc ; bonus de PV « Ténacité naine » ; textes des états (Charmé, Tests
  d20, Abri partiel / supérieur / total, En péril, points de Credo au lieu de « ki »).
- Sorts de sous-classe renommés selon le livre (Terreur, Présence royale de Yolane…) : un sort déjà
  noté au grimoire sous son ancien nom est toujours reconnu.
### Notes
- Le bouton « + PX » écrit les PX en nombre seul : une case « 4990/6500 » devient « 5090 » (le
  décompte sous la case remplace le « /6500 »).

## [4.33.0] - 2026-11-10 (Mises à jour fiables)
### Added
- Mises à jour installées d'elles-mêmes : à l'ouverture et à chaque retour sur la fiche (au plus
  une fois par minute), la version en ligne est comparée à celle de la page. Plus récente : la fiche
  est enregistrée, chaque fichier de l'application est redemandé au site (et non pris dans la
  mémoire du navigateur), puis la page se recharge et l'annonce (« Fiche mise à jour »). Une seule
  tentative par version : si elle ne suffit pas, un message demande de fermer puis rouvrir la fiche.
  Jamais pendant qu'une fenêtre est ouverte ; hors ligne, rien ne se passe (`js/ui/update.js`).
- `js/version.js` : version de la page, testée égale à celle de `package.json` (à changer ensemble).
### Notes
- Les tablettes encore en 4.32.0 ou avant reçoivent cette version comme avant (fermer puis rouvrir
  la fiche si besoin) ; les suivantes arriveront d'elles-mêmes.

## [4.32.0] - 2026-11-10 (Saisie des PV et du niveau)
### Added
- PV actuels et PV temporaires : un bouton − et un bouton + de chaque côté ; un appui long fait
  défiler, de plus en plus vite. Les PV actuels restent entre 0 et le maximum ; des PV actuels déjà
  au-dessus du maximum (saisis à la main) ne sont jamais baissés par +.
- Bouton « Dégâts / Soins » sous les PV actuels : un pavé de gros chiffres, puis Dégâts, Soins ou
  PV temp. (`js/rules/hit-points.js`). Les dégâts retirent d'abord les PV temporaires ; les soins
  s'arrêtent au maximum ; les PV temporaires ne se cumulent pas (on garde les plus élevés). Chaque
  résultat rappelle ce qui en découle : jet de Constitution de concentration (DD 10 ou moitié des
  dégâts), 0 PV (Inconscient coché dans États), mort instantanée, dégâts à 0 PV (échec au jet
  contre la mort) ; soigné à 0 PV : Inconscient décoché (À terre reste), jets contre la mort remis
  à zéro. La fenêtre reste ouverte pour enchaîner ; tout reste utilisable fiche verrouillée.
### Changed
- Niveau : une liste de 1 à 20 (la molette du système sur iPad) au lieu d'une case à taper ; la
  case occupe deux colonnes de l'en-tête au-delà de 900 px. Les anciennes sauvegardes dont le
  niveau contient un peu de mise en forme (« <font …>6</font> ») affichent leur niveau sans être
  réécrites.

## [4.31.0] - 2026-11-10 (Montée de niveau)
### Added
- Petit bouton « + » à droite du niveau (masqué fiche verrouillée et au niveau 20) : il ouvre
  « Passer au niveau N », qui liste ce qui change au niveau suivant d'après la fiche : dés de vie,
  bonus de maîtrise, don à choisir (ou déjà noté qui devient actif), ressources et dés de classe
  (Second Souffle, Rage, Attaque sournoise…), sous-classe à choisir ou nouvelles capacités de
  sous-classe et choix à faire, emplacements de sorts (Magie de pacte comprise), sorts de
  sous-classe toujours préparés (`js/rules/level-up.js`).
- Points de vie : valeur fixe du manuel (moitié du dé + 1) ou jet du joueur, plus la Constitution
  (au moins 1), plus les bonus que la fiche connaît (Robuste, Résilience draconique, Nain, Faveur
  de vigueur) ; option « Ajouter aussi ces PV aux PV actuels ». L'assistant écrit le niveau et les
  PV max ; des PV max avec du texte (« 80 (Robuste) ») ne sont jamais réécrits.
- Une sauvegarde de secours est prise avant (« Revenir à… »). Si la fiche change pendant que la
  fenêtre est ouverte (autre onglet, compte), rien n'est appliqué : il faut la rouvrir.
### Notes
- Pas encore listés (le manuel fait foi) : capacités de base des classes par niveau, nombre de sorts
  préparés et de sorts mineurs ; classe non reconnue (multiclasse) : seuls le niveau et les PV.

## [4.30.0] - 2026-11-10 (Suivi des états)
### Added
- Encadré repliable « États » dans l'onglet Combat, sous les PV : une pastille par état du Manuel
  des joueurs 2024 (noms français du manuel : À terre, Agrippé, Assourdi, Aveuglé, Charmé,
  Effrayé, Empoisonné, Entravé, Épuisement, Étourdi, Inconscient, Invisible, Neutralisé, Paralysé,
  Pétrifié). Toucher une pastille coche l'état et affiche le rappel de ses effets, avec les états
  qu'il entraîne (Inconscient → Neutralisé et À terre, en pointillés) ; décocher Inconscient laisse
  À terre. Les états restent cochables fiche verrouillée ; « Tout retirer » les décoche tous.
- L'Épuisement reste réglé par niveau dans l'encadré Repos : sa pastille y mène et affiche le
  niveau, et son rappel donne les chiffres du niveau atteint.
- Nouvelle clé facultative `conditions` (liste des états cochés), enregistrée et synchronisée,
  ignorée par l'ancien site ; absente des anciennes fiches (`js/rules/conditions.js`,
  `js/data/conditions.js`). Effets : résumé du glossaire des règles (le manuel fait foi).
- Impression : l'encadré n'est imprimé que si un état est en cours.

## [4.29.0] - 2026-11-10 (Sauvegardes de secours)
### Added
- Sauvegardes de secours datées, sur l'appareil seulement (clé du navigateur `dd2024_char_snapshots`,
  jamais dans la sauvegarde ni en ligne) : les 10 derniers états de la fiche, pris à l'ouverture,
  avant un repos long et avant tout remplacement (import, nouvelle fiche, chargement depuis le
  compte, retour à un état). Un état déjà dans la liste n'est pas ajouté une seconde fois ; une
  fiche vierge n'est jamais gardée (`js/state/snapshots.js`).
- Bouton « Revenir à… » dans la barre Gestion (masqué fiche verrouillée) : date et heure, nom,
  niveau, classe et moment de chaque état ; revenir à un état garde d'abord la fiche actuelle.
  Fiche liée à un compte : le retour au même personnage est envoyé comme une modification
  ordinaire (question « Deux versions différentes » si la version en ligne a changé entre-temps).
### Changed
- Stockage de l'appareil plein : la fiche passe avant les sauvegardes de secours, qui ne cèdent leur
  place que si cela permet de l'enregistrer (les plus récentes sont remises) ; le joueur est prévenu,
  comme lorsqu'une sauvegarde de secours n'a pas pu être prise avant un remplacement.

## [4.28.1] - 2026-11-10 (Noms des manœuvres)
### Fixed
- Maître de guerre : noms français des 20 manœuvres repris du Manuel des joueurs 2024 (Regain,
  Balayage, Bélier, Instruction, Chassé-croisé…), dans l'ordre alphabétique du manuel ; « Connais
  ton ennemi » devient « Observation de l'ennemi ». Les manœuvres déjà cochées restent cochées
  (clés inchangées).
- Noms des actions du Manuel des joueurs 2024 français partout : Pointe (*Dash*, au lieu de
  « Foncer » : Expert de la charge, Mobile, Fente, Rage sauvage), Furtivité (*Hide*, au lieu de
  « Se cacher » : Discret, Voleur), Attaque, Désengagement, Esquive, Soutien (*Help*) et Utilisation
  (Maître des bêtes, serments du Paladin, Jeu de jambes défensif).

## [4.28.0] - 2026-11-10 (Blocs repliables)
### Added
- Blocs repliables, comme les dons : bloc « Sous-classe » entier et chacune de ses capacités (la
  pastille « Niv. X »), cartes de compagnon, sorts de sous-classe et sorts de dons, et les encadrés
  Capacités de classe, Compagnons & familiers, Armures, Traits de personnage, Odyssée des Seigneurs
  Dragons, Apparence, Histoire & personnalité (pastille au bout du titre, attribut `data-fold-box`
  dans index.html) ; Armes (le titre et les bonus de combat restent). Pastilles agrandies (32 × 22 px à la souris). Une pastille à chevron ne garde
  que le titre ; le choix est retenu sur l'appareil (`dd2024_blocks_folded`, jamais dans la
  sauvegarde) et tout s'imprime (`js/ui/fold.js`).

## [4.27.0] - 2026-11-09 (Sous-classes, lot 7 : choix, compagnons, formes)
### Added
- Choix de sous-classe mémorisés (nouvelle clé facultative `subclass_choices`, ignorée par l'ancien
  site) : menus sous la capacité dans le bloc « Sous-classe ». Les choix de jeu (option de la Rage,
  aspect, proie du chasseur…) restent modifiables fiche verrouillée.
- Voie du Cœur sauvage (Ours, Panthère, Saumon, Faucon), Chasseur (Tueur de colosses ou Briseur de
  hordes, Tactiques défensives), Cercle de la Terre (terre choisie : ses sorts et sa Résistance),
  Affinité élémentaire, Résilience fiélonne, Esprit d'acier, Ancêtre divin, Troisième œil,
  Révélation dans la chair, Présage cosmique, Cri de guerre, Prédictions des Moires…
- Maître de guerre : les 20 manœuvres du PHB 2024 (3, puis 5, 7 et 9), chiffrées dans le bloc et
  rappelées sous les armes, près de l'Initiative, des compétences et de la CA ; Disciple de la guerre.
- Philosophe de l'Académie : école (et seconde école de l'Éclectisme), cases et repères de l'école.
- Cercle de la Lune et Cercle des Étoiles : chiffres des formes (CA, PV temporaires, constellations).
- Cartes de compagnons (section « Compagnons & familiers ») : bête primordiale du Maître des bêtes,
  stimfée de l'Amazone, pseudodragon et dragon lié du Seigneur Dragon, avec leurs PV actuels (nouvelle
  clé facultative `subclass_companions`, PV pleins au repos long sauf un dragon à 0 PV).
- Poésie épique : compteur de strophes et rang du poème ; Magie sauvage : tirages d20 et d100 qui
  renvoient à la ligne de la table du manuel.

## [4.26.0] - 2026-11-09 (Sous-classes, lot 6 : Chevalier occulte et Escroc arcanique)
### Added
- Emplacements de sorts calculés pour le Chevalier occulte (Guerrier) et l'Escroc arcanique
  (Roublard) à partir du niveau 3, selon la table du tiers de lanceur du PHB 2024. Un maximum déjà
  réglé à la main sur une fiche reste prioritaire.
- Onglet Magie : la liste du Magicien est proposée par défaut pour ces deux sous-classes.
- Bloc « Sous-classe » : nombre de sorts préparés et de sorts mineurs à respecter, DD et attaque
  des sorts quand l'Intelligence est choisie.

## [4.25.0] - 2026-11-09 (Sous-classes, lot 5 : combat et ressources)
### Added
- Tableau des armes : boutons de sous-classe qui ajoutent leurs dés aux dégâts — Frénésie du
  Berserker (avec la Rage), Frappe effroyable du Traqueur d'ombre, Frappes redoutables de l'Errant
  féerique, Tueur de colosses du Chasseur, Manœuvre (dé de supériorité) du Maître de guerre, Frappe
  psionique du Guerrier psi.
- Bande des capacités (onglet Combat) : cases pour les ressources de 32 sous-classes — dés de
  supériorité, dés psioniques (un rendu au repos court, tous au repos long), réserve de Lumière
  guérisseuse, Flash protecteur, Prêtre de guerre, Chance du Ténébreux, Présage, Foulées féeriques…
- Près de la CA : Résistances données par la sous-classe (Avatar de bataille, Protection de la
  nature, Défenses psychiques, Âme radieuse, Aura de garde…) ; celles de la Rage (Ours du Cœur
  sauvage, Rage d'Hercule, Rage aveugle) s'affichent quand le bouton Rage est allumé.
- Sous les armes : dé et DD des manœuvres, Racines percutantes, Maître de la lance (L'Hoplite).
- Bloc « Sous-classe » : chaque capacité à cases ou à bouton dit ce que la fiche en fait.

## [4.24.0] - 2026-11-09 (Sous-classes, lot 4 : petits calculs)
### Added
- Initiative calculée : + Sagesse pour le Traqueur d'ombre, + Charisme pour L'Odysséen (niveau 13) ;
  Avantage rappelé près de l'Initiative pour le Champion et l'Assassin.
- Errant féerique : Sagesse (minimum +1) ajoutée aux compétences de Charisme.
- Onglet Combat : Frappe à mains nues du Collège de la Danse (Dextérité, dé d'Inspiration bardique,
  sans armure ni bouclier) ; Charisme pour les armes de corps à corps de l'Ascendance divine ; Force
  pour l'arc long de la Voie herculéenne ; « Coup critique sur 19 ou 20 » (18 à 20 au niveau 15)
  sous les armes du Champion, et de L'Hoplite au niveau 15.
- Rappels « À vérifier » quand une sous-classe donne une maîtrise non cochée (Esprit d'acier,
  Guerrier de la Miséricorde, Domaine de la prophétie, Voie herculéenne, Ascendance divine, boucliers
  de La Voie du bouclier).
- Près de la Vitesse : escalade du Voleur, nage du Cercle de la Mer, « dont +3 m » de l'Aura
  d'alacrité ; près des jets contre la mort : Survivant du Champion.
- Bloc « Sous-classe » : DD, dés et PV calculés dans une trentaine de textes (DD du Moine, dé
  d'Inspiration bardique, Protection arcanique, Frappe mortelle, Radiance de l'aube…).

## [4.23.0] - 2026-11-09 (Sous-classes, lot 3 : sorts toujours préparés)
### Added
- Bloc « Sorts de sous-classe » de l'onglet Magie pour 26 sous-classes de plus : domaines du Clerc
  (Vie, Lumière, Supercherie, Guerre, Prophétie), cercles du Druide (Lune, Mer, Étoiles, Terre,
  Sacrifice), patrons du Sorcier (Archifée, Céleste, Fiélon, Grand Ancien), Ensorceleur (aberrant,
  mécanique, draconique), Rôdeur (Errant féerique, Traqueur d'ombre), Collège du Glamour, Voie du
  Cœur sauvage (rituels seulement), Magicien (Abjurateur, Illusionniste), Guerrier psi, Moine (Ombre,
  Éléments). Cercle de la Terre : sorts rangés par terrain (seul celui choisi au dernier repos long
  est préparé). Les sorts mineurs donnés par une sous-classe y sont aussi.
- Bloc « Sous-classe » : ces capacités passent de « Rappel » à « Calculé » (ou « En partie »).
### Changed
- Voie du Cœur sauvage : « Sens animal » s'appelle « Perception bestiale », comme dans la liste des sorts.

## [4.22.0] - 2026-11-09 (Sous-classes, lot 2 : Zélote et serments du Paladin)
### Added
- Voie du Zélote : cases dans l'onglet Combat pour la réserve de d12 de Guerrier des dieux (4 dés,
  puis 5, 6 et 7 aux niveaux 6, 12 et 17), Focalisation fanatique, Présence zélée et Rage des dieux.
  Elles se vident au repos long ; la Focalisation fanatique se vide aussi quand le bouton Rage s'éteint.
- Fureur divine : avec le bouton Rage allumé, chaque arme et la Frappe à mains nues affichent
  « +1d6+N (Fureur divine 1/tour) » (N = moitié du niveau de Barbare), quelle que soit la caractéristique.
- Paladin : bloc « Sorts de sous-classe » dans l'onglet Magie, avec les sorts toujours préparés des
  cinq serments (Dévotion, Gloire, Anciens, Vengeance, Seigneur Dragon) et ceux à venir. Un sort que
  le joueur a aussi noté dans sa liste porte le repère « Aussi dans votre liste ».
- Conduit divin et capacités de serment : chiffres calculés dans le bloc « Sous-classe » (DD des
  sorts de Paladin, bonus d'Arme sacrée, PV temporaires du Châtiment inspirant, PV de Sentinelle
  immortelle…) ; cases pour Défense glorieuse et les capacités du niveau 20. Serment du Seigneur
  Dragon : DD de la règle 2024 (DD des sorts), le DD 14 du livre est rappelé (décision de Franck).
- Sauvegarde : nouvelle clé facultative `subclass_uses` (cases cochées), absente des anciennes fiches
  et protégée de l'ancien site comme `feat_uses`.

## [4.21.0] - 2026-11-09 (Sous-classes, lot 1 : capacités affichées)
### Added
- Onglet Aptitudes & Traits, « Capacités de classe » : la liste des capacités de la sous-classe choisie
  (332 capacités des 60 sous-classes), avec leur niveau et la règle résumée en français. Celles du
  niveau atteint sont affichées ; les suivantes sont repliées sous « À venir ». Une étiquette dit ce
  que la fiche en fait : « Calculé », « En partie » ou « Rappel ». Le texte libre du joueur reste dessous, inchangé.
- Odyssée : une capacité prévue au niveau 1 ou 2 par le livre (règles de 2014) s'obtient au niveau 3,
  comme la sous-classe en 2024 (décision de Franck) ; le niveau du livre est rappelé.
- Textes relus deux fois dans les manuels (inventaire, puis relecture indépendante : 17 précisions,
  dont le nombre de manœuvres du Maître de guerre et la table de sorts de l'Escroc arcanique).

## [4.20.0] - 2026-11-09 (Sous-classes, lot 0 : corrections)
### Added
- Inventaire des 333 capacités de sous-classe (Manuel des joueurs 2024 et Odyssée) : `docs/SOUS_CLASSES.md`.
- Style de combat « Hoplite (Odyssée) » dans la liste des styles, avec son rappel de Réaction et
  l'alerte « bouclier demandé ».
- Résilience draconique : « dont +X PV » sous les PV maximum (X = niveau d'Ensorceleur), à reporter soi-même.
- Collège de la Vaillance (niveau 3) et Collège de poésie épique (niveau 6) : rappel « À vérifier »
  près de la CA tant que les cases de formation aux armures (et aux boucliers) ne sont pas cochées.
### Fixed
- Moine de La Voie du bouclier (Odyssée) : avec un bouclier, il garde ses Arts martiaux (Dextérité,
  dé d'Arts martiaux, bottes d'armes, DD de Lutte), comme le dit le livre.
- Roublard L'Odysséen (Odyssée) : la Lance et le Trident comptent comme Finesse pour l'attaque
  (Dextérité si elle est au moins égale à la Force) et pour l'Attaque sournoise.
- Bouton « Marque du chasseur » : il affiche +1d10 au niveau 20 du Rôdeur, comme le calcul.
- Collège de la Danse : une sous-classe saisie à la main contenant le mot « dans » n'est plus prise pour la Danse.

## [4.19.0] - 2026-11-09 (Sécurité)
### Security
- Règle de sécurité de la page (Content-Security-Policy) : la fiche n'exécute que ses propres scripts
  et les deux bibliothèques figées (DOMPurify, Supabase), et ne communique qu'avec la base Supabase
  du projet. Un code glissé dans une fiche ne pourrait ni charger un script d'un autre site, ni
  envoyer les données ailleurs.
- Fiche importée depuis un fichier : un fond d'écran hébergé sur un autre site n'est plus chargé
  automatiquement (le site qui l'héberge aurait vu l'adresse IP de la tablette). Message : « Fond
  d'écran de la fiche non chargé (image d'un autre site) : ajoutez-le depuis « Fonds » si vous lui
  faites confiance. » La fiche importée prend le fond de l'appareil (l'adresse n'est donc chargée ni
  par un autre onglet ni par une autre tablette) ; fonds fournis et images de l'appareil inchangés.
- Contrôle automatique de Supabase (tous les 3 jours) : il vérifie aussi qu'une lecture sans
  connexion ne voit aucune fiche, et échoue (courriel de GitHub) si les fiches devenaient publiques.

## [4.18.0] - 2026-11-09 (Ménage)
### Fixed
- Réglage d'une arme : le type de dégâts s'appelle « Perforant » (et non « Perçant »), comme partout ailleurs.
### Changed
- Restauration ensorcelée : le maximum affiché dans la fenêtre de repos court vient de la même règle
  que le calcul (js/rules/rest.js, sorcerousRestorationMax), au lieu d'une copie dans l'interface.
- Clé « dernière sauvegarde » écrite à un seul endroit ; emplacements de dons propres à la v4
  (V4_ONLY_KEYS) déduits de schema.js ; le contrôleur de synchronisation utilise isRename (testé).
- Documentation remise à jour (ARCHITECTURE, ROADMAP, DONS_ACTIFS) ; skill audit-fiche publié dans
  le dépôt (.claude/skills/).
### Removed
- Les 8 anciennes procédures d'Antigravity (.agent/workflows/), remplacées par le skill audit-fiche,
  /code-review et CLAUDE.md (accord de Franck). .agent/rules/ et .agent/context/ restent.
- Fonction inutilisée elementName (js/rules/feat-choices.js).

## [4.17.0] - 2026-11-09 (Vitesse de l'onglet Combat)
### Changed
- Saisie plus fluide sur l'onglet Combat : la hauteur des cases des tableaux (armes, armures, sorts)
  est recalculée en une seule passe (tout lire, puis tout écrire) au lieu d'une case après l'autre,
  environ 7 fois plus rapide sur une grosse fiche. Hauteurs identiques à avant.

## [4.16.0] - 2026-11-09 (Protection des données)
### Fixed
- Fiche piégée : un texte long contenant des attributs cachés (`data-out="__proto__"`…) bloquait le
  démarrage (plus de barre Gestion, plus d'enregistrement). Ces attributs sont retirés à l'affichage,
  ignorés par la fiche, et une étape du démarrage en échec n'empêche plus la barre Gestion ni
  l'enregistrement automatique de démarrer.
- Fiche abîmée ou fabriquée (sauvegarde du navigateur ou import) : une valeur d'un type inattendu (nom
  d'arme ou d'armure qui est un nombre ou un objet, texte long qui est un objet…) bloquait la lecture
  de la sauvegarde, ou laissait la fiche à moitié dessinée. Une liste ou un objet dans un champ texte
  devient son texte (rien n'est perdu) ; un champ illisible n'empêche plus d'afficher les autres ; une
  erreur de lecture imprévue est traitée comme une sauvegarde illisible (copie de secours), et l'import
  l'explique en français.
- Connexion coupée au chargement (DOMPurify absent) : la première retouche d'un texte long
  réenregistrait sa version sans mise en forme (retours à la ligne, gras, couleurs perdus). Les textes
  longs sont désormais en lecture seule, avec le bandeau « Mise en forme indisponible (connexion) :
  textes longs en lecture seule » ; le texte enregistré n'est jamais modifié, ses retours à la ligne
  restent visibles.
- Deux onglets ouverts sur la fiche : l'onglet resté ouvert effaçait en silence ce qui avait été tapé
  dans l'autre. La fiche enregistrée par un autre onglet est maintenant reprise (message « Fiche mise à
  jour depuis un autre onglet »), y compris au retour sur un onglet gelé (iPad). Une saisie pas encore
  enregistrée, ou enregistrée au même instant que l'autre onglet (onglets en arrière-plan, trois
  onglets ou plus), est gardée par-dessus : deux saisies sur des champs différents sont toujours
  gardées toutes les deux. Si l'autre onglet a ouvert un autre personnage, la saisie en cours n'y est
  pas ajoutée et c'est signalé. Le suivi de la synchronisation en ligne suit la fiche reprise : le lien
  en ligne est gardé, même quand les deux onglets enregistrent en même temps ou pendant une création
  en ligne ; un changement de nom n'est demandé que dans l'onglet où il a été tapé (l'autre onglet
  affiche « nouveau nom : répondez à la question dans l'autre onglet »).
- Fiche reprise d'un autre onglet : la case d'arme ou d'armure en cours de saisie garde le curseur ;
  une suppression confirmée pendant ce temps s'applique bien (ou, si l'arme a été modifiée là-bas, un
  message l'indique) et « Annuler la suppression » reste disponible.
- Fausse question « Ce personnage existe déjà en ligne » / « Deux versions différentes » après un
  espace en fin de champ, une caractéristique vidée ou un « 1/3 » d'inspiration, suivi d'un
  rechargement ou d'une coupure réseau. Les empreintes de synchronisation sont calculées sur la fiche
  telle qu'elle sera relue ; les valeurs saisies ne sont pas modifiées. Le suivi déjà enregistré par la
  4.15.0 reste reconnu : la mise à jour ne pose aucune question.
- Sauvegarde du navigateur illisible : la fiche vierge ouverte à la place l'écrasait à la première
  saisie. Le texte illisible est d'abord gardé de côté (copie de secours téléchargeable depuis la
  fenêtre d'avertissement).
- Barre du compte : une fiche sans nom n'affiche plus « fiche à jour » mais « donnez un nom au
  personnage pour l'enregistrer en ligne » (une fiche sans nom n'est jamais envoyée en ligne).
- Import : un fichier JSON qui n'est pas une fiche (aucun champ de fiche reconnu) est refusé avec un
  message clair ; la fiche actuelle n'est pas modifiée.
### Changed
- Format de sauvegarde : inchangé (aucune clé ajoutée, renommée ni supprimée dans la fiche). Nouvelle
  clé du navigateur seulement, hors format de sauvegarde : `dd2024_char_backup` (copie de secours d'une
  sauvegarde illisible ; une copie plus ancienne et différente n'est jamais écrasée, la nouvelle reçoit
  un suffixe daté `dd2024_char_backup_<date>`). Les empreintes de `dd2024_cloud_sync` sont désormais
  calculées sur la fiche normalisée (celles de la 4.15.0 restent reconnues).

## [4.15.0] - 2026-11-09 (Règles de classe et maîtrise des armes)
### Added
- Paladin niveau 6 : Aura de protection (+ mod. de Charisme, minimum +1) comptée dans les six jets de
  sauvegarde calculés, avec le repère « dont +X Aura » et le rappel « inactive si Neutralisé ».
- Barde niveau 2 : Touche-à-tout (moitié du bonus de maîtrise) compté dans les compétences non maîtrisées et
  la Perception passive (pas l'Initiative), avec un repère sur chaque compétence concernée.
- Défense sans armure 10 + Dex + Cha : Sorcellerie draconique (Ensorceleur niveau 3, bouclier permis) et
  Collège de la Danse (Barde niveau 3, ni armure ni bouclier), détaillée dans la bulle de la CA.
- Odyssée, Moine La Voie du bouclier (niveau 3) : la Défense sans armure reste comptée avec un bouclier
  (cocher la formation aux boucliers, que donne cette voie).
- Configuration d'une arme : réglage « Arme maîtrisée » (Auto / Oui / Non), avec ce que « Auto » décide.
### Changed
- Attaque des armes : le bonus de maîtrise n'est ajouté qu'avec une arme maîtrisée (décision de Franck,
  PHB 2024). Maîtrise déduite de la classe, du don Formation aux armes de guerre et du Collège de la
  Vaillance (et, pour le Roublard L'Odysséen de l'Odyssée, le trident qui compte comme Finesse) ; Frappe à mains nues toujours maîtrisée ; classe non reconnue ou arme hors catalogue : comptée
  comme avant ; Clerc, Druide et Sorcier : maîtrise des armes de guerre supposée (Protecteur, Gardien, Pacte
  de la lame), rappelée sous l'arme. Une arme non maîtrisée l'indique par une pastille ⚠ orange sous son bonus
  d'attaque (elle ouvre le rappel « Sans maîtrise »), dans l'infobulle et dans la fenêtre de sa botte d'arme.
- Format de sauvegarde : propriété facultative `proficiency` (« yes » ou « no ») dans le JSON `weaponConfig`
  d'une arme, absente en « Auto » ; aucune clé renommée ni supprimée. La v3 l'ignore (et l'efface si l'on
  y réenregistre la configuration de l'arme : retour à « Auto »).
### Fixed
- Maîtrises d'armes des classes : Moine (armes de guerre Légères) et Roublard (armes de guerre Finesse ou
  Légères), comme le PHB 2024.
- Rôdeur niveau 20 (Tueur d'ennemis) : la Marque du chasseur fait 1d10 au lieu de 1d6.
- Historique Marin : Acrobaties et Perception (au lieu d'Athlétisme et Perception).

## [4.14.0] - 2026-11-09 (Boutons des faveurs épiques)
### Added
- Boutons de combat « Visée infaillible » (Faveur de prouesse martiale : mémo « utilisée ce tour », aucun
  calcul) et « Dans l'ombre » (Faveur de l'esprit nocturne : repère « Résistance (ombre) » sous la CA),
  proposés seulement avec leur faveur, utilisables fiche verrouillée, éteints au repos long.
### Changed
- Format de sauvegarde : clés facultatives `peerlessAim` et `nightSpirit` dans `combat_buffs` ; aucune clé
  renommée ni supprimée.

## [4.13.0] - 2026-11-09 (Faveurs épiques)
### Added
- Les 12 faveurs épiques : menu « Caractéristique +1 » (jusqu'à 30, alerte au-delà), alerte si une faveur
  est notée dans un emplacement d'avant le niveau 19 ; une caractéristique au-delà de 20 n'est plus
  signalée avec une faveur.
- Vigueur « dont +40 PV », Vitesse « dont +9 m » (valeurs saisies inchangées) ; dégâts du 20 naturel sous
  chaque arme (Attaque irrésistible) ; compétences restant à cocher et Expertise au choix (Compétence) ;
  deux résistances au choix et DD de la Redirection (Résistance aux énergies) ; prérequis de Mémoire
  magique (capacité Sorts, pas la Magie de pacte) ; rappels des autres faveurs.
- Cases : dix d10 et Dernier rempart (Récupération), vidés au repos long ; Destin, vidé au repos court.
  Un don peut désormais avoir plusieurs groupes de cases.
### Changed
- Format de sauvegarde : dans `feat_choices`, champs `expertise`, `energy1`, `energy2` des faveurs ; dans
  `feat_uses`, clés `faveur_de_recuperation`, `faveur_de_recuperation_rempart`, `faveur_du_destin`. Aucune
  clé renommée ni supprimée.

## [4.12.0] - 2026-11-09 (Frappe à mains nues et derniers dons)
### Added
- « Frappe à mains nues » dans la liste des armes du manuel : attaque et dégâts calculés (1 + Force), dé du
  Moine, de Bagarreur (1d4) ou du style Combat à mains nues (1d6, 1d8 les mains vides en rappel).
- Rappels sous les armes : Tireur d'élite, Maître arbalétrier, Combattant à deux armes, Empoigneur (avec
  le DD de Lutte), Bagarreur.
- Repères : Athlète (« Escalade = Vitesse »), Comédien (Tromperie, Représentation, DD de l'Imitation),
  Discret (Discrétion) ; Fabrication rapide du Façonneur rappelée au repos long seulement ; rappels de
  Combattant monté, Formation aux armes de guerre et Maître d'armes.
### Fixed
- Moine : la Dextérité n'est prise que sans armure ni bouclier, et aussi pour ses armes de Moine ; le dé
  d'arts martiaux ne remplace plus un dé d'arme plus gros, ni celui d'une arme à distance.
- Arme de lancer : les +2 dégâts sont affichés « +2 (Arme de lancer) ».

## [4.11.0] - 2026-11-09 (Styles de combat)
### Added
- Emplacement « Style de combat » dans Aptitudes & Traits : Guerrier dès le niveau 1, Paladin et Rôdeur au
  niveau 2 (Guerrier béni ou Guerrier druidique possibles à la place), second style du Champion au niveau 7.
  Alerte de prérequis hors de ces classes ; rien n'est effacé.
- Défense comptée dans la CA calculée, Archerie dans l'attaque des armes à distance, bouton de combat
  « Duel (+2) », dégâts des armes de lancer et de l'arme Légère (Combat à deux armes) calculés, rappels des
  autres styles sous les armes.
### Changed
- Format de sauvegarde : nouvelles clés facultatives `feat_2` (style de combat) et `feat_7` (second style du
  Champion), absentes tant qu'on ne les remplit pas ; aucune clé renommée ni supprimée. La synchronisation
  les traite comme les autres clés propres à la v4.

## [4.10.0] - 2026-11-09 (Dons en plus du Guerrier et du Roublard)
### Added
- Guerrier : emplacements de don en plus aux niveaux 6 et 14 ; Roublard : au niveau 10 (PHB 2024,
  Amélioration de caractéristique ou autre don). Mention « Guerrier : don en plus », mêmes calculs, cases,
  choix et alertes que les autres dons. Autre classe : la ligne n'apparaît pas, ou, si un don y est noté,
  il reste affiché « Réservé aux Guerriers » sans compter (rien n'est effacé).
### Changed
- Format de sauvegarde : nouvelles clés facultatives `feat_6`, `feat_10`, `feat_14`, absentes tant qu'on ne
  les remplit pas ; aucune clé renommée ni supprimée. La synchronisation les traite comme les autres clés
  propres à la v4.

## [4.9.0] - 2026-11-09 (Dons : vitesse, PV temporaires, armures, armes d'hast, poison)
### Added
- Mobile : repère « dont +3 m grâce à Mobile » sous la Vitesse (la vitesse saisie n'est pas modifiée).
- Duelliste défensif : repère « Parade +N » sous la CA et calcul de la Parade sous chaque arme de Finesse.
- Maître d'hast : Frappe double calculée sous le Bâton, la Lance et les armes Lourdes à Allonge (toujours
  1d4 contondant, bonus magique de l'arme, Rage et Marque du chasseur comptés), rappel de la Frappe réactive.
- Empoisonneur : DD du poison sous les armes, préparation des doses, Poison virulent, maîtrise du kit.
- Gaillard : repère « Avantage (Gaillard) » près des jets contre la mort, dés de vie restants pour la
  Récupération rapide.
- Chef cuisinier : friandises à cocher (remises à neuf au repos long), Repas reconstituant rappelé dans la
  fenêtre du repos court.
- Figure de proue : PV temporaires de la Représentation galvanisante (niveau + modificateur) dans la
  fenêtre des repos.
- Protection légère, intermédiaire et lourde, Incantateur d'élite : maîtrises et rappels, prérequis vérifié.
- Le +1 de caractéristique des 32 dons généraux est suivi (menu s'il y a un choix, sinon automatique) ;
  la valeur saisie n'est jamais modifiée, un repère s'affiche près de la caractéristique.
### Fixed
- Druide : maîtrise des armures légères et des boucliers seulement (PHB 2024).
- Textes d'Empoisonneur (le poison dure jusqu'à ce que l'arme touche) et de Maître d'hast (« entre dans
  votre allonge »).
- Un don qui n'est pas calculé affiche quand même son +1 et ses alertes, puis « le reste : rappel seulement ».
### Changed
- Format de sauvegarde inchangé : les choix vont dans feat_choices, les friandises dans feat_uses.

## [4.8.0] - 2026-11-09 (Don de l'Humain, dons repliables)
### Added
- Humain : second don d'origine (trait Polyvalent, PHB 2024), juste sous celui de l'historique, avec la
  mention « Humain : Polyvalent ». Sa liste ne propose que les dons d'origine ; il compte dès le niveau 1
  (calculs, cases, sorts de dons, repos). Autre espèce : la ligne disparaît, ou, si un don y est noté,
  il reste affiché « Réservé aux Humains » sans compter (rien n'est effacé).
- Aptitudes & Traits : toucher la pastille « Niv. X » replie le don (seul son titre reste), un second
  toucher le rouvre. Retenu sur l'appareil, jamais dans la sauvegarde ; un autre don choisi s'affiche
  déplié ; tout est imprimé, replié ou non.
### Fixed
- Même don pris dans deux emplacements (hors dons répétables) : le second affiche une alerte « déjà
  pris » au lieu de répéter les calculs et les rappels (plus de « +2 PV max à reporter » en double).
### Changed
- Format de sauvegarde : nouvelle clé facultative `feat_0` (second don de l'Humain), absente tant qu'on
  ne la remplit pas ; aucune clé renommée ni supprimée. La synchronisation la traite comme les autres
  clés propres à la v4 (une ancienne fiche v3 qui l'efface est réparée sans question).

## [4.7.0] - 2026-11-08 (Sorts de dons)
### Added
- Six dons qui donnent des sorts, avec leurs choix sous le don (onglet Aptitudes & Traits) : Initié à la
  magie (liste Clerc, Druide ou Magicien, puis 2 sorts mineurs et 1 sort de niveau 1 de cette liste ;
  répétable), Affinité féerique, Affinité ombreuse, Magie rituelle (un sort rituel de plus aux niveaux
  5, 9, 13 et 17), Télépathe, Télékinésiste.
- Onglet Magie : bloc « Sorts de dons » au-dessus du grimoire. Chaque don donne sa caractéristique, son
  DD et son bonus d'attaque ; un rond « Lancer gratuit » se coche quand le sort est utilisé (même feuille
  verrouillée) et se vide au repos long. Toucher le nom d'un sort ouvre sa fiche. Ces sorts ne sont
  jamais ajoutés à la liste du joueur.
- Magie rituelle : compteur « Rituel rapide » (1 fois par repos long).
- Avertissements : même liste prise deux fois avec Initié à la magie, sort mineur ou rituel en double.
### Fixed
- Le bandeau doré de la 4.6.1 mettait aussi en gras doré les menus de choix sous les dons : seul le
  titre du don est doré.
### Changed
- Format de sauvegarde inchangé : les choix vont dans feat_choices, les lancers gratuits dans feat_uses.

## [4.6.1] - 2026-11-08 (Titres des dons)
### Changed
- Aptitudes & Traits : chaque don actif (choisi, niveau atteint) ressort comme un en-tête de chapitre :
  bandeau doré, pastille du niveau en or plein, titre en or et en gras souligné d'or. Les dons prévus
  plus tard et les emplacements à choisir restent discrets ; impression sobre.

## [4.6.0] - 2026-11-08 (Objets magiques)
### Added
- Armes et armures magiques (bonus réglé avec l'engrenage de la ligne) : un aspect de plus en plus
  marqué selon le bonus.
  - +1, éveillée : filet d'or à gauche, voile doré, nom en or, pastille « +1 », reflet rare.
  - +2, enchantée : en plus, cadre doré, halo qui respire, nom qui brille, paillettes, étoile sur la
    pastille.
  - +3, légendaire : en plus, cadre épais parcouru d'un trait de lumière, runes qui s'allument,
    inscription runique qui défile en haut et en bas, braises, rayons derrière la pastille, bonus en or.
- Toucher la pastille joue l'enchantement (éclat, onde d'or, étincelles) et la barre d'état dit l'effet
  du bonus (déjà compté ou non dans l'attaque, les dégâts ou la CA). L'enchantement se joue aussi quand
  on règle un bonus plus élevé.
- Bouton « Sans animation » dans la barre Gestion : coupe tout ce qui bouge sur la fiche (reflets,
  objets magiques, Rage, ouverture...). Le choix est retenu sur l'appareil, jamais dans la sauvegarde.
### Changed
- Impression : les objets magiques restent sobres (nom en noir, simple « +N »).
- Format de sauvegarde inchangé.

## [4.5.0] - 2026-11-06 (Dons à choix mémorisés)
### Added
- Dons à choix : sous le don, des menus retiennent ce que vous avez choisi. La fiche ne change jamais
  une valeur saisie ni une case cochée : elle affiche des repères et signale ce qui reste à faire
  (« À vérifier »).
  - Amélioration de caractéristique (+2 à une, ou +1 à deux), Résilient, Observateur, Expert, Esprit
    affûté, Doué, Adepte élémentaire.
  - Repère « +2 don niv. 4 » près de la valeur de caractéristique, alerte au-delà de 20.
  - Repère près du jet de sauvegarde (Résilient) et des compétences (Observateur, Expert, Esprit
    affûté, Doué) ; « À vérifier » si la case due au don n'est pas cochée.
  - Adepte élémentaire : repère « Adepte (feu) » sur les sorts de ce type dans le grimoire, et la règle
    dans l'infobulle du sort.
- Sauvegarde : nouvelle clé facultative « feat_choices » (anciennes fiches inchangées).
### Changed
- Fenêtre « Modifié par l'ancienne version » : elle cite aussi les usages et les choix des dons, que
  l'ancienne version ne connaît pas.

## [4.4.0] - 2026-11-06 (Dons à usages limités)
### Added
- Dons à usages limités : des cases à cocher (cochée = usage dépensé) dans l'encadré du don et dans une
  bande de l'onglet Combat, utilisables fiche verrouillée, vidées automatiquement au repos.
  - Chanceux : points de Chance (autant que le bonus de maîtrise), récupérés au repos long.
  - Tueur de mages : Esprit préservé (une fois), de nouveau disponible au repos court ou long ; rappel
    « Briseur de concentration » dans le tableau des armes.
- Les fenêtres de repos indiquent ce qui revient (« Esprit préservé : de nouveau disponible »).
- Sauvegarde : nouvelle clé facultative « feat_uses » (anciennes fiches inchangées).

## [4.3.0] - 2026-11-05 (CA des armures calculée)
### Added
- Armures et boucliers magiques : un engrenage par ligne règle le bonus magique (+1 à +3), compté dans
  la CA. Pour un objet hors manuel (cape, anneau, armure maison), il règle aussi le type et la valeur
  de base.
- Don Maître des armures intermédiaires : Dextérité jusqu'à +3 en armure intermédiaire (Dextérité 16+).
- Écusson CA en haut de la fiche : le toucher (ou le survoler) affiche l'addition complète (armure ou
  Défense sans armure du Barbare / du Moine, bouclier, bonus, total) et les remarques utiles.
### Changed
- Colonne CA des armures : elle n'est plus saisie. Elle montre ce que la ligne apporte (« 18 » pour une
  Demi-plate +1, « +3 » pour un Bouclier +1) ; toucher la valeur affiche le calcul (« 15 + 2 Dex
  (max 2) + 1 magique = 18 ») et si la ligne compte. Le type se lit dans le tableau et se règle avec
  l'engrenage ; une armure du manuel prend son type et sa valeur dans le manuel. Sauvegardes inchangées,
  même CA qu'avant.
- Explications de CA plus justes : Moine avec un bouclier (la Défense sans armure perdue est indiquée),
  deux armures ou deux boucliers de même valeur (« retenue », plus « donne plus »).
### Fixed
- Une armure du manuel enregistrée sans valeur de CA (CA 0) reprend la valeur du manuel.

## [4.2.0] - 2026-11-05 (Bottes d'armes)
### Added
- Bottes d'armes : un petit livre dans la case « Botte d'arme » ouvre la règle (texte du Manuel des
  joueurs 2024, p. 214), avec les valeurs calculées pour l'arme (DD de Renversement, dégâts
  d'Écorchure et d'Enchaînement, Rage comprise) et la capacité Maîtrise des armes de la classe.
- Galerie : fond d'écran « Hache du Phénix ».
### Changed
- Armes : supprimer une arme nommée demande d'abord une confirmation, comme pour les armures
  (le bouton « Annuler la suppression » reste disponible quelques secondes après).

## [4.1.0] - 2026-11-04 (Dons actifs, lots 0 et 1)
### Added
- Dons pris à un niveau atteint : la fiche affiche leur effet sans jamais modifier une valeur saisie.
  Vigilant (Initiative + maîtrise), Robuste (« dont +X grâce à Robuste » sous les PV max, à reporter),
  Mage de guerre (Avantage Concentration), Maître des armures lourdes (dégâts C/P/T réduits, sous la CA),
  Maître des boucliers (DD du coup de bouclier, Interposition), Expert de la charge (bouton « Charge (+1d8) »).
- Rappels par arme (étoile sous le bonus d'attaque) : Sauvagerie martiale, Abattage, Sentinelle, Trancheur,
  Broyeur, Perforateur, Coup de bouclier ; rappel Musicien en fin de repos ; encadré « Dans la fiche » sous
  chaque don choisi.
- Descriptions des 12 faveurs épiques.
### Fixed
- Coutille : arme de guerre 1d10 tranchants, Lourde, Allonge, Deux mains (corrigée aussi dans les
  sauvegardes qui avaient gardé les anciennes valeurs du manuel). Lance d'arçon, Sarbacane, Mousquet.
- Augmentations de caractéristique des dons (ex. « +1 For ou Dex ») et coquilles des descriptions.
- Moine : le Cimeterre et l'Épée courte comptent comme armes de moine.

## [4.0.0] - 2026-10-26 (Bascule : la v4 remplace la v3 à la même adresse)
### Added
- Reprise de la v3 sans perte au premier lancement : emplacements de sorts utilisés, nombre
  d'emplacements réglé à la main et bonus de combat actifs (Rage…), que la v3 gardait à part dans le
  navigateur, entrent dans la fiche (les anciennes clés restent en place pour un retour à la v3).
- Personnage en ligne au nom écrit autrement par la v3 (mise en forme au milieu du nom, par ex.
  « Korgul B rise-Crâne ») : retrouvé et renommé au premier lancement, au lieu d'un doublon.
- Perception passive : toucher la valeur calculée (fiche déverrouillée) permet d'en saisir une autre ;
  effacer la saisie revient au calcul (comme la v3).
- Grimoire : « Emplacements niv. N » proposé aussi au-dessus des emplacements du manuel (Arcanum
  mystique de l'Occultiste, multiclasse), comme le « + » de la v3.
- Lien d'e-mail expiré ou déjà utilisé (mot de passe oublié) : message clair, la session reste ouverte.
### Changed
- Barre « Gestion » repliée aussi sur les tablettes tactiles en paysage (jusqu'à 1400 px : Lenovo,
  iPad), et centrée au-dessus de la fiche ; dépliée, elle couvrait un quart de la hauteur de l'écran.
- Une version en ligne enregistrée par l'ancienne version (onglet v3 resté ouvert) n'est jamais chargée
  en silence : une question propose de garder celle de ce navigateur. Si la v3 n'a fait qu'effacer
  l'état de jeu (Rage, emplacements), il est remis en ligne sans question.
- « Ce personnage existe déjà en ligne » : la version la plus récente est signalée « (plus récente) » ;
  si c'est la version en ligne, « Ouvrir la version en ligne » est le choix proposé par défaut.
- Création en ligne : la fiche existante est lue avant toute création (plus d'erreur 409 dans la console).
- Déconnexion : ce navigateur seulement (les autres appareils restent connectés).
- Épuisement élevé mis en évidence (orange dès 3, rouge dès 5), comme la v3.
- Sorts : note vide remplie avec le nom anglais du sort choisi (comme la v3) ; tableaux des
  descriptions lisibles (Augure, Confusion, Téléportation…) ; Entrée choisit la seule suggestion.
- Tablettes : boutons Rage et Cogneur lourd de 44 px de haut, zones de toucher agrandies pour le tri
  des sorts et le losange « préparé », plus de rectangle gris au toucher ; repos court sans clavier
  virtuel à l'ouverture ; infobulle de sort qui défile au doigt et tient dans l'écran ; suggestions
  affichées au-dessus du champ quand le clavier virtuel couvre le dessous.
- `dev/preview.html` (outil de capture) ne fonctionne plus qu'en local : sur le site publié, il ne
  peut plus remplacer la fiche du joueur.
### Fixed
- Grande image de fond importée en v3 (plus de 1,5 Mo environ) : de nouveau affichée (Chrome et Edge
  ignoraient une variable CSS de plus de 2 Mio).
- Ancienne adresse complète d'une image fournie (racine du site v3) : affichée depuis `assets/backgrounds/`.
- Dé de vie d'une fiche v3 aligné sur la classe (la v3 le faisait à chaque ouverture) ; « Dés utilisés »
  vide remis à 0.
- Voile des fenêtres visible sur les navigateurs plus anciens (Chrome < 122, Safari < 17.4) ; coupure des
  mots longs avec trait d'union sur Safari < 17.

## [4.0.0-alpha.4] - 2026-10-25 (Reconstruction v4 : étape 5, branche `v4`)
### Added
- Compte en ligne (même base Supabase que la v3) : connexion avec mot de passe mémorisable, création de compte, mot de passe oublié, « Mes personnages » (ouvrir, supprimer), renommage / copie.
- Synchronisation sûre : version en ligne jamais écrasée si elle a changé ailleurs, nouvelle fiche ou import en création seule, questions dont la fermeture n'écrase rien, opérations périmées abandonnées, suivi enregistré avec la fiche (plusieurs onglets).
- 46 scénarios de synchronisation testés (faux Supabase réaliste), vérifiés par trois relectures indépendantes et des tests de mutation.
### Changed
- Tableaux d'armes, d'armures et de sorts : les cases passent à la ligne et s'agrandissent au lieu de tronquer le texte (nom complet de l'arme, dégâts, propriétés) ; plus de défilement interne.
- Valeurs des tableaux en Alegreya (en-têtes en Cinzel) : plus lisibles, mots jamais coupés à 820 px ; colonne des propriétés élargie sur tablette.
- Fiche transparente façon v3 : les cadres de texte suivent le curseur d'opacité (deux tons, l'illustration se voit à travers), verre dépoli derrière la fiche, ombre et reflet légers sur les cadres ; l'hexagone de la CA garde son contour.
- Barre « Gestion » redessinée : barre flottante en verre dépoli à double filet doré, commandes ordonnées (Fiche ; Affichage et Compte ; états à droite), boutons groupés à icônes dessinées, glissières dorées ; une seule ligne repliée sur tablette.
- Thème sombre : illustration de fond moins assombrie.
- Finitions « chic » de toute la fiche (lot 1) : icônes dorées dessinées à la place des emojis (titres, onglets, groupes de compétences, boutons, fenêtres), titres de section ornés d'un filet doré, onglets « marque-pages » avec onglet actif doré, nom du personnage en titre de parchemin, chevrons dorés sur les listes, cases rondes perlées d'or, pièces de monnaie en relief, grands chiffres gravés.
- Boutons de la fiche (filtres, Rage, ajouter, repos, réglages) et fenêtres (verre dépoli, double filet doré) dans le style de la barre « Gestion ».
- Textes longs (traits, capacités de classe, compagnons…) : la case s'agrandit pour tout montrer, plus de défilement interne.
- Accessibilité : contrastes revus dans les deux thèmes, focus clavier visible partout, zones tactiles de 44 px sur iPad, animations coupées si l'appareil le demande.
- Effets « waouh » (lot 2) : ouverture de la fiche en cascade, changement d'onglet en fondu glissé, cartes qui se soulèvent au survol avec un rare reflet doré, passage clair / sombre en cercle depuis le bouton, lent zoom de l'illustration en mode cinéma.
- Réactions de jeu : Rage active = lueur de braise autour des PV, des Rages et des armes, bouton Rage incandescent ; jauge de PV (laiton → cuivre → braise, PV temporaires en argent) ; les valeurs calculées pulsent en doré quand elles changent.
- Icônes : poing vu de face pour la Force, sablier pour le repos court ; thème sombre appliqué dès le premier affichage (plus de flash clair).
- Toutes les animations sont coupées si l'appareil demande moins d'animations ; rien n'est animé à l'impression.
- Lisibilité (lot 3) : grimoire sans lignes vides (seuls les sorts remplis plus une ligne de saisie ; les lignes vides de la sauvegarde restent intactes) et replié pour un personnage sans magie (« Ouvrir le grimoire ») ; sorts non préparés plus discrets.
- Dons : emplacement atteint mais vide signalé en doré, niveaux à venir atténués (« À venir », « Actif au niveau N » pour un don prévu) ; compétences maîtrisées et expertises mises en valeur, les autres plus discrètes.
- Revue de toute la fiche : bonus d'attaque sur une seule ligne sur iPad, sauvegardes plus grandes et maîtrisées en gras, taille minimale des petits libellés, contrastes renforcés (texte atténué plus foncé en clair), colonnes du grimoire sans mots coupés à 820 px.
- Retours de Franck sur iPad : valeurs centrées dans les cases bonus de maîtrise / inspiration / vitesse (alignées entre elles), jauge de PV en dégradé du vert au rouge (jaune, orange), encadré Odyssée aux titres sur une même ligne et valeurs alignées, quelle que soit la largeur ; classe d'armure dans un bouclier à double filet doré (à la place de l'hexagone, même place).
- Bouton « Cogneur lourd » à côté de « Rage » (don choisi à un niveau atteint) : + bonus de maîtrise aux dégâts des armes Lourdes, cumulable avec la Rage.
- Armes et armures : les lignes vides enregistrées sont masquées, une seule ligne « Nouvelle arme… » / « Nouvelle armure… » reste pour la saisie (aucune quand la fiche est verrouillée ni à l'impression) ; « Ajouter » y place le curseur.
- Barre « Gestion » : disposition figée, les messages d'état (compte, enregistrement) ne déplacent plus les boutons ; trop longs, ils se terminent par « … » (texte complet au survol).
### Fixed
- Champ en cours de saisie rafraîchi quand une autre version de la fiche est chargée.
- Noms v3 sur plusieurs lignes lus comme la v3 (« Kor gul »).

## [4.0.0-alpha.3] - 2026-10-25 (Reconstruction v4 : étape 4, branche `v4`)
### Added
- Tableaux d'armes, d'armures et de sorts modifiables avec auto-complétion depuis le manuel, filtres, configuration d'arme, bonus de combat (Rage, Attaque sournoise, Marque du chasseur).
- Grimoire : emplacements de sorts cochables (magie de pacte comprise), tri, infobulles de description.
- Repos court (dés de vie, minimum 1 PV par dé) et repos long conformes au PHB 2024.
- Barre « Gestion » repliable : verrou, mode cinéma, import/export (fichier ou presse-papiers), nouvelle fiche, impression, galerie de fonds, cadrage et opacité.
- Éditeur de style (gras, italique, souligné, tailles, couleurs lisibles dans les deux thèmes).
- Impression A4 : 4 pages, une par section, noir sur blanc quel que soit le thème.
### Fixed
- Bouclier sans formation sans effet sur la CA ; un seul bouclier compte.
- Sauvegarde automatique faite immédiatement à l'import et à la fermeture de la page ; messages d'état préservés.
- Tableau des armes sans défilement latéral à 820 px ; couleurs de texte v3 lisibles en thème sombre ; barres de défilement sombres ; texte riche nettoyé plus strictement ; aucune erreur console.

## [4.0.0-alpha.2] - 2026-10-25 (Reconstruction v4 : étape 3, branche `v4`)
### Added
- Fiche complète sur 4 onglets (en-tête, caractéristiques, combat, traits, dons, compétences, Odyssée, magie, trésor), reliée au store avec sauvegarde automatique dans le navigateur.
- Thèmes clair et sombre (palette v3), mise en page tablette 768–1100 px sans défilement horizontal (vérifiée à 820, 1024 et 1280 px).
- Textes longs en police à vraies minuscules (Alegreya, choisie par Franck sur la page `dev/polices.html`).
- Import / export JSON depuis la barre « Gestion ».
- Palier de renommée de l'Odyssée calculé par le moteur de règles.
### Fixed
- Cases à cocher toujours rondes, texte « 18(16) » qui ne déborde plus, aucun `!important` ni gestionnaire inline.

## [4.0.0-alpha.1] - 2026-10-25 (Reconstruction v4 : étapes 0 à 2, branche `v4`)
### Added
- Nouvelle structure (`js/data`, `js/rules`, `js/state`, `js/ui`), serveur local sans dépendance, garde-fous `npm run check` et CI.
- Moteur de règles pur `js/rules/character.js` : CA, sauvegardes, compétences, sorts, armes, épuisement.
- État unique (`js/state/store.js`), migration de toutes les anciennes sauvegardes (`js/state/migrate.js`), sauvegarde locale et fichiers JSON compatibles v3.
- Page de validation temporaire `dev/validation.html`.
- 109 tests (règles, données, migration, vraies sauvegardes de Korgul en local).
### Fixed
- Règles corrigées d'après le Manuel du joueur 2024 (emplacements Paladin/Rôdeur au niveau 1, Conduit divin, Forme sauvage, points de discipline et de sorcellerie, Défense sans armure du Moine avec bouclier).
- Dons de style de combat classés « Style de combat ».

## [3.1.1] - 2026-10-25 (Réparation express de la v3, branche `master`)
### Fixed
- L'application redémarre (déclaration `switchTab` dupliquée), boutons du grimoire et « Nouvelle fiche » réparés, chargement des sorts rétabli.

## [2.9.13] - 2026-07-26 (Story E : Performances & Chargement)
### Added
- Attribut `defer` sur les 15 balises `<script>` dans `index.html` pour débloquer l'analyse du DOM.
- Lazy-loading asynchrone du grimoire de sorts via `fetch('data/spells.json')` réduisant la taille du bundle initial de 446 Ko.
### Changed
- Recompression des 7 images d'arrière-plan WebP (`Fond_*.webp`) réduisant le poids total de 8.8 Mo à 1.16 Mo (-87%).
- Nettoyage des requêtes Google Fonts parasites.

## [2.9.12] - 2026-07-26 (Story D : Outillage & Tests Unitaires)
### Added
- Suite de 22 tests unitaires automatisés (`node --test tests/logic.test.js`) couvrant les calculs D&D 2024 de `logic.js`.
- Configurations ESLint (`.eslintrc.json`), Prettier (`.prettierrc`) et ignore files.
- Pipeline d'intégration continue GitHub Actions (`.github/workflows/ci.yml`).
### Fixed
- Correction complète des problèmes d'encodage UTF-8 (mojibake) dans `script.js` et `storage.js`.

## [2.9.11] - 2026-07-26 (Story C : Démarrage & Synchronisation)
### Added
- Synchronisation réactive Supabase via `sb.auth.onAuthStateChange()` au lieu de délais d'attente fixes.
- Modale de résolution de conflit Cloud vs Local basée sur les horodatages `updated_at`.
- Système de notifications toast `showCloudError()` non-bloquantes en cas de problème réseau.
### Fixed
- Sécurisation par `try/catch` de tous les `JSON.parse` critiques dans `storage.js`.
- Sécurisation du renommage de personnage (création avant suppression).

## [2.9.10] - 2026-07-26 (Story B : Sécurisation Supabase & RLS)
### Added
- Script SQL [supabase/policies.sql](file:///e:/1%20-%20FV/JDR/0_Feuille_de_Perso_Antigravity/supabase/policies.sql) pour l'activation du Row Level Security (RLS) basé sur `auth.uid()`.
### Changed
- Épinglage du SDK Supabase `@2.43.4` avec contrôle d'intégrité SRI.
- Masquage et isolation du client global sous `window.sb`.

## [2.9.9] - 2026-07-26 (Story A : Neutralisation XSS)
### Added
- Intégration de la bibliothèque DOMPurify 3.1.5 (SRI).
- Helper de purification HTML `setRichHTML()` dans `storage.js` avec whitelist stricte.
### Fixed
- Remplacement de 22 points d'injection `innerHTML` vulnérables dans l'ensemble des modules JS.

## [2.9.8] - 2026-07-26 (Combat & Infobulles Sorts)
### Added
- Intégration des options "Bonus" et "Maîtrise" pour le calcul dynamique de la Classe d'Armure.
- Refonte visuelle et animation du bouton d'infobulle des sorts (💬) pour le Mode Nuit et le Mode Jour.
### Fixed
- Déblocage des événements de survol (`mouseover`) des infobulles de sorts lorsque la fiche est en mode verrouillé.

## [2.9.7] - 2026-07-26 (Impression PDF Pro 4 Pages)
### Added
- Feuille de style `@media print` dédiée garantissant le rendu sur **exactement 4 pages PDF**.
- Compacité dynamique des blocs de texte et masquage des éléments d'interface inutiles à l'impression.

## [2.9.5] - 2026-07-20 (Roster Supabase Multi-Personnages)
### Added
- Gestion de plusieurs personnages par compte Supabase.
- Modale "Mes Personnages" pour lister, charger, réinitialiser ou dupliquer des fiches.

## [2.9.0] - 2026-07-10 (Refonte D&D 2024 & 4 Onglets)
### Added
- Architecture à 4 onglets : Caractéristiques & Combat, Aptitudes & Traits, Compétences & Histoire, Magie & Équipement.
- Base de données D&D 2024 de +70 dons classés par palier d'ASI dans `feats-data.js`.
- Colonnes Maîtrise, Propriétés et Munitions pour la gestion des armes 2024.
- Indicateur de niveau de fatigue (0 à 6) dans la section Repos.

---

## [2.2.0] - 2026-02-14
### Added
- Magie & Grimoire (Tab 3) : filtres de sorts, tracker d'emplacements, trésorerie.
- Compétences & Histoire (Tab 2) : Centre de Repos court/long.

## [2.0.0] - 2026-01-29
### Added
- Système d'onglets initial (3 onglets).
- Thème sombre avec variables CSS.

## [1.0.0] - 2026-01-15
### Added
- Version initiale de la feuille de personnage D&D.
