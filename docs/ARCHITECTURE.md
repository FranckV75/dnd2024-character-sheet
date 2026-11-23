# Architecture — v4

HTML/CSS/JavaScript natifs, modules ES chargés directement par le navigateur (aucune étape de build).

## Arborescence

```
index.html              Page de la fiche : barre « Gestion », en-tête, 4 onglets (point d'entrée : js/main.js)
css/                    Une feuille par fonctionnalité ; toute couleur passe par une variable CSS
│                       (thèmes dans base.css, variables locales dans magic, gallery, style-editor, print ;
│                       contrôle 6 de scripts/check.js : aucune couleur écrite en dur)
├── base.css            Jetons de thème clair / sombre (variables CSS), typographie
├── sheet.css           Base de la fiche : champs, cases rondes, boîtes, en-tête, onglets
│                       (suivie, dans cet ordre, des feuilles ci-dessous découpées en lot D :
│                       l'ordre de chargement d'index.html compte, comme dans l'ancien fichier unique)
├── tab-combat.css      Onglet 1 : caractéristiques, sauvegardes, vitaux, épuisement, tableaux
│                       (groupe Bonus de maîtrise / Points de Foi / Vitesse : rangées partagées,
│                       subgrid, iPadOS 17 et Chrome 117 ou plus récents pour l'alignement)
├── wild-magic.css      Tirages de la Bouffée de Sorcellerie sauvage (onglet 1)
├── feats.css           Onglet 2 : dons, mentions près des valeurs, encadré « Dans la fiche »
├── tab-skills.css      Onglet 3 : compétences, légende, Odyssée
├── treasure.css        Onglet 4 : caractéristiques d'incantation, pièces
├── sheet-tablet.css    Adaptations à l'écran : tablettes 768–1100 px, écrans tactiles, grands écrans
├── subclass.css        Capacités de sous-classe, aptitudes de base, choix de sous-classe
├── fold.css            Pastilles de repli des blocs (js/ui/fold.js)
├── companions.css      Cartes des compagnons de sous-classe
├── components.css      Boutons, fenêtres, auto-complétion, cases des tableaux (partagés)
├── toolbar.css         Barre « Gestion », mode cinéma, fenêtres d'import / export
├── account.css         Compte en ligne, « Mes personnages », questions de synchronisation
├── help.css            Pour découvrir la fiche : mode d'emploi, fenêtre « Nouveautés »,
│                       personnages d'exemple
├── gallery.css         Fond d'écran, opacité de la fiche, galerie
├── weapons.css · armors.css · spells.css · rest.css · style-editor.css
├── conditions.css · origins.css   Encadrés « États » (onglet 1) et « Espèce & historique » (onglet 2)
├── hit-points.css      PV en jeu : boutons − / + des cases PV, bouton « Dégâts / Soins »
├── stepper.css         Boutons − / + et pavé de chiffres (PV, XP, compteurs, bourse)
├── level-up.css        Bouton « Passer au niveau N » et sa fenêtre
├── magic.css           Armes et armures magiques (+1 à +3 de plus en plus marqués, enchantement)
├── motion.css          Mouvements (ouverture en cascade, onglets, survol, thème, cinéma) ;
│                       seule règle autorisée à utiliser !important : « Sans animation »
├── feedback.css        Réactions au jeu (Rage, jauge de PV, valeurs qui changent)
└── print.css           Impression A4 (media="print") : la fiche, ou le mode d'emploi quand sa
                        fenêtre est ouverte (<html data-print="help">)
js/
├── boot-theme.js       Thème et choix « Sans animation » mémorisés, posés avant le premier
│                       affichage (pas de flash clair)
├── main.js             Démarrage de l'application (une étape en échec n'empêche ni la barre
│                       Gestion ni l'enregistrement), branchement de l'enregistrement automatique
├── version.js          Version de la page, toujours égale à celle de package.json (testé) :
│                       ui/update.js la compare au site en ligne pour installer une mise à jour
├── data/               Données du jeu (objets exportés ; seul spells.js charge un fichier)
│   ├── constants.js    Caractéristiques, compétences, fonds par défaut
│   ├── dd-rules.js     Classes, sous-classes (dont Odyssée), espèces, historiques,
│   │                   destins héroïques, emplacements de sorts, armes
│   │                   (noms du Manuel français ; anciens noms dans aliasesFr, lus par namesOf)
│   │                   ; anciens noms d'armes dans RENAMED_WEAPONS (« Bâton » → « Bâton de combat »)
│   ├── class-progression.js  Aptitudes de base des 12 classes par niveau (résumés) et
│   │                   colonnes de leur table (Rages, sorts mineurs, sorts préparés…)
│   ├── equipment.js    Armures
│   ├── tools.js        Outils du manuel (37, par catégorie, caractéristique) ; outil de chaque historique
│   ├── help.js         Textes du mode d'emploi (rubriques → entrées { title, text }) ; tout libellé
│   │                   cité entre « » doit exister dans l'interface (tests/help.test.js)
│   ├── whats-new.js    « Nouveautés » : 3 à 6 lignes par version, la plus récente d'abord ; une
│   │                   entrée par version publiée (testé pour la version de version.js)
│   ├── status-bar.js   Place de la barre du haut en caractères (STATUS_ROOM, STATUS_ROOM_OPEN,
│   │                   STATUS_ROOM_NARROW, statusRoom), seule définition : une mesure d'écran
│   │                   (à ne pas confondre avec ui/status-bar.js)
│   ├── conditions.js   Les 15 états du manuel (noms français, résumé de leurs effets)
│   ├── faith-favors.js Faveurs divines des points de Foi (1, 3, 5 points), prière et sacrifice
│   │                   (guide du MJ de l'Odyssée p. 92) ; dieux de Thyléa, domaine et faveurs
│   │                   (guide du joueur p. 9-10, fiche de la table) ; résumés avec nos mots
│   ├── examples.js     Personnages d'exemple fictifs (Guerrier 3, Magicienne 5), au format de la fiche
│   ├── feats.js        Dons (Origine, Général, Style de combat, Épique)
│   ├── feat-spells.js  Sorts permis par les dons à sorts (tirés de data/spells.json, testés)
│   ├── species-traits.js  Traits des 10 espèces du Manuel des joueurs (résumés), options
│   │                   (lignages, ascendances, héritages) et sorts d'espèce
│   ├── weapon-masteries.js  Bottes d'armes (Weapon Mastery, PHB 2024) : textes et règles
│   ├── subclass-features.js  Capacités des 60 sous-classes (48 du PHB 2024, 12 de l'Odyssée)
│   ├── subclass-spells.js    Sorts toujours préparés donnés par une sous-classe
│   ├── subclass-choices.js   Menus des choix de sous-classe à mémoriser (lot 7)
│   ├── subclass-companions.js  Blocs constants des compagnons et familiers de sous-classe
│   ├── maneuvers.js    Manœuvres du Maître de guerre, outils du Disciple martial
│   └── spells.js       Chargement à la demande de data/spells.json
├── rules/              Règles D&D 2024 : fonctions pures, testées
│   ├── identity.js     Reconnaissance de la classe (classSlug) : une seule lecture du nom de
│   │                   classe pour toute la fiche (réexportée par character.js)
│   ├── numbers.js      signed (« +3 », « -1 ») et rollDie (hasard fourni par l'interface),
│   │                   seules copies de toute la fiche (dom.js et wild-magic.js les réexportent)
│   ├── logic.js        Calculs élémentaires (modificateurs, maîtrise, armes, ressources)
│   ├── character.js    Statistiques dérivées d'une fiche complète (deriveCharacter, computeWeapon)
│   ├── weapons.js      Tableau des armes (filtres, bonus de combat, configuration) ; rageLit :
│   │                   halo de Rage éteint quand la Rage est sans effet (ui/feedback.js)
│   ├── rage.js         Rage et armure lourde (manuel p. 51) : rageBlockedByArmor, rageInEffect,
│   │                   rageArmorWarning ; le bouton n'est jamais éteint, ses effets ne comptent pas
│   ├── weapon-extras.js  « Dégâts en plus » d'une arme écrits par le joueur (validation, lecture
│   │                   tolérante, ajout aux dégâts, pastille allumée / éteinte, repos long)
│   ├── class-features.js  Capacités de classe calculées (Aura de protection, Touche-à-tout,
│   │                   Défense sans armure de sous-classe) et maîtrise des armes
│   ├── armors.js       Tableau des armures (types, ligne d'armure) ; le calcul de CA est dans
│   │                   character.js (computeArmorClass, armorLine), réexporté ici
│   ├── armor-picker.js  Liste des armures à parcourir (bouton ▾, 4.47.0) : les quatre groupes de
│   │                   la table des armures du manuel (légères, intermédiaires, lourdes, boucliers)
│   ├── weapon-masteries.js  Bottes d'armes : botte d'une arme, effet affiché
│   ├── weapon-picker.js  Liste des armes à parcourir (bouton ▾, 4.47.0) : les quatre groupes de
│   │                   la table des armes du manuel, puis l'Attaque à mains nues ; ✓ sans griser
│   ├── spells.js       Grimoire (recherche, tri, filtres, emplacements de sorts)
│   ├── spell-picker.js Liste des sorts à parcourir depuis la case du nom (par niveau, liste choisie)
│   ├── spell-preparation.js  Sorts préparés (classes à liste fixe ou à toute la liste) et
│   │                   lancement d'un sort (fenêtre « Lancer »)
│   ├── spellbook.js    Livre de sorts du Magicien (sorts sans dépense, coût d'une copie)
│   ├── feats.js · feat-effects.js · feat-uses.js · feat-choices.js
│   │                   Dons : emplacements atteints, effets, usages dépensés, choix mémorisés
│   ├── feat-effects/   Effets des dons, une famille par fichier (feat-effects.js les rassemble
│   │   │               dans FEAT_RULES et garde FEAT_ZONES, featEffects, restFeatNotes)
│   │   ├── helpers.js  Outils partagés (DD, PV de Robuste, formations d'armures, notes « à la place »…)
│   │   ├── general.js  Dons d'origine et généraux
│   │   ├── epic.js     Faveurs épiques
│   │   ├── lot7.js     Dons du lot 7 (Athlète, Bagarreur de tavernes, Tireur d'élite…)
│   │   ├── fighting-styles.js  Styles de combat (et Combattant béni / druidique)
│   │   ├── choice-notes.js     Notes des choix mémorisés (choiceNotes)
│   │   └── weapon-notes.js     Rappels sous chaque arme (weaponFeatNotes)
│   ├── feat-spells.js  Sorts donnés par un don (lot 6) : DD du don, lancers gratuits
│   ├── free-casts.js   Lancers gratuits proposés par « Lancer » : relie un sort aux cases
│   │                   existantes (dons, espèce, Ennemi juré, quelques sous-classes)
│   ├── rest.js         Repos court et repos long
│   ├── conditions.js   États cochés (clé facultative « conditions ») et rappel de leurs effets
│   ├── species.js      Espèce : option choisie (clé facultative « species_choices »), Vision dans
│   │                   le noir, Résistances, Souffle, sorts d'espèce, cases des traits limités
│   ├── background.js   Historique : ce qu'il donne, ce qui manque (« À vérifier »), bouton Appliquer
│   ├── tools.js        Case « Outils » (texte libre) : reconnaître, ajouter, retirer un outil du manuel
│   ├── class-reminders.js  Rappels des capacités de classe près des valeurs (Sens du danger…)
│   ├── concentration.js  Sort de concentration (clé facultative « concentration »), jet après dégâts
│   ├── hit-points.js   PV en jeu : dégâts, soins, PV temporaires, boutons − / + (écran : ui/hit-points.js)
│   ├── class-progression.js  Aptitudes atteintes / à venir, sorts mineurs et préparés permis
│   ├── experience.js   XP : seuils de niveau, XP restants, XP gagnés
│   ├── counters.js     Compteurs − / + (Épuisement, Foi ou Inspiration, renommée) et pièces (Bourse).
│   │                   readCounter : seule lecture d'une case « N » ou « N/M » (entier de 6 chiffres
│   │                   au plus ; vide = 0 ; le reste est du texte libre, jamais réécrit) ;
│   │                   stepCounter : décision des boutons − / + (ui/counters.js ne décide rien) ;
│   │                   readCount reste pour les montants (bourse, XP)
│   ├── level-up.js     Assistant « Passer au niveau N » : ce qui change, PV gagnés, modification
│   │                   appliquée (niveau, PV max, PV actuels sur demande ; écran : ui/level-up.js)
│   ├── subclass-features.js  Capacités de sous-classe atteintes ou à venir, ce que la fiche en
│   │                   fait (SUBCLASS_AUTOMATION), sorts de sous-classe
│   ├── subclass-calcs.js  Petits calculs (Initiative, compétences, armes, critiques) et rappels
│   │                   près des valeurs (zones de featEffects)
│   ├── subclass-combat.js  Boutons de combat et dés des sous-classes, notes de CA et de défense
│   ├── subclass-uses.js  Capacités à usages limités (clé facultative « subclass_uses »)
│   ├── subclass-choices.js  Choix de sous-classe mémorisés (clé facultative « subclass_choices »)
│   ├── subclass-forms.js  Formes du Cercle de la Lune et du Cercle des Étoiles
│   ├── subclass-companions.js  Cartes des compagnons (clé facultative « subclass_companions »)
│   ├── epic-poem.js    Collège de poésie épique (Odyssée) : strophes, rang du poème
│   ├── odyssey.js      Mode Odyssée réglé fiche par fiche (clé facultative « odyssey_mode ») : ce qui
│   │                   est proposé dans les listes, ce que la fiche garde, encadré de l'onglet 3,
│   │                   « Points de Foi » (maîtrise + Sagesse par niveau) ou « Inspiration héroïque »
│   │                   (une seule), phrases pour le joueur ; pièce « Inspiration héroïque »
│   │                   (inspirationCoin, inspirationCoinPatch, 4.47.0) : sous les points de Foi en
│   │                   mode actif (clé facultative « odyssey_inspiration »), à la place de la case
│   │                   en mode coupé ;
│   │                   fenêtre des faveurs (faithWindow, payFavor, spendFaith)
│   ├── wild-magic.js   Sorcellerie sauvage : Bouffée (d20) et table (d100)
│   ├── plain-text.js   plainText(value, { spaced, squash }) et decodeEntities : seule lecture en
│   │                   texte brut du HTML des anciennes saisies (rules, state/migrate.js, ui, cloud ;
│   │                   une garde de tests/plain-text.test.js refuse toute copie de l'expression)
│   └── gallery.js      Réglages d'apparence (validation des fonds, _visual_prefs)
├── cloud/              Sauvegarde en ligne (Supabase, même table que la v3)
│   ├── client.js       Client Supabase (clé publique ; sécurité par RLS)
│   ├── repository.js   Lecture, création seule, mise à jour / suppression conditionnelles
│   ├── sync.js         Décisions pures (vérification, empreinte du contenu, bascule v3) ; ce que
│   │                   la v3 efface (V4_ONLY_KEYS, LEGACY_ERASED, legacyErasedText) ; comparaison
│   │                   avec une sauvegarde v3 (comparableWithV3, V3_WEAPON_FIELDS)
│   └── controller.js   Synchronisation complète, sans DOM (testée scénario par scénario) ;
│                       isBlankCharacter (fiche vierge, jamais envoyée ni liée au compte)
├── state/              Données du personnage
│   ├── schema.js       Format de la fiche (champs, valeurs par défaut) ; OPTIONAL_KEY_DEFAULTS :
│   │                   clés facultatives v4 jamais dans la fiche vierge (odyssey_inspiration)
│   ├── migrate.js      Conversion de toute ancienne sauvegarde vers le format courant,
│   │                   reprise de l'état de jeu que la v3 gardait à part dans le navigateur
│   ├── store.js        Source unique de vérité + abonnements
│   ├── persistence.js  localStorage (mêmes clés que la v3), copie de secours d'une sauvegarde
│   │                   illisible, fichiers JSON (un JSON qui n'est pas une fiche est refusé)
│   ├── local-save.js   Enregistrement automatique dans le navigateur et reprise de la fiche
│   │                   enregistrée par un autre onglet (sans DOM, testé avec plusieurs onglets)
│   ├── snapshots.js    Sauvegardes de secours datées (10 derniers états, sur l'appareil seulement ;
│   │                   écran « Revenir à… » : ui/snapshots.js). Un état pris sur une fiche gardée
│   │                   dans ce navigateur seulement (exemple) le retient : y revenir ne l'envoie pas au compte
│   ├── update-check.js Comparaison de versions et fichiers à redemander (mises à jour : ui/update.js)
│   ├── whats-new.js    Quelles nouveautés montrer sur cet appareil (dernière version vue retenue
│   │                   dans le navigateur, dd2024_seen_version ; pure, testée)
│   ├── examples.js     Liste et copie neuve d'un personnage d'exemple (passée par migrate.js)
│   └── other-tab.js    Fiche enregistrée par un autre onglet : reprise et fusion (pure)
└── ui/                 Interface (un module par fonctionnalité, initialisé par main.js)
    ├── sheet.js        Construit la fiche, relie chaque champ data-field au store,
    │                   affiche les valeurs calculées (data-out)
    ├── tabs.js · theme.js · lock.js · toolbar.js · account.js · gallery.js
    ├── status-bar.js   Dernier message de la barre du haut (#save-status) lisible au doigt : petite
    │                   flèche quand il est coupé, toucher pour le déplier ou le replier (isClipped)
    ├── armors.js · rest.js · style-editor.js   (armors.js : bouton ▾ de la liste des armures, 4.47.0)
    ├── weapons.js      Tableau des armes, chef d'orchestre (247 lignes) : structure fixe, filtres,
    │                   lecture et écriture de la fiche, verrou, rendu ; seul export : initWeapons
    ├── weapons/        Morceaux du tableau des armes (4.46.0). Ils ne partagent aucune variable :
    │   │               l'état commun (rows, filter, pinnedRow) et les gestes communs (updateRow,
    │   │               refresh, deleteWeapon, setStatus, store) passent par l'objet ctx créé par
    │   │               initWeapons et donné à chaque fonction
    │   ├── shared.js   Contexte WeaponsContext, colonnes, petits textes (plain, fitStatus,
    │   │               weaponInSentence)
    │   ├── rows.js     Lignes : construction (buildRow, auto-complétion du nom, bouton ▾ de la liste
    │   │               des armes) et réécriture
    │   │               (refreshRows : valeurs calculées, aspect magique, rappels des dons, botte)
    │   ├── damage.js   Case des dégâts, détail sous l'arme (toggleDamageDetail), pastilles « À allumer »
    │   ├── buffs.js    Bonus de combat (Rage…, BUFF_DEFS), avertissement Rage en armure lourde
    │   ├── edit.js     Ajouter, supprimer (confirmation), « Annuler la suppression » pendant 10 s
    │   ├── config.js   Fenêtre « Configuration de l'arme » (openConfig) et bouton « Appliquer » ;
    │   │               quitter sans appliquer un changement demande confirmation (4.47.0)
    │   ├── config-extras.js  Rubrique « Dégâts en plus » de cette fenêtre (createExtrasEditor)
    │   └── mastery.js  Fenêtre de la règle d'une botte d'arme (openMastery), lecture seule
    ├── spells.js       Grimoire, chef d'orchestre (452 lignes) : crée le contexte partagé,
    │                   assemble les morceaux, décide quelles lignes afficher (renderRows), supprime
    │                   un sort (deleteRow), tient les abonnements ; seul export : initSpells
    ├── spells/         Morceaux du grimoire. Ceux du tableau (découpage de la 4.46.0) reçoivent le
    │   │               contexte « g » en premier argument : rien de global, un réaffichage complet
    │   │               passe par g.redraw()
    │   ├── context.js  Contexte partagé (createGrimoireContext : filtre, tri, vue, base de sorts,
    │   │               lignes, saisie en cours) et flash
    │   ├── table.js    En-tête et tri, rangement des lignes, message « aucun sort », « Ajouter un sort »
    │   ├── rows.js     Une ligne du tableau (createRow, writeRow, writePrep, verrou, infobulle)
    │   ├── entry.js    Saisie et brouillon (editRow, clearEntry, settleDraft)
    │   ├── picker.js   Liste des sorts d'une ligne (suggestions, bouton ▾)
    │   ├── cast.js     Fenêtre « Lancer » (castSpell, castRowAt)
    │   ├── book.js     Livre du Magicien (ligne « Livre », « Rituels du livre »)
    │   ├── notice.js   Grimoire replié d'un personnage sans magie (createGrimoireNotice), place
    │   │               des cases d'incantation
    │   ├── prefs.js    Réglages retenus sur l'appareil
    │   ├── tooltip.js  Bulle d'un sort
    │   ├── filters.js  Barre de recherche et filtres
    │   ├── slots.js    Emplacements de sorts
    │   ├── granted.js  Sorts donnés par les dons, la sous-classe et l'espèce
    │   ├── prepare.js  Fenêtre « Préparer mes sorts »
    │   └── cleanup.js  Bouton « Retirer les sorts non préparés »
    ├── derived.js      deriveCharacter calculé une fois par version du personnage, partagé
    ├── fold.js         Blocs repliables (sous-classe, compagnons, sorts de sous-classe), retenus
    │                   sur l'appareil seulement
    ├── wild-magic.js   Boutons de la Bouffée de Sorcellerie sauvage (onglet Combat)
    ├── motion.js · feedback.js · ornaments.js
    ├── motion-pref.js  Animations en marche ou coupées (appareil ou bouton « Sans animation »,
    │                   retenu sur l'appareil, jamais dans la sauvegarde)
    ├── magic.js        Aspect des armes et armures magiques (pastille, décors, enchantement)
    ├── calc-bubble.js  Bulle de calcul : détail d'une valeur calculée (CA d'une armure, écusson CA)
    ├── class-progression.js · experience.js · counters.js · companions.js · subclass.js
    ├── species.js · background.js   Encadré « Espèce & historique » (css/origins.css)
    ├── tools.js        Fenêtre « Choisir dans la liste » de la case Outils (css/tab-skills.css)
    ├── help.js         Fenêtre « Mode d'emploi » (sommaire, rubriques, impression de la notice)
    ├── whats-new.js    Fenêtre « Nouveautés de la version X » après une mise à jour (annoncée
    │                   par update.js ; jamais par-dessus une autre fenêtre)
    ├── examples.js     Fenêtre « Essayer un personnage d'exemple » : fiche remplacée gardée dans
    │                   « Revenir à… », exemple non lié au compte (cloud/controller.js, source « example »)
    ├── conditions.js   Encadré « États » de l'onglet Combat (css/conditions.css)
    ├── concentration.js  Ligne « Concentration » de l'encadré États (css/conditions.css)
    ├── hit-points.js   PV en jeu : boutons − / + des cases PV et pavé « Dégâts / Soins »
    ├── level-up.js     Bouton « Passer au niveau N » et sa fenêtre
    ├── snapshots.js    Bouton « Revenir à… » : sauvegardes de secours datées de l'appareil
    ├── odyssey.js      Case « Mode Odyssée » du menu « Gestion » (css/toolbar.css), encadré Odyssée
    │                   de l'onglet 3 caché quand il est inutile, case « Points de Foi » et sa
    │                   pastille « +5 par niveau » (qui ouvre la fenêtre des faveurs, puis celle
    │                   des dieux de Thyléa, avec ses boutons « Dépenser »), pièce « Inspiration
    │                   héroïque » sous la pastille ; ou, mode coupé, la pièce seule à la place de la case
    ├── stepper.js · number-pad.js   Boutons − / + à appui long (autour de la case, ou petits autour
    │                   de son titre : option around, 4.47.0) et pavé de chiffres (partagés)
    ├── modal.js · autocomplete.js · cell-text.js · dom.js   (briques partagées ; openModal : onDismiss
    │                   pour demander avant de quitter sans agir ; autocomplete : mode parcourir)
    ├── boot-notices.js Avis du démarrage (mise en forme indisponible, sauvegarde illisible)
    └── sanitize.js     Nettoyage du texte riche via DOMPurify (sans attribut data-* ni aria-*)
data/spells.json        Base de sorts (chargée à la demande)
assets/backgrounds/     Fonds d'écran WebP fournis
dev/preview.html        Outil de capture : charge une fiche d'exemple (localhost seulement) ; sans
                        fenêtre « Nouveautés », sauf &news=<dernière version vue> ou &news=none
dev/validation.html     Ancienne page de validation des étapes 0 à 2 (lecture d'une fiche)
dev/polices.html        Échantillons de polices pour les textes longs (choix fait : Alegreya)
scripts/serve.js        Serveur local (npm run dev) : n'écoute que cet ordinateur (127.0.0.1, ::1),
                        ne sert jamais .git (tests/serve.test.js)
scripts/check.js        Garde-fous (npm run check) : syntaxe, imports, HTML sans gestionnaire inline,
                        pas de !important, encodage, serveur réservé à l'ordinateur (contrôle 5,
                        forme listen(port, hôte) ou listen({ host })), aucune couleur en dur dans
                        les .css (contrôle 6 : #hex, rgb()/hsl()… à canaux fixés, color(), noms de
                        couleur ; permis : lignes --nom: …, couleurs construites avec var(),
                        transparent, currentColor ; exception : les masques), puis les tests
tests/                  Tests Node (npm test) ; tests/fixtures/local/ = vraies sauvegardes, non publiées
supabase/policies.sql   Règles de sécurité de la base (inchangées depuis la v3)
docs/FEUILLE_DE_ROUTE.md Feuille de route : ce qui reste à faire, décisions qui valent pour la suite
docs/JOURNAL_DE_BORD.md Journal des sessions (« En ce moment » + une entrée par session)
docs/CHANGELOG.md       Détail des changements, version par version
docs/etudes/            Études terminées (dons actifs, sous-classes), le code y renvoie
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
  enregistrant les clés qu'elle ne connaît pas : `V4_ONLY_KEYS` (`js/cloud/sync.js`), soit `combat_buffs`,
  `spell_slots_state`, `feat_uses`, `feat_choices`, `subclass_uses`, `subclass_choices`, `subclass_companions`,
  `conditions`, `species_choices`, `concentration`, `odyssey_mode`, `odyssey_inspiration` et les emplacements
  de dons propres à la v4 (`feat_0`, `feat_2`, `feat_6`, `feat_7`, `feat_10`, `feat_14`, déduits de
  `js/state/schema.js`). Chacune a un libellé dans `LEGACY_ERASED` (phrase de la fenêtre « Modifié par
  l'ancienne version », `legacyErasedText`) : une clé ajoutée à `V4_ONLY_KEYS` sans libellé fait échouer
  `tests/v3-compare.test.js`. La comparaison avec une sauvegarde v3 (`comparableWithV3`) ignore
  `_visual_prefs` et ne garde de chaque arme que les 9 champs que la v3 enregistre (`V3_WEAPON_FIELDS`).
- Clés propres à la v4 : `combat_buffs` (bonus de combat actifs), `spell_slots_state` (emplacements
  de sorts) et `feat_uses` (usages dépensés des dons à cases, `{ idDuDon: nombre }`, facultative :
  absente = rien de dépensé ; `js/rules/feat-uses.js`) et `feat_choices` (choix des dons : caractéristique,
  compétence, type de dégâts, sorts choisis par leur nom anglais, `{ "niveau": { idDuDon: { champ: valeur } } }`,
  facultative ; `js/rules/feat-choices.js`). Les lancers gratuits des sorts de dons sont dans `feat_uses`, sous
  des clés `"idDuDon@niveau:partie"` (0 ou 1 ; `js/rules/feat-spells.js`) ; la fiche n'écrit jamais ces sorts
  dans `dynamic_spells`. En v3, cet état était gardé à part dans le navigateur (`combat_buffs`, `spell_slots`) :
  la v4 le reprend une fois, dans la fiche v3 du navigateur (`importV3DeviceState`).
- `odyssey_mode` : mode « Odyssée des Seigneurs Dragons » de la fiche (`js/rules/odyssey.js`). Facultative :
  absente, ou toute autre valeur que `"off"`, = mode actif. Elle n'est jamais dans la fiche vierge
  (`migrate.js` y ajoute les valeurs par défaut) et n'est écrite que quand le joueur décoche la case « Mode
  Odyssée » du menu « Gestion » (`"off"`) ; recocher la retire (valeur `undefined` dans le store, jamais
  enregistrée ni comptée dans l'empreinte) : une fiche sans la clé garde la même empreinte, une fiche
  décochée puis recochée la retrouve. Elle fait partie de `V4_ONLY_KEYS`. Mode coupé, les espèces, les sous-classes et le style de
  combat marqués `source: "Odyssée"` (`js/data/dd-rules.js`, `js/data/feats.js`) ne sont plus proposés
  (`proposedSpecies`, `proposedSubclasses`, `hiddenFeatIds`, listes refaites par `renderDynamicSelects` de
  `js/ui/sheet.js`, phrase de `js/rules/level-up.js`) ; ce que la fiche utilise déjà reste dans ses listes
  et aucun calcul ne change. Une fiche vierge au mode coupé reste une fiche vierge (`isBlankCharacter`,
  `js/cloud/controller.js`).
- `odyssey_inspiration` (4.46.0) : Inspiration héroïque notée à part des points de Foi, mode Odyssée actif
  (`"1"` = disponible ; absente ou toute autre valeur, même un objet piégé, = non disponible :
  `odysseyInspirationLit`). Depuis la 4.47.0, une pièce sous les points de Foi pour tous les personnages.
  Mode coupé, la pièce écrit `heroic_inspiration` (`"1"` ou `"0"`, au toucher seulement ; une case
  « N/M » garde sa forme, « 0/3 » ↔ « 1/3 » ; une case en texte libre garde sa case et n'a pas de pièce,
  et la garde aussi tant qu'on y écrit). Même traitement que `odyssey_mode` : jamais dans la fiche vierge (valeur par
  défaut `''` dans `OPTIONAL_KEY_DEFAULTS`, `js/state/schema.js`), écrite quand le joueur allume le bouton,
  retirée quand il l'éteint (empreinte inchangée), dans `V4_ONLY_KEYS` et parmi les champs utilisables
  fiche verrouillée (`js/ui/lock.js`).
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
  `faveur_de_recuperation_rempart` : Baroud d'honneur, `faveur_du_destin`). Un compteur a sa propre clé
  quand un don en a plusieurs (champ `feat` de FEAT_COUNTERS).
- Attaque à mains nues : une entrée du catalogue `DD_RULES.weapons` (catégorie « Mains nues », hors table
  des armes du Manuel), reconnue par `isUnarmedStrike` (`js/rules/weapons.js` : sa catégorie, ou son nom).
  `computeWeapon` choisit son dé (Arts martiaux du Moine, Bagarreur de tavernes 1d4, style Combat à mains
  nues 1d6) ; les rappels réservés aux armes n'y sont pas (`WEAPON_ONLY_FEATS`, `feat-effects.js`). Arts
  martiaux (Moine sans armure ni bouclier, armes de Moine de corps à corps et mains nues) : dé seulement
  s'il est plus gros que celui de l'arme, Dextérité par `weaponStatOverride` (`js/rules/character.js`),
  partagée avec les bottes d'armes.
- Capacités de classe et maîtrise des armes (`js/rules/class-features.js`, lot A) : Aura de protection
  (Paladin 6) et Touche-à-tout (Barde 2) sont comptées par `deriveCharacter` (`saves[id].aura`,
  `skills[id].jack`) et expliquées par des notes `classFeature: true` mêlées aux notes des dons
  (`classFeatureNotes`, zones `saves.<id>` et `skills.<id>`). La classe est lue par une seule fonction,
  `classSlug` (`js/rules/identity.js`). La sous-classe est lue par `subclassId` pour `deriveCharacter`
  (nom du menu, nom anglais, saisie libre sans accents) et tout ce qui part de `derived.subclass`, mais
  deux lectures à part restent : `subclassOf` (`js/rules/feats.js`, nom exact sans tenir compte des
  majuscules : dons réservés à une sous-classe, et tableau des armes sans `derived`) et
  `spellcastingSubclass` (`js/rules/spells.js`, Chevalier occulte et Arnaqueur arcanique). Elles ne
  donnent pas toujours le même résultat pour une saisie libre : les réunir changerait la fiche, c'est
  donc laissé à une décision de Franck. `computeArmorClass` prend la meilleure Défense sans
  armure de `unarmoredDefenseOptions` (Barbare, Moine — bouclier permis pour La Voie du bouclier de l'Odyssée —,
  Sorcellerie draconique, Collège de la Danse).
  `weaponProficiency` dit si une arme est maîtrisée (réglage `proficiency` de `weaponConfig`, puis classe
  — `weaponProf` de `dd-rules.js` : `martial`, `martial-light`, `martial-finesse` —, don, sous-classe :
  Collège de la Vaillance, Roublard L'Odysséen dont le trident compte comme Finesse) ;
  sans maîtrise, `computeWeapon` n'ajoute pas le bonus de maîtrise à l'attaque et `weaponFeatNotes` met
  le rappel « Sans maîtrise » en tête des notes de l'arme (pastille ⚠ orange sous le bonus d'attaque).
- Dégâts en plus d'une arme (4.43.0, `js/rules/weapon-extras.js`) : propriété facultative `extraDamage`
  de `weaponConfig`, comme `proficiency` — une liste de 4 lignes au plus `{ dmg, reason, mode }`, `mode`
  valant `always` (« Toujours ») ou `toggle` (« À allumer »), plus `on: true` quand la pastille est
  allumée. Absente quand l'arme n'a aucun dégât en plus : `weaponConfig` est alors celui d'avant. Aucune
  clé au premier niveau de la fiche, aucune clé en plus dans la ligne d'arme. L'état allumé est rangé
  dans la ligne de l'arme, pas dans `combat_buffs` : il suit l'arme quand une ligne est retirée, rétablie
  ou filtrée, et `planLongRest` l'éteint avec les bonus de combat (`clearExtraDamageOn`, qui ne réécrit
  `dynamic_weapons` que si une pastille était allumée). `computeWeapon` ajoute les lignes comptées à la
  fin du texte des dégâts (`activeExtraDamage`) ; une arme hors manuel (`computeWeapon` null) les montre
  par `offBookDamage`. Lecture tolérante : une ligne illisible est ignorée, jamais corrigée par
  l'affichage, la bascule d'une pastille ou le repos ; seul « Appliquer » dans la fenêtre de réglage
  réécrit la liste (lignes lisibles et propriétés connues seulement). À l'écran (`js/ui/weapons/damage.js`),
  chaque dégât en plus tient sur une ligne de la case des dégâts, abrégé par « … » à toutes les
  largeurs ; toucher la case écrit les dégâts en entier dans la ligne placée sous l'arme, sous les
  pastilles (`toggleDamageDetail` : simple affichage, rien n'est enregistré). La barre du haut tient
  sur une ligne : les phrases des armes n'y citent l'arme que si elles y tiennent (`fitStatus`,
  `js/ui/weapons/shared.js` ; place : `js/data/status-bar.js`).
  La v3 recopie `weaponConfig` tel quel à chaque enregistrement ; seul SON réglage de
  l'arme, s'il est appliqué, réécrit les quatre propriétés d'origine et fait donc perdre `proficiency`
  et `extraDamage` de cette arme.
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
