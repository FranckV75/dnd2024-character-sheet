// =============================================================================
// WEAPONS.JS (règles) - Tableau des armes : fonctions pures, sans DOM
//  - filtres d'affichage (Courantes / Guerre / Corps à corps / Distance)
//  - ligne d'arme remplie à partir du manuel (DD_RULES.weapons)
//  - configuration personnalisée d'une arme (champ weaponConfig, format v3)
//  - bonus de combat proposés selon la classe (Rage, Attaque sournoise, Marque du chasseur)
// =============================================================================

import { parseWeaponConfig } from './logic.js';

export const WEAPON_FILTERS = ['all', 'simple', 'martial', 'melee', 'ranged'];

/** Caractéristiques d'attaque proposées dans la configuration (clé v3 → libellé) */
export const WEAPON_STAT_OVERRIDES = ['str', 'dex', 'cha', 'wis', 'int'];

/** Types de dégâts proposés dans la configuration (abréviations v3) */
export const WEAPON_DAMAGE_TYPES = [
    'TRAN', 'CONT', 'PERF', 'FEU', 'FROID', 'NECR', 'RADI', 'FORCE',
    'PSYCH', 'POISON', 'ACIDE', 'FOUDRE', 'TONNERRE'
];

const DIE_SIZES = new Set([4, 6, 8, 10, 12, 20]);
const MAX_MAGIC_BONUS = 3;

/** Bonus de combat ouverts par chaque classe (clé de combat_buffs) */
const CLASS_BUFFS = {
    barbarian: ['rage'],
    rogue: ['sneakAttack'],
    ranger: ['hunterMark']
};

/** Texte brut (les anciennes sauvegardes peuvent contenir un peu de HTML) */
function plain(value) {
    return (value ?? '').toString()
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
}

function fold(value) {
    return plain(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Portée d'une arme d'après ses propriétés (règles D&D 2024, PHB « Weapons ») :
 *  - Munitions : arme à distance uniquement ;
 *  - Lancer : arme de corps à corps qui peut aussi être lancée (attaque à distance),
 *    elle apparaît donc dans les deux filtres (Dague, Hachette, Javeline...) ;
 *  - la Fléchette est classée par le manuel parmi les « armes courantes à distance »
 *    alors qu'elle n'a que la propriété Lancer : elle est à distance uniquement.
 * @param {{ name?: string, prop?: string }} weapon
 * @returns {{ melee: boolean, ranged: boolean }}
 */
export function weaponReach(weapon) {
    const prop = fold(weapon?.prop);
    if (prop.includes('munitions')) return { melee: false, ranged: true };
    if (fold(weapon?.name).startsWith('flechette')) return { melee: false, ranged: true };
    if (prop.includes('lancer')) return { melee: true, ranged: true };
    return { melee: true, ranged: false };
}

/**
 * La ligne doit-elle être affichée avec ce filtre ?
 * Une ligne sans nom reste toujours visible (ligne qu'on est en train d'ajouter).
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {string} filter - 'all' | 'simple' | 'martial' | 'melee' | 'ranged'
 * @returns {boolean}
 */
export function matchesWeaponFilter(weapon, filter) {
    if (!filter || filter === 'all' || !WEAPON_FILTERS.includes(filter)) return true;
    if (!plain(weapon?.name)) return true;
    const category = fold(weapon?.category);
    switch (filter) {
        case 'simple': return category.includes('courante');
        case 'martial': return category.includes('guerre');
        case 'melee': return weaponReach(weapon).melee;
        case 'ranged': return weaponReach(weapon).ranged;
        default: return true;
    }
}

/**
 * Ligne remplie après un choix dans la liste des armes du manuel.
 * Les clés inconnues de la ligne (anciennes sauvegardes) et ses munitions / notes sont conservées.
 * @param {Object} row - ligne existante
 * @param {{ name: string, atk: string, dmg: string, prop: string, prof: string, category: string }} ref
 * @returns {Object}
 */
export function rowFromRulebookWeapon(row, ref) {
    return {
        ...row,
        name: ref.name,
        atkKey: ref.atk,
        baseDmg: ref.dmg,
        prop: ref.prop,
        prof: ref.prof,
        category: ref.category || ''
    };
}

/**
 * Nom saisi à la main et reconnu dans le manuel : complète les champs de calcul vides,
 * sans toucher au nom tel qu'il a été écrit ni aux champs déjà remplis.
 * @param {Object} row
 * @param {Object|null} ref - résultat de findRulebookWeapon(row.name)
 * @returns {Object} la ligne inchangée si rien n'est à compléter
 */
export function completeRowFromRulebook(row, ref) {
    if (!ref || row.atkKey) return row;
    return {
        ...row,
        atkKey: ref.atk,
        baseDmg: plain(row.baseDmg) ? row.baseDmg : ref.dmg,
        category: plain(row.category) ? row.category : (ref.category || ''),
        prop: plain(row.prop) ? row.prop : ref.prop,
        prof: plain(row.prof) ? row.prof : ref.prof
    };
}

/**
 * Valide un dé de dégâts saisi (« 1d8 », « 2D6 »...). Vide = pas de remplacement.
 * @param {string} value
 * @returns {{ ok: boolean, value: string }}
 */
export function normalizeDamageDie(value) {
    const text = (value ?? '').toString().trim().toLowerCase().replace(/\s+/g, '');
    if (!text) return { ok: true, value: '' };
    const match = text.match(/^(\d{1,2})d(\d{1,2})$/);
    if (!match) return { ok: false, value: text };
    const count = Number(match[1]);
    const size = Number(match[2]);
    if (count < 1 || count > 20 || !DIE_SIZES.has(size)) return { ok: false, value: text };
    return { ok: true, value: `${count}d${size}` };
}

/** Texte d'une ancienne valeur libre (sans transformation autre que trim) */
function legacyText(value) {
    return value === null || value === undefined || typeof value === 'object' ? '' : String(value).trim();
}

/**
 * Configuration d'une arme lue pour le formulaire : valeurs inconnues ramenées à « Auto ».
 * Exception : un dé de dégâts libre saisi en v3 (« 1d8+1d6 », « 2d4 + 1 »...) que la
 * validation stricte refuse est rendu tel quel, pour ne jamais l'effacer en silence
 * (computeWeapon l'utilise toujours et buildWeaponConfig le conserve s'il n'est pas modifié).
 * @param {string|Object} raw - champ weaponConfig (chaîne JSON en v3)
 * @returns {{ statOverride: string, magicBonus: number, dmgDieOverride: string, dmgTypeOverride: string }}
 */
export function readWeaponConfig(raw) {
    const config = parseWeaponConfig(raw);
    const magic = parseInt(config.magicBonus, 10);
    const die = normalizeDamageDie(config.dmgDieOverride);
    return {
        statOverride: WEAPON_STAT_OVERRIDES.includes(config.statOverride) ? config.statOverride : '',
        magicBonus: Number.isFinite(magic) ? Math.max(0, Math.min(MAX_MAGIC_BONUS, magic)) : 0,
        dmgDieOverride: die.ok ? die.value : legacyText(config.dmgDieOverride),
        dmgTypeOverride: WEAPON_DAMAGE_TYPES.includes(config.dmgTypeOverride) ? config.dmgTypeOverride : ''
    };
}

/**
 * Valide le formulaire de configuration et produit la chaîne JSON à enregistrer (format v3 :
 * {statOverride, magicBonus, dmgDieOverride, dmgTypeOverride}). Les autres clés éventuellement
 * présentes dans l'ancienne configuration sont conservées, de même qu'un ancien dé de dégâts
 * libre (format v3) laissé tel quel dans le formulaire.
 * @param {Object} input - valeurs du formulaire
 * @param {string|Object} [previous] - ancienne valeur de weaponConfig
 * @returns {{ ok: true, value: string } | { ok: false, errors: Object<string, string> }}
 */
export function buildWeaponConfig(input, previous = '') {
    const errors = {};
    const previousConfig = parseWeaponConfig(previous);
    const statOverride = (input?.statOverride ?? '').toString();
    if (statOverride && !WEAPON_STAT_OVERRIDES.includes(statOverride)) {
        errors.statOverride = 'Caractéristique inconnue.';
    }
    const magicBonus = Number(input?.magicBonus ?? 0);
    if (!Number.isInteger(magicBonus) || magicBonus < 0 || magicBonus > MAX_MAGIC_BONUS) {
        errors.magicBonus = 'Le bonus magique va de +0 à +3.';
    }
    let die = normalizeDamageDie(input?.dmgDieOverride);
    const legacyDie = legacyText(previousConfig.dmgDieOverride);
    if (!die.ok && legacyDie && legacyText(input?.dmgDieOverride) === legacyDie) {
        die = { ok: true, value: legacyDie };
    }
    if (!die.ok) {
        errors.dmgDieOverride = 'Format attendu : nombre de dés, « d », taille du dé (ex. 1d8, 2d6). Dés : d4, d6, d8, d10, d12, d20.';
    }
    const dmgTypeOverride = (input?.dmgTypeOverride ?? '').toString();
    if (dmgTypeOverride && !WEAPON_DAMAGE_TYPES.includes(dmgTypeOverride)) {
        errors.dmgTypeOverride = 'Type de dégâts inconnu.';
    }
    if (Object.keys(errors).length) return { ok: false, errors };

    return {
        ok: true,
        value: JSON.stringify({
            ...previousConfig,
            statOverride,
            magicBonus,
            dmgDieOverride: die.value,
            dmgTypeOverride
        })
    };
}

/**
 * Bonus de combat proposés pour une classe.
 * @param {string} slug - identifiant de classe (deriveCharacter().classSlug)
 * @returns {string[]} clés de combat_buffs
 */
export function buffsForClass(slug) {
    return CLASS_BUFFS[slug] ? [...CLASS_BUFFS[slug]] : [];
}

/**
 * Bonus réellement appliqués aux dégâts : seulement ceux que la classe actuelle propose
 * (un bonus resté actif après un changement de classe n'est plus compté).
 * @param {string} slug
 * @param {Object} buffs - combat_buffs
 * @returns {{ rage: boolean, sneakAttack: boolean, hunterMark: boolean }}
 */
export function effectiveBuffs(slug, buffs) {
    const allowed = buffsForClass(slug);
    const on = (key) => allowed.includes(key) && buffs?.[key] === true;
    return { rage: on('rage'), sneakAttack: on('sneakAttack'), hunterMark: on('hunterMark') };
}

/**
 * Bascule un bonus de combat (nouvel objet, l'ancien n'est pas modifié).
 * @param {Object} buffs
 * @param {string} key
 * @returns {Object}
 */
export function toggleBuff(buffs, key) {
    const current = buffs && typeof buffs === 'object' ? buffs : {};
    return { ...current, [key]: current[key] !== true };
}

/**
 * Supprime une ligne (nouveau tableau).
 * @param {Array} weapons
 * @param {number} index
 * @returns {Array}
 */
export function removeWeapon(weapons, index) {
    return (weapons || []).filter((_, i) => i !== index);
}

/**
 * Réinsère une ligne supprimée à sa place d'origine (ou à la fin si le tableau a raccourci).
 * @param {Array} weapons
 * @param {number} index
 * @param {Object} row
 * @returns {Array}
 */
export function restoreWeapon(weapons, index, row) {
    const list = [...(weapons || [])];
    list.splice(Math.max(0, Math.min(index, list.length)), 0, row);
    return list;
}
