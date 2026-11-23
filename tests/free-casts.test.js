/**
 * TESTS — LANCERS GRATUITS PROPOSÉS PAR « LANCER » (js/rules/free-casts.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    allFreeCasts, freeCastsFor, useFreeCastPatch, arcanumFreeCast, SUBCLASS_FREE_CASTS, CLASS_FREE_CASTS, FREE_CAST_RESET_TEXT
} from '../js/rules/free-casts.js';
import { SUBCLASS_COUNTERS, CLASS_COUNTERS, ARCANUM_LEVELS, restSubclassUses, subclassCounters } from '../js/rules/subclass-uses.js';
import { classGrantedSpells } from '../js/rules/class-progression.js';
import { restFeatSpellUses } from '../js/rules/feat-spells.js';
import { planLongRest } from '../js/rules/rest.js';
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
        const rested = { ...spent, ...planLongRest(spent).patch };
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

    test('capacité inconnue, ou classe sans sort de classe à case : rien n\'est proposé ni créé', () => {
        const paladin = mk({ char_class: 'Paladin', char_level: '5' });
        assert.equal(use(paladin, 'paladin.chatiment'), null);
        assert.deepEqual(all(mk({ char_class: 'Guerrier', char_level: '20' })), []);
        assert.deepEqual(all(mk({ char_class: 'Clerc', char_level: '20' })), []);
    });

    test('personnage vide ou illisible : aucune erreur', () => {
        assert.deepEqual(all(createDefaultCharacter()), []);
        assert.deepEqual(allFreeCasts({}, deriveCharacter({})), []);
    });
});

describe('Lancers gratuits : sorts de classe (cases de CLASS_COUNTERS, clé existante subclass_uses)', () => {
    const paladin = (level, extra = {}) => mk({ char_class: 'Paladin', char_level: String(level), cha_score: '16', ...extra });
    const warlock = (level, extra = {}) => mk({ char_class: 'Occultiste', char_level: String(level), cha_score: '16', ...extra });
    const classCounters = (c) => subclassCounters(c, deriveCharacter(c)).filter(counter => counter.source === 'class');

    test('Paladin : Châtiment de paladin au niveau 2, Fidèle destrier au niveau 5, une case chacun, repos long', () => {
        assert.deepEqual(classCounters(paladin(1)), []);
        assert.deepEqual(classCounters(paladin(2)).map(c => [c.key, c.label, c.max, c.reset, c.featName]),
            [['paladin.chatiment_de_paladin', 'Châtiment de paladin', 1, 'long', 'Paladin']]);
        assert.deepEqual(classCounters(paladin(5)).map(c => c.key), ['paladin.chatiment_de_paladin', 'paladin.fidele_destrier']);
        assert.deepEqual(all(paladin(1)), []);
        assert.deepEqual(all(paladin(4)).map(cast => cast.id), ['paladin.chatiment_de_paladin']);
        const [smite] = forSpell(paladin(5), 'Châtiment divin');
        assert.deepEqual([smite.id, smite.kind, smite.label, smite.max, smite.left, smite.reset],
            ['paladin.chatiment_de_paladin', 'uses', 'Châtiment de paladin', 1, 1, 'long']);
        assert.equal(forSpell(paladin(5), 'Find Steed')[0].label, 'Fidèle destrier');
        assert.deepEqual(forSpell(paladin(4), 'Appel de destrier'), []);
    });

    test('« Lancer gratuit » coche la case (clé écrite au premier usage seulement), le repos long la vide', () => {
        const c = deepFreeze(paladin(5));
        assert.equal(Object.hasOwn(c, 'subclass_uses'), false);
        assert.deepEqual(use(c, 'paladin.chatiment_de_paladin'), { subclass_uses: { 'paladin.chatiment_de_paladin': 1 } });
        const used = { ...c, ...use(c, 'paladin.chatiment_de_paladin') };
        assert.equal(forSpell(used, 'Châtiment divin')[0].left, 0);
        assert.equal(use(used, 'paladin.chatiment_de_paladin'), null);
        // L'autre case n'est pas touchée
        assert.equal(forSpell(used, 'Appel de destrier')[0].left, 1);
        // Repos court : rien ne revient ; repos long : la case se vide et le résumé le dit
        assert.deepEqual(restSubclassUses(used, deriveCharacter(used), 'short').patch, {});
        const rest = restSubclassUses(used, deriveCharacter(used), 'long');
        assert.deepEqual(rest.patch, { subclass_uses: { 'paladin.chatiment_de_paladin': 0 } });
        assert.deepEqual(rest.restored.map(r => [r.inText, r.featName, r.count]), [['Châtiment de paladin', 'Paladin', 1]]);
        const plan = planLongRest(used);
        assert.equal(plan.patch.subclass_uses['paladin.chatiment_de_paladin'], 0);
        // Une fiche qui ne s'en sert pas : le repos long n'écrit pas la clé
        assert.equal(Object.hasOwn(planLongRest(c).patch, 'subclass_uses'), false);
    });

    test('Occultiste : Communication avec le protecteur (Contact avec les plans) au niveau 9', () => {
        assert.deepEqual(all(warlock(8)), []);
        const [contact] = forSpell(warlock(9), 'Contact avec les plans', 'Contact Other Plane');
        assert.deepEqual([contact.id, contact.label, contact.max, contact.reset],
            ['warlock.communication_avec_le_protecteur', 'Communication avec le protecteur', 1, 'long']);
        assert.deepEqual(use(warlock(9), contact.id), { subclass_uses: { 'warlock.communication_avec_le_protecteur': 1 } });
    });

    test('Arcanum mystique : une case par niveau de sort (6 au niveau 11, puis 7, 8, 9 aux niveaux 13, 15, 17)', () => {
        assert.deepEqual(ARCANUM_LEVELS, [[6, 11], [7, 13], [8, 15], [9, 17]]);
        const arcana = (level) => classCounters(warlock(level)).filter(c => c.feature.startsWith('arcanum_')).map(c => c.key);
        assert.deepEqual(arcana(10), []);
        assert.deepEqual(arcana(11), ['warlock.arcanum_6']);
        assert.deepEqual(arcana(13), ['warlock.arcanum_6', 'warlock.arcanum_7']);
        assert.deepEqual(arcana(16), ['warlock.arcanum_6', 'warlock.arcanum_7', 'warlock.arcanum_8']);
        assert.deepEqual(arcana(20), ['warlock.arcanum_6', 'warlock.arcanum_7', 'warlock.arcanum_8', 'warlock.arcanum_9']);
        assert.equal(classCounters(warlock(11)).find(c => c.key === 'warlock.arcanum_6').label, 'Arcanum mystique (niveau 6)');
    });

    test('Arcanum mystique : relié au NIVEAU du sort, pas à son nom (arcanumFreeCast)', () => {
        const c = deepFreeze(warlock(13));
        const d = deriveCharacter(c);
        // Jamais dans les lancers d'un sort nommé
        assert.equal(all(c).some(cast => cast.id.includes('arcanum')), false);
        const six = arcanumFreeCast(c, d, 6);
        assert.deepEqual([six.id, six.kind, six.label, six.max, six.left, six.reset, six.names],
            ['warlock.arcanum_6', 'uses', 'Arcanum mystique', 1, 1, 'long', []]);
        assert.equal(arcanumFreeCast(c, d, '7').id, 'warlock.arcanum_7');
        // Niveau pas encore atteint, niveau hors Arcanum, autre classe : rien
        assert.equal(arcanumFreeCast(c, d, 8), null);
        assert.equal(arcanumFreeCast(c, d, 5), null);
        assert.equal(arcanumFreeCast(c, d, ''), null);
        const wizard = mk({ char_class: 'Magicien', char_level: '20' });
        assert.equal(arcanumFreeCast(wizard, deriveCharacter(wizard), 6), null);
        // La case du niveau 6 se coche, celle du niveau 7 reste libre ; le repos long la rend
        assert.deepEqual(use(c, 'warlock.arcanum_6'), { subclass_uses: { 'warlock.arcanum_6': 1 } });
        const used = { ...c, ...use(c, 'warlock.arcanum_6') };
        assert.equal(arcanumFreeCast(used, deriveCharacter(used), 6).left, 0);
        assert.equal(use(used, 'warlock.arcanum_6'), null);
        assert.equal(arcanumFreeCast(used, deriveCharacter(used), 7).left, 1);
        assert.deepEqual(restSubclassUses(used, deriveCharacter(used), 'short').patch, {});
        assert.equal(restSubclassUses(used, deriveCharacter(used), 'long').patch.subclass_uses['warlock.arcanum_6'], 0);
    });

    test('chaque sort relié existe dans la base, est un sort toujours préparé de la classe, et sa case existe', () => {
        for (const [key, rule] of Object.entries(CLASS_FREE_CASTS)) {
            const [classSlug, feature] = key.split('.');
            assert.ok(CLASS_COUNTERS[classSlug].some(def => def.feature === feature && def.reset === 'long'), key);
            const granted = classGrantedSpells(classSlug, 20);
            for (const [vo, name] of rule.spells) {
                const spell = findSpellByName(db, name);
                assert.ok(spell, name);
                assert.equal(spellNameKey(spell.vo), spellNameKey(vo), name);
                assert.ok(granted.some(entry => entry.vo === vo && entry.name === name), name);
            }
        }
    });

    test('une valeur enregistrée abîmée ou trop grande ne casse rien', () => {
        const c = paladin(5, { subclass_uses: { 'paladin.chatiment_de_paladin': 9, 'paladin.fidele_destrier': 'x' } });
        assert.equal(forSpell(c, 'Châtiment divin')[0].left, 0);
        assert.equal(forSpell(c, 'Appel de destrier')[0].left, 1);
    });
});
