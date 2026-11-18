// =============================================================================
// SPELL-PREPARATION.JS (règles) - Sorts préparés du grimoire et lancement d'un sort
//
//  - Classes à liste fixe (PHB 2024, chap. 7, table « Spell Preparation by Class ») : le Barde,
//    l'Ensorceleur et l'Occultiste ne changent leur liste qu'en gagnant un niveau (un sort à la
//    fois) ; tous les sorts de niveau 1+ notés au grimoire sont donc préparés. Même règle pour le
//    Chevalier occulte et l'Arnaqueur arcanique (« Whenever you gain a Fighter / Rogue level, you
//    can replace one spell on your list »). Le Paladin et le Rôdeur changent un sort après chaque
//    repos long : leur losange reste à cocher, comme pour le Clerc, le Druide et le Magicien.
//  - État affiché du losange d'une ligne : calcul d'affichage, jamais écrit dans la fiche (la clé
//    v3 « prep » garde la valeur du joueur, qui reprend son sens s'il change de classe).
//  - Sorts donnés (classe, sous-classe, dons, espèce) : hors du compte de la table.
//  - Lancer un sort : niveaux d'emplacement possibles (niveau du sort et au-dessus, emplacements
//    de pacte compris) et emplacement coché.
// Fonctions pures.
// =============================================================================

import { rowLevel, spellNameKey, slotView, slotLevels, toggleSlotUsed } from './spells.js';
import { classAlwaysPreparedSpells } from './class-progression.js';
import { featSpellGroups } from './feat-spells.js';
import { subclassSpells } from './subclass-features.js';
import { speciesSpellNames } from './species.js';

/** Classes dont la liste de sorts préparés ne change qu'au passage de niveau */
export const WHOLE_LIST_CLASSES = Object.freeze(['bard', 'sorcerer', 'warlock']);
/** Sous-classes lanceuses de sorts qui suivent la même règle (liste du Magicien) */
export const WHOLE_LIST_SUBCLASSES = Object.freeze(['eldritch_knight', 'arcane_trickster']);

/**
 * Tous les sorts de niveau 1+ notés au grimoire sont-ils préparés ?
 * @param {string} classSlug - deriveCharacter().classSlug
 * @param {string} [subclass] - deriveCharacter().subclass
 * @returns {boolean}
 */
export function preparesWholeList(classSlug, subclass = '') {
    return WHOLE_LIST_CLASSES.includes(classSlug) || WHOLE_LIST_SUBCLASSES.includes(subclass);
}

/**
 * Sorts déjà donnés à la fiche (toujours préparés par la classe, sorts de sous-classe atteints,
 * sorts de dons et d'espèce) : notés aussi au grimoire, ils ne comptent pas dans la table de la
 * classe. Cercle de la Terre sans terrain choisi : aucun terrain n'est préparé, ses sorts restent
 * des sorts de Druide ordinaires.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter()
 * @returns {Set<string>} noms comparables (spellNameKey)
 */
export function grantedSpellKeys(character, derived) {
    const names = derived.classSlug ? classAlwaysPreparedSpells(derived.classSlug, derived.level) : [];
    const { reached } = subclassSpells(derived);
    const landUnchosen = derived.subclass === 'circle_of_the_land' && new Set(reached.map(spell => spell.group)).size > 1;
    for (const spell of reached) {
        if (landUnchosen && spell.group) continue;
        names.push(spell.name, spell.vo, ...(spell.aka ?? []));
    }
    for (const group of featSpellGroups(character, derived)) {
        for (const spell of group.spells) names.push(spell.name, spell.vo);
    }
    names.push(...speciesSpellNames(character, derived));
    return new Set(names.filter(Boolean).map(spellNameKey));
}

/**
 * État du losange d'une ligne du grimoire :
 *  - 'cantrip'    : sort mineur, toujours disponible (∞) ;
 *  - 'granted'    : donné par la classe, la sous-classe, un don ou l'espèce (toujours préparé, hors du compte) ;
 *  - 'list'       : classe à liste fixe (toujours préparé, compté) ;
 *  - 'prepared' / 'unprepared' : losange coché ou non par le joueur.
 * @param {Object} row - ligne de dynamic_spells
 * @param {{ wholeList?: boolean, granted?: Set<string>|null }} [options]
 * @returns {'cantrip'|'granted'|'list'|'prepared'|'unprepared'}
 */
export function spellPrepState(row, { wholeList = false, granted = null } = {}) {
    if (rowLevel(row) === '0') return 'cantrip';
    if (granted?.has(spellNameKey(row?.name))) return 'granted';
    if (wholeList) return 'list';
    return row?.prep === true ? 'prepared' : 'unprepared';
}

/** Ligne affichée dans la vue « au combat » : sort mineur ou sort préparé (même d'office) */
export function inCombatView(state) {
    return state !== 'unprepared';
}

/** Sort de niveau 1+ préparé (même d'office) : il peut être lancé avec un emplacement */
export function isCastable(state) {
    return state === 'prepared' || state === 'list' || state === 'granted';
}

/**
 * Niveaux d'emplacement possibles pour lancer un sort : son niveau et au-dessus (un sort de
 * niveau 1 lancé avec un emplacement de pacte de niveau 3 l'est au niveau 3).
 * @param {number|string} spellLevel - 1 à 9
 * @param {Object} spellSlots - deriveCharacter().spellSlots
 * @param {string} classSlug
 * @param {Object} state - spell_slots_state
 * @returns {Array<{ level: string, left: number, max: number, pact: boolean }>}
 *          niveaux suivis qui ont au moins un emplacement (left : emplacements restants)
 */
export function castSlotOptions(spellLevel, spellSlots, classSlug, state) {
    const minimum = Math.max(1, parseInt(spellLevel, 10) || 1);
    return slotLevels(spellSlots, classSlug, state)
        .filter(info => Number(info.level) >= minimum)
        .map(info => {
            const { max, used } = slotView(state, info.level, info.rulebook);
            return { level: info.level, left: max - used, max, pact: info.pact };
        })
        .filter(option => option.max > 0);
}

/**
 * Coche un emplacement de ce niveau (le suivant non utilisé).
 * @param {Object} state - spell_slots_state
 * @param {number|string} level
 * @param {number} rulebookCount - deriveCharacter().spellSlots[level]
 * @returns {Object|null} nouvel état, ou null s'il ne reste aucun emplacement de ce niveau
 */
export function useSpellSlot(state, level, rulebookCount = 0) {
    const { max, used } = slotView(state, level, rulebookCount);
    if (used >= max) return null;
    return toggleSlotUsed(state, level, used, true, rulebookCount);
}
