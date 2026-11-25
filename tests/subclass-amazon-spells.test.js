// =============================================================================
// Conclave des Amazones, Magie des Amazones (Odyssée, p. 49) : sorts donnés aux niveaux 3, 5, 9, 13
// et 17 de Rôdeur (Injonction, Appel de destrier, Hâte, Confusion, Double illusoire), traités comme
// les sorts de serment du Paladin : bloc « Sorts de sous-classe », toujours préparés, hors du compte.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveCharacter } from '../js/rules/character.js';
import { subclassSpells, subclassFeatures, automationKind } from '../js/rules/subclass-features.js';
import { SUBCLASS_SPELLS } from '../js/data/subclass-spells.js';
import {
    givenSpellKeys, grantedSpellKeys, preparationView, preparedSpellNames, highestSlotLevel, spellPrepState
} from '../js/rules/spell-preparation.js';
import { spellCounts, spellNameKey, findSpellByName } from '../js/rules/spells.js';
import { COMPANION_KEYS, companionCards } from '../js/rules/subclass-companions.js';
import { EMPTY_SPELL, createDefaultCharacter } from '../js/state/schema.js';

const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const db = Array.isArray(base) ? base : Object.values(base);
const amazon = (level, extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Rôdeur', char_subclass: 'Conclave des Amazones', char_level: String(level),
    wis_score: '16', spell_ability: 'wis', ...extra
});
const row = (name, prep = false) => ({ ...EMPTY_SPELL, lvl: String(findSpellByName(db, name).level), name, prep });

describe('Magie des Amazones : sorts de sous-classe', () => {
    test('cinq sorts, un par palier de Rôdeur (3, 5, 9, 13, 17), du niveau 1 au niveau 5', () => {
        const rows = SUBCLASS_SPELLS.amazon_warrior;
        assert.deepEqual(rows.map(([classLevel, vo, name, level]) => [classLevel, vo, name, level]), [
            [3, 'Command', 'Injonction', 1],
            [5, 'Find Steed', 'Appel de destrier', 2],
            [9, 'Haste', 'Hâte', 3],
            [13, 'Confusion', 'Confusion', 4],
            [17, 'Mislead', 'Double illusoire', 5]
        ]);
        // Même nom que la base de sorts (celui que le grimoire enregistre)
        for (const [, vo, name] of rows) assert.equal(db.find(s => s.vo === vo)?.name.split('|')[0], name, vo);
    });

    test('atteints selon le niveau ; à venir ensuite', () => {
        const at = (level) => subclassSpells(deriveCharacter(amazon(level)));
        assert.deepEqual(at(3).reached.map(s => s.name), ['Injonction']);
        assert.equal(at(3).upcoming.length, 4);
        assert.deepEqual(at(9).reached.map(s => s.name), ['Injonction', 'Appel de destrier', 'Hâte']);
        assert.equal(at(17).reached.length, 5);
        assert.deepEqual(at(17).upcoming, []);
        // Appel de destrier renvoie à la carte de la monture
        assert.match(at(5).reached.find(s => s.vo === 'Find Steed').note, /Compagnons & familiers/);
        // Autre sous-classe de Rôdeur : rien de l'Amazone
        assert.equal(subclassSpells(deriveCharacter({ ...amazon(9), char_subclass: 'Chasseur' })).reached.length, 0);
    });

    test('sorts donnés : reconnus sous leur nom français et anglais, seulement une fois atteints', () => {
        const given = givenSpellKeys(amazon(5), deriveCharacter(amazon(5)));
        for (const name of ['Injonction', 'Command', 'Appel de destrier', 'Find Steed']) assert.ok(given.has(spellNameKey(name)), name);
        assert.equal(given.has(spellNameKey('Hâte')), false);
        assert.ok(givenSpellKeys(amazon(9), deriveCharacter(amazon(9))).has(spellNameKey('Hâte')));
    });

    test('notés au grimoire : toujours préparés, hors du compte et pas « hors liste »', () => {
        const record = amazon(5);
        const derived = deriveCharacter(record);
        const granted = grantedSpellKeys(record, derived, db);
        const rows = [row('Injonction', true), row('Appel de destrier', true), row('Soins', true)];
        assert.equal(spellPrepState(rows[0], { granted }), 'granted');
        assert.equal(spellPrepState(rows[1], { granted }), 'granted');
        const view = preparationView(rows, db, { classSlug: 'ranger', maxLevel: highestSlotLevel(derived.spellSlots), granted });
        // Injonction et Appel de destrier ne sont pas des sorts de Rôdeur : sans le don, ils seraient « autres »
        assert.deepEqual(view.others, []);
        assert.equal(spellCounts(rows, '', granted).prepared, 1);
        assert.deepEqual([...preparedSpellNames(rows, granted).values()], ['Soins']);
    });

    test('capacité « Magie des Amazones » : renvoie au bloc, la monture reste « En partie »', () => {
        const feature = (level) => subclassFeatures(deriveCharacter(amazon(level))).reached.find(f => f.id === 'magie_des_amazones');
        for (const level of [3, 5]) {
            assert.match(feature(level).automation.text, /Sorts de sous-classe/);
            assert.doesNotMatch(feature(level).automation.text, /à noter au grimoire/);
        }
        assert.match(feature(5).automation.text, /Appel de destrier : Carte de la monture d'Outremonde/);
        assert.equal(automationKind(feature(5)), 'partial');
    });

    test('carte de la monture : sort nommé comme dans le grimoire', () => {
        const c = amazon(5);
        const card = companionCards(deriveCharacter(c), c).find(entry => entry.key === COMPANION_KEYS.steed);
        assert.match(card.subtitle, /sort Appel de destrier de niveau 2/);
    });
});
