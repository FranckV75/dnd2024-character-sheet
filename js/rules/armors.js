// =============================================================================
// ARMORS.JS - Règles des armures (D&D 2024, Player's Handbook ch. 6 « Armor »)
// Fonctions pures : ligne d'armure à partir du catalogue, recherche dans le
// catalogue, avertissements sur les armures équipées.
// Groupe « Autres » de la liste (js/data/armor-others.js : anneau, cape, sort…) : une entrée
// choisie devient une ligne ordinaire (armorRowFromOther), avec les mêmes clés qu'une ligne
// saisie à la main ; sa condition (« sans armure ni bouclier »…) est écrite en commentaire.
// Une telle ligne est reconnue à son nom ET à son commentaire, sans clé nouvelle (armorOtherOfRow) :
// la bulle de sa CA donne le détail de l'entrée (armorBubbleText) et la même entrée active deux
// fois est signalée (armorWarnings). Un nom tapé à la main n'est jamais reconnu.
// =============================================================================

import { EQUIPMENT_DATA } from '../data/equipment.js';
import { ARMOR_OTHERS } from '../data/armor-others.js';
import { EMPTY_ARMOR } from '../state/schema.js';
import { armorCategory, armorMagicBonus, armorCanBeMagic, parseNumber } from './character.js';
import { plainText } from './plain-text.js';
export { armorMagicBonus, armorCanBeMagic, ARMOR_MAGIC_MAX, armorLine, catalogueArmor } from './character.js';

/** Types proposés dans la liste (valeurs identiques à la v3) */
export const ARMOR_TYPES = [
    ['none', 'Standard / Aucun'],
    ['Légère', 'Légère (+Dex)'],
    ['Interméd.', 'Intermédiaire (+Dex max 2)'],
    ['Lourde', 'Lourde (fixe)'],
    ['Bouclier', 'Bouclier'],
    ['Bonus', 'Bonus (+CA fixe)'],
    ['Maîtrise', 'Maîtrise (+bonus de maîtrise)']
];

const BODY_CATEGORIES = new Set(['light', 'medium', 'heavy']);

const fold = (text) => String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/**
 * Ligne d'armure avec un nouveau bonus magique : 0 retire la clé « magic » (sauvegarde inchangée
 * pour une armure normale), toutes les autres clés de la ligne sont conservées.
 * @param {Object} row
 * @param {number} magic - 0 à 3
 * @returns {Object}
 */
export function withArmorMagic(row, magic) {
    const rest = { ...(row && typeof row === 'object' ? row : {}) };
    delete rest.magic;
    const value = armorMagicBonus({ magic });
    return value ? { ...rest, magic: value } : rest;
}

/**
 * Armures du catalogue dont le nom contient la recherche (sans tenir compte des accents ni de la casse).
 * @param {string} query
 * @param {Array} [catalogue]
 * @returns {Array<{name: string, type: string, ca: string, str: string, stealth: boolean, weight: string, price: string}>}
 */
/**
 * Ligne d'armure vide : rien n'a été saisi ni coché (le type par défaut « Standard / Aucun »
 * ne compte pas). L'affichage n'en garde qu'une, comme ligne de saisie.
 * @param {Object} armor - ligne de dynamic_armors
 * @returns {boolean}
 */
export function isBlankArmor(armor) {
    if (!armor || typeof armor !== 'object') return true;
    const typed = ['name', 'ca', 'str', 'weight', 'price', 'comment'].some(key => plainText(armor[key]) !== '');
    const type = plainText(armor.type);
    return !typed && armor.stealth !== true && armor.equipped !== true && armorMagicBonus(armor) === 0
        && (type === '' || type === EMPTY_ARMOR.type);
}

export function searchArmorCatalogue(query, catalogue = EQUIPMENT_DATA.armors) {
    const q = fold(query);
    if (!q) return [];
    const matches = catalogue.filter(a => fold(a.name).includes(q));
    // Les noms qui commencent par la recherche d'abord
    return matches.sort((a, b) => Number(!fold(a.name).startsWith(q)) - Number(!fold(b.name).startsWith(q)));
}

/**
 * Valeur de CA à enregistrer pour une entrée du catalogue (comme la v3) :
 * le nombre seul (« 12 + Dex (max 2) » → « 12 »), précédé de « + » pour un bouclier.
 * @param {{ ca?: string, type?: string }} entry
 * @returns {string}
 */
export function catalogueArmorClass(entry) {
    const match = String(entry?.ca ?? '').match(/-?\d+/);
    if (!match) return String(entry?.ca ?? '');
    const value = match[0];
    return entry.type === 'Bouclier' && parseInt(value, 10) > 0 ? `+${value}` : value;
}

/**
 * Valeur de base à enregistrer (clé « ca ») par l'engrenage : le nombre saisi, précédé de « + »
 * pour un bouclier ou un bonus positif, comme les valeurs du manuel ; sans nombre : vide.
 * @param {string} raw
 * @param {string} type - valeur de ARMOR_TYPES
 * @returns {string}
 */
export function armorBaseText(raw, type) {
    const value = parseNumber(String(raw ?? ''), Number.NaN);
    if (!Number.isFinite(value)) return '';
    return (type === 'Bouclier' || type === 'Bonus') && value > 0 ? `+${value}` : String(value);
}

/**
 * Textes qu'une entrée « Autres » a pu écrire en commentaire : l'actuel, puis les anciens
 * (champ facultatif oldComments de l'entrée : fiches enregistrées avant un changement de texte).
 * @param {Object} entry
 * @returns {string[]}
 */
function listComments(entry) {
    const old = Array.isArray(entry?.oldComments) ? entry.oldComments : [];
    return [entry?.comment, ...old].filter(text => typeof text === 'string' && text.trim() !== '').map(text => text.trim());
}

/**
 * Le commentaire est-il celui qu'une entrée du groupe « Autres » a écrit (et non un texte du joueur) ?
 * Les anciens textes d'une entrée (oldComments) comptent aussi.
 * @param {*} comment
 * @param {Array<Object>} [others]
 * @returns {boolean}
 */
export function isArmorListComment(comment, others = ARMOR_OTHERS) {
    const text = plainText(comment);
    return text !== '' && others.some(entry => listComments(entry).includes(text));
}

/**
 * Entrée « Autres » d'où vient une ligne, ou null : même nom (sans accents ni majuscules) ET
 * commentaire écrit par cette entrée (actuel ou ancien). Aucune clé de sauvegarde ne le dit : une
 * ligne tapée à la main, renommée, ou dont le joueur a écrit le commentaire, n'est pas reconnue.
 * @param {Object} row - ligne de dynamic_armors
 * @param {Array<Object>} [others]
 * @returns {Object|null}
 */
export function armorOtherOfRow(row, others = ARMOR_OTHERS) {
    if (!row || typeof row !== 'object') return null;
    const name = fold(plainText(row.name));
    const text = plainText(row.comment);
    if (name === '' || text === '') return null;
    return others.find(entry => fold(entry?.name) === name && listComments(entry).includes(text)) ?? null;
}

/** Bulle d'une ligne de rappel (entrée « Autres » de type 'none', comme Peau d'écorce) */
export const ARMOR_REMINDER_FORMULA = 'Rappel : cette ligne ne change pas la CA de la fiche.';

/**
 * Textes de la bulle de CA d'une ligne : le calcul (armorLine), puis le détail de l'entrée
 * « Autres » d'où vient la ligne (conditions longues, ce que la fiche ne compte pas).
 * Ligne de rappel voulue (entrée de type 'none' restée sans type) : le calcul n'invite pas à
 * « choisir son type », il dit que c'est un rappel, suivi du détail (à défaut, du commentaire).
 * Toute autre ligne : le calcul tel quel, sans détail.
 * @param {Object} row - ligne de dynamic_armors
 * @param {{ kind?: string, formula?: string }} line - armorLine(row)
 * @param {Array<Object>} [others]
 * @returns {{ formula: string, detail: string }}
 */
export function armorBubbleText(row, line, others = ARMOR_OTHERS) {
    const formula = line?.formula ?? '';
    const entry = armorOtherOfRow(row, others);
    if (!entry) return { formula, detail: '' };
    const detail = typeof entry.detail === 'string' ? entry.detail.trim() : '';
    const reminder = line?.kind === 'none' && (entry.type || 'none') === 'none';
    if (!reminder) return { formula, detail };
    return { formula: ARMOR_REMINDER_FORMULA, detail: detail || listComments(entry)[0] || '' };
}

/** Même entrée « Autres » active deux fois (armorWarnings) */
export const ARMOR_TWICE_SPELL = "Même sort actif deux fois : ses effets ne se cumulent pas, un seul compte. Décochez l'une des deux lignes.";
export const ARMOR_TWICE_ITEM = "Même objet actif deux fois : on ne s'harmonise qu'avec un seul exemplaire d'un objet. Décochez l'une des deux lignes.";

/**
 * Ligne d'armure remplie à partir d'une entrée du catalogue.
 * Conserve le commentaire, l'état « équipée » et toute clé inconnue de la ligne existante ; seul
 * un commentaire écrit par le groupe « Autres » (condition d'un objet ou d'un sort choisi avant
 * sur la même ligne) est retiré : il ne parlerait plus de cette armure.
 * @param {Object} entry - élément de EQUIPMENT_DATA.armors
 * @param {Object} [row] - ligne existante
 * @returns {Object}
 */
export function armorRowFromCatalogue(entry, row = {}) {
    const next = {
        ...EMPTY_ARMOR,
        ...row,
        name: entry.name,
        type: entry.type || 'none',
        ca: catalogueArmorClass(entry),
        str: entry.str || '',
        stealth: entry.stealth === true,
        weight: entry.weight || '',
        price: entry.price || ''
    };
    if (isArmorListComment(next.comment)) next.comment = '';
    return next;
}

/** L'entrée vient-elle du groupe « Autres » (js/data/armor-others.js) ? */
export function isArmorOther(entry, others = ARMOR_OTHERS) {
    return Boolean(entry) && others.includes(entry);
}

/**
 * Ligne remplie à partir d'une entrée du groupe « Autres » (anneau, cape, sort…) : exactement les
 * clés d'une ligne saisie à la main (aucune clé nouvelle). Le type et la valeur de base sont ceux
 * de l'entrée, comme si le joueur les avait réglés avec l'engrenage ; Force, Discrétion, poids et
 * prix sont ceux de l'entrée (vides en général).
 * Commentaire : celui de l'entrée (sa condition, ce que la fiche ne compte pas), sauf si le joueur
 * a déjà écrit le sien, qui est gardé. État « équipée » et clés inconnues conservés ; un bonus
 * magique d'armure (clé facultative « magic ») laissé sur la ligne est retiré s'il ne peut plus
 * servir (type Bonus, Maîtrise ou aucun), comme le fait l'engrenage.
 * @param {{ name: string, type?: string, value?: string, comment?: string }} entry - élément de ARMOR_OTHERS
 * @param {Object} [row] - ligne existante
 * @returns {Object}
 */
export function armorRowFromOther(entry, row = {}) {
    const own = plainText(row?.comment) !== '' && !isArmorListComment(row?.comment);
    const next = {
        ...EMPTY_ARMOR,
        ...row,
        name: entry.name,
        type: entry.type || 'none',
        ca: entry.value || '',
        str: entry.str || '',
        stealth: entry.stealth === true,
        weight: entry.weight || '',
        price: entry.price || '',
        comment: own ? row.comment : (entry.comment || '')
    };
    return armorCanBeMagic(next) ? next : withArmorMagic(next, 0);
}

/**
 * Ligne remplie à partir d'un choix de la liste : armure du manuel ou entrée du groupe « Autres ».
 * @param {Object} entry - élément de EQUIPMENT_DATA.armors ou de ARMOR_OTHERS
 * @param {Object} [row] - ligne existante
 * @returns {Object}
 */
export function armorRowFromChoice(entry, row = {}) {
    return isArmorOther(entry) ? armorRowFromOther(entry, row) : armorRowFromCatalogue(entry, row);
}

/**
 * Suggestions pendant la saisie d'un nom : armures du manuel puis entrées du groupe « Autres »
 * dont le nom contient la recherche ; les noms qui commencent par la recherche d'abord.
 * @param {string} query
 * @returns {Array<Object>}
 */
export function searchArmorChoices(query) {
    return searchArmorCatalogue(query, [...EQUIPMENT_DATA.armors, ...ARMOR_OTHERS]);
}

/**
 * Force minimale d'une armure (« 15 », « For 15 ») ; 0 si aucune (« - », vide).
 * @param {*} value
 * @returns {number}
 */
export function strengthRequirement(value) {
    return Math.max(0, parseNumber(value, 0));
}

/**
 * Avertissements pour chaque ligne du tableau (tableau vide = rien à signaler).
 * Règles D&D 2024 :
 *  - armure légère / intermédiaire / lourde sans formation : Désavantage aux Tests d20
 *    impliquant la Force ou la Dextérité, et impossible de lancer des sorts ;
 *  - bouclier sans formation : pas de bonus de CA ;
 *  - armure dont la Force requise dépasse la valeur de Force : vitesse réduite de 3 m (10 ft) ;
 *  - une seule armure portée et un seul bouclier manié à la fois ;
 *  - même entrée du groupe « Autres » (armorOtherOfRow) active et comptée deux fois : un même sort
 *    ne se cumule pas avec lui-même (PHB 2024, ch. 7 « Combining Spell Effects »), et l'on ne
 *    s'harmonise qu'avec un seul exemplaire d'un objet (« Attunement »). Le calcul de CA n'est pas
 *    changé : la ligne est seulement signalée. Deux lignes tapées à la main ne le sont jamais.
 * @param {Array<Object>} armors - dynamic_armors
 * @param {{ light?: boolean, medium?: boolean, heavy?: boolean, shield?: boolean }} training
 * @param {number} strScore - valeur de Force
 * @returns {Array<string[]>}
 */
export function armorWarnings(armors = [], training = {}, strScore = 10) {
    const rows = Array.isArray(armors) ? armors : [];
    const categories = rows.map(a => (a && a.equipped === true ? armorCategory(a) : null));
    const bodyCount = categories.filter(c => BODY_CATEGORIES.has(c)).length;
    const shieldCount = categories.filter(c => c === 'shield').length;
    // Entrée « Autres » de chaque ligne active qui compte dans la CA (une ligne de rappel : aucune)
    const listed = rows.map((a, i) => (categories[i] ? armorOtherOfRow(a) : null));

    return rows.map((armor, i) => {
        const category = categories[i];
        const warnings = [];
        if (!category) return warnings;

        if (BODY_CATEGORIES.has(category)) {
            if (training[category] !== true) {
                warnings.push('Armure non maîtrisée : Désavantage aux Tests d20 de Force ou de Dextérité, et impossible de lancer des sorts.');
            }
            const required = strengthRequirement(armor.str);
            if (required > 0 && strScore < required) {
                warnings.push(`Force insuffisante (${required} requise, ${strScore} actuelle) : vitesse réduite de 3 m.`);
            }
            if (bodyCount > 1) {
                warnings.push('Plusieurs armures équipées : on ne peut porter qu\'une seule armure à la fois.');
            }
        } else if (category === 'shield') {
            if (training.shield !== true) {
                warnings.push('Bouclier non maîtrisé : il n\'apporte aucun bonus de CA.');
            }
            if (shieldCount > 1) {
                warnings.push('Plusieurs boucliers équipés : on ne peut manier qu\'un seul bouclier à la fois.');
            }
        }
        if (listed[i] && listed.filter(entry => entry === listed[i]).length > 1) {
            warnings.push(listed[i].kind === 'sort' ? ARMOR_TWICE_SPELL : ARMOR_TWICE_ITEM);
        }
        return warnings;
    });
}

/**
 * Formations aux armures lues dans la fiche (cases « Maîtrises d'armures »).
 * @param {Object} record
 * @returns {{ light: boolean, medium: boolean, heavy: boolean, shield: boolean }}
 */
export function armorTraining(record = {}) {
    return {
        light: record.prof_armor_light === true,
        medium: record.prof_armor_med === true,
        heavy: record.prof_armor_heavy === true,
        shield: record.prof_armor_shield === true
    };
}
