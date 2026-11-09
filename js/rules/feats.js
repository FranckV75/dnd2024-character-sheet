// =============================================================================
// FEATS.JS (règles) - Socle des dons : quels dons le personnage a déjà atteints
//  - un don ne compte que s'il est choisi dans un emplacement feat_<N> dont le niveau N
//    est atteint (N ≤ niveau du personnage) ; un don prévu pour plus tard ne change rien ;
//  - les valeurs enregistrées sont nettoyées du HTML des anciennes sauvegardes.
//  - seuls les emplacements de la fiche comptent (FEAT_SLOT_ORDER : 1, 4, 8, 12, 16, 19, plus
//    feat_0, second don d'origine de l'Humain, qui ne compte que si l'espèce est Humain, et les
//    dons de classe en plus, feat_6 et feat_14 pour le Guerrier, feat_10 pour le Roublard, et le
//    style de combat, feat_2 pour le Guerrier, le Paladin et le Rôdeur, feat_7 pour le Champion) ;
//    une autre clé feat_<N> (sauvegarde retouchée à la main) n'est jamais affichée, donc ignorée.
//  - « level » d'un emplacement = son numéro (clé feat_<N>, feat_choices, feat_uses) ; le niveau
//    où il est acquis est featSlotLevel(N) (feat_0 : niveau 1) ; featSlotName le nomme.
// Ce module ne dépend d'aucune autre règle : character.js et weapons.js l'importent.
// Les effets des dons sur la fiche (notes, valeurs calculées) sont dans feat-effects.js.
// =============================================================================

import { FEATS_DATA } from '../data/feats.js';
import { DD_RULES } from '../data/dd-rules.js';
import { FEAT_SLOT_ORDER, HUMAN_FEAT_SLOT, STYLE_FEAT_SLOT, CLASS_FEAT_SLOTS, featSlotLevel } from '../state/schema.js';

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

/** Légendes des emplacements réservés : quand il compte, et quand il garde un don sans compter */
const CLASS_SLOT_CAPTIONS = Object.freeze({
    2: { caption: 'Style de combat', reserved: 'Réservé aux Guerriers, Paladins et Rôdeurs' },
    6: { caption: 'Guerrier : don en plus', reserved: 'Réservé aux Guerriers' },
    7: { caption: 'Champion : style en plus', reserved: 'Réservé aux Champions' },
    10: { caption: 'Roublard : don en plus', reserved: 'Réservé aux Roublards' },
    14: { caption: 'Guerrier : don en plus', reserved: 'Réservé aux Guerriers' }
});

/** Classes qui ont la capacité Style de combat (prérequis des dons de cette catégorie) */
const FIGHTING_STYLE_CLASSES = Object.freeze(['fighter', 'paladin', 'ranger']);

/**
 * À la place d'un style de combat (PHB 2024) : Guerrier béni (Paladin) ou Guerrier druidique
 * (Rôdeur), deux sorts mineurs. Valeurs possibles de feat_2 seulement ; ce ne sont pas des dons.
 */
export const STYLE_ALTERNATIVES = Object.freeze({
    guerrier_beni: Object.freeze({
        name: 'Guerrier béni', classId: 'paladin', className: 'Paladin',
        desc: "<strong>Guerrier béni.</strong> À la place d'un style de combat, vous apprenez deux sorts mineurs de Clerc de votre choix (Assistance et Flamme sacrée sont conseillés). Ils comptent comme des sorts de Paladin pour vous, et le Charisme est votre caractéristique d'incantation pour eux. Quand vous gagnez un niveau de Paladin, vous pouvez remplacer l'un d'eux par un autre sort mineur de Clerc."
    }),
    guerrier_druidique: Object.freeze({
        name: 'Guerrier druidique', classId: 'ranger', className: 'Rôdeur',
        desc: "<strong>Guerrier druidique.</strong> À la place d'un style de combat, vous apprenez deux sorts mineurs de Druide de votre choix (Assistance et Poussière d'étoile sont conseillés). Ils comptent comme des sorts de Rôdeur pour vous, et la Sagesse est votre caractéristique d'incantation pour eux. Quand vous gagnez un niveau de Rôdeur, vous pouvez remplacer l'un d'eux par un autre sort mineur de Druide."
    })
});

/**
 * Classe du personnage, lue comme classSlug (character.js) : identifiant anglais, nom anglais ou
 * français (« Guerrier », « Fighter »), sans HTML.
 * @param {Object} character
 * @returns {string} ex. 'fighter' ; '' si inconnue
 */
export function classOf(character) {
    const clean = plain(character?.char_class).toLowerCase();
    if (!clean) return '';
    for (const [slug, cls] of Object.entries(DD_RULES.classes)) {
        if (slug === clean || cls.name.toLowerCase() === clean || cls.nameFr.toLowerCase() === clean) return slug;
    }
    return '';
}

/** Sous-classe du personnage (identifiant de DD_RULES.subclasses, ex. 'champion') ; '' si inconnue */
export function subclassOf(character) {
    const clean = plain(character?.char_subclass).toLowerCase();
    if (!clean) return '';
    for (const [slug, sub] of Object.entries(DD_RULES.subclasses)) {
        if (slug === clean || sub.name.toLowerCase() === clean || sub.nameFr.toLowerCase() === clean) return slug;
    }
    return '';
}

/**
 * Emplacement réservé à une classe (don en plus du Guerrier ou du Roublard, style de combat) ?
 * @param {number|string} slot - numéro de l'emplacement
 * @returns {{ classes: string[], subclass?: string, style: boolean, caption: string, reserved: string } | null}
 */
export function classFeatSlot(slot) {
    const key = String(Number(slot));
    if (!Object.hasOwn(CLASS_FEAT_SLOTS, key)) return null;
    const rule = CLASS_FEAT_SLOTS[key];
    return { classes: [...rule.classes], subclass: rule.subclass, style: Boolean(rule.style), ...CLASS_SLOT_CAPTIONS[key] };
}

/**
 * L'emplacement compte-t-il pour ce personnage ? feat_0 : Humain seulement ; feat_2 : Guerrier,
 * Paladin, Rôdeur ; feat_6 et feat_14 : Guerrier ; feat_7 : Guerrier Champion ; feat_10 : Roublard ;
 * les autres : tout le monde. Un don noté dans un emplacement qui ne compte pas n'est jamais effacé
 * (la fiche le montre « réservé »).
 * @param {number|string} slot
 * @param {Object} character
 * @returns {boolean}
 */
export function featSlotCounts(slot, character) {
    if (Number(slot) === HUMAN_FEAT_SLOT) return isHuman(character);
    const reserved = classFeatSlot(slot);
    if (!reserved) return true;
    return reserved.classes.includes(classOf(character)) && (!reserved.subclass || subclassOf(character) === reserved.subclass);
}

/**
 * Niveau où l'emplacement est acquis pour ce personnage : comme featSlotLevel, sauf le style de
 * combat, acquis au niveau 1 par le Guerrier (niveau 2 pour le Paladin et le Rôdeur).
 * @param {number|string} slot
 * @param {Object} character
 * @returns {number}
 */
export function featSlotLevelFor(slot, character) {
    if (Number(slot) === STYLE_FEAT_SLOT && classOf(character) === 'fighter') return 1;
    return featSlotLevel(slot);
}

/**
 * Le personnage a-t-il la capacité Style de combat (prérequis des dons de cette catégorie) ?
 * Guerrier dès le niveau 1, Paladin et Rôdeur dès le niveau 2.
 * @param {Object} character
 * @returns {boolean}
 */
export function hasFightingStyle(character) {
    const classId = classOf(character);
    if (!FIGHTING_STYLE_CLASSES.includes(classId)) return false;
    return classId === 'fighter' || characterLevel(character?.char_level) >= 2;
}

/**
 * Nom d'un emplacement dans les phrases (« niveau 4 », « niveau 1 (Humain) »)
 * @param {number|string} slot - numéro de l'emplacement
 * @returns {string}
 */
export function featSlotName(slot) {
    const n = Number(slot);
    if (n === HUMAN_FEAT_SLOT) return 'niveau 1 (Humain)';
    if (n === STYLE_FEAT_SLOT) return 'style de combat';
    if (n === 7) return 'niveau 7 (Champion)';
    return `niveau ${slot}`;
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
        slots.push({ level: slotLevel, featId, reached: featSlotLevelFor(slotLevel, character) <= level });
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
    return (Object.hasOwn(FEATS_DATA, featId) && FEATS_DATA[featId]?.name)
        || (Object.hasOwn(STYLE_ALTERNATIVES, featId) && STYLE_ALTERNATIVES[featId].name) || featId;
}
