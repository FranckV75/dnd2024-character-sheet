/**
 * TESTS UNITAIRES — REST.JS (repos court et repos long, D&D 2024)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    hitDieFaces,
    hitDiceState,
    hitDiceHealing,
    parseManualHitDice,
    canStartRest,
    planShortRest,
    shortRestPatch,
    planLongRest,
    longRestPatch,
    DEATH_SAVE_KEYS
} from '../js/rules/rest.js';
import { createDefaultCharacter } from '../js/state/schema.js';

/** Personnage de test : guerrier niveau 5, CON 14 (+2), d10, 2 dés utilisés */
function makeCharacter(overrides = {}) {
    return {
        ...createDefaultCharacter(),
        char_class: 'Guerrier',
        char_level: '5',
        con_score: '14',
        hd_type: 'd10',
        hd_current: '2',
        hp_max: '44',
        hp_current: '20',
        hp_temp: '5',
        ...overrides
    };
}

const deepFreeze = (obj) => {
    for (const value of Object.values(obj)) if (value && typeof value === 'object') deepFreeze(value);
    return Object.freeze(obj);
};

describe('Dés de vie', () => {
    test('Faces du dé : hd_type, sinon dé de la classe', () => {
        assert.equal(hitDieFaces('d10'), 10);
        assert.equal(hitDieFaces('<div>d8</div>'), 8);
        assert.equal(hitDieFaces('', 'd12'), 12);
        assert.equal(hitDieFaces('', ''), 0);
    });

    test('Dés disponibles = niveau − dés utilisés (bornés)', () => {
        assert.deepEqual(hitDiceState(makeCharacter()), { level: 5, used: 2, available: 3, faces: 10, conMod: 2 });
        assert.equal(hitDiceState(makeCharacter({ hd_current: '9' })).available, 0);
        assert.equal(hitDiceState(makeCharacter({ hd_current: '' })).available, 5);
        assert.equal(hitDiceState(makeCharacter({ hd_current: '<div>1</div>' })).available, 4);
    });

    test('Soins : dé + mod. CON par dé, minimum 1 PV par dé', () => {
        assert.equal(hitDiceHealing([6, 3], 2), 13);
        assert.equal(hitDiceHealing([1], -3), 1);
        assert.equal(hitDiceHealing([1, 6], -2), 1 + 4);
        assert.equal(hitDiceHealing([], 3), 0);
    });

    test('Saisie manuelle : total ou un résultat par dé', () => {
        assert.deepEqual(parseManualHitDice('12', 2, 10, 2), { ok: true, healing: 16, rolls: [12] });
        assert.deepEqual(parseManualHitDice('1 6', 2, 10, -2), { ok: true, healing: 5, rolls: [1, 6] });
        assert.equal(parseManualHitDice('2', 2, 10, -3).healing, 2, 'minimum 1 PV par dé');
        assert.equal(parseManualHitDice('', 1, 10, 0).ok, false);
        assert.equal(parseManualHitDice('25', 2, 10, 0).ok, false, 'au-delà du maximum des dés');
        assert.equal(parseManualHitDice('11 3', 2, 10, 0).ok, false, 'un dé au-delà de ses faces');
        assert.equal(parseManualHitDice('1 2 3', 2, 10, 0).ok, false);
    });

    test('Il faut au moins 1 PV pour commencer un repos', () => {
        assert.equal(canStartRest(makeCharacter({ hp_current: '0' })), false);
        assert.equal(canStartRest(makeCharacter({ hp_current: '1' })), true);
        assert.equal(canStartRest(makeCharacter({ hp_current: '' })), true);
    });
});

describe('Repos court', () => {
    test('Applique les soins plafonnés aux PV max et ajoute les dés dépensés', () => {
        const c = deepFreeze(makeCharacter());
        const patch = shortRestPatch(c, { diceSpent: 2, healing: 15 });
        assert.equal(patch.hp_current, '35');
        assert.equal(patch.hd_current, '4');
        assert.equal(c.hp_current, '20', 'le personnage reçu n’est pas modifié');

        const capped = shortRestPatch(makeCharacter({ hp_current: '40' }), { diceSpent: 1, healing: 9 });
        assert.equal(capped.hp_current, '44');
    });

    test('PV saisis librement : "29", "<div>29</div>", ""', () => {
        assert.equal(shortRestPatch(makeCharacter({ hp_current: '29' }), { diceSpent: 1, healing: 5 }).hp_current, '34');
        assert.equal(shortRestPatch(makeCharacter({ hp_current: '<div>29</div>' }), { diceSpent: 1, healing: 5 }).hp_current, '34');
        assert.equal(shortRestPatch(makeCharacter({ hp_current: '' }), { diceSpent: 1, healing: 5 }).hp_current, '5');
        // PV max non numérique : pas de plafond
        assert.equal(shortRestPatch(makeCharacter({ hp_max: '', hp_current: '29' }), { diceSpent: 1, healing: 50 }).hp_current, '79');
        assert.equal(shortRestPatch(makeCharacter({ hp_max: '<div>30</div>', hp_current: '29' }), { diceSpent: 1, healing: 5 }).hp_current, '30');
        // Des PV au-dessus du maximum ne sont pas réduits
        assert.equal(shortRestPatch(makeCharacter({ hp_current: '50' }), { diceSpent: 1, healing: 5 }).hp_current, undefined);
    });

    test('Ne dépense pas plus de dés que disponibles ; aucun dé = aucun soin', () => {
        const patch = shortRestPatch(makeCharacter(), { diceSpent: 10, healing: 30 });
        assert.equal(patch.hd_current, '5');
        const none = shortRestPatch(makeCharacter(), { diceSpent: 0, healing: 30 });
        assert.equal(none.hp_current, undefined);
        assert.equal(none.hd_current, undefined);
        const empty = planShortRest(makeCharacter({ hd_current: '5' }), { diceSpent: 1, healing: 8 });
        assert.equal(empty.summary.diceSpent, 0);
        assert.equal(empty.patch.hp_current, undefined);
    });

    test('Regagner des PV efface les jets contre la mort', () => {
        const patch = shortRestPatch(makeCharacter({ ds_s1: true, ds_f2: true }), { diceSpent: 1, healing: 4 });
        assert.equal(patch.ds_s1, false);
        assert.equal(patch.ds_f2, false);
    });

    test('Ressource « une utilisation » (Second souffle) : une seule case libérée', () => {
        // Guerrier niv. 5 : 3 utilisations
        const plan = planShortRest(makeCharacter({ class_res_0: true, class_res_1: true }), { diceSpent: 0 });
        assert.deepEqual(plan.patch, { class_res_1: false });
        assert.equal(plan.summary.resourcesRestored, 1);
        assert.deepEqual(shortRestPatch(makeCharacter(), {}), {});
    });

    test('Ressource « toutes » (Moine, Barde niv. 5+) : toutes les cases libérées', () => {
        const monk = makeCharacter({ char_class: 'Moine', class_res_0: true, class_res_2: true, class_res_4: true });
        assert.deepEqual(shortRestPatch(monk, {}), { class_res_0: false, class_res_2: false, class_res_4: false });

        const bard5 = makeCharacter({ char_class: 'Barde', cha_score: '16', class_res_0: true, class_res_1: true });
        assert.deepEqual(shortRestPatch(bard5, {}), { class_res_0: false, class_res_1: false });

        // Barde niv. 4 : Inspiration bardique seulement au repos long
        const bard4 = makeCharacter({ char_class: 'Barde', char_level: '4', cha_score: '16', class_res_0: true });
        assert.deepEqual(shortRestPatch(bard4, {}), {});
    });

    test('Ressource « aucune » (Ensorceleur) sauf Restauration ensorcelée', () => {
        const sorcerer = makeCharacter({
            char_class: 'Ensorceleur', char_level: '6',
            class_res_0: true, class_res_1: true, class_res_2: true, class_res_3: true, class_res_4: true
        });
        assert.deepEqual(shortRestPatch(sorcerer, {}), {});
        // Niveau 6 : jusqu'à 3 points
        assert.deepEqual(shortRestPatch(sorcerer, { sorcerousRestoration: true }),
            { class_res_2: false, class_res_3: false, class_res_4: false });
        // Niveau 4 : pas encore la capacité
        assert.deepEqual(shortRestPatch({ ...sorcerer, char_level: '4' }, { sorcerousRestoration: true }), {});
    });

    test('Sorcier : la magie de pacte revient au repos court', () => {
        const warlock = deepFreeze(makeCharacter({
            char_class: 'Sorcier',
            // Niveau 5 : deux emplacements de pacte de niveau 3
            spell_slots_state: { 3: { used: 2 }, 1: { max: 3, used: 0 } }
        }));
        const plan = planShortRest(warlock, {});
        assert.deepEqual(plan.patch.spell_slots_state, { 3: { used: 0 }, 1: { max: 3, used: 0 } });
        assert.equal(plan.summary.pactSlotsRestored, 2);
        assert.equal(warlock.spell_slots_state[3].used, 2, 'objet d’origine intact');

        // Emplacements ajoutés à la main hors des niveaux de pacte (Arcanum mystique,
        // multiclasse) : ils ne reviennent qu'au repos long
        const arcanum = deepFreeze(makeCharacter({
            char_class: 'Sorcier',
            char_level: '11',
            spell_slots_state: { 5: { used: 3 }, 6: { max: 1, used: 1 }, 1: { max: 2, used: 1 } }
        }));
        const arcanumPlan = planShortRest(arcanum, {});
        assert.deepEqual(arcanumPlan.patch.spell_slots_state,
            { 5: { used: 0 }, 6: { max: 1, used: 1 }, 1: { max: 2, used: 1 } });
        assert.equal(arcanumPlan.summary.pactSlotsRestored, 3);
        assert.deepEqual(longRestPatch(arcanum).spell_slots_state,
            { 5: { used: 0 }, 6: { max: 1, used: 0 }, 1: { max: 2, used: 0 } });
        // Seul un emplacement hors pacte est utilisé : rien à changer au repos court
        const onlyArcanum = makeCharacter({
            char_class: 'Sorcier', char_level: '5',
            spell_slots_state: { 3: { used: 0 }, 6: { max: 1, used: 1 } }
        });
        assert.equal(shortRestPatch(onlyArcanum, {}).spell_slots_state, undefined);
        assert.equal(planShortRest(onlyArcanum, {}).summary.pactSlotsRestored, 0);

        // Autres lanceurs : emplacements inchangés au repos court
        const wizard = makeCharacter({ char_class: 'Magicien', spell_slots_state: { 1: { used: 2 } } });
        assert.equal(shortRestPatch(wizard, {}).spell_slots_state, undefined);
        assert.deepEqual(planShortRest(wizard, {}).summary.slotRecovery, { name: 'Restauration arcanique', maxLevels: 3 });
        const landDruid = makeCharacter({ char_class: 'Druide', char_subclass: 'Cercle de la Terre', char_level: '6' });
        assert.deepEqual(planShortRest(landDruid, {}).summary.slotRecovery, { name: 'Récupération naturelle', maxLevels: 3 });
        assert.equal(planShortRest(makeCharacter(), {}).summary.slotRecovery, null);
    });
});

describe('Repos long', () => {
    test('Restaure tout en un seul patch', () => {
        const c = deepFreeze(makeCharacter({
            fatigue_level: 2,
            class_res_0: true, class_res_1: true,
            ds_s1: true, ds_f3: true,
            combat_buffs: { rage: true },
            spell_slots_state: { 1: { max: 4, used: 3 }, 2: { used: 1 } }
        }));
        const patch = longRestPatch(c);
        assert.equal(patch.hp_current, '44');
        assert.equal(patch.hp_temp, '0');
        assert.equal(patch.hd_current, '0', '2024 : tous les dés de vie dépensés reviennent');
        assert.equal(patch.fatigue_level, 1);
        assert.deepEqual(patch.spell_slots_state, { 1: { max: 4, used: 0 }, 2: { used: 0 } });
        assert.equal(patch.class_res_0, false);
        assert.equal(patch.class_res_1, false);
        assert.equal(patch.class_res_2, false);
        for (const key of DEATH_SAVE_KEYS) assert.equal(patch[key], false);
        assert.deepEqual(patch.combat_buffs, {});
        assert.equal(c.fatigue_level, 2);
    });

    test('Épuisement : jamais en dessous de 0', () => {
        assert.equal(longRestPatch(makeCharacter({ fatigue_level: 0 })).fatigue_level, 0);
        assert.equal(longRestPatch(makeCharacter({ fatigue_level: '' })).fatigue_level, 0);
        assert.equal(longRestPatch(makeCharacter({ fatigue_level: '1' })).fatigue_level, 0);
        assert.equal(longRestPatch(makeCharacter({ fatigue_level: 6 })).fatigue_level, 5);
    });

    test('PV max saisis librement', () => {
        assert.equal(longRestPatch(makeCharacter({ hp_max: '<div>29</div>' })).hp_current, '29');
        assert.equal(longRestPatch(makeCharacter({ hp_max: '29' })).hp_current, '29');
        assert.equal('hp_current' in longRestPatch(makeCharacter({ hp_max: '' })), false, 'PV max inconnus : PV actuels inchangés');
    });

    test('Anciennes cases de ressource et résumé', () => {
        const plan = planLongRest(makeCharacter({ class_res_7: true, hd_current: '3', char_species: 'Humain' }));
        assert.equal(plan.patch.class_res_7, false);
        assert.equal(plan.summary.resourcesRestored, 1);
        assert.equal(plan.summary.hitDiceRecovered, 3);
        assert.equal(plan.summary.heroicInspiration, true);
        assert.deepEqual(plan.patch.spell_slots_state, {});
    });
});
