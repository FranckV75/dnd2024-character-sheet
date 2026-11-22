/**
 * TESTS — BOUTON « DÉPENSER » DE LA FENÊTRE « POINTS DE FOI » (mode Odyssée)
 * Règles : js/rules/odyssey.js (spendFaith, spendLabel, spendRefusal, faithSpentMessage).
 * Fenêtre : js/ui/odyssey.js (openFaithFavors). Paliers : js/data/faith-favors.js (1, 3, 5 points).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    spendFaith, spendLabel, spendRefusal, faithSpentMessage, faithPoints, faithFavors, FAITH_SPEND
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

describe('Points de Foi : la fenêtre', () => {
    const source = readFileSync(new URL('../js/ui/odyssey.js', import.meta.url), 'utf8');
    const body = source.slice(source.indexOf('function openFaithFavors'), source.indexOf('function openFaithGods'));

    test('Un bouton par palier, grisé quand la règle refuse, avec une infobulle', () => {
        assert.match(body, /text: spendLabel\(tier\.cost\)/);
        assert.match(body, /spend\.disabled = spendFaith\(value, state\.cost\) === null;/);
        assert.match(body, /spend\.title = frenchSpaces\(refusal \|\|/);
    });

    test('Après la dépense : fenêtre mise à jour sur place, message dans la barre du haut', () => {
        const spendOn = body.slice(body.indexOf('const spendOn'));
        assert.match(spendOn, /store\.update\(\{ heroic_inspiration: next \}\);\s*update\(\);/);
        // Rappel à côté du bouton (la barre du haut est sous la fenêtre sur tablette)
        assert.match(spendOn, /entry\.done\.textContent = /);
        assert.match(spendOn, /faithSpentMessage\(tier, faithPoints\(value\), faithPoints\(next\), compact\.matches \? STATUS_ROOM : STATUS_ROOM_NARROW\)/);
    });
});
