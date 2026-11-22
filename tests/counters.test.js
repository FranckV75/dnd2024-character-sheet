/**
 * TESTS — COMPTEURS ET POINTS D'EXPÉRIENCE (js/rules/counters.js, js/rules/experience.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readCount, readCounter, steppedValue, stepCounter, changeCoins, COUNTER_DIGITS } from '../js/rules/counters.js';
import { inspirationWording, INSPIRATION_ONLY_ONE, faithPoints, faithReset, spendFaith, ODYSSEY_MODE_KEY } from '../js/rules/odyssey.js';
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

describe('Compteurs : une seule lecture (readCounter)', () => {
    test('Entier positif ou nul, éventuellement « /M » ; case vide = 0', () => {
        assert.deepEqual(readCounter('3'), { count: 3, max: null });
        assert.deepEqual(readCounter(' 3 / 5 '), { count: 3, max: 5 });
        assert.deepEqual(readCounter('007'), { count: 7, max: null });
        assert.deepEqual(readCounter(''), { count: 0, max: null });
        assert.deepEqual(readCounter(undefined), { count: 0, max: null });
        assert.deepEqual(readCounter(4), { count: 4, max: null });
        assert.deepEqual(readCounter('999999/999999'), { count: 999999, max: 999999 });
    });

    test('Tout le reste est du texte libre (null), même limite de chiffres des deux côtés de la barre', () => {
        assert.equal(COUNTER_DIGITS, 6);
        for (const value of ['-1', -1, 2.5, '2.5', '2 (Chanceux)', '<div>3</div>', '3/', '/3', '3/5/7',
            '1234567', '1234567/2', '2/1234567', '9999999999999999999999', 1e7, NaN, 'beaucoup']) {
            assert.equal(readCounter(value), null, String(value));
        }
    });

    test('Boutons, fenêtre des faveurs, dépense et passage de niveau lisent pareil', () => {
        for (const value of ['', '3', '3/5', ' 4 / 6 ', 0, 5, '-1', '1234567/2', '1234567', '2 (béni)', '<b>2</b>']) {
            const counter = readCounter(value);
            assert.equal(faithPoints(value), counter ? counter.count : null, `fenêtre : ${value}`);
            assert.equal(faithReset(value, 4) !== null, counter !== null, `niveau : ${value}`);
            const text = /contient du texte/.test(stepCounter(value, 1, { max: 99, label: 'Points de Foi' }).message);
            assert.equal(text, counter === null, `boutons : ${value}`);
            if (counter && counter.count >= 1) assert.notEqual(spendFaith(value, 1), null, `dépense : ${value}`);
            if (!counter) assert.equal(spendFaith(value, 1), null, `dépense : ${value}`);
        }
    });
});

describe('Compteurs : décision des boutons − / + (stepCounter, js/ui/counters.js)', () => {
    // Même réglage que la case heroic_inspiration de js/ui/counters.js
    const faith = (record) => ({ max: inspirationWording(record).max, label: inspirationWording(record).label, onlyOne: INSPIRATION_ONLY_ONE });
    const ON = {};
    const OFF = { [ODYSSEY_MODE_KEY]: 'off' };

    test('Points de Foi (mode Odyssée) : − / + d\'un point, la forme « N/M » est gardée', () => {
        assert.deepEqual(stepCounter('3', 1, faith(ON)), { value: '4', message: '' });
        assert.deepEqual(stepCounter('3', -1, faith(ON)), { value: '2', message: '' });
        assert.deepEqual(stepCounter('3/5', -1, faith(ON)), { value: '2/5', message: '' });
        assert.deepEqual(stepCounter('', 1, faith(ON)), { value: '1', message: '' });
        assert.deepEqual(stepCounter('', -1, faith(ON)), { value: '0', message: '' });
    });

    test('Points de Foi : bornes atteintes, refus sans phrase ; au-delà du plafond, « + » ne baisse jamais', () => {
        assert.deepEqual(stepCounter('5/5', 1, faith(ON)), { value: null, message: '' });
        assert.deepEqual(stepCounter('0', -1, faith(ON)), { value: null, message: '' });
        assert.deepEqual(stepCounter('99', 1, faith(ON)), { value: null, message: '' });
        assert.deepEqual(stepCounter('150', 1, faith(ON)), { value: null, message: '' });
        assert.deepEqual(stepCounter('150', -1, faith(ON)), { value: '99', message: '' });
    });

    test('« N/M » au-delà de M (« 4/3 », « 2/0 ») : « + » refusé sans rien écrire, jamais baissé', () => {
        assert.deepEqual(stepCounter('4/3', 1, faith(ON)), { value: null, message: '' });
        assert.deepEqual(stepCounter('2/0', 1, faith(ON)), { value: null, message: '' });
        assert.deepEqual(stepCounter('3/3', 1, { max: 30 }), { value: null, message: '' });
        // « − » retire un point comme ailleurs (ramené au maximum noté, comme « 150 » au plafond)
        assert.deepEqual(stepCounter('4/3', -1, faith(ON)), { value: '3/3', message: '' });
        assert.deepEqual(stepCounter('2/3', 1, faith(ON)), { value: '3/3', message: '' });
    });

    test('Texte libre : jamais réécrit, la barre du haut le dit (« -1 » et « 1234567/2 » compris)', () => {
        for (const value of ['2 (béni)', '-1', '1234567/2', '<div>3</div>']) {
            for (const delta of [-1, 1]) {
                assert.deepEqual(stepCounter(value, delta, faith(ON)),
                    { value: null, message: 'La case « Points de Foi » contient du texte : modifiez-la à la main.' }, `${value} ${delta}`);
            }
        }
    });

    test('Inspiration héroïque (mode coupé) : 0 ou 1 ; le 2e « + » est refusé avec la phrase', () => {
        assert.deepEqual(stepCounter('', 1, faith(OFF)), { value: '1', message: '' });
        assert.deepEqual(stepCounter('0', 1, faith(OFF)), { value: '1', message: '' });
        assert.deepEqual(stepCounter('1', 1, faith(OFF)), { value: null, message: INSPIRATION_ONLY_ONE });
        assert.deepEqual(stepCounter('3', 1, faith(OFF)), { value: null, message: INSPIRATION_ONLY_ONE }, 'vieille valeur : jamais baissée par +');
        assert.deepEqual(stepCounter('1', -1, faith(OFF)), { value: '0', message: '' });
        assert.deepEqual(stepCounter('0', -1, faith(OFF)), { value: null, message: '' });
        // Sans phrase prévue (renommée, épuisement), le refus est muet
        assert.deepEqual(stepCounter('1', 1, { max: 1 }), { value: null, message: '' });
    });

    test('Épuisement : enregistré en nombre (asNumber), de 0 à 6', () => {
        const fatigue = { max: 6, asNumber: true, label: 'Épuisement (0-6)' };
        assert.deepEqual(stepCounter(2, 1, fatigue), { value: 3, message: '' });
        assert.deepEqual(stepCounter('2', -1, fatigue), { value: 1, message: '' });
        assert.deepEqual(stepCounter(6, 1, fatigue), { value: null, message: '' });
        assert.deepEqual(stepCounter('', -1, fatigue), { value: 0, message: '' });
        // Forme « N/M » : reste du texte
        assert.deepEqual(stepCounter('2/6', 1, fatigue), { value: '3/6', message: '' });
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

    test('XP restants avant le niveau suivant', () => {
        const p = experienceProgress({ char_level: '6', char_xp: '21800' });
        assert.equal(p.known, true);
        assert.equal(p.nextLevel, 7);
        assert.equal(p.remaining, 1200);
        assert.equal(p.ready, false);
    });

    test('Assez d\'XP : niveau suivant prêt', () => {
        const p = experienceProgress({ char_level: '6', char_xp: '25000' });
        assert.equal(p.ready, true);
        assert.equal(p.remaining, 0);
        assert.equal(p.reachable, 7);
    });

    test('Progression par étapes (0 XP au-delà du niveau 1), texte, niveau 20 : pas de décompte', () => {
        assert.equal(experienceProgress({ char_level: '5', char_xp: '0' }).known, false);
        assert.equal(experienceProgress({ char_level: '1', char_xp: '0' }).remaining, 300);
        assert.equal(experienceProgress({ char_level: '3', char_xp: 'voir MJ' }).known, false);
        assert.equal(experienceProgress({ char_level: '20', char_xp: '400000' }).remaining, null);
        assert.equal(experienceProgress({ char_level: '<b>6</b>', char_xp: '21800' }).remaining, 1200);
    });

    test('XP gagnés', () => {
        assert.deepEqual(addExperience({ char_xp: '21800' }, '1500').patch, { char_xp: '23300' });
        assert.deepEqual(addExperience({ char_xp: '' }, '50').patch, { char_xp: '50' });
        assert.equal(addExperience({ char_xp: 'voir MJ' }, '50').ok, false);
        assert.equal(addExperience({ char_xp: '10' }, '0').ok, false);
    });

    test('Milliers séparés comme en français', () => {
        assert.equal(formatXp(23000), '23\u00a0000');
    });

    test('Phrase sous la case XP : XP restants, niveau suivant et son palier', async () => {
        const { progressText } = await import('../js/ui/experience.js');
        const say = (record) => progressText(experienceProgress(record));
        assert.equal(say({ char_level: '6', char_xp: '21800' }),
            'Encore 1\u00a0200 XP avant le niveau 7 (23\u00a0000 XP)');
        assert.equal(say({ char_level: '1', char_xp: '0' }), 'Encore 300 XP avant le niveau 2 (300 XP)');
        assert.equal(say({ char_level: '6', char_xp: '25000' }), 'XP du niveau 7 atteints');
        assert.equal(say({ char_level: '5', char_xp: '0' }), '');
        assert.equal(say({ char_level: '20', char_xp: '400000' }), '');
        assert.doesNotMatch(say({ char_level: '19', char_xp: '300000' }), /PX/);
    });
});

describe('Relecture : formats écrits par les joueurs', () => {
    test('XP avec mise en forme v3, milliers, « XP/seuil »', async () => {
        const { readXp } = await import('../js/rules/experience.js');
        assert.equal(readXp('<font size="5">2930</font>'), 2930);
        assert.equal(readXp('4990/6500'), 4990);
        assert.equal(readXp('1 200'), 1200);
        assert.equal(readXp('1\u00a0200'), 1200);
        assert.equal(readXp('voir MJ'), null);
        assert.deepEqual(addExperience({ char_xp: '4990/6500' }, '100').patch, { char_xp: '5090' });
        assert.equal(experienceProgress({ char_level: '4', char_xp: '<b>4990/6500</b>' }).remaining, 1510);
    });

    test('XP négatifs : comptés comme 0', () => {
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
