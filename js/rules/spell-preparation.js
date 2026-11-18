// =============================================================================
// SPELL-PREPARATION.JS (règles) - Sorts préparés du grimoire et lancement d'un sort
//
//  - Classes à liste fixe (PHB 2024, chap. 7, table « Spell Preparation by Class ») : le Barde,
//    l'Ensorceleur et l'Occultiste ne changent leur liste qu'en gagnant un niveau (un sort à la
//    fois) ; tous les sorts de niveau 1+ notés au grimoire sont donc préparés. Même règle pour le
//    Chevalier occulte et l'Arnaqueur arcanique (« Whenever you gain a Fighter / Rogue level, you
//    can replace one spell on your list »). Le Paladin et le Rôdeur changent un sort après chaque
//    repos long : leur losange reste à cocher, comme pour le Clerc, le Druide et le Magicien.
//    Sorts notés hors de cette liste fixe (Arcanum mystique au-dessus des emplacements de pacte,
//    Découvertes magiques du Collège du Savoir, rituels du Pacte du grimoire, sorts des
//    manifestations…) : losange à cocher comme avant, pour ne compter que ceux qui sont préparés.
//  - État affiché du losange d'une ligne : calcul d'affichage, jamais écrit dans la fiche (la clé
//    v3 « prep » garde la valeur du joueur, qui reprend son sens s'il change de classe).
//  - Sorts donnés (classe, sous-classe, dons, espèce) : hors du compte de la table.
//  - Lancer un sort : niveaux d'emplacement possibles (niveau du sort et au-dessus, emplacements
//    de pacte compris) et emplacement coché.
//  - Fenêtre « Préparer mes sorts » (Clerc, Druide, Paladin, Rôdeur : préparation parmi toute la
//    liste de classe, changée après un repos long) : sorts de la liste jusqu'au plus haut
//    emplacement, cocher (prep à true, ou ligne ajoutée depuis la base), décocher (prep à false ;
//    seule une ligne que la fenêtre vient d'ajouter, restée telle quelle, est retirée).
//  - Sort préparé au-dessus des emplacements (missingSlotLevel) : un sort ne se prépare que s'il
//    est d'un niveau pour lequel on a des emplacements (PHB 2024, « Spellcasting » de chaque
//    classe) ; préparé quand même, il ne peut pas être lancé : la fiche le signale, sans rien changer.
//  - Bouton « Retirer les sorts non préparés » (unpreparedCleanup, removeSpellRows) : pour ces
//    mêmes classes, les sorts décochés s'accumulent au grimoire ; seules partent les lignes que la
//    fenêtre « Préparer mes sorts » saurait remettre (sort de la liste de la classe, niveau avec
//    emplacement), jamais un sort préparé, mineur ou donné ; en cas de doute, la ligne reste.
// Fonctions pures.
// =============================================================================

import {
    rowLevel, spellNameKey, slotView, slotLevels, toggleSlotUsed, findSpellByName, spellToRow, spellNames,
    spellDisplayName, isPrepared, isSpellRowEmpty, normalizeText, plainText
} from './spells.js';
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

/** Secrets magiques (Barde de niveau 10+) : nouveaux sorts pris dans ces listes */
const MAGICAL_SECRETS_LISTS = Object.freeze(['bard', 'cleric', 'druid', 'wizard']);

/**
 * Liste fixe d'une classe à liste fixe : listes de classe où elle prend ses sorts, et plus haut
 * niveau de sort préparable (plus haut emplacement de la table : emplacements de pacte pour
 * l'Occultiste ; ceux ajoutés à la main, Arcanum mystique ou multiclasse, ne comptent pas).
 * Collège du Savoir : ses deux Découvertes magiques viennent des mêmes listes que Secrets
 * magiques et ne comptent pas ; on ne peut pas les distinguer, ses sorts hors de la liste du
 * Barde restent donc à cocher.
 * @param {{ classSlug?: string, subclass?: string, level?: number, spellSlots?: Object }} derived - deriveCharacter()
 * @returns {{ lists: string[], maxLevel: number }|null} null : pas une classe à liste fixe
 */
export function wholeListSource(derived) {
    const { classSlug = '', subclass = '', level = 1, spellSlots = {} } = derived || {};
    if (!preparesWholeList(classSlug, subclass)) return null;
    let lists = [classSlug];
    if (WHOLE_LIST_SUBCLASSES.includes(subclass)) lists = ['wizard'];
    else if (classSlug === 'bard' && level >= 10 && subclass !== 'college_of_lore') lists = [...MAGICAL_SECRETS_LISTS];
    return { lists, maxLevel: highestSlotLevel(spellSlots) };
}

/**
 * Plus haut niveau d'emplacement de la table de la classe (deriveCharacter().spellSlots ; les
 * emplacements ajoutés à la main ne comptent pas) : on ne prépare que des sorts de ce niveau ou moins.
 * @param {Object} spellSlots - { '1': 4, '2': 2 }
 * @returns {number} 0 : aucun emplacement
 */
export function highestSlotLevel(spellSlots) {
    const levels = Object.entries(spellSlots || {})
        .filter(([, count]) => Number(count) > 0)
        .map(([slotLevel]) => Number(slotLevel))
        .filter(Number.isFinite);
    return Math.max(0, ...levels);
}

/**
 * Sort noté qui fait partie de la liste fixe (donc préparé d'office) : niveau 1 à maxLevel, et
 * sort d'une des listes de classe. Sort absent de la base (nom inconnu) : on fait confiance au
 * joueur, il est compté.
 * @param {Object} row - ligne de dynamic_spells
 * @param {{ lists: string[], maxLevel: number }|null} source - wholeListSource()
 * @param {Object|null} [spell] - sort de la base (findSpellByName)
 * @returns {boolean}
 */
export function fitsWholeList(row, source, spell = null) {
    if (!source) return false;
    const level = Number(rowLevel(row));
    if (!(level >= 1) || level > source.maxLevel) return false;
    const classes = Array.isArray(spell?.classes) ? spell.classes : null;
    return !classes || source.lists.some(slug => classes.includes(slug));
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
 *  - 'prepared' / 'unprepared' : losange coché ou non par le joueur (aussi, dans une classe à
 *    liste fixe, pour un sort hors de cette liste : voir fitsWholeList) ;
 *  - 'ritual'     : non préparé, mais lançable en rituel depuis le livre (Savoir rituel du
 *    Magicien : js/rules/spellbook.js) ; losange à cocher comme 'unprepared'.
 * @param {Object} row - ligne de dynamic_spells
 * @param {{ wholeList?: boolean, granted?: Set<string>|null, fits?: ((row: Object) => boolean)|null,
 *   bookRitual?: ((row: Object) => boolean)|null }} [options]
 *        fits : le sort fait-il partie de la liste fixe (fitsWholeList) ? Absent : oui ;
 *        bookRitual : le sort non préparé se lance-t-il en rituel depuis le livre ? Absent : non
 * @returns {'cantrip'|'granted'|'list'|'prepared'|'unprepared'|'ritual'}
 */
export function spellPrepState(row, { wholeList = false, granted = null, fits = null, bookRitual = null } = {}) {
    if (rowLevel(row) === '0') return 'cantrip';
    if (granted?.has(spellNameKey(row?.name))) return 'granted';
    if (wholeList && (!fits || fits(row))) return 'list';
    if (row?.prep === true) return 'prepared';
    return bookRitual?.(row) ? 'ritual' : 'unprepared';
}

/** Ligne affichée dans la vue « au combat » : sort mineur, sort préparé (même d'office), rituel du livre */
export function inCombatView(state) {
    return state !== 'unprepared';
}

/**
 * Place d'une ligne dans la vue « au combat » : 'table' (sort mineur, sort préparé même d'office),
 * 'rituals' (rituel du livre non préparé du Magicien : rangé sous la ligne repliable « Rituels du
 * livre », pour ne pas noyer les sorts prêts à lancer) ou 'hidden' (sort non préparé).
 * @param {string} state - spellPrepState()
 * @returns {'table'|'rituals'|'hidden'}
 */
export function combatPlace(state) {
    if (!inCombatView(state)) return 'hidden';
    return isRitualOnly(state) ? 'rituals' : 'table';
}

/**
 * Sort de niveau 1+ qui a un bouton « Lancer » : préparé (même d'office), avec un emplacement ;
 * rituel du livre non préparé, seulement en rituel (isRitualOnly)
 */
export function isCastable(state) {
    return state === 'prepared' || state === 'list' || state === 'granted' || state === 'ritual';
}

/** Sort qui ne peut se lancer qu'en rituel (rituel du livre non préparé) */
export function isRitualOnly(state) {
    return state === 'ritual';
}

/**
 * Façons de lancer une ligne du grimoire (fenêtre « Lancer ») : avec un emplacement si le sort
 * est préparé (même d'office), en rituel s'il est rituel (case R ou base de sorts : isRitualSpell
 * de js/rules/spellbook.js), quel que soit l'état du losange ; un rituel du livre non préparé
 * (Savoir rituel) se lance seulement en rituel.
 * @param {string} state - spellPrepState()
 * @param {boolean} ritual - le sort est-il rituel ?
 * @returns {{ slots: boolean, ritual: boolean, ritualOnly: boolean }}
 */
export function castModes(state, ritual) {
    if (!isCastable(state)) return { slots: false, ritual: false, ritualOnly: false };
    const ritualOnly = isRitualOnly(state);
    return { slots: !ritualOnly, ritual: ritualOnly || ritual === true, ritualOnly };
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

/**
 * Plus haut niveau d'emplacement que le personnage peut dépenser : emplacements de la table
 * (magie de pacte et multiclassage compris, tels que la fiche les calcule) et niveaux ajoutés à la
 * main dans le grimoire.
 * @param {Object} spellSlots - deriveCharacter().spellSlots
 * @param {string} classSlug
 * @param {Object} state - spell_slots_state
 * @returns {number} 0 : aucun emplacement
 */
export function highestUsableSlot(spellSlots, classSlug, state) {
    return Math.max(0, ...castSlotOptions(1, spellSlots, classSlug, state).map(option => Number(option.level)));
}

/**
 * Arcanum mystique (Occultiste, PHB 2024) : un sort de niveau 6 au niveau 11, puis de niveau 7, 8
 * et 9 aux niveaux 13, 15 et 17, lancés sans emplacement.
 * @param {string} classSlug
 * @param {number} level - niveau de classe
 * @returns {number} plus haut niveau de sort d'Arcanum (0 : aucun)
 */
export function mysticArcanumLevel(classSlug, level) {
    if (classSlug !== 'warlock') return 0;
    const lvl = Math.trunc(Number(level)) || 0;
    return lvl >= 17 ? 9 : lvl >= 15 ? 8 : lvl >= 13 ? 7 : lvl >= 11 ? 6 : 0;
}

/**
 * Sort préparé (losange coché ou fixe) d'un niveau plus haut que le plus haut emplacement : il ne
 * peut pas être lancé. Simple avertissement : rien n'est décoché.
 * Jamais pour un sort mineur, un sort non préparé (même un rituel du livre, lancé en rituel), un
 * sort qui a son propre lancer gratuit (don, espèce…), un Arcanum mystique, ni pour un personnage
 * sans aucun emplacement (la fiche ne sait pas d'où il tient ses sorts : objet, don noté à la main).
 * @param {Object} row - ligne de dynamic_spells
 * @param {string} state - spellPrepState()
 * @param {{ topSlot?: number, arcanumLevel?: number, freeCast?: boolean }} [options]
 *        topSlot : highestUsableSlot() ; arcanumLevel : mysticArcanumLevel() ;
 *        freeCast : le sort a un lancer gratuit suivi par la fiche (js/rules/free-casts.js)
 * @returns {number} niveau du sort à signaler, ou 0
 */
export function missingSlotLevel(row, state, { topSlot = 0, arcanumLevel = 0, freeCast = false } = {}) {
    if (state !== 'prepared' && state !== 'list' && state !== 'granted') return 0;
    const level = Number(rowLevel(row));
    if (!(level >= 1) || !(topSlot > 0) || level <= topSlot) return 0;
    if (freeCast || (level >= 6 && level <= arcanumLevel)) return 0;
    return level;
}

/** Phrase de l'avertissement (infobulle, et barre du haut au toucher) */
export function missingSlotText(level) {
    return `Niveau ${level} : vous n'avez pas encore d'emplacement de ce niveau, ce sort ne peut pas être lancé.`;
}

// ---------------------------------------------------------------------------
// Préparation des sorts par classe, fenêtre « Préparer mes sorts »
// ---------------------------------------------------------------------------

/**
 * Quand et combien de sorts préparés une classe peut changer (PHB 2024, chap. 7, table « Spell
 * Preparation by Class ») : change 'long_rest' (après chaque repos long) ou 'level' (en gagnant un
 * niveau) ; count 'any' (autant que voulu) ou 'one' (un seul) ; from 'class' (toute la liste de la
 * classe) ou 'spellbook' (le grimoire du Magicien).
 */
export const SPELL_PREPARATION = Object.freeze({
    bard: Object.freeze({ change: 'level', count: 'one', from: 'class' }),
    cleric: Object.freeze({ change: 'long_rest', count: 'any', from: 'class' }),
    druid: Object.freeze({ change: 'long_rest', count: 'any', from: 'class' }),
    paladin: Object.freeze({ change: 'long_rest', count: 'one', from: 'class' }),
    ranger: Object.freeze({ change: 'long_rest', count: 'one', from: 'class' }),
    sorcerer: Object.freeze({ change: 'level', count: 'one', from: 'class' }),
    warlock: Object.freeze({ change: 'level', count: 'one', from: 'class' }),
    wizard: Object.freeze({ change: 'long_rest', count: 'any', from: 'spellbook' })
});

/**
 * La classe choisit-elle ses sorts préparés parmi toute sa liste de classe, en les changeant après
 * un repos long (Clerc, Druide : autant que voulu ; Paladin, Rôdeur : un seul) ? Ce sont les classes
 * de la fenêtre « Préparer mes sorts ». Le Magicien prépare depuis son grimoire ; le Barde,
 * l'Ensorceleur et l'Occultiste ont une liste fixe (tous leurs sorts notés sont préparés).
 * @param {string} classSlug
 * @returns {boolean}
 */
export function preparesFromClassList(classSlug) {
    const rule = SPELL_PREPARATION[classSlug];
    return Boolean(rule && rule.change === 'long_rest' && rule.from === 'class');
}

/**
 * Rappel de fin de repos long sur les sorts préparés.
 * @param {string} classSlug
 * @returns {{ text: string, window: boolean }|null} window : la fenêtre « Préparer mes sorts » peut
 *          s'ouvrir (classe qui prépare parmi toute sa liste) ; null : rien ne change au repos long
 *          (liste fixe, classe sans sorts préparés)
 */
export function longRestPreparation(classSlug) {
    const rule = SPELL_PREPARATION[classSlug];
    if (!rule || rule.change !== 'long_rest') return null;
    if (rule.from === 'spellbook') return { text: 'Vous pouvez changer vos sorts préparés parmi ceux de votre grimoire.', window: false };
    return rule.count === 'one'
        ? { text: 'Vous pouvez remplacer un de vos sorts préparés par un autre sort de votre liste de classe.', window: true }
        : { text: 'Vous pouvez changer vos sorts préparés : autant que vous voulez, parmi toute la liste de votre classe.', window: true };
}

/** Le sort de la base fait-il partie des sorts donnés (noms comparables de grantedSpellKeys) ? */
function isGrantedSpell(spell, granted) {
    if (!granted?.size) return false;
    return [...spellNames(spell), spell?.vo].some(name => name && granted.has(spellNameKey(name)));
}

/**
 * Contenu de la fenêtre « Préparer mes sorts » : sorts de la liste de la classe (niveau 1 au plus
 * haut emplacement), groupés par niveau et rangés par nom, avec leur état d'après le grimoire ;
 * puis les autres sorts préparés du grimoire (autre liste, niveau sans emplacement, nom inconnu de
 * la base), qui comptent eux aussi dans les sorts préparés.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Array<Object>} db - base de sorts (data/spells.json)
 * @param {{ classSlug: string, maxLevel: number, granted?: Set<string>|null }} options
 *        maxLevel : highestSlotLevel ; granted : grantedSpellKeys (toujours préparés, hors du compte)
 * @returns {{ groups: Array<{ level: number, items: Array<{ spell: Object, name: string, state: 'granted'|'prepared'|'unprepared' }> }>,
 *   others: Array<{ index: number, name: string, level: number }> }} others : index = indice dans dynamic_spells
 */
export function preparationView(rows, db, { classSlug, maxLevel, granted = null }) {
    const list = Array.isArray(rows) ? rows : [];
    const spells = Array.isArray(db) ? db : [];
    const inList = (spell) => Number(spell?.level) >= 1 && Number(spell.level) <= maxLevel
        && (spell.classes || []).includes(classSlug);
    // Sorts de la liste préparés au grimoire (même sort noté deux fois : préparé si l'une des deux l'est)
    const prepared = new Set();
    const others = [];
    list.forEach((row, index) => {
        if (isSpellRowEmpty(row) || !isPrepared(row) || granted?.has(spellNameKey(row.name))) return;
        const spell = findSpellByName(spells, row.name);
        if (spell && inList(spell)) prepared.add(spell);
        else others.push({ index, name: plainText(row.name).trim(), level: Number(rowLevel(row)) });
    });
    const groups = [];
    for (let level = 1; level <= Math.min(9, maxLevel); level++) {
        const items = spells
            .filter(spell => Number(spell?.level) === level && inList(spell))
            .map(spell => ({
                spell,
                name: spellDisplayName(spell),
                state: isGrantedSpell(spell, granted) ? 'granted' : prepared.has(spell) ? 'prepared' : 'unprepared'
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        if (items.length) groups.push({ level, items });
    }
    return { groups, others };
}

/** Lignes du grimoire qui portent ce sort de la base (nom français, variante ou anglais) */
function matchingIndices(rows, spell, db) {
    const indices = [];
    rows.forEach((row, index) => {
        if (!isSpellRowEmpty(row) && findSpellByName(db, row.name) === spell) indices.push(index);
    });
    return indices;
}

/**
 * Cocher un sort dans la fenêtre : la première ligne du grimoire qui le porte passe à prep: true ;
 * absent du grimoire, il y est ajouté (à la fin, rempli depuis la base comme l'auto-complétion :
 * note = nom anglais) et préparé. Ligne sans niveau (lvl vide ou « 0 », vieilles fiches v3) alors
 * que le sort de la base est de niveau 1+ : son niveau est complété depuis la base (c'est le geste
 * du joueur qui le demande), sinon elle resterait un sort mineur, jamais préparé.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Object} spell - sort de la base
 * @param {Array<Object>} db
 * @param {Object} emptySpell - EMPTY_SPELL (js/state/schema.js)
 * @returns {{ rows: Array<Object>, added: Object|null }} added : la ligne ajoutée, s'il y en a une
 */
export function prepareSpellRows(rows, spell, db, emptySpell) {
    const list = Array.isArray(rows) ? rows : [];
    const [first] = matchingIndices(list, spell, db);
    if (first !== undefined) {
        const level = Number(spell?.level);
        const missingLevel = rowLevel(list[first]) === '0' && Number.isInteger(level) && level >= 1 && level <= 9;
        if (list[first].prep === true && !missingLevel) return { rows: list, added: null };
        const next = list.slice();
        next[first] = { ...list[first], ...(missingLevel ? { lvl: String(level) } : {}), prep: true };
        return { rows: next, added: null };
    }
    const added = { ...spellToRow(spell, { ...emptySpell }), prep: true };
    return { rows: [...list, added], added };
}

/** Même ligne : mêmes clés, mêmes valeurs (une ligne du grimoire n'a que des valeurs simples) */
function sameRow(a, b) {
    if (!a || !b) return false;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every(key => Object.is(a[key], b[key]));
}

/**
 * Décocher un sort dans la fenêtre : toutes les lignes qui le portent passent à prep: false. Seule
 * exception : la ligne que la fenêtre a ajoutée pendant la même ouverture (added de
 * prepareSpellRows), restée exactement telle quelle, est retirée. Une ligne écrite ou annotée par
 * le joueur n'est jamais retirée.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Object} spell - sort de la base
 * @param {Array<Object>} db
 * @param {Object|null} [added] - ligne ajoutée par la fenêtre pour ce sort
 * @returns {Array<Object>} nouvelles lignes (les mêmes s'il n'y a rien à changer)
 */
export function unprepareSpellRows(rows, spell, db, added = null) {
    const list = Array.isArray(rows) ? rows : [];
    const indices = matchingIndices(list, spell, db);
    const removable = added ? indices.findLast(index => sameRow(list[index], added)) : undefined;
    if (removable !== undefined) return list.filter((_, index) => index !== removable);
    if (!indices.some(index => list[index].prep === true)) return list;
    return list.map((row, index) => (indices.includes(index) && row.prep === true ? { ...row, prep: false } : row));
}

/**
 * Lignes que le bouton « Retirer les sorts non préparés » peut retirer du grimoire. Seulement pour
 * une classe qui prépare parmi toute sa liste (Clerc, Druide, Paladin, Rôdeur) : jamais le
 * Magicien (ses sorts non préparés sont son livre) ni une classe à liste fixe.
 * Part : un sort non préparé de niveau 1+, reconnu dans la base, de la liste de la classe, noté à
 * son niveau, d'un niveau pour lequel la classe a des emplacements (la fenêtre « Préparer mes
 * sorts » le repropose donc). Ne part jamais : un sort préparé, un sort mineur, un sort donné
 * (toujours préparé), une ligne vide ou en cours de saisie, un sort inconnu de la base, d'une
 * autre liste (multiclassage, don, objet) ou d'un niveau sans emplacement (noté pour plus tard).
 * Ligne où le joueur a écrit une note à lui (autre que le nom anglais mis par la fiche) : rangée à
 * part (noted), à retirer seulement s'il le demande.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Array<Object>} db - base de sorts
 * @param {{ classSlug?: string, maxLevel?: number, granted?: Set<string>|null, skip?: number[] }} [options]
 *        maxLevel : highestSlotLevel ; granted : grantedSpellKeys ; skip : indices des lignes en
 *        cours de saisie
 * @returns {{ remove: Array<{ index: number, row: Object, name: string, level: number }>,
 *   noted: Array<{ index: number, row: Object, name: string, level: number, note: string }> }}
 *   rangées par niveau puis par nom ; row : la ligne telle qu'elle a été lue (removeSpellRows)
 */
export function unpreparedCleanup(rows, db, { classSlug = '', maxLevel = 0, granted = null, skip = [] } = {}) {
    const remove = [];
    const noted = [];
    if (!preparesFromClassList(classSlug) || !(maxLevel > 0)) return { remove, noted };
    const list = Array.isArray(rows) ? rows : [];
    const spells = Array.isArray(db) ? db : [];
    const skipped = new Set(skip);
    list.forEach((row, index) => {
        if (skipped.has(index) || !row || typeof row !== 'object' || isSpellRowEmpty(row) || row.prep === true) return;
        const level = Number(rowLevel(row));
        if (!(level >= 1) || level > maxLevel) return;
        const spell = findSpellByName(spells, row.name);
        if (!spell || Number(spell.level) !== level || !(spell.classes || []).includes(classSlug)) return;
        if (granted?.has(spellNameKey(row.name)) || isGrantedSpell(spell, granted)) return;
        const entry = { index, row, name: plainText(row.name), level };
        const note = plainText(row.note);
        const ownNote = note !== '' && ![...spellNames(spell), spell.vo].some(name => name && normalizeText(name).trim() === normalizeText(note).trim());
        if (ownNote) noted.push({ ...entry, note });
        else remove.push(entry);
    });
    const byLevelThenName = (a, b) => a.level - b.level || a.name.localeCompare(b.name, 'fr');
    return { remove: remove.sort(byLevelThenName), noted: noted.sort(byLevelThenName) };
}

/**
 * Retire du grimoire les lignes choisies (unpreparedCleanup). Tout ou rien : si une de ces lignes
 * n'est plus exactement celle qui a été montrée au joueur (fiche changée entre-temps :
 * synchronisation, autre onglet), rien n'est retiré.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Array<{ index: number, row: Object }>} entries
 * @returns {Array<Object>|null} nouvelles lignes ; null : la fiche a changé, rien n'est retiré
 */
export function removeSpellRows(rows, entries) {
    const list = Array.isArray(rows) ? rows : [];
    const picked = Array.isArray(entries) ? entries : [];
    if (!picked.every(entry => sameRow(list[entry.index], entry.row) && list[entry.index].prep !== true)) return null;
    const indices = new Set(picked.map(entry => entry.index));
    return list.filter((_, index) => !indices.has(index));
}

/**
 * Cocher ou décocher un « autre sort préparé » (ligne hors de la liste affichée) : seulement son
 * losange (prep), la ligne n'est jamais retirée.
 * @param {Array<Object>} rows
 * @param {number} index
 * @param {boolean} prepared
 * @returns {Array<Object>} nouvelles lignes (les mêmes s'il n'y a rien à changer)
 */
export function setRowPrepared(rows, index, prepared) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list[index] || (list[index].prep === true) === prepared) return list;
    const next = list.slice();
    next[index] = { ...list[index], prep: prepared };
    return next;
}

/**
 * Recherche par nom dans la fenêtre (accents et majuscules ignorés, nom français ou anglais).
 * @param {Object} spell - sort de la base
 * @param {string} query
 * @returns {boolean}
 */
export function matchesSpellQuery(spell, query) {
    const q = normalizeText(query).trim();
    if (!q) return true;
    return [...spellNames(spell), spell?.vo].some(name => normalizeText(name).includes(q));
}
