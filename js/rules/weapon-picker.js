// =============================================================================
// WEAPON-PICKER.JS (règles) - Liste des armes à parcourir (bouton ▾ du tableau des armes)
//
// Demande de Franck (23/11/2026) : comme le grimoire, une liste à parcourir sans clavier. Les
// armes du manuel (DD_RULES.weapons) sont rangées dans les quatre groupes de la table des armes
// du Manuel des joueurs 2024 (photo du ch. 6, p. 215) : armes courantes de corps à corps, armes
// courantes à distance, armes de guerre de corps à corps, armes de guerre à distance ; puis
// l'Attaque à mains nues (pas une arme), à part. Une arme de corps à corps qu'on peut lancer
// (Dague, Javeline…) reste au corps à corps, comme dans le manuel ; la Fléchette est à distance
// (weaponReach, js/rules/weapons.js). Le Chakram (Odyssée, « arme de jet ») est aussi à distance :
// il rejoint les armes de guerre à distance ; mode Odyssée coupé, l'interface ne le propose que s'il
// est déjà noté (proposedWeapons, js/rules/odyssey.js).
// Une arme déjà dans le tableau est marquée (✓) mais reste choisissable : on peut porter deux
// dagues ou deux épées courtes.
// Fonction pure. Testé : tests/weapon-picker.test.js.
// =============================================================================

import { weaponReach, isUnarmedStrike } from './weapons.js';
import { RENAMED_WEAPONS } from '../data/dd-rules.js';
import { plainText } from './plain-text.js';

/** Groupes, dans l'ordre de la table des armes du manuel */
export const WEAPON_PICKER_GROUPS = [
    { id: 'simple-melee', title: 'Armes courantes de corps à corps' },
    { id: 'simple-ranged', title: 'Armes courantes à distance' },
    { id: 'martial-melee', title: 'Armes de guerre de corps à corps' },
    { id: 'martial-ranged', title: 'Armes de guerre à distance' },
    { id: 'unarmed', title: 'Sans arme' }
];

const fold = (value) => plainText(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Ancien nom d'une ligne (« Bâton ») → nom actuel du catalogue (« Bâton de combat »), pour la ✓ */
const RENAMED = new Map(Object.entries(RENAMED_WEAPONS).map(([old, now]) => [fold(old), fold(now)]));
const currentName = (name) => RENAMED.get(fold(name)) ?? fold(name);

/**
 * Groupe d'une arme du manuel (null : catégorie inconnue).
 * @param {{ name: string, prop?: string, category?: string }} weapon
 * @returns {string|null}
 */
export function weaponPickerGroup(weapon) {
    if (isUnarmedStrike(weapon)) return 'unarmed';
    const family = weapon?.category === 'Courante' ? 'simple' : weapon?.category === 'Guerre' ? 'martial' : null;
    if (!family) return null;
    const reach = weaponReach(weapon);
    return `${family}-${reach.melee ? 'melee' : 'ranged'}`;
}

/**
 * Liste rangée par groupe, resserrée par la saisie (sans accents ni majuscules). Groupes vides
 * retirés.
 * @param {Array<Object>} catalog - DD_RULES.weapons
 * @param {{ query?: string, rows?: Array<Object> }} [options] - rows : les autres lignes du
 *   tableau (celle qu'on remplit exclue), pour marquer les armes déjà notées
 * @returns {Array<{ id: string, title: string, items: Array<{ weapon: Object, noted: boolean }> }>}
 */
export function weaponPickerGroups(catalog, { query = '', rows = [] } = {}) {
    const q = fold(query);
    const names = new Set((Array.isArray(rows) ? rows : []).map((row) => currentName(row?.name)).filter(Boolean));
    const unarmedNoted = (Array.isArray(rows) ? rows : []).some((row) => row && isUnarmedStrike(row));
    return WEAPON_PICKER_GROUPS.map((group) => ({
        ...group,
        items: (Array.isArray(catalog) ? catalog : [])
            .filter((weapon) => weaponPickerGroup(weapon) === group.id && fold(weapon.name).includes(q))
            .map((weapon) => ({
                weapon,
                noted: names.has(fold(weapon.name)) || (group.id === 'unarmed' && unarmedNoted)
            }))
    })).filter((group) => group.items.length > 0);
}
