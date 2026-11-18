/**
 * TESTS — LANCERS GRATUITS PROPOSÉS PAR « LANCER » (js/rules/free-casts.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allFreeCasts, freeCastsFor, useFreeCastPatch, SUBCLASS_FREE_CASTS, FREE_CAST_RESET_TEXT } from '../js/rules/free-casts.js';
import { SUBCLASS_COUNTERS, restSubclassUses } from '../js/rules/subclass-uses.js';
import { restFeatSpellUses } from '../js/rules/feat-spells.js';
import { longRestPatch } from '../js/rules/rest.js';
import { findSpellByName, spellNameKey } from '../js/rules/spells.js';
import { deriveCharacter } from '../js/rules/character.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const db = Array.isArray(base) ? base : Object.values(base);

const mk = (extra) => ({ ...createDefaultCharacter(), ...extra });
const all = (c) => allFreeCasts(c, deriveCharacter(c));
const forSpell = (c, ...names) => freeCastsFor(c, deriveCharacter(c), names);
const use = (c, id) => useFreeCastPatch(c, deriveCharacter(c), id);

function deepFreeze(value) {
    if (value && typeof value === 'object') {
        Object.freeze(value);
        for (const inner of Object.values(value)) deepFreeze(inner);
    }
    return value;
}

const ranger = (level, extra = {}) => mk({ char_class: 'Rôdeur', char_level: String(level), wis_score: '16', ...extra });
const feyTouched = (extra = {}) => mk({
    char_class: 'Magicien', char_level: '4', int_score: '16', feat_4: 'affinite_feerique',
    feat_choices: { 4: { affinite_feerique: { ability: 'int', spell: 'Bless' } } }, ...extra
});

describe('Lancers gratuits : Ennemi juré du Rôdeur (PHB 2024, « Favored Enemy »)', () => {
    test('Marque du chasseur : 2 lancers, puis 3, 4, 5, 6 aux niveaux 5, 9, 13, 17 ; repos long', () => {
        for (const [level, max] of [[1, 2], [4, 2], [5, 3], [9, 4], [13, 5], [17, 6], [20, 6]]) {
            const [cast] = forSpell(ranger(level), 'Marque du chasseur');
            assert.deepEqual([cast.label, cast.max, cast.left, cast.reset], ['Ennemi juré', max, max, 'long'], `niveau ${level}`);
        }
    });

    test('nom français, nom anglais, majuscules et accents : le même sort', () => {
        for (const name of ['Marque du chasseur', "Hunter's Mark", 'MARQUE DU CHASSEUR', ' marque  du chasseur ']) {
            assert.equal(forSpell(ranger(5), name).length, 1, name);
        }
        assert.deepEqual(forSpell(ranger(5), 'Soins'), []);
        assert.deepEqual(forSpell(ranger(5), ''), []);
        assert.deepEqual(forSpell(ranger(5)), []);
    });

    test('choisir le lancer gratuit coche la première case libre de la ressource de classe', () => {
        const c = deepFreeze(ranger(5, { class_res_0: true }));
        assert.equal(forSpell(c, 'Marque du chasseur')[0].left, 2);
        assert.deepEqual(use(c, 'class.ennemi_jure'), { class_res_1: true });
        // Case du milieu décochée à la main : c'est elle qui est reprise
        assert.deepEqual(use(ranger(5, { class_res_0: true, class_res_2: true }), 'class.ennemi_jure'), { class_res_1: true });
    });

    test('plus aucun lancer : rien n\'est écrit, l\'option reste listée (grisée) avec son repos', () => {
        const c = ranger(1, { class_res_0: true, class_res_1: true });
        const [cast] = forSpell(c, 'Marque du chasseur');
        assert.deepEqual([cast.left, cast.used, cast.reset], [0, 2, 'long']);
        assert.equal(use(c, 'class.ennemi_jure'), null);
        assert.match(FREE_CAST_RESET_TEXT.long, /repos long/);
        assert.match(FREE_CAST_RESET_TEXT.short, /repos court ou long/);
    });

    test('décocher la case annule ; le repos long rend tout', () => {
        const spent = { ...ranger(5), ...use(ranger(5), 'class.ennemi_jure') };
        assert.equal(forSpell(spent, 'Marque du chasseur')[0].left, 2);
        assert.equal(forSpell({ ...spent, class_res_0: false }, 'Marque du chasseur')[0].left, 3);
        const rested = { ...spent, ...longRestPatch(spent) };
        assert.equal(forSpell(rested, 'Marque du chasseur')[0].left, 3);
    });

    test('une autre classe n\'a pas ce lancer gratuit, même avec le sort (serment de Vengeance)', () => {
        const paladin = mk({ char_class: 'Paladin', char_subclass: 'Serment de vengeance', char_level: '5' });
        assert.deepEqual(forSpell(paladin, 'Marque du chasseur'), []);
    });
});

describe('Lancers gratuits : dons (clé existante feat_uses)', () => {
    test('Affinité féerique : un lancer par sort, indépendants, repos long', () => {
        const c = deepFreeze(feyTouched());
        const [misty] = forSpell(c, 'Foulée brumeuse');
        assert.deepEqual([misty.id, misty.label, misty.max, misty.left, misty.reset],
            ['affinite_feerique@4:fixed', 'Affinité féerique', 1, 1, 'long']);
        assert.equal(forSpell(c, 'Bless')[0].id, 'affinite_feerique@4:spell');
        assert.deepEqual(use(c, misty.id), { feat_uses: { 'affinite_feerique@4:fixed': 1 } });
        const spent = { ...c, ...use(c, misty.id) };
        assert.equal(forSpell(spent, 'Misty Step')[0].left, 0);
        assert.equal(forSpell(spent, 'Bénédiction')[0].left, 1, 'l\'autre sort garde son lancer');
        assert.equal(use(spent, misty.id), null);
        // Les autres usages de dons ne sont pas touchés
        assert.deepEqual(use({ ...c, feat_uses: { chanceux: 2 } }, misty.id), { feat_uses: { chanceux: 2, 'affinite_feerique@4:fixed': 1 } });
        // Repos long : le lancer revient
        const rested = { ...spent, ...restFeatSpellUses(spent, deriveCharacter(spent)).patch };
        assert.equal(forSpell(rested, 'Foulée brumeuse')[0].left, 1);
    });

    test('Initié à la magie et Télépathe ; un sort mineur de don n\'a pas de lancer gratuit', () => {
        const c = mk({
            char_class: 'Guerrier', char_level: '8', feat_1: 'initie_a_la_magie', feat_8: 'telepathe',
            feat_choices: {
                1: { initie_a_la_magie: { list: 'cleric', castAbility: 'wis', cantrip1: 'Guidance', cantrip2: 'Sacred Flame', spell: 'Healing Word' } },
                8: { telepathe: { ability: 'int' } }
            }
        });
        assert.deepEqual(all(c).map(cast => cast.id).sort(), ['initie_a_la_magie@1:spell', 'telepathe@8:fixed']);
        assert.equal(forSpell(c, 'Mot de guérison')[0].label, 'Initié à la magie');
        assert.equal(forSpell(c, 'Détection des pensées')[0].label, 'Télépathe');
        assert.deepEqual(forSpell(c, 'Assistance'), []);
    });

    test('don pas encore atteint : rien', () => {
        assert.deepEqual(all(feyTouched({ char_level: '3' })), []);
    });
});

describe('Lancers gratuits : espèce et sous-classes (clé existante subclass_uses)', () => {
    test('Elfe drow : Lueurs féeriques, une fois par repos long', () => {
        const c = deepFreeze(mk({ char_class: 'Magicien', char_level: '3', char_species: 'Elfe', int_score: '16', species_choices: { option: 'drow', ability: 'int' } }));
        const [cast] = forSpell(c, 'Lueurs féeriques');
        assert.deepEqual([cast.id, cast.label, cast.max, cast.left, cast.reset], ['species.sort_faerie_fire', 'Elfe', 1, 1, 'long']);
        assert.deepEqual(use(c, cast.id), { subclass_uses: { 'species.sort_faerie_fire': 1 } });
        const spent = { ...c, ...use(c, cast.id) };
        assert.equal(forSpell(spent, 'Faerie Fire')[0].left, 0);
        assert.equal(use(spent, cast.id), null);
        const rested = { ...spent, ...restSubclassUses(spent, deriveCharacter(spent), 'long').patch };
        assert.equal(forSpell(rested, 'Lueurs féeriques')[0].left, 1);
    });

    test('Vagabond féerique : Foulée brumeuse (Sagesse fois) et Convocation de fée (une fois), en plus d\'Ennemi juré', () => {
        const c = ranger(15, { char_subclass: 'Vagabond féerique' });
        assert.deepEqual(all(c).map(cast => [cast.id, cast.max, cast.reset]), [
            ['class.ennemi_jure', 5, 'long'],
            ['fey_wanderer.renforts_feeriques', 1, 'long'],
            ['fey_wanderer.errant_des_brumes', 3, 'long']
        ]);
        const spent = { ...c, ...use(c, 'fey_wanderer.errant_des_brumes') };
        assert.deepEqual(spent.subclass_uses, { 'fey_wanderer.errant_des_brumes': 1 });
        assert.equal(forSpell(spent, 'Foulée brumeuse')[0].left, 2);
        // Capacité pas encore atteinte (niveau 15) : pas proposée
        assert.deepEqual(forSpell(ranger(11, { char_subclass: 'Vagabond féerique' }), 'Foulée brumeuse'), []);
    });

    test('Empirisme (Philosophe de l\'Académie) : une seule case pour l\'un des deux sorts, repos court', () => {
        const c = mk({
            char_class: 'Magicien', char_subclass: 'Philosophe de l\'Académie', char_level: '3', int_score: '16',
            subclass_choices: { academy_philosopher: { school: 'empirisme' } }
        });
        const [identify] = forSpell(c, 'Identification');
        assert.deepEqual([identify.label, identify.max, identify.reset], ['Empirisme (sort gratuit)', 1, 'short']);
        const spent = { ...c, ...use(c, identify.id) };
        assert.equal(forSpell(spent, 'Détection de la magie')[0].left, 0, 'la même case sert aux deux sorts');
        const rested = { ...spent, ...restSubclassUses(spent, deriveCharacter(spent), 'short').patch };
        assert.equal(forSpell(rested, 'Identification')[0].left, 1);
    });

    test('deux capacités pour le même sort : les deux sont proposées', () => {
        const c = feyTouched({ char_class: 'Occultiste', char_subclass: 'Protecteur Archifée', char_level: '4', cha_score: '16' });
        assert.deepEqual(forSpell(c, 'Foulée brumeuse').map(cast => [cast.label, cast.max]), [
            ['Affinité féerique', 1], ['Foulée des fées', 3]
        ]);
    });

    test('chaque case reliée existe, a un sort connu de la base, et se recharge au repos court ou long', () => {
        const defs = new Map(Object.entries(SUBCLASS_COUNTERS).flatMap(([subclass, list]) => list.map(def => [`${subclass}.${def.feature}`, def])));
        for (const [key, rule] of Object.entries(SUBCLASS_FREE_CASTS)) {
            const def = defs.get(key);
            assert.ok(def, `case inconnue : ${key}`);
            const reset = typeof def.reset === 'function' ? def.reset({ level: 20 }) : def.reset;
            assert.ok(['long', 'short'].includes(reset), key);
            for (const [vo, name] of rule.spells) {
                const spell = findSpellByName(db, name);
                assert.ok(spell, `sort inconnu : ${name}`);
                assert.equal(spellNameKey(spell.vo), spellNameKey(vo), name);
            }
        }
    });

    test('cases partagées entre plusieurs sorts ou plusieurs lancers : jamais reliées', () => {
        for (const key of ['demigod_bloodline.ancetre_divin', 'illusionist.creatures_fantasmagoriques',
            'circle_of_the_land.recuperation_naturelle', 'college_of_glamour.manteau_de_majeste', 'diviner.troisieme_il']) {
            assert.equal(Object.hasOwn(SUBCLASS_FREE_CASTS, key), false, key);
        }
    });

    test('capacités sans case dans la fiche (Châtiment divin du Paladin, Arcanum…) : rien n\'est proposé ni créé', () => {
        const paladin = mk({ char_class: 'Paladin', char_level: '5' });
        assert.deepEqual(all(paladin), []);
        const warlock = mk({ char_class: 'Occultiste', char_level: '11' });
        assert.deepEqual(all(warlock), []);
        assert.equal(use(paladin, 'paladin.chatiment'), null);
    });

    test('personnage vide ou illisible : aucune erreur', () => {
        assert.deepEqual(all(createDefaultCharacter()), []);
        assert.deepEqual(allFreeCasts({}, deriveCharacter({})), []);
    });
});
