// =============================================================================
// FEATS.JS (règles) - Socle des dons : quels dons le personnage a déjà atteints
//  - un don ne compte que s'il est choisi dans un emplacement feat_<N> dont le niveau N
//    est atteint (N ≤ niveau du personnage) ; un don prévu pour plus tard ne change rien ;
//  - les valeurs enregistrées sont nettoyées du HTML des anciennes sauvegardes.
//  - seuls les emplacements de la fiche comptent (FEAT_SLOT_ORDER : 1, 4, 8, 12, 16, 19, plus
//    feat_0, second don d'origine de l'Humain, qui ne compte que si l'espèce est Humain, et les
//    dons de classe en plus, feat_6 et feat_14 pour le Guerrier, feat_10 pour le Roublard) ; une
//    clé feat_2 (sauvegarde retouchée à la main) n'est jamais affichée, donc ignorée.
//  - « level » d'un emplacement = son numéro (clé feat_<N>, feat_choices, feat_uses) ; le niveau
//    où il est acquis est featSlotLevel(N) (feat_0 : niveau 1) ; featSlotName le nomme.
// Ce module ne dépend d'aucune autre règle : character.js et weapons.js l'importent.
// Les effets des dons sur la fiche (notes, valeurs calculées) sont dans feat-effects.js.
// =============================================================================

import { FEATS_DATA } from '../data/feats.js';
import { DD_RULES } from '../data/dd-rules.js';
import { FEAT_SLOT_ORDER, HUMAN_FEAT_SLOT, CLASS_FEAT_SLOTS, featSlotLevel } from '../state/schema.js';

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
 * Le personnage est-il un Humain (trait Polyvalent : un second don d'origine) ?
 * Lecture de char_species comme la v3 : « Humain » (liste) ou « Human », sans HTML.
 * @param {Object} character
 * @returns {boolean}
 */
export function isHuman(character) {
    return /^(humain|human)$/i.test(plain(character?.char_species));
}

/** Noms des classes qui ont des dons en plus (légende de l'emplacement) */
const CLASS_SLOT_NAMES = Object.freeze({
    fighter: { name: 'Guerrier', plural: 'Guerriers' },
    rogue: { name: 'Roublard', plural: 'Roublards' }
});

/**
 * Classe du personnage, lue comme classSlug (character.js) : identifiant anglais, nom anglais ou
 * français (« Guerrier », « Fighter »), sans HTML.
 * @param {Object} character
 * @returns {string} ex. 'fighter' ; '' si inconnue
 */
function classOf(character) {
    const clean = plain(character?.char_class).toLowerCase();
    if (!clean) return '';
    for (const [slug, cls] of Object.entries(DD_RULES.classes)) {
        if (slug === clean || cls.name.toLowerCase() === clean || cls.nameFr.toLowerCase() === clean) return slug;
    }
    return '';
}

/**
 * Emplacement réservé à une classe (don en plus du Guerrier ou du Roublard) ?
 * @param {number|string} slot - numéro de l'emplacement
 * @returns {{ classId: string, name: string, plural: string } | null}
 */
export function classFeatSlot(slot) {
    const key = String(Number(slot));
    const classId = Object.hasOwn(CLASS_FEAT_SLOTS, key) ? CLASS_FEAT_SLOTS[key] : '';
    return classId ? { classId, ...CLASS_SLOT_NAMES[classId] } : null;
}

/**
 * L'emplacement compte-t-il pour ce personnage ? feat_0 : Humain seulement ; feat_6 et feat_14 :
 * Guerrier ; feat_10 : Roublard ; les autres : tout le monde. Un don noté dans un emplacement qui
 * ne compte pas n'est jamais effacé (la fiche le montre « réservé »).
 * @param {number|string} slot
 * @param {Object} character
 * @returns {boolean}
 */
export function featSlotCounts(slot, character) {
    if (Number(slot) === HUMAN_FEAT_SLOT) return isHuman(character);
    const reserved = classFeatSlot(slot);
    return reserved ? classOf(character) === reserved.classId : true;
}

/**
 * Nom d'un emplacement dans les phrases (« niveau 4 », « niveau 1 (Humain) »)
 * @param {number|string} slot - numéro de l'emplacement
 * @returns {string}
 */
export function featSlotName(slot) {
    return Number(slot) === HUMAN_FEAT_SLOT ? 'niveau 1 (Humain)' : `niveau ${slot}`;
}

/**
 * Emplacements de dons remplis, dans l'ordre de la fiche (FEAT_SLOT_ORDER seulement).
 * feat_0 (second don d'origine de l'Humain) n'est retenu que pour un Humain.
 * @param {Object} character - personnage au format de sauvegarde (v3)
 * @returns {Array<{ level: number, featId: string, reached: boolean }>}
 *   level : numéro de l'emplacement (0 pour celui de l'Humain) ;
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
        if (!FEAT_SLOT_ORDER.includes(slotLevel)) continue;
        if (!featSlotCounts(slotLevel, character)) continue;
        slots.push({ level: slotLevel, featId, reached: featSlotLevel(slotLevel) <= level });
    }
    return slots.sort((a, b) => FEAT_SLOT_ORDER.indexOf(a.level) - FEAT_SLOT_ORDER.indexOf(b.level));
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
