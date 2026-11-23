// =============================================================================
// ARMOR-PICKER.JS (règles) - Liste des armures à parcourir (bouton ▾ du tableau des armures)
//
// Demande de Franck (23/11/2026) : comme le grimoire et le tableau des armes, une liste à
// parcourir sans clavier. Les armures du manuel (EQUIPMENT_DATA.armors) sont rangées dans les
// quatre groupes de la table « Armures » du Manuel des joueurs 2024 (photo du ch. 6, p. 219) :
// armures légères, armures intermédiaires, armures lourdes, boucliers. Un cinquième groupe,
// « Autres », vient après les boucliers (demande de Franck) : objets magiques et sorts qui
// changent la CA (anneau, cape, Armure du mage…), lus dans une liste de données facile à
// compléter (js/data/armor-others.js). Tout le reste s'écrit toujours à la main.
// Une armure déjà dans le tableau est marquée (✓) mais reste choisissable (armure de rechange).
// Pareil pour une entrée « Autres » : la noter deux fois n'est pas empêché, mais les deux lignes
// actives sont signalées (armorWarnings, js/rules/armors.js : un même sort ou un même objet ne se
// cumule pas avec lui-même).
// Fonction pure. Testé : tests/armor-picker.test.js, tests/armor-others.test.js.
// =============================================================================

import { plainText } from './plain-text.js';

/** Groupes, dans l'ordre de la table des armures du manuel ; type : valeur de la clé « type » */
export const ARMOR_PICKER_GROUPS = [
    { id: 'light', type: 'Légère', title: 'Armures légères' },
    { id: 'medium', type: 'Interméd.', title: 'Armures intermédiaires' },
    { id: 'heavy', type: 'Lourde', title: 'Armures lourdes' },
    { id: 'shield', type: 'Bouclier', title: 'Boucliers' }
];

/** Cinquième groupe, après les boucliers : objets et sorts de js/data/armor-others.js */
export const ARMOR_PICKER_OTHER = { id: 'other', title: 'Autres' };

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
 * retirés. Le groupe « Autres » n'existe que si la liste others est fournie.
 * @param {Array<Object>} catalog - EQUIPMENT_DATA.armors
 * @param {{ query?: string, rows?: Array<Object>, others?: Array<Object> }} [options] - rows : les
 *   autres lignes du tableau (celle qu'on remplit exclue), pour marquer les armures déjà notées ;
 *   others : ARMOR_OTHERS (js/data/armor-others.js), gardés dans leur ordre
 * @returns {Array<{ id: string, title: string, items: Array<{ armor: Object, noted: boolean }> }>}
 */
export function armorPickerGroups(catalog, { query = '', rows = [], others = [] } = {}) {
    const q = fold(query);
    const names = new Set((Array.isArray(rows) ? rows : []).map((row) => fold(row?.name)).filter(Boolean));
    const item = (armor) => ({ armor, noted: names.has(fold(armor.name)) });
    const groups = ARMOR_PICKER_GROUPS.map(({ id, title }) => ({
        id,
        title,
        items: (Array.isArray(catalog) ? catalog : [])
            .filter((armor) => armorPickerGroup(armor) === id && fold(armor.name).includes(q))
            .map(item)
    }));
    groups.push({
        ...ARMOR_PICKER_OTHER,
        // Une entrée sans nom (liste mal complétée) n'est pas proposée
        items: (Array.isArray(others) ? others : [])
            .filter((entry) => fold(entry?.name) !== '' && fold(entry.name).includes(q))
            .map(item)
    });
    return groups.filter((group) => group.items.length > 0);
}
