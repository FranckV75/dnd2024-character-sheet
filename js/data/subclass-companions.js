// =============================================================================
// SUBCLASS-COMPANIONS.JS (données) - Compagnons et familiers des sous-classes (lot 7)
//
// Blocs constants des créatures que donne une sous-classe ; les chiffres qui dépendent du personnage
// (PV, CA, bonus d'attaque, DD, sauvegardes) sont calculés par js/rules/subclass-companions.js.
//  - Maître des bêtes (PHB 2024, p. 122-124) : bête primordiale des terres, des mers ou des cieux ;
//  - Conclave des Amazones (Odyssée, p. 49 et 51) : stimfée, oiseau mécanique ;
//  - Serment du Seigneur Dragon (Odyssée, p. 47 et 49, sort pacte du Seigneur Dragon p. 55) :
//    pseudodragon (PHB 2024, p. 354), puis dragon lié = dragonnet métallique du Manuel des monstres
//    (airain, bronze, cuivre ou argent). Blocs : Manuel des monstres 2024 / SRD 5.2, vérifié le 11/11/2026.
// Distances converties en mètres (1,5 m par case de 5 pieds). Objets seuls, aucune fonction.
// Ordre des caractéristiques : str, dex, con, int, wis, cha.
// =============================================================================

/** Types de dégâts de la Frappe de bête (choix « strike ») : [valeur, libellé du menu, texte des dégâts] */
export const BEAST_STRIKE_TYPES = Object.freeze([
    ['bludgeoning', 'Contondants', 'contondants'],
    ['piercing', 'Perforants', 'perforants'],
    ['slashing', 'Tranchants', 'tranchants']
]);

/**
 * Bêtes primordiales (choix « beast ») : hpBase + hpPerLevel × niveau de Rôdeur PV (autant de dés
 * hitDie) ; Frappe : strikeDie + strikeFlat + Sagesse, types permis strikeTypes.
 */
export const PRIMAL_BEASTS = Object.freeze({
    land: {
        label: 'Bête des terres', size: 'Moyenne', hpBase: 5, hpPerLevel: 5, hitDie: 'd8',
        speed: '12 m, escalade 12 m',
        scores: { str: 14, dex: 14, con: 15, int: 8, wis: 14, cha: 11 },
        senses: 'vision dans le noir 18 m',
        strikeDie: '1d8', strikeFlat: 2, strikeTypes: ['bludgeoning', 'piercing', 'slashing'],
        strikeExtra: 'Charge : si elle s\'est déplacée d\'au moins 6 m en ligne droite vers la cible juste avant de la toucher, +1d6 dégâts du même type, et une cible de taille Grande ou moins est mise À terre.',
        traits: []
    },
    sea: {
        label: 'Bête des mers', size: 'Moyenne', hpBase: 5, hpPerLevel: 5, hitDie: 'd8',
        speed: '1,5 m, nage 18 m',
        scores: { str: 14, dex: 14, con: 15, int: 8, wis: 14, cha: 11 },
        senses: 'vision dans le noir 27 m',
        strikeDie: '1d6', strikeFlat: 2, strikeTypes: ['bludgeoning', 'piercing'],
        grapple: true,
        traits: [['Amphibie', 'Elle respire dans l\'air et sous l\'eau.']]
    },
    sky: {
        label: 'Bête des cieux', size: 'Petite', hpBase: 4, hpPerLevel: 4, hitDie: 'd6',
        speed: '3 m, vol 18 m',
        scores: { str: 6, dex: 16, con: 13, int: 8, wis: 14, cha: 11 },
        senses: 'vision dans le noir 18 m',
        strikeDie: '1d4', strikeFlat: 3, strikeTypes: ['slashing'],
        traits: [['Repli aérien', 'Elle ne provoque pas d\'attaque d\'opportunité quand elle sort en volant de l\'allonge d\'un ennemi.']]
    }
});

/** Apparences de la stimfée (choix « stimfee ») : aucun effet de jeu */
export const STIMFEE_LOOKS = Object.freeze([
    ['eagle', 'Aigle'], ['harrier', 'Busard'], ['falcon', 'Faucon'], ['kite', 'Milan'],
    ['osprey', 'Balbuzard'], ['owl', 'Chouette'], ['archaeopteryx', 'Archéoptéryx']
]);

/**
 * Stimfée (Odyssée, bloc p. 51). Le bonus de maîtrise du Rôdeur s'ajoute à attackBase, aux dés de
 * dégâts et à dcBase (lecture retenue, à confirmer par Franck). PV : 15 + niveau de Rôdeur, puis
 * 30 + niveau (Fauconnière chevronnée, niveau 11).
 */
export const STIMFEE = Object.freeze({
    type: 'Créature artificielle très petite, non alignée',
    ac: 13, hpBase: 15, hpBaseExpert: 30, attackBase: 4, dcBase: 10,
    speed: '3 m, vol 25 m',
    scores: { str: 10, dex: 11, con: 10, int: 6, wis: 8, cha: 7 },
    skills: 'Perception +3',
    senses: 'vision dans le noir 18 m, Perception passive 13',
    immunities: 'feu, poison, psychiques ; états Charmé et Empoisonné',
    languages: 'comprend vos ordres dans toutes les langues ; « parle » par cliquetis que vous seul comprenez',
    traits: [
        ['Vue perçante', 'Avantage aux tests de Sagesse (Perception) fondés sur la vue.'],
        ['Forme immuable', 'Immunisée aux effets qui changent sa forme.'],
        ['Automate de soutien', 'Action : fait boire une potion qu\'elle porte à une créature consentante. Action bonus : stabilise une créature mourante à son contact.'],
        ['Éclaireuse', 'En extérieur, surveille une zone de 1 500 m de rayon pendant 10 minutes, puis vous fait son rapport.'],
        ['Entretien', 'Récupère tous ses PV après un repos long ; détruite, 8 heures de réparation.']
    ]
});

/** Pseudodragon (PHB 2024, p. 354), familier du Serment du Seigneur Dragon : bloc constant */
export const PSEUDODRAGON = Object.freeze({
    type: 'Dragon très petit, neutre bon',
    ac: 14, hp: 10, hitDice: '3d4 + 3', initiative: 2,
    speed: '4,5 m, vol 18 m',
    scores: { str: 6, dex: 15, con: 13, int: 10, wis: 12, cha: 10 },
    skills: 'Perception +5, Discrétion +4',
    senses: 'vision aveugle 3 m, vision dans le noir 18 m, Perception passive 15',
    languages: 'comprend le commun et le draconique sans les parler ; télépathie avec vous à 30 m',
    traits: [
        ['Résistance à la magie', 'Avantage aux jets de sauvegarde contre les sorts et autres effets magiques.']
    ],
    // Un familier ne peut pas attaquer (Appel de familier) : affichées grisées
    actions: [
        ['Attaques multiples', 'Deux Morsures.'],
        ['Morsure', 'Corps à corps +4, allonge 1,5 m. Touché : 4 (1d4 + 2) perforants.'],
        ['Dard', 'Une créature visible à 1,5 m : sauvegarde de Constitution DD 12 ; échec : 5 (2d4) poison et Empoisonnée 1 heure ; échec de 5 ou plus : en plus Inconsciente jusqu\'à subir des dégâts ou être secouée par une action.']
    ]
});

/**
 * Dragonnets métalliques, dragon lié du Serment du Seigneur Dragon (choix « egg »).
 * Source : Manuel des monstres 2024 / SRD 5.2 (CC-BY), vérifié le 11/11/2026 ; noms français des
 * actions : AideDD (version 2024). Les deux sources donnent les mêmes chiffres. Effets résumés.
 * saves : sauvegardes maîtrisées du bloc (les autres = modificateur) ; le Paladin ajoute son bonus de
 * maîtrise à toutes. blockHp : PV du bloc (la fiche affiche ceux de la sous-classe, 40 + 2 × niveau).
 * multiattack : le bloc a Attaques multiples (perdue tant qu'il se bat à vos côtés, pacte).
 * rend : attaque Saignée. breaths[0] : souffle de dégâts (recharge 5-6 dans le bloc) ;
 * breaths[1] : second souffle (sans recharge dans le bloc).
 * youngPassive : Perception passive du jeune dragon (niveau 15, monté).
 */
export const DRAGONLINGS = Object.freeze({
    brass: {
        label: 'Airain', name: 'Dragonnet d\'airain', youngName: 'Jeune dragon d\'airain',
        size: 'Moyen', ac: 15, blockHp: '22 (4d8 + 4)', cr: '1', speed: '9 m, creusement 4,5 m, vol 18 m',
        scores: { str: 15, dex: 10, con: 13, int: 10, wis: 11, cha: 13 },
        saves: { dex: 2, wis: 2 },
        skills: 'Perception +4, Discrétion +2',
        immunity: 'fire', immunityText: 'Immunité au feu', youngPassive: 16,
        multiattack: false,
        traits: [],
        rend: { attack: 4, damage: '1d10 + 2', type: 'tranchants' },
        breaths: [
            { name: 'Souffle de feu', area: 'ligne de 6 m sur 1,5 m', save: 'Dextérité', dc: 11, effect: '4d6 dégâts de feu, moitié en cas de réussite' },
            { name: 'Souffle soporifique', area: 'cône de 4,5 m', save: 'Constitution', dc: 11, effect: 'Neutralisée jusqu\'à la fin de son prochain tour, puis nouvelle sauvegarde ; second échec : Inconsciente 1 minute (prend fin si elle subit des dégâts ou si une créature à 1,5 m la réveille par une action)' }
        ]
    },
    bronze: {
        label: 'Bronze', name: 'Dragonnet de bronze', youngName: 'Jeune dragon de bronze',
        size: 'Moyen', ac: 15, blockHp: '39 (6d8 + 12)', cr: '2', speed: '9 m, nage 9 m, vol 18 m',
        scores: { str: 17, dex: 10, con: 15, int: 12, wis: 11, cha: 15 },
        saves: { dex: 2, wis: 2 },
        skills: 'Perception +4, Discrétion +2',
        immunity: 'lightning', immunityText: 'Immunité à la foudre', youngPassive: 17,
        multiattack: true,
        traits: [['Amphibie', 'Il respire dans l\'air et sous l\'eau.']],
        rend: { attack: 5, damage: '1d10 + 3', type: 'tranchants' },
        breaths: [
            { name: 'Souffle de foudre', area: 'ligne de 12 m sur 1,5 m', save: 'Dextérité', dc: 12, effect: '3d10 dégâts de foudre, moitié en cas de réussite' },
            { name: 'Souffle répulsif', area: 'cône de 9 m', save: 'Force', dc: 12, effect: 'repoussée de 9 m en ligne droite et À terre' }
        ]
    },
    copper: {
        label: 'Cuivre', name: 'Dragonnet de cuivre', youngName: 'Jeune dragon de cuivre',
        size: 'Moyen', ac: 16, blockHp: '22 (4d8 + 4)', cr: '1', speed: '9 m, escalade 9 m, vol 18 m',
        scores: { str: 15, dex: 12, con: 13, int: 14, wis: 11, cha: 13 },
        saves: { dex: 3, wis: 2 },
        skills: 'Perception +4, Discrétion +3',
        immunity: 'acid', immunityText: 'Immunité à l\'acide', youngPassive: 17,
        multiattack: false,
        traits: [],
        rend: { attack: 4, damage: '1d10 + 2', type: 'tranchants' },
        breaths: [
            { name: 'Souffle d\'acide', area: 'ligne de 6 m sur 1,5 m', save: 'Dextérité', dc: 11, effect: '4d8 dégâts d\'acide, moitié en cas de réussite' },
            { name: 'Souffle ralentissant', area: 'cône de 4,5 m', save: 'Constitution', dc: 11, effect: 'jusqu\'à la fin de son prochain tour, Vitesse divisée par deux, pas de réaction, et une action ou une action bonus à son tour, pas les deux' }
        ]
    },
    silver: {
        label: 'Argent', name: 'Dragonnet d\'argent', youngName: 'Jeune dragon d\'argent',
        size: 'Moyen', ac: 17, blockHp: '45 (6d8 + 18)', cr: '2', speed: '9 m, vol 18 m',
        scores: { str: 19, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
        saves: { dex: 2, wis: 2 },
        skills: 'Perception +4, Discrétion +2',
        immunity: 'cold', immunityText: 'Immunité au froid', youngPassive: 18,
        multiattack: true,
        traits: [],
        rend: { attack: 6, damage: '1d10 + 4', type: 'perforants' },
        breaths: [
            { name: 'Souffle glacial', area: 'cône de 4,5 m', save: 'Constitution', dc: 13, effect: '4d8 dégâts de froid, moitié en cas de réussite' },
            { name: 'Souffle paralysant', area: 'cône de 4,5 m', save: 'Constitution', dc: 13, effect: 'Neutralisée jusqu\'à la fin de son prochain tour, puis nouvelle sauvegarde ; second échec : Paralysée, nouvelle sauvegarde à la fin de chacun de ses tours (réussie d\'office au bout de 1 minute)' }
        ]
    }
});

/** Sens communs des dragonnets (Manuel des monstres 2024 / SRD 5.2, vérifié le 11/11/2026) */
export const DRAGONLING_SENSES = 'vision aveugle 3 m, vision dans le noir 18 m, Perception passive 14';
/** Sens des jeunes dragons métalliques (Manuel des monstres 2024 / SRD 5.2, vérifié le 11/11/2026) */
export const YOUNG_DRAGON_SENSES = 'vision aveugle 9 m, vision dans le noir 36 m';
