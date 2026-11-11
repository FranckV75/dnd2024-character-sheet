// =============================================================================
// Serment du Seigneur Dragon, Jeune dragon (niveau 15) : bouton « Monté sur le dragon »
// (combat_buffs.dragonMount) — js/rules/subclass-combat.js, js/rules/weapons.js.
// Règle : guide du joueur de l'Odyssée, p. 49 ; blocs des jeunes dragons : Manuel des monstres 2024.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import { dragonMount, dragonMountNotes, shownPassivePerception } from '../js/rules/subclass-combat.js';
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

    test('Perception passive tapée à la main : comparée telle que la fiche l\'affiche', () => {
        // Sagesse 10 (calculée : 10), mais le joueur a tapé 20 : le dragon (17) ne fait pas mieux
        const typed = dragonlord(15, 'bronze', { wis_score: '10', passive_perc_manual: 'true', passive_perception: '20', ...mounted });
        assert.equal(shownPassivePerception(deriveCharacter(typed), typed), 20);
        assert.equal(dragonMount(deriveCharacter(typed), typed).better, false);
        const [high] = dragonMountNotes(deriveCharacter(typed), typed)['skills.perception'];
        assert.equal(high.mention, 'Sens du dragon (monté)');
        assert.match(high.text, /moins bonne que la vôtre \(20\), qui reste/);
        // Valeur tapée plus basse que celle du dragon
        const low = { ...typed, passive_perception: ' 12 ' };
        const [better] = dragonMountNotes(deriveCharacter(low), low)['skills.perception'];
        assert.equal(better.mention, 'Passive 17 (monté)');
        assert.match(better.text, /au lieu de la vôtre \(12\)/);
        // Égalité
        const same = { ...typed, passive_perception: '17' };
        assert.match(dragonMountNotes(deriveCharacter(same), same)['skills.perception'][0].text, /égale à la vôtre \(17\)\.$/);
        // Texte libre (vu dans de vraies sauvegardes) : pas de comparaison, la règle seulement
        const free = { ...typed, passive_perception: '13ou18ou21' };
        assert.equal(shownPassivePerception(deriveCharacter(free), free), null);
        assert.equal(dragonMount(deriveCharacter(free), free).better, null);
        const [rule] = dragonMountNotes(deriveCharacter(free), free)['skills.perception'];
        assert.equal(rule.mention, 'Sens du dragon (monté)');
        assert.match(rule.text, /Perception passive 17 \(celle du dragon\) si elle est meilleure que la vôtre\.$/);
        assert.doesNotMatch(rule.text, /\(10\)/);
        // Saisie manuelle éteinte : la valeur tapée restée dans la fiche est ignorée
        const auto = { ...typed, passive_perc_manual: '' };
        assert.equal(shownPassivePerception(deriveCharacter(auto), auto), 10);
        assert.match(dragonMountNotes(deriveCharacter(auto), auto)['skills.perception'][0].text, /au lieu de la vôtre \(10\)/);
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
