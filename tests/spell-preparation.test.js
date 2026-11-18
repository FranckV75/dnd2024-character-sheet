/**
 * TESTS — SORTS PRÉPARÉS ET LANCEMENT D'UN SORT (js/rules/spell-preparation.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    preparesWholeList, grantedSpellKeys, spellPrepState, inCombatView, isCastable,
    castSlotOptions, useSpellSlot, wholeListSource, fitsWholeList
} from '../js/rules/spell-preparation.js';
import { spellCounts, spellNameKey, spellLimitWarnings, findSpellByName } from '../js/rules/spells.js';
import { classSpellCounts } from '../js/rules/class-progression.js';
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

describe('Sorts notés hors de la liste fixe (losange à cocher, comme avant)', () => {
    const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
    const db = Array.isArray(base) ? base : Object.values(base);
    const row = (name, prep = false) => {
        const spell = findSpellByName(db, name);
        assert.ok(spell, name);
        return { lvl: String(spell.level), name: spell.name, prep };
    };
    /** Compteur et avertissement tels que le grimoire les calcule */
    const grimoire = (record, rows) => {
        const derived = deriveCharacter(record);
        const source = wholeListSource(derived);
        const fits = (r) => fitsWholeList(r, source, findSpellByName(db, r.name));
        const granted = grantedSpellKeys(record, derived);
        const counts = spellCounts(rows, '', granted, (r) => fits(r));
        return {
            states: rows.map(r => spellPrepState(r, { wholeList: source !== null, granted, fits })),
            prepared: counts.prepared,
            warnings: spellLimitWarnings(counts, classSpellCounts(derived.classSlug, derived.level))
        };
    };

    test('Listes et plus haut niveau de la liste fixe', () => {
        assert.equal(wholeListSource(deriveCharacter({ char_class: 'Clerc', char_level: '5' })), null);
        assert.deepEqual(wholeListSource(deriveCharacter({ char_class: 'Occultiste', char_level: '11' })), { lists: ['warlock'], maxLevel: 5 });
        assert.deepEqual(wholeListSource(deriveCharacter({ char_class: 'Barde', char_level: '3' })), { lists: ['bard'], maxLevel: 2 });
        // Secrets magiques : listes du Barde, du Clerc, du Druide et du Magicien
        assert.deepEqual(wholeListSource(deriveCharacter({ char_class: 'Barde', char_level: '10' })).lists, ['bard', 'cleric', 'druid', 'wizard']);
        // Collège du Savoir : Découvertes magiques (mêmes listes, hors du compte) indiscernables
        assert.deepEqual(wholeListSource(deriveCharacter({ char_class: 'Barde', char_subclass: 'Collège du Savoir', char_level: '10' })).lists, ['bard']);
        assert.deepEqual(wholeListSource(deriveCharacter({ char_class: 'Guerrier', char_subclass: 'Chevalier occulte', char_level: '7' })), { lists: ['wizard'], maxLevel: 2 });
    });

    test('Niveau trop haut, autre liste ; nom inconnu de la base : compté', () => {
        const source = { lists: ['warlock'], maxLevel: 5 };
        assert.equal(fitsWholeList({ lvl: '1', name: 'Maléfice' }, source, findSpellByName(db, 'Maléfice')), true);
        assert.equal(fitsWholeList({ lvl: '6', name: 'Cercle de mort' }, source, findSpellByName(db, 'Cercle de mort')), false);
        assert.equal(fitsWholeList({ lvl: '1', name: 'Armure de mage' }, source, findSpellByName(db, 'Armure de mage')), false);
        assert.equal(fitsWholeList({ lvl: '2', name: 'Sort maison' }, source, null), true);
        assert.equal(fitsWholeList({ lvl: '0', name: 'Décharge occulte' }, source, null), false);
        assert.equal(fitsWholeList({ lvl: '1', name: 'Maléfice' }, null, null), false);
    });

    test('Occultiste 11 : Arcanum mystique noté ne fait plus dépasser la table', () => {
        const names = ['Maléfice', 'Trait ensorcelé', 'Bouclier', 'Ténèbres', 'Foulée brumeuse', 'Contresort',
            'Voracité de Hadar', 'Vol', 'Bannissement', 'Porte dimensionnelle', 'Scrutation'];
        const rows = [...names.map(name => row(name, true)), row('Cercle de mort')];
        const result = grimoire({ char_class: 'Occultiste', char_level: '11' }, rows);
        assert.equal(result.prepared, 11);
        assert.deepEqual(result.warnings, []);
        assert.equal(result.states.at(-1), 'unprepared');
        // Coché par le joueur : compté, comme avant
        rows[rows.length - 1] = row('Cercle de mort', true);
        assert.equal(grimoire({ char_class: 'Occultiste', char_level: '11' }, rows).prepared, 12);
    });

    test('Barde du Savoir 6 : les Découvertes magiques non cochées ne comptent pas', () => {
        const names = ['Charme-personne', 'Mot de guérison', 'Fou rire de Tasha', 'Sommeil', 'Image miroir', 'Invisibilité',
            'Motif hypnotique', 'Antidétection', 'Image majeure'];
        const rows = [...names.map(name => row(name)), row('Retour à la vie'), row('Arme spirituelle')];
        const record = { char_class: 'Barde', char_subclass: 'Collège du Savoir', char_level: '6' };
        const result = grimoire(record, rows);
        assert.deepEqual(result.states.slice(0, 9), Array(9).fill('list'));
        assert.deepEqual(result.states.slice(9), ['unprepared', 'unprepared']);
        assert.equal(result.prepared, 9);
        assert.deepEqual(result.warnings, []);
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
