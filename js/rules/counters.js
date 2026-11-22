/**
 * COMPTEURS — pas des boutons − / + et montants ajoutés (fonctions pures)
 *
 * Les compteurs de la fiche sont enregistrés en texte (format v3 : « 12 ») ou en nombre
 * (fatigue_level). UNE seule lecture pour tous (readCounter) : boutons − / + (Épuisement, points de
 * Foi ou Inspiration héroïque, renommée), fenêtre des faveurs, dépense d'une faveur et passage de
 * niveau (points de Foi, js/rules/odyssey.js). Règle :
 *  - un entier positif ou nul, de COUNTER_DIGITS chiffres au plus (« 12 »), éventuellement suivi
 *    de « /M » (« 2/3 », Inspiration de Korgul : le pas change le premier nombre, entre 0 et M) ;
 *    espaces autour des nombres et de la barre acceptés ; case vide = 0 ;
 *  - tout le reste est du TEXTE LIBRE (« 2 (Chanceux) », « -1 », « 1234567/2 »), jamais réécrit :
 *    seule la saisie à la main le change, et les boutons le disent (stepCounter).
 * Les montants (pièces de la bourse, XP) ne sont pas des compteurs : readCount (sans « /M », sans
 * limite de chiffres autre que celle d'un entier exact).
 */

/** Chiffres au plus de chaque nombre d'un compteur (999999) : au-delà, la case est du texte libre */
export const COUNTER_DIGITS = 6;

const COUNTER = new RegExp(String.raw`^(\d{1,${COUNTER_DIGITS}})(?:\s*/\s*(\d{1,${COUNTER_DIGITS}}))?$`);
const COUNTER_LIMIT = 10 ** COUNTER_DIGITS;

/**
 * Lit un compteur : « 3 » → { count: 3, max: null } ; « 3/5 » → { count: 3, max: 5 } ;
 * case vide → { count: 0, max: null } ; texte libre → null (voir la règle en tête du fichier).
 * @param {unknown} value
 * @returns {{ count: number, max: number|null }|null}
 */
export function readCounter(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value) && value >= 0 && value < COUNTER_LIMIT ? { count: value, max: null } : null;
    }
    const text = String(value ?? '').trim();
    if (text === '') return { count: 0, max: null };
    const match = COUNTER.exec(text);
    if (!match) return null;
    return { count: Number(match[1]), max: match[2] === undefined ? null : Number(match[2]) };
}

/** Case vide (« » ou espaces) : le pas y écrit un nombre même s'il ne change rien (« − » → 0) */
const isEmpty = (value) => typeof value !== 'number' && String(value ?? '').trim() === '';

/**
 * Lit un montant entier seul (pièces, XP) ; case vide = 0 ; autre texte = null.
 * @param {unknown} value
 * @returns {number|null}
 */
export function readCount(value) {
    if (typeof value === 'number') return Number.isSafeInteger(value) ? value : null;
    const text = String(value ?? '').trim();
    if (text === '') return 0;
    if (!/^-?\d+$/.test(text)) return null;
    const n = Number(text);
    // Nombre géant : traité comme du texte (sinon « 1e+21 » serait écrit, illisible ensuite)
    return Number.isSafeInteger(n) ? n : null;
}

/**
 * Pas d'un bouton − / + entre deux bornes.
 * @param {unknown} value
 * @param {number} delta
 * @param {{ min?: number, max?: number }} [bounds]
 * @returns {number|string|null} nouvelle valeur (« N/M » reste sous cette forme, et N ne dépasse
 *   pas M), ou null si rien ne change (borne atteinte, texte libre)
 */
export function steppedValue(value, delta, { min = 0, max = Infinity } = {}) {
    const counter = readCounter(value);
    if (!counter) return null;
    const top = counter.max === null ? max : Math.min(max, counter.max);
    const next = Math.min(top, Math.max(min, counter.count + delta));
    if (counter.max !== null) return next === counter.count ? null : `${next}/${counter.max}`;
    return next === counter.count && !isEmpty(value) ? null : next;
}

/**
 * Décision d'un bouton − / + d'un compteur de la fiche (js/ui/counters.js), sans rien écrire.
 *  - texte libre : refusé, avec la phrase « La case « … » contient du texte : modifiez-la à la main. » ;
 *  - « + » déjà au maximum (ou au-delà : vieille valeur) : refusé sans jamais baisser ; maximum 1
 *    (Inspiration héroïque, mode coupé) : la phrase onlyOne, si elle est donnée ;
 *  - borne atteinte autrement (« 0 » et « − », « 3/3 » et « + ») : refusé sans phrase ;
 *  - sinon : la valeur à écrire, en texte (format v3), ou en nombre si asNumber (fatigue_level).
 * @param {unknown} value - valeur actuelle de la case
 * @param {number} delta - −1 ou +1
 * @param {{ max?: number, asNumber?: boolean, label?: string, onlyOne?: string }} [options]
 *   label : nom de la case dans la phrase du texte libre ; onlyOne : phrase du « + » refusé à 1
 * @returns {{ value: number|string|null, message: string }} value null : rien n'est écrit
 */
export function stepCounter(value, delta, { max = Infinity, asNumber = false, label = '', onlyOne = '' } = {}) {
    const counter = readCounter(value);
    if (!counter) return { value: null, message: `La case « ${label} » contient du texte : modifiez-la à la main.` };
    if (delta > 0 && counter.count >= max) return { value: null, message: max === 1 && onlyOne ? onlyOne : '' };
    const next = steppedValue(value, delta, { max });
    if (next === null) return { value: null, message: '' };
    return { value: asNumber && typeof next === 'number' ? next : String(next), message: '' };
}

/** Pièces de la bourse, de la plus petite à la plus grande */
export const COINS = [
    { key: 'cp', short: 'PC', name: 'pièces de cuivre' },
    { key: 'sp', short: 'PA', name: 'pièces d\'argent' },
    { key: 'ep', short: 'PE', name: 'pièces d\'électrum' },
    { key: 'gp', short: 'PO', name: 'pièces d\'or' },
    { key: 'pp', short: 'PP', name: 'pièces de platine' }
];
export const MAX_COIN_ENTRY = 999999;

/**
 * Pièces gagnées (sign 1) ou dépensées (sign -1). Pas de monnaie rendue automatiquement : une
 * dépense plus grande que la bourse de cette pièce est refusée.
 * @param {Object} record
 * @param {string} key - cp, sp, ep, gp, pp
 * @param {unknown} value - montant saisi
 * @param {1|-1} sign
 * @returns {{ ok: false, reason: string } | { ok: true, patch: Object, before: number, after: number, coin: Object }}
 */
export function changeCoins(record, key, value, sign) {
    const coin = COINS.find((c) => c.key === key);
    if (!coin) return { ok: false, reason: 'Choisissez une pièce.' };
    const text = String(value ?? '').trim();
    const amount = /^\d+$/.test(text) ? Number(text) : 0;
    if (amount < 1 || amount > MAX_COIN_ENTRY) return { ok: false, reason: 'Saisissez un nombre de pièces.' };
    const before = readCount(record?.[key]);
    if (before === null) return { ok: false, reason: `La case ${coin.short} contient du texte : corrigez-la d'abord à la main.` };
    const after = before + sign * amount;
    if (after < 0) return { ok: false, reason: `Pas assez de ${coin.name} : vous en avez ${before}.` };
    return { ok: true, patch: { [key]: String(after) }, before, after, coin };
}
