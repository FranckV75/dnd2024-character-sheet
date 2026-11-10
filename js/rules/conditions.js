// =============================================================================
// CONDITIONS.JS - Suivi des états (Empoisonné, À terre…) : fonctions pures
//
// Sauvegarde : clé facultative propre à la v4 « conditions » = liste des id cochés
// (js/data/conditions.js), par exemple ["poisoned", "prone"]. Absente sur les anciennes fiches
// (= aucun état) ; l'ancien site l'ignore. L'Épuisement n'y est jamais : il reste suivi par niveau
// (fatigue_level, encadré Repos). Testé : tests/conditions.test.js.
// =============================================================================

import { CONDITIONS } from '../data/conditions.js';
import { exhaustionEffects } from './character.js';

export const CONDITIONS_KEY = 'conditions';

const BY_ID = new Map(CONDITIONS.map((condition) => [condition.id, condition]));
/** États qu'on coche (tous sauf l'Épuisement, suivi par niveau) */
const CHECKABLE = new Set(CONDITIONS.filter((condition) => !condition.tracked).map((condition) => condition.id));

/**
 * Liste d'états lisible : id connus et cochables, sans doublon, dans l'ordre du manuel.
 * @param {unknown} value
 * @returns {string[]}
 */
export function sanitizeConditions(value) {
    if (!Array.isArray(value)) return [];
    const wanted = new Set(value.filter((id) => typeof id === 'string' && CHECKABLE.has(id)));
    return CONDITIONS.map((condition) => condition.id).filter((id) => wanted.has(id));
}

/**
 * États cochés sur la fiche.
 * @param {Object} record
 * @returns {string[]}
 */
export function activeConditions(record) {
    return sanitizeConditions(record?.[CONDITIONS_KEY]);
}

/**
 * Coche ou décoche un état.
 * @param {Object} record
 * @param {string} id
 * @param {boolean} on
 * @returns {Object} { conditions: [...] }, ou {} si l'état n'est pas cochable
 */
export function toggleCondition(record, id, on) {
    if (!CHECKABLE.has(id)) return {};
    const current = activeConditions(record).filter((other) => other !== id);
    // État qui prend fin en laissant un autre (Inconscient : on reste À terre en reprenant conscience)
    const left = !on && activeConditions(record).includes(id) ? BY_ID.get(id).leaves ?? [] : [];
    return { [CONDITIONS_KEY]: sanitizeConditions(on ? [...current, id] : [...current, ...left]) };
}

/**
 * Rappel des effets en cours : états cochés, états qu'ils entraînent, Épuisement (niveau > 0).
 * @param {Object} record
 * @returns {Array<{ id: string, nameFr: string, effects: string[], checked: boolean, impliedBy: string[], level?: number }>}
 *          dans l'ordre du manuel ; impliedBy : noms des états cochés qui l'entraînent
 */
export function conditionReminders(record) {
    const checked = new Set(activeConditions(record));
    const impliedBy = new Map();
    for (const id of checked) {
        for (const included of BY_ID.get(id).includes ?? []) {
            if (!impliedBy.has(included)) impliedBy.set(included, []);
            impliedBy.get(included).push(BY_ID.get(id).nameFr);
        }
    }
    const exhaustion = exhaustionEffects(record?.fatigue_level);
    const reminders = [];
    for (const condition of CONDITIONS) {
        if (condition.tracked) {
            if (exhaustion.level > 0) {
                reminders.push({
                    id: condition.id, nameFr: condition.nameFr, checked: false, impliedBy: [], level: exhaustion.level,
                    effects: [exhaustionLine(exhaustion), ...condition.effects.slice(1)]
                });
            }
            continue;
        }
        if (!checked.has(condition.id) && !impliedBy.has(condition.id)) continue;
        reminders.push({
            id: condition.id,
            nameFr: condition.nameFr,
            effects: condition.effects,
            checked: checked.has(condition.id),
            impliedBy: impliedBy.get(condition.id) ?? []
        });
    }
    return reminders;
}

/** Effet chiffré de l'Épuisement au niveau atteint */
function exhaustionLine({ level, d20Penalty, speedPenaltyM, dead }) {
    if (dead) return 'Niveau 6 : mort.';
    return `Niveau ${level} : ${d20Penalty} aux Tests d20 et -${String(speedPenaltyM).replace('.', ',')} m de vitesse (mort au niveau 6).`;
}
