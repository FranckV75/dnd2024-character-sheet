/**
 * TESTS — BOUTON « DÉPENSER » DE LA FENÊTRE « POINTS DE FOI » (mode Odyssée)
 * Règles : js/rules/odyssey.js (spendFaith, spendLabel, spendRefusal, faithSpentMessage, faithWindow, payFavor).
 * Fenêtre : js/ui/odyssey.js (openFaithFavors). Paliers : js/data/faith-favors.js (1, 3, 5 points).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    spendFaith, spendLabel, spendRefusal, faithSpentMessage, faithPoints, faithFavors, faithWindow, payFavor, FAITH_SPEND
} from '../js/rules/odyssey.js';
import { STATUS_ROOM, STATUS_ROOM_NARROW } from '../js/data/status-bar.js';
import { FAITH_FAVORS } from '../js/data/faith-favors.js';
import { isPlayField } from '../js/ui/lock.js';

const [minor, major, great] = FAITH_FAVORS;

describe('Points de Foi : dépenser (spendFaith)', () => {
    test('« N/M » : le maximum noté est gardé', () => {
        assert.equal(spendFaith('5/5', 3), '2/5');
        assert.equal(spendFaith('5/5', 5), '0/5');
        assert.equal(spendFaith(' 4 / 6 ', 1), '3/6');
    });

    test('« N » seul : reste un nombre seul', () => {
        assert.equal(spendFaith('3', 1), '2');
        assert.equal(spendFaith('3', 3), '0');
        assert.equal(spendFaith(4, 1), '3');
    });

    test('Refus (null) : case vide, points insuffisants, texte libre, coût illisible', () => {
        assert.equal(spendFaith('', 1), null);
        assert.equal(spendFaith(undefined, 1), null);
        assert.equal(spendFaith('1/4', 3), null);
        assert.equal(spendFaith('0/5', 1), null);
        assert.equal(spendFaith('2 (béni)', 1), null);
        assert.equal(spendFaith('beaucoup', 1), null);
        assert.equal(spendFaith('5', 0), null);
        assert.equal(spendFaith('5', -1), null);
        assert.equal(spendFaith('5', 1.5), null);
    });

    test('Même lecture que la fenêtre : un palier « Possible » se paie toujours', () => {
        for (const value of ['', '0', '1', '2/4', '3', '4/5', '5/5', '7', '2 (béni)']) {
            for (const tier of faithFavors(faithPoints(value))) {
                assert.equal(spendFaith(value, tier.cost) !== null, tier.missing === 0, `${value} / ${tier.cost}`);
            }
        }
    });
});

describe('Points de Foi : libellés et phrases', () => {
    test('Bouton « Dépenser N point(s) », accordé', () => {
        assert.equal(spendLabel(1), 'Dépenser 1 point');
        assert.equal(spendLabel(3), 'Dépenser 3 points');
        assert.equal(spendLabel(5), 'Dépenser 5 points');
    });

    test('Bouton grisé : la raison', () => {
        assert.equal(spendRefusal(5, 3), '');
        assert.equal(spendRefusal(1, 3), 'Il manque 2 points de Foi pour cette faveur.');
        assert.equal(spendRefusal(4, 5), 'Il manque 1 point de Foi pour cette faveur.');
        assert.match(spendRefusal(null, 1), /contient du texte/);
    });

    test('Barre du haut : faveur, points dépensés, avant → après, comment corriger', () => {
        assert.equal(faithSpentMessage(major, 5, 2), "Faveur majeure : 3 points de Foi dépensés (5 → 2). En cas d'erreur, le bouton + les rend.");
        assert.equal(faithSpentMessage(minor, 5, 4), "Faveur mineure : 1 point de Foi dépensé (5 → 4). En cas d'erreur, le bouton + le rend.");
        for (const tier of FAITH_FAVORS) {
            for (const [room, before] of [[STATUS_ROOM, 99], [STATUS_ROOM_NARROW, 99], [STATUS_ROOM_NARROW, 5]]) {
                const message = faithSpentMessage(tier, before, before - tier.cost, room);
                assert.ok(message.length <= room, `${message.length} > ${room} : ${message}`);
                assert.ok(message.startsWith(tier.title), message);
            }
        }
        assert.equal(faithSpentMessage(great, 5, 0, STATUS_ROOM_NARROW), 'Grande faveur : 5 points de Foi dépensés (5 → 0).');
    });

    test('La fenêtre parle du bouton « Dépenser », plus du bouton −', () => {
        assert.match(FAITH_SPEND, /« Dépenser »/);
        assert.doesNotMatch(FAITH_SPEND, /bouton −/);
    });

    test('Fiche verrouillée : la case des points de Foi reste un champ de jeu', () => {
        assert.equal(isPlayField('heroic_inspiration'), true);
    });
});

describe('Points de Foi : la fenêtre (faithWindow, payFavor)', () => {
    test('Un bouton par palier, utilisable quand la règle accepte, avec une infobulle', () => {
        const view = faithWindow('4/5');
        assert.equal(view.points, 4);
        assert.equal(view.intro, `Vous avez 4 points de Foi. ${FAITH_SPEND}`);
        assert.deepEqual(view.tiers.map((tier) => [tier.id, tier.status, tier.canSpend]),
            [['mineure', 'Possible', true], ['majeure', 'Possible', true], ['grande', 'Il manque 1 point', false]]);
        assert.equal(view.tiers[1].hint, 'Retire 3 points de la case des points de Foi (4 → 1).');
        assert.equal(view.tiers[2].hint, 'Il manque 1 point de Foi pour cette faveur.');
    });

    test('Case en texte libre : aucun bouton utilisable, la fenêtre le dit', () => {
        const view = faithWindow('2 (béni)');
        assert.equal(view.points, null);
        assert.match(view.intro, /contient du texte/);
        for (const tier of view.tiers) {
            assert.equal(tier.canSpend, false);
            assert.equal(tier.status, '');
            assert.match(tier.hint, /retirez les points à la main/);
        }
    });

    test('Chaque palier garde son nom (titre de la rubrique et message après la dépense)', () => {
        assert.deepEqual(faithWindow('5/5').tiers.map((tier) => tier.title), FAITH_FAVORS.map((tier) => tier.title));
        const tier = faithWindow('5/5').tiers[1];
        const paid = payFavor('5/5', tier.cost);
        assert.equal(faithSpentMessage(tier, paid.before, paid.after, STATUS_ROOM),
            "Faveur majeure : 3 points de Foi dépensés (5 → 2). En cas d'erreur, le bouton + les rend.");
    });

    test('Bouton utilisable si et seulement si la dépense est acceptée', () => {
        for (const value of ['', '0', '1', '2/4', '3', '4/5', '5/5', '7', '2 (béni)', '-1', '1234567/2']) {
            for (const tier of faithWindow(value).tiers) {
                assert.equal(tier.canSpend, payFavor(value, tier.cost) !== null, `${value} / ${tier.cost}`);
            }
        }
    });

    test('Payer : la case perd les points (maximum noté gardé), avant / après pour le message', () => {
        assert.deepEqual(payFavor('5/5', major.cost), { patch: { heroic_inspiration: '2/5' }, before: 5, after: 2 });
        assert.deepEqual(payFavor('3', minor.cost), { patch: { heroic_inspiration: '2' }, before: 3, after: 2 });
        assert.equal(payFavor('4', great.cost), null);
        assert.equal(payFavor('2 (béni)', minor.cost), null);
        // Après la dépense, la fenêtre redessinée suit la case
        const paid = payFavor('5/5', great.cost);
        assert.deepEqual(faithWindow(paid.patch.heroic_inspiration).tiers.map((tier) => tier.canSpend), [false, false, false]);
    });

    test('Branchement : la fenêtre se redessine par faithWindow et paie par payFavor', () => {
        const source = readFileSync(new URL('../js/ui/odyssey.js', import.meta.url), 'utf8');
        const body = source.slice(source.indexOf('function openFaithFavors'), source.indexOf('function openFaithGods'));
        assert.match(body, /faithWindow\(store\.get\(\)\.heroic_inspiration\)/);
        assert.match(body, /payFavor\(store\.get\(\)\.heroic_inspiration, tier\.cost\)/);
        assert.match(body, /spend\.disabled = !tier\.canSpend;/);
        // Rappel à côté du bouton (la barre du haut est sous la fenêtre sur tablette)
        assert.match(body, /entry\.done\.textContent = /);
    });
});
