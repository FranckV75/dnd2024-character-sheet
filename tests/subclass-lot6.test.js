// =============================================================================
// Sous-classes, lot 6 : tiers de lanceur (Chevalier occulte, Escroc arcanique) — emplacements de
// sorts (DD_RULES.getSpellSlots, table « third »), liste du Magicien proposée, textes du bloc
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DD_RULES } from '../js/data/dd-rules.js';
import { spellSlotsFor, deriveCharacter } from '../js/rules/character.js';
import { effectiveSpellClass, spellcastingStatus, slotView } from '../js/rules/spells.js';
import { subclassFeatures, thirdCasterPrepared } from '../js/rules/subclass-features.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const record = (cls, subclass, level, extra = {}) => ({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level), ...extra
});

describe('Emplacements de sorts du tiers de lanceur (PHB 2024)', () => {
    test('table du Chevalier occulte et de l\'Escroc arcanique', () => {
        const ek = (level) => spellSlotsFor('Guerrier', level, 'eldritch_knight');
        assert.deepEqual(ek(2), {});
        assert.deepEqual(ek(3), { 1: 2 });
        assert.deepEqual(ek(4), { 1: 3 });
        assert.deepEqual(ek(7), { 1: 4, 2: 2 });
        assert.deepEqual(ek(10), { 1: 4, 2: 3 });
        assert.deepEqual(ek(13), { 1: 4, 2: 3, 3: 2 });
        assert.deepEqual(ek(16), { 1: 4, 2: 3, 3: 3 });
        assert.deepEqual(ek(19), { 1: 4, 2: 3, 3: 3, 4: 1 });
        assert.deepEqual(spellSlotsFor('Roublard', 20, 'arcane_trickster'), { 1: 4, 2: 3, 3: 3, 4: 1 });
    });

    test('seulement avec la bonne classe ; les autres classes ne changent pas', () => {
        assert.deepEqual(spellSlotsFor('Guerrier', 7, 'arcane_trickster'), {});
        assert.deepEqual(spellSlotsFor('Roublard', 7, 'eldritch_knight'), {});
        assert.deepEqual(spellSlotsFor('Guerrier', 7, 'champion'), {});
        assert.deepEqual(spellSlotsFor('Guerrier', 7), {});
        assert.deepEqual(spellSlotsFor('Magicien', 3, 'eldritch_knight'), { 1: 4, 2: 2 });
        assert.equal(DD_RULES.casterType.fighter, null);
    });

    test('deriveCharacter : emplacements du Chevalier occulte, grimoire ouvert', () => {
        const d = deriveCharacter(record('Guerrier', 'Chevalier Occulte', 7));
        assert.equal(d.subclass, 'eldritch_knight');
        assert.deepEqual(d.spellSlots, { 1: 4, 2: 2 });
        assert.equal(spellcastingStatus({ classSlug: d.classSlug, subclass: 'Chevalier Occulte', level: 7, spellSlots: d.spellSlots }).casts, true);
        const before = deriveCharacter(record('Guerrier', 'Chevalier Occulte', 2));
        const status = spellcastingStatus({ classSlug: 'fighter', subclass: 'Chevalier Occulte', level: 2, spellSlots: before.spellSlots });
        assert.deepEqual([status.casts, status.unlockLevel], [false, 3]);
    });

    test('un maximum réglé à la main (ancienne fiche) reste prioritaire', () => {
        const state = { 1: { max: 3, used: 1 } };
        assert.deepEqual(slotView(state, 1, 4), { max: 3, used: 1 });
    });
});

describe('Liste de sorts et textes', () => {
    test('liste du Magicien proposée par défaut', () => {
        assert.equal(effectiveSpellClass('', 'fighter', 'eldritch_knight'), 'wizard');
        assert.equal(effectiveSpellClass('', 'rogue', 'arcane_trickster'), 'wizard');
        assert.equal(effectiveSpellClass('cleric', 'fighter', 'eldritch_knight'), 'cleric');
        assert.equal(effectiveSpellClass('', 'fighter', 'champion'), '');
        assert.equal(effectiveSpellClass('', 'rogue', 'eldritch_knight'), '');
    });

    test('sorts préparés de niveau 1+ (table commune)', () => {
        assert.deepEqual([2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 16, 18, 19, 20].map(thirdCasterPrepared),
            [0, 3, 4, 4, 5, 6, 6, 7, 8, 9, 10, 11, 11, 12, 13]);
    });

    test('bloc « Sous-classe » : préparés, sorts mineurs et caractéristique', () => {
        const ek = subclassFeatures(deriveCharacter(record('Guerrier', 'Chevalier Occulte', 10, { int_score: '16', spell_ability: 'int' })));
        assert.match(ek.reached.find(f => f.id === 'incantation_sorts_mineurs_et_sorts_prepares').automation.text, /7 sorts préparés de niveau 1\+, 3 sorts mineurs/);
        assert.match(ek.reached.find(f => f.id === 'incantation_caracteristique').automation.text, /DD des sorts 15, attaque \+7/);
        const at = subclassFeatures(deriveCharacter(record('Roublard', 'Escroc Arcanique', 3)));
        assert.match(at.reached.find(f => f.id === 'incantation').automation.text, /3 sorts préparés.*Main de mage \+ 2 sorts mineurs.*choisissez Intelligence/);
    });
});
