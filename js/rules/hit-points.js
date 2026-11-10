/**
 * POINTS DE VIE EN JEU — dégâts, soins, PV temporaires, boutons − / + (fonctions pures)
 *
 * Règles du Manuel des joueurs 2024 (chapitre 1, « Points de vie », « Tomber à 0 point de vie ») :
 *  - les dégâts retirent d'abord les PV temporaires, puis les PV ; les PV ne descendent pas sous 0 ;
 *  - tomber à 0 PV : état Inconscient ; si les dégâts restants égalent ou dépassent les PV maximum,
 *    mort instantanée ; subir des dégâts à 0 PV : un échec au jet contre la mort (deux sur un coup
 *    critique), mort si ces dégâts égalent ou dépassent les PV maximum ;
 *  - regagner des PV : jamais au-delà du maximum ; à 0 PV, regagner 1 PV ou plus met fin à
 *    l'inconscience (on reste À terre) et remet les jets contre la mort à zéro ;
 *  - les PV temporaires ne se cumulent pas : on garde les plus élevés ;
 *  - concentration : jet de sauvegarde de Constitution DD 10 ou moitié des dégâts (max. 30).
 *
 * Les PV sont enregistrés en texte (« 39 », clés hp_current, hp_max, hp_temp, format v3) : ces
 * fonctions rendent une modification { clé: texte } à passer au store, jamais une valeur numérique.
 */

import { readHitPoints } from './rest.js';
import { toggleCondition, activeConditions } from './conditions.js';

/** Plus grande valeur saisie dans le pavé (au-delà : erreur de frappe) */
export const MAX_AMOUNT = 999;
const DEATH_SAVE_KEYS = ['ds_s1', 'ds_s2', 'ds_s3', 'ds_f1', 'ds_f2', 'ds_f3'];

/**
 * PV de la fiche lus en nombres. PV actuels vides : la fiche les montre pleins (PV maximum).
 * @param {Object} record
 * @returns {{ current: number|null, max: number|null, temp: number }}
 */
export function hitPointState(record) {
    const max = readHitPoints(record?.hp_max);
    const typed = readHitPoints(record?.hp_current);
    const current = typed ?? max;
    return {
        current: current === null ? null : Math.max(0, current),
        max: max !== null && max > 0 ? max : null,
        temp: Math.max(0, readHitPoints(record?.hp_temp) ?? 0)
    };
}

/** Montant saisi : entier de 1 à MAX_AMOUNT, sinon null */
export function readAmount(value) {
    const text = String(value ?? '').trim();
    if (!/^\d+$/.test(text)) return null;
    const n = Number(text);
    return n >= 1 && n <= MAX_AMOUNT ? n : null;
}

/** DD du jet de Constitution pour maintenir la concentration */
export function concentrationDc(damage) {
    return Math.min(30, Math.max(10, Math.floor(damage / 2)));
}

/**
 * Dégâts subis.
 * @returns {{ ok: false, reason: string } | { ok: true, patch: Object, before: Object, after: Object, notes: string[], dead: boolean }}
 */
export function applyDamage(record, value) {
    const amount = readAmount(value);
    if (amount === null) return { ok: false, reason: 'Saisissez un nombre de 1 à 999.' };
    const { current, max, temp } = hitPointState(record);
    if (current === null) return { ok: false, reason: 'Renseignez d\'abord vos PV actuels ou maximum.' };

    const fromTemp = Math.min(temp, amount);
    const rest = amount - fromTemp;
    const after = { current: Math.max(0, current - rest), temp: temp - fromTemp };
    const patch = {};
    if (fromTemp > 0) patch.hp_temp = String(after.temp);
    if (rest > 0 || readHitPoints(record?.hp_current) === null) patch.hp_current = String(after.current);

    const notes = [];
    let dead = false;
    if (current === 0) {
        // Déjà à 0 PV
        // Seuls les dégâts restant après les PV temporaires touchent les PV
        dead = max !== null && rest >= max;
        notes.push(dead
            ? 'Dégâts égaux ou supérieurs à vos PV maximum alors que vous êtes à 0 PV : mort.'
            : 'Dégâts subis à 0 PV : un échec au jet contre la mort (deux sur un coup critique).');
    } else if (after.current === 0) {
        const overflow = rest - current;
        dead = max !== null && overflow >= max;
        if (dead) {
            notes.push(`Dégâts restants (${overflow}) égaux ou supérieurs à vos PV maximum : mort instantanée.`);
        } else {
            notes.push('0 PV : vous êtes Inconscient (coché dans États) ; jet contre la mort au début de chacun de vos tours.');
            Object.assign(patch, toggleCondition(record, 'unconscious', true));
        }
    } else {
        notes.push(`Si vous vous concentrez sur un sort : jet de sauvegarde de Constitution DD ${concentrationDc(amount)}.`);
    }
    return { ok: true, patch, before: { current, temp }, after, notes, dead };
}

/**
 * Soins reçus.
 * @returns {{ ok: false, reason: string } | { ok: true, patch: Object, before: Object, after: Object, notes: string[] }}
 */
export function applyHealing(record, value) {
    const amount = readAmount(value);
    if (amount === null) return { ok: false, reason: 'Saisissez un nombre de 1 à 999.' };
    const { current, max, temp } = hitPointState(record);
    if (current === null) return { ok: false, reason: 'Renseignez d\'abord vos PV actuels ou maximum.' };

    const raw = current + amount;
    // Plafond : le maximum, sans jamais faire baisser des PV actuels déjà au-dessus (saisis à la main)
    const healed = max !== null ? Math.max(current, Math.min(max, raw)) : raw;
    const after = { current: healed, temp };
    const patch = {};
    if (healed !== current || readHitPoints(record?.hp_current) === null) patch.hp_current = String(healed);

    const notes = [];
    if (max !== null && raw > max && current < max) notes.push(`Vos PV ne dépassent pas leur maximum (${max}).`);
    if (healed > current) {
        // Regagner des PV remet les jets contre la mort à zéro ; à 0 PV, met fin à l'inconscience
        const savesSet = DEATH_SAVE_KEYS.filter((key) => record?.[key] === true);
        for (const key of savesSet) patch[key] = false;
        const unconscious = activeConditions(record).includes('unconscious');
        if (current === 0 && unconscious) {
            Object.assign(patch, toggleCondition(record, 'unconscious', false));
            notes.push('Vous reprenez conscience (Inconscient décoché) mais restez À terre.');
        }
        if (savesSet.length) notes.push('Jets contre la mort remis à zéro.');
    }
    return { ok: true, patch, before: { current, temp }, after, notes };
}

/**
 * PV temporaires reçus : ils ne se cumulent pas, on garde les plus élevés.
 * @returns {{ ok: false, reason: string } | { ok: true, patch: Object, before: Object, after: Object, notes: string[] }}
 */
export function applyTemporary(record, value) {
    const amount = readAmount(value);
    if (amount === null) return { ok: false, reason: 'Saisissez un nombre de 1 à 999.' };
    const { current, temp } = hitPointState(record);
    const kept = Math.max(temp, amount);
    const notes = [];
    if (temp >= amount) notes.push(`Les PV temporaires ne se cumulent pas : vous gardez les ${temp} que vous aviez.`);
    else if (temp > 0) notes.push(`Les PV temporaires ne se cumulent pas : ${amount} remplacent les ${temp} que vous aviez.`);
    return {
        ok: true, patch: kept !== temp ? { hp_temp: String(kept) } : {},
        before: { current, temp }, after: { current, temp: kept }, notes
    };
}

/**
 * Boutons − / + : un pas sur les PV actuels (entre 0 et le maximum) ou les PV temporaires (≥ 0).
 * Ajustement simple, sans les règles des dégâts (pas de PV temporaires retirés, pas d'état coché).
 * @param {Object} record
 * @param {'hp_current'|'hp_temp'} key
 * @param {number} delta
 * @returns {Object} modification, ou {} si rien ne change (déjà au minimum ou au maximum)
 */
export function stepHitPoints(record, key, delta) {
    const { current, max, temp } = hitPointState(record);
    let base;
    let next;
    if (key === 'hp_temp') {
        base = temp;
        next = Math.max(0, base + delta);
    } else if (key === 'hp_current') {
        base = current ?? 0;
        next = Math.max(0, base + delta);
        // Le maximum ne plafonne qu'une hausse, et ne fait jamais baisser des PV déjà au-dessus
        if (max !== null && delta > 0) next = Math.max(base, Math.min(max, next));
    } else {
        return {};
    }
    // Case vide : le premier appui l'écrit (même valeur que celle montrée)
    const empty = readHitPoints(record?.[key]) === null;
    return next !== base || empty ? { [key]: String(next) } : {};
}
