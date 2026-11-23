// =============================================================================
// ARMOR-PICKER.JS (règles) - Liste des armures à parcourir (bouton ▾ du tableau des armures)
//
// Demande de Franck (23/11/2026) : comme le grimoire et le tableau des armes, une liste à
// parcourir sans clavier. Les armures du manuel (EQUIPMENT_DATA.armors) sont rangées dans les
// quatre groupes de la table « Armures » du Manuel des joueurs 2024 (photo du ch. 6, p. 219) :
// armures légères, armures intermédiaires, armures lourdes, boucliers. Rien d'autre pour
// l'instant (choix de Franck) : un anneau, une cape ou un sort s'écrit toujours à la main.
// Une armure déjà dans le tableau est marquée (✓) mais reste choisissable (armure de rechange).
// Fonction pure. Testé : tests/armor-picker.test.js.
// =============================================================================

import { plainText } from './plain-text.js';

/** Groupes, dans l'ordre de la table des armures du manuel ; type : valeur de la clé « type » */
export const ARMOR_PICKER_GROUPS = [
    { id: 'light', type: 'Légère', title: 'Armures légères' },
    { id: 'medium', type: 'Interméd.', title: 'Armures intermédiaires' },
    { id: 'heavy', type: 'Lourde', title: 'Armures lourdes' },
    { id: 'shield', type: 'Bouclier', title: 'Boucliers' }
];

const fold = (value) => plainText(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/**
 * Groupe d'une armure du manuel (null : type inconnu).
 * @param {{ type?: string }} armor
 * @returns {string|null}
 */
export function armorPickerGroup(armor) {
    return ARMOR_PICKER_GROUPS.find((group) => group.type === armor?.type)?.id ?? null;
}

/**
 * Liste rangée par groupe, resserrée par la saisie (sans accents ni majuscules). Groupes vides
 * retirés.
 * @param {Array<Object>} catalog - EQUIPMENT_DATA.armors
 * @param {{ query?: string, rows?: Array<Object> }} [options] - rows : les autres lignes du
 *   tableau (celle qu'on remplit exclue), pour marquer les armures déjà notées
 * @returns {Array<{ id: string, title: string, items: Array<{ armor: Object, noted: boolean }> }>}
 */
export function armorPickerGroups(catalog, { query = '', rows = [] } = {}) {
    const q = fold(query);
    const names = new Set((Array.isArray(rows) ? rows : []).map((row) => fold(row?.name)).filter(Boolean));
    return ARMOR_PICKER_GROUPS.map(({ id, title }) => ({
        id,
        title,
        items: (Array.isArray(catalog) ? catalog : [])
            .filter((armor) => armorPickerGroup(armor) === id && fold(armor.name).includes(q))
            .map((armor) => ({ armor, noted: names.has(fold(armor.name)) }))
    })).filter((group) => group.items.length > 0);
}
