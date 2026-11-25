// =============================================================================
// SPELL-PREPARATION.JS (règles) - Sorts préparés du grimoire et lancement d'un sort
//
//  - Classes à liste fixe (PHB 2024, chap. 7, table « Spell Preparation by Class ») : le Barde,
//    l'Ensorceleur et l'Occultiste ne changent leur liste qu'en gagnant un niveau (un sort à la
//    fois) ; tous les sorts de niveau 1+ notés au grimoire sont donc préparés. Même règle pour le
//    Chevalier occulte et l'Arnaqueur arcanique (« Whenever you gain a Fighter / Rogue level, you
//    can replace one spell on your list »). Le Paladin et le Rôdeur changent un sort après chaque
//    repos long : leur losange reste à cocher, comme pour le Clerc, le Druide et le Magicien.
//    Sorts notés hors de cette liste fixe (Découvertes magiques du Collège du Savoir, rituels du
//    Pacte du grimoire, sorts des manifestations…) : losange à cocher comme avant, pour ne compter
//    que ceux qui sont préparés.
//  - Arcanum mystique (Occultiste 11+, PHB 2024 « Mystic Arcanum ») : un sort d'Occultiste de
//    niveau 6 (puis 7, 8, 9) lancé une fois par repos long sans emplacement. Ce n'est pas un sort
//    préparé de la table (Pact Magic : sorts de niveau 5 au plus) : la ligne qui le porte
//    (arcanumRows, la première notée à chaque niveau ; les suivantes restent ordinaires,
//    arcanumSpareRows) a un losange plein fixe, état 'arcanum', toujours disponible, hors du
//    compte des préparés, et se lance seulement par sa case « Arcanum mystique (niveau N) »
//    (aucun emplacement : ceux de pacte sont de niveau 5 au plus, et un emplacement de multiclasse
//    ne lance que des sorts préparés, PHB 2024 chap. 2 « Multiclassing », « Pact Magic »).
//  - État affiché du losange d'une ligne : calcul d'affichage, jamais écrit dans la fiche (la clé
//    v3 « prep » garde la valeur du joueur, qui reprend son sens s'il change de classe).
//  - Sorts donnés (classe, sous-classe, dons, espèce, sorts choisis d'une capacité : Maîtrise des
//    sorts et Sorts de prédilection du Magicien, Découvertes magiques du Collège du Savoir,
//    js/rules/spell-choices.js) : hors du compte de la table.
//  - Lancer un sort : niveaux d'emplacement possibles (niveau du sort et au-dessus, emplacements
//    de pacte compris) et emplacement coché.
//  - Paladin et Rôdeur : un seul sort préparé remplacé par repos long (replacesOneSpell). La
//    fenêtre « Préparer mes sorts » compare les sorts préparés à ceux de son ouverture
//    (preparedSpellNames, preparationSwap) et le dit en clair ; plus d'un sort retiré : simple
//    avertissement, rien n'est bloqué (premier remplissage, gain de niveau, erreur à corriger).
//    Rien n'est écrit dans la fiche pour ce suivi : d'une ouverture à l'autre, la fenêtre ne sait
//    pas si l'échange a déjà eu lieu. Elle ne dit « échange de ce repos long » qu'ouverte par le
//    rappel de fin de repos long ; ouverte par le bouton du grimoire, elle rappelle la règle.
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
//    emplacement), jamais un sort préparé, mineur ou donné ; en cas de doute, la ligne reste. Une
//    ligne où le joueur a écrit quelque chose à lui (note, colonne réécrite, case cochée en plus :
//    ownRowTexts) est rangée à part et ne part que s'il la coche.
// Fonctions pures.
// =============================================================================

import {
    rowLevel, spellNameKey, slotView, slotLevels, toggleSlotUsed, findSpellByName, spellToRow, spellNames,
    spellDisplayName, isPrepared, isSpellRowEmpty, normalizeText, plainText
} from './spells.js';
import { classGrantedSpells } from './class-progression.js';
import { featSpellGroups } from './feat-spells.js';
import { subclassSpells } from './subclass-features.js';
import { speciesSpellNames } from './species.js';
import { chosenSpellKeys } from './spell-choices.js';

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
 * magiques et ne comptent pas ; tant qu'elles ne sont pas choisies dans les menus du grimoire
 * (js/rules/spell-choices.js), on ne peut pas les distinguer : ses sorts hors de la liste du
 * Barde restent donc à cocher (choisies, elles sont des sorts donnés : grantedSpellKeys).
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
 * Sorts donnés à la fiche sans choix dans le grimoire : toujours préparés par la classe, sorts de
 * sous-classe atteints, sorts de dons et d'espèce. Chaque sort est reconnu sous son nom français
 * et sous son nom anglais (ligne « Divine Smite » d'une fiche venue de la v3). Cercle de la Terre
 * sans terrain choisi : aucun terrain n'est préparé, ses sorts restent des sorts de Druide
 * ordinaires.
 * Sans les sorts choisis d'une capacité (Maîtrise des sorts, Sorts de prédilection, Découvertes
 * magiques) : les menus du Magicien s'en servent pour écarter ce qui n'est pas dans le livre
 * (spellChoiceView de js/rules/spell-choices.js).
 * @param {Object} character
 * @param {Object} derived - deriveCharacter()
 * @returns {Set<string>} noms comparables (spellNameKey)
 */
export function givenSpellKeys(character, derived) {
    const names = [];
    for (const spell of derived.classSlug ? classGrantedSpells(derived.classSlug, derived.level) : []) {
        names.push(spell.name, spell.vo);
    }
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
    return new Set(names.filter(Boolean).map(spellNameKey).filter(Boolean));
}

/**
 * Sorts déjà donnés à la fiche (givenSpellKeys : classe, sous-classe, dons, espèce ; et sorts
 * choisis d'une capacité : Maîtrise des sorts, Sorts de prédilection, Découvertes magiques) :
 * notés aussi au grimoire, ils sont toujours préparés et ne comptent pas dans la table de la classe.
 * @param {Object} character
 * @param {Object} derived - deriveCharacter()
 * @param {Array<Object>|null} [db] - base de sorts : un sort choisi est enregistré sous son nom
 *        anglais, la base donne son nom français (celui de la ligne du grimoire) ; absente (base
 *        pas encore chargée) : seul le nom enregistré est reconnu
 * @returns {Set<string>} noms comparables (spellNameKey)
 */
export function grantedSpellKeys(character, derived, db = null) {
    return new Set([...givenSpellKeys(character, derived), ...chosenSpellKeys(character, derived, db)]);
}

/**
 * État du losange d'une ligne du grimoire :
 *  - 'cantrip'    : sort mineur, toujours disponible (∞) ;
 *  - 'granted'    : donné par la classe, la sous-classe, un don ou l'espèce (toujours préparé, hors du compte) ;
 *  - 'arcanum'    : sort d'Arcanum mystique de l'Occultiste (arcanumRows) : toujours disponible,
 *    hors du compte, lancé seulement par sa case d'Arcanum (losange plein fixe, « prep » ignoré) ;
 *  - 'list'       : classe à liste fixe (toujours préparé, compté) ;
 *  - 'prepared' / 'unprepared' : losange coché ou non par le joueur (aussi, dans une classe à
 *    liste fixe, pour un sort hors de cette liste : voir fitsWholeList) ;
 *  - 'ritual'     : non préparé, mais lançable en rituel depuis le livre (Savoir rituel du
 *    Magicien : js/rules/spellbook.js) ; losange à cocher comme 'unprepared'.
 * @param {Object} row - ligne de dynamic_spells
 * @param {{ wholeList?: boolean, granted?: Set<string>|null, fits?: ((row: Object) => boolean)|null,
 *   bookRitual?: ((row: Object) => boolean)|null, arcanum?: boolean }} [options]
 *        fits : le sort fait-il partie de la liste fixe (fitsWholeList) ? Absent : oui ;
 *        bookRitual : le sort non préparé se lance-t-il en rituel depuis le livre ? Absent : non ;
 *        arcanum : la ligne est-elle un sort d'Arcanum mystique (arcanumRows) ? Absent : non
 * @returns {'cantrip'|'granted'|'arcanum'|'list'|'prepared'|'unprepared'|'ritual'}
 */
export function spellPrepState(row, { wholeList = false, granted = null, fits = null, bookRitual = null, arcanum = false } = {}) {
    if (rowLevel(row) === '0') return 'cantrip';
    if (granted?.has(spellNameKey(row?.name))) return 'granted';
    if (arcanum === true) return 'arcanum';
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
 * Arcanum mystique, par sa case ; rituel du livre non préparé, seulement en rituel (isRitualOnly)
 */
export function isCastable(state) {
    return state === 'prepared' || state === 'list' || state === 'granted' || state === 'arcanum' || state === 'ritual';
}

/** Sort qui ne peut se lancer qu'en rituel (rituel du livre non préparé) */
export function isRitualOnly(state) {
    return state === 'ritual';
}

/**
 * Façons de lancer une ligne du grimoire (fenêtre « Lancer ») : avec un emplacement si le sort
 * est préparé (même d'office), en rituel s'il est rituel (case R ou base de sorts : isRitualSpell
 * de js/rules/spellbook.js), quel que soit l'état du losange ; un rituel du livre non préparé
 * (Savoir rituel) se lance seulement en rituel. Arcanum mystique : jamais avec un emplacement
 * (seulement par sa case, arcanum : true ; voir arcanumRows).
 * @param {string} state - spellPrepState()
 * @param {boolean} ritual - le sort est-il rituel ?
 * @returns {{ slots: boolean, ritual: boolean, ritualOnly: boolean, arcanum: boolean }}
 */
export function castModes(state, ritual) {
    if (!isCastable(state)) return { slots: false, ritual: false, ritualOnly: false, arcanum: false };
    const ritualOnly = isRitualOnly(state);
    const arcanum = state === 'arcanum';
    return { slots: !ritualOnly && !arcanum, ritual: ritualOnly || ritual === true, ritualOnly, arcanum };
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
 * Ce niveau de sort est-il couvert par l'Arcanum mystique (niveau 6 au plus haut niveau d'Arcanum) ?
 * @param {number|string} spellLevel
 * @param {number} arcanumLevel - mysticArcanumLevel()
 * @returns {boolean}
 */
export function isArcanumSpellLevel(spellLevel, arcanumLevel) {
    const level = Number(spellLevel);
    return level >= 6 && level <= arcanumLevel;
}

/**
 * Lignes candidates à l'Arcanum mystique (Occultiste 11+), dans l'ordre de la fiche : sort nommé,
 * noté à un niveau d'Arcanum atteint (isArcanumSpellLevel), de la liste de l'Occultiste et de ce
 * niveau dans la base (sort absent de la base : on fait confiance au joueur, comme fitsWholeList),
 * qui n'est pas un sort donné.
 * @returns {Map<number, number[]>} niveau de sort → indices des lignes, dans l'ordre noté
 */
function arcanumCandidates(rows, derived, db, granted) {
    const byLevel = new Map();
    const top = mysticArcanumLevel(derived?.classSlug, derived?.level);
    if (!top) return byLevel;
    const spells = Array.isArray(db) ? db : [];
    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
        if (!row || typeof row !== 'object' || isSpellRowEmpty(row) || !plainText(row.name).trim()) return;
        const level = Number(rowLevel(row));
        if (!isArcanumSpellLevel(level, top) || granted?.has(spellNameKey(row.name))) return;
        const spell = findSpellByName(spells, row.name);
        if (spell && (Number(spell.level) !== level || !(spell.classes || []).includes('warlock'))) return;
        if (!byLevel.has(level)) byLevel.set(level, []);
        byLevel.get(level).push(index);
    });
    return byLevel;
}

/**
 * Lignes du grimoire qui portent un sort d'Arcanum mystique (Occultiste 11+, arcanumCandidates).
 * Une seule par niveau de sort (un arcanum par niveau) : la première notée, quel que soit son
 * losange (le losange d'une ligne d'Arcanum est fixe, il ne peut donc pas servir à choisir : le
 * choix ne pourrait pas s'annuler). Les autres lignes de ce niveau restent des sorts ordinaires
 * (losange à cocher, arcanumSpareRows) : pour remplacer son Arcanum (PHB 2024, en gagnant un
 * niveau d'Occultiste), le joueur renomme la ligne ou supprime l'ancienne.
 * Calcul d'affichage : rien n'est écrit dans la fiche.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {{ classSlug?: string, level?: number }} derived - deriveCharacter()
 * @param {Array<Object>|null} [db] - base de sorts (absente : tout sort nommé est accepté)
 * @param {Set<string>|null} [granted] - grantedSpellKeys()
 * @returns {Set<number>} indices des lignes d'Arcanum dans dynamic_spells
 */
export function arcanumRows(rows, derived, db = null, granted = null) {
    const picked = new Set();
    for (const indices of arcanumCandidates(rows, derived, db, granted).values()) picked.add(indices[0]);
    return picked;
}

/**
 * Lignes en trop d'un niveau d'Arcanum : sort de l'Occultiste noté au même niveau qu'un Arcanum
 * déjà retenu (arcanumRows). Elles restent des sorts ordinaires ; leur losange le dit
 * (arcanumSpareText).
 * @param {Array<Object>} rows - dynamic_spells
 * @param {{ classSlug?: string, level?: number }} derived - deriveCharacter()
 * @param {Array<Object>|null} [db] - base de sorts
 * @param {Set<string>|null} [granted] - grantedSpellKeys()
 * @returns {Map<number, number>} indice de la ligne en trop → indice de la ligne d'Arcanum de son niveau
 */
export function arcanumSpareRows(rows, derived, db = null, granted = null) {
    const spares = new Map();
    for (const [first, ...others] of arcanumCandidates(rows, derived, db, granted).values()) {
        for (const index of others) spares.set(index, first);
    }
    return spares;
}

/**
 * Infobulle du losange d'une ligne en trop d'un niveau d'Arcanum (arcanumSpareRows), reprise dans la
 * barre du haut au toucher (courte, comme PREP_HELP de js/ui/spells/rows.js)
 * @param {number|string} level - niveau du sort
 * @param {string} arcanumName - nom du sort retenu comme Arcanum de ce niveau
 */
export function arcanumSpareText(level, arcanumName) {
    const name = plainText(arcanumName).trim();
    return `Arcanum de niveau ${level} : déjà ${name ? `« ${name} »` : 'un autre sort'}. Celui-ci ne se lance pas (aucun emplacement de ce niveau) ; pour changer d'Arcanum, supprimez l'ancien.`;
}

/**
 * Phrase de la fenêtre « Lancer » pour un sort d'Arcanum mystique sans emplacement de son niveau :
 * il se lance une fois sans emplacement, de nouveau après un repos long (PHB 2024, « Mystic
 * Arcanum »). Le lancer est suivi par la case « Arcanum mystique (niveau N) » (CLASS_COUNTERS de
 * js/rules/subclass-uses.js), que le bouton « Lancer gratuit » coche (js/rules/free-casts.js).
 */
export function arcanumCastText(level) {
    return `Arcanum mystique : votre sort d'Arcanum de niveau ${level} se lance une fois sans emplacement, puis de nouveau après un repos long. Sa case « Arcanum mystique (niveau ${level}) » se coche (grimoire, « Sorts de classe », et onglet Combat).`;
}

/**
 * Sort préparé (losange coché ou fixe) d'un niveau plus haut que le plus haut emplacement : il ne
 * peut pas être lancé. Simple avertissement : rien n'est décoché.
 * Jamais pour un sort mineur, un sort non préparé (même un rituel du livre, lancé en rituel), un
 * sort qui a son propre lancer gratuit (don, espèce…), la ligne d'Arcanum mystique (état 'arcanum' :
 * un autre sort coché du même niveau est bien signalé, il ne se lance pas), ni pour un personnage
 * sans aucun emplacement (la fiche ne sait pas d'où il tient ses sorts : objet, don noté à la main).
 * @param {Object} row - ligne de dynamic_spells
 * @param {string} state - spellPrepState()
 * @param {{ topSlot?: number, freeCast?: boolean }} [options]
 *        topSlot : highestUsableSlot() ;
 *        freeCast : le sort a un lancer gratuit suivi par la fiche (js/rules/free-casts.js)
 * @returns {number} niveau du sort à signaler, ou 0
 */
export function missingSlotLevel(row, state, { topSlot = 0, freeCast = false } = {}) {
    if (state !== 'prepared' && state !== 'list' && state !== 'granted') return 0;
    const level = Number(rowLevel(row));
    if (!(level >= 1) || !(topSlot > 0) || level <= topSlot) return 0;
    if (freeCast) return 0;
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
        ? { text: 'Vous pouvez remplacer un seul de vos sorts préparés par un autre sort de votre liste de classe (un échange par repos long).', window: true }
        : { text: 'Vous pouvez changer vos sorts préparés : autant que vous voulez, parmi toute la liste de votre classe.', window: true };
}

/**
 * La classe ne remplace-t-elle qu'un seul sort préparé après un repos long (Paladin, Rôdeur :
 * PHB 2024, « Changing Your Prepared Spells ») ? Le Clerc et le Druide en changent autant qu'ils
 * veulent ; les classes à liste fixe ne changent rien au repos long.
 * @param {string} classSlug
 * @returns {boolean}
 */
export function replacesOneSpell(classSlug) {
    const rule = SPELL_PREPARATION[classSlug];
    return Boolean(rule && rule.change === 'long_rest' && rule.count === 'one');
}

/**
 * Sorts préparés comptés dans la table de la classe : lignes de niveau 1 et plus au losange coché,
 * hors sorts donnés (toujours préparés). Un sort noté deux fois ne compte qu'une fois.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Set<string>|null} [granted] - grantedSpellKeys()
 * @returns {Map<string, string>} nom comparable (spellNameKey) → nom noté au grimoire
 */
export function preparedSpellNames(rows, granted = null) {
    const names = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
        if (!row || typeof row !== 'object' || isSpellRowEmpty(row) || !isPrepared(row)) continue;
        const key = spellNameKey(row.name);
        if (!key || granted?.has(key) || names.has(key)) continue;
        names.set(key, plainText(row.name).replace(/\s+/g, ' ').trim());
    }
    return names;
}

/**
 * Suivi de la règle « un seul sort remplacé par repos long » (Paladin, Rôdeur) : ce qui a changé
 * dans les sorts préparés depuis l'ouverture de la fenêtre « Préparer mes sorts », dit en une
 * phrase. Un sort retiré puis recoché ne compte pas. Ajouter des sorts sans en retirer est normal
 * (premier remplissage, gain de niveau : la liste se complète jusqu'au nombre de la table).
 * L'échange n'est permis qu'à la fin d'un repos long, et la fiche ne retient pas d'une ouverture à
 * l'autre s'il a déjà eu lieu : la phrase ne parle de « l'échange de ce repos long » que si la
 * fenêtre est ouverte par le rappel de fin de repos long (afterLongRest) ; ouverte par le bouton
 * du grimoire, elle rappelle que l'échange se fait à la fin d'un repos long, une seule fois.
 * @param {Map<string, string>} before - preparedSpellNames() à l'ouverture de la fenêtre
 * @param {Map<string, string>} after - preparedSpellNames() maintenant
 * @param {{ afterLongRest?: boolean }} [options] - fenêtre ouverte par le rappel de fin de repos long
 * @returns {{ removed: string[], added: string[], over: boolean, text: string }}
 *   removed / added : noms des sorts retirés et ajoutés ; over : plus d'un sort retiré, ce que la
 *   règle ne permet pas (simple avertissement : la fiche ne bloque et n'annule rien)
 */
export function preparationSwap(before, after, options = null) {
    // Seul un vrai « true » compte : sans option (ou option abîmée), la phrase prudente
    const afterLongRest = options?.afterLongRest === true;
    const from = before instanceof Map ? before : new Map();
    const to = after instanceof Map ? after : new Map();
    const removed = [...from].filter(([key]) => !to.has(key)).map(([, name]) => name);
    const added = [...to].filter(([key]) => !from.has(key)).map(([, name]) => name);
    const quote = (names) => names.map(name => `« ${name} »`).join(', ');
    const over = removed.length > 1;
    // Devant un échange : celui de ce repos long, ou simple rappel de la règle hors du repos long
    const swap = afterLongRest ? 'Échange de ce repos long' : "Échange (permis une seule fois, à la fin d'un repos long)";
    let text;
    if (over) {
        text = `Attention : ${removed.length} sorts retirés (${quote(removed)}). La règle ne permet d'en remplacer qu'un seul par repos long : recochez ceux que vous gardez.`;
    } else if (removed.length === 1 && added.length === 0) {
        text = `${quote(removed)} retiré : cochez le sort qui le remplace.${afterLongRest ? '' : " Rappel : cet échange se fait à la fin d'un repos long, une seule fois."}`;
    } else if (removed.length === 1 && added.length === 1) {
        text = `${swap} : ${quote(removed)} remplacé par ${quote(added)}.`;
    } else if (removed.length === 1) {
        text = `${swap} : ${quote(removed)} retiré. Ajoutés : ${quote(added)} (un seul le remplace ; les autres complètent votre liste, après un gain de niveau).`;
    } else if (added.length) {
        text = `Aucun sort retiré. ${added.length > 1 ? 'Ajoutés' : 'Ajouté'} : ${quote(added)} (vous complétez votre liste : premier choix ou gain de niveau).`;
    } else {
        text = afterLongRest
            ? "Un seul échange par repos long : aucun sort remplacé pour l'instant."
            : "Un seul échange est permis, à la fin d'un repos long : aucun sort remplacé pour l'instant.";
    }
    return { removed, added, over, text };
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

/** Texte comparable d'une colonne : accents, majuscules, espaces et ponctuation ignorés */
const looseText = (value) => normalizeText(value).replace(/[^a-z0-9]+/g, '');

/** Colonnes de texte et cases d'une ligne remplies par la fiche depuis la base (spellToRow) */
const ROW_TEXT_COLUMNS = Object.freeze([['school', 'école'], ['time', "temps d'incantation"], ['range', 'portée']]);
const ROW_FLAG_COLUMNS = Object.freeze([['c', 'C'], ['r', 'R'], ['m', 'M']]);

/**
 * Ce que le joueur a écrit lui-même sur une ligne du grimoire, par rapport à ce que la fiche y met
 * depuis la base (spellToRow) : note autre que le nom du sort, texte d'une colonne différent de la
 * base, case C / R / M cochée en plus. Une colonne vide ou une case décochée n'est pas un texte du
 * joueur (rien à perdre) ; une vieille ligne écrite à la main dans un autre format que la base est
 * comptée comme écrite par le joueur (dans le doute, la ligne reste).
 * @param {Object} row - ligne de dynamic_spells
 * @param {Object} spell - le sort de la base que porte cette ligne
 * @returns {Array<{ key: string, text: string }> & { note: string }} tableau vide : ligne telle que
 *          la fiche la remplit ; note : la note du joueur en clair ('' si elle n'est pas de lui)
 */
export function ownRowTexts(row, spell) {
    const base = spellToRow(spell);
    const written = [];
    const note = plainText(row?.note);
    const ownNote = note !== '' && ![...spellNames(spell), spell?.vo].some(name => name && looseText(name) === looseText(note));
    if (ownNote) written.push({ key: 'note', text: `note « ${note} »` });
    for (const [key, label] of ROW_TEXT_COLUMNS) {
        const text = plainText(row?.[key]);
        if (text !== '' && looseText(text) !== looseText(base[key])) written.push({ key, text: `${label} « ${text} »` });
    }
    for (const [key, label] of ROW_FLAG_COLUMNS) {
        if (row?.[key] === true && base[key] !== true) written.push({ key, text: `case ${label} cochée` });
    }
    written.note = ownNote ? note : '';
    return written;
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
 * Ligne où le joueur a écrit quelque chose à lui : rangée à part (noted), à retirer seulement s'il
 * le demande. Compte comme écrit par le joueur (ownRowTexts) : une note autre que le nom du sort
 * mis par la fiche ; un texte d'École, de Temps d'incantation ou de Portée qui n'est pas celui de
 * la base ; une case C, R ou M cochée alors que la base ne la coche pas. Une colonne vide ou une
 * case décochée ne contient rien à perdre.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Array<Object>} db - base de sorts
 * @param {{ classSlug?: string, maxLevel?: number, granted?: Set<string>|null, skip?: number[] }} [options]
 *        maxLevel : highestSlotLevel ; granted : grantedSpellKeys ; skip : indices des lignes en
 *        cours de saisie
 * @returns {{ remove: Array<{ index: number, row: Object, name: string, level: number }>,
 *   noted: Array<{ index: number, row: Object, name: string, level: number, note: string, written: string[] }> }}
 *   rangées par niveau puis par nom ; row : la ligne telle qu'elle a été lue (removeSpellRows) ;
 *   note : la note du joueur ('' s'il n'a changé que d'autres colonnes) ; written : ce qu'il a
 *   écrit, colonne par colonne, prêt à afficher (« portée « 18 m, à déplacer » », « case C cochée »)
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
        const written = ownRowTexts(row, spell);
        if (written.length) noted.push({ ...entry, note: written.note, written: written.map(item => item.text) });
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
