/**
 * POINTS D'EXPÉRIENCE — seuils de niveau et PX restants (fonctions pures)
 *
 * Table « Progression des personnages » du Manuel des joueurs 2024 (chapitre 2) : PX à atteindre
 * pour chaque niveau. Clé char_xp, en texte (format v3, « 0 » par défaut).
 * Une fiche à 0 PX au-delà du niveau 1 progresse par étapes (sans PX) : aucun
 * décompte n'est affiché.
 */

import { readCount } from './counters.js';
import { parseNumber } from './character.js';

/** PX à atteindre pour chaque niveau (index = niveau ; 0 inutilisé) */
export const XP_THRESHOLDS = [
    0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
];
export const MAX_XP_ENTRY = 999999;

/**
 * PX lus dans la case, sous les formes que les joueurs écrivent : « 2930 », « 1 200 »,
 * « 4990/6500 » (PX / seuil suivant), avec ou sans mise en forme v3 (« <font …>2930</font> »).
 * @param {unknown} value
 * @returns {number|null} null : texte libre (« voir MJ »)
 */
export function readXp(value) {
    if (typeof value === 'number') return readCount(value);
    const text = String(value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const main = /^([\d\s.  ]+?)(?:\s*\/\s*[\d\s.  ]+)?$/.exec(text);
    if (!main) return readCount(text);
    return readCount(main[1].replace(/[\s.  ]/g, ''));
}

/**
 * Où en est le personnage.
 * @param {Object} record
 * @returns {{ known: boolean, xp: number|null, level: number, nextLevel: number|null,
 *             needed: number|null, remaining: number|null, ready: boolean, reachable: number }}
 *   known : PX lisibles et utilisés (pas une progression par étapes) ;
 *   ready : assez de PX pour le niveau suivant ; reachable : niveau que ces PX permettent
 */
export function experienceProgress(record) {
    const level = Math.min(20, Math.max(1, parseNumber(record?.char_level, 1)));
    const xp = readXp(record?.char_xp);
    const nextLevel = level < 20 ? level + 1 : null;
    const needed = nextLevel ? XP_THRESHOLDS[nextLevel] : null;
    const known = xp !== null && xp >= 0 && !(xp === 0 && level > 1);
    let reachable = 1;
    if (known) for (let l = 2; l <= 20; l += 1) if (xp >= XP_THRESHOLDS[l]) reachable = l;
    return {
        known, xp, level, nextLevel, needed,
        remaining: known && needed !== null ? Math.max(0, needed - xp) : null,
        ready: known && needed !== null && xp >= needed,
        reachable
    };
}

/**
 * PX gagnés.
 * @param {Object} record
 * @param {unknown} value - montant saisi (entier de 1 à MAX_XP_ENTRY)
 * @returns {{ ok: false, reason: string } | { ok: true, patch: Object, before: number, after: number }}
 */
export function addExperience(record, value) {
    const text = String(value ?? '').trim();
    const amount = /^\d+$/.test(text) ? Number(text) : 0;
    if (amount < 1 || amount > MAX_XP_ENTRY) return { ok: false, reason: 'Saisissez un nombre de PX.' };
    const raw = readXp(record?.char_xp);
    if (raw === null) return { ok: false, reason: 'La case PX contient du texte : corrigez-la d\'abord à la main.' };
    // Écrit en nombre seul (« 5090 ») : le décompte sous la case remplace un « /6500 » éventuel
    const before = Math.max(0, raw);
    const after = before + amount;
    return { ok: true, patch: { char_xp: String(after) }, before, after };
}

/** « 1 200 » (espace insécable des milliers : l'espace fine n'existe pas dans toutes les polices) */
export function formatXp(n) {
    return Number(n).toLocaleString('fr-FR').replace(/\s/g, '\u00a0');
}
