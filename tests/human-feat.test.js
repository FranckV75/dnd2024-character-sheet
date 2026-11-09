/**
 * TESTS UNITAIRES — SECOND DON D'ORIGINE DE L'HUMAIN (trait Polyvalent, clé feat_0)
 * Règle vérifiée dans le Player's Handbook 2024 anglais (Human, p. 191 : « Versatile. You gain an
 * Origin feat of your choice »), en plus du don d'origine donné par l'historique (feat_1).
 * La clé feat_0 ne compte que pour un Humain ; elle n'est jamais effacée ni renommée.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { featSlots, reachedFeatIds, isHuman, featSlotName } from '../js/rules/feats.js';
import { featEffects } from '../js/rules/feat-effects.js';
import { featChoiceGrants } from '../js/rules/feat-choices.js';
import { featSpellGroups } from '../js/rules/feat-spells.js';
import { featCounters } from '../js/rules/feat-uses.js';
import { planLongRest } from '../js/rules/rest.js';
import { deriveCharacter } from '../js/rules/character.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { createDefaultCharacter, FEAT_SLOT_ORDER, HUMAN_FEAT_SLOT, featSlotLevel } from '../js/state/schema.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { V4_ONLY_KEYS, withoutV4State } from '../js/cloud/sync.js';

/** Guerrier humain niveau 4 : Vigilant (historique) et Robuste (Polyvalent) */
const human = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_class: 'Guerrier', char_species: 'Humain', char_level: '4',
    dex_score: '14', con_score: '14', wis_score: '14', hp_max: '40', hp_current: '40',
    feat_1: 'vigilant', feat_0: 'robuste',
    ...extra
});

describe("Humain : second don d'origine (feat_0)", () => {
    test("emplacement acquis au niveau 1, rangé juste après celui de l'historique", () => {
        assert.equal(HUMAN_FEAT_SLOT, 0);
        assert.equal(featSlotLevel(0), 1);
        assert.equal(featSlotLevel('4'), 4);
        assert.deepEqual(FEAT_SLOT_ORDER.slice(0, 3), [1, 0, 2]);
        assert.equal(featSlotName(0), 'niveau 1 (Humain)');
        assert.equal(featSlotName(8), 'niveau 8');
    });

    test("espèce lue comme la v3 : « Humain », « Human », avec ou sans HTML", () => {
        for (const value of ['Humain', 'humain', 'Human', '<b>Humain</b>', ' Humain ']) assert.equal(isHuman({ char_species: value }), true, value);
        for (const value of ['', 'Elfe', 'Demi-humain', undefined]) assert.equal(isHuman({ char_species: value }), false, String(value));
        assert.equal(isHuman(null), false);
    });

    test('les deux dons comptent dès le niveau 1, dans l\'ordre de la fiche', () => {
        const character = human({ char_level: '1', feat_4: 'chanceux' });
        assert.deepEqual(featSlots(character).map(s => [s.level, s.featId, s.reached]),
            [[1, 'vigilant', true], [0, 'robuste', true], [4, 'chanceux', false]]);
        assert.deepEqual(reachedFeatIds(character), ['vigilant', 'robuste']);
    });

    test("autre espèce : feat_0 ne compte pas, et la valeur saisie reste telle quelle", () => {
        const character = human({ char_species: 'Elfe' });
        assert.deepEqual(reachedFeatIds(character), ['vigilant']);
        assert.equal(character.feat_0, 'robuste');
        const effects = featEffects(character, deriveCharacter(character));
        assert.equal(effects['featSlot:0'], undefined);
    });

    test('les effets du don de l\'Humain sont calculés (Robuste, Vigilant)', () => {
        const character = human();
        const d = deriveCharacter(character);
        // Vigilant (historique) : bonus de maîtrise à l'Initiative ; Robuste (Polyvalent) : 2 × niveau
        assert.equal(d.initiative, 2 + 2);
        const effects = featEffects(character, d);
        assert.ok(effects['featSlot:0'].some(n => n.featId === 'robuste' && /\+8 PV max/.test(n.text)));
        assert.ok(effects['featSlot:1'].some(n => n.featId === 'vigilant'));
    });

    test('un don répétable pris deux fois au niveau 1 : un choix par emplacement (Doué)', () => {
        const character = human({
            feat_1: 'doue', feat_0: 'doue',
            feat_choices: { 1: { doue: { pick1: 'athletics' } }, 0: { doue: { pick1: 'stealth' } } }
        });
        const grants = featChoiceGrants(character);
        assert.deepEqual(grants.map(g => [g.level, g.skills.map(s => s.skill)]), [[1, ['athletics']], [0, ['stealth']]]);
    });

    test("même liste d'Initié à la magie aux deux emplacements : l'avertissement nomme l'emplacement", () => {
        const choice = { list: 'cleric', castAbility: 'wis', cantrip1: 'Guidance', cantrip2: 'Sacred Flame', spell: 'Healing Word' };
        const character = human({
            feat_1: 'initie_a_la_magie', feat_0: 'initie_a_la_magie',
            feat_choices: { 1: { initie_a_la_magie: choice }, 0: { initie_a_la_magie: { ...choice, cantrip1: 'Light' } } }
        });
        const groups = featSpellGroups(character, deriveCharacter(character));
        assert.deepEqual(groups.map(g => g.level), [1, 0]);
        assert.ok(groups[1].warnings.some(w => /au niveau 1 :/.test(w)), groups[1].warnings.join(' / '));
        // Lancer gratuit propre à l'emplacement de l'Humain, vidé au repos long
        assert.equal(groups[1].spells.find(s => s.free).free.key, 'initie_a_la_magie@0:spell');
        const rested = planLongRest({ ...character, feat_uses: { 'initie_a_la_magie@0:spell': 1 } });
        assert.equal(rested.patch.feat_uses['initie_a_la_magie@0:spell'], 0);
    });

    test("don non répétable pris deux fois : le second est signalé, avec le nom de l'emplacement", () => {
        const character = human({ feat_1: 'vigilant', feat_0: 'vigilant' });
        assert.deepEqual(reachedFeatIds(character), ['vigilant']);
        // Don à choix non répétable (sauvegarde retouchée : la liste de l'Humain ne le propose pas)
        const twice = human({
            feat_1: 'observateur', feat_0: 'observateur',
            feat_choices: { 1: { observateur: { ability: 'wis' } }, 0: { observateur: { ability: 'int' } } }
        });
        const effects = featEffects(twice, deriveCharacter(twice));
        assert.ok(effects['featSlot:0'].some(n => n.check && /déjà pris au niveau 1 :/.test(n.text)), JSON.stringify(effects['featSlot:0']));
        // Doué est répétable : pas d'alerte
        const doue = human({ feat_1: 'doue', feat_0: 'doue' });
        assert.ok(!Object.values(featEffects(doue, deriveCharacter(doue))).flat().some(n => /déjà pris/.test(n.text)));
    });

    test('compteurs : Chanceux pris par le trait Polyvalent', () => {
        const character = human({ feat_0: 'chanceux' });
        const counters = featCounters(character, deriveCharacter(character));
        assert.deepEqual(counters.map(c => [c.featId, c.level, c.max]), [['chanceux', 0, 2]]);
    });

    test("le même don d'origine pris deux fois (historique et Polyvalent) : alerte, pas de second calcul", () => {
        const character = human({ char_level: '1', feat_1: 'robuste', feat_0: 'robuste' });
        const effects = featEffects(character, deriveCharacter(character));
        const slot0 = effects['featSlot:0'];
        assert.equal(slot0.length, 1);
        assert.ok(slot0[0].check && /Robuste est déjà pris au niveau 1 : ce don ne se prend qu'une fois/.test(slot0[0].text), slot0[0].text);
        assert.ok(effects['featSlot:1'].some(n => /\+2 PV max/.test(n.text)));
        // Don sans calcul (Façonneur) : l'alerte aussi
        const crafter = human({ feat_1: 'faconneur', feat_0: 'faconneur' });
        assert.ok(featEffects(crafter, deriveCharacter(crafter))['featSlot:0'].some(n => n.check));
        // Don répétable (Doué) : aucune alerte
        const skilled = human({ feat_1: 'doue', feat_0: 'doue' });
        assert.ok(!Object.values(featEffects(skilled, deriveCharacter(skilled))).flat().some(n => /déjà pris/.test(n.text)));
    });

    test("synchronisation : feat_0 fait partie des clés que la v3 efface (comparaison sans elle)", () => {
        assert.ok(V4_ONLY_KEYS.includes('feat_0'));
        const v4 = human();
        const v3 = { ...v4 };
        delete v3.feat_0;
        assert.deepEqual(withoutV4State(v4), withoutV4State(v3));
        assert.equal(v4.feat_0, 'robuste', 'fiche d\'origine intacte');
    });

    test("sauvegarde : feat_0 absente d'une fiche vierge, gardée par la migration", () => {
        assert.equal('feat_0' in createDefaultCharacter(), false);
        const { character } = migrateCharacter({ char_species: 'Humain', feat_1: 'vigilant', feat_0: 'robuste', feat_choices: { 0: { doue: { pick1: 'stealth' } } } });
        assert.equal(character.feat_0, 'robuste');
        assert.deepEqual(character.feat_choices, { 0: { doue: { pick1: 'stealth' } } });
    });

    test("la liste du second don ne propose que des dons d'origine (et il en existe)", () => {
        const origin = Object.entries(FEATS_DATA).filter(([, f]) => f.type === 'Origine').map(([id]) => id);
        assert.ok(origin.length >= 10);
        for (const id of ['vigilant', 'robuste', 'chanceux', 'doue', 'initie_a_la_magie']) assert.ok(origin.includes(id), id);
    });
});
