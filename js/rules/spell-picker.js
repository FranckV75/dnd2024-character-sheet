// =============================================================================
// SPELL-PICKER.JS - Liste des sorts à parcourir depuis la case du nom (grimoire)
//
// Toucher la case du nom vide (ou son bouton ▾) ouvre la liste des sorts de la liste choisie
// (menu « Liste de sorts », par défaut la classe du personnage) :
//  - rangée par niveau (« Sorts mineurs », « Niveau 1 »…), ordre alphabétique dans chaque niveau ;
//  - limitée aux sorts mineurs et aux niveaux pour lesquels le personnage a des emplacements
//    (plus haut niveau de la table de la classe, Magie de pacte comprise) ; classe inconnue ou
//    sans emplacement : pas de limite ;
//  - un niveau choisi (menu Niv. de la ligne, pastille de niveau du grimoire) : ce niveau seul ;
//  - les sorts déjà notés au grimoire restent visibles, marqués (non sélectionnables) ;
//  - la saisie resserre la liste (accents, nom anglais, comme la recherche du nom).
// Fonctions pures.
// =============================================================================

import { findSpellByName, spellDisplayName, isSpellRowEmpty, SPELL_LEVELS } from './spells.js';
import { highestSlotLevel, matchesSpellQuery } from './spell-preparation.js';

/**
 * Plus haut niveau de sort proposé par la liste, d'après les emplacements de la classe.
 * @param {string} classSlug - classe du personnage (deriveCharacter().classSlug)
 * @param {Object} spellSlots - deriveCharacter().spellSlots (Magie de pacte comprise)
 * @returns {number|null} null : pas de limite (classe inconnue, ou aucun emplacement)
 */
export function pickerMaxLevel(classSlug, spellSlots) {
    if (!classSlug) return null;
    const highest = highestSlotLevel(spellSlots);
    return highest > 0 ? highest : null;
}

/**
 * Intertitre d'un niveau de la liste.
 * @param {number} level
 * @returns {string} « Sorts mineurs » ou « Niveau 3 »
 */
export function pickerLevelTitle(level) {
    return Number(level) <= 0 ? 'Sorts mineurs' : `Niveau ${Number(level)}`;
}

/**
 * Sorts de la base déjà notés au grimoire (nom français, variante ou nom anglais).
 * @param {Array<Object>} rows - dynamic_spells
 * @param {Array<Object>} db - base de sorts
 * @returns {Set<Object>}
 */
export function notedSpells(rows, db) {
    const noted = new Set();
    for (const row of Array.isArray(rows) ? rows : []) {
        if (isSpellRowEmpty(row)) continue;
        const spell = findSpellByName(db, row.name);
        if (spell) noted.add(spell);
    }
    return noted;
}

/**
 * Contenu de la liste, groupé par niveau.
 * @param {Array<Object>} db - base de sorts (data/spells.json)
 * @param {{ classSlug?: string, level?: string, maxLevel?: number|null, query?: string, rows?: Array<Object> }} [options]
 *        classSlug : liste de sorts (effectiveSpellClass ; '' = toutes) ;
 *        level : niveau choisi ('0' à '9', '' = tous les niveaux permis) — un niveau choisi est
 *        montré même au-delà de maxLevel (c'est le geste du joueur) ;
 *        maxLevel : pickerMaxLevel (null = pas de limite) ; query : saisie ; rows : dynamic_spells
 * @returns {Array<{ level: number, title: string, items: Array<{ spell: Object, name: string, noted: boolean }> }>}
 */
export function spellPickerGroups(db, { classSlug = '', level = '', maxLevel = null, query = '', rows = [] } = {}) {
    const spells = Array.isArray(db) ? db : [];
    const chosen = SPELL_LEVELS.includes(String(level)) ? Number(level) : null;
    const noted = notedSpells(rows, spells);
    const byLevel = new Map();
    for (const spell of spells) {
        if (!spell) continue;
        const spellLevel = Number(spell.level);
        if (!Number.isInteger(spellLevel) || spellLevel < 0 || spellLevel > 9) continue;
        if (chosen !== null ? spellLevel !== chosen : maxLevel !== null && spellLevel > maxLevel) continue;
        if (classSlug && !(spell.classes || []).includes(classSlug)) continue;
        if (!matchesSpellQuery(spell, query)) continue;
        if (!byLevel.has(spellLevel)) byLevel.set(spellLevel, []);
        byLevel.get(spellLevel).push({ spell, name: spellDisplayName(spell), noted: noted.has(spell) });
    }
    return [...byLevel.keys()].sort((a, b) => a - b).map(spellLevel => ({
        level: spellLevel,
        title: pickerLevelTitle(spellLevel),
        items: byLevel.get(spellLevel).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }));
}
