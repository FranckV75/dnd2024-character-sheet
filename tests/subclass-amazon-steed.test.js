// =============================================================================
// Conclave des Amazones, Magie des Amazones (niveau 5) : monture d'Outremonde du sort Trouver une
// monture — carte de compagnon (js/rules/subclass-companions.js), choix « steed » et « steed_level »
// (js/data/subclass-choices.js). Chiffres : bloc « Otherworldly Steed », PHB 2024 p. 272.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import {
    COMPANION_KEYS, companionCards, steedSpellLevel, companionChoicePatch, restCompanions, setCompanionHpPatch
} from '../js/rules/subclass-companions.js';
import { subclassChoiceFields, subclassChoice } from '../js/rules/subclass-choices.js';
import { subclassFeatures } from '../js/rules/subclass-features.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const amazon = (level, choices, extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Rôdeur', char_subclass: 'Conclave des Amazones', char_level: String(level),
    wis_score: '16', spell_ability: 'wis', ...(choices ? { subclass_choices: { amazon_warrior: choices } } : {}), ...extra
});
const steed = (c) => companionCards(deriveCharacter(c), c).find(card => card.key === COMPANION_KEYS.steed);
const action = (card, name) => card.actions.find(a => a.name.startsWith(name));

describe('Monture de l\'Amazone : choix', () => {
    test('menus « type » et « niveau du sort » à partir du niveau 5, changés en jeu', () => {
        const keys = (level) => subclassChoiceFields(deriveCharacter(amazon(level))).map(f => f.key);
        assert.deepEqual(keys(4), ['stimfee', 'foe']);
        assert.deepEqual(keys(5), ['stimfee', 'foe', 'steed', 'steed_level']);
        const fields = subclassChoiceFields(deriveCharacter(amazon(5)));
        assert.ok(fields.filter(f => f.key.startsWith('steed')).every(f => f.inPlay && f.feature === 'magie_des_amazones'));
        assert.deepEqual(fields.find(f => f.key === 'steed').options.map(([id]) => id), ['celestial', 'fey', 'fiend']);
        assert.deepEqual(fields.find(f => f.key === 'steed_level').options.map(([id]) => id), ['2', '3', '4', '5']);
        // Valeur inconnue ignorée ; choix d'avant le niveau 5 ignorés
        assert.deepEqual(subclassChoice(amazon(5, { steed: 'dragon', steed_level: '9' }), deriveCharacter(amazon(5))), {});
        assert.deepEqual(deriveCharacter(amazon(4, { steed: 'fey' })).subclassChoices, {});
    });

    test('niveau du sort : 2 sans choix, ramené au plus haut emplacement du Rôdeur', () => {
        assert.deepEqual(steedSpellLevel(deriveCharacter(amazon(5))), { level: 2, chosen: null, max: 2 });
        assert.deepEqual(steedSpellLevel(deriveCharacter(amazon(5, { steed_level: '4' }))), { level: 2, chosen: 4, max: 2 });
        assert.deepEqual(steedSpellLevel(deriveCharacter(amazon(9, { steed_level: '3' }))), { level: 3, chosen: 3, max: 3 });
        assert.deepEqual(steedSpellLevel(deriveCharacter(amazon(17, { steed_level: '5' }))), { level: 5, chosen: 5, max: 5 });
    });
});

describe('Monture de l\'Amazone : carte', () => {
    test('pas de carte avant le niveau 5', () => {
        assert.equal(steed(amazon(4)), undefined);
        assert.ok(steed(amazon(5)));
    });

    test('sort de niveau 2 (Fée) : CA 12, PV 25, Coup 1d8 + 2 psychiques, pas de vol', () => {
        // Sagesse 16 (+3), maîtrise +3 : attaque des sorts +6, DD 14
        const card = steed(amazon(5, { steed: 'fey' }));
        assert.equal(card.name, "Monture d'Outremonde (Fée)");
        assert.equal(card.missing, '');
        assert.deepEqual([card.ac.value, card.hp.max, card.hp.current], [12, 25, 25]);
        assert.match(card.hp.dice, /^2d10/);
        assert.equal(card.speed, '18 m');
        assert.deepEqual(card.abilities.map(a => a.save), [4, 1, 2, -2, 1, -1]);
        assert.match(action(card, "Coup d'Outremonde").text, /Corps à corps \+6 .*1d8 \+ 2 psychiques/);
        assert.equal(card.actions.length, 2);
        assert.match(action(card, 'Pas féerique').text, /18 m .*repos long/);
        assert.ok(card.notes.some(n => /Vol 18 m seulement avec un sort de niveau 4/.test(n)));
        assert.ok(card.lines.some(([label, text]) => label === 'Bonus de maîtrise' && text === '+3 (le vôtre)'));
    });

    test('sort de niveau 4 (Fiélon) : CA 14, PV 45, vol, Regard effrayant au DD des sorts', () => {
        const card = steed(amazon(13, { steed: 'fiend', steed_level: '4' }));
        assert.deepEqual([card.ac.value, card.hp.max], [14, 45]);
        assert.equal(card.speed, '18 m, vol 18 m');
        // Maîtrise +5, Sagesse +3 : DD 16, attaque +8
        assert.match(action(card, "Coup d'Outremonde").text, /\+8 .*1d8 \+ 4 nécrotiques/);
        assert.match(action(card, 'Regard effrayant').text, /DD 16/);
    });

    test('Céleste : Toucher guérisseur 2d8 + niveau du sort', () => {
        const card = steed(amazon(9, { steed: 'celestial', steed_level: '3' }));
        assert.match(action(card, 'Toucher guérisseur').text, /2d8 \+ 3 PV/);
        assert.match(action(card, "Coup d'Outremonde").text, /1d8 \+ 3 radiants/);
    });

    test('sans type choisi : message, trois actions bonus marquées, dégâts des trois types', () => {
        const card = steed(amazon(5));
        assert.match(card.missing, /Monture : type/);
        assert.equal(card.actions.length, 4);
        assert.match(card.actions[1].name, /Céleste seulement/);
        assert.match(action(card, "Coup d'Outremonde").text, /radiants \(Céleste\), psychiques \(Fée\) ou nécrotiques \(Fiélon\)/);
    });

    test('niveau choisi au-delà des emplacements : note, carte au plus haut niveau', () => {
        const card = steed(amazon(5, { steed: 'fey', steed_level: '5' }));
        assert.equal(card.ac.value, 12);
        assert.ok(card.notes.some(n => /Niveau 5 choisi.*niveau 2/.test(n)));
    });

    test('sans caractéristique d\'incantation : Sagesse, avec une note', () => {
        const card = steed(amazon(5, { steed: 'fey' }, { spell_ability: '' }));
        assert.match(action(card, "Coup d'Outremonde").text, /\+6/);
        assert.ok(card.notes.some(n => /Sagesse/.test(n)));
    });
});

describe('Monture de l\'Amazone : PV actuels', () => {
    test('PV suivis dans subclass_companions ; nouveau type ou niveau = nouvelle monture, PV pleins', () => {
        const c = amazon(9, { steed: 'fey', steed_level: '3' });
        const hurt = { ...c, ...setCompanionHpPatch(c, COMPANION_KEYS.steed, '12', 35) };
        assert.equal(steed(hurt).hp.current, 12);
        assert.deepEqual(companionChoicePatch(hurt, 'amazon_warrior', 'steed').subclass_companions, {});
        assert.deepEqual(companionChoicePatch(hurt, 'amazon_warrior', 'steed_level').subclass_companions, {});
        assert.deepEqual(companionChoicePatch(hurt, 'amazon_warrior', 'foe'), {});
    });

    test('repos long : blessée, elle revient à PV pleins ; à 0 PV, elle a disparu et le reste', () => {
        const c = amazon(9, { steed: 'fey' });
        const hurt = { ...c, subclass_companions: { [COMPANION_KEYS.steed]: { hp: 7 } } };
        const healed = restCompanions(hurt, deriveCharacter(hurt), 'long');
        assert.deepEqual(healed.patch.subclass_companions, {});
        assert.ok(healed.healed.includes('monture'));
        const gone = { ...c, subclass_companions: { [COMPANION_KEYS.steed]: { hp: 0 } } };
        assert.deepEqual(restCompanions(gone, deriveCharacter(gone), 'long'), { patch: {}, healed: [] });
    });

    test('texte « Dans la fiche » de la Magie des Amazones', () => {
        const auto = (c) => subclassFeatures(deriveCharacter(c)).reached.find(f => f.id === 'magie_des_amazones').automation;
        assert.match(auto(amazon(3)).text, /au niveau 5/);
        assert.match(auto(amazon(5)).text, /Carte de la monture d'Outremonde/);
        assert.equal(auto(amazon(5)).partial, true);
    });
});
