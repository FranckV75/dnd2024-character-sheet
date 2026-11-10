/**
 * TESTS — RESTES DES CLASSES (4.35.0) : vitesse du Moine et du Barbare, cases de Fougue, Inflexible
 * et Coup de chance, filtre « Magiques » des armes.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import { classSpeedBonus, classFeatureNotes } from '../js/rules/class-features.js';
import { subclassCounters, restSubclassUses, setSubclassUsesPatch } from '../js/rules/subclass-uses.js';
import { matchesWeaponFilter } from '../js/rules/weapons.js';

describe('Vitesse donnée par la classe', () => {
    test('Moine : Déplacement sans armure, du niveau 2 au niveau 18', () => {
        assert.equal(classSpeedBonus({ classSlug: 'monk', level: 1 }), null);
        assert.deepEqual([2, 6, 10, 14, 18].map((level) => classSpeedBonus({ classSlug: 'monk', level }).value), [3, 4.5, 6, 7.5, 9]);
    });

    test('Barbare : Déplacement rapide au niveau 5 ; autres classes : rien', () => {
        assert.equal(classSpeedBonus({ classSlug: 'barbarian', level: 4 }), null);
        assert.equal(classSpeedBonus({ classSlug: 'barbarian', level: 5 }).value, 3);
        assert.equal(classSpeedBonus({ classSlug: 'fighter', level: 20 }), null);
    });

    test('Repère près de la Vitesse, sans toucher la valeur saisie', () => {
        const record = { char_class: 'Moine', char_level: '6', speed: '9' };
        const [note] = classFeatureNotes(deriveCharacter(record), record).speed;
        assert.equal(note.mention, 'dont +4,5 m (sans armure ni bouclier)');
        assert.equal(note.manual, true);
        assert.equal(record.speed, '9');
    });
});

describe('Fougue, Inflexible et Coup de chance', () => {
    const counters = (record) => subclassCounters(record, deriveCharacter(record));

    test('Guerrier : Fougue au niveau 2 (2 au niveau 17), Inflexible 1 / 2 / 3 aux niveaux 9 / 13 / 17', () => {
        assert.deepEqual(counters({ char_class: 'Guerrier', char_level: '1' }), []);
        assert.deepEqual(counters({ char_class: 'Guerrier', char_level: '2' }).map((c) => [c.key, c.max]), [['fighter.fougue', 1]]);
        assert.deepEqual(counters({ char_class: 'Guerrier', char_level: '13' }).map((c) => [c.key, c.max]),
            [['fighter.fougue', 1], ['fighter.inflexible', 2]]);
        assert.deepEqual(counters({ char_class: 'Guerrier', char_level: '17' }).map((c) => c.max), [2, 3]);
    });

    test('Ancien nom de classe et sous-classe : les cases de classe viennent en premier', () => {
        const list = counters({ char_class: 'Guerrier', char_subclass: 'Maître de guerre', char_level: '3' });
        assert.equal(list[0].key, 'fighter.fougue');
        assert.equal(list[0].source, 'class');
        assert.ok(list.some((c) => c.source === 'subclass'));
    });

    test('Repos : Fougue revient au repos court, Inflexible au repos long seulement', () => {
        const record = { char_class: 'Guerrier', char_level: '9', subclass_uses: { 'fighter.fougue': 1, 'fighter.inflexible': 1 } };
        const derived = deriveCharacter(record);
        assert.deepEqual(restSubclassUses(record, derived, 'short').patch.subclass_uses,
            { 'fighter.fougue': 0, 'fighter.inflexible': 1 });
        assert.deepEqual(restSubclassUses(record, derived, 'long').patch.subclass_uses,
            { 'fighter.fougue': 0, 'fighter.inflexible': 0 });
        assert.deepEqual(setSubclassUsesPatch(record, 'fighter.inflexible', 5, 1).subclass_uses['fighter.inflexible'], 1);
    });

    test('Roublard : Coup de chance au niveau 20 seulement, repos court', () => {
        assert.deepEqual(counters({ char_class: 'Roublard', char_level: '19' }), []);
        const [luck] = counters({ char_class: 'Roublard', char_level: '20' });
        assert.deepEqual([luck.key, luck.max, luck.reset], ['rogue.coup_de_chance', 1, 'short']);
    });
});

describe('Filtre « Magiques » des armes', () => {
    test('Bonus magique de +1 à +3 dans la configuration ; ligne sans nom toujours visible', () => {
        assert.ok(matchesWeaponFilter({ name: 'Épée longue', weaponConfig: '{"magicBonus":1}' }, 'magic'));
        assert.ok(!matchesWeaponFilter({ name: 'Épée longue', weaponConfig: '{"magicBonus":0}' }, 'magic'));
        assert.ok(!matchesWeaponFilter({ name: 'Dague' }, 'magic'));
        assert.ok(matchesWeaponFilter({ name: '' }, 'magic'));
    });
});
