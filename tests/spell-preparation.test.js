/**
 * TESTS — SORTS PRÉPARÉS ET LANCEMENT D'UN SORT (js/rules/spell-preparation.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    preparesWholeList, grantedSpellKeys, spellPrepState, inCombatView, isCastable,
    castSlotOptions, useSpellSlot
} from '../js/rules/spell-preparation.js';
import { spellCounts, spellNameKey } from '../js/rules/spells.js';
import { deriveCharacter } from '../js/rules/character.js';

describe('Classes à liste fixe (préparation au passage de niveau)', () => {
    test('Barde, Ensorceleur, Occultiste, Chevalier occulte et Arnaqueur arcanique', () => {
        for (const slug of ['bard', 'sorcerer', 'warlock']) assert.equal(preparesWholeList(slug), true, slug);
        // Repos long : le joueur choisit ses sorts préparés (losange à cocher)
        for (const slug of ['cleric', 'druid', 'wizard', 'paladin', 'ranger', '']) assert.equal(preparesWholeList(slug), false, slug);
        assert.equal(preparesWholeList('fighter', 'eldritch_knight'), true);
        assert.equal(preparesWholeList('rogue', 'arcane_trickster'), true);
        assert.equal(preparesWholeList('fighter', 'champion'), false);
    });

    test('Losange : calcul d\'affichage, la valeur « prep » de la fiche n\'est jamais lue pour une liste fixe', () => {
        const granted = new Set([spellNameKey('Contact avec les plans')]);
        assert.equal(spellPrepState({ lvl: '0', name: 'Décharge occulte' }, { wholeList: true }), 'cantrip');
        assert.equal(spellPrepState({ lvl: '1', name: 'Maléfice', prep: false }, { wholeList: true }), 'list');
        assert.equal(spellPrepState({ lvl: '1', name: 'Maléfice', prep: true }, { wholeList: true }), 'list');
        assert.equal(spellPrepState({ lvl: '5', name: 'contact avec les plans', prep: false }, { wholeList: true, granted }), 'granted');
        // Classe à préparation : les anciens losanges enregistrés reprennent leur sens
        assert.equal(spellPrepState({ lvl: '1', name: 'Maléfice', prep: true }), 'prepared');
        assert.equal(spellPrepState({ lvl: '1', name: 'Maléfice', prep: false }), 'unprepared');
        assert.equal(spellPrepState({ lvl: '1', name: 'Maléfice' }), 'unprepared');
        assert.equal(spellPrepState({ lvl: '5', name: 'Contact avec les plans', prep: false }, { granted }), 'granted');
        // Niveau vide (ancienne sauvegarde) : lu comme un sort mineur, comme le reste du grimoire
        assert.equal(spellPrepState({ lvl: '', name: 'Bouclier', prep: true }), 'cantrip');
    });

    test('Compteur : tous les sorts de niveau 1+ notés comptent, sauf les sorts donnés', () => {
        const rows = [
            { lvl: '0', name: 'Moquerie cruelle' },
            { lvl: '1', name: 'Charme-personne', prep: false },
            { lvl: '1', name: 'Mot de guérison', prep: true },
            { lvl: '2', name: 'Invisibilité' },
            { lvl: '9', name: 'Mot de pouvoir mortel', prep: false },
            { lvl: '', name: '', time: '', range: '' }
        ];
        const granted = new Set([spellNameKey('Mot de pouvoir mortel')]);
        assert.deepEqual(spellCounts(rows, '', granted, true), { total: 5, visible: 5, prepared: 3, cantrips: 1 });
        // Même grimoire chez une classe à préparation : seuls les losanges cochés
        assert.deepEqual(spellCounts(rows, '', granted), { total: 5, visible: 5, prepared: 1, cantrips: 1 });
    });

    test('Vue au combat et bouton « Lancer »', () => {
        assert.deepEqual(['cantrip', 'granted', 'list', 'prepared', 'unprepared'].map(inCombatView), [true, true, true, true, false]);
        assert.deepEqual(['cantrip', 'granted', 'list', 'prepared', 'unprepared'].map(isCastable), [false, true, true, true, false]);
    });
});

describe('Sorts donnés hors du compte', () => {
    test('Classe, sous-classe, dons', () => {
        const paladin = deriveCharacter({ char_class: 'Paladin', char_level: '5' });
        const keys = grantedSpellKeys({ char_class: 'Paladin', char_level: '5' }, paladin);
        assert.ok(keys.has(spellNameKey('Châtiment divin')));
        assert.ok(keys.has(spellNameKey('Appel de destrier')));
    });

    test('Cercle de la Terre : sans terrain choisi, aucun sort de terrain n\'est retiré du compte', () => {
        const record = { char_class: 'Druide', char_subclass: 'Cercle de la Terre', char_level: '5' };
        const derived = deriveCharacter(record);
        assert.equal(derived.subclass, 'circle_of_the_land');
        const keys = grantedSpellKeys(record, derived);
        assert.ok(keys.has(spellNameKey('Communication avec les animaux')));
        assert.ok(!keys.has(spellNameKey('Sommeil')));
        assert.ok(!keys.has(spellNameKey('Boule de feu')));
        // Terre aride choisie : ses sorts seulement
        const chosen = { ...record, subclass_choices: { circle_of_the_land: { land: 'arid' } } };
        const arid = grantedSpellKeys(chosen, deriveCharacter(chosen));
        assert.ok(arid.has(spellNameKey('Boule de feu')));
        assert.ok(!arid.has(spellNameKey('Sommeil')));
    });
});

describe('Lancer un sort', () => {
    test('Niveaux possibles : celui du sort et au-dessus, avec les emplacements restants', () => {
        const slots = { 1: 4, 2: 3, 3: 2 };
        const state = { 2: { used: 3 }, 3: { used: 1 } };
        assert.deepEqual(castSlotOptions(2, slots, 'wizard', state), [
            { level: '2', left: 0, max: 3, pact: false },
            { level: '3', left: 1, max: 2, pact: false }
        ]);
        assert.deepEqual(castSlotOptions('1', slots, 'wizard', {}).map(o => o.level), ['1', '2', '3']);
        // Aucun emplacement assez haut
        assert.deepEqual(castSlotOptions(4, slots, 'wizard', {}), []);
        // Emplacement ajouté à la main (multiclasse, Arcanum…), et niveau ramené à 0
        assert.deepEqual(castSlotOptions(3, slots, 'wizard', { 4: { max: 1, used: 0 }, 3: { max: 0 } }),
            [{ level: '4', left: 1, max: 1, pact: false }]);
    });

    test('Occultiste : un sort de niveau 1 se lance avec un emplacement de pacte', () => {
        assert.deepEqual(castSlotOptions(1, { 3: 2 }, 'warlock', { 3: { used: 1 } }),
            [{ level: '3', left: 1, max: 2, pact: true }]);
    });

    test('Cocher un emplacement ; rien quand il n\'en reste aucun', () => {
        assert.deepEqual(useSpellSlot({}, 2, 3), { 2: { used: 1 } });
        assert.deepEqual(useSpellSlot({ 2: { used: 1 }, 1: { used: 4 } }, 2, 3), { 2: { used: 2 }, 1: { used: 4 } });
        assert.equal(useSpellSlot({ 2: { used: 3 } }, 2, 3), null);
        assert.equal(useSpellSlot({}, 5, 0), null);
        // Le maximum réglé à la main est respecté
        assert.deepEqual(useSpellSlot({ 4: { max: 1, used: 0 } }, 4, 0), { 4: { max: 1, used: 1 } });
        // L'ancien état n'est pas modifié
        const state = { 1: { used: 0 } };
        useSpellSlot(state, 1, 2);
        assert.deepEqual(state, { 1: { used: 0 } });
    });
});
