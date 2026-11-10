/**
 * COMPTEURS — pas des boutons − / + et montants ajoutés (fonctions pures)
 *
 * Les compteurs de la fiche sont enregistrés en texte (format v3 : « 12 ») ou en nombre
 * (fatigue_level). Un texte qui n'est pas un entier seul (« 2 (Chanceux) ») n'est jamais réécrit,
 * sauf la forme « N/M » (« 2/3 », Inspiration de Korgul) : le pas change N, entre 0 et M.
 */

/**
 * Lit un entier seul ; case vide = 0 ; autre texte = null.
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

/** « 2/3 » → { n: 2, of: 3 } ; autre chose → null */
function readFraction(value) {
    const match = /^\s*(\d{1,6})\s*\/\s*(\d{1,6})\s*$/.exec(typeof value === 'string' ? value : '');
    return match ? { n: Number(match[1]), of: Number(match[2]) } : null;
}

/**
 * Pas d'un bouton − / + entre deux bornes.
 * @param {unknown} value
 * @param {number} delta
 * @param {{ min?: number, max?: number }} [bounds]
 * @returns {number|string|null} nouvelle valeur (« N/M » reste sous cette forme), ou null si rien
 *   ne change (borne atteinte, texte libre)
 */
export function steppedValue(value, delta, { min = 0, max = Infinity } = {}) {
    const fraction = readFraction(value);
    if (fraction) {
        const next = Math.min(Math.min(max, fraction.of), Math.max(min, fraction.n + delta));
        return next === fraction.n ? null : `${next}/${fraction.of}`;
    }
    const base = readCount(value);
    if (base === null) return null;
    const next = Math.min(max, Math.max(min, base + delta));
    const empty = typeof value !== 'number' && String(value ?? '').trim() === '';
    return next === base && !empty ? null : next;
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
