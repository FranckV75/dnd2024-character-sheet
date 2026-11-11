// =============================================================================
// Sous-classes, lot 7 : Collège de poésie épique (strophes, rang du poème, minimum du dé
// d'Inspiration, effets) avec le compteur des choix (kind: 'number'), et Sorcellerie sauvage
// (tirages d20 / d100 avec hasard injecté, rappels de Marée du chaos et de la Bouffée domptée).
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { deriveCharacter } from '../js/rules/character.js';
import {
    subclassChoiceFields, subclassChoice, setSubclassChoicePatch, stepSubclassChoicePatch, choiceLabel, subclassChoiceNotes,
    restSubclassChoices
} from '../js/rules/subclass-choices.js';
import { epicPoem, epicMinResult, epicPoemSummary, epicPoemNotes, strophePatch, EPIC_EFFECTS, DEFAULT_PARTY } from '../js/rules/epic-poem.js';
import {
    rollDie, surgeRow, surgeTableRoll, surgeCheck, surgeResultText, wildMagicPanel, wildMagicNotes
} from '../js/rules/wild-magic.js';
import { subclassFeatures } from '../js/rules/subclass-features.js';
import { featEffects, FEAT_ZONES } from '../js/rules/feat-effects.js';
import { SUBCLASS_CHOICE_FIELDS } from '../js/data/subclass-choices.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const EPIC = 'college_of_epic_muse';
const WILD = 'wild_magic_sorcery';

const bard = (level, choices, extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Barde', char_subclass: 'Collège de poésie épique', char_level: String(level),
    ...(choices ? { subclass_choices: { [EPIC]: choices } } : {}), ...extra
});
const sorcerer = (level, extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Ensorceleur', char_subclass: 'Sorcellerie Sauvage', char_level: String(level), ...extra
});
const poemOf = (c) => epicPoem(deriveCharacter(c).subclassChoices);
const auto = (c, id) => subclassFeatures(deriveCharacter(c)).reached.find(f => f.id === id)?.automation;
/** Source de hasard qui rend les valeurs données, dans l'ordre (la dernière se répète) */
const sequence = (...values) => {
    let i = 0;
    return () => values[Math.min(i++, values.length - 1)];
};
/** Valeur de rng qui donne le résultat n sur un dé à `faces` faces */
const face = (n, faces) => (n - 0.5) / faces;

describe('Poésie épique : données et compteur', () => {
    test('strophes : compteur de jeu (0 à 999) ; joueurs du groupe : 1 à 8, choix de table', () => {
        const [strophes, party] = SUBCLASS_CHOICE_FIELDS[EPIC];
        assert.equal(strophes.kind, 'number');
        assert.equal(strophes.inPlay, true);
        assert.deepEqual([strophes.min, strophes.max], [0, 999]);
        assert.deepEqual(strophes.options, []);
        assert.deepEqual(party.options.map(([id]) => id), ['1', '2', '3', '4', '5', '6', '7', '8']);
        assert.equal(party.options[0][1], '1 joueur');
        assert.equal(party.options[5][1], '6 joueurs');
        assert.ok(!party.inPlay);
        const fields = subclassChoiceFields({ subclass: EPIC, level: 3 });
        assert.deepEqual(fields.map(f => [f.key, f.kind, f.min, f.max, f.inPlay]),
            [['strophes', 'number', 0, 999, true], ['party', undefined, undefined, undefined, false]]);
    });

    test('niveau 2 ou autre sous-classe : aucun champ, aucune note', () => {
        assert.deepEqual(subclassChoiceFields(deriveCharacter(bard(2, { strophes: '14' }))), []);
        assert.deepEqual(deriveCharacter(bard(2, { strophes: '14' })).subclassChoices, {});
        assert.deepEqual(epicPoemNotes(deriveCharacter(bard(2, { strophes: '14' }))), {});
        const other = { ...bard(5, { strophes: '14' }), char_subclass: 'Collège du Savoir' };
        assert.deepEqual(epicPoemNotes(deriveCharacter(other)), {});
        assert.equal(featEffects(other).classResource, undefined);
    });

    test('valeurs abîmées ignorées ; un nombre entier dans la plage est toléré (relu en chaîne)', () => {
        for (const bad of ['abc', '-1', '1e3', '007', '1000', ' 14', '14.0', '', null, true, 14.5, 1000, -1, {}]) {
            assert.equal(deriveCharacter(bard(3, { strophes: bad })).subclassChoices.strophes, undefined, String(bad));
        }
        assert.equal(deriveCharacter(bard(3, { strophes: 14 })).subclassChoices.strophes, '14');
        assert.equal(deriveCharacter(bard(3, { strophes: '0' })).subclassChoices.strophes, '0');
        assert.equal(deriveCharacter(bard(3, { strophes: '999' })).subclassChoices.strophes, '999');
        for (const bad of ['0', '9', 'six', 6]) {
            assert.equal(deriveCharacter(bard(3, { party: bad })).subclassChoices.party, undefined, String(bad));
            assert.equal(poemOf(bard(3, { party: bad, strophes: '12' })).party, DEFAULT_PARTY);
        }
    });

    test('enregistrement : chaîne, arrondi vers zéro, ramené entre 0 et 999 ; vide efface ; personnage intact', () => {
        const c = bard(3, { strophes: '5', party: '4' });
        const frozen = JSON.stringify(c);
        const save = (value) => setSubclassChoicePatch(c, EPIC, 'strophes', value).subclass_choices?.[EPIC];
        assert.deepEqual(save(14), { strophes: '14', party: '4' });
        assert.equal(save('14').strophes, '14');
        assert.equal(save(' 15 ').strophes, '15');
        assert.equal(save(7.9).strophes, '7');
        assert.equal(save(-3).strophes, '0');
        assert.equal(save(5000).strophes, '999');
        assert.deepEqual(save(''), { party: '4' });
        assert.deepEqual(setSubclassChoicePatch(c, EPIC, 'strophes', 'abc'), {});
        assert.deepEqual(setSubclassChoicePatch(c, EPIC, 'party', '9'), {});
        assert.equal(JSON.stringify(c), frozen);
    });

    test('boutons − et + : plancher 0, plafond 999, valeur absente = 0, personnage intact', () => {
        const step = (c, delta) => strophePatch(c, deriveCharacter(c), delta).subclass_choices?.[EPIC]?.strophes;
        assert.equal(step(bard(3), 1), '1');
        assert.equal(step(bard(3, { strophes: '0' }), -1), '0');
        assert.equal(step(bard(3, { strophes: '999' }), 1), '999');
        assert.equal(step(bard(3, { strophes: '14' }), 1), '15');
        assert.equal(step(bard(3, { strophes: 'abc' }), 1), '1');
        const c = bard(3, { strophes: '14' });
        const frozen = JSON.stringify(c);
        strophePatch(c, deriveCharacter(c), 1);
        assert.equal(JSON.stringify(c), frozen);
        // Pas de compteur hors de la sous-classe ou avant le niveau 3 ; pas de pas sur un menu
        assert.deepEqual(strophePatch(bard(2), deriveCharacter(bard(2)), 1), {});
        const c3 = bard(3);
        assert.deepEqual(stepSubclassChoicePatch(c3, deriveCharacter(c3), 'party', 1), {});
        assert.deepEqual(stepSubclassChoicePatch(c3, deriveCharacter(c3), 'strophes', 'x'), {});
    });

    test('« + » touché juste après une saisie : part du nombre tapé, pas encore enregistré', () => {
        const step = (c, delta, typed) => stepSubclassChoicePatch(c, deriveCharacter(c), 'strophes', delta, typed)
            .subclass_choices?.[EPIC]?.strophes;
        const c = bard(3, { strophes: '14' });
        assert.equal(step(c, 1, '20'), '21');
        assert.equal(step(c, -1, ' 20 '), '19');
        assert.equal(step(c, 1, 20), '21');
        // Case vide ou illisible : la valeur enregistrée sert de départ
        assert.equal(step(c, 1, ''), '15');
        assert.equal(step(c, 1, 'abc'), '15');
        assert.equal(step(c, 1, undefined), '15');
        // Saisie hors de la plage : ramenée entre 0 et 999 avant le pas
        assert.equal(step(c, 1, '5000'), '999');
        assert.equal(step(c, -1, '-3'), '0');
        assert.equal(step(c, 1, '12,7'), '13');
        // Format de sauvegarde inchangé : toujours une chaîne dans subclass_choices
        assert.deepEqual(Object.keys(stepSubclassChoicePatch(c, deriveCharacter(c), 'strophes', 1, '20')), ['subclass_choices']);
    });

    test('changer de sous-classe puis revenir retrouve les strophes', () => {
        const c = bard(5, { strophes: '20' });
        const other = { ...c, char_subclass: 'Collège du Savoir' };
        assert.equal(deriveCharacter(other).subclassChoices.strophes, undefined);
        assert.equal(poemOf({ ...other, char_subclass: 'Collège de poésie épique' }).strophes, 20);
    });

    test('un champ sans options (ou à options abîmées) ne provoque aucune erreur', () => {
        const list = SUBCLASS_CHOICE_FIELDS[EPIC];
        list.push({ key: 'broken', feature: 'composition_des_strophes', label: 'Sans options' });
        try {
            const c = bard(3, { broken: 'x', strophes: '3' });
            const derived = deriveCharacter(c);
            assert.deepEqual(subclassChoiceFields(derived).find(f => f.key === 'broken').options, []);
            assert.deepEqual(subclassChoice(c, derived), { strophes: '3' });
            assert.equal(choiceLabel(EPIC, 'broken', 'x'), '');
            assert.deepEqual(setSubclassChoicePatch(c, EPIC, 'broken', 'x'), {});
            assert.doesNotThrow(() => subclassChoiceNotes(derived, c));
            assert.doesNotThrow(() => restSubclassChoices(c, derived, 'long'));
        } finally {
            list.pop();
        }
        assert.equal(choiceLabel(EPIC, 'strophes', '14'), '14');
        assert.equal(choiceLabel(EPIC, 'strophes', '007'), '');
        assert.equal(choiceLabel(EPIC, 'party', '3'), '3 joueurs');
    });

    test('ni rappel de repos, ni effacement au repos (les strophes ne se perdent jamais)', () => {
        const c = bard(10, { strophes: '30', party: '6' });
        const derived = deriveCharacter(c);
        assert.equal(subclassChoiceNotes(derived, c).rest, undefined);
        assert.deepEqual(restSubclassChoices(c, derived, 'long'), { patch: {}, cleared: [] });
    });
});

describe('Poésie épique : rang du poème', () => {
    test('clé absente : 0 strophe, 6 joueurs, rang 0, pas de minimum', () => {
        const poem = poemOf(bard(3));
        assert.equal(poem.strophes, 0);
        assert.equal(poem.party, 6);
        assert.equal(poem.partyChosen, false);
        assert.equal(poem.rank, 0);
        assert.equal(poem.minResult, null);
        assert.deepEqual(poem.next, { rank: 1, needed: 6, missing: 6 });
        assert.ok(poem.effects.every(e => !e.unlocked));
    });

    test('rangs pour 6 joueurs : seuils, minimum et effets', () => {
        const at = (s) => poemOf(bard(3, { strophes: String(s) }));
        assert.equal(at(5).rank, 0);
        assert.equal(at(5).next.missing, 1);
        assert.equal(at(6).rank, 1);
        assert.equal(at(6).minResult, 2);
        assert.equal(at(12).rank, 2);
        assert.equal(at(12).minResult, 2);
        assert.deepEqual(at(12).effects.filter(e => e.unlocked).map(e => e.id), ['courage']);
        assert.equal(at(59).rank, 9);
        assert.equal(at(59).minResult, 6);
        assert.equal(at(59).next.missing, 1);
        assert.equal(at(60).rank, 10);
        assert.ok(at(60).effects.find(e => e.id === 'resistance').unlocked);
        assert.equal(at(60).next, null);
        assert.equal(at(200).rank, 10);
    });

    test('taille du groupe : joueurs × rang (exemple du livre : 3 joueurs, 18 strophes = rang 6)', () => {
        assert.equal(poemOf(bard(3, { party: '3', strophes: '18' })).rank, 6);
        assert.equal(poemOf(bard(3, { party: '1', strophes: '10' })).rank, 10);
        const eight = poemOf(bard(3, { party: '8', strophes: '79' }));
        assert.equal(eight.rank, 9);
        assert.deepEqual(eight.next, { rank: 10, needed: 80, missing: 1 });
        assert.equal(eight.partyChosen, true);
    });

    test('minimum du dé : 2, 2, 3, 3, 4, 4, 5, 5, 6, 6 ; effets aux rangs 2, 4, 6, 8, 10', () => {
        assert.deepEqual(Array.from({ length: 11 }, (_, r) => epicMinResult(r)), [null, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
        assert.deepEqual(EPIC_EFFECTS.map(e => [e.id, e.rank]),
            [['courage', 2], ['clairvoyance', 4], ['determination', 6], ['reflexes', 8], ['resistance', 10]]);
    });

    test('résumé : « 14 strophes — rang 2 (6 joueurs). Rang 3 à 18 strophes : encore 4. »', () => {
        assert.equal(epicPoemSummary(poemOf(bard(3, { strophes: '14' }))), '14 strophes — rang 2 (6 joueurs). Rang 3 à 18 strophes : encore 4.');
        assert.equal(epicPoemSummary(poemOf(bard(3, { strophes: '1', party: '1' }))), '1 strophe — rang 1 (1 joueur). Rang 2 à 2 strophes : encore 1.');
        assert.match(epicPoemSummary(poemOf(bard(3, { strophes: '60' }))), /rang 10 .*Rang 10 atteint/);
    });
});

describe('Poésie épique : textes et repères', () => {
    test('repère près des cases d\'Inspiration bardique (zone classResource)', () => {
        const c = bard(5, { strophes: '14' });
        const notes = featEffects(c).classResource;
        assert.equal(notes.length, 1);
        assert.equal(notes[0].mention, 'Poème rang 2 · min. 2');
        assert.match(notes[0].text, /Dé d'Inspiration 1d8, résultat minimum 2 ; effets débloqués : Courage épique\./);
        assert.equal(notes[0].classFeature, true);
        assert.equal(featEffects(bard(3)).classResource[0].mention, 'Poème rang 0');
        assert.match(featEffects(bard(3)).classResource[0].text, /effets débloqués : aucun/);
    });

    test('les effets ne touchent jamais la fiche du barde (Perception passive, sauvegardes)', () => {
        const low = bard(10);
        const high = bard(10, { strophes: '60' });
        assert.equal(deriveCharacter(high).passivePerception, deriveCharacter(low).passivePerception);
        assert.deepEqual(deriveCharacter(high).saves, deriveCharacter(low).saves);
        assert.equal(featEffects(high).deathSaves.length, featEffects(low).deathSaves.length);
    });

    test('« Dans la fiche » : compteur, minimum, effets ; Égide au niveau 6 ; dé d10 au 14, d12 au 15', () => {
        const c3 = bard(3, { strophes: '14' });
        assert.match(auto(c3, 'composition_des_strophes').text, /14 strophes — rang 2/);
        assert.doesNotMatch(auto(c3, 'composition_des_strophes').text, /Égide/);
        assert.match(auto(bard(6, { strophes: '14' }), 'composition_des_strophes').text, /Égide du poète : allié concerné à 1,50 m/);
        const inspirations = auto(c3, 'inspirations_poetiques');
        assert.match(inspirations.text, /1d6 · résultat minimum 2/);
        assert.equal(inspirations.list.length, 5);
        assert.match(inspirations.list[0], /^Courage épique \(rang 2, débloqué\)/);
        assert.match(inspirations.list[1], /^Clairvoyance épique \(rang 4, pas encore\)/);
        assert.match(auto(bard(3), 'inspirations_poetiques').text, /pas encore de minimum/);
        assert.match(auto(bard(6), 'egide_du_poete').text, /Intermédiaires/);
        assert.match(auto(bard(14), 'epithetes_protectrices').text, /1d10/);
        assert.match(auto(bard(15), 'epithetes_protectrices').text, /1d12/);
        assert.match(auto(bard(15, { strophes: '30' }), 'epithetes_protectrices').text, /minimum du rang, 4/);
    });

    test('compatibilité : clé facultative propre à la v4 ; fiche sans subclass_choices relue à l\'identique', () => {
        assert.ok(V4_ONLY_KEYS.includes('subclass_choices'));
        const old = bard(6);
        const frozen = JSON.stringify(old);
        assert.deepEqual(deriveCharacter(old).subclassChoices, {});
        featEffects(old);
        assert.equal(JSON.stringify(old), frozen);
        // Personnage sans sous-classe : zones fixes seulement
        assert.deepEqual(Object.keys(featEffects(createDefaultCharacter())), [...FEAT_ZONES]);
    });
});

describe('Sorcellerie sauvage : tirages (hasard injecté)', () => {
    test('rollDie : 1 à faces, valeurs extrêmes ramenées, source de hasard obligatoire', () => {
        assert.equal(rollDie(20, () => 0), 1);
        assert.equal(rollDie(20, () => 0.9999), 20);
        assert.equal(rollDie(100, () => 0.9999), 100);
        assert.equal(rollDie(20, () => 1), 20);
        assert.equal(rollDie(20, () => -5), 1);
        assert.equal(rollDie(20, () => NaN), 1);
        assert.equal(rollDie(100, () => face(47, 100)), 47);
        assert.throws(() => rollDie(20), TypeError);
    });

    test('surgeRow : 25 lignes de 4, 100 écrit 00', () => {
        assert.deepEqual(surgeRow(1), { value: 1, row: 1, range: '01-04' });
        assert.deepEqual(surgeRow(4), { value: 4, row: 1, range: '01-04' });
        assert.deepEqual(surgeRow(5), { value: 5, row: 2, range: '05-08' });
        assert.deepEqual(surgeRow(47), { value: 47, row: 12, range: '45-48' });
        assert.deepEqual(surgeRow(96), { value: 96, row: 24, range: '93-96' });
        assert.deepEqual(surgeRow(100), { value: 100, row: 25, range: '97-00' });
    });

    test('surgeCheck : 1 au d20 sans table ; 20 au d20 puis 100 au d100 → ligne 97-00', () => {
        assert.deepEqual(surgeCheck(3, () => 0), { d20: 1, surge: false, table: null });
        const high = surgeCheck(3, () => 0.9999);
        assert.equal(high.d20, 20);
        assert.equal(high.surge, true);
        assert.deepEqual(high.table.rolls, [{ value: 100, row: 25, range: '97-00' }]);
        assert.deepEqual(surgeCheck(3, () => face(19, 20)), { d20: 19, surge: false, table: null });
    });

    test('niveau 13 : un tirage ; 14 : deux (égaux possibles) ; 18 : Bouffée domptée', () => {
        assert.equal(surgeTableRoll(13, () => 0.5).rolls.length, 1);
        assert.equal(surgeTableRoll(13, () => 0.5).keepOne, false);
        const two = surgeTableRoll(14, sequence(face(47, 100), face(82, 100)));
        assert.deepEqual(two.rolls.map(r => r.value), [47, 82]);
        assert.equal(two.keepOne, true);
        assert.equal(two.tamed, false);
        const same = surgeTableRoll(14, () => face(10, 100));
        assert.deepEqual(same.rolls.map(r => r.value), [10, 10]);
        assert.equal(surgeTableRoll(18, () => 0).tamed, true);
        const check = surgeCheck(14, sequence(face(20, 20), face(3, 100), face(99, 100)));
        assert.deepEqual(check.table.rolls.map(r => r.range), ['01-04', '97-00']);
    });

    test('textes du résultat : la ligne de la table, sans ses effets', () => {
        assert.equal(surgeResultText(surgeCheck(3, () => face(13, 20))), 'd20 : 13 → pas de Bouffée (il faut un 20).');
        assert.match(surgeResultText(surgeTableRoll(3, () => face(47, 100))), /^d100 : 47 → ligne 45-48 de la table de Bouffée de Sorcellerie sauvage \(Wild Magic Surge, PHB 2024 p\. 150-151\)\.$/);
        assert.match(surgeResultText(surgeCheck(3, sequence(0.9999, face(5, 100)))), /^d20 : 20 → Bouffée ! d100 : 5 → ligne 05-08/);
        assert.match(surgeResultText(surgeTableRoll(14, sequence(face(47, 100), face(82, 100)))),
            /d100 : 47 et 82 → lignes 45-48 ou 81-84 .*gardez celle de votre choix/);
        assert.match(surgeResultText(surgeTableRoll(14, sequence(face(45, 100), face(48, 100)))), /ligne 45-48 \(deux fois\)/);
        assert.equal(surgeResultText(null), '');
    });

    test('aucun Math.random dans les règles (hasard toujours injecté)', () => {
        const dir = new URL('../js/rules/', import.meta.url);
        for (const file of readdirSync(dir).filter(name => name.endsWith('.js'))) {
            assert.ok(!/Math\.random/.test(readFileSync(new URL(file, dir), 'utf8')), file);
        }
    });
});

describe('Sorcellerie sauvage : bloc des tirages, rappels et textes', () => {
    const panel = (c) => wildMagicPanel(c, deriveCharacter(c));

    test('boutons seulement pour la Sorcellerie sauvage, niveau 3 ou plus', () => {
        assert.equal(panel(sorcerer(2)), null);
        assert.equal(panel({ ...sorcerer(5), char_subclass: 'Sorcellerie Draconique' }), null);
        assert.deepEqual(panel(sorcerer(3)), { level: 3, keepTwo: false, reminders: [] });
        assert.equal(panel(sorcerer(14)).keepTwo, true);
    });

    test('Marée du chaos cochée : Bouffée automatique en attente ; Bouffée domptée au niveau 18', () => {
        const tides = { subclass_uses: { [`${WILD}.marees_du_chaos`]: 1 } };
        assert.match(panel(sorcerer(3, tides)).reminders[0], /Bouffée automatique .*Table \(d100\).*décochez Marée du chaos/);
        assert.equal(panel(sorcerer(17)).reminders.length, 0);
        assert.match(panel(sorcerer(18)).reminders[0], /Bouffée domptée disponible .*sauf 97-00/);
        assert.deepEqual(panel(sorcerer(18, { subclass_uses: { [`${WILD}.deferlante_domptee`]: 1 } })).reminders, []);
        // La fiche ne décoche jamais Marée du chaos elle-même
        const c = sorcerer(3, { ...tides, spell_slots_state: { 1: 1 } });
        assert.equal(panel(c).reminders.length, 1);
    });

    test('Comme par hasard : repère près des points de sorcellerie à partir du niveau 6', () => {
        assert.deepEqual(wildMagicNotes(deriveCharacter(sorcerer(5))), {});
        const notes = featEffects(sorcerer(6)).classResource;
        assert.equal(notes.length, 1);
        assert.equal(notes[0].mention, 'Hasard ±1d4');
        assert.match(notes[0].text, /1 point de sorcellerie .*1d4/);
    });

    test('« Dans la fiche » : boutons, rappels, deux tirages ; cases de Marée et de Bouffée domptée', () => {
        const c = sorcerer(18);
        assert.match(auto(c, 'deferlante_de_magie_sauvage').text, /Bouffée \? \(d20\).*Table \(d100\)/);
        assert.equal(auto(c, 'deferlante_de_magie_sauvage').partial, true);
        assert.match(auto(c, 'marees_du_chaos').text, /rappel de la Bouffée automatique.*1 case dans l'onglet Combat, rendue au repos long/);
        assert.match(auto(c, 'chaos_maitrise').text, /deux résultats/);
        assert.match(auto(c, 'deferlante_domptee').text, /1 case dans l'onglet Combat/);
        assert.match(auto(c, 'influence_sur_la_chance').text, /Hasard ±1d4/);
    });
});
