// =============================================================================
// Sous-classes, lot 7 : choix de sous-classe mémorisés (clé subclass_choices) et leurs effets
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import {
    SUBCLASS_CHOICES_KEY, subclassChoicesState, subclassChoiceFields, subclassChoice, chosenValues,
    setSubclassChoicePatch, subclassChoiceNotes
} from '../js/rules/subclass-choices.js';
import { subclassDefenseNotes } from '../js/rules/subclass-combat.js';
import { subclassFeatures } from '../js/rules/subclass-features.js';
import { SUBCLASS_CHOICE_FIELDS } from '../js/data/subclass-choices.js';
import { SUBCLASS_FEATURES } from '../js/data/subclass-features.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const record = (cls, subclass, level, extra = {}) => ({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level), ...extra
});
const wild = (level, choices, extra = {}) => record('Barbare', 'Voie du Cœur Sauvage', level,
    { subclass_choices: { path_of_the_wild_heart: choices }, ...extra });

describe('Choix de sous-classe : sauvegarde', () => {
    test('clé propre à la v4, absente des anciennes fiches, gardée par la migration', () => {
        assert.equal(SUBCLASS_CHOICES_KEY, 'subclass_choices');
        assert.ok(V4_ONLY_KEYS.includes('subclass_choices'));
        assert.equal('subclass_choices' in createDefaultCharacter(), false);
        const c = wild(6, { aspect: 'owl' });
        assert.deepEqual(migrateCharacter(JSON.parse(JSON.stringify(c))).character.subclass_choices, c.subclass_choices);
        assert.equal(migrateCharacter(JSON.parse(JSON.stringify(record('Barbare', '', 1)))).character.subclass_choices, undefined);
    });

    test('état abîmé ou absent : aucun choix', () => {
        assert.deepEqual(subclassChoicesState({}), {});
        assert.deepEqual(subclassChoicesState({ subclass_choices: [1] }), {});
        assert.deepEqual(subclassChoicesState({ subclass_choices: null }), {});
        const d = deriveCharacter(record('Barbare', 'Voie du Cœur Sauvage', 6, { subclass_choices: { path_of_the_wild_heart: 'x' } }));
        assert.deepEqual(d.subclassChoices, {});
    });

    test('valeur inconnue ou capacité pas encore atteinte : ignorée', () => {
        assert.deepEqual(deriveCharacter(wild(6, { rage: 'tiger', aspect: 'owl', power: 'falcon' })).subclassChoices, { aspect: 'owl' });
        assert.deepEqual(deriveCharacter(wild(3, { aspect: 'owl', rage: 'bear' })).subclassChoices, { rage: 'bear' });
        assert.deepEqual(deriveCharacter(wild(14, { power: 'falcon' })).subclassChoices, { power: 'falcon' });
    });

    test('rangés par sous-classe : une autre sous-classe ne les voit pas', () => {
        const c = record('Barbare', 'Voie du Berserker', 6, { subclass_choices: { path_of_the_wild_heart: { aspect: 'owl' } } });
        assert.deepEqual(deriveCharacter(c).subclassChoices, {});
    });

    test('patch : enregistre, efface, refuse un champ ou une valeur inconnus, ne touche pas au reste', () => {
        const c = wild(6, { rage: 'bear' }, { subclass_choices: { path_of_the_wild_heart: { rage: 'bear' }, autre: { x: 'y' } } });
        assert.deepEqual(setSubclassChoicePatch(c, 'path_of_the_wild_heart', 'aspect', 'salmon'),
            { subclass_choices: { path_of_the_wild_heart: { rage: 'bear', aspect: 'salmon' }, autre: { x: 'y' } } });
        assert.deepEqual(setSubclassChoicePatch(c, 'path_of_the_wild_heart', 'rage', '').subclass_choices.path_of_the_wild_heart, {});
        assert.deepEqual(setSubclassChoicePatch(c, 'path_of_the_wild_heart', 'rage', 'tiger'), {});
        assert.deepEqual(setSubclassChoicePatch(c, 'path_of_the_wild_heart', 'nope', 'bear'), {});
        assert.deepEqual(setSubclassChoicePatch(c, 'unknown', 'rage', 'bear'), {});
        assert.deepEqual(c.subclass_choices.path_of_the_wild_heart, { rage: 'bear' });
    });

    test('menus selon le niveau, avec le choix de jeu (inPlay)', () => {
        const at = (level) => subclassChoiceFields({ subclass: 'path_of_the_wild_heart', level }).map(f => [f.key, f.inPlay]);
        assert.deepEqual(at(2), []);
        assert.deepEqual(at(3), [['rage', true]]);
        assert.deepEqual(at(14), [['rage', true], ['aspect', true], ['power', true]]);
    });

    test('chosenValues : un menu ou plusieurs menus numérotés, dans l\'ordre', () => {
        assert.deepEqual(chosenValues({ rage: 'bear' }, 'rage'), ['bear']);
        assert.deepEqual(chosenValues({ maneuver2: 'b', maneuver1: 'a', maneuver10: 'c', other: 'x' }, 'maneuver'), ['a', 'b', 'c']);
        assert.deepEqual(chosenValues(undefined, 'rage'), []);
    });
});

describe('Données des choix : cohérence', () => {
    test('chaque menu vise une sous-classe et une capacité connues ; valeurs et clés uniques', () => {
        for (const [subclass, fields] of Object.entries(SUBCLASS_CHOICE_FIELDS)) {
            assert.ok(DD_RULES.subclasses[subclass], subclass);
            const keys = new Set();
            for (const field of fields) {
                assert.ok(SUBCLASS_FEATURES[subclass].some(f => f.id === field.feature), `${subclass}.${field.feature}`);
                assert.ok(!keys.has(field.key), `${subclass}.${field.key} en double`);
                keys.add(field.key);
                assert.match(field.key, /^[a-z][a-z_]*$/, 'clé sans chiffre final (menus numérotés)');
                const values = field.options.map(([value]) => value);
                assert.equal(new Set(values).size, values.length, `${subclass}.${field.key} : option en double`);
                for (const value of values) assert.match(value, /^[a-z0-9_]+$/);
            }
        }
    });
});

describe('Voie du Cœur sauvage', () => {
    const defenses = (c) => subclassDefenseNotes(deriveCharacter(c), c).armorClass ?? [];

    test('Ours : repère de Résistance tant qu\'aucun autre choix n\'est fait ; retiré avec l\'Aigle ou le Loup', () => {
        assert.equal(defenses(wild(3, {})).filter(n => n.featId === 'rage_sauvage').length, 1);
        assert.equal(defenses(wild(3, { rage: 'bear' })).filter(n => n.featId === 'rage_sauvage').length, 1);
        assert.equal(defenses(wild(3, { rage: 'eagle' })).filter(n => n.featId === 'rage_sauvage').length, 0);
        const on = defenses(wild(3, { rage: 'bear' }, { combat_buffs: { rage: true } })).find(n => n.featId === 'rage_sauvage');
        assert.equal(on.inactive, undefined);
    });

    test('Aspect sauvage : escalade ou nage près de la Vitesse', () => {
        const speed = (choices) => {
            const c = wild(6, choices);
            return (subclassChoiceNotes(deriveCharacter(c), c).speed ?? []).map(n => n.text);
        };
        assert.deepEqual(speed({ aspect: 'panther' }), ["Vitesse d'escalade égale à votre Vitesse."]);
        assert.deepEqual(speed({ aspect: 'salmon' }), ['Vitesse de nage égale à votre Vitesse.']);
        assert.deepEqual(speed({ aspect: 'owl' }), []);
        assert.deepEqual(speed({}), []);
    });

    test('Puissance sauvage, Faucon : vol pendant la Rage, éteint sans Rage ou avec une armure', () => {
        const falcon = (extra) => {
            const c = wild(14, { power: 'falcon' }, extra);
            return subclassChoiceNotes(deriveCharacter(c), c).speed[0];
        };
        assert.equal(falcon({ combat_buffs: { rage: true } }).inactive, undefined);
        assert.equal(falcon({}).inactive, true);
        assert.equal(falcon({ combat_buffs: { rage: true }, dynamic_armors: [{ name: 'Cuir clouté', type: 'Légère', ca: '12', equipped: true }] }).inactive, true);
    });

    test('textes « Dans la fiche » selon l\'option choisie', () => {
        const auto = (choices, id, level = 14) => subclassFeatures(deriveCharacter(wild(level, choices))).reached.find(f => f.id === id).automation.text;
        assert.match(auto({}, 'rage_sauvage'), /Option à choisir/);
        assert.match(auto({ rage: 'wolf' }, 'rage_sauvage'), /Loup choisi/);
        assert.match(auto({ aspect: 'owl' }, 'aspect_sauvage'), /vision dans le noir à 18 m/);
        assert.match(auto({ power: 'falcon' }, 'puissance_sauvage'), /vol = Vitesse/);
    });
});

describe('Chasseur', () => {
    const hunter = (choices, extra = {}) => record('Rôdeur', 'Chasseur', 7, { subclass_choices: { hunter: choices }, ...extra });

    test('Briseur de hordes : bouton Tueur de colosses retiré, et un bouton resté allumé ne compte plus', async () => {
        const { subclassBuffs, effectiveBuffs } = await import('../js/rules/weapons.js');
        const buttons = (choices) => { const c = hunter(choices); return subclassBuffs(c, deriveCharacter(c)); };
        assert.deepEqual(buttons({}), ['colossusSlayer']);
        assert.deepEqual(buttons({ prey: 'colossus' }), ['colossusSlayer']);
        assert.deepEqual(buttons({ prey: 'horde' }), []);
        const c = hunter({ prey: 'horde' }, { combat_buffs: { colossusSlayer: true } });
        assert.equal(effectiveBuffs('ranger', c.combat_buffs, c, deriveCharacter(c)).colossusSlayer, false);
    });

    test('Tactiques défensives : option mémorisée et rappelée', () => {
        const text = (choices) => subclassFeatures(deriveCharacter(hunter(choices))).reached.find(f => f.id === 'tactiques_defensives').automation.text;
        assert.match(text({ tactics: 'escape' }), /attaques d'opportunité/);
        assert.match(text({}), /à choisir/);
    });
});

describe('Maître de guerre : manœuvres et Disciple de la guerre', async () => {
    const { maneuversKnown, knownManeuvers, maneuverNumbers, subclassCombatWeaponNotes } = await import('../js/rules/subclass-combat.js');
    const { MANEUVERS } = await import('../js/data/maneuvers.js');
    const bm = (level, choices, extra = {}) => record('Guerrier', 'Maître de Guerre', level, { subclass_choices: { battle_master: choices }, ...extra });

    test('20 manœuvres ; 3, 5, 7 puis 9 connues', () => {
        assert.equal(MANEUVERS.length, 20);
        assert.deepEqual([1, 2, 3, 6, 7, 9, 10, 14, 15, 20].map(maneuversKnown), [0, 0, 3, 3, 5, 5, 7, 7, 9, 9]);
        const keys = (level) => subclassChoiceFields({ subclass: 'battle_master', level }).filter(f => f.group === 'maneuver').map(f => f.key);
        assert.deepEqual(keys(3), ['maneuver1', 'maneuver2', 'maneuver3']);
        assert.equal(keys(15).length, 9);
    });

    test('doublon et menu pas encore atteint : ignorés ; choix conservés dans la sauvegarde', () => {
        const c = bm(3, { maneuver1: 'parry', maneuver2: 'parry', maneuver3: 'riposte', maneuver4: 'rally' });
        const d = deriveCharacter(c);
        assert.deepEqual(knownManeuvers(d).map(m => m.id), ['parry', 'riposte']);
        assert.equal(c.subclass_choices.battle_master.maneuver4, 'rally');
        assert.deepEqual(knownManeuvers(deriveCharacter(bm(7, c.subclass_choices.battle_master))).map(m => m.id), ['parry', 'riposte', 'rally']);
    });

    test('chiffres : Parade, Ralliement, DD', () => {
        const parry = MANEUVERS.find(m => m.id === 'parry');
        const rally = MANEUVERS.find(m => m.id === 'rally');
        const trip = MANEUVERS.find(m => m.id === 'trip_attack');
        assert.equal(maneuverNumbers(parry, deriveCharacter(bm(3, {}, { str_score: '16', dex_score: '12' }))), '1d8 + 3 dégâts en moins');
        assert.equal(maneuverNumbers(parry, deriveCharacter(bm(3, {}, { str_score: '8', dex_score: '8' }))), '1d8 - 1 dégâts en moins');
        assert.equal(maneuverNumbers(rally, deriveCharacter(bm(10, {}))), '1d10 + 5 PV temporaires');
        assert.equal(maneuverNumbers(rally, deriveCharacter(bm(18, {}))), '1d12 + 9 PV temporaires');
        assert.equal(maneuverNumbers(trip, deriveCharacter(bm(5, {}, { dex_score: '18' }))), '1d8 ; DD 15 (Force)');
    });

    test('sous les armes : manœuvres jouées avec une attaque ; pas Attaque circulaire à distance', () => {
        const d = deriveCharacter(bm(3, { maneuver1: 'trip_attack', maneuver2: 'sweeping_attack', maneuver3: 'parry' }));
        const melee = subclassCombatWeaponNotes({ name: 'Épée longue', prop: 'Polyvalente' }, d)[0].text;
        assert.match(melee, /Connues : Croc-en-jambe \(For\), Attaque circulaire\./);
        const ranged = subclassCombatWeaponNotes({ name: 'Arc long', prop: 'Munitions (45/180 m), Lourde, À deux mains' }, d)[0].text;
        assert.doesNotMatch(ranged, /circulaire/);
    });

    test('repères : Embuscade (Initiative, Discrétion), Parade (CA), compétence du Disciple à cocher', () => {
        const c = bm(3, { maneuver1: 'ambush', maneuver2: 'parry', student_skill: 'athletics' });
        const zones = subclassChoiceNotes(deriveCharacter(c), c);
        assert.ok(zones.initiative && zones['skills.stealth']);
        assert.equal(zones.armorClass[0].mention, 'Parade');
        assert.equal(zones['skills.athletics'][0].check, true);
        const ticked = { ...c, skill_prof_athletics: true };
        assert.equal(subclassChoiceNotes(deriveCharacter(ticked), ticked)['skills.athletics'], undefined);
    });

    test('bloc Sous-classe : liste chiffrée des manœuvres choisies', () => {
        const f = subclassFeatures(deriveCharacter(bm(3, { maneuver1: 'rally' }))).reached.find(x => x.id === 'superiorite_martiale_man_uvres');
        assert.match(f.automation.text, /^1 manœuvre choisie sur 3/);
        assert.match(f.automation.list[0], /^Ralliement \(1d8 \+ 1 PV temporaires\)/);
    });
});
