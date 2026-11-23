// =============================================================================
// SPELLBOOK.JS (règles) - Livre de sorts du Magicien (PHB 2024, p. 165-167)
//
//  - Sorts du livre sans dépense : 6 sorts de Magicien du 1er niveau au départ, puis 2 de plus à
//    chaque niveau de Magicien gagné. Abjurateur, Devin, Évocateur, Illusionniste (aptitude
//    « érudit » du niveau 3) : 2 sorts de l'école gratuits au niveau 3, puis 1 à chaque nouveau
//    niveau d'emplacements (niveaux 5, 7, 9… 17 du Magicien). Les sorts copiés (trouvés, achetés)
//    s'y ajoutent sans limite : le nombre attendu est un simple repère, jamais une erreur.
//  - Livre noté : sorts de niveau 1 et plus du grimoire de la fiche, hors sorts donnés (sorts de
//    sous-classe toujours préparés, dons, espèce), qui ne sont pas dans le livre. Les sorts mineurs
//    ne vont jamais dans le livre. Les sorts de Maîtrise des sorts et les Sorts de prédilection
//    (js/rules/spell-choices.js) sont toujours préparés mais restent des sorts du livre.
//  - Copier un sort trouvé : 2 heures et 50 po par niveau du sort ; copie de secours de son propre
//    livre : 1 heure et 10 po par niveau. Philosophe de l'Académie (Odyssée), école Cynisme : temps
//    et argent de la copie divisés par deux.
//  - Savoir rituel (niveau 1) : un sort rituel du livre se lance en rituel sans être préparé.
// Fonctions pures.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { rowLevel, isSpellRowEmpty, spellNameKey } from './spells.js';
import { SPELL_PREPARATION } from './spell-preparation.js';
import { philosopherSchools } from './subclass-choices.js';

/** Sorts du 1er niveau dans le livre au niveau 1 */
export const SPELLBOOK_START = 6;
/** Sorts ajoutés au livre à chaque niveau de Magicien gagné après le 1er */
export const SPELLBOOK_PER_LEVEL = 2;
/** Sous-classes « érudites » (Abjuration / Divination / Evocation / Illusion Savant) et leur nom */
export const SAVANT_SUBCLASSES = Object.freeze({
    abjurer: 'Abjurateur érudit',
    diviner: 'Devin érudit',
    evoker: 'Évocateur érudit',
    illusionist: 'Illusionniste érudit'
});
/** Niveau de Magicien de l'aptitude « érudit » */
const SAVANT_LEVEL = 3;
/** Sorts de l'école ajoutés au niveau 3 par l'aptitude « érudit » */
const SAVANT_START = 2;

/**
 * La classe prépare-t-elle ses sorts depuis un livre de sorts (le Magicien) ?
 * @param {string} classSlug
 * @returns {boolean}
 */
export function hasSpellbook(classSlug) {
    return SPELL_PREPARATION[classSlug]?.from === 'spellbook';
}

/** Plus haut niveau d'emplacement d'un lanceur complet à ce niveau de classe */
function fullCasterTopSlot(level) {
    const row = DD_RULES.spellSlots.full[level] || [];
    return row.reduce((top, count, i) => (count > 0 ? i + 1 : top), 0);
}

/**
 * Sorts du livre obtenus sans dépense au niveau donné.
 * @param {number} level - niveau de Magicien (1 à 20)
 * @param {string} [subclass] - deriveCharacter().subclass
 * @returns {{ start: number, byLevel: number, savant: number, savantName: string, total: number }}
 *          start : sorts de départ ; byLevel : ajouts des niveaux gagnés ; savant : sorts gratuits
 *          de l'aptitude « érudit » (0 sans elle) ; total : somme
 */
export function freeSpellbookSpells(level, subclass = '') {
    const lvl = Math.max(1, Math.min(20, Math.trunc(Number(level)) || 1));
    const byLevel = SPELLBOOK_PER_LEVEL * (lvl - 1);
    const savantName = Object.hasOwn(SAVANT_SUBCLASSES, subclass) ? SAVANT_SUBCLASSES[subclass] : '';
    let savant = 0;
    if (savantName && lvl >= SAVANT_LEVEL) {
        savant = SAVANT_START;
        // Un sort de plus à chaque nouveau niveau d'emplacements gagné après le niveau 3
        for (let l = SAVANT_LEVEL + 1; l <= lvl; l++) {
            if (fullCasterTopSlot(l) > fullCasterTopSlot(l - 1)) savant++;
        }
    }
    return { start: SPELLBOOK_START, byLevel, savant, savantName, total: SPELLBOOK_START + byLevel + savant };
}

/**
 * Sorts du livre notés au grimoire : lignes de niveau 1 et plus, hors sorts donnés.
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Set<string>|null} [granted] - grantedSpellKeys()
 * @param {Set<string>|null} [inBook] - sorts donnés qui sont quand même dans le livre (Maîtrise
 *        des sorts, Sorts de prédilection : chosenSpellKeys(…, { from: 'book' }))
 * @returns {number}
 */
export function spellbookCount(rows, granted = null, inBook = null) {
    let count = 0;
    for (const row of Array.isArray(rows) ? rows : []) {
        if (isSpellRowEmpty(row) || rowLevel(row) === '0') continue;
        const key = spellNameKey(row.name);
        if (granted?.has(key) && !inBook?.has(key)) continue;
        count++;
    }
    return count;
}

/**
 * Copie de sorts dans le livre (par niveau du sort).
 * @param {{ subclass?: string, subclassChoices?: Object }} [derived] - deriveCharacter()
 * @returns {{ copy: { hours: number, gold: number }, backup: { hours: number, gold: number }, halved: boolean }}
 *          copy : sort trouvé ou acheté ; backup : copie de secours d'un sort de son livre ;
 *          halved : école Cynisme (temps et argent de la copie divisés par deux)
 */
export function spellCopyCost(derived = {}) {
    const halved = philosopherSchools(derived).includes('cynisme');
    return {
        copy: halved ? { hours: 1, gold: 25 } : { hours: 2, gold: 50 },
        backup: { hours: 1, gold: 10 },
        halved
    };
}

/**
 * Savoir rituel : la classe lance en rituel, sans le préparer, un sort rituel de son livre.
 * @param {string} classSlug
 * @returns {boolean}
 */
export function castsRitualsFromBook(classSlug) {
    return hasSpellbook(classSlug);
}

/**
 * Sort rituel : case R cochée, ou étiquette Rituel dans la base de sorts.
 * @param {Object} row - ligne de dynamic_spells
 * @param {Object|null} [spell] - sort de la base (findSpellByName)
 * @returns {boolean}
 */
export function isRitualSpell(row, spell = null) {
    return row?.r === true || spell?.ritual === true;
}
