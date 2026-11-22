// =============================================================================
// RAGE.JS (règles) - Rage du Barbare et armure lourde
//
// Manuel des joueurs 2024 (Barbare, Rage, p. 51) : on n'entre en Rage que sans armure lourde, et la
// Rage s'arrête si l'on en enfile une. La fiche ne touche jamais au bouton Rage (combat_buffs.rage,
// allumé par le joueur) : tant qu'une armure lourde est équipée, ses effets calculés ne comptent pas
// (dégâts, Fureur divine, Frénésie, Enchaînement, rappels de Résistance et d'Avantage, fin de la
// Concentration) et un avertissement s'affiche près du bouton.
// Fonctions pures, sans import (utilisées par weapons.js, character.js, class-reminders.js…).
// =============================================================================

/** Avertissement court, affiché près du bouton Rage */
export const RAGE_ARMOR_WARNING = 'Rage sans effet : armure lourde portée';

/** Phrase de la barre du haut (toucher de l'avertissement, Rage allumée en armure lourde) */
export const RAGE_ARMOR_STATUS = '⚠️ Rage sans effet en armure lourde : ses bonus ne sont pas comptés';

/**
 * Une armure lourde est équipée : la Rage est sans effet.
 * @param {{ wornArmor?: { heavy?: boolean } }} [derived] - deriveCharacter()
 * @returns {boolean}
 */
export function rageBlockedByArmor(derived) {
    return derived?.wornArmor?.heavy === true;
}

/**
 * Rage réellement en cours : bouton allumé, sans armure lourde (la classe est vérifiée par l'appelant).
 * @param {Object} [record] - fiche (combat_buffs)
 * @param {Object} [derived] - deriveCharacter(record)
 * @returns {boolean}
 */
export function rageInEffect(record, derived) {
    return record?.combat_buffs?.rage === true && !rageBlockedByArmor(derived);
}

/**
 * Avertissement à afficher : bouton Rage allumé (et proposé au personnage), armure lourde équipée.
 * @param {Object} [record] - fiche (combat_buffs)
 * @param {Object} [derived] - deriveCharacter(record)
 * @param {string[]} [offered] - boutons proposés au personnage (buffsForCharacter) ; sans liste, Barbare
 * @returns {string} RAGE_ARMOR_WARNING, ou '' si rien à signaler
 */
export function rageArmorWarning(record, derived, offered) {
    const available = Array.isArray(offered) ? offered.includes('rage') : derived?.classSlug === 'barbarian';
    return available && record?.combat_buffs?.rage === true && rageBlockedByArmor(derived) ? RAGE_ARMOR_WARNING : '';
}
