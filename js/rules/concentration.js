// =============================================================================
// CONCENTRATION.JS (règles) - Sort sur lequel le personnage se concentre
//
// Manuel des joueurs 2024, Concentration : un seul sort à la fois ; elle cesse si l'on lance un
// autre sort à concentration, si l'on subit l'état Neutralisé (Inconscient, Étourdi, Paralysé,
// Pétrifié l'entraînent) ou si l'on meurt. À chaque dégât : jet de sauvegarde de Constitution,
// DD 10 ou la moitié des dégâts (arrondie à l'inférieur), 30 au plus.
//
// Sauvegarde : clé facultative « concentration » = nom du sort (chaîne vide : aucune). Absente des
// anciennes fiches ; l'ancien site (v3) l'ignore (V4_ONLY_KEYS, js/cloud/sync.js).
// Fonctions pures.
// =============================================================================

import { applyDamage, concentrationDc } from './hit-points.js';
import { activeConditions } from './conditions.js';
import { signed } from './numbers.js';

export const CONCENTRATION_KEY = 'concentration';
const MAX_LENGTH = 80;
/** États qui mettent fin à la Concentration (ils entraînent Neutralisé) */
const BREAKING = Object.freeze(['incapacitated', 'unconscious', 'stunned', 'paralyzed', 'petrified']);
/** Chasseur implacable (Rôdeur niveau 13) : les dégâts ne rompent pas la Concentration sur ce sort */
const HUNTERS_MARK = /^(marque du chasseur|hunter'?s mark)$/i;

const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Nom du sort de concentration en cours, ou '' */
export function concentrationSpell(record) {
    const value = record?.[CONCENTRATION_KEY];
    return typeof value === 'string' ? plain(value).slice(0, MAX_LENGTH) : '';
}

/**
 * @param {Object} record
 * @param {string} name - '' pour mettre fin à la Concentration
 * @returns {Object} { concentration } ou {} si rien ne change
 */
export function setConcentrationPatch(record, name) {
    const next = plain(name).slice(0, MAX_LENGTH);
    return next === concentrationSpell(record) && Object.hasOwn(record ?? {}, CONCENTRATION_KEY) ? {} : { [CONCENTRATION_KEY]: next };
}

/**
 * Sorts proposés : ceux du grimoire marqués « C », puis les autres sorts donnés (dons, espèce…)
 * qui demandent la Concentration ; sans doublon, et le sort en cours toujours présent.
 * @param {Object} record
 * @param {string[]} [extra] - autres noms de sorts à concentration
 * @returns {string[]}
 */
export function concentrationOptions(record, extra = []) {
    const rows = Array.isArray(record?.dynamic_spells) ? record.dynamic_spells : [];
    const names = rows.filter((row) => row && row.c === true).map((row) => plain(row.name)).filter(Boolean);
    const current = concentrationSpell(record);
    const seen = new Set();
    const list = [];
    for (const name of [...names, ...extra.map(plain), current]) {
        const key = name.toLowerCase();
        if (!name || seen.has(key)) continue;
        seen.add(key);
        list.push(name);
    }
    return list;
}

/**
 * Concentration en cours : jet de Constitution, Avantage (Mage de guerre), ce qui y met fin
 * (état Neutralisé ou qui l'entraîne ; Rage du Barbare : 'rage'), dégâts sans effet (Chasseur implacable).
 * @param {Object} record
 * @param {{ saves: Object, feats: string[], classSlug: string, level: number }} derived - deriveCharacter(record)
 * @returns {null | { spell: string, bonus: number, advantage: boolean, brokenBy: string|null, safe: boolean }}
 */
export function concentrationView(record, derived) {
    const spell = concentrationSpell(record);
    if (!spell) return null;
    const conditions = activeConditions(record);
    return {
        spell,
        bonus: Number(derived?.saves?.con?.bonus) || 0,
        advantage: (derived?.feats ?? []).includes('mage_de_guerre'),
        brokenBy: BREAKING.find((id) => conditions.includes(id))
            ?? (derived?.classSlug === 'barbarian' && record?.combat_buffs?.rage === true ? 'rage' : null),
        safe: derived?.classSlug === 'ranger' && (Number(derived?.level) || 0) >= 13 && HUNTERS_MARK.test(spell)
    };
}

/** « jet de sauvegarde de Constitution DD 12 (+5, avec Avantage : Mage de guerre) » */
function saveText(view, dc) {
    return `jet de sauvegarde de Constitution DD ${dc} (${signed(view.bonus)}${view.advantage ? ', avec Avantage : Mage de guerre' : ''})`;
}

/**
 * Dégâts subis (applyDamage), avec le rappel de la Concentration en cours : jet de sauvegarde
 * chiffré, ou fin de la Concentration à 0 PV (Inconscient) et à la mort.
 * @param {Object} record
 * @param {Object} derived - deriveCharacter(record)
 * @param {string|number} value
 * @returns {ReturnType<typeof applyDamage>}
 */
export function damageWithConcentration(record, derived, value) {
    const outcome = applyDamage(record, value);
    const view = concentrationView(record, derived);
    if (!outcome.ok || !view) return outcome;
    const amount = Number(String(value).trim());
    const generic = /^Si vous vous concentrez sur un sort/;
    const notes = outcome.notes.filter((note) => !generic.test(note));
    const patch = { ...outcome.patch };
    if (outcome.after.current === 0) {
        notes.push(`Concentration sur ${view.spell} terminée (${outcome.dead ? 'mort' : 'Inconscient'}).`);
        patch[CONCENTRATION_KEY] = '';
    } else if (view.brokenBy) {
        // Déjà rompue (Rage, Neutralisé) : pas de jet à faire
        notes.push(`Concentration sur ${view.spell} : déjà terminée (${view.brokenBy === 'rage' ? 'Rage' : 'Neutralisé'}), pas de jet.`);
        patch[CONCENTRATION_KEY] = '';
    } else if (view.safe) {
        notes.push(`Concentration sur ${view.spell} : aucun jet, les dégâts ne la rompent pas (Chasseur implacable).`);
    } else {
        notes.push(`Concentration sur ${view.spell} : ${saveText(view, concentrationDc(amount))}. Raté : le sort prend fin.`);
    }
    return { ...outcome, patch, notes };
}
