// =============================================================================
// WHATS-NEW.JS (données) - « Nouveautés » : ce qui change pour le joueur, version par version
//
// Une entrée par version publiée, LA PLUS RÉCENTE EN PREMIER : { version, items } avec 3 à 6
// phrases courtes, adressées au joueur (« vous »), sans mot technique. Les libellés de boutons
// sont écrits entre « » exactement comme à l'écran (vérifié par tests/help.test.js).
// Affichées après une mise à jour (js/ui/whats-new.js, règle js/state/whats-new.js) et dans la
// rubrique « Nouveautés » du mode d'emploi (js/ui/help.js).
// À CHAQUE NOUVELLE VERSION : ajouter son entrée en tête (testé : la version de js/version.js
// doit avoir la sienne).
// =============================================================================

/** @type {ReadonlyArray<{ version: string, items: ReadonlyArray<string> }>} */
export const WHATS_NEW = Object.freeze([
    {
        version: '4.50.0',
        items: [
            "Le bouton « Essayer un personnage d'exemple » propose maintenant un personnage par classe, du niveau 3 au niveau 15, dont un Paladin du Seigneur Dragon avec ses dragons.",
            "Rôdeur des Amazones : les sorts de la Magie des Amazones sont donnés à leur niveau (Injonction, Appel de destrier, Hâte, Confusion, Double illusoire). Ils sont toujours préparés et ne comptent pas dans vos sorts préparés.",
            "Occultiste : le sort d'Arcanum mystique de chaque niveau est toujours disponible et ne compte plus dans vos sorts préparés. Il se lance avec « Lancer gratuit », une fois par repos long.",
            "Mode Odyssée : le chakram est dans la liste des armes. Le style de combat Armes de lancer ajoute bien ses +2 aux dégâts du chakram et de la fléchette."
        ]
    },
    {
        version: '4.49.0',
        items: [
            "Mode Odyssée : la pièce « Inspiration héroïque » a sa propre colonne, à côté des « Points de Foi ». Le haut de l'onglet Combat est moins haut, et le « Bonus de maîtrise » est bien au milieu de sa case.",
            "Points de vie : les petits − et + sont maintenant autour des titres « PV actuels » et « PV temp. », comme pour les Points de Foi. Les PV des compagnons ont les mêmes.",
            "Épuisement : le chiffre est bien au milieu, entre ses deux boutons.",
            "Le titre « Points de renommée » a plus de place entre ses boutons, et le bouclier de la classe d'armure ne s'allonge plus sur tablette."
        ]
    },
    {
        version: '4.48.1',
        items: [
            "Le « Mode d'emploi » a été relu en entier et comparé à la fiche : une dizaine de rubriques fausses ou dépassées sont corrigées (dés de vie, menu « Gestion », bouton « Lancer », sorts donnés…).",
            "D'autres rubriques sont plus courtes : les détails rares sont retirés, la fiche les explique déjà à l'écran.",
            "Nouvelles rubriques : les mises à jour, les dés de vie, les repères dorés des dons, et les boutons − et + des emplacements de sorts (ils changent le nombre, ils ne dépensent rien).",
            "Désormais, le mode d'emploi est relu à chaque nouvelle version."
        ]
    },
    {
        version: '4.48.0',
        items: [
            "Grimoire : nouveau bloc « Sorts de classe » avec une case pour les lancers gratuits du Paladin (Châtiment divin, Appel de destrier) et de l'Occultiste (Arcanum mystique, Contact avec les plans).",
            "Paladin et Rôdeur : « Préparer mes sorts » rappelle qu'on ne change qu'un seul sort par repos long, et montre l'échange en cours.",
            "Magicien : menus pour la Maîtrise des sorts (niveau 18) et les Sorts de prédilection (niveau 20), rappel de la Mémorisation de sort au repos court. Barde du Savoir : menus des Découvertes magiques.",
            "Armures : la liste ▾ a un groupe « Autres » : anneau et cape de protection, bracelets de défense, Armure du mage, Bouclier de la foi… Touchez la CA de la ligne pour lire ses conditions.",
            "Outils : « Appliquer à la fiche » note l'outil précis de votre historique, et la fenêtre des outils montre ce que donnent votre historique et vos dons (Façonneur, Musicien, Doué…)."
        ]
    },
    {
        version: '4.47.1',
        items: [
            'Noms du manuel français, relus sur le livre : Voie du Cœur sauvage « Chouette » et « Coup de bélier » ; Belluaire « bête primitive » et « Frappe de la Bête ».',
            'Révélation incarnée « Perception de l\'invisible » et « Déplacement sinueux » ; Troisième œil du Devin « Compréhension supérieure » et « Détection de l\'invisibilité ».',
            'Dons : « Faveur de Résistance aux énergies », « Soigneur de bataille » (Guérisseur), « Critique renforcé » (Trancheur), et le groupe « Dons : Origines » dans la liste.',
            'Ensorceleur : on écrit « points de Sorcellerie », comme dans le manuel. Les dons d\'origines n\'affichent plus de prérequis : le manuel n\'en met pas.',
            'Vos choix déjà faits sont gardés : seuls les noms affichés changent.'
        ]
    },
    {
        version: '4.47.0',
        items: [
            'L\'Inspiration héroïque est une pièce : dorée avec « Disponible » quand vous l\'avez, vide avec « Non disponible » sinon. Touchez-la pour passer de l\'une à l\'autre.',
            'Mode Odyssée : la pièce est sous les « Points de Foi », pour tous les personnages. Mode décoché, elle remplace la case, sans boutons − et +.',
            'Les boutons − et + des « Points de Foi » et des « Points de renommée » sont plus petits, de part et d\'autre du titre.',
            'Armes et armures : touchez le nom vide ou le bouton ▾ pour choisir dans la liste du manuel, avec les dégâts ou la CA (✓ : déjà dans votre tableau). Un anneau ou une cape s\'écrit toujours à la main.',
            'Dans « Configuration de l\'arme » et les réglages d\'une armure, fermer sans appliquer vos changements demande d\'abord confirmation : « Continuer à modifier » ou « Fermer sans appliquer ».',
            'Noms du manuel français : « Bâton de combat », « Main du mage », « Armure du mage », « Terreur »… (listes de sorts de toutes les classes vérifiées ; Sphère de feu en Évocation). Une arme ou un sort déjà noté sous l\'ancien nom reste reconnu.'
        ]
    },
    {
        version: '4.46.0',
        items: [
            'Mode Odyssée : un Humain, ou un Champion à partir du niveau 10, a un bouton « Inspiration héroïque » sous la case « Points de Foi ». Touchez-le quand vous l\'obtenez, retouchez-le une fois dépensée.',
            'Dans la fenêtre des points de Foi, chaque faveur a son bouton « Dépenser » : il retire 1, 3 ou 5 points de la case. Il est grisé quand il vous manque des points.',
            'Un message de la barre du haut coupé par « … » se lit en entier : touchez-le, puis touchez-le encore pour le replier.',
            'Barbare : en armure lourde, la Rage est sans effet, comme le veut le manuel. Une pastille rouge le dit à côté du bouton, et rien n\'est ajouté aux dégâts.',
            'Impression : le titre de votre classe et le nom de chaque aptitude ne restent plus seuls en bas d\'une page.',
            'Thème sombre : la pastille des armes et armures magiques (+1, +2, +3) prend des couleurs de nuit.'
        ]
    },
    {
        version: '4.45.0',
        items: [
            'Campagne de l\'Odyssée : la case de l\'onglet Combat s\'appelle maintenant « Points de Foi ».',
            'Une pastille dorée sous la case donne vos points de Foi par niveau : bonus de maîtrise plus Sagesse, au moins 1.',
            'Touchez la pastille : une fenêtre liste les faveurs divines à 1, 3 et 5 points, marque celles que vos points permettent et rappelle comment prier ou sacrifier.',
            'Son bouton « Les dieux de Thyléa » rappelle chaque dieu, son domaine et les faveurs qu\'il accorde.',
            '« Passer au niveau » remet vos points de Foi au total du nouveau niveau, par exemple 5/5.',
            'Case « Mode Odyssée » décochée, c\'est « Inspiration héroïque » : une seule à la fois, comme dans le manuel.'
        ]
    },
    {
        version: '4.44.0',
        items: [
            'Menu « Gestion » : une nouvelle case « Mode Odyssée », cochée au départ. Vos fiches s\'ouvrent comme avant, rien n\'y est changé.',
            'Pour une autre campagne, décochez-la (fiche modifiable) : les espèces, les sous-classes et le style de combat de l\'Odyssée ne sont plus proposés dans les listes.',
            'Ce que la fiche utilise déjà reste en place : un Centaure reste un Centaure. La fiche vous dit ce qu\'elle garde, et il suffit de recocher la case pour tout retrouver.',
            'Case décochée, l\'encadré « Odyssée des Seigneurs Dragons » disparaît s\'il est vide.',
            'Ce réglage est enregistré avec chaque personnage : il le suit d\'une tablette à l\'autre.'
        ]
    },
    {
        version: '4.43.1',
        items: [
            'Les points d\'expérience s\'écrivent désormais XP partout dans la fiche.',
            'Sous la case XP, la fiche donne aussi le palier du niveau suivant, par exemple : Encore 1 200 XP avant le niveau 7 (23 000 XP).',
            'Rien ne change dans vos fiches enregistrées : seul l\'affichage est modifié.'
        ]
    },
    {
        version: '4.43.0',
        items: [
            'Armes spéciales : dans la roue dentée d\'une arme (« Configuration de l\'arme »), la rubrique « Dégâts en plus » ajoute jusqu\'à 4 dégâts avec leur raison, par exemple +2d6 contre les dragons.',
            '« Toujours » : le dégât est compté en permanence, à côté des dégâts de l\'arme. « À allumer » : une pastille apparaît sous l\'arme, à toucher quand la condition est remplie, même fiche verrouillée.',
            'Dans le tableau, un dégât en plus trop long est abrégé : touchez les dégâts de l\'arme pour les lire en entier, juste dessous.',
            'Le repos long éteint ces pastilles, comme les autres bonus de combat. Sur papier, les dégâts « À allumer » sont cités sous l\'arme.'
        ]
    },
    {
        version: '4.42.0',
        items: [
            'Grimoire : la mention « Pas d\'emplacement » signale un sort préparé d\'un niveau pour lequel vous n\'avez pas encore d\'emplacement. Rien n\'est décoché.',
            'Bouton « Lancer » : quand un don, votre espèce ou une capacité (Ennemi juré du Rôdeur…) offre le sort sans emplacement, « Lancer gratuit » est proposé en premier et coche la case de cette capacité.',
            'Clerc, Druide, Paladin, Rôdeur : sous le tableau, « Retirer les sorts non préparés » allège le grimoire. La liste vous est montrée avant, et la fiche est gardée dans « Revenir à… ».',
            'Magicien, vue « Au combat » : les rituels du livre non préparés se rangent sous la ligne « Rituels du livre », à déplier d\'un toucher.'
        ]
    },
    {
        version: '4.41.0',
        items: [
            'Un « Mode d\'emploi » dans le menu « Gestion » : la fiche expliquée onglet par onglet, à lire sur la tablette ou à imprimer.',
            '« Essayer un personnage d\'exemple » (menu « Gestion ») : un Guerrier de niveau 3 et une Magicienne de niveau 5, prêts à jouer, pour découvrir la fiche. Votre fiche est gardée dans « Revenir à… » ; pensez à l\'exporter avant.',
            'Outils : sous la case « Outils » (onglet « Compétences & Histoire »), le bouton « Choisir dans la liste » coche vos outils dans la liste du manuel.',
            'Après chaque mise à jour, cette fenêtre vous dit en quelques lignes ce qui a changé.'
        ]
    },
    {
        version: '4.40.0',
        items: [
            'Grimoire, bouton « Au combat » : il ne reste à l\'écran que les sorts utilisables, avec les emplacements restants.',
            'Bouton « Lancer » (vue « Au combat ») : choisissez le niveau d\'emplacement, il est coché pour vous. « En rituel » ne dépense rien.',
            '« Préparer mes sorts » (Clerc, Druide, Paladin, Rôdeur) : cochez vos sorts dans toute la liste de votre classe, après un repos long.',
            'Ajouter un sort au toucher : touchez la case du nom vide (ou le bouton ▾) pour ouvrir la liste des sorts, sans clavier.'
        ]
    }
].map((entry) => Object.freeze({ ...entry, items: Object.freeze(entry.items) })));
