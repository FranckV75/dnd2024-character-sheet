/**
 * TESTS — POINTS DE VIE EN JEU (js/rules/hit-points.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    hitPointState, readAmount, concentrationDc, applyDamage, applyHealing, applyTemporary, stepHitPoints
} from '../js/rules/hit-points.js';

const pv = (current, max, temp, extra = {}) => ({ hp_current: current, hp_max: max, hp_temp: temp, ...extra });

describe('PV : lecture', () => {
    test('Nombres lus dans le texte ; PV actuels vides = pleins ; PV temp. vides = 0', () => {
        assert.deepEqual(hitPointState(pv('32', '39', '')), { current: 32, max: 39, temp: 0 });
        assert.deepEqual(hitPointState(pv('', '80 (Robuste)', '5')), { current: 80, max: 80, temp: 5 });
        assert.deepEqual(hitPointState(pv('', '', '')), { current: null, max: null, temp: 0 });
        assert.deepEqual(hitPointState(pv('-3', '20', '-2')), { current: 0, max: 20, temp: 0 });
        assert.deepEqual(hitPointState(null), { current: null, max: null, temp: 0 });
    });

    test('Montant : entier de 1 à 999', () => {
        assert.equal(readAmount('7'), 7);
        assert.equal(readAmount(' 12 '), 12);
        for (const bad of ['', '0', '-3', '2.5', 'abc', '1000', null]) assert.equal(readAmount(bad), null, String(bad));
    });

    test('Concentration : DD 10 ou moitié des dégâts, au plus 30', () => {
        assert.equal(concentrationDc(7), 10);
        assert.equal(concentrationDc(25), 12);
        assert.equal(concentrationDc(100), 30);
    });
});

describe('PV : dégâts', () => {
    test('Les PV temporaires partent en premier', () => {
        const r = applyDamage(pv('30', '39', '5'), '8');
        assert.deepEqual(r.patch, { hp_temp: '0', hp_current: '27' });
        assert.deepEqual(r.after, { current: 27, temp: 0 });
        assert.match(r.notes[0], /Constitution DD 10/);
    });

    test('Dégâts absorbés par les PV temporaires : PV actuels inchangés', () => {
        assert.deepEqual(applyDamage(pv('30', '39', '10'), '4').patch, { hp_temp: '6' });
    });

    test('PV actuels vides : comptés pleins, puis écrits', () => {
        assert.deepEqual(applyDamage(pv('', '39', ''), '9').patch, { hp_current: '30' });
    });

    test('Tomber à 0 PV : Inconscient coché', () => {
        const r = applyDamage(pv('6', '39', '', { conditions: ['poisoned'] }), '10');
        assert.equal(r.patch.hp_current, '0');
        assert.deepEqual(r.patch.conditions, ['poisoned', 'unconscious']);
        assert.equal(r.dead, false);
        assert.match(r.notes[0], /Inconscient/);
    });

    test('Mort instantanée : dégâts restants ≥ PV maximum', () => {
        const r = applyDamage(pv('6', '20', ''), '26');
        assert.equal(r.dead, true);
        assert.match(r.notes[0], /mort instantanée/);
        assert.ok(!('conditions' in r.patch));
        assert.equal(applyDamage(pv('6', '20', ''), '25').dead, false);
    });

    test('Dégâts à 0 PV : échec au jet contre la mort, ou mort', () => {
        assert.match(applyDamage(pv('0', '20', ''), '5').notes[0], /un échec au jet contre la mort/);
        assert.equal(applyDamage(pv('0', '20', ''), '20').dead, true);
    });

    test('Saisie invalide ou PV inconnus : rien n\'est appliqué', () => {
        assert.equal(applyDamage(pv('10', '20', ''), '0').ok, false);
        assert.equal(applyDamage(pv('', '', ''), '5').ok, false);
    });
});

describe('PV : soins et PV temporaires', () => {
    test('Soins plafonnés au maximum', () => {
        const r = applyHealing(pv('35', '39', ''), '10');
        assert.deepEqual(r.patch, { hp_current: '39' });
        assert.match(r.notes[0], /maximum \(39\)/);
    });

    test('Soins à 0 PV : fin de l\'inconscience (À terre reste), jets contre la mort remis à zéro', () => {
        const r = applyHealing(pv('0', '39', '', { conditions: ['unconscious'], ds_s1: true, ds_f1: true, ds_f2: true }), '4');
        assert.deepEqual(r.patch, { hp_current: '4', ds_s1: false, ds_f1: false, ds_f2: false, conditions: ['prone'] });
        assert.equal(r.notes.length, 2);
    });

    test('Soins à PV pleins : rien ne change', () => {
        assert.deepEqual(applyHealing(pv('39', '39', ''), '5').patch, {});
    });

    test('PV temporaires : on garde les plus élevés', () => {
        assert.deepEqual(applyTemporary(pv('10', '20', '3'), '8').patch, { hp_temp: '8' });
        const kept = applyTemporary(pv('10', '20', '9'), '5');
        assert.deepEqual(kept.patch, {});
        assert.match(kept.notes[0], /ne se cumulent pas/);
    });
});

describe('PV : boutons − / +', () => {
    test('PV actuels entre 0 et le maximum', () => {
        assert.deepEqual(stepHitPoints(pv('10', '39', ''), 'hp_current', -1), { hp_current: '9' });
        assert.deepEqual(stepHitPoints(pv('39', '39', ''), 'hp_current', 1), {});
        assert.deepEqual(stepHitPoints(pv('0', '39', ''), 'hp_current', -1), {});
        assert.deepEqual(stepHitPoints(pv('10', '', ''), 'hp_current', 5), { hp_current: '15' });
    });

    test('Case vide : le premier appui l\'écrit', () => {
        assert.deepEqual(stepHitPoints(pv('', '39', ''), 'hp_current', -1), { hp_current: '38' });
        assert.deepEqual(stepHitPoints(pv('', '39', ''), 'hp_current', 1), { hp_current: '39' });
        assert.deepEqual(stepHitPoints(pv('10', '39', ''), 'hp_temp', 1), { hp_temp: '1' });
        assert.deepEqual(stepHitPoints(pv('10', '39', '0'), 'hp_temp', -1), {});
    });

    test('Autre clé : rien', () => {
        assert.deepEqual(stepHitPoints(pv('10', '39', ''), 'hp_max', 1), {});
    });
});

describe('PV : corrections de la relecture', () => {
    test('PV actuels au-dessus du maximum (saisis à la main) : jamais baissés par Soins ou +', () => {
        const above = pv('45', '39', '');
        assert.deepEqual(applyHealing(above, '5').patch, {});
        assert.deepEqual(applyHealing(above, '5').notes, []);
        assert.deepEqual(stepHitPoints(above, 'hp_current', 1), {});
        assert.deepEqual(stepHitPoints(above, 'hp_current', -1), { hp_current: '44' });
    });

    test('À 0 PV, mort jugée sur les dégâts restant après les PV temporaires', () => {
        const r = applyDamage(pv('0', '12', '10'), '15');
        assert.equal(r.dead, false);
        assert.match(r.notes[0], /un échec au jet contre la mort/);
        assert.equal(applyDamage(pv('0', '12', '3'), '15').dead, true);
    });
});
