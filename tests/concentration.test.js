/**
 * TESTS — CONCENTRATION : sort en cours, sorts proposés, jet de Constitution après des dégâts,
 * fin à 0 PV et sous l'état Neutralisé.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import {
    concentrationSpell, setConcentrationPatch, concentrationOptions, concentrationView, damageWithConcentration, CONCENTRATION_KEY
} from '../js/rules/concentration.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';

const spells = [
    { name: 'Bénédiction', lvl: '1', c: true },
    { name: 'Projectile magique', lvl: '1', c: false },
    { name: '<b>Toile d\'araignée</b>', lvl: '2', c: true },
    { name: '', c: true }
];

describe('Sort de concentration', () => {
    test('Ancienne fiche : aucune ; nom nettoyé du HTML et raccourci', () => {
        assert.equal(concentrationSpell({}), '');
        assert.equal(concentrationSpell({ concentration: 42 }), '');
        assert.equal(concentrationSpell({ concentration: '<i>Hâte</i>' }), 'Hâte');
        assert.equal(concentrationSpell({ concentration: 'x'.repeat(200) }).length, 80);
    });

    test('Choisir, changer, terminer', () => {
        assert.deepEqual(setConcentrationPatch({}, 'Bénédiction'), { [CONCENTRATION_KEY]: 'Bénédiction' });
        assert.deepEqual(setConcentrationPatch({ concentration: 'Bénédiction' }, 'Bénédiction'), {});
        assert.deepEqual(setConcentrationPatch({ concentration: 'Bénédiction' }, ''), { [CONCENTRATION_KEY]: '' });
    });

    test('Sorts proposés : grimoire « C », sorts donnés, sort en cours ; sans doublon', () => {
        const record = { dynamic_spells: spells, concentration: 'Fléau' };
        assert.deepEqual(concentrationOptions(record, ['Ténèbres', 'bénédiction']),
            ['Bénédiction', 'Toile d\'araignée', 'Ténèbres', 'Fléau']);
        assert.deepEqual(concentrationOptions({ dynamic_spells: 'cassé' }), []);
    });

    test('Clé propre à la v4', () => {
        assert.ok(V4_ONLY_KEYS.includes('concentration'));
    });
});

describe('Rappels', () => {
    const base = { char_class: 'Magicien', char_level: '5', con_score: '14', hp_current: '30', hp_max: '30', dynamic_spells: spells };

    test('Dégâts : jet de Constitution chiffré avec le bonus de la fiche', () => {
        const record = { ...base, concentration: 'Bénédiction' };
        const outcome = damageWithConcentration(record, deriveCharacter(record), '24');
        assert.equal(outcome.ok, true);
        const bonus = deriveCharacter(record).saves.con.bonus;
        assert.ok(outcome.notes.some((note) => note.startsWith(`Concentration sur Bénédiction : jet de sauvegarde de Constitution DD 12 (+${bonus}`)));
        assert.ok(!outcome.notes.some((note) => /^Si vous vous concentrez/.test(note)));
        assert.equal(outcome.patch[CONCENTRATION_KEY], undefined);
    });

    test('Mage de guerre : avec Avantage', () => {
        const record = { ...base, feat_4: 'mage_de_guerre', concentration: 'Bénédiction' };
        const outcome = damageWithConcentration(record, deriveCharacter(record), '5');
        assert.ok(outcome.notes.some((note) => /DD 10 .*Avantage : Mage de guerre/.test(note)));
    });

    test('0 PV : Concentration terminée (et Inconscient coché)', () => {
        const record = { ...base, concentration: 'Bénédiction' };
        const outcome = damageWithConcentration(record, deriveCharacter(record), '30');
        assert.equal(outcome.patch[CONCENTRATION_KEY], '');
        assert.ok(outcome.patch.conditions.includes('unconscious'));
        assert.ok(outcome.notes.some((note) => /terminée \(Inconscient\)/.test(note)));
    });

    test('Sans concentration : le rappel général reste', () => {
        const outcome = damageWithConcentration(base, deriveCharacter(base), '8');
        assert.ok(outcome.notes.some((note) => /^Si vous vous concentrez sur un sort/.test(note)));
        assert.equal(outcome.patch[CONCENTRATION_KEY], undefined);
    });

    test('État Neutralisé (ou qui l\'entraîne) : la Concentration prend fin', () => {
        const record = { ...base, concentration: 'Bénédiction', conditions: ['stunned'] };
        assert.equal(concentrationView(record, deriveCharacter(record)).brokenBy, 'stunned');
        const calm = { ...base, concentration: 'Bénédiction', conditions: ['poisoned'] };
        assert.equal(concentrationView(calm, deriveCharacter(calm)).brokenBy, null);
        assert.equal(concentrationView(base, deriveCharacter(base)), null);
    });
});

describe('Relecture 4.37.0', () => {
    test('Rage du Barbare : la Concentration est terminée, pas de jet', () => {
        const record = { char_class: 'Barbare', char_level: '5', hp_current: '40', hp_max: '40', concentration: 'Bénédiction', combat_buffs: { rage: true } };
        const derived = deriveCharacter(record);
        assert.equal(concentrationView(record, derived).brokenBy, 'rage');
        const outcome = damageWithConcentration(record, derived, '6');
        assert.equal(outcome.patch[CONCENTRATION_KEY], '');
        assert.ok(outcome.notes.some((note) => /déjà terminée \(Rage\)/.test(note)));
    });

    test('Chasseur implacable (Rôdeur 13) : pas de jet sur Marque du chasseur ; 0 PV la termine quand même', () => {
        const ranger = (level, hp) => ({ char_class: 'Rôdeur', char_level: String(level), hp_current: String(hp), hp_max: '80', concentration: 'Marque du chasseur' });
        const safe = damageWithConcentration(ranger(13, 50), deriveCharacter(ranger(13, 50)), '24');
        assert.ok(safe.notes.some((note) => /aucun jet.*Chasseur implacable/.test(note)));
        const before = damageWithConcentration(ranger(12, 50), deriveCharacter(ranger(12, 50)), '24');
        assert.ok(before.notes.some((note) => /jet de sauvegarde de Constitution DD 12/.test(note)));
        const down = damageWithConcentration(ranger(13, 10), deriveCharacter(ranger(13, 10)), '24');
        assert.equal(down.patch[CONCENTRATION_KEY], '');
    });
});
