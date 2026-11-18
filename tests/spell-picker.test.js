/**
 * TESTS — LISTE DES SORTS À PARCOURIR DEPUIS LA CASE DU NOM (js/rules/spell-picker.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pickerMaxLevel, pickerLevelTitle, notedSpells, spellPickerGroups } from '../js/rules/spell-picker.js';
import { findSpellByName } from '../js/rules/spells.js';
import { deriveCharacter } from '../js/rules/character.js';
import { EMPTY_SPELL } from '../js/state/schema.js';

const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const db = Array.isArray(base) ? base : Object.values(base);
const spell = (name) => {
    const found = findSpellByName(db, name);
    assert.ok(found, name);
    return found;
};
const row = (name, extra = {}) => ({ ...EMPTY_SPELL, lvl: String(spell(name).level), name, ...extra });

describe('Plus haut niveau proposé', () => {
    test('Magicien 5 : niveau 3 ; Occultiste 5 (pacte) : niveau 3', () => {
        const wizard = deriveCharacter({ char_class: 'Magicien', char_level: '5' });
        assert.equal(pickerMaxLevel(wizard.classSlug, wizard.spellSlots), 3);
        const warlock = deriveCharacter({ char_class: 'Occultiste', char_level: '5' });
        assert.equal(pickerMaxLevel(warlock.classSlug, warlock.spellSlots), 3);
    });

    test('Classe inconnue ou sans emplacement : pas de limite', () => {
        assert.equal(pickerMaxLevel('', { 1: 4 }), null);
        const fighter = deriveCharacter({ char_class: 'Guerrier', char_level: '5' });
        assert.equal(pickerMaxLevel(fighter.classSlug, fighter.spellSlots), null);
        assert.equal(pickerMaxLevel('wizard', {}), null);
    });

    test('Intertitres', () => {
        assert.equal(pickerLevelTitle(0), 'Sorts mineurs');
        assert.equal(pickerLevelTitle(3), 'Niveau 3');
    });
});

describe('Contenu de la liste', () => {
    test('Rangée par niveau, ordre alphabétique, limitée aux niveaux permis et à la classe', () => {
        const groups = spellPickerGroups(db, { classSlug: 'wizard', maxLevel: 3 });
        assert.deepEqual(groups.map(group => group.level), [0, 1, 2, 3]);
        assert.deepEqual(groups.map(group => group.title), ['Sorts mineurs', 'Niveau 1', 'Niveau 2', 'Niveau 3']);
        for (const group of groups) {
            assert.ok(group.items.length > 0);
            assert.ok(group.items.every(item => Number(item.spell.level) === group.level && item.spell.classes.includes('wizard')));
            const names = group.items.map(item => item.name);
            assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'fr')));
        }
    });

    test('Sans limite ni classe : tous les niveaux de la base', () => {
        const groups = spellPickerGroups(db, {});
        assert.deepEqual(groups.map(group => group.level), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const total = groups.reduce((sum, group) => sum + group.items.length, 0);
        assert.equal(total, db.filter(s => s && Number.isInteger(Number(s.level))).length);
    });

    test('Niveau choisi : ce niveau seul, même au-delà des emplacements', () => {
        assert.deepEqual(spellPickerGroups(db, { classSlug: 'wizard', maxLevel: 3, level: '2' }).map(g => g.level), [2]);
        assert.deepEqual(spellPickerGroups(db, { classSlug: 'wizard', maxLevel: 3, level: '0' }).map(g => g.level), [0]);
        assert.deepEqual(spellPickerGroups(db, { classSlug: 'wizard', maxLevel: 3, level: '5' }).map(g => g.level), [5]);
        // '' : pas de niveau choisi
        assert.equal(spellPickerGroups(db, { classSlug: 'wizard', maxLevel: 1, level: '' }).length, 2);
    });

    test('La saisie resserre la liste (accents, nom anglais)', () => {
        const names = (query) => spellPickerGroups(db, { classSlug: 'wizard', maxLevel: 3, query })
            .flatMap(group => group.items.map(item => item.name));
        assert.ok(names('boule de feu').includes(spell('Boule de feu').name.split('|')[0]));
        assert.ok(names('Fireball').includes(spell('Boule de feu').name.split('|')[0]));
        assert.ok(names('eclair').length > 0);
        assert.deepEqual(names('zzzz'), []);
    });

    test('Sorts déjà notés : présents et marqués', () => {
        const rows = [row('Boule de feu'), { ...EMPTY_SPELL, name: 'Fire Bolt', lvl: '0' }, { ...EMPTY_SPELL }];
        assert.equal(notedSpells(rows, db).size, 2);
        const items = spellPickerGroups(db, { classSlug: 'wizard', maxLevel: 3, rows }).flatMap(group => group.items);
        const noted = items.filter(item => item.noted).map(item => item.spell);
        assert.ok(noted.includes(spell('Boule de feu')));
        assert.ok(noted.includes(spell('Fire Bolt')));
        assert.equal(noted.length, 2);
    });

    test('Base absente ou abîmée : liste vide, sans erreur', () => {
        assert.deepEqual(spellPickerGroups(null), []);
        assert.deepEqual(spellPickerGroups([null, { name: 'X', level: 'abc' }]), []);
    });
});
