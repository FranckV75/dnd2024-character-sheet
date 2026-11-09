// =============================================================================
// WEAPON-MASTERIES.JS (règles) - Bottes d'armes : fonctions pures, sans DOM
//  - retrouver la botte écrite dans la colonne « Botte d'arme » (clé prof d'une arme)
//  - valeurs calculées pour une arme précise (Écorchure, Renversement, Enchaînement)
//  - capacité de classe Maîtrise des armes : nombre de types d'armes au niveau du personnage
// Rien n'est jamais réécrit : ces fonctions lisent le personnage, elles ne le modifient pas.
// =============================================================================

import {
    WEAPON_MASTERIES, WEAPON_MASTERY_CLASSES, TACTICAL_MASTER, WEAPON_MASTER_FEAT_ID
} from '../data/weapon-masteries.js';
import { DD_RULES } from '../data/dd-rules.js';
import { deriveCharacter, computeWeapon, weaponStatOverride } from './character.js';
import { parseWeaponConfig, resolveWeaponAttackStat, getRageBonus } from './logic.js';
import { weaponDamageType } from './weapons.js';
import { hasFeat } from './feats.js';

/** Nom complet de la caractéristique d'attaque (libellés de resolveWeaponAttackStat) */
const STAT_NAMES = { FOR: 'Force', DEX: 'Dextérité', CON: 'Constitution', INT: 'Intelligence', SAG: 'Sagesse', CHA: 'Charisme' };

/** Type de dégâts (abréviation de WEAPON_DAMAGE_TYPES) → fin de « dégâts … » */
const DAMAGE_TYPE_WORDS = {
    TRAN: 'tranchants', CONT: 'contondants', PERF: 'perforants', FEU: 'de feu', FROID: 'de froid',
    NECR: 'nécrotiques', RADI: 'radiants', FORCE: 'de force', PSYCH: 'psychiques', POISON: 'de poison',
    ACIDE: "d'acide", FOUDRE: 'de foudre', TONNERRE: 'de tonnerre'
};

/** Texte brut d'une saisie (les anciennes sauvegardes peuvent contenir du HTML) */
function plain(value) {
    if (value === null || value === undefined || typeof value === 'object') return '';
    return String(value)
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
}

/** Clé de comparaison : sans HTML, minuscules, sans accents, sans espaces ni tirets */
function key(value) {
    return plain(value).toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[\s '’-]+/g, '');
}

/** Bottes dont la règle donne une valeur chiffrée pour l'arme (voir masteryDetails) */
const MASTERIES_WITH_VALUES = new Set(['cleave', 'graze', 'topple']);

/** Phrases affichées quand la valeur d'une de ces bottes ne peut pas être calculée */
export const MASTERY_NOTES = {
    offBook: "La fiche ne peut pas calculer la valeur pour cette arme : elle n'est pas rattachée au manuel (choisissez son nom dans la liste des armes).",
    noDie: "La fiche ne peut pas calculer les dégâts de cette arme : son dé de dégâts est inconnu."
};

/** Dé de dégâts au format du manuel (« 1d12 », « 2d6 ») ou dégâts fixes (« 1 ») */
const STANDARD_DIE = /^(\d{1,2}d\d{1,3}|\d{1,3})$/i;

/** Nom français et nom anglais du manuel → identifiant de la botte */
const LOOKUP = new Map();
for (const [id, mastery] of Object.entries(WEAPON_MASTERIES)) {
    LOOKUP.set(key(mastery.name), id);
    LOOKUP.set(key(mastery.en), id);
}

const signed = (n) => `${n >= 0 ? '+' : '-'}${Math.abs(n)}`;

/**
 * Botte écrite dans la colonne « Botte d'arme ». Seuls les noms exacts du manuel sont reconnus
 * (français ou anglais), quelles que soient la casse, les accents, les espaces ou le HTML hérité ;
 * aucune correspondance approximative.
 * @param {*} value - clé prof d'une ligne de dynamic_weapons
 * @returns {{ id: string, name: string, en: string, page: number, desc: string } | null}
 *   null si la valeur est vide ou n'est pas une botte connue
 */
export function findMastery(value) {
    const k = key(value);
    if (!k) return null;
    const id = LOOKUP.get(k);
    return id ? { id, ...WEAPON_MASTERIES[id] } : null;
}

/**
 * Paragraphes du texte d'une botte, en texte brut (pour textContent) : <br> sépare les
 * paragraphes ; les espaces insécables entre un nombre et son unité sont conservées.
 * @param {{ desc: string }} mastery - résultat de findMastery
 * @returns {string[]}
 */
export function masteryParagraphs(mastery) {
    return String(mastery?.desc || '')
        .split(/<br\s*\/?>/i)
        .map(part => part.replace(/<[^>]*>/g, '').replace(/[ \t\r\n]+/g, ' ').trim())
        .filter(Boolean);
}

/**
 * Détail de la botte d'une arme, avec les valeurs calculées pour CETTE arme quand la règle en donne :
 *  - Écorchure : dégâts égaux au modificateur de la caractéristique d'attaque, sans bonus magique
 *    ni Rage (le manuel : ces dégâts ne peuvent augmenter qu'en augmentant le modificateur) ;
 *    modificateur de 0 ou moins : aucun dégât ;
 *  - Renversement : DD 8 + modificateur de la caractéristique d'attaque + bonus de maîtrise ;
 *  - Enchaînement : dés de l'arme, + bonus magique, + Rage si elle est active et que l'attaque
 *    utilise la Force (PHB 2024 p. 51), sans le modificateur sauf s'il est négatif.
 * La caractéristique d'attaque est celle de computeWeapon (weaponStatOverride, character.js :
 * configuration de l'arme, Dextérité du Moine). Sans arme rattachée au manuel (computeWeapon null), aucune valeur.
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {Object} character - personnage (format de sauvegarde), jamais modifié
 * @param {Object} [derived] - deriveCharacter(character)
 * @param {Object} [buffs] - bonus de combat actifs (effectiveBuffs de js/rules/weapons.js) ;
 *   seule la Rage compte ici (Enchaînement)
 * @returns {{ mastery: Object, values: Array<{ label: string, value: string, detail?: string }>,
 *             note: string|null } | null}
 *   null si la colonne « Botte d'arme » ne contient pas une botte connue. note : phrase qui dit
 *   pourquoi une botte qui a d'habitude une valeur n'en a pas ici (MASTERY_NOTES), sinon null.
 */
export function masteryDetails(weapon, character, derived = deriveCharacter(character), buffs = {}) {
    if (!weapon || typeof weapon !== 'object') return null;
    const mastery = findMastery(weapon.prof);
    if (!mastery) return null;
    const values = [];
    const computed = computeWeapon(weapon, derived);
    if (!computed) {
        return { mastery, values, note: MASTERIES_WITH_VALUES.has(mastery.id) ? MASTERY_NOTES.offBook : null };
    }

    const config = parseWeaponConfig(weapon.weaponConfig);
    const prop = plain(weapon.prop);
    // Même caractéristique que le tableau (Dextérité d'un Moine avec une arme de Moine)
    const { stat, mod } = resolveWeaponAttackStat(weapon.atkKey, prop, derived.mods, weaponStatOverride(weapon, derived));
    const statText = `${STAT_NAMES[stat] || stat} ${signed(mod)}`;
    const typeWord = DAMAGE_TYPE_WORDS[weaponDamageType(weapon)] || '';
    // « 1 dégât tranchant », « 5 dégâts tranchants » (« de feu » ne change pas)
    const damageWord = (n) => n > 1
        ? `${n} dégâts${typeWord ? ` ${typeWord}` : ''}`
        : `${n} dégât${typeWord ? ` ${typeWord.replace(/^([^ ']+)s$/, '$1')}` : ''}`;

    if (mastery.id === 'graze') {
        values.push(mod > 0
            ? { label: "Dégâts si l'attaque rate", value: damageWord(mod), detail: `modificateur de ${statText}` }
            : { label: "Dégâts si l'attaque rate", value: 'aucun', detail: `modificateur de ${statText} : pas de dégâts` });
    } else if (mastery.id === 'topple') {
        const dc = 8 + mod + derived.pb;
        values.push({
            label: 'DD du jet de sauvegarde de Constitution',
            value: String(dc),
            detail: `8 ${signed(mod)} (${STAT_NAMES[stat] || stat}) +${derived.pb} (bonus de maîtrise)`
        });
    } else if (mastery.id === 'cleave') {
        // Dés de l'arme tels que computeWeapon les affiche (dé imposé, dé d'arts martiaux...)
        const die = ((computed.damage.tooltip.match(/^Des: (.*?) \|/) || [])[1] || '').trim();
        if (!die) return { mastery, values, note: MASTERY_NOTES.noDie };
        const magic = Number.parseInt(config.magicBonus, 10) || 0;
        // Rage (PHB 2024 p. 51) : bonus aux dégâts de toute attaque qui utilise la Force
        const rage = buffs?.rage === true && stat === 'FOR' ? getRageBonus(derived.level) : 0;
        const bonus = magic + rage + (mod < 0 ? mod : 0);
        // Ancien dé libre (« 1d8+1d6 feu ») : affiché tel quel, sans y ajouter le type de l'arme
        const standard = STANDARD_DIE.test(die.replace(/\s+/g, ''));
        const parts = [mod < 0 ? `modificateur de ${statText} compté car négatif` : `sans le modificateur de ${statText}`];
        if (magic) parts.push(`${signed(magic)} (bonus magique)`);
        if (rage) parts.push(`+${rage} (Rage)`);
        values.push({
            label: 'Dégâts à la seconde créature',
            value: `${die}${bonus ? ` ${signed(bonus)}` : ''}${standard && typeWord ? ` ${typeWord}` : ''}`,
            detail: parts.join(' ; ')
        });
    }
    return { mastery, values, note: null };
}

/** Nombre de types d'armes indiqué par la table de la classe pour ce niveau */
function countAtLevel(counts, level) {
    let count = 0;
    for (const [minLevel, n] of counts) if (level >= minLevel) count = n;
    return count;
}

/**
 * Capacité de classe Maîtrise des armes (Barbare, Guerrier, Paladin, Rôdeur, Roublard).
 * @param {Object} source - résultat de deriveCharacter, ou personnage au format de sauvegarde
 * @returns {{ classSlug: string, className: string, level: number, count: number, kinds: string,
 *             rest: string, page: number, desc: string, tacticalMaster: Object|null } | null}
 *   null si la classe n'a pas cette capacité (ou est inconnue)
 */
export function weaponMasteryFeature(source) {
    const derived = source && typeof source.classSlug === 'string' && Number.isFinite(source.level)
        ? source
        : deriveCharacter(source || {});
    const feature = WEAPON_MASTERY_CLASSES[derived.classSlug];
    if (!feature) return null;
    return {
        classSlug: derived.classSlug,
        className: DD_RULES.classes[derived.classSlug]?.nameFr || derived.classSlug,
        level: derived.level,
        count: countAtLevel(feature.counts, derived.level),
        kinds: feature.kinds,
        rest: feature.rest,
        page: feature.page,
        desc: feature.desc,
        tacticalMaster: derived.classSlug === 'fighter' && derived.level >= TACTICAL_MASTER.level ? { ...TACTICAL_MASTER } : null
    };
}

/**
 * Le personnage a-t-il atteint le don Maître d'armes (botte d'un type d'arme de plus) ?
 * @param {Object} character
 * @returns {boolean}
 */
export function hasWeaponMasterFeat(character) {
    return hasFeat(character, WEAPON_MASTER_FEAT_ID);
}

/**
 * Phrase à afficher sous la description d'une botte : qui peut l'utiliser.
 * @param {Object} character
 * @param {Object} [derived] - deriveCharacter(character)
 * @returns {string}
 */
export function masteryAccessNote(character, derived = deriveCharacter(character)) {
    const feature = weaponMasteryFeature(derived);
    const featText = "Le don Maître d'armes permet d'utiliser la botte d'un type d'arme courante ou de guerre que vous maîtrisez (à changer, si vous le voulez, après un Repos long).";
    const feat = hasWeaponMasterFeat(character);
    if (feature) {
        const tactical = feature.tacticalMaster;
        return `Votre classe (${feature.className} niveau ${feature.level}) a la capacité Maîtrise des armes : `
            + `vous pouvez utiliser la botte de ${feature.count} types d'${feature.kinds}. ${feature.rest}`
            + (tactical ? ` ${tactical.name} : ${tactical.desc.charAt(0).toLowerCase()}${tactical.desc.slice(1)}` : '')
            + (feat ? ` En plus, ${featText.charAt(0).toLowerCase()}${featText.slice(1)}` : '');
    }
    if (!derived.classSlug) {
        // Classe vide, écrite autrement que dans le manuel ou multiclasse (« Guerrier / Magicien ») :
        // la fiche ne peut ni affirmer ni refuser l'accès à la botte
        return "La fiche ne reconnaît pas votre classe : vérifiez si une capacité de classe "
            + "(Maîtrise des armes : Barbare, Guerrier, Paladin, Rôdeur, Roublard) ou un don "
            + "(Maître d'armes) vous donne accès à cette botte."
            + (feat ? ` ${featText}` : '');
    }
    if (feat) return featText;
    return "Votre classe n'a pas la capacité Maîtrise des armes : vous ne pouvez pas utiliser cette botte (un don, comme Maître d'armes, peut l'accorder).";
}
