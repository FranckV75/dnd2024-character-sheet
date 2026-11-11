/**
 * TESTS — APPUI LONG SUR − / + (js/ui/stepper.js)
 * Le rythme de la répétition compte depuis le début de chaque pas : sur une tablette lente,
 * le temps d'affichage de la fiche ne doit pas s'ajouter à l'attente (audit vitesse : 34 PV
 * temporaires en 4 s au lieu de 48 avec un processeur ralenti).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { repeatDelay } from '../js/ui/stepper.js';

describe('Appui long : attente avant le pas suivant', () => {
    test('Pas instantané : 140 ms au début, puis 50 ms après 8 pas', () => {
        assert.equal(repeatDelay(1, 0), 140);
        assert.equal(repeatDelay(7, 0), 140);
        assert.equal(repeatDelay(8, 0), 50);
        assert.equal(repeatDelay(30, 0), 50);
    });

    test('Le temps passé à afficher le pas est déduit de l\'attente', () => {
        assert.equal(repeatDelay(10, 20), 30);
        assert.equal(repeatDelay(2, 40), 100);
    });

    test('Pas plus long que le rythme : pas suivant aussitôt, jamais d\'attente négative', () => {
        assert.equal(repeatDelay(10, 80), 0);
        assert.equal(repeatDelay(10, -5), 50);
    });
});
