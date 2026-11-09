/**
 * TESTS UNITAIRES — DONS DE CLASSE EN PLUS (clés feat_6, feat_10, feat_14)
 * Player's Handbook 2024 anglais : le Guerrier reprend « Ability Score Improvement » aux niveaux
 * 6, 8, 12, 14 et 16, le Roublard aux niveaux 8, 10, 12 et 16 (en plus du niveau 4 commun).
 * Ces clés ne comptent que pour leur classe ; elles ne sont jamais effacées ni renommées.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { featSlots, reachedFeatIds, classFeatSlot, featSlotCounts, featSlotName } from '../js/rules/feats.js';
import { featEffects } from '../js/rules/feat-effects.js';
import { featChoiceGrants } from '../js/rules/feat-choices.js';
import { featCounters } from '../js/rules/feat-uses.js';
import { deriveCharacter } from '../js/rules/character.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { V4_ONLY_KEYS, withoutV4State } from '../js/cloud/sync.js';
import { createDefaultCharacter, FEAT_SLOT_ORDER, CLASS_FEAT_SLOTS, featSlotLevel } from '../js/state/schema.js';

const hero = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_class: 'Guerrier', char_level: '14', str_score: '16', dex_score: '14', con_score: '14',
    feat_1: 'vigilant', feat_4: 'robuste',
    ...extra
});

describe('Dons de classe en plus (Guerrier 6 et 14, Roublard 10)', () => {
    test('emplacements rangés à leur niveau, acquis à ce niveau', () => {
        assert.deepEqual(FEAT_SLOT_ORDER, [1, 0, 2, 4, 6, 7, 8, 10, 12, 14, 16, 19]);
        assert.deepEqual(CLASS_FEAT_SLOTS[6].classes, ['fighter']);
        assert.deepEqual(CLASS_FEAT_SLOTS[10].classes, ['rogue']);
        assert.deepEqual(CLASS_FEAT_SLOTS[14].classes, ['fighter']);
        for (const slot of [6, 10, 14]) assert.equal(featSlotLevel(slot), slot);
        assert.equal(classFeatSlot(6).caption, 'Guerrier : don en plus');
        assert.equal(classFeatSlot('10').reserved, 'Réservé aux Roublards');
        assert.equal(classFeatSlot(4), null);
        assert.equal(classFeatSlot(0), null);
        assert.equal(featSlotName(14), 'niveau 14');
    });

    test('classe lue comme la v3 : « Guerrier », « Fighter », avec ou sans HTML', () => {
        for (const value of ['Guerrier', 'guerrier', 'Fighter', 'fighter', '<b>Guerrier</b>', ' Guerrier ']) {
            assert.equal(featSlotCounts(6, { char_class: value }), true, value);
        }
        for (const value of ['', 'Roublard', 'Paladin', undefined]) assert.equal(featSlotCounts(6, { char_class: value }), false, String(value));
        assert.equal(featSlotCounts(10, { char_class: 'Roublard' }), true);
        assert.equal(featSlotCounts(10, { char_class: 'Rogue' }), true);
        assert.equal(featSlotCounts(10, { char_class: 'Guerrier' }), false);
        assert.equal(featSlotCounts(8, { char_class: '' }), true);
        assert.equal(featSlotCounts(6, null), false);
    });

    test('Guerrier : feat_6 et feat_14 comptent, dans l\'ordre de la fiche, selon le niveau', () => {
        const fighter = hero({ char_level: '13', feat_6: 'sentinelle', feat_8: 'mobile', feat_14: 'gaillard' });
        assert.deepEqual(featSlots(fighter).map(s => [s.level, s.featId, s.reached]),
            [[1, 'vigilant', true], [4, 'robuste', true], [6, 'sentinelle', true], [8, 'mobile', true], [14, 'gaillard', false]]);
        assert.deepEqual(reachedFeatIds(fighter), ['vigilant', 'robuste', 'sentinelle', 'mobile']);
    });

    test('Roublard : feat_10 compte, pas feat_6 ni feat_14', () => {
        const rogue = hero({ char_class: 'Roublard', feat_6: 'sentinelle', feat_10: 'mobile', feat_14: 'gaillard' });
        assert.deepEqual(featSlots(rogue).map(s => s.level), [1, 4, 10]);
        assert.ok(reachedFeatIds(rogue).includes('mobile'));
        assert.ok(!reachedFeatIds(rogue).includes('sentinelle'));
    });

    test('autre classe : le don noté ne compte pas, et la valeur saisie reste telle quelle', () => {
        const wizard = hero({ char_class: 'Magicien', feat_6: 'mobile' });
        assert.deepEqual(reachedFeatIds(wizard), ['vigilant', 'robuste']);
        assert.equal(wizard.feat_6, 'mobile');
        assert.equal(featEffects(wizard)['featSlot:6'], undefined);
        assert.equal(featEffects(wizard).speed.length, 0);
    });

    test('effets, choix et cases des dons de classe calculés comme les autres', () => {
        const fighter = hero({
            feat_6: 'chanceux', feat_14: 'amelioration_de_caracteristique',
            feat_choices: { 14: { amelioration_de_caracteristique: { asi: 'str,str' } } }
        });
        assert.ok(featCounters(fighter, deriveCharacter(fighter)).some(c => c.featId === 'chanceux' && c.level === 6));
        assert.ok(featChoiceGrants(fighter).some(g => g.level === 14));
        assert.ok(Array.isArray(featEffects(fighter)['featSlot:14']));
    });

    test('même don au niveau 4 et au niveau 6 : alerte « déjà pris » sous le second', () => {
        const fighter = hero({ feat_4: 'sentinelle', feat_6: 'sentinelle' });
        const texts = (featEffects(fighter)['featSlot:6'] ?? []).map(n => n.text).join(' ');
        assert.match(texts, /déjà pris au niveau 4/);
    });

    test('sauvegarde : clés absentes d\'une fiche vierge, gardées par la migration', () => {
        const blank = createDefaultCharacter();
        for (const key of ['feat_6', 'feat_10', 'feat_14']) assert.equal(key in blank, false, key);
        const { character } = migrateCharacter({ char_class: 'Guerrier', feat_6: 'mobile', feat_14: 'gaillard', feat_10: 'robuste' });
        assert.equal(character.feat_6, 'mobile');
        assert.equal(character.feat_14, 'gaillard');
        assert.equal(character.feat_10, 'robuste');
    });

    test('synchronisation : ces clés font partie de celles que la v3 efface', () => {
        for (const key of ['feat_6', 'feat_10', 'feat_14']) assert.ok(V4_ONLY_KEYS.includes(key), key);
        const v4 = hero({ feat_6: 'mobile' });
        const v3 = { ...v4 };
        delete v3.feat_6;
        assert.deepEqual(withoutV4State(v3), withoutV4State(v4));
        assert.equal(v4.feat_6, 'mobile');
    });
});
