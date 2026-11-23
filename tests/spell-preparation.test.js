/**
 * TESTS — SORTS PRÉPARÉS ET LANCEMENT D'UN SORT (js/rules/spell-preparation.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    preparesWholeList, grantedSpellKeys, spellPrepState, inCombatView, isCastable,
    castSlotOptions, useSpellSlot, wholeListSource, fitsWholeList, highestSlotLevel,
    SPELL_PREPARATION, WHOLE_LIST_CLASSES, preparesFromClassList, longRestPreparation, preparationView,
    prepareSpellRows, unprepareSpellRows, setRowPrepared, matchesSpellQuery,
    replacesOneSpell, preparedSpellNames, preparationSwap,
    highestUsableSlot, mysticArcanumLevel, missingSlotLevel, missingSlotText, combatPlace, isArcanumSpellLevel, arcanumCastText
} from '../js/rules/spell-preparation.js';
import { EMPTY_SPELL } from '../js/state/schema.js';
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

describe('Vue « au combat » : place de chaque ligne', () => {
    test('Tableau pour les sorts prêts à lancer, ligne « Rituels du livre » pour les rituels non préparés', () => {
        for (const state of ['cantrip', 'prepared', 'list', 'granted']) assert.equal(combatPlace(state), 'table', state);
        assert.equal(combatPlace('ritual'), 'rituals');
        assert.equal(combatPlace('unprepared'), 'hidden');
        // Un rituel rangé sous la ligne repliable garde son bouton « Lancer »
        assert.equal(isCastable('ritual'), true);
        // Magicien : un rituel PRÉPARÉ reste dans le tableau ; non préparé, il passe sous la ligne
        const bookRitual = () => true;
        assert.equal(combatPlace(spellPrepState({ lvl: '1', name: 'Détection de la magie', r: true, prep: true }, { bookRitual })), 'table');
        assert.equal(combatPlace(spellPrepState({ lvl: '1', name: 'Détection de la magie', r: true, prep: false }, { bookRitual })), 'rituals');
        // Autre classe (pas de Savoir rituel) : un rituel non préparé ne se lance pas
        assert.equal(combatPlace(spellPrepState({ lvl: '1', name: 'Détection de la magie', r: true, prep: false })), 'hidden');
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

describe('Préparation des sorts par classe (chap. 7, table « Spell Preparation by Class »)', () => {
    test('Quand et combien de sorts changer', () => {
        assert.deepEqual(SPELL_PREPARATION.cleric, { change: 'long_rest', count: 'any', from: 'class' });
        assert.deepEqual(SPELL_PREPARATION.druid, { change: 'long_rest', count: 'any', from: 'class' });
        assert.deepEqual(SPELL_PREPARATION.paladin, { change: 'long_rest', count: 'one', from: 'class' });
        assert.deepEqual(SPELL_PREPARATION.ranger, { change: 'long_rest', count: 'one', from: 'class' });
        assert.deepEqual(SPELL_PREPARATION.wizard, { change: 'long_rest', count: 'any', from: 'spellbook' });
        for (const slug of ['bard', 'sorcerer', 'warlock']) assert.deepEqual(SPELL_PREPARATION[slug], { change: 'level', count: 'one', from: 'class' }, slug);
        // Les classes à liste fixe de la v4 sont exactement celles qui changent au passage de niveau
        const byLevel = Object.entries(SPELL_PREPARATION).filter(([, rule]) => rule.change === 'level').map(([slug]) => slug);
        assert.deepEqual(byLevel.sort(), [...WHOLE_LIST_CLASSES].sort());
    });

    test('Fenêtre « Préparer mes sorts » : Clerc, Druide, Paladin, Rôdeur', () => {
        for (const slug of ['cleric', 'druid', 'paladin', 'ranger']) assert.equal(preparesFromClassList(slug), true, slug);
        for (const slug of ['wizard', 'bard', 'sorcerer', 'warlock', 'fighter', 'barbarian', '']) assert.equal(preparesFromClassList(slug), false, slug);
    });

    test('Rappel de fin de repos long', () => {
        assert.equal(longRestPreparation('cleric').window, true);
        assert.match(longRestPreparation('druid').text, /autant que vous voulez/);
        assert.equal(longRestPreparation('paladin').window, true);
        assert.match(longRestPreparation('ranger').text, /un seul de vos sorts préparés/);
        assert.deepEqual(longRestPreparation('wizard'), { text: 'Vous pouvez changer vos sorts préparés parmi ceux de votre grimoire.', window: false });
        for (const slug of ['bard', 'sorcerer', 'warlock', 'fighter', '']) assert.equal(longRestPreparation(slug), null, slug);
    });

    test('Plus haut emplacement de la table', () => {
        assert.equal(highestSlotLevel({ 1: 4, 2: 2 }), 2);
        assert.equal(highestSlotLevel({ 1: 4, 2: 3, 3: 0 }), 2);
        assert.equal(highestSlotLevel({}), 0);
        assert.equal(highestSlotLevel(null), 0);
        assert.equal(highestSlotLevel(deriveCharacter({ char_class: 'Clerc', char_level: '3' }).spellSlots), 2);
        assert.equal(highestSlotLevel(deriveCharacter({ char_class: 'Paladin', char_level: '5' }).spellSlots), 2);
    });
});


describe('Fenêtre « Préparer mes sorts »', () => {
    const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
    const db = Array.isArray(base) ? base : Object.values(base);
    const spell = (name) => {
        const found = findSpellByName(db, name);
        assert.ok(found, name);
        return found;
    };
    const row = (name, prep = false, extra = {}) => ({ ...EMPTY_SPELL, lvl: String(spell(name).level), name, prep, ...extra });

    test('Liste du Clerc 3 : niveaux 1 et 2, rangés par nom, sorts de domaine repérés', () => {
        const record = { char_class: 'Clerc', char_subclass: 'Domaine de la Vie', char_level: '3' };
        const derived = deriveCharacter(record);
        const granted = grantedSpellKeys(record, derived);
        const rows = [row('Lumière'), row('Mot de guérison', true), row('Bénédiction', true), row('Rayon traçant')];
        const view = preparationView(rows, db, { classSlug: 'cleric', maxLevel: highestSlotLevel(derived.spellSlots), granted });
        assert.deepEqual(view.groups.map(group => group.level), [1, 2]);
        const level1 = view.groups[0].items;
        assert.ok(level1.every(item => item.spell.level === 1 && item.spell.classes.includes('cleric')));
        const names = level1.map(item => item.name);
        assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'fr')));
        const state = (name) => view.groups.flatMap(group => group.items).find(item => item.name === name)?.state;
        assert.equal(state('Mot de guérison'), 'prepared');
        assert.equal(state('Rayon traçant'), 'unprepared');
        // Domaine de la Vie : Bénédiction et Soins toujours préparés (hors du compte), même cochés au grimoire
        assert.equal(state('Bénédiction'), 'granted');
        assert.equal(state('Soins'), 'granted');
        assert.equal(state('Aide'), 'granted');
        // Pas de sort de niveau 3 au niveau 3, pas de sort mineur
        assert.equal(state('Lumière'), undefined);
        assert.equal(state('Esprits gardiens'), undefined);
        assert.deepEqual(view.others, []);
    });

    test('Autres sorts préparés du grimoire : autre liste, niveau trop haut, nom inconnu', () => {
        const rows = [
            row('Projectile magique', true),
            row('Esprits gardiens', true),
            { ...EMPTY_SPELL, lvl: '1', name: 'Sort maison', prep: true },
            row('Bouclier', false),
            { ...EMPTY_SPELL, lvl: '0', name: 'Flamme sacrée', prep: true }
        ];
        const view = preparationView(rows, db, { classSlug: 'cleric', maxLevel: 2 });
        assert.deepEqual(view.others, [
            { index: 0, name: 'Projectile magique', level: 1 },
            { index: 1, name: 'Esprits gardiens', level: 3 },
            { index: 2, name: 'Sort maison', level: 1 }
        ]);
    });

    test('Nom anglais ou variante notés au grimoire : le sort est reconnu', () => {
        const rows = [{ ...EMPTY_SPELL, lvl: '1', name: 'Bless', prep: true }];
        const view = preparationView(rows, db, { classSlug: 'cleric', maxLevel: 1 });
        assert.equal(view.groups[0].items.find(item => item.name === 'Bénédiction').state, 'prepared');
        assert.deepEqual(view.others, []);
    });

    test('Cocher : sort déjà noté (prep à true) ou ajouté depuis la base', () => {
        const rows = [row('Lumière'), row('Soins', false, { note: 'à garder' })];
        const already = prepareSpellRows(rows, spell('Soins'), db, EMPTY_SPELL);
        assert.equal(already.added, null);
        assert.deepEqual(already.rows[1], { ...rows[1], prep: true });
        assert.equal(rows[1].prep, false, 'l\'ancien tableau n\'est pas modifié');
        // Déjà préparé : rien ne change
        assert.equal(prepareSpellRows(already.rows, spell('Soins'), db, EMPTY_SPELL).rows, already.rows);
        // Absent : ajouté à la fin, rempli comme l'auto-complétion, préparé
        const added = prepareSpellRows(rows, spell('Rayon traçant'), db, EMPTY_SPELL);
        assert.equal(added.rows.length, 3);
        assert.deepEqual(added.rows[2], added.added);
        assert.deepEqual(added.added, {
            ...EMPTY_SPELL, lvl: '1', name: 'Rayon traçant', school: spell('Rayon traçant').school,
            time: spell('Rayon traçant').castTime, range: spell('Rayon traçant').range,
            note: 'Guiding Bolt', c: false, r: false, m: false, prep: true
        });
        // Mêmes clés v3 que EMPTY_SPELL, aucune nouvelle
        assert.deepEqual(Object.keys(added.added).sort(), Object.keys(EMPTY_SPELL).sort());
    });

    test('Cocher un sort noté sans niveau (vieille fiche v3) : son niveau est complété depuis la base', () => {
        const granted = new Set();
        for (const lvl of ['', '0']) {
            const rows = [{ ...EMPTY_SPELL, lvl, name: "Peau d'écorce", note: 'ma note' }];
            const before = preparationView(rows, db, { classSlug: 'druid', maxLevel: 2, granted });
            assert.equal(before.groups[1].items.find(item => item.name === "Peau d'écorce").state, 'unprepared');
            const { rows: next, added } = prepareSpellRows(rows, spell("Peau d'écorce"), db, EMPTY_SPELL);
            assert.equal(added, null, 'la ligne existante est reprise, pas de doublon');
            assert.deepEqual(next[0], { ...rows[0], lvl: '2', prep: true });
            const after = preparationView(next, db, { classSlug: 'druid', maxLevel: 2, granted });
            assert.equal(after.groups[1].items.find(item => item.name === "Peau d'écorce").state, 'prepared');
            assert.equal(spellCounts(next, '', granted).prepared, 1);
        }
        // Déjà cochée (prep: true) mais sans niveau : le niveau est complété aussi
        const hidden = [{ ...EMPTY_SPELL, lvl: '0', name: "Peau d'écorce", prep: true }];
        assert.equal(prepareSpellRows(hidden, spell("Peau d'écorce"), db, EMPTY_SPELL).rows[0].lvl, '2');
        // Sort mineur de la base noté au niveau 0 : rien à compléter
        const cantrip = [{ ...EMPTY_SPELL, lvl: '0', name: 'Druidisme', prep: true }];
        assert.equal(prepareSpellRows(cantrip, spell('Druidisme'), db, EMPTY_SPELL).rows, cantrip);
    });

    test('Décocher : prep à false ; la ligne ajoutée par la fenêtre, restée telle quelle, est retirée', () => {
        const rows = [row('Lumière'), row('Soins', true, { note: 'à garder' })];
        assert.deepEqual(unprepareSpellRows(rows, spell('Soins'), db)[1], { ...rows[1], prep: false });
        // Rien à changer : même tableau
        assert.equal(unprepareSpellRows(rows, spell('Rayon traçant'), db), rows);
        const { rows: withAdded, added } = prepareSpellRows(rows, spell('Rayon traçant'), db, EMPTY_SPELL);
        assert.deepEqual(unprepareSpellRows(withAdded, spell('Rayon traçant'), db, added), rows);
        // Ligne modifiée depuis (note écrite) : jamais retirée, seulement décochée
        const annotated = withAdded.map((r, i) => (i === 2 ? { ...r, note: 'ma note' } : r));
        const kept = unprepareSpellRows(annotated, spell('Rayon traçant'), db, added);
        assert.equal(kept.length, 3);
        assert.equal(kept[2].prep, false);
        assert.equal(kept[2].note, 'ma note');
        // Sans « ligne ajoutée » (fenêtre rouverte) : une ligne identique est gardée, décochée
        const later = unprepareSpellRows(withAdded, spell('Rayon traçant'), db, null);
        assert.equal(later.length, 3);
        assert.equal(later[2].prep, false);
        // Sort noté deux fois : les deux lignes sont décochées
        const twice = [row('Soins', true), row('Soins', true, { note: 'copie' })];
        assert.deepEqual(unprepareSpellRows(twice, spell('Soins'), db).map(r => r.prep), [false, false]);
    });

    test('Autre sort préparé : seulement son losange, la ligne n\'est jamais retirée', () => {
        const rows = [row('Projectile magique', true), row('Bouclier')];
        assert.deepEqual(setRowPrepared(rows, 0, false), [{ ...rows[0], prep: false }, rows[1]]);
        assert.deepEqual(setRowPrepared(rows, 1, true), [rows[0], { ...rows[1], prep: true }]);
        assert.equal(setRowPrepared(rows, 0, true), rows);
        assert.equal(setRowPrepared(rows, 1, false), rows);
        assert.equal(setRowPrepared(rows, 9, true), rows);
    });

    test('Compteur : la fenêtre et le grimoire comptent pareil (sorts donnés exclus)', () => {
        const record = { char_class: 'Clerc', char_subclass: 'Domaine de la Vie', char_level: '3' };
        const derived = deriveCharacter(record);
        const granted = grantedSpellKeys(record, derived);
        let rows = [row('Bénédiction', true), row('Lumière')];
        for (const name of ['Mot de guérison', 'Rayon traçant', 'Sanctuaire', 'Injonction', 'Arme spirituelle', 'Prière de guérison']) {
            rows = prepareSpellRows(rows, spell(name), db, EMPTY_SPELL).rows;
        }
        const counts = spellCounts(rows, '', granted);
        assert.equal(counts.prepared, 6);
        assert.deepEqual(spellLimitWarnings(counts, classSpellCounts('cleric', 3)), []);
        rows = prepareSpellRows(rows, spell('Silence'), db, EMPTY_SPELL).rows;
        assert.equal(spellLimitWarnings(spellCounts(rows, '', granted), classSpellCounts('cleric', 3)).length, 1);
    });

    test('Recherche par nom : accents, majuscules, nom anglais', () => {
        assert.equal(matchesSpellQuery(spell('Rayon traçant'), 'tracant'), true);
        assert.equal(matchesSpellQuery(spell('Rayon traçant'), 'GUIDING'), true);
        assert.equal(matchesSpellQuery(spell('Rayon traçant'), ''), true);
        assert.equal(matchesSpellQuery(spell('Rayon traçant'), 'soins'), false);
        // Variante de nom (« Marche sur l'onde »)
        assert.equal(matchesSpellQuery(spell("Marche sur l'eau"), 'onde'), true);
    });
});

describe('Paladin et Rôdeur : fenêtre « Préparer mes sorts », un seul sort remplacé par repos long', () => {
    const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
    const db = Array.isArray(base) ? base : Object.values(base);
    const spell = (name) => {
        const found = findSpellByName(db, name);
        assert.ok(found, name);
        return found;
    };
    const row = (name, prep = false, extra = {}) => ({ ...EMPTY_SPELL, lvl: String(spell(name).level), name, prep, ...extra });
    const stateIn = (view) => (name) => view.groups.flatMap(group => group.items).find(item => item.name === name)?.state;

    test('Seuls le Paladin et le Rôdeur ne remplacent qu\'un sort par repos long', () => {
        for (const slug of ['paladin', 'ranger']) assert.equal(replacesOneSpell(slug), true, slug);
        // Clerc, Druide, Magicien : autant que voulu ; liste fixe : rien au repos long
        for (const slug of ['cleric', 'druid', 'wizard', 'bard', 'sorcerer', 'warlock', 'fighter', '', 'toString', undefined]) {
            assert.equal(replacesOneSpell(slug), false, String(slug));
        }
    });

    test('Paladin et Rôdeur ont la fenêtre dès le niveau 1 (emplacements de niveau 1)', () => {
        for (const name of ['Paladin', 'Rôdeur']) {
            const derived = deriveCharacter({ char_class: name, char_level: '1' });
            assert.equal(preparesFromClassList(derived.classSlug), true, name);
            assert.equal(highestSlotLevel(derived.spellSlots), 1, name);
            assert.equal(longRestPreparation(derived.classSlug).window, true, name);
        }
    });

    test('Paladin 5 : sorts de Paladin des niveaux 1 et 2 ; sorts de classe et de serment hors du compte', () => {
        const record = { char_class: 'Paladin', char_subclass: 'Serment de dévotion', char_level: '5' };
        const derived = deriveCharacter(record);
        const granted = grantedSpellKeys(record, derived);
        const rows = [row('Bénédiction', true), row('Soins', true), row('Châtiment divin', true), row('Héroïsme')];
        const view = preparationView(rows, db, { classSlug: 'paladin', maxLevel: highestSlotLevel(derived.spellSlots), granted });
        assert.deepEqual(view.groups.map(group => group.level), [1, 2]);
        assert.ok(view.groups.flatMap(group => group.items).every(item => item.spell.classes.includes('paladin')));
        const state = stateIn(view);
        assert.equal(state('Bénédiction'), 'prepared');
        assert.equal(state('Héroïsme'), 'unprepared');
        // Châtiment de paladin, Fidèle destrier : toujours préparés par la classe
        assert.equal(state('Châtiment divin'), 'granted');
        assert.equal(state('Appel de destrier'), 'granted');
        // Serment de dévotion : Protection contre le mal et le bien, Bouclier de la foi, Aide…
        assert.equal(state('Bouclier de la foi'), 'granted');
        assert.equal(state('Aide'), 'granted');
        // Le compteur ne compte que les sorts choisis : 2 sur les 6 de la table au niveau 5
        assert.equal(spellCounts(rows, '', granted).prepared, 2);
        assert.equal(classSpellCounts('paladin', 5).prepared, 6);
        assert.deepEqual([...preparedSpellNames(rows, granted).values()], ['Bénédiction', 'Soins']);
    });

    test('Rôdeur 3 : sorts de Rôdeur de niveau 1 ; Marque du chasseur (Ennemi juré) hors du compte', () => {
        const record = { char_class: 'Rôdeur', char_level: '3' };
        const derived = deriveCharacter(record);
        const granted = grantedSpellKeys(record, derived);
        const rows = [row('Marque du chasseur', true), row('Soins', true), row('Grande foulée', true)];
        const view = preparationView(rows, db, { classSlug: 'ranger', maxLevel: highestSlotLevel(derived.spellSlots), granted });
        assert.deepEqual(view.groups.map(group => group.level), [1]);
        const state = stateIn(view);
        assert.equal(state('Marque du chasseur'), 'granted');
        assert.equal(state('Soins'), 'prepared');
        assert.deepEqual([...preparedSpellNames(rows, granted).values()], ['Soins', 'Grande foulée']);
    });

    test('Sorts préparés comptés : niveau 1+, losange coché, hors sorts donnés, une fois par sort', () => {
        const rows = [
            row('Soins', true), row('Bénédiction'), { ...EMPTY_SPELL, lvl: '0', name: 'Lumière', prep: true },
            { ...EMPTY_SPELL, lvl: '1', name: '<b>Sort   maison</b>', prep: true }, { ...EMPTY_SPELL, prep: true },
            row('Soins', true, { note: 'copie' }), { ...EMPTY_SPELL, lvl: '1', name: ' SOINS ', prep: true }, null, 'x'
        ];
        assert.deepEqual([...preparedSpellNames(rows)], [[spellNameKey('Soins'), 'Soins'], [spellNameKey('Sort maison'), 'Sort maison']]);
        assert.deepEqual([...preparedSpellNames(rows, new Set([spellNameKey('Soins')])).values()], ['Sort maison']);
        for (const broken of [null, undefined, 'x', {}, 3]) assert.equal(preparedSpellNames(broken).size, 0);
    });

    test('Suivi : rien de changé, un sort retiré, un sort remplacé', () => {
        const before = preparedSpellNames([row('Soins', true), row('Bénédiction', true)]);
        assert.deepEqual(preparationSwap(before, before),
            { removed: [], added: [], over: false, text: "Un seul échange par repos long : aucun sort remplacé pour l'instant." });
        const removed = preparedSpellNames([row('Soins'), row('Bénédiction', true)]);
        assert.deepEqual(preparationSwap(before, removed),
            { removed: ['Soins'], added: [], over: false, text: '« Soins » retiré : cochez le sort qui le remplace.' });
        const swapped = preparedSpellNames([row('Soins'), row('Bénédiction', true), row('Héroïsme', true)]);
        assert.deepEqual(preparationSwap(before, swapped),
            { removed: ['Soins'], added: ['Héroïsme'], over: false, text: 'Échange de ce repos long : « Soins » remplacé par « Héroïsme ».' });
    });

    test('Suivi : plus d\'un sort retiré, avertissement sans rien bloquer ; recocher annule', () => {
        const before = preparedSpellNames([row('Soins', true), row('Bénédiction', true), row('Héroïsme', true)]);
        const two = preparedSpellNames([row('Soins'), row('Bénédiction'), row('Héroïsme', true), row('Faveur divine', true)]);
        const status = preparationSwap(before, two);
        assert.equal(status.over, true);
        assert.deepEqual([status.removed, status.added], [['Soins', 'Bénédiction'], ['Faveur divine']]);
        assert.match(status.text, /^Attention : 2 sorts retirés \(« Soins », « Bénédiction »\)\. La règle ne permet d'en remplacer qu'un seul par repos long/);
        // Un des deux recoché : retour à un seul échange
        const back = preparedSpellNames([row('Soins'), row('Bénédiction', true), row('Héroïsme', true), row('Faveur divine', true)]);
        assert.deepEqual(preparationSwap(before, back),
            { removed: ['Soins'], added: ['Faveur divine'], over: false, text: 'Échange de ce repos long : « Soins » remplacé par « Faveur divine ».' });
    });

    test('Suivi : sorts ajoutés sans en retirer (premier choix, gain de niveau), jamais une alerte', () => {
        const empty = preparedSpellNames([]);
        const first = preparationSwap(empty, preparedSpellNames([row('Soins', true), row('Bénédiction', true)]));
        assert.equal(first.over, false);
        assert.equal(first.text, 'Aucun sort retiré. Ajoutés : « Soins », « Bénédiction » (vous complétez votre liste : premier choix ou gain de niveau).');
        const one = preparationSwap(preparedSpellNames([row('Soins', true)]), preparedSpellNames([row('Soins', true), row('Héroïsme', true)]));
        assert.equal(one.text, 'Aucun sort retiré. Ajouté : « Héroïsme » (vous complétez votre liste : premier choix ou gain de niveau).');
        // Un échange et un sort de plus (repos long juste après un gain de niveau)
        const both = preparationSwap(preparedSpellNames([row('Soins', true)]), preparedSpellNames([row('Héroïsme', true), row('Bénédiction', true)]));
        assert.equal(both.over, false);
        assert.match(both.text, /^Échange de ce repos long : « Soins » retiré\. Ajoutés : « Héroïsme », « Bénédiction » \(un seul le remplace/);
    });

    test('Suivi : valeurs absentes ou abîmées lues comme « aucun sort préparé »', () => {
        for (const broken of [null, undefined, [], {}, 'x']) {
            assert.equal(preparationSwap(broken, broken).text, "Un seul échange par repos long : aucun sort remplacé pour l'instant.");
        }
        assert.deepEqual(preparationSwap(null, new Map([['soins', 'Soins']])).added, ['Soins']);
    });

    test('Dans la fenêtre : décocher puis cocher un autre sort donne « X remplacé par Y »', () => {
        const record = { char_class: 'Paladin', char_level: '3' };
        const granted = grantedSpellKeys(record, deriveCharacter(record));
        let rows = [row('Soins', true), row('Bénédiction', true), row('Héroïsme', true), row('Châtiment divin', true)];
        const opened = preparedSpellNames(rows, granted);
        assert.equal(opened.size, 3);
        rows = unprepareSpellRows(rows, spell('Héroïsme'), db);
        assert.equal(preparationSwap(opened, preparedSpellNames(rows, granted)).text, '« Héroïsme » retiré : cochez le sort qui le remplace.');
        const { rows: next, added } = prepareSpellRows(rows, spell('Faveur divine'), db, EMPTY_SPELL);
        assert.equal(preparationSwap(opened, preparedSpellNames(next, granted)).text, 'Échange de ce repos long : « Héroïsme » remplacé par « Faveur divine ».');
        // Retour en arrière complet : la ligne ajoutée repart, le sort retiré est recoché
        rows = prepareSpellRows(unprepareSpellRows(next, spell('Faveur divine'), db, added), spell('Héroïsme'), db, EMPTY_SPELL).rows;
        assert.deepEqual(preparationSwap(opened, preparedSpellNames(rows, granted)).removed, []);
        assert.deepEqual(preparationSwap(opened, preparedSpellNames(rows, granted)).added, []);
        // Un sort toujours préparé (Châtiment divin) décoché au grimoire ne compte pas comme retiré
        rows = rows.map(entry => (entry.name === 'Châtiment divin' ? { ...entry, prep: false } : entry));
        assert.deepEqual(preparationSwap(opened, preparedSpellNames(rows, granted)).removed, []);
    });

    test('Rappel de fin de repos long : « un seul », et la fenêtre s\'ouvre', () => {
        for (const slug of ['paladin', 'ranger']) {
            assert.deepEqual(longRestPreparation(slug), {
                text: 'Vous pouvez remplacer un seul de vos sorts préparés par un autre sort de votre liste de classe (un échange par repos long).',
                window: true
            }, slug);
        }
        assert.doesNotMatch(longRestPreparation('cleric').text, /un seul/);
    });

    test('Interface : la ligne de suivi n\'existe que pour ces deux classes, sous le compteur', () => {
        const ui = readFileSync(new URL('../js/ui/spells/prepare.js', import.meta.url), 'utf8');
        assert.match(ui, /const opened = replacesOneSpell\(classSlug\)\s*\? preparedSpellNames\(rowsOf\(store\.get\(\)\), grantedSpellKeys\(store\.get\(\), start, db\)\) : null;/);
        assert.match(ui, /el\('p', \{ class: 'prep-swap', role: 'status', hidden: !opened \}\)/);
        assert.match(ui, /preparationSwap\(opened, preparedSpellNames\(rows, granted\)\)/);
        assert.match(ui, /swap\.classList\.toggle\('is-over', status\.over\)/);
        assert.match(ui, /el\('div', \{ class: 'prep-controls' \}, search, counter, swap\)/);
        // Rien n'est bloqué : les cases restent de simples cases
        assert.doesNotMatch(ui, /status\.over[^\n]*disabled/);
        const css = readFileSync(new URL('../css/spells.css', import.meta.url), 'utf8');
        assert.match(css, /\.modal-body \.prep-swap\.is-over \{\s*color: var\(--ko\);/);
    });
});

describe('Sort préparé au-dessus des emplacements (simple avertissement)', () => {
    const slotsOf = (extra) => deriveCharacter({ ...extra }).spellSlots;

    test('Plus haut emplacement : table de la classe, magie de pacte, multiclassage, niveau ajouté à la main', () => {
        assert.equal(highestUsableSlot({ 1: 4, 2: 3, 3: 2 }, 'wizard', {}), 3);
        assert.equal(highestUsableSlot({ 3: 2 }, 'warlock', {}), 3);
        assert.equal(highestUsableSlot({}, 'fighter', {}), 0);
        assert.equal(highestUsableSlot(undefined, '', undefined), 0);
        // Niveau ajouté à la main dans le grimoire, niveau de la table ramené à 0
        assert.equal(highestUsableSlot({ 1: 4, 2: 2 }, 'cleric', { 4: { max: 1, used: 0 } }), 4);
        assert.equal(highestUsableSlot({ 1: 4, 2: 2 }, 'cleric', { 2: { max: 0 } }), 1);
        // Emplacements tous dépensés : le niveau existe toujours (ils reviennent au repos)
        assert.equal(highestUsableSlot({ 1: 4, 2: 2 }, 'cleric', { 2: { used: 2 } }), 2);
        // Tels que la fiche les calcule : Clerc 5 (niveau 3), Paladin 5 (niveau 2), Occultiste 5 (pacte, niveau 3)
        assert.equal(highestUsableSlot(slotsOf({ char_class: 'Clerc', char_level: '5' }), 'cleric', {}), 3);
        assert.equal(highestUsableSlot(slotsOf({ char_class: 'Paladin', char_level: '5' }), 'paladin', {}), 2);
        assert.equal(highestUsableSlot(slotsOf({ char_class: 'Occultiste', char_level: '5' }), 'warlock', {}), 3);
    });

    test('Arcanum mystique : niveau 6 au niveau 11, puis 7, 8, 9 aux niveaux 13, 15, 17 ; Occultiste seulement', () => {
        for (const [level, top] of [[1, 0], [10, 0], [11, 6], [12, 6], [13, 7], [15, 8], [17, 9], [20, 9]]) {
            assert.equal(mysticArcanumLevel('warlock', level), top, `niveau ${level}`);
        }
        assert.equal(mysticArcanumLevel('wizard', 20), 0);
        assert.equal(mysticArcanumLevel('', 20), 0);
        // Niveaux de sort couverts par l'Arcanum (fenêtre « Lancer » : pas de « Aucun emplacement »)
        assert.equal(isArcanumSpellLevel(6, mysticArcanumLevel('warlock', 11)), true);
        assert.equal(isArcanumSpellLevel('6', 6), true);
        assert.equal(isArcanumSpellLevel(7, mysticArcanumLevel('warlock', 11)), false);
        assert.equal(isArcanumSpellLevel(5, mysticArcanumLevel('warlock', 20)), false);
        assert.equal(isArcanumSpellLevel(9, mysticArcanumLevel('warlock', 17)), true);
        assert.equal(isArcanumSpellLevel(6, mysticArcanumLevel('warlock', 10)), false);
        assert.equal(isArcanumSpellLevel(6, mysticArcanumLevel('wizard', 20)), false);
        // La phrase dit où est la case que « Lancer gratuit » coche
        assert.match(arcanumCastText(6), /^Arcanum mystique : votre sort d'Arcanum de niveau 6 .*sans emplacement.*repos long.*case « Arcanum mystique \(niveau 6\) »/);
    });

    test("Signalé : sort préparé (coché ou fixe) d'un niveau plus haut que le plus haut emplacement", () => {
        const options = { topSlot: 3 };
        assert.equal(missingSlotLevel({ lvl: '4', name: 'Bannissement', prep: true }, 'prepared', options), 4);
        assert.equal(missingSlotLevel({ lvl: '9', name: 'Souhait' }, 'list', options), 9);
        assert.equal(missingSlotLevel({ lvl: '5', name: 'Cône de froid' }, 'granted', options), 5);
        // Niveau égal ou plus bas : rien
        assert.equal(missingSlotLevel({ lvl: '3', name: 'Boule de feu', prep: true }, 'prepared', options), 0);
        assert.equal(missingSlotLevel({ lvl: '1', name: 'Bouclier', prep: true }, 'prepared', options), 0);
    });

    test('Jamais signalé : sort mineur, sort non préparé, rituel du livre, lancer gratuit, Arcanum, personnage sans emplacement', () => {
        const options = { topSlot: 2 };
        assert.equal(missingSlotLevel({ lvl: '0', name: 'Trait de feu' }, 'cantrip', options), 0);
        // Niveau vide (ancienne sauvegarde) : lu comme un sort mineur
        assert.equal(missingSlotLevel({ lvl: '', name: 'Bouclier', prep: true }, 'prepared', options), 0);
        assert.equal(missingSlotLevel({ lvl: '4', name: 'Bannissement' }, 'unprepared', options), 0);
        assert.equal(missingSlotLevel({ lvl: '3', name: 'Communication avec les morts', r: true }, 'ritual', options), 0);
        // Sort donné qui a son propre lancer gratuit (don, espèce…)
        assert.equal(missingSlotLevel({ lvl: '3', name: 'Vol' }, 'granted', { ...options, freeCast: true }), 0);
        assert.equal(missingSlotLevel({ lvl: '3', name: 'Vol' }, 'granted', options), 3);
        // Occultiste 13 : emplacements de pacte de niveau 5, Arcanum de niveau 6 et 7
        const warlock = { topSlot: 5, arcanumLevel: 7 };
        assert.equal(missingSlotLevel({ lvl: '6', name: 'Œil magique', prep: true }, 'prepared', warlock), 0);
        assert.equal(missingSlotLevel({ lvl: '7', name: 'Doigt de mort', prep: true }, 'prepared', warlock), 0);
        assert.equal(missingSlotLevel({ lvl: '8', name: 'Domination de monstre', prep: true }, 'prepared', warlock), 8);
        // Personnage sans aucun emplacement (sort d'objet noté à la main) : la fiche ne dit rien
        assert.equal(missingSlotLevel({ lvl: '2', name: 'Invisibilité', prep: true }, 'prepared', { topSlot: 0 }), 0);
        assert.equal(missingSlotLevel({ lvl: '2', name: 'Invisibilité', prep: true }, 'prepared'), 0);
        assert.equal(missingSlotLevel(null, 'prepared', options), 0);
    });

    test("La ligne n'est jamais modifiée, et la phrase dit le niveau", () => {
        const row = Object.freeze({ lvl: '4', name: 'Bannissement', prep: true });
        assert.equal(missingSlotLevel(row, 'prepared', { topSlot: 3 }), 4);
        assert.deepEqual(row, { lvl: '4', name: 'Bannissement', prep: true });
        assert.match(missingSlotText(4), /^Niveau 4 : vous n'avez pas encore d'emplacement de ce niveau/);
    });
});
