// =============================================================================
// FEAT-EFFECTS.JS (règles) - Effets des dons sur la fiche : notes à afficher par zone
//
// Règle validée par Franck : la fiche ne modifie JAMAIS une valeur saisie à la main
// (caractéristiques, PV max, vitesse). Pour un bonus de don sur une telle valeur, elle
// affiche seulement « dont +X grâce à <don> ». Une valeur déjà calculée par la fiche
// (Initiative, CA, dégâts d'arme, DD) peut intégrer le bonus (voir deriveCharacter et
// computeWeapon dans character.js) : la note le signale alors avec `applied: true`.
//
// Un don ne compte que s'il est choisi dans un emplacement atteint (reachedFeatIds, feats.js).
// Textes vérifiés dans le Player's Handbook 2024 anglais (pages citées pour chaque don) ;
// noms français de js/data/feats.js (traduction AideDD).
//
// Fichier séparé de feats.js pour éviter une dépendance circulaire :
// feats.js ← weapons.js ← character.js ← feat-effects.js ← rest.js
// =============================================================================

import { featSlots, featName, reachedFeatIds } from './feats.js';
import { deriveCharacter } from './character.js';
import { weaponReach, weaponDamageType, isBlankWeapon } from './weapons.js';

/**
 * Note de don affichée dans une zone de la fiche.
 * @typedef {Object} FeatNote
 * @property {string} featId - identifiant du don (clé de js/data/feats.js)
 * @property {string} featName - nom français du don (« Vigilant »)
 * @property {string} text - phrase courte en français, chiffres calculés inclus ; elle ne commence
 *   pas par le nom du don (sauf « dont +X PV grâce à Robuste ») : l'interface peut afficher featName à côté
 * @property {number|string} [value] - chiffre principal de la note (bonus, DD, réduction, nombre
 *   d'alliés, dé « 1d8 ») ; absent pour un simple rappel
 * @property {boolean} [applied] - la valeur est déjà comptée dans le nombre calculé par la fiche
 *   (ex. Vigilant dans l'Initiative) : ne pas l'ajouter une seconde fois
 * @property {boolean} [manual] - la valeur porte sur un nombre saisi à la main (ex. Robuste et les
 *   PV max) : la fiche ne l'ajoute pas, le joueur la reporte lui-même s'il ne l'a pas déjà fait
 * @property {boolean} [inactive] - condition non remplie (ex. aucune armure lourde équipée) :
 *   à afficher discrètement
 */

/**
 * Notes de dons rangées par zone de la fiche.
 * Les zones fixes (FEAT_ZONES) sont toujours présentes (tableau vide s'il n'y a rien) ;
 * deux familles de zones n'apparaissent que si elles ont au moins une note :
 *  - 'weapon:<i>'  : ligne n° i (index dans dynamic_weapons) du tableau des armes ;
 *  - 'featSlot:<N>' : emplacement de don du niveau N (ce que la fiche fait de ce don).
 * @typedef {Object<string, FeatNote[]>} FeatEffects
 */

/**
 * Zones fixes de la fiche, toujours présentes dans le résultat de featEffects :
 *  - 'initiative'   : Initiative (Vigilant) ;
 *  - 'hpMax'        : PV max saisis à la main (Robuste : « dont +X ») ;
 *  - 'armorClass'   : CA (Maître des armures lourdes, Maître des boucliers sans bouclier) ;
 *  - 'saves.<id>'   : jet de sauvegarde (str, dex, con, int, wis, cha) ;
 *  - 'spells'       : zone des sorts (Mage de guerre) ;
 *  - 'weapons'      : tableau des armes, rappels généraux (Charge, Abattage, Sentinelle…) ;
 *  - 'rest'         : fin d'un repos court ou long (Musicien) ;
 *  - 'healing'      : soins donnés aux autres (Guérisseur).
 */
export const FEAT_ZONES = Object.freeze([
    'initiative', 'hpMax', 'armorClass',
    'saves.str', 'saves.dex', 'saves.con', 'saves.int', 'saves.wis', 'saves.cha',
    'spells', 'weapons', 'rest', 'healing'
]);

/** Dons dont la fiche tient compte (lot 1) */
export const AUTOMATED_FEATS = Object.freeze([
    'vigilant', 'robuste', 'mage_de_guerre', 'maitre_des_armures_lourdes', 'maitre_des_armures_intermediaires',
    'maitre_des_boucliers',
    'expert_de_la_charge', 'maitre_des_armes_lourdes_cogneur_lourd', 'sauvagerie_martiale',
    'sentinelle', 'trancheur', 'broyeur', 'empaleur_perforateur', 'musicien', 'guerisseur'
]);

const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;

/** Note prête à ranger (featName ajouté, champs facultatifs absents s'ils ne sont pas fournis) */
function note(featId, text, extra = {}) {
    return { featId, featName: featName(featId), text, ...extra };
}

/** DD du Coup de bouclier (PHB 2024 « Shield Master », p. 207) : 8 + mod. Force + bonus de maîtrise */
export function shieldBashDC(derived) {
    return 8 + derived.mods.str + derived.pb;
}

/** Points de vie de Robuste (PHB 2024 « Tough », p. 202) : 2 × niveau du personnage */
export function toughHitPoints(level) {
    return 2 * level;
}

// -----------------------------------------------------------------------------
// Effets par don : chaque fonction reçoit { derived, add } et range ses notes
// -----------------------------------------------------------------------------
const FEAT_RULES = {
    // Vigilant — PHB 2024 « Alert », p. 200
    vigilant: ({ derived: { pb, mods }, add }) => {
        add('initiative', `Bonus de maîtrise ${signed(pb)} déjà compté dans l'Initiative (Dex ${signed(mods.dex)}, Vigilant ${signed(pb)}).`,
            { value: pb, applied: true });
        add('initiative', "Échange d'Initiative : juste après le jet, vous pouvez échanger votre Initiative avec celle d'un allié consentant (impossible si l'un de vous est Incapable d'agir).");
        add('featSlot', `Initiative calculée : Dex ${signed(mods.dex)}, Vigilant ${signed(pb)} = ${signed(mods.dex + pb)}.`,
            { value: pb, applied: true });
    },

    // Robuste — PHB 2024 « Tough », p. 202 : 2 × niveau dès que le don est pris, puis +2 par niveau
    robuste: ({ derived: { level }, add }) => {
        const hp = toughHitPoints(level);
        add('hpMax', `dont +${hp} PV grâce à Robuste (2 × niveau ${level})`, { value: hp, manual: true });
        add('featSlot', `+${hp} PV max (2 × niveau ${level}) : à compter vous-même dans les PV max saisis, la fiche ne les ajoute pas.`,
            { value: hp, manual: true });
    },

    // Mage de guerre — PHB 2024 « War Caster », p. 209
    mage_de_guerre: ({ add }) => {
        add('saves.con', 'Avantage pour maintenir la Concentration.');
        add('spells', "Sort réactif : quand une créature quitte votre allonge et provoque une attaque d'opportunité, vous pouvez à la place lancer sur elle, en Réaction, un sort d'une action qui ne cible qu'elle.");
        add('spells', 'Composantes somatiques possibles même avec des armes ou un bouclier dans les mains.');
        add('featSlot', 'Avantage pour la Concentration noté sur la sauvegarde de Constitution.');
    },

    // Maître des armures lourdes — PHB 2024 « Heavy Armor Master », p. 204
    maitre_des_armures_lourdes: ({ derived: { pb, wornArmor }, add }) => {
        if (wornArmor.heavy) {
            add('armorClass', `Réduction des dégâts contondants, perforants et tranchants des attaques : ${pb}`, { value: pb });
            add('featSlot', `Réduction des dégâts de ${pb} (bonus de maîtrise), notée près de la CA.`, { value: pb });
        } else {
            add('armorClass', 'Réduction des dégâts : seulement en armure lourde (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure lourde équipée.', { inactive: true });
        }
    },

    // Maître des armures intermédiaires — PHB 2024 « Medium Armor Master » (Porteur agile) :
    // Dex jusqu'à +3 au lieu de +2 en armure intermédiaire si la valeur de Dextérité est de 16 ou plus
    maitre_des_armures_intermediaires: ({ derived: { scores, wornArmor, armorClass }, add }) => {
        // L'armure intermédiaire doit être celle qui compte dans la CA (pas une autre armure équipée)
        const counted = armorClass?.rows
            ? armorClass.rows.some(r => r.status === 'counted' && r.line.category === 'medium')
            : wornArmor.medium;
        if (counted && scores.dex >= 16) {
            add('armorClass', "Porteur agile : Dex jusqu'à +3 au lieu de +2 en armure intermédiaire, déjà compté dans la CA.", { value: 3, applied: true });
            add('featSlot', "Dex jusqu'à +3 en armure intermédiaire : déjà compté dans la CA.", { value: 3, applied: true });
        } else if (counted) {
            add('armorClass', 'Porteur agile : il faut une valeur de Dextérité de 16 ou plus.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : Dextérité inférieure à 16.', { inactive: true });
        } else if (wornArmor.medium) {
            add('armorClass', "Porteur agile : l'armure intermédiaire équipée ne compte pas dans la CA (une autre armure donne plus).", { inactive: true });
            add('featSlot', "Sans effet pour le moment : l'armure intermédiaire équipée ne compte pas dans la CA.", { inactive: true });
        } else {
            add('armorClass', 'Porteur agile : seulement en armure intermédiaire (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure intermédiaire équipée.', { inactive: true });
        }
    },

    // Maître des boucliers — PHB 2024 « Shield Master », p. 207 (prérequis : formation aux boucliers).
    // Comme pour la CA (computeArmorClass), un bouclier non maîtrisé est sans effet.
    maitre_des_boucliers: ({ derived, add }) => {
        if (derived.wornArmor.shield && !derived.wornArmor.shieldTrained) {
            add('armorClass', 'Coup de bouclier et Interposition de bouclier : formation aux boucliers non cochée.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : formation aux boucliers non cochée (le bouclier ne compte pas non plus dans la CA).', { inactive: true });
        } else if (derived.wornArmor.shield) {
            const dc = shieldBashDC(derived);
            add('weapons', `Coup de bouclier : après avoir touché avec une arme de corps à corps une créature à 1,50 m lors de l'action Attaque, frappez-la avec votre bouclier ; sauvegarde de Force DD ${dc}, sinon repoussée de 1,50 m ou À terre (au choix). Une fois par tour.`,
                { value: dc });
            add('saves.dex', "Interposition de bouclier : contre un effet qui permet un jet de Dextérité pour ne subir que la moitié des dégâts, vous pouvez prendre une Réaction pour n'en subir aucun si le jet réussit.");
            add('featSlot', `Coup de bouclier DD ${dc} (8 + For ${signed(derived.mods.str)} + maîtrise ${signed(derived.pb)}) ; Interposition de bouclier notée sur la sauvegarde de Dextérité.`,
                { value: dc });
        } else {
            add('armorClass', 'Coup de bouclier et Interposition de bouclier : il faut un bouclier équipé.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucun bouclier équipé.', { inactive: true });
        }
    },

    // Expert de la charge — PHB 2024 « Charger », p. 202 (« Dash » = action Foncer)
    expert_de_la_charge: ({ add }) => {
        add('weapons', "Charge : après au moins 3 m en ligne droite vers la cible juste avant de la toucher au corps à corps (action Attaque), +1d8 aux dégâts, ou repoussez-la jusqu'à 3 m (taille au plus une de plus que vous). Une fois par tour.",
            { value: '1d8' });
        add('weapons', 'Foncer : votre vitesse augmente de 3 m pour cette action.', { value: 3 });
        add('featSlot', 'Bouton « Charge (+1d8) » dans les armes (corps à corps) ; Foncer : +3 m.', { value: '1d8' });
    },

    // Cogneur lourd — PHB 2024 « Great Weapon Master », p. 204 (le bonus aux dégâts est un bouton existant)
    maitre_des_armes_lourdes_cogneur_lourd: ({ derived: { pb }, add }) => {
        add('weapons', "Abattage : juste après un coup critique avec une arme de corps à corps, ou après avoir réduit une créature à 0 PV avec elle, vous pouvez attaquer une fois avec la même arme en action Bonus.");
        add('featSlot', `Bouton « Cogneur lourd (+${pb}) » dans les armes (armes Lourdes) ; rappel Abattage.`, { value: pb });
    },

    // Sauvagerie martiale — PHB 2024 « Savage Attacker », p. 201
    sauvagerie_martiale: ({ add }) => {
        add('weapons', "Une fois par tour, quand vous touchez avec une arme, lancez deux fois ses dés de dégâts et gardez le résultat de votre choix.");
        add('featSlot', 'Rappel dans les dégâts de chaque arme.');
    },

    // Sentinelle — PHB 2024 « Sentinel », p. 207
    sentinelle: ({ add }) => {
        add('weapons', "Gardien : juste après qu'une créature à 1,50 m de vous se Désengage ou touche une autre cible que vous, vous pouvez lui porter une attaque d'opportunité.");
        add('weapons', "Immobilisation : une créature touchée par votre attaque d'opportunité a une vitesse de 0 jusqu'à la fin du tour.");
        add('featSlot', 'Rappel sur les armes de corps à corps.');
    },

    // Trancheur — PHB 2024 « Slasher », p. 208
    trancheur: ({ add }) => {
        add('weapons', 'Dégâts tranchants : une fois par tour, réduisez la vitesse de la cible de 3 m jusqu\'au début de votre prochain tour. Sur un coup critique, elle a le Désavantage à ses jets d\'attaque jusqu\'au début de votre prochain tour.');
        add('featSlot', 'Rappel sur les armes tranchantes.');
    },

    // Broyeur — PHB 2024 « Crusher », p. 203
    broyeur: ({ add }) => {
        add('weapons', 'Dégâts contondants : une fois par tour, déplacez la cible de 1,50 m vers un espace libre (taille au plus une de plus que vous). Sur un coup critique, les jets d\'attaque contre elle ont l\'Avantage jusqu\'au début de votre prochain tour.');
        add('featSlot', 'Rappel sur les armes contondantes.');
    },

    // Perforateur — PHB 2024 « Piercer », p. 206
    empaleur_perforateur: ({ add }) => {
        add('weapons', 'Dégâts perforants : une fois par tour, relancez un des dés de dégâts de l\'attaque (le nouveau résultat compte). Sur un coup critique, lancez un dé de dégâts de plus.');
        add('featSlot', 'Rappel sur les armes perforantes.');
    },

    // Musicien — PHB 2024 « Musician », p. 201
    musicien: ({ derived: { pb }, add }) => {
        add('rest', `Chant d'encouragement : à la fin du repos, jouez d'un instrument que vous maîtrisez pour donner l'Inspiration héroïque à au plus ${pb} alliés qui vous entendent.`,
            { value: pb });
        add('featSlot', `Rappel à la fin des repos : Inspiration héroïque pour au plus ${pb} alliés.`, { value: pb });
    },

    // Guérisseur — PHB 2024 « Healer », p. 201 (« Battle Medic » : Médecin de combat)
    guerisseur: ({ derived: { pb }, add }) => {
        add('healing', `Médecin de combat : en dépensant une utilisation d'une trousse de soins (action Utilisation), une créature à 1,50 m dépense un de ses dés de vie ; vous le lancez et elle récupère le résultat ${signed(pb)} PV.`,
            { value: pb });
        add('healing', 'Retirage des soins : sur un dé de soins (sort ou Médecin de combat), relancez un 1 et gardez le nouveau résultat.');
        add('featSlot', `Médecin de combat : dé de vie de la cible ${signed(pb)} ; relancer les 1.`, { value: pb });
    }
};

// -----------------------------------------------------------------------------
// Rappels sur une ligne d'arme
// -----------------------------------------------------------------------------

/** Rappel court d'un don sur une arme : condition (arme de corps à corps, type de dégâts…) et texte */
const WEAPON_RULES = [
    { featId: 'sauvagerie_martiale', applies: () => true,
        text: () => 'Une fois par tour, lancer deux fois les dés de dégâts de l\'arme et garder un des résultats.' },
    { featId: 'maitre_des_armes_lourdes_cogneur_lourd', applies: ({ melee }) => melee,
        text: () => 'Abattage : après un coup critique ou une créature réduite à 0 PV avec cette arme, une attaque de plus avec elle en action Bonus.' },
    { featId: 'expert_de_la_charge', applies: ({ melee }) => melee, value: '1d8',
        text: () => 'Charge : +1d8 aux dégâts après 3 m en ligne droite vers la cible (une fois par tour).' },
    { featId: 'maitre_des_boucliers', applies: ({ melee, derived }) => melee && derived.wornArmor.shield && derived.wornArmor.shieldTrained,
        value: ({ derived }) => shieldBashDC(derived),
        text: ({ derived }) => `Coup de bouclier : sauvegarde de Force DD ${shieldBashDC(derived)}, sinon repoussée de 1,50 m ou À terre (une fois par tour).` },
    { featId: 'sentinelle', applies: ({ melee }) => melee,
        text: () => 'Attaque d\'opportunité aussi contre une créature à 1,50 m qui se Désengage ou touche quelqu\'un d\'autre ; touchée, sa vitesse tombe à 0 jusqu\'à la fin du tour.' },
    { featId: 'trancheur', applies: ({ type }) => type === 'TRAN',
        text: () => 'Une fois par tour, −3 m de vitesse pour la cible ; sur un critique, Désavantage à ses attaques (jusqu\'à votre prochain tour).' },
    { featId: 'broyeur', applies: ({ type }) => type === 'CONT',
        text: () => 'Une fois par tour, déplacer la cible de 1,50 m ; sur un critique, Avantage aux attaques contre elle (jusqu\'à votre prochain tour).' },
    { featId: 'empaleur_perforateur', applies: ({ type }) => type === 'PERF',
        text: () => 'Une fois par tour, relancer un dé de dégâts ; sur un critique, un dé de dégâts de plus.' }
];

/**
 * Rappels de dons pour une ligne du tableau des armes, selon sa portée (corps à corps) et son type
 * de dégâts. Seules les armes rattachées au manuel (nom et caractéristique d'attaque, comme
 * computeWeapon) reçoivent des rappels : une ancienne ligne libre (« Perception bestiale ») n'en a pas.
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {Object} character - personnage (pour les dons atteints)
 * @param {Object} [derived] - deriveCharacter(character), recalculé s'il est absent
 * @returns {FeatNote[]}
 */
export function weaponFeatNotes(weapon, character, derived = deriveCharacter(character || {})) {
    if (isBlankWeapon(weapon) || !weapon.atkKey || !String(weapon.name ?? '').replace(/<[^>]*>/g, '').trim()) return [];
    const feats = new Set(derived.feats ?? reachedFeatIds(character));
    const ctx = { derived, melee: weaponReach(weapon).melee, type: weaponDamageType(weapon) };
    return WEAPON_RULES
        .filter(rule => feats.has(rule.featId) && rule.applies(ctx))
        .map(rule => {
            const value = typeof rule.value === 'function' ? rule.value(ctx) : rule.value;
            return note(rule.featId, rule.text(ctx), value === undefined ? {} : { value });
        });
}

/**
 * Notes des dons à montrer à la fin d'un repos court ou long (Musicien).
 * @param {Object} character
 * @param {Object} [derived] - deriveCharacter(character)
 * @returns {FeatNote[]}
 */
export function restFeatNotes(character, derived = deriveCharacter(character || {})) {
    return featEffects(character, derived).rest;
}

/**
 * Effets des dons atteints, rangés par zone de la fiche (voir FEAT_ZONES et le type FeatEffects).
 * Fonction pure : le personnage n'est pas modifié et aucune valeur saisie n'est changée.
 *
 * Exemple (Guerrier niveau 4, Dex 14, feat_1 = 'vigilant', feat_4 = 'robuste') :
 *   featEffects(c, deriveCharacter(c)).initiative
 *   → [{ featId: 'vigilant', featName: 'Vigilant', value: 2, applied: true,
 *        text: "Bonus de maîtrise +2 déjà compté dans l'Initiative (Dex +2, Vigilant +2)." },
 *      { featId: 'vigilant', featName: 'Vigilant', text: "Échange d'Initiative : …" }]
 *   featEffects(c).hpMax
 *   → [{ featId: 'robuste', featName: 'Robuste', value: 8, text: 'dont +8 PV grâce à Robuste (2 × niveau 4)' }]
 *   featEffects(c)['featSlot:4'] → [{ featId: 'robuste', …, text: '+8 PV max (2 × niveau 4) : …' }]
 *
 * @param {Object} character - personnage au format de sauvegarde (v3)
 * @param {Object} [derived] - deriveCharacter(character) déjà calculé (sinon recalculé)
 * @returns {FeatEffects}
 */
export function featEffects(character, derived = deriveCharacter(character || {})) {
    const effects = Object.fromEntries(FEAT_ZONES.map(zone => [zone, []]));
    const record = character && typeof character === 'object' ? character : {};

    // Effets généraux, dans l'ordre des emplacements ; 'featSlot' est rangé sous le niveau de l'emplacement.
    // Un don choisi deux fois (ancienne sauvegarde) ne donne ses rappels qu'une fois.
    const seen = new Set();
    for (const slot of featSlots(record)) {
        if (!slot.reached || !Object.hasOwn(FEAT_RULES, slot.featId)) continue;
        const rule = FEAT_RULES[slot.featId];
        const slotZone = `featSlot:${slot.level}`;
        const first = !seen.has(slot.featId);
        seen.add(slot.featId);
        rule({
            derived,
            add: (zone, text, extra) => {
                if (zone !== 'featSlot' && !first) return;
                const key = zone === 'featSlot' ? slotZone : zone;
                (effects[key] ??= []).push(note(slot.featId, text, extra));
            }
        });
    }

    // Rappels sur chaque ligne d'arme
    const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
    weapons.forEach((weapon, index) => {
        const notes = weaponFeatNotes(weapon, record, derived);
        if (notes.length) effects[`weapon:${index}`] = notes;
    });

    return effects;
}
