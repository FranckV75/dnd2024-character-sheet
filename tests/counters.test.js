/**
 * TESTS — COMPTEURS ET POINTS D'EXPÉRIENCE (js/rules/counters.js, js/rules/experience.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readCount, steppedValue, changeCoins } from '../js/rules/counters.js';
import { experienceProgress, addExperience, XP_THRESHOLDS, formatXp } from '../js/rules/experience.js';

describe('Compteurs : boutons − / +', () => {
    test('Lecture : entier seul, case vide = 0, texte = rien', () => {
        assert.equal(readCount('12'), 12);
        assert.equal(readCount(' 3 '), 3);
        assert.equal(readCount(''), 0);
        assert.equal(readCount(4), 4);
        assert.equal(readCount('2 (Chanceux)'), null);
        assert.equal(readCount(2.5), null);
    });

    test('Pas entre deux bornes ; borne atteinte : rien', () => {
        assert.equal(steppedValue('3', 1, { max: 6 }), 4);
        assert.equal(steppedValue(6, 1, { max: 6 }), null);
        assert.equal(steppedValue('0', -1), null);
        assert.equal(steppedValue('', 1), 1);
        assert.equal(steppedValue('', -1), 0);
        assert.equal(steppedValue('2 (Chanceux)', 1), null);
        assert.equal(steppedValue('25', 1, { max: 20 }), 20);
    });
});

describe('Bourse', () => {
    test('Gagner et dépenser', () => {
        assert.deepEqual(changeCoins({ gp: '12' }, 'gp', '30', 1).patch, { gp: '42' });
        assert.deepEqual(changeCoins({ gp: '12' }, 'gp', '5', -1).patch, { gp: '7' });
        assert.deepEqual(changeCoins({ sp: '' }, 'sp', '4', 1).patch, { sp: '4' });
    });

    test('Dépense trop grande, texte, pièce ou montant invalides : refusés', () => {
        assert.match(changeCoins({ gp: '3' }, 'gp', '5', -1).reason, /vous en avez 3/);
        assert.equal(changeCoins({ gp: 'beaucoup' }, 'gp', '5', 1).ok, false);
        assert.equal(changeCoins({ gp: '3' }, 'xx', '5', 1).ok, false);
        assert.equal(changeCoins({ gp: '3' }, 'gp', '0', 1).ok, false);
    });
});

describe('Points d\'expérience', () => {
    test('Seuils du manuel', () => {
        assert.equal(XP_THRESHOLDS[2], 300);
        assert.equal(XP_THRESHOLDS[7], 23000);
        assert.equal(XP_THRESHOLDS[20], 355000);
    });

    test('PX restants avant le niveau suivant', () => {
        const p = experienceProgress({ char_level: '6', char_xp: '21800' });
        assert.equal(p.known, true);
        assert.equal(p.nextLevel, 7);
        assert.equal(p.remaining, 1200);
        assert.equal(p.ready, false);
    });

    test('Assez de PX : niveau suivant prêt', () => {
        const p = experienceProgress({ char_level: '6', char_xp: '25000' });
        assert.equal(p.ready, true);
        assert.equal(p.remaining, 0);
        assert.equal(p.reachable, 7);
    });

    test('Progression par étapes (0 PX au-delà du niveau 1), texte, niveau 20 : pas de décompte', () => {
        assert.equal(experienceProgress({ char_level: '5', char_xp: '0' }).known, false);
        assert.equal(experienceProgress({ char_level: '1', char_xp: '0' }).remaining, 300);
        assert.equal(experienceProgress({ char_level: '3', char_xp: 'voir MJ' }).known, false);
        assert.equal(experienceProgress({ char_level: '20', char_xp: '400000' }).remaining, null);
        assert.equal(experienceProgress({ char_level: '<b>6</b>', char_xp: '21800' }).remaining, 1200);
    });

    test('PX gagnés', () => {
        assert.deepEqual(addExperience({ char_xp: '21800' }, '1500').patch, { char_xp: '23300' });
        assert.deepEqual(addExperience({ char_xp: '' }, '50').patch, { char_xp: '50' });
        assert.equal(addExperience({ char_xp: 'voir MJ' }, '50').ok, false);
        assert.equal(addExperience({ char_xp: '10' }, '0').ok, false);
    });

    test('Milliers séparés comme en français', () => {
        assert.equal(formatXp(23000), '23\u00a0000');
    });
});

describe('Relecture : formats écrits par les joueurs', () => {
    test('PX avec mise en forme v3, milliers, « PX/seuil »', async () => {
        const { readXp } = await import('../js/rules/experience.js');
        assert.equal(readXp('<font size="5">2930</font>'), 2930);
        assert.equal(readXp('4990/6500'), 4990);
        assert.equal(readXp('1 200'), 1200);
        assert.equal(readXp('1\u00a0200'), 1200);
        assert.equal(readXp('voir MJ'), null);
        assert.deepEqual(addExperience({ char_xp: '4990/6500' }, '100').patch, { char_xp: '5090' });
        assert.equal(experienceProgress({ char_level: '4', char_xp: '<b>4990/6500</b>' }).remaining, 1510);
    });

    test('PX négatifs : comptés comme 0', () => {
        const outcome = addExperience({ char_xp: '-50' }, '100');
        assert.equal(outcome.before, 0);
        assert.deepEqual(outcome.patch, { char_xp: '100' });
    });

    test('Inspiration « N/M » : le pas change N entre 0 et M', () => {
        assert.equal(steppedValue('3/3', -1), '2/3');
        assert.equal(steppedValue('0/3', 1), '1/3');
        assert.equal(steppedValue('3/3', 1), null);
        assert.equal(steppedValue('0/3', -1), null);
    });

    test('Nombre géant : traité comme du texte', () => {
        assert.equal(readCount('9999999999999999999999'), null);
        assert.equal(steppedValue('9999999999999999999999', 1), null);
    });
});
