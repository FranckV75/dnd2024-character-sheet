/**
 * TESTS — STATISTIQUES CALCULÉES PARTAGÉES (js/ui/derived.js)
 * Une frappe recalculait deriveCharacter() 7 fois (un calcul par bloc de l'interface) : il est
 * maintenant fait une fois par version du personnage. Le résultat doit rester celui de
 * deriveCharacter, et suivre chaque modification de la fiche.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { derivedOf } from '../js/ui/derived.js';
import { deriveCharacter } from '../js/rules/character.js';
import { createStore } from '../js/state/store.js';
import { createDefaultCharacter } from '../js/state/schema.js';

describe('derivedOf : un calcul par version du personnage', () => {
    test('Même personnage : même résultat, calculé une seule fois', () => {
        const character = { ...createDefaultCharacter(), char_class: 'Barbare', char_level: 4, str_score: 17 };
        const first = derivedOf(character);
        assert.equal(derivedOf(character), first);
        assert.deepEqual(first, deriveCharacter(character));
    });

    test('Chaque modification du store donne un personnage neuf : le calcul suit', () => {
        const store = createStore({ ...createDefaultCharacter(), char_class: 'Barbare', char_level: 4, str_score: 10 });
        const before = derivedOf(store.get());
        assert.equal(before.mods.str, 0);
        store.update({ str_score: 18 });
        const after = derivedOf(store.get());
        assert.notEqual(after, before);
        assert.equal(after.mods.str, 4);
        // L'ancienne version garde son propre calcul
        assert.equal(before.mods.str, 0);
        // Fiche remplacée : nouveau calcul aussi
        store.replace({ ...store.get(), char_level: 5 });
        assert.equal(derivedOf(store.get()).pb, 3);
    });

    test('Valeur inattendue (aucun personnage) : même résultat que deriveCharacter, sans erreur', () => {
        assert.deepEqual(derivedOf(undefined), deriveCharacter(undefined));
    });
});
