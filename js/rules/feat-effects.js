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

import {
    featSlots, featName, featSlotName, reachedFeatIds, hasFightingStyle, classOf, subclassOf, STYLE_ALTERNATIVES, characterLevel,
    featSlotLevelFor
} from './feats.js';
import { FEATS_DATA } from '../data/feats.js';
import { deriveCharacter, computeWeapon, hitDieForClass, parseNumber } from './character.js';
import { parseWeaponConfig } from './logic.js';
import { weaponReach, weaponDamageType, isBlankWeapon, isUnarmedStrike, isCrossbow } from './weapons.js';
import { DD_RULES } from '../data/dd-rules.js';
import { ABILITY_IDS, SKILLS } from '../data/constants.js';
import {
    FEAT_CHOICE_RULES, featChoiceGrants, REPEATABLE_CHOICE_FEATS, abilityName, skillName, elementWord, slotChoice, ENERGY_TYPES
} from './feat-choices.js';
import { FEAT_SPELL_FEATS, featSpellGroups, featSpellSummary } from './feat-spells.js';
import { classFeatureNotes, weaponProficiency, weaponProficiencyNote, shieldKeepsMartialArts } from './class-features.js';
import { subclassWeaponNotes } from './subclass-calcs.js';
import { subclassCombatWeaponNotes } from './subclass-combat.js';
import { findMastery } from './weapon-masteries.js';

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
 * @property {boolean} [check] - à vérifier par le joueur : case du don pas cochée, valeur au-delà
 *   de 20, choix contraire à la règle (lot 3) ; la fiche ne corrige rien elle-même
 * @property {boolean} [ticked] - la case due au don est cochée sur la fiche (lot 3)
 * @property {number} [slot] - niveau de l'emplacement du don (dons à choix : un même don peut être
 *   pris dans deux emplacements, chacun avec son choix)
 * @property {'short'|'long'} [restKind] - rappel de fin de repos court seulement, ou long seulement (zone 'rest')
 * @property {boolean} [classFeature] - note d'une capacité de classe, pas d'un don (Aura de protection,
 *   Touche-à-tout, arme non maîtrisée : js/rules/class-features.js) ; featId est alors un identifiant
 *   propre à la capacité (absent de js/data/feats.js)
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
 *  - 'scores.<id>'  : valeur de caractéristique saisie (augmentations des dons à choix) ;
 *  - 'skills.<id>'  : compétence (maîtrise ou Expertise due à un don à choix) ;
 *  - 'spells'       : zone des sorts (Mage de guerre) ;
 *  - 'weapons'      : tableau des armes, rappels généraux (Charge, Abattage, Sentinelle…) ;
 *  - 'rest'         : fin d'un repos court ou long (Musicien) ;
 *  - 'healing'      : soins donnés aux autres (Guérisseur) ;
 *  - 'speed'        : Vitesse saisie (Mobile : « dont +3 m », jamais ajoutés) ;
 *  - 'deathSaves'   : jets contre la mort (Gaillard : Avantage).
 */
export const FEAT_ZONES = Object.freeze([
    'initiative', 'hpMax', 'armorClass',
    ...ABILITY_IDS.map(id => `saves.${id}`),
    ...ABILITY_IDS.map(id => `scores.${id}`),
    ...SKILLS.map(skill => `skills.${skill.id}`),
    'spells', 'weapons', 'rest', 'healing', 'speed', 'deathSaves'
]);

/** Dons dont la fiche tient compte (lot 1) */
export const AUTOMATED_FEATS = Object.freeze([
    'vigilant', 'robuste', 'mage_de_guerre', 'maitre_des_armures_lourdes', 'maitre_des_armures_intermediaires',
    'maitre_des_boucliers',
    'expert_de_la_charge', 'maitre_des_armes_lourdes_cogneur_lourd', 'sauvagerie_martiale',
    'sentinelle', 'trancheur', 'broyeur', 'empaleur_perforateur', 'musicien', 'guerisseur',
    // Lot 2 : dons à usages limités (cases vidées au repos, js/rules/feat-uses.js)
    'chanceux', 'tueur_de_mages',
    // Lot 3 : choix mémorisés (js/rules/feat-choices.js)
    'amelioration_de_caracteristique', 'resilient', 'observateur', 'expert', 'esprit_affute', 'doue',
    'adepte_elementaire',
    // Lot 6 : dons à sorts (js/rules/feat-spells.js)
    'initie_a_la_magie', 'affinite_feerique', 'affinite_ombreuse', 'magie_rituelle', 'telepathe', 'telekinesiste',
    // Lot 5 : vitesse, PV temporaires, armures, armes d'hast, poison
    'mobile', 'figure_de_proue', 'incantateur_d_elite', 'protection_legere', 'protection_intermediaire',
    'protection_lourde', 'duelliste_defensif', 'gaillard', 'chef_cuisinier', 'empoisonneur', 'maitre_d_hast',
    // Lot 4 : styles de combat (et ce qui peut les remplacer au niveau 2)
    'defense', 'archerie', 'duel', 'arme_a_deux_mains', 'arme_de_lancer', 'combat_a_deux_armes',
    'combat_a_mains_nues', 'combat_en_aveugle', 'interception', 'protection', 'guerrier_beni', 'guerrier_druidique',
    // Sous-classes, lot 0 : style de combat de l'Odyssée
    'hoplite',
    // Lot 7 : Attaque à mains nues, armes et rappels
    'athlete', 'bagarreur_de_tavernes', 'combattant_a_deux_armes', 'combattant_monte', 'comedien', 'discret',
    'empoigneur', 'faconneur', 'formation_aux_armes_de_guerre', 'maitre_d_armes', 'maitre_arbaletrier', 'tireur_d_elite',
    // Lot 8 : faveurs épiques (niveau 19)
    'faveur_d_attaque_irresistible', 'faveur_de_competence', 'faveur_de_deplacement_dimensionnel', 'faveur_de_l_esprit_nocturne',
    'faveur_de_memoire_magique', 'faveur_de_prouesse_martiale', 'faveur_de_recuperation', 'faveur_de_resistance_aux_energies',
    'faveur_de_vigueur', 'faveur_de_vision_veritable_vision_lucide', 'faveur_de_vitesse', 'faveur_du_destin'
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

/** Texte brut d'un champ saisi (les anciennes sauvegardes peuvent contenir du HTML) */
const plainText = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
/** Sans accents ni majuscules, pour reconnaître un nom saisi (« Bâton » → « baton ») */
const fold = (value) => plainText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Formations d'armure (cases « Maîtrises d'armures » de l'onglet Combat) : [clé, mots, case].
 * La fiche ne coche jamais ces cases : elle dit seulement si elles le sont.
 */
const ARMOR_TRAINING = Object.freeze({
    light: ['prof_armor_light', 'armures légères', 'Légères'],
    medium: ['prof_armor_med', 'armures intermédiaires', 'Intermédiaires'],
    heavy: ['prof_armor_heavy', 'armures lourdes', 'Lourdes'],
    shield: ['prof_armor_shield', 'boucliers', 'Boucliers']
});

/**
 * Protection légère, intermédiaire, lourde (PHB 2024 « Lightly / Moderately / Heavily Armored »,
 * p. 204-205) : prérequis de formation, formations données (cochées ou à cocher), formation déjà
 * donnée par la classe.
 */
function armorTrainingNotes(kinds, prerequisite, { derived, record, add }) {
    if (prerequisite) {
        const [field, words, box] = ARMOR_TRAINING[prerequisite];
        if (record[field] !== true) {
            add('featSlot', `Prérequis : formation aux ${words} (case « ${box} » des maîtrises d'armures, onglet Combat, non cochée).`, { check: true });
        }
    }
    for (const kind of kinds) {
        const [field, words, box] = ARMOR_TRAINING[kind];
        if (record[field] === true) add('featSlot', `Formation aux ${words} : case « ${box} » cochée.`, { ticked: true });
        else add('featSlot', `Formation aux ${words} à cocher (case « ${box} » des maîtrises d'armures, onglet Combat) : la fiche ne coche rien elle-même.`, { check: true });
    }
    const fromClass = DD_RULES.classes[derived.classSlug]?.armorProf ?? [];
    if (kinds.every(kind => fromClass.includes(kind))) {
        add('featSlot', `Votre classe (${derived.className}) donne déjà cette formation : ce don ne vous apporte que son +1.`);
    }
}

/** Maîtrise d'outil donnée par un don : notée ou non dans le champ Outils (onglet Compétences & Histoire) */
function toolNote(record, pattern, label, add) {
    if (pattern.test(fold(record.profs_tools))) add('featSlot', `${label} : maîtrise notée dans le champ Outils.`, { ticked: true });
    else add('featSlot', `${label} : maîtrise à noter dans le champ Outils (onglet Compétences & Histoire).`, { check: true });
}

/** Arme du tableau qui a une propriété (« finesse », « allonge »...) */
const hasProperty = (weapon, word) => fold(weapon?.prop).split(/[,;]/).some(part => part.trim().startsWith(word));

/**
 * Arme d'hast de Maître d'hast (PHB 2024 « Polearm Master », p. 206) : Bâton, Lance, ou arme à la
 * fois Lourde et à Allonge (Coutille, Hallebarde, Lance d'arçon, Pique). Nom reconnu au début
 * (« Bâton +1 ») ; la Lance d'arçon l'est par ses propriétés.
 * Aussi « Bâton de feu » ou « Lance de foudre », mais pas « Lance-pierre ».
 */
export function isPolearm(weapon) {
    const name = fold(weapon?.name);
    return /^(baton|lance)(?=$|[\s+,(])/.test(name) || (hasProperty(weapon, 'lourde') && hasProperty(weapon, 'allonge'));
}

/**
 * DD du poison d'Empoisonneur (PHB 2024 « Poisoner », p. 206) : 8 + modificateur de la
 * caractéristique augmentée par le don + bonus de maîtrise ; null tant qu'elle n'est pas choisie.
 * @param {Object} record
 * @param {Object} derived
 * @returns {number|null}
 */
export function poisonerDC(record, derived) {
    const slot = featSlots(record).find(s => s.reached && s.featId === 'empoisonneur');
    const ability = slot ? slotChoice(record, slot.level, 'empoisonneur').ability : '';
    return ability ? 8 + derived.mods[ability] + derived.pb : null;
}

// -----------------------------------------------------------------------------
// Effets par don : chaque fonction reçoit { derived, record, add } et range ses notes
// -----------------------------------------------------------------------------
const FEAT_RULES = {
    // Vigilant — PHB 2024 « Alert », p. 200
    vigilant: ({ derived: { pb, initiative, initiativeDetail }, add }) => {
        add('initiative', `Bonus de maîtrise ${signed(pb)} déjà compté dans l'Initiative (${initiativeDetail}).`,
            { value: pb, applied: true });
        add('initiative', "Échange d'Initiative : juste après le jet, vous pouvez échanger votre Initiative avec celle d'un allié consentant (impossible si l'un de vous est Incapable d'agir).");
        add('featSlot', `Initiative calculée : ${initiativeDetail} = ${signed(initiative)}.`,
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

    // Expert de la charge — PHB 2024 « Charger », p. 202 (« Dash » = action Pointe)
    expert_de_la_charge: ({ add }) => {
        add('weapons', "Charge : après au moins 3 m en ligne droite vers la cible juste avant de la toucher au corps à corps (action Attaque), +1d8 aux dégâts, ou repoussez-la jusqu'à 3 m (taille au plus une de plus que vous). Une fois par tour.",
            { value: '1d8' });
        add('weapons', 'Pointe : votre vitesse augmente de 3 m pour cette action.', { value: 3 });
        add('featSlot', 'Bouton « Charge (+1d8) » dans les armes (corps à corps) ; Pointe : +3 m.', { value: '1d8' });
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

    // Chanceux — PHB 2024 « Lucky », p. 201 : points de Chance = bonus de maîtrise, repos long
    chanceux: ({ derived: { pb }, add }) => {
        add('featSlot', `${pb} points de Chance à cocher (onglet Combat et ci-dessous), récupérés au repos long.`, { value: pb });
    },

    // Tueur de mages — PHB 2024 « Mage Slayer », p. 205 (l'augmentation de caractéristique reste saisie à la main)
    tueur_de_mages: ({ add }) => {
        add('featSlot', 'Esprit préservé : 1 case à cocher (onglet Combat et ci-dessous), de nouveau disponible au repos court ou long.', { value: 1 });
        // Vaut pour tous les dégâts (armes et sorts) : rappel ici, pas sur une ligne d'arme
        add('featSlot', 'Briseur de concentration : une créature en concentration à qui vous infligez des dégâts (arme ou sort) a le Désavantage à sa sauvegarde pour maintenir sa Concentration.');
    },

    // Guérisseur — PHB 2024 « Healer », p. 201 (« Battle Medic » : Médecin de combat)
    guerisseur: ({ derived: { pb }, add }) => {
        add('healing', `Médecin de combat : en dépensant une utilisation d'une trousse de soins (action Utilisation), une créature à 1,50 m dépense un de ses dés de vie ; vous le lancez et elle récupère le résultat ${signed(pb)} PV.`,
            { value: pb });
        add('healing', 'Retirage des soins : sur un dé de soins (sort ou Médecin de combat), relancez un 1 et gardez le nouveau résultat.');
        add('featSlot', `Médecin de combat : dé de vie de la cible ${signed(pb)} ; relancer les 1.`, { value: pb });
    },

    // ---- Lot 5 (règles vérifiées dans le PHB 2024 anglais ; le +1 : js/rules/feat-choices.js) ----

    // Mobile — PHB 2024 « Speedy », p. 208 : Vitesse +3 m (la vitesse saisie n'est pas modifiée)
    mobile: ({ add }) => {
        add('speed', "+3 m grâce à Mobile. La Vitesse saisie n'est pas modifiée : ajoutez-les vous-même s'ils n'y sont pas déjà.",
            { value: 3, manual: true });
        add('featSlot', 'Vitesse +3 m : à reporter vous-même dans la Vitesse saisie (repère à côté).', { value: 3, manual: true });
        add('featSlot', "Pointe : quand vous prenez l'action Pointe, le terrain difficile ne vous coûte pas de mouvement en plus jusqu'à la fin du tour.");
        add('featSlot', "Les attaques d'opportunité contre vous ont le Désavantage.");
    },

    // Incantateur d'élite — PHB 2024 « Spell Sniper », p. 208
    incantateur_d_elite: ({ add }) => {
        add('featSlot', "Portée : un sort à jet d'attaque dont la portée est d'au moins 3 m peut porter 18 m plus loin (au choix).");
        add('featSlot', "Vos jets d'attaque de sort ignorent les Abris partiels (+2 CA) et supérieurs (+5 CA), pas l'abri total.");
        add('featSlot', "Pas de Désavantage à vos jets d'attaque de sort quand un ennemi se trouve à 1,50 m de vous.");
    },

    protection_legere: (ctx) => armorTrainingNotes(['light', 'shield'], '', ctx),
    protection_intermediaire: (ctx) => {
        armorTrainingNotes(['medium'], 'light', ctx);
        ctx.add('featSlot', 'Ce don ne donne pas la formation aux boucliers (règles 2024).');
    },
    protection_lourde: (ctx) => {
        armorTrainingNotes(['heavy'], 'medium', ctx);
        ctx.add('featSlot', "La formation ne retire ni la Force demandée par l'armure (sinon −3 m de vitesse) ni le Désavantage en Discrétion.");
    },

    // Duelliste défensif — PHB 2024 « Defensive Duelist », p. 203 : Parade (Réaction)
    duelliste_defensif: ({ derived: { pb, scores, armorClass }, record, add }) => {
        const ac = armorClass.value;
        const text = `Parade (Réaction, arme de Finesse en main) : quand une attaque au corps à corps vous touche, +${pb} à la CA (${ac} → ${ac + pb}) contre les attaques au corps à corps jusqu'au début de votre prochain tour ; l'attaque peut alors rater.`;
        add('armorClass', text, { value: pb });
        add('featSlot', text, { value: pb });
        const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
        if (!weapons.some(weapon => hasProperty(weapon, 'finesse'))) {
            add('featSlot', 'Aucune arme de Finesse dans le tableau des armes (Dague, Rapière, Cimeterre, Épée courte, Fouet, Fléchette).', { inactive: true });
        }
        if (scores.dex < 13) add('featSlot', `Prérequis : Dextérité 13 ou plus (valeur saisie : ${scores.dex}).`, { check: true });
    },

    // Gaillard — PHB 2024 « Durable », p. 203
    gaillard: ({ derived: { level, className }, record, add }) => {
        add('deathSaves', 'Trompe-la-mort : Avantage aux jets de sauvegarde contre la mort (deux d20, gardez le meilleur).');
        add('featSlot', 'Trompe-la-mort : Avantage aux jets de sauvegarde contre la mort (repère près des cases).');
        const used = Math.min(level, Math.max(0, parseNumber(record.hd_current, 0)));
        const die = plainText(record.hd_type).trim() || hitDieForClass(className);
        const available = level - used;
        add('featSlot', `Récupération rapide (action Bonus) : dépensez un dé de vie${die ? ` (${die})` : ''} et regagnez autant de PV que le résultat, sans le modificateur de Constitution. Dés de vie restants : ${available} sur ${level} (à décompter vous-même).`,
            available > 0 ? { value: available } : { inactive: true });
    },

    // Chef cuisinier — PHB 2024 « Chef », p. 202
    chef_cuisinier: ({ derived: { pb }, record, add }) => {
        add('rest', `Repas reconstituant (repos court) : jusqu'à ${4 + pb} créatures qui mangent et dépensent au moins un dé de vie regagnent 1d8 PV de plus.`,
            { value: 4 + pb, restKind: 'short' });
        add('featSlot', `Repas reconstituant : à la fin d'un repos court, jusqu'à ${4 + pb} créatures qui dépensent un dé de vie regagnent 1d8 PV de plus (rappel dans la fenêtre du repos).`, { value: 4 + pb });
        add('featSlot', `${pb} friandises à cocher (onglet Combat et ci-dessous), refaites au repos long : action Bonus pour en manger une, ${pb} PV temporaires ; elles se gâtent après 8 heures.`, { value: pb });
        toolNote(record, /cuisin/, 'Ustensiles de cuisinier', add);
    },

    // Maître d'hast — PHB 2024 « Polearm Master », p. 206 (attaques calculées sur chaque arme d'hast)
    maitre_d_hast: ({ record, add }) => {
        add('featSlot', "Armes : Bâton, Lance, et les armes Lourdes à Allonge (Coutille, Hallebarde, Lance d'arçon, Pique). Frappe double et Frappe réactive calculées sur ces armes, dans le tableau des armes.");
        const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
        if (!weapons.some(isPolearm)) add('featSlot', "Aucune de ces armes dans le tableau des armes.", { inactive: true });
    },

    // ----- Lot 8 : faveurs épiques — PHB 2024 p. 210-211 (le +1, max 30 : js/rules/feat-choices.js) -----

    // Faveur d'attaque irrésistible — « Boon of Irresistible Offense »
    faveur_d_attaque_irresistible: ({ derived, record, add }) => {
        const boost = irresistibleBoost(record, derived);
        add('featSlot', 'Vos dégâts contondants, perforants et tranchants ignorent toujours la Résistance.');
        add('featSlot', boost
            ? `Sur un 20 au d20 d'un jet d'attaque : +${boost.score} dégâts du type de l'attaque (votre ${boost.name}, la valeur augmentée par ce don) ; rappel sous chaque arme.`
            : "Sur un 20 au d20 d'un jet d'attaque : dégâts en plus égaux à la valeur de la caractéristique augmentée par ce don (à choisir ci-dessus).",
        boost ? { value: boost.score } : {});
    },

    // Faveur de compétence — « Boon of Skill » : maîtrise de toutes les compétences (l'Expertise : feat-choices.js)
    faveur_de_competence: ({ derived, add }) => {
        const missing = SKILLS.filter(skill => !derived.skills[skill.id]?.proficient).map(skill => skill.name);
        add('featSlot', missing.length
            ? `Maîtrise de toutes les compétences : ${missing.length === 1 ? 'reste à cocher' : `${missing.length} restent à cocher`} (${missing.join(', ')}). La fiche ne coche rien elle-même.`
            : 'Maîtrise de toutes les compétences : toutes cochées.',
        missing.length ? { check: true } : { ticked: true });
    },

    // Faveur de déplacement dimensionnel — « Boon of Dimensional Travel »
    faveur_de_deplacement_dimensionnel: ({ add }) => {
        add('featSlot', "Juste après l'action Attaque ou l'action Magie : vous vous téléportez jusqu'à 9 m, dans un espace libre que vous voyez.");
    },

    // Faveur de l'esprit nocturne — « Boon of the Night Spirit »
    // Bouton « Dans l'ombre » (combat_buffs.nightSpirit, tableau des armes) : repère près de la CA
    faveur_de_l_esprit_nocturne: ({ record, add }) => {
        add('featSlot', "Dans une lumière faible ou les ténèbres : action Bonus pour devenir Invisible (jusqu'à votre prochaine action, action Bonus ou Réaction), et Résistance à tous les dégâts sauf psychiques et radiants. Bouton « Dans l'ombre » dans le tableau des armes : allumé, la Résistance est rappelée près de la CA.");
        if (record.combat_buffs?.nightSpirit === true) {
            add('armorClass', "Dans l'ombre : Résistance à tous les dégâts sauf psychiques et radiants.");
        } else {
            add('armorClass', "Résistance à tous les dégâts sauf psychiques et radiants : seulement dans l'ombre (bouton « Dans l'ombre » éteint).", { inactive: true });
        }
    },

    // Faveur de mémoire magique — « Boon of Spell Recall » (prérequis : capacité Sorts)
    faveur_de_memoire_magique: ({ derived, record, add }) => {
        const text = "Sort lancé avec un emplacement de niveau 1 à 4 : lancez 1d4 ; si le résultat est égal au niveau de l'emplacement, celui-ci n'est pas dépensé.";
        add('featSlot', text);
        if (derived.classSlug && !hasSpellcasting(record, derived)) {
            add('featSlot', 'Prérequis : la capacité Sorts (une classe de lanceur de sorts, ou Chevalier occulte, Arnaqueur arcanique).', { check: true });
        }
    },

    // Faveur de prouesse martiale — « Boon of Combat Prowess »
    faveur_de_prouesse_martiale: ({ add }) => {
        add('featSlot', "Visée infaillible : un jet d'attaque raté peut toucher à la place ; de nouveau possible au début de votre prochain tour. Bouton « Visée infaillible » dans le tableau des armes : allumez-le quand vous l'utilisez, éteignez-le au début de votre prochain tour.");
    },

    // Faveur de récupération — « Boon of Recovery » : Regain de vitalité (dix d10, cases), Baroud d'honneur
    faveur_de_recuperation: ({ record, add }) => {
        const hpMax = parseNumber(record.hp_max, 0);
        const half = Math.floor(hpMax / 2);
        add('featSlot', `Baroud d'honneur (case ci-dessous), une fois par repos long : réduit à 0 PV, vous tombez à 1 PV à la place et regagnez ${half > 0 ? `${half} PV (moitié de vos PV max)` : 'la moitié de vos PV max'}.`,
            half > 0 ? { value: half } : {});
        add('featSlot', "Regain de vitalité, réserve de dix d10 (cases ci-dessous) : action Bonus, lancez-en autant que vous voulez et regagnez le total en PV ; tous rendus au repos long.");
    },

    // Faveur de résistance aux énergies — « Boon of Energy Resistance »
    faveur_de_resistance_aux_energies: ({ derived, record, add }) => {
        const chosen = energyChoices(record);
        const dc = 8 + derived.mods.con + derived.pb;
        add('featSlot', chosen.length
            ? `Résistance : ${chosen.map(id => energyName(id).toLowerCase()).join(' et ')} (à changer, si vous le voulez, après un repos long).`
            : 'Résistance à deux types de dégâts à choisir ci-dessus (à changer, si vous le voulez, après un repos long).');
        if (chosen.length === 2 && chosen[0] === chosen[1]) {
            add('featSlot', 'Deux types de dégâts différents : choisissez-en un autre.', { check: true });
        }
        add('featSlot', `Détournement d'énergie (Réaction) : quand vous subissez des dégâts d'un de ces types, une créature que vous voyez à 18 m fait un jet de sauvegarde de Dextérité DD ${dc}, sinon elle subit 2d12 ${signed(derived.mods.con)} dégâts de ce type.`,
            { value: dc });
    },

    // Faveur de vigueur — « Boon of Fortitude » : PV max +40 (jamais ajoutés à la valeur saisie)
    faveur_de_vigueur: ({ derived: { mods }, add }) => {
        add('hpMax', 'dont +40 PV grâce à Faveur de vigueur', { value: 40, manual: true });
        add('featSlot', '+40 PV max : à compter vous-même dans les PV max saisis, la fiche ne les ajoute pas.', { value: 40, manual: true });
        if (mods.con > 0) add('featSlot', `Quand vous regagnez des PV : +${mods.con} PV en plus (modificateur de Constitution), une fois par tour.`);
    },

    // Faveur de vision lucide — « Boon of Truesight »
    faveur_de_vision_veritable_vision_lucide: ({ add }) => {
        add('featSlot', 'Vision lucide à 18 m : à noter vous-même avec vos sens.');
    },

    // Faveur de vitesse — « Boon of Speed » : Vitesse +9 m (la vitesse saisie n'est pas modifiée)
    faveur_de_vitesse: ({ add }) => {
        add('speed', "+9 m grâce à Faveur de vitesse. La Vitesse saisie n'est pas modifiée : ajoutez-les vous-même s'ils n'y sont pas déjà.",
            { value: 9, manual: true });
        add('featSlot', 'Prestesse, Vitesse +9 m : à reporter vous-même dans la Vitesse saisie (repère à côté).', { value: 9, manual: true });
        add('featSlot', "Expert en désengagement : par une action Bonus, vous vous Désengagez, ce qui met aussi fin à l'état Agrippé pour vous.");
    },

    // Faveur du destin — « Boon of Fate » (case : feat-uses.js)
    faveur_du_destin: ({ add }) => {
        add('featSlot', "Destin aiguillé : une créature à 18 m (vous compris) réussit ou rate un test d20, lancez 2d4 et ajoutez-les ou retirez-les au résultat. Case ci-dessous : rendue au repos court ou long, ou quand vous lancez l'Initiative (décochez-la alors vous-même).");
    },

    // ----- Lot 7 — règles vérifiées dans le PHB 2024 anglais (le +1 : js/rules/feat-choices.js) -----

    // Athlète — PHB 2024 « Athlete », p. 202 : Vitesse d'escalade = Vitesse (la Vitesse saisie n'est pas lue)
    athlete: ({ add }) => {
        add('speed', "Vitesse d'escalade égale à votre Vitesse.");
        add('featSlot', "Vitesse d'escalade égale à votre Vitesse (repère à côté de la Vitesse).");
        add('featSlot', 'À terre : vous vous relevez avec seulement 1,50 m de mouvement. Saut en longueur ou en hauteur avec élan après 1,50 m seulement.');
    },

    // Bagarreur de tavernes — PHB 2024 « Tavern Brawler », p. 202 : Attaque à mains nues 1d4 + For
    bagarreur_de_tavernes: ({ record, add }) => {
        add('featSlot', 'Attaque à mains nues : 1d4 + mod. de Force contondants au lieu de 1 + Force, et vous relancez les 1 sur ses dés de dégâts. Une fois par tour, touchée pendant l\'action Attaque : vous pouvez aussi repousser la cible de 1,50 m.');
        add('featSlot', 'Vous maîtrisez les armes improvisées.');
        unarmedRowHint(record, add);
    },

    // Combattant à deux armes — PHB 2024 « Dual Wielder », p. 203
    combattant_a_deux_armes: ({ add }) => {
        add('featSlot', "Après une attaque avec une arme Légère (action Attaque), l'attaque en plus (action Bonus) peut se faire avec une autre arme de corps à corps qui n'est pas à Deux mains, même sans Légère (sans modificateur aux dégâts, sauf s'il est négatif).");
        add('featSlot', 'Vous dégainez ou rangez deux armes (pas à Deux mains) au lieu d\'une.');
    },

    // Combattant monté — PHB 2024 « Mounted Combatant », p. 205
    combattant_monte: ({ add }) => {
        add('featSlot', 'Monté : Avantage aux attaques contre une créature non montée à 1,50 m de votre monture et plus petite qu\'elle d\'au moins une taille.');
        add('featSlot', 'Esquive de la monture : sauvegarde de Dextérité pour moitié des dégâts, elle ne subit rien si elle réussit et la moitié si elle rate (vous la montez, aucun de vous deux Neutralisé).');
        add('featSlot', 'Une attaque qui touche votre monture peut vous toucher à la place (si vous n\'êtes pas Neutralisé).');
    },

    // Comédien — PHB 2024 « Actor », p. 202 : DD de l'Imitation = 8 + mod. Cha + bonus de maîtrise
    comedien: ({ derived, add }) => {
        const dc = actorDC(derived);
        for (const skill of ['deception', 'performance']) {
            add(`skills.${skill}`, 'Avantage pour vous faire passer pour la personne dont vous avez pris le déguisement.');
        }
        add('featSlot', 'Déguisé en une personne, réelle ou inventée : Avantage aux jets de Tromperie ou de Représentation pour passer pour elle (repère à côté de ces compétences).');
        add('featSlot', `Imitation de sons et de voix : une créature qui l'entend doit réussir un jet d'Intuition (Sagesse) DD ${dc} pour la reconnaître comme fausse.`, { value: dc });
    },

    // Discret — PHB 2024 « Skulker », p. 208
    discret: ({ add }) => {
        add('skills.stealth', "Avantage pour l'action Furtivité pendant un combat.");
        add('featSlot', 'Vision aveugle à 3 m : à noter vous-même avec vos sens.');
        add('featSlot', "Avantage en Discrétion pour l'action Furtivité pendant un combat (repère à côté de Discrétion). Caché, une attaque ratée ne révèle pas votre position.");
    },

    // Empoigneur — PHB 2024 « Grappler », p. 204 : DD de Lutte = 8 + mod. For + bonus de maîtrise
    empoigneur: ({ derived, record, add }) => {
        const dc = grappleDC(derived);
        add('featSlot', `Attaque à mains nues pendant l'action Attaque, une fois par tour : dégâts et Lutte en même temps (sauvegarde de Force ou de Dextérité DD ${dc}, au choix de la cible).`, { value: dc });
        add('featSlot', "Avantage aux attaques contre une créature que vous agrippez. La déplacer (votre taille ou plus petite) ne divise pas votre Vitesse.");
        unarmedRowHint(record, add);
    },

    // Façonneur — PHB 2024 « Crafter », p. 200
    faconneur: ({ add }) => {
        add('featSlot', "Trois outils d'artisan au choix de la table Fabrication rapide : à noter vous-même dans Outils.");
        add('featSlot', '−20 % sur le prix des objets non magiques que vous achetez.');
        add('featSlot', "Fin d'un repos long : vous fabriquez un objet de la table Fabrication rapide (outil maîtrisé en main) ; il tombe en morceaux à la fin du repos long suivant.");
        add('rest', "Fabrication rapide : un objet de la table (outil d'artisan maîtrisé), qui dure jusqu'à la fin du prochain repos long.", { restKind: 'long' });
    },

    // Formation aux armes de guerre — PHB 2024 « Martial Weapon Training », p. 205
    formation_aux_armes_de_guerre: ({ add }) => {
        add('featSlot', "Maîtrise des armes de guerre : la fiche ajoute le bonus de maîtrise à l'attaque des armes de guerre du tableau.", { applied: true });
    },

    // Maître d'armes : botte d'un type d'arme en plus (bottes d'armes, js/rules/weapon-masteries.js)
    maitre_d_armes: ({ add }) => {
        add('featSlot', "Botte d'arme d'un type d'arme courante ou de guerre que vous maîtrisez, à changer après un repos long : rappelée dans la description de chaque botte (pastille en forme de livre sous la botte, dans le tableau des armes).");
    },

    // Maître arbalétrier — PHB 2024 « Crossbow Expert », p. 203
    maitre_arbaletrier: ({ add }) => {
        add('featSlot', "Arbalètes : vous ignorez la propriété Chargement, et être à 1,50 m d'un ennemi ne donne pas le Désavantage à vos attaques (rappel sous chaque arbalète).");
        add('featSlot', "L'attaque en plus de la propriété Légère avec une arbalète Légère (arbalète de poing) ajoute votre modificateur aux dégâts.");
    },

    // Tireur d'élite — PHB 2024 « Sharpshooter », p. 207
    tireur_d_elite: ({ add }) => {
        add('featSlot', "Attaques à distance avec une arme : elles ignorent les Abris partiels et supérieurs ; ni la longue portée ni un ennemi à 1,50 m ne donnent le Désavantage (rappel sous ces armes).");
    },

    // ----- Lot 4 : styles de combat — Manuel des joueurs français p. 209, Protection p. 210 (« Fighting Style Feats ») -----

    // Défense : +1 à la CA en armure légère, intermédiaire ou lourde (compté dans la CA calculée)
    defense: ({ derived: { armorClass }, add }) => {
        const worn = armorClass?.rows?.some(row => row.status === 'counted' && row.line.kind === 'body');
        if (worn) {
            add('armorClass', 'Défense : +1 en armure, déjà compté dans la CA.', { value: 1, applied: true });
            add('featSlot', "+1 à la CA en armure : déjà compté dans la CA (le détail s'affiche en touchant l'écusson).", { value: 1, applied: true });
        } else {
            add('armorClass', 'Défense : seulement en armure (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure légère, intermédiaire ou lourde équipée.', { inactive: true });
        }
    },

    // Archerie : +2 aux jets d'attaque avec les armes à distance (compté dans le tableau des armes)
    archerie: ({ add }) => {
        add('featSlot', "+2 aux jets d'attaque avec les armes à distance (arcs, arbalètes, frondes, fléchettes) : déjà compté dans le tableau des armes. Pas avec une arme de corps à corps lancée.", { value: 2, applied: true });
    },

    // Duel : +2 aux dégâts, arme de corps à corps à une main et aucune autre arme (bouton Duel)
    duel: ({ add }) => {
        add('featSlot', "+2 aux dégâts avec une arme de corps à corps tenue à une main, sans autre arme. Bouton « Duel (+2) » au-dessus du tableau des armes : allumé, le +2 s'ajoute aux armes de corps à corps qui ne sont pas à Deux mains.");
    },

    // Armes à deux mains : 1 ou 2 sur un dé de dégâts = 3 (arme Deux mains ou Polyvalente, tenue à deux mains)
    arme_a_deux_mains: ({ add }) => {
        add('featSlot', 'Arme de corps à corps Deux mains ou Polyvalente tenue à deux mains : chaque 1 ou 2 sur un dé de dégâts compte comme un 3 (rappel sous ces armes).');
    },

    // Armes de lancer : +2 aux dégâts d'une attaque à distance avec une arme de Lancer (calculé sous l'arme)
    arme_de_lancer: ({ add }) => {
        add('featSlot', "+2 aux dégâts quand vous touchez avec une attaque à distance d'une arme de Lancer : dégâts calculés sous chaque arme de Lancer du tableau.");
    },

    // Combat à deux armes : l'attaque en plus d'une arme Légère garde le modificateur aux dégâts
    combat_a_deux_armes: ({ add }) => {
        add('featSlot', "L'attaque en plus (action Bonus) avec une arme Légère ajoute votre modificateur aux dégâts : dégâts calculés sous chaque arme Légère du tableau.");
    },

    // Combat à mains nues : Attaque à mains nues 1d6 + For (1d8 sans arme ni bouclier), 1d4 à l'agrippé
    combat_a_mains_nues: ({ derived: { mods }, add }) => {
        const str = signed(mods.str);
        add('featSlot', `Attaque à mains nues : 1d6 ${str} contondants, ou 1d8 ${str} si vous ne tenez ni arme ni bouclier (au lieu de 1 ${str}). Au début de chacun de vos tours : 1d4 contondants à une créature que vous Agrippez.`, { value: mods.str });
    },

    // Combat en aveugle : Vision aveugle à 3 m
    combat_en_aveugle: ({ add }) => {
        add('featSlot', 'Vision aveugle à 3 m : à noter vous-même avec vos sens (vous voyez ce qui est à 3 m même dans le noir ou invisible).');
    },

    // Interception : Réaction, réduire de 1d10 + bonus de maîtrise les dégâts d'un allié à 1,50 m
    interception: ({ derived: { pb }, add }) => {
        add('featSlot', `Réaction quand une créature que vous voyez touche une autre créature à 1,50 m de vous : les dégâts sont réduits de 1d10 +${pb}. Il faut tenir un bouclier ou une arme courante ou de guerre.`, { value: pb });
    },

    // Protection : Réaction, bouclier en main, Désavantage aux attaques contre un allié à 1,50 m
    protection: ({ derived: { wornArmor }, add }) => {
        add('featSlot', "Réaction (bouclier en main) quand une créature que vous voyez attaque une autre cible à 1,50 m de vous : Désavantage à ce jet et aux attaques contre cette cible jusqu'au début de votre prochain tour, si vous restez à 1,50 m d'elle.");
        if (!wornArmor.shield) add('featSlot', 'Aucun bouclier équipé (tableau des armures) : ce style demande de tenir un bouclier.', { inactive: true });
    },

    // Hoplite (Odyssée, guide du joueur p. 43, avec la sous-classe L'Hoplite) : Réaction, bouclier porté,
    // attaque d'opportunité contre une créature qui attaque un allié à 1,50 m
    hoplite: ({ derived: { wornArmor }, add }) => {
        add('weapons', "Hoplite : Réaction (bouclier porté) quand une créature attaque au corps à corps un allié à 1,50 m de vous : attaque d'opportunité au corps à corps contre elle.");
        add('featSlot', "Réaction quand une créature attaque au corps à corps un allié à 1,50 m de vous : vous lui portez une attaque d'opportunité au corps à corps. Il faut porter un bouclier.");
        if (!wornArmor.shield) add('featSlot', 'Aucun bouclier équipé (tableau des armures) : ce style demande de porter un bouclier.', { inactive: true });
    },

    // À la place du style de combat (niveau 2) : deux sorts mineurs (PHB 2024, Paladin et Rôdeur)
    guerrier_beni: ({ record, add }) => alternativeNotes('guerrier_beni', 'Clerc', 'Assistance et Flamme sacrée', 'le Charisme', record, add),
    guerrier_druidique: ({ record, add }) => alternativeNotes('guerrier_druidique', 'Druide', "Assistance et Poussière d'étoile", 'la Sagesse', record, add)
};

/** Choix d'un don dans son premier emplacement atteint ({} si le don n'est pas atteint) */
function firstChoice(record, featId) {
    const slot = featSlots(record).find(s => s.reached && s.featId === featId);
    return slot ? slotChoice(record, slot.level, featId) : {};
}

/**
 * Faveur d'attaque irrésistible : valeur de la caractéristique augmentée par le don (Force ou
 * Dextérité, choisie dans l'encadré), ajoutée aux dégâts sur un 20 au d20.
 * @returns {{ score: number, name: string } | null} null tant que la caractéristique n'est pas choisie
 */
export function irresistibleBoost(record, derived) {
    const { ability } = firstChoice(record, 'faveur_d_attaque_irresistible');
    return ability ? { score: derived.scores[ability], name: abilityName(ability) } : null;
}

/** Types de dégâts choisis avec Faveur de résistance aux énergies */
function energyChoices(record) {
    const choice = firstChoice(record, 'faveur_de_resistance_aux_energies');
    return [choice.energy1, choice.energy2].filter(Boolean);
}
const energyName = (id) => ENERGY_TYPES.find(([key]) => key === id)?.[1] ?? id;

/** Capacité Sorts (prérequis de Faveur de mémoire magique) : emplacements de sorts de la classe,
 *  ou sous-classe Chevalier occulte / Arnaqueur arcanique. Pas la Magie de pacte de l'Occultiste : le
 *  PHB 2024 écrit « Spellcasting or Pact Magic Feature » quand elle suffit, ici « Spellcasting Feature ». */
function hasSpellcasting(record, derived) {
    return (derived.classSlug !== 'warlock' && Object.keys(derived.spellSlots ?? {}).length > 0)
        || ['eldritch_knight', 'arcane_trickster'].includes(subclassOf(record));
}

/** DD de l'Imitation du Comédien (PHB 2024 « Actor », p. 202) : 8 + mod. Charisme + bonus de maîtrise */
export function actorDC(derived) {
    return 8 + derived.mods.cha + derived.pb;
}

/**
 * DD de la Lutte à mains nues (PHB 2024 p. 377) : 8 + mod. Force + bonus de maîtrise ; le Moine
 * sans armure ni bouclier peut prendre la Dextérité (Arts martiaux, p. 102) ; le bouclier est permis
 * à La Voie du bouclier (Odyssée).
 */
export function grappleDC(derived) {
    const { str, dex } = derived.mods;
    const worn = derived.wornArmor ?? {};
    const martialArts = derived.classSlug === 'monk' && !(worn.light || worn.medium || worn.heavy)
        && (!worn.shield || shieldKeepsMartialArts(derived));
    return 8 + (martialArts ? Math.max(str, dex) : str) + derived.pb;
}

/** Rappel : pas de ligne « Attaque à mains nues » dans le tableau des armes (ses dégâts n'y sont pas calculés) */
function unarmedRowHint(record, add) {
    const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
    // Ligne rattachée au manuel seulement (sinon ses dégâts ne sont pas calculés)
    if (!weapons.some(weapon => isUnarmedStrike(weapon) && weapon.atkKey)) {
        add('featSlot', '« Attaque à mains nues » peut être ajoutée au tableau des armes (liste du manuel) : ses dégâts y sont alors calculés.', { inactive: true });
    }
}

/** Notes de Combattant béni / druidique : sorts à noter soi-même, et classe qui y a droit */
function alternativeNotes(id, list, advised, ability, record, add) {
    const alt = STYLE_ALTERNATIVES[id];
    add('featSlot', `Deux sorts mineurs de ${list} à ajouter vous-même au grimoire (${advised} sont conseillés), lancés avec ${ability}. Ils remplacent le style de combat.`);
    if (classOf(record) !== alt.classId) {
        add('featSlot', `${alt.name} est une option du ${alt.className} (niveau 2), à la place de son style de combat.`, { check: true });
    }
}

// -----------------------------------------------------------------------------
// Dons à choix (lot 3, js/rules/feat-choices.js) : la fiche ne coche rien et ne change aucune
// valeur saisie. Elle affiche des repères près des valeurs et signale ce qui reste à cocher.
// -----------------------------------------------------------------------------

/** « de feu », « d'acide », « de Force », « d'Intelligence » */
const ofWord = (word) => (/^[aeiouéh]/i.test(word) ? `d'${word}` : `de ${word}`);

/** Jets de sauvegarde maîtrisés par la classe (DD_RULES), [] si la classe est inconnue */
function classSaves(derived) {
    return DD_RULES.classes[derived.classSlug]?.savingThrows ?? [];
}

/** Liste lisible : « a », « a et b », « a, b et c » */
function listText(items) {
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}` : items[0] ?? '';
}

/** Note d'une compétence due à un don : [texte, extra] selon les cases cochées */
function skillNote(kind, name, state) {
    if (kind === 'expertise') {
        return state.expertise
            ? [`Expertise ${ofWord(name)} : case cochée.`, { ticked: true }]
            : [`Expertise ${ofWord(name)} à cocher (losange).`, { check: true }];
    }
    if (kind === 'proficiency') {
        return state.proficient
            ? [`Maîtrise ${ofWord(name)} : case cochée.`, { ticked: true }]
            : [`Maîtrise ${ofWord(name)} à cocher.`, { check: true }];
    }
    // Maîtrise, ou Expertise si la compétence était déjà maîtrisée (Observateur, Esprit affûté)
    if (state.expertise) return [`Expertise ${ofWord(name)} : case cochée.`, { ticked: true }];
    // La fiche ne sait pas si la maîtrise vient du don ou d'avant : simple rappel
    if (state.proficient) {
        return [`Maîtrise ${ofWord(name)} cochée. Si vous la maîtrisiez déjà avant ce don, il donne l'Expertise : cochez aussi le losange.`, {}];
    }
    return [`Maîtrise ${ofWord(name)} à cocher (ou l'Expertise, losange, si vous la maîtrisiez déjà).`, { check: true }];
}

/** Une Faveur épique (don de niveau 19) atteinte : une caractéristique peut alors dépasser 20 (jusqu'à 30) */
function hasEpicBoon(derived) {
    return (derived.feats ?? []).some(id => Object.hasOwn(FEATS_DATA, id) && FEATS_DATA[id].type === 'Épique');
}

/**
 * Notes d'un don à choix pour un emplacement.
 * @param {ReturnType<typeof featChoiceGrants>[number]} grant
 * @param {{ derived: Object, grants: Array, record: Object, add: Function }} ctx
 */
function choiceNotes(grant, { derived, grants, record, add }) {
    const { featId } = grant;

    if (grant.missing.length) {
        add('featSlot', `Choix à faire ci-dessus : ${grant.missing.join(', ')}.`, { inactive: true });
    }

    // Dons à sorts (lot 6) : où sont les sorts, avec quel DD ; ce qui est à corriger
    if (FEAT_SPELL_FEATS.includes(featId)) {
        const group = featSpellGroups(record, derived).find(g => g.featId === featId && g.level === grant.level);
        if (group) {
            add('featSlot', featSpellSummary(group), { applied: group.dc !== null });
            for (const warning of group.warnings) add('featSlot', warning, { check: true });
        }
    }

    // Augmentations de caractéristique : repère près de la valeur saisie, jamais ajoutées
    if (grant.abilities.length) {
        const parts = grant.abilities.map(({ ability, amount }) => `${abilityName(ability)} +${amount}`);
        add('featSlot', grant.abilities.length > 1
            ? `${listText(parts)} : repères près des valeurs. La fiche ne les ajoute pas : ajoutez-les vous-même aux valeurs saisies.`
            : `${listText(parts)} : repère près de la valeur. La fiche ne l'ajoute pas : ajoutez-le vous-même à la valeur saisie.`,
        { value: grant.abilities[0].amount, manual: true });
    }
    for (const { ability, amount } of grant.abilities) {
        add(`scores.${ability}`, `+${amount} ${ofWord(abilityName(ability))}. La valeur saisie n'est pas modifiée : ajoutez ce bonus vous-même s'il n'y est pas déjà.`,
            { value: amount, manual: true });
        const score = derived.scores[ability];
        if (score > 30) {
            const text = `${abilityName(ability)} ${score} : une caractéristique ne dépasse jamais 30.`;
            add('featSlot', text, { check: true });
            add(`scores.${ability}`, text, { check: true });
        } else if (score > 20 && !hasEpicBoon(derived)) {
            const text = `${abilityName(ability)} ${score} : un don ne fait pas dépasser 20 (seuls une Faveur épique, un objet magique ou une capacité de classe le permettent).`;
            add('featSlot', text, { check: true });
            add(`scores.${ability}`, text, { check: true });
        }
    }

    // Résilient : maîtrise du jet de sauvegarde choisi
    if (grant.save) {
        const ability = abilityName(grant.save);
        let text;
        let extra;
        if (classSaves(derived).includes(grant.save)) {
            text = `Votre classe (${derived.className}) maîtrise déjà le jet de sauvegarde ${ofWord(ability)} : Résilient doit porter sur une caractéristique dont le jet n'est pas maîtrisé.`;
            extra = { check: true };
        } else if (derived.saves[grant.save].proficient) {
            text = `Maîtrise du jet de sauvegarde ${ofWord(ability)} : case cochée.`;
            extra = { ticked: true };
        } else {
            text = `Maîtrise du jet de sauvegarde ${ofWord(ability)} à cocher (la fiche ne coche rien elle-même).`;
            extra = { check: true };
        }
        add('featSlot', text, extra);
        add(`saves.${grant.save}`, text, extra);
    }

    // Compétences : maîtrise ou Expertise due au don
    const picked = new Set();
    for (const { skill, kind, field } of grant.skills) {
        const skillLabel = skillName(skill);
        if (field.startsWith('pick')) {
            if (picked.has(skill)) {
                add('featSlot', `La compétence ${skillLabel} est choisie deux fois : choisissez trois maîtrises différentes.`, { check: true });
                continue;
            }
            picked.add(skill);
        }
        // Expert : l'Expertise porte sur une compétence déjà maîtrisée (case cochée, ou celle choisie en
        // Maîtrise). On lit la case elle-même : cocher le losange compte déjà la compétence comme maîtrisée.
        // Pas la Faveur de compétence : elle donne la maîtrise de toutes les compétences (« à cocher »).
        const unmastered = featId === 'expert' && kind === 'expertise' && record[`skill_prof_${skill}`] !== true
            && !grant.skills.some(other => other.kind === 'proficiency' && other.skill === skill);
        const [text, extra] = unmastered
            ? [`L'Expertise d'Expert porte sur une compétence que vous maîtrisez déjà (ou celle choisie en Maîtrise ci-dessus) : ${skillLabel} n'est pas maîtrisée.`, { check: true }]
            : skillNote(kind, skillLabel, derived.skills[skill]);
        add('featSlot', text, extra);
        add(`skills.${skill}`, text, extra);
    }
    if (grant.tools) {
        add('featSlot', `${grant.tools === 1 ? "1 maîtrise d'outil" : `${grant.tools} maîtrises d'outils`} : à noter dans le champ Outils (onglet Compétences & Histoire).`);
    }

    // Figure de proue — PHB 2024 « Inspiring Leader », p. 204 : niveau + modificateur de la
    // caractéristique augmentée par ce don (peut être négatif), à la fin de chaque repos
    if (featId === 'figure_de_proue') {
        const ability = grant.choice.ability;
        if (ability) {
            const hp = Math.max(0, derived.level + derived.mods[ability]);
            const formula = `niveau ${derived.level} ${signed(derived.mods[ability])} ${abilityName(ability)}`;
            add('rest', `Représentation galvanisante : à la fin du repos, jusqu'à 6 créatures (vous compris) à 9 m ou moins qui assistent à votre discours, chant ou danse gagnent ${hp} PV temporaires (${formula}). Les PV temporaires ne s'additionnent pas : on garde les plus élevés.`,
                { value: hp });
            add('featSlot', `Représentation galvanisante : ${hp} PV temporaires (${formula}) pour 6 créatures au plus (vous compris), à 9 m, à la fin de chaque repos court ou long (rappel dans la fenêtre du repos).`,
                { value: hp });
        } else {
            add('featSlot', 'PV temporaires de la Représentation galvanisante : niveau + modificateur de la caractéristique choisie ci-dessus.', { inactive: true });
        }
    }

    // Empoisonneur — PHB 2024 « Poisoner », p. 206 : DD 8 + mod. de la caractéristique augmentée + maîtrise
    if (featId === 'empoisonneur') {
        const ability = grant.choice.ability;
        if (ability) {
            const dc = 8 + derived.mods[ability] + derived.pb;
            add('featSlot', `Poison : jet de sauvegarde de Constitution DD ${dc} (8 ${signed(derived.mods[ability])} ${abilityName(ability)} ${signed(derived.pb)} maîtrise) ; raté : 2d8 dégâts de poison et Empoisonné jusqu'à la fin de votre prochain tour. Rappel sur chaque arme.`,
                { value: dc });
        } else {
            add('featSlot', 'DD du poison : 8 + modificateur de la caractéristique choisie ci-dessus + bonus de maîtrise.', { inactive: true });
        }
        add('featSlot', `Préparation : 1 heure et 50 po de matériaux pour ${derived.pb} doses ; action Bonus pour enduire une arme ou une munition (1 minute, ou jusqu'à ce qu'elle touche).`, { value: derived.pb });
        add('featSlot', 'Poison virulent : vos jets de dégâts de poison ignorent la Résistance au poison.');
        toolNote(record, /empoison/, "Kit d'empoisonneur", add);
    }

    // Rappels propres au don (noms des actions : ceux de js/data/feats.js)
    if (featId === 'observateur') add('featSlot', "Observation rapide : l'action Observation en action Bonus.");
    if (featId === 'esprit_affute') add('featSlot', "Étude rapide : l'action Étude en action Bonus.");
    if (featId === 'adepte_elementaire' && grant.element) {
        const word = elementWord(grant.element);
        add('featSlot', `Vos sorts ignorent la Résistance aux dégâts ${ofWord(word)} ; pour un sort qui inflige des dégâts ${ofWord(word)}, un 1 sur un dé de dégâts compte comme un 2. Repère « Adepte » sur ces sorts dans le grimoire.`);
        const twin = grants.find(other => other !== grant && other.featId === featId && other.element === grant.element);
        if (twin) {
            add('featSlot', `Même type de dégâts qu'au ${featSlotName(twin.level)} : chaque Adepte élémentaire doit porter sur un type différent.`, { check: true });
        }
    }
}

// -----------------------------------------------------------------------------
// Rappels sur une ligne d'arme
// -----------------------------------------------------------------------------

/** Rappel court d'un don sur une arme : condition (arme de corps à corps, type de dégâts…) et texte */
/**
 * Dons dont le rappel ne vaut qu'avec une arme, pas avec l'attaque à mains nues (PHB 2024 :
 * Sauvagerie martiale « with a weapon », Abattage « with a Melee weapon », Coup de bouclier « with a
 * Melee weapon », Poison « weapon or ammunition », Duel « a Melee weapon »).
 */
const WEAPON_ONLY_FEATS = new Set([
    'sauvagerie_martiale', 'maitre_des_armes_lourdes_cogneur_lourd', 'maitre_des_boucliers', 'empoisonneur', 'duel'
]);

const WEAPON_RULES = [
    // Lot 8 : Faveur d'attaque irrésistible, sur toute arme (et l'attaque à mains nues)
    { featId: 'faveur_d_attaque_irresistible', applies: () => true,
        value: ({ record, derived }) => irresistibleBoost(record, derived)?.score,
        text: ({ record, derived }) => {
            const boost = irresistibleBoost(record, derived);
            return `Sur un 20 au d20 : +${boost ? boost.score : '(valeur de la caractéristique du don)'} dégâts ; dégâts contondants, perforants et tranchants sans Résistance.`;
        } },
    // Lot 7 : Attaque à mains nues (PHB 2024 p. 377)
    { featId: 'bagarreur_de_tavernes', applies: ({ weapon }) => isUnarmedStrike(weapon),
        text: () => '1d4 au lieu de 1 (le plus gros dé est compté), relancez les 1 ; une fois par tour (action Attaque), vous pouvez aussi repousser la cible de 1,50 m.' },
    { featId: 'empoigneur', applies: ({ weapon }) => isUnarmedStrike(weapon),
        value: ({ derived }) => grappleDC(derived),
        text: ({ derived }) => `Frappe et empoignade : une fois par tour (action Attaque), dégâts et Lutte en même temps (DD ${grappleDC(derived)}) ; Avantage contre la créature que vous agrippez.` },
    { featId: 'combat_a_mains_nues', applies: ({ weapon }) => isUnarmedStrike(weapon),
        text: () => "1d6, ou 1d8 si vous ne tenez ni arme ni bouclier (le tableau compte 1d6 : réglez le dé dans la configuration de la ligne si besoin). Au début de votre tour, 1d4 contondants à la créature que vous agrippez." },
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
        text: () => 'Une fois par tour, relancer un dé de dégâts ; sur un critique, un dé de dégâts de plus.' },
    // Lot 5
    { featId: 'duelliste_defensif', applies: ({ weapon }) => hasProperty(weapon, 'finesse'),
        value: ({ derived }) => derived.pb,
        text: ({ derived }) => `Parade : en Réaction quand une attaque au corps à corps vous touche, +${derived.pb} à la CA contre le corps à corps jusqu'au début de votre prochain tour.` },
    { featId: 'maitre_d_hast', applies: ({ weapon }) => isPolearm(weapon),
        text: ({ weapon, derived, buffs }) => {
            // Frappe double : toujours un d4 contondant (dé ou type réglé pour l'arme ignorés, bonus
            // magique gardé) ; Rage et Marque du chasseur comptent, pas Cogneur lourd ni la Charge
            // (réservés à l'action Attaque)
            const { dmgDieOverride, dmgTypeOverride, ...config } = parseWeaponConfig(weapon.weaponConfig);
            const strike = computeWeapon({ ...weapon, baseDmg: '1d4 cont.', weaponConfig: config }, derived,
                { rage: Boolean(buffs.rage), hunterMark: Boolean(buffs.hunterMark) });
            const attack = strike ? strike.attack.text.split(':').pop().trim() : '';
            const damage = strike ? strike.damage.text : '1d4 contondants';
            const reach = hasProperty(weapon, 'allonge') ? '3 m' : '1,50 m';
            return `Frappe double (action Bonus, juste après l'action Attaque avec cette arme) : attaque ${attack} avec l'autre bout, ${damage}. Frappe réactive (Réaction) : une attaque quand une créature entre dans votre allonge (${reach}).`;
        } },
    { featId: 'empoisonneur', applies: ({ record, derived }) => poisonerDC(record, derived) !== null,
        value: ({ record, derived }) => poisonerDC(record, derived),
        text: ({ record, derived }) => `Poison (action Bonus, 1 dose) : jet de sauvegarde de Constitution DD ${poisonerDC(record, derived)}, sinon 2d8 dégâts de poison et Empoisonné.` },
    // Lot 4 : styles de combat
    { featId: 'archerie', applies: ({ weapon }) => { const reach = weaponReach(weapon); return reach.ranged && !reach.melee; },
        value: 2,
        text: () => "+2 à l'attaque, déjà compté." },
    { featId: 'duel', applies: ({ melee, weapon }) => melee && !hasProperty(weapon, 'deux mains'),
        text: ({ buffs }) => buffs.dueling
            ? '+2 aux dégâts compté (bouton « Duel » allumé) : à une main, sans autre arme.'
            : '+2 aux dégâts si vous la tenez à une main sans autre arme ; allumez le bouton « Duel (+2) » au-dessus du tableau.' },
    { featId: 'arme_a_deux_mains', applies: ({ melee, weapon }) => melee && (hasProperty(weapon, 'deux mains') || hasProperty(weapon, 'polyvalente')),
        text: ({ weapon }) => {
            const versatile = fold(weapon.prop).match(/polyvalente\s*\(([^)]+)\)/);
            return `Tenue à deux mains, chaque 1 ou 2 sur un dé de dégâts compte comme un 3${versatile ? ` (avec le dé à deux mains, ${versatile[1].trim()})` : ''}.`;
        } },
    { featId: 'arme_de_lancer', applies: ({ weapon }) => hasProperty(weapon, 'lancer'),
        text: ({ weapon, derived, buffs }) => {
            // Lancée : attaque à distance (ni Duel, ni Charge, réservés au corps à corps) ; le +2 est
            // un bonus nommé de computeWeapon (un ancien dé libre, « 2d4 + 1 », reste juste)
            const strike = computeWeapon(weapon, derived, { ...buffs, dueling: false, charger: false, thrownWeapon: true });
            return `Lancée (attaque à distance), dégâts ${strike ? strike.damage.text : '+2'}.`;
        } },
    { featId: 'combat_a_deux_armes', applies: ({ weapon }) => hasProperty(weapon, 'legere'),
        text: ({ weapon, derived, buffs }) => {
            // Attaque en plus en action Bonus avec une seconde arme : ni Duel (aucune autre arme), ni
            // Charge (action Attaque seulement)
            const strike = computeWeapon(weapon, derived, { ...buffs, dueling: false, charger: false });
            return `L'attaque en plus (action Bonus) avec cette arme Légère garde le modificateur aux dégâts${strike ? ` : ${strike.damage.text}` : ''}.`;
        } },
    // Lot 7 : armes à distance, arbalètes, deux armes
    { featId: 'tireur_d_elite', applies: ({ weapon }) => weaponReach(weapon).ranged,
        // Une arme de corps à corps lancée n'est pas une arme à distance : seul le contournement d'abri vaut
        text: ({ weapon }) => (weaponReach(weapon).melee
            ? 'Lancée, elle ignore les Abris partiels et supérieurs.'
            : 'Ignore les Abris partiels et supérieurs ; ni la longue portée ni un ennemi à 1,50 m ne donnent le Désavantage.') },
    { featId: 'maitre_arbaletrier', applies: ({ weapon }) => isCrossbow(weapon),
        text: ({ weapon, derived, buffs }) => {
            const light = hasProperty(weapon, 'legere');
            const strike = light ? computeWeapon(weapon, derived, buffs) : null;
            return "Chargement ignoré ; pas de Désavantage à 1,50 m d'un ennemi"
                + (light ? ` ; l'attaque en plus (Légère) garde le modificateur aux dégâts${strike ? ` : ${strike.damage.text}` : ''}` : '') + '.';
        } },
    { featId: 'combattant_a_deux_armes',
        applies: ({ melee, weapon }) => melee && !isUnarmedStrike(weapon) && !hasProperty(weapon, 'deux mains') && !hasProperty(weapon, 'legere'),
        text: () => "Utilisable pour l'attaque en plus (action Bonus) après une attaque avec une arme Légère, même sans être Légère (sans modificateur aux dégâts)." }
];

/**
 * Rappels de dons pour une ligne du tableau des armes, selon sa portée (corps à corps) et son type
 * de dégâts. Seules les armes rattachées au manuel (nom et caractéristique d'attaque, comme
 * computeWeapon) reçoivent des rappels : une ancienne ligne libre (« Perception bestiale ») n'en a pas.
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {Object} character - personnage (pour les dons atteints)
 * @param {Object} [derived] - deriveCharacter(character), recalculé s'il est absent
 * @param {Object} [buffs] - bonus de combat actifs (Rage…), comme pour computeWeapon
 * @returns {FeatNote[]}
 */
export function weaponFeatNotes(weapon, character, derived = deriveCharacter(character || {}), buffs = {}) {
    if (isBlankWeapon(weapon) || !weapon.atkKey || !String(weapon.name ?? '').replace(/<[^>]*>/g, '').trim()) return [];
    const feats = new Set(derived.feats ?? reachedFeatIds(character));
    const ctx = { derived, record: character || {}, weapon, buffs: buffs || {}, melee: weaponReach(weapon).melee, type: weaponDamageType(weapon) };
    // L'attaque à mains nues n'est pas une arme : pas les rappels réservés aux armes
    const unarmed = isUnarmedStrike(weapon);
    // Arme non maîtrisée (ou maîtrise supposée) : rappel en tête, avant ceux des dons
    const proficiency = weaponProficiency(weapon, derived);
    const proficiencyText = weaponProficiencyNote(proficiency, derived.pb, Boolean(findMastery(weapon.prof)));
    const first = proficiencyText ? [proficiency.proficient
        ? { featId: 'maitrise_supposee', featName: 'Maîtrise supposée', text: proficiencyText, classFeature: true }
        : { featId: 'sans_maitrise', featName: 'Sans maîtrise', text: proficiencyText, value: derived.pb, check: true, classFeature: true }] : [];
    return [...first, ...WEAPON_RULES
        .filter(rule => feats.has(rule.featId) && !(unarmed && WEAPON_ONLY_FEATS.has(rule.featId)) && rule.applies(ctx))
        .map(rule => {
            const value = typeof rule.value === 'function' ? rule.value(ctx) : rule.value;
            return note(rule.featId, rule.text(ctx), value === undefined ? {} : { value });
        }),
        // Coup critique élargi (Champion, L'Hoplite) : capacité de sous-classe
        ...subclassWeaponNotes(weapon, derived),
        // Manœuvres, Rossée de racines, Maître de la lance (lot 5)
        ...subclassCombatWeaponNotes(weapon, derived)];
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
    // Un don choisi deux fois (Humain qui reprend le don de son historique, ancienne sauvegarde) : un don
    // se prend une fois (PHB 2024, sauf « Répétable ») ; le second emplacement n'a qu'une alerte. Les dons
    // à choix ont la leur plus bas (répétables compris : Doué, Initié à la magie…).
    const firstSlot = new Map();
    for (const slot of featSlots(record)) {
        if (!slot.reached) continue;
        const first = !firstSlot.has(slot.featId);
        if (first) firstSlot.set(slot.featId, slot.level);
        else if (Object.hasOwn(FEATS_DATA, slot.featId) && !REPEATABLE_CHOICE_FEATS.includes(slot.featId)) {
            // Dons à choix (le +1 de Sentinelle, Mobile…) : l'alerte vient de la boucle des choix
            if (!Object.hasOwn(FEAT_CHOICE_RULES, slot.featId)) {
                (effects[`featSlot:${slot.level}`] ??= []).push(note(slot.featId,
                    `${featName(slot.featId)} est déjà pris au ${featSlotName(firstSlot.get(slot.featId))} : ce don ne se prend qu'une fois. Choisissez un autre don ici.`,
                    { check: true, slot: slot.level }));
            }
            continue;
        }
        // Faveur épique (PHB 2024) : prérequis niveau 19. Le don se choisit au niveau où l'emplacement
        // s'acquiert : une faveur notée dans un emplacement plus bas (16, 4, origine) ne remplit pas le
        // prérequis, même une fois le personnage au niveau 19.
        if (Object.hasOwn(FEATS_DATA, slot.featId) && FEATS_DATA[slot.featId].type === 'Épique' && featSlotLevelFor(slot.level, record) < 19) {
            (effects[`featSlot:${slot.level}`] ??= []).push(note(slot.featId,
                'Prérequis : niveau 19 (les faveurs épiques se prennent au niveau 19).', { check: true }));
        }
        // Style de combat (PHB 2024) : prérequis « capacité Style de combat » (Guerrier ; Paladin et Rôdeur au niveau 2)
        if (Object.hasOwn(FEATS_DATA, slot.featId) && FEATS_DATA[slot.featId].type === 'Style de combat' && !hasFightingStyle(record)) {
            (effects[`featSlot:${slot.level}`] ??= []).push(note(slot.featId,
                'Prérequis : la capacité Style de combat (Guerrier dès le niveau 1, Paladin ou Rôdeur dès le niveau 2).',
                { check: true }));
        }
        if (!Object.hasOwn(FEAT_RULES, slot.featId)) continue;
        const rule = FEAT_RULES[slot.featId];
        const slotZone = `featSlot:${slot.level}`;
        rule({
            derived,
            record,
            add: (zone, text, extra) => {
                if (zone !== 'featSlot' && !first) return;
                const key = zone === 'featSlot' ? slotZone : zone;
                (effects[key] ??= []).push(note(slot.featId, text, extra));
            }
        });
    }

    // Dons à choix : un don répétable (Amélioration de caractéristique, Doué, Adepte élémentaire)
    // donne des notes pour chaque emplacement ; les autres, une seule fois (ancienne sauvegarde)
    const grants = featChoiceGrants(record);
    const firstLevel = new Map();
    for (const grant of grants) {
        // Don non répétable déjà pris plus bas (ancienne sauvegarde) : ce second choix ne compte pas
        if (firstLevel.has(grant.featId) && !REPEATABLE_CHOICE_FEATS.includes(grant.featId)) {
            (effects[`featSlot:${grant.level}`] ??= []).push(note(grant.featId,
                `${grant.featName} est déjà pris au ${featSlotName(firstLevel.get(grant.featId))} : ce don ne se prend qu'une fois. Choisissez un autre don ici.`,
                { check: true, slot: grant.level }));
            continue;
        }
        if (!firstLevel.has(grant.featId)) firstLevel.set(grant.featId, grant.level);
        choiceNotes(grant, {
            derived,
            grants,
            record,
            add: (zone, text, extra = {}) => {
                const key = zone === 'featSlot' ? `featSlot:${grant.level}` : zone;
                const list = (effects[key] ??= []);
                // Même alerte (valeur au-delà de 20) venue de deux dons : affichée une fois
                if (extra.check && zone !== 'featSlot' && list.some(n => n.check && n.text === text)) return;
                list.push(note(grant.featId, text, { ...extra, slot: grant.level }));
            }
        });
    }

    // Capacités de classe et de sous-classe (Aura de protection, Touche-à-tout, Résistance draconique…)
    for (const [zone, notes] of Object.entries(classFeatureNotes(derived, record))) {
        (effects[zone] ??= []).push(...notes);
    }

    // Rappels sur chaque ligne d'arme
    const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
    weapons.forEach((weapon, index) => {
        const notes = weaponFeatNotes(weapon, record, derived);
        if (notes.length) effects[`weapon:${index}`] = notes;
    });

    return effects;
}
