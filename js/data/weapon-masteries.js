// =============================================================================
// WEAPON-MASTERIES.JS - Bottes d'armes (« Weapon Mastery Properties ») D&D 2024
// Textes : traduction fidèle du Player's Handbook 2024 anglais (« Mastery Properties »).
// Pages : celles du Manuel des joueurs français (photos de Franck, ..\Ressources\Photos Manuel des
// joueurs FR\, INDEX.md), affichées dans la fenêtre d'une botte :
//  - les huit bottes : chapitre 6, « Propriétés botte », p. 214 (Equipement_02) ; table des armes
//    p. 215 (Equipement_03) ;
//  - don Maître d'armes : p. 206 (Dons_08) ;
//  - capacité de classe Bottes d'arme : Barbare p. 51, Guerrier p. 105, Paladin p. 147, Rôdeur
//    p. 157, Roublard p. 167 ; Botte tactique (Guerrier niveau 9) : p. 106.
// Distances converties en mètres et écrites en toutes lettres comme dans feats.js (5 ft = 1,50 mètre,
// 10 ft = 3 mètres), avec une espace insécable (\u00A0) entre le nombre et l'unité pour qu'ils ne
// soient jamais séparés en fin de ligne ; termes repris de feats.js (action Attaque, action Bonus,
// Avantage, Désavantage, état À terre, Vitesse, Repos long).
// Les noms français (name) sont ceux de la colonne « Botte d'arme » du manuel (dd-rules.js).
// =============================================================================

/** Phrase d'introduction des bottes (Manuel des joueurs français, p. 214) */
export const WEAPON_MASTERY_INTRO = "Chaque arme possède une botte, qui n'est utilisable que par un personnage doté d'une capacité, comme Bottes d'arme, qui lui donne accès à cette botte.";

/**
 * Les huit bottes, dans l'ordre alphabétique anglais du manuel.
 * desc : HTML simple (<br> sépare les paragraphes), comme js/data/feats.js.
 */
export const WEAPON_MASTERIES = {
    cleave: {
        name: 'Enchaînement',
        en: 'Cleave',
        page: 214,
        desc: "Si vous touchez une créature avec un jet d'attaque au corps à corps effectué avec cette arme, vous pouvez effectuer un jet d'attaque au corps à corps avec l'arme contre une seconde créature située à 1,50\u00A0mètre ou moins de la première et qui se trouve aussi à votre allonge. Si vous la touchez, la seconde créature subit les dégâts de l'arme, mais vous n'ajoutez pas votre modificateur de caractéristique à ces dégâts, sauf s'il est négatif. <br>Vous ne pouvez effectuer cette attaque supplémentaire qu'une fois par tour."
    },
    graze: {
        name: 'Écorchure',
        en: 'Graze',
        page: 214,
        desc: "Si votre jet d'attaque avec cette arme rate une créature, vous pouvez infliger à cette créature des dégâts égaux au modificateur de caractéristique utilisé pour le jet d'attaque. <br>Ces dégâts sont du même type que ceux infligés par l'arme, et ils ne peuvent être augmentés qu'en augmentant ce modificateur de caractéristique."
    },
    nick: {
        name: 'Coup double',
        en: 'Nick',
        page: 214,
        desc: "Lorsque vous effectuez l'attaque supplémentaire de la propriété Légère, vous pouvez l'effectuer dans le cadre de l'action Attaque au lieu de l'effectuer par une action Bonus. <br>Vous ne pouvez effectuer cette attaque supplémentaire qu'une fois par tour."
    },
    push: {
        name: 'Poussée',
        en: 'Push',
        page: 214,
        desc: "Si vous touchez une créature avec cette arme, vous pouvez la repousser en ligne droite de 3\u00A0mètres au maximum, en l'éloignant de vous, si elle est de taille Grande ou inférieure."
    },
    sap: {
        name: 'Sape',
        en: 'Sap',
        page: 214,
        desc: "Si vous touchez une créature avec cette arme, cette créature a un Désavantage à son prochain jet d'attaque effectué avant le début de votre prochain tour."
    },
    slow: {
        name: 'Ralentissement',
        en: 'Slow',
        page: 214,
        desc: "Si vous touchez une créature avec cette arme et lui infligez des dégâts, vous pouvez réduire sa Vitesse de 3\u00A0mètres jusqu'au début de votre prochain tour. <br>Si la créature est touchée plus d'une fois par des armes dotées de cette botte, la réduction de Vitesse ne dépasse pas 3\u00A0mètres."
    },
    topple: {
        name: 'Renversement',
        en: 'Topple',
        page: 214,
        desc: "Si vous touchez une créature avec cette arme, vous pouvez l'obliger à effectuer un jet de sauvegarde de Constitution (DD 8 plus le modificateur de caractéristique utilisé pour le jet d'attaque et votre bonus de maîtrise). En cas d'échec, la créature a l'état À terre."
    },
    vex: {
        name: 'Ouverture',
        en: 'Vex',
        page: 214,
        desc: "Si vous touchez une créature avec cette arme et lui infligez des dégâts, vous avez un Avantage à votre prochain jet d'attaque contre cette créature avant la fin de votre prochain tour."
    }
};

/**
 * Capacité de classe « Weapon Mastery » (Bottes d'arme), niveau 1, par classe (slug de dd-rules.js).
 * counts : [niveau minimum, nombre de types d'armes] — colonne « Weapon Mastery » des tables
 * de classe (Barbare, Guerrier) ; nombre fixe pour Paladin, Rôdeur et Roublard (pas de colonne).
 * kinds : armes éligibles ; rest : ce qui peut changer après un Repos long ;
 * desc : traduction du texte de la capacité.
 */
export const WEAPON_MASTERY_CLASSES = {
    barbarian: {
        page: 51,
        counts: [[1, 2], [4, 3], [10, 4]],
        kinds: "armes de corps à corps courantes ou de guerre",
        rest: "Après chaque Repos long, vous pouvez changer l'un de ces types d'armes.",
        desc: "Votre entraînement aux armes vous permet d'utiliser les bottes de deux types d'armes de corps à corps courantes ou de guerre de votre choix, comme la hache à deux mains et la hachette. Chaque fois que vous terminez un Repos long, vous pouvez vous exercer au maniement des armes et changer l'un de ces choix. <br>À certains niveaux de Barbare, vous pouvez utiliser les bottes de davantage de types d'armes, comme l'indique la colonne Bottes d'arme de la table Aptitudes du Barbare."
    },
    fighter: {
        page: 105,
        counts: [[1, 3], [4, 4], [10, 5], [16, 6]],
        kinds: "armes courantes ou de guerre",
        rest: "Après chaque Repos long, vous pouvez changer l'un de ces types d'armes.",
        desc: "Votre entraînement aux armes vous permet d'utiliser les bottes de trois types d'armes courantes ou de guerre de votre choix. Chaque fois que vous terminez un Repos long, vous pouvez vous exercer au maniement des armes et changer l'un de ces choix. <br>À certains niveaux de Guerrier, vous pouvez utiliser les bottes de davantage de types d'armes, comme l'indique la colonne Bottes d'arme de la table Aptitudes du Guerrier."
    },
    paladin: {
        page: 147,
        counts: [[1, 2]],
        kinds: "armes que vous maîtrisez",
        rest: "Après chaque Repos long, vous pouvez changer les types d'armes choisis.",
        desc: "Votre entraînement aux armes vous permet d'utiliser les bottes de deux types d'armes de votre choix que vous maîtrisez, comme l'épée longue et la javeline. <br>Chaque fois que vous terminez un Repos long, vous pouvez changer les types d'armes choisis. Par exemple, vous pourriez passer aux bottes de la hallebarde et du fléau d'armes."
    },
    ranger: {
        page: 157,
        counts: [[1, 2]],
        kinds: "armes que vous maîtrisez",
        rest: "Après chaque Repos long, vous pouvez changer les types d'armes choisis.",
        desc: "Votre entraînement aux armes vous permet d'utiliser les bottes de deux types d'armes de votre choix que vous maîtrisez, comme l'arc long et l'épée courte. <br>Chaque fois que vous terminez un Repos long, vous pouvez changer les types d'armes choisis. Par exemple, vous pourriez passer aux bottes du cimeterre et de l'épée longue."
    },
    rogue: {
        page: 167,
        counts: [[1, 2]],
        kinds: "armes que vous maîtrisez",
        rest: "Après chaque Repos long, vous pouvez changer les types d'armes choisis.",
        desc: "Votre entraînement aux armes vous permet d'utiliser les bottes de deux types d'armes de votre choix que vous maîtrisez, comme la dague et l'arc court. <br>Chaque fois que vous terminez un Repos long, vous pouvez changer les types d'armes choisis. Par exemple, vous pourriez passer aux bottes du cimeterre et de l'épée courte."
    }
};

/** Guerrier niveau 9 : Botte tactique (« Tactical Master », p. 106 du Manuel des joueurs français) */
export const TACTICAL_MASTER = {
    name: 'Botte tactique',
    en: 'Tactical Master',
    level: 9,
    page: 106,
    desc: "Lorsque vous attaquez avec une arme dont vous pouvez utiliser la botte, vous pouvez remplacer cette botte par Poussée, Sape ou Ralentissement pour cette attaque."
};

/** Don qui donne accès à une botte (« Weapon Master ») : identifiant de js/data/feats.js */
export const WEAPON_MASTER_FEAT_ID = 'maitre_d_armes';

/** Page du don Maître d'armes dans le Manuel des joueurs français (Dons_08) */
export const WEAPON_MASTER_FEAT_PAGE = 206;
