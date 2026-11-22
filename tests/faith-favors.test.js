/**
 * TESTS — FENÊTRE « POINTS DE FOI » (mode Odyssée)
 * Données : js/data/faith-favors.js (guide du MJ de l'Odyssée, p. 92, résumé avec nos mots).
 * Règles : js/rules/odyssey.js (faithPoints, faithFavors, faithPointsSentence, pointsWord).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FAITH_FAVORS, FAITH_WAYS, FAITH_FOOTNOTE, FAITH_GODS, FAITH_GODS_INTRO, FAITH_SPELL_NOTE } from '../js/data/faith-favors.js';
import { faithPoints, faithFavors, faithPointsSentence, pointsWord, payFavor, FAITH_SPEND } from '../js/rules/odyssey.js';

describe('Points de Foi : les faveurs du guide', () => {
    test('trois paliers, à 1, 3 et 5 points, du moins cher au plus cher', () => {
        assert.deepEqual(FAITH_FAVORS.map((tier) => [tier.id, tier.cost]), [['mineure', 1], ['majeure', 3], ['grande', 5]]);
        assert.deepEqual(FAITH_FAVORS.map((tier) => tier.uses.length), [6, 6, 4]);
    });

    test('chaque usage est une phrase complète, sans doublon', () => {
        const all = FAITH_FAVORS.flatMap((tier) => tier.uses);
        assert.equal(new Set(all).size, all.length);
        for (const use of all) {
            assert.match(use, /^[^a-z].*\.$/, use);
            assert.ok(use.length <= 160, use);
        }
    });

    test('prière et sacrifice, puis le rappel sur le domaine du dieu', () => {
        assert.deepEqual(FAITH_WAYS.map((way) => way.title), ['Prière', 'Sacrifice']);
        assert.match(FAITH_WAYS[0].text, /même tour/);
        assert.match(FAITH_WAYS[1].text, /Un par jour/);
        assert.match(FAITH_FOOTNOTE, /domaine du dieu/);
        assert.match(FAITH_SPEND, /1, 3 ou 5 points/);
    });

    test('données figées', () => {
        assert.ok(Object.isFrozen(FAITH_FAVORS) && FAITH_FAVORS.every((tier) => Object.isFrozen(tier) && Object.isFrozen(tier.uses)));
        assert.ok(Object.isFrozen(FAITH_WAYS));
    });
});

describe('Points de Foi : ce que la case permet', () => {
    test('lecture de la case : « 3 », « 3/5 », vide, texte libre', () => {
        assert.equal(faithPoints('3'), 3);
        assert.equal(faithPoints(' 3 / 5 '), 3);
        assert.equal(faithPoints(''), 0);
        assert.equal(faithPoints(undefined), 0);
        assert.equal(faithPoints(4), 4);
        assert.equal(faithPoints('2 (béni)'), null);
    });

    test('ce qu\'il manque pour chaque palier', () => {
        assert.deepEqual(faithFavors(3).map((tier) => [tier.missing, tier.status]),
            [[0, 'Possible'], [0, 'Possible'], [2, 'Il manque 2 points']]);
        assert.deepEqual(faithFavors(0).map((tier) => tier.status),
            ['Il manque 1 point', 'Il manque 3 points', 'Il manque 5 points']);
        assert.deepEqual(faithFavors(7).map((tier) => tier.missing), [0, 0, 0]);
    });

    test('texte libre : aucun palier n\'est jugé', () => {
        assert.deepEqual(faithFavors(null).map((tier) => [tier.missing, tier.status]), [[null, ''], [null, ''], [null, '']]);
    });

    test('les paliers renvoyés gardent leurs usages', () => {
        const tiers = faithFavors(5);
        assert.deepEqual(tiers.map((tier) => tier.uses), FAITH_FAVORS.map((tier) => tier.uses));
    });

    test('phrases : points de la case, singulier et pluriel', () => {
        assert.equal(pointsWord(1), '1 point');
        assert.equal(pointsWord(3), '3 points');
        assert.equal(faithPointsSentence(1), 'Vous avez 1 point de Foi.');
        assert.equal(faithPointsSentence(4), 'Vous avez 4 points de Foi.');
        assert.match(faithPointsSentence(0), /aucun point de Foi/);
        assert.match(faithPointsSentence(null), /contient du texte/);
    });
});

describe('Points de Foi : la fenêtre (js/ui/odyssey.js)', () => {
    const source = readFileSync(new URL('../js/ui/odyssey.js', import.meta.url), 'utf8');

    test('la pastille ouvre la fenêtre, seulement en mode Odyssée', () => {
        assert.match(source, /'aria-haspopup': 'dialog'/);
        assert.match(source, /if \(odysseyActive\([^)]*\)\) openFaithFavors\(/);
    });

    test('la fenêtre se ferme par un seul bouton ; elle n\'écrit que les points dépensés (règle payFavor)', () => {
        const body = source.slice(source.indexOf('function openFaithFavors'), source.indexOf('function openFaithGods'));
        assert.match(body, /label: 'Fermer'/);
        // Une seule écriture : le résultat de la règle (son comportement : tests/faith-spend.test.js)
        assert.deepEqual(body.match(/store\.(update|set|replace)\([^;]*;/g), ['store.update(paid.patch);']);
        assert.deepEqual(Object.keys(payFavor('3/5', 1).patch), ['heroic_inspiration']);
    });

    test('la fenêtre des dieux ne modifie pas la fiche', () => {
        const gods = source.slice(source.indexOf('function openFaithGods'));
        assert.doesNotMatch(gods, /store\./);
    });
});

describe('Points de Foi : les dieux de Thyléa', () => {
    const gods = FAITH_GODS.flatMap((group) => group.gods);

    test('titans, Cinq Dieux, puis Narsus (fiche de la table)', () => {
        assert.deepEqual(FAITH_GODS.map((group) => group.gods.map((god) => god.name)), [
            ['Thyléa', 'Kentimane', 'Sydon', 'Luthéria'],
            ['Mytros', 'Volkan', 'Pythor', 'Kyrah', 'Vallus'],
            ['Narsus']
        ]);
    });

    test('domaines et alignements du tableau du guide du joueur', () => {
        const byName = Object.fromEntries(gods.map((god) => [god.name, [god.domains, god.alignment]]));
        assert.deepEqual(byName.Mytros, ['Lumière, Vie', 'Loyal bon']);
        assert.deepEqual(byName.Sydon, ['Tempête', 'Loyal mauvais']);
        assert.deepEqual(byName.Luthéria, ['Mort', 'Chaotique mauvais']);
        assert.deepEqual(byName.Kyrah, ['Ruse', 'Chaotique bon']);
        assert.deepEqual(byName.Narsus, ['', '']);
    });

    test('chaque dieu a une présentation et des faveurs en phrase complète', () => {
        for (const god of gods) {
            assert.match(god.about, /[.…]$/, god.name);
            assert.match(god.favors, /^[^a-z].*[.…]$/, god.name);
            assert.ok(god.about.length <= 170, `${god.name} : ${god.about.length}`);
        }
    });

    test('les faveurs marquées * ont leur renvoi', () => {
        assert.ok(gods.some((god) => god.favors.includes('*')));
        assert.match(FAITH_SPELL_NOTE, /^\* Même effet que le sort/);
        assert.match(FAITH_GODS_INTRO, /domaine/);
    });

    test('données figées', () => {
        assert.ok(Object.isFrozen(FAITH_GODS) && FAITH_GODS.every((group) => Object.isFrozen(group.gods) && group.gods.every(Object.isFrozen)));
    });

    test('la fenêtre des points de Foi ouvre celle des dieux, qui revient par « Retour »', () => {
        const source = readFileSync(new URL('../js/ui/odyssey.js', import.meta.url), 'utf8');
        assert.match(source, /text: 'Les dieux de Thyléa'/);
        assert.match(source, /on: \{ click: openFaithGods \}/);
        assert.match(source, /actions: \[\{ label: 'Retour', primary: true \}\]/);
    });
});

test('Dieux : nom complet tel que dans le guide (« Kentimane aux Cent Bras », sans virgule)', () => {
    const full = FAITH_GODS.flatMap((group) => group.gods).map((god) => god.full);
    assert.ok(full.includes('Kentimane aux Cent Bras'));
    assert.ok(full.includes('Sydon, le Seigneur des Tempêtes'));
    assert.ok(FAITH_GODS.flatMap((group) => group.gods).every((god) => god.full.startsWith(god.name)));
});
