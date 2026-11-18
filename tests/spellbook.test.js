/**
 * TESTS — LIVRE DE SORTS DU MAGICIEN (js/rules/spellbook.js) ET SAVOIR RITUEL
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    hasSpellbook, freeSpellbookSpells, spellbookCount, spellCopyCost, castsRitualsFromBook, isRitualSpell,
    SPELLBOOK_START, SPELLBOOK_PER_LEVEL
} from '../js/rules/spellbook.js';
import { spellPrepState, inCombatView, isCastable, isRitualOnly, castModes, grantedSpellKeys } from '../js/rules/spell-preparation.js';
import { spellCounts, spellNameKey, findSpellByName } from '../js/rules/spells.js';
import { deriveCharacter } from '../js/rules/character.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const db = Array.isArray(base) ? base : Object.values(base);

describe('Livre de sorts : sorts obtenus sans dépense (PHB 2024 p. 165-166)', () => {
    test('Seul le Magicien a un livre de sorts', () => {
        assert.equal(hasSpellbook('wizard'), true);
        for (const slug of ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'fighter', '']) {
            assert.equal(hasSpellbook(slug), false, slug);
        }
    });

    test('6 sorts au départ, puis 2 par niveau gagné', () => {
        assert.equal(SPELLBOOK_START, 6);
        assert.equal(SPELLBOOK_PER_LEVEL, 2);
        assert.deepEqual(freeSpellbookSpells(1), { start: 6, byLevel: 0, savant: 0, savantName: '', total: 6 });
        assert.equal(freeSpellbookSpells(2).total, 8);
        assert.equal(freeSpellbookSpells(5).total, 14);
        assert.equal(freeSpellbookSpells(20).total, 44);
        // Valeurs hors bornes ou illisibles : niveau 1 à 20
        assert.equal(freeSpellbookSpells(0).total, 6);
        assert.equal(freeSpellbookSpells('abc').total, 6);
        assert.equal(freeSpellbookSpells(25).total, 44);
    });

    test('Érudit (Abjurateur, Devin, Évocateur, Illusionniste) : 2 au niveau 3, puis 1 par nouveau niveau d\'emplacements', () => {
        for (const subclass of ['abjurer', 'diviner', 'evoker', 'illusionist']) {
            assert.equal(freeSpellbookSpells(2, subclass).savant, 0, subclass);
            assert.equal(freeSpellbookSpells(3, subclass).savant, 2, subclass);
        }
        // Nouveaux niveaux d'emplacements du lanceur complet : 3e au niveau 5, 4e au 7… 9e au 17
        const savant = [3, 4, 5, 6, 7, 9, 11, 13, 15, 17, 18, 20].map(level => freeSpellbookSpells(level, 'abjurer').savant);
        assert.deepEqual(savant, [2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 9, 9]);
        const abjurer5 = freeSpellbookSpells(5, 'abjurer');
        assert.deepEqual(abjurer5, { start: 6, byLevel: 8, savant: 3, savantName: 'Abjurateur érudit', total: 17 });
        // Philosophe de l'Académie (Odyssée) : pas d'aptitude « érudit »
        assert.equal(freeSpellbookSpells(5, 'academy_philosopher').savant, 0);
    });

    test('Sorts notés au livre : niveau 1 et plus, hors sorts mineurs, lignes vides et sorts donnés', () => {
        const rows = [
            { lvl: '0', name: 'Trait de feu' },
            { lvl: '1', name: 'Bouclier', prep: true },
            { lvl: '1', name: 'Alarme', r: true },
            { lvl: '3', name: 'Contresort' },
            { lvl: '', name: '', time: '', range: '' },
            { lvl: '2', name: '', time: '', range: '', note: 'à copier' }
        ];
        assert.equal(spellbookCount(rows), 3);
        // Briseur de sorts (Abjurateur 10) : Contresort toujours préparé, pas dans le livre
        assert.equal(spellbookCount(rows, new Set([spellNameKey('Contresort')])), 2);
        assert.equal(spellbookCount(null), 0);
    });

    test('Fiche réelle : un Abjurateur de niveau 10 ne compte pas ses sorts de Briseur de sorts', () => {
        const record = { ...createDefaultCharacter(), char_class: 'Magicien', char_subclass: 'Abjurateur', char_level: '10' };
        const derived = deriveCharacter(record);
        const rows = [{ lvl: '3', name: 'Contresort' }, { lvl: '3', name: 'Dissipation de la magie' }, { lvl: '3', name: 'Boule de feu' }];
        assert.equal(spellbookCount(rows, grantedSpellKeys(record, derived)), 1);
    });
});

describe('Copier un sort (PHB 2024 p. 167)', () => {
    test('2 h et 50 po par niveau ; copie de secours 1 h et 10 po par niveau', () => {
        assert.deepEqual(spellCopyCost({ subclass: 'abjurer' }), {
            copy: { hours: 2, gold: 50 }, backup: { hours: 1, gold: 10 }, halved: false
        });
        assert.deepEqual(spellCopyCost(), spellCopyCost({}));
    });

    test('Philosophe de l\'Académie, école Cynisme : copie divisée par deux', () => {
        const philo = (choices) => deriveCharacter({
            ...createDefaultCharacter(), char_class: 'Magicien', char_subclass: 'Philosophe de l\'Académie', char_level: '5',
            subclass_choices: { academy_philosopher: choices }
        });
        assert.deepEqual(spellCopyCost(philo({ school: 'cynisme' })).copy, { hours: 1, gold: 25 });
        assert.equal(spellCopyCost(philo({ school: 'cynisme' })).halved, true);
        // Éclectisme avec Cynisme en seconde école (niveau 5)
        assert.equal(spellCopyCost(philo({ school: 'eclectisme', second_school: 'cynisme' })).halved, true);
        assert.equal(spellCopyCost(philo({ school: 'stoicisme' })).halved, false);
        // La copie de secours n'est pas concernée
        assert.deepEqual(spellCopyCost(philo({ school: 'cynisme' })).backup, { hours: 1, gold: 10 });
    });
});

describe('Savoir rituel : rituel du livre lancé sans être préparé', () => {
    test('Seul le Magicien lance en rituel les sorts non préparés de son livre', () => {
        assert.equal(castsRitualsFromBook('wizard'), true);
        for (const slug of ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock']) {
            assert.equal(castsRitualsFromBook(slug), false, slug);
        }
    });

    test('Rituel : case R cochée, ou étiquette Rituel de la base', () => {
        const alarm = findSpellByName(db, 'Alarme');
        const shield = findSpellByName(db, 'Bouclier');
        assert.equal(alarm.ritual, true);
        assert.equal(isRitualSpell({ name: 'Alarme', r: false }, alarm), true);
        assert.equal(isRitualSpell({ name: 'Sort maison', r: true }, null), true);
        assert.equal(isRitualSpell({ name: 'Bouclier', r: false }, shield), false);
        assert.equal(isRitualSpell(null), false);
    });

    test('Losange : rituel du livre non préparé = état « ritual », dans la vue au combat, seulement en rituel', () => {
        const bookRitual = (row) => isRitualSpell(row, findSpellByName(db, row.name));
        const granted = new Set([spellNameKey('Contresort')]);
        assert.equal(spellPrepState({ lvl: '1', name: 'Alarme', prep: false }, { bookRitual }), 'ritual');
        assert.equal(spellPrepState({ lvl: '1', name: 'Alarme', prep: true }, { bookRitual }), 'prepared');
        assert.equal(spellPrepState({ lvl: '1', name: 'Sommeil', prep: false }, { bookRitual }), 'unprepared');
        assert.equal(spellPrepState({ lvl: '0', name: 'Alarme', prep: false }, { bookRitual }), 'cantrip');
        assert.equal(spellPrepState({ lvl: '3', name: 'Contresort', r: true }, { bookRitual, granted }), 'granted');
        // Sans Savoir rituel (autre classe) : un rituel non préparé ne se lance pas
        assert.equal(spellPrepState({ lvl: '1', name: 'Alarme', prep: false }), 'unprepared');
        assert.equal(inCombatView('ritual'), true);
        assert.equal(isCastable('ritual'), true);
        assert.equal(isRitualOnly('ritual'), true);
        for (const state of ['cantrip', 'granted', 'list', 'prepared', 'unprepared']) assert.equal(isRitualOnly(state), false, state);
    });

    test('Fenêtre Lancer : un sort rituel préparé garde « En rituel », même sans la case R', () => {
        const bookRitual = (row) => isRitualSpell(row, findSpellByName(db, row.name));
        // Compréhension des langues : rituel d'après la base, case R non cochée (ligne v3)
        const row = { lvl: '1', name: 'Compréhension des langues', r: false, prep: true };
        const ritual = isRitualSpell(row, findSpellByName(db, row.name));
        assert.equal(ritual, true);
        assert.deepEqual(castModes(spellPrepState(row, { bookRitual }), ritual), { slots: true, ritual: true, ritualOnly: false });
        // Même sort non préparé : seulement en rituel (Savoir rituel)
        assert.deepEqual(castModes(spellPrepState({ ...row, prep: false }, { bookRitual }), ritual),
            { slots: false, ritual: true, ritualOnly: true });
        // Sort préparé non rituel : emplacements seulement ; sort donné ou liste fixe rituel : les deux
        assert.deepEqual(castModes('prepared', false), { slots: true, ritual: false, ritualOnly: false });
        assert.deepEqual(castModes('granted', true), { slots: true, ritual: true, ritualOnly: false });
        assert.deepEqual(castModes('list', true), { slots: true, ritual: true, ritualOnly: false });
        // Sort non préparé (sans Savoir rituel) ou sort mineur : pas de fenêtre Lancer
        for (const state of ['unprepared', 'cantrip']) {
            assert.deepEqual(castModes(state, true), { slots: false, ritual: false, ritualOnly: false }, state);
        }
    });

    test('Un rituel du livre non préparé ne compte pas dans les sorts préparés', () => {
        const rows = [{ lvl: '1', name: 'Alarme', r: true, prep: false }, { lvl: '1', name: 'Bouclier', prep: true }];
        assert.equal(spellCounts(rows).prepared, 1);
    });
});
