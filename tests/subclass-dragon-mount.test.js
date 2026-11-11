// =============================================================================
// Serment du Seigneur Dragon, Jeune dragon (niveau 15) : bouton « Monté sur le dragon »
// (combat_buffs.dragonMount) — js/rules/subclass-combat.js, js/rules/weapons.js.
// Règle : guide du joueur de l'Odyssée, p. 49 ; blocs des jeunes dragons : Manuel des monstres 2024.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import { dragonMount, dragonMountNotes } from '../js/rules/subclass-combat.js';
import { subclassBuffs, buffsForCharacter, effectiveBuffs } from '../js/rules/weapons.js';
import { featEffects } from '../js/rules/feat-effects.js';
import { planLongRest } from '../js/rules/rest.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const dragonlord = (level, egg, extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Paladin', char_subclass: 'Serment du Seigneur Dragon', char_level: String(level),
    ...(egg ? { subclass_choices: { oath_of_the_dragonlords: { egg } } } : {}), ...extra
});
const mounted = { combat_buffs: { dragonMount: true } };

describe('Monté sur le dragon', () => {
    test('bouton proposé au Seigneur Dragon à partir du niveau 15 seulement', () => {
        assert.deepEqual(subclassBuffs(dragonlord(14, 'bronze'), deriveCharacter(dragonlord(14, 'bronze'))), []);
        const r = dragonlord(15, 'bronze');
        assert.deepEqual(subclassBuffs(r, deriveCharacter(r)), ['dragonMount']);
        assert.deepEqual(buffsForCharacter('paladin', r, deriveCharacter(r)), ['dragonMount']);
        // Autre serment : jamais proposé, et un bouton resté allumé ne compte pas
        const other = { ...dragonlord(15, 'bronze'), char_subclass: 'Serment de dévotion', ...mounted };
        assert.equal(effectiveBuffs('paladin', other.combat_buffs, other, deriveCharacter(other)).dragonMount, false);
        assert.deepEqual(dragonMountNotes(deriveCharacter(other), other), {});
    });

    test('immunité et sens du jeune dragon selon la couleur de l\'œuf', () => {
        const d = (egg) => dragonMount(deriveCharacter(dragonlord(15, egg)));
        assert.deepEqual(['brass', 'bronze', 'copper', 'silver'].map(egg => [d(egg).damage, d(egg).passive]),
            [['feu', 16], ['foudre', 17], ['acide', 17], ['froid', 18]]);
        assert.equal(d('silver').dragon, "Jeune dragon d'argent");
        assert.equal(d('bronze').senses, 'vision aveugle 9 m, vision dans le noir 36 m');
        assert.deepEqual(dragonMount(deriveCharacter(dragonlord(15))), { dragon: null });
        assert.equal(dragonMount(deriveCharacter(dragonlord(14, 'bronze'))), null);
    });

    test('éteint : immunité grisée près de la CA, rien près de la Perception', () => {
        const r = dragonlord(15, 'bronze');
        const notes = dragonMountNotes(deriveCharacter(r), r);
        assert.equal(notes.armorClass.length, 1);
        assert.equal(notes.armorClass[0].inactive, true);
        assert.match(notes.armorClass[0].text, /Immunité à la foudre, seulement monté/);
        assert.equal(notes['skills.perception'], undefined);
    });

    test('allumé : mention d\'immunité, Perception passive du dragon si elle est meilleure', () => {
        const r = dragonlord(15, 'bronze', { wis_score: '10', ...mounted });
        const notes = dragonMountNotes(deriveCharacter(r), r);
        assert.equal(notes.armorClass[0].mention, 'Immunité foudre (monté)');
        assert.equal(notes.armorClass[0].inactive, undefined);
        const [perception] = notes['skills.perception'];
        assert.equal(perception.mention, 'Passive 17 (monté)');
        assert.match(perception.text, /vision aveugle 9 m, vision dans le noir 36 m ; Perception passive 17 .*au lieu de la vôtre \(10\)/);
        // Perception passive du personnage meilleure (Sagesse 20, Perception maîtrisée : 10 + 5 + 5 = 20)
        const sharp = dragonlord(15, 'brass', { wis_score: '20', skill_prof_perception: true, ...mounted });
        const [keen] = dragonMountNotes(deriveCharacter(sharp), sharp)['skills.perception'];
        assert.equal(keen.mention, 'Sens du dragon (monté)');
        assert.match(keen.text, /moins bonne que la vôtre \(20\)/);
        // Repères visibles dans les zones de la fiche
        const zones = featEffects(r);
        assert.ok(zones.armorClass.some(n => n.featId === 'jeune_dragon' && !n.inactive));
        assert.ok(zones['skills.perception'].some(n => n.featId === 'jeune_dragon'));
    });

    test('sans œuf choisi : rappel grisé qui renvoie au menu', () => {
        const r = dragonlord(15, '', mounted);
        const [note] = dragonMountNotes(deriveCharacter(r), r).armorClass;
        assert.equal(note.inactive, true);
        assert.match(note.text, /Œuf de dragon/);
    });

    test('éteint au repos long, comme les autres bonus de combat', () => {
        const r = dragonlord(15, 'bronze', mounted);
        assert.deepEqual(planLongRest(r).patch.combat_buffs, {});
    });
});
