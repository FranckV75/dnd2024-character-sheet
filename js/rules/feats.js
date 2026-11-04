// =============================================================================
// FEATS.JS (règles) - Socle des dons : quels dons le personnage a déjà atteints
//  - un don ne compte que s'il est choisi dans un emplacement feat_<N> dont le niveau N
//    est atteint (N ≤ niveau du personnage) ; un don prévu pour plus tard ne change rien ;
//  - les valeurs enregistrées sont nettoyées du HTML des anciennes sauvegardes.
//  - seuls les emplacements de la fiche comptent (FEAT_LEVELS : 1, 4, 8, 12, 16, 19) ; une clé
//    feat_0 ou feat_2 (sauvegarde retouchée à la main) n'est jamais affichée, donc ignorée.
// Ce module ne dépend d'aucune autre règle : character.js et weapons.js l'importent.
// Les effets des dons sur la fiche (notes, valeurs calculées) sont dans feat-effects.js.
// =============================================================================

import { FEATS_DATA } from '../data/feats.js';
import { FEAT_LEVELS } from '../state/schema.js';

const FEAT_KEY = /^feat_(\d+)$/;

/** Texte brut (les anciennes sauvegardes peuvent contenir un peu de HTML) */
function plain(value) {
    return (value ?? '').toString()
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
}

/**
 * Niveau du personnage, lu comme deriveCharacter et featSlotState (character.js) :
 * premier entier de la saisie (« 4 », « <b>4</b> »), ramené entre 1 et 20 ; 1 si illisible.
 * @param {*} value - char_level
 * @returns {number}
 */
export function characterLevel(value) {
    let level = 1;
    if (typeof value === 'number' && Number.isFinite(value)) level = Math.trunc(value);
    else {
        const match = plain(value).match(/-?\d+/);
        if (match) level = Number.parseInt(match[0], 10);
    }
    return Math.min(20, Math.max(1, level));
}

/**
 * Emplacements de dons remplis, du plus bas niveau au plus haut (niveaux de FEAT_LEVELS seulement).
 * @param {Object} character - personnage au format de sauvegarde (v3)
 * @returns {Array<{ level: number, featId: string, reached: boolean }>}
 *   featId : valeur nettoyée (identifiant de js/data/feats.js, ou ancien texte libre) ;
 *   reached : niveau de l'emplacement atteint (le don compte)
 */
export function featSlots(character) {
    if (!character || typeof character !== 'object') return [];
    const level = characterLevel(character.char_level);
    const slots = [];
    for (const [key, value] of Object.entries(character)) {
        const match = key.match(FEAT_KEY);
        const featId = match ? plain(value) : '';
        if (!featId) continue;
        const slotLevel = Number(match[1]);
        if (!FEAT_LEVELS.includes(slotLevel)) continue;
        slots.push({ level: slotLevel, featId, reached: slotLevel <= level });
    }
    return slots.sort((a, b) => a.level - b.level);
}

/**
 * Dons atteints par le personnage, sans doublon, dans l'ordre des emplacements.
 * @param {Object} character
 * @returns {string[]} identifiants (ex. ['sauvagerie_martiale', 'maitre_des_armes_lourdes_cogneur_lourd'])
 */
export function reachedFeatIds(character) {
    const ids = featSlots(character).filter(slot => slot.reached).map(slot => slot.featId);
    return [...new Set(ids)];
}

/**
 * Le personnage a-t-il atteint ce don ?
 * @param {Object} character
 * @param {string} featId
 * @returns {boolean}
 */
export function hasFeat(character, featId) {
    return reachedFeatIds(character).includes(featId);
}

/**
 * Nom français du don (js/data/feats.js) ; l'identifiant lui-même s'il est inconnu.
 * @param {string} featId
 * @returns {string}
 */
export function featName(featId) {
    return (Object.hasOwn(FEATS_DATA, featId) && FEATS_DATA[featId]?.name) || featId;
}
