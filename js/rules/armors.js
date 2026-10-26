// =============================================================================
// ARMORS.JS - Règles des armures (D&D 2024, Player's Handbook ch. 6 « Armor »)
// Fonctions pures : ligne d'armure à partir du catalogue, recherche dans le
// catalogue, avertissements sur les armures équipées.
// =============================================================================

import { EQUIPMENT_DATA } from '../data/equipment.js';
import { EMPTY_ARMOR } from '../state/schema.js';
import { armorCategory, parseNumber } from './character.js';

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
    const text = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const typed = ['name', 'ca', 'str', 'weight', 'price', 'comment'].some(key => text(armor[key]) !== '');
    const type = text(armor.type);
    return !typed && armor.stealth !== true && armor.equipped !== true && (type === '' || type === EMPTY_ARMOR.type);
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
 * Ligne d'armure remplie à partir d'une entrée du catalogue.
 * Conserve le commentaire, l'état « équipée » et toute clé inconnue de la ligne existante.
 * @param {Object} entry - élément de EQUIPMENT_DATA.armors
 * @param {Object} [row] - ligne existante
 * @returns {Object}
 */
export function armorRowFromCatalogue(entry, row = {}) {
    return {
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
 *  - armure légère / intermédiaire / lourde sans formation : Désavantage aux tests de d20
 *    impliquant la Force ou la Dextérité, et impossible de lancer des sorts ;
 *  - bouclier sans formation : pas de bonus de CA ;
 *  - armure dont la Force requise dépasse la valeur de Force : vitesse réduite de 3 m (10 ft) ;
 *  - une seule armure portée et un seul bouclier manié à la fois.
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

    return rows.map((armor, i) => {
        const category = categories[i];
        const warnings = [];
        if (!category) return warnings;

        if (BODY_CATEGORIES.has(category)) {
            if (training[category] !== true) {
                warnings.push('Armure non maîtrisée : Désavantage aux tests de d20 de Force ou de Dextérité, et impossible de lancer des sorts.');
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
