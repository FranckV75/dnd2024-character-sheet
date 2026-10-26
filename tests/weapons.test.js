/**
 * TESTS UNITAIRES — RULES/WEAPONS.JS (tableau des armes)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    weaponReach,
    matchesWeaponFilter,
    rowFromRulebookWeapon,
    completeRowFromRulebook,
    normalizeDamageDie,
    readWeaponConfig,
    buildWeaponConfig,
    buffsForClass,
    buffsForCharacter,
    featBuffs,
    effectiveBuffs,
    isBlankWeapon,
    toggleBuff,
    removeWeapon,
    restoreWeapon
} from '../js/rules/weapons.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { EMPTY_WEAPON } from '../js/state/schema.js';
import { findRulebookWeapon } from '../js/state/migrate.js';

const ref = (name) => DD_RULES.weapons.find(w => w.name === name);
const row = (name) => rowFromRulebookWeapon({ ...EMPTY_WEAPON }, ref(name));

describe('weaponReach', () => {
    test('munitions : à distance uniquement', () => {
        assert.deepEqual(weaponReach(row('Arc long')), { melee: false, ranged: true });
    });
    test('lancer : corps à corps et distance', () => {
        assert.deepEqual(weaponReach(row('Dague')), { melee: true, ranged: true });
        assert.deepEqual(weaponReach(row('Javeline')), { melee: true, ranged: true });
    });
    test('fléchette : arme courante à distance (PHB) malgré la seule propriété Lancer', () => {
        assert.deepEqual(weaponReach(row('Fléchette')), { melee: false, ranged: true });
        assert.deepEqual(weaponReach({ name: 'Fléchettes (10)', prop: 'Finesse, Lancer' }), { melee: false, ranged: true });
    });
    test('sans propriété de portée : corps à corps', () => {
        assert.deepEqual(weaponReach(row('Épée longue')), { melee: true, ranged: false });
        assert.deepEqual(weaponReach({}), { melee: true, ranged: false });
    });
    test('propriétés avec HTML hérité', () => {
        assert.equal(weaponReach({ prop: '<b>Munitions</b> (24/96 m)' }).ranged, true);
    });
});

describe('matchesWeaponFilter', () => {
    const sword = row('Épée longue');
    const dagger = row('Dague');
    const bow = row('Arc court');
    const legacy = { ...EMPTY_WEAPON, name: 'Rayon de givre', prop: '18 m' };

    test('toutes', () => {
        for (const w of [sword, dagger, bow, legacy]) assert.equal(matchesWeaponFilter(w, 'all'), true);
    });
    test('courantes / guerre selon la catégorie', () => {
        assert.equal(matchesWeaponFilter(dagger, 'simple'), true);
        assert.equal(matchesWeaponFilter(sword, 'simple'), false);
        assert.equal(matchesWeaponFilter(sword, 'martial'), true);
        assert.equal(matchesWeaponFilter(legacy, 'martial'), false);
    });
    test('corps à corps / distance', () => {
        assert.equal(matchesWeaponFilter(sword, 'melee'), true);
        assert.equal(matchesWeaponFilter(sword, 'ranged'), false);
        assert.equal(matchesWeaponFilter(bow, 'melee'), false);
        assert.equal(matchesWeaponFilter(bow, 'ranged'), true);
        assert.equal(matchesWeaponFilter(dagger, 'melee'), true);
        assert.equal(matchesWeaponFilter(dagger, 'ranged'), true);
    });
    test('une ligne sans nom reste visible', () => {
        assert.equal(matchesWeaponFilter({ ...EMPTY_WEAPON }, 'martial'), true);
    });
    test('filtre inconnu : tout est visible', () => {
        assert.equal(matchesWeaponFilter(sword, 'xyz'), true);
    });
});

describe('rowFromRulebookWeapon', () => {
    test('remplit les champs de calcul et garde le reste', () => {
        const before = { ...EMPTY_WEAPON, ammo: '20', note: 'Héritage', legacyKey: 'x', weaponConfig: '{"magicBonus":1}' };
        const result = rowFromRulebookWeapon(before, ref('Hache à deux mains'));
        assert.equal(result.name, 'Hache à deux mains');
        assert.equal(result.atkKey, 'FOR');
        assert.equal(result.baseDmg, '1d12 tran.');
        assert.equal(result.prop, 'Lourde, Deux mains');
        assert.equal(result.prof, 'Enchaînement');
        assert.equal(result.category, 'Guerre');
        assert.equal(result.ammo, '20');
        assert.equal(result.note, 'Héritage');
        assert.equal(result.legacyKey, 'x');
        assert.equal(result.weaponConfig, '{"magicBonus":1}');
        assert.equal(before.name, '', 'la ligne d\'origine n\'est pas modifiée');
    });
});

describe('completeRowFromRulebook', () => {
    test('nom saisi à la main : complète les champs vides, garde le nom', () => {
        const typed = { ...EMPTY_WEAPON, name: 'Hachettes (3)', prof: 'Perso' };
        const result = completeRowFromRulebook(typed, findRulebookWeapon(typed.name));
        assert.equal(result.name, 'Hachettes (3)');
        assert.equal(result.atkKey, 'FOR');
        assert.equal(result.baseDmg, '1d6 tran.');
        assert.equal(result.category, 'Courante');
        assert.equal(result.prop, 'Légère, Lancer (6/18 m)');
        assert.equal(result.prof, 'Perso');
    });
    test('déjà rattachée ou inconnue : inchangée', () => {
        const linked = row('Dague');
        assert.equal(completeRowFromRulebook(linked, ref('Rapière')), linked);
        const custom = { ...EMPTY_WEAPON, name: 'Épée de Korgul' };
        assert.equal(completeRowFromRulebook(custom, findRulebookWeapon(custom.name)), custom);
    });
});

describe('normalizeDamageDie', () => {
    test('formats valides', () => {
        assert.deepEqual(normalizeDamageDie('1d8'), { ok: true, value: '1d8' });
        assert.deepEqual(normalizeDamageDie(' 2D6 '), { ok: true, value: '2d6' });
        assert.deepEqual(normalizeDamageDie('1 d 12'), { ok: true, value: '1d12' });
        assert.deepEqual(normalizeDamageDie(''), { ok: true, value: '' });
        assert.deepEqual(normalizeDamageDie(undefined), { ok: true, value: '' });
    });
    test('formats refusés', () => {
        for (const bad of ['d8', '1d7', '0d6', '21d6', '1d8+2', 'abc', '8']) {
            assert.equal(normalizeDamageDie(bad).ok, false, bad);
        }
    });
});

describe('readWeaponConfig', () => {
    test('chaîne JSON v3', () => {
        assert.deepEqual(readWeaponConfig('{"statOverride":"cha","magicBonus":2,"dmgDieOverride":"1d10","dmgTypeOverride":"RADI"}'),
            { statOverride: 'cha', magicBonus: 2, dmgDieOverride: '1d10', dmgTypeOverride: 'RADI' });
    });
    test('vide, invalide ou valeurs inconnues → Auto', () => {
        const auto = { statOverride: '', magicBonus: 0, dmgDieOverride: '', dmgTypeOverride: '' };
        assert.deepEqual(readWeaponConfig(''), auto);
        assert.deepEqual(readWeaponConfig('{oops'), auto);
        assert.deepEqual(readWeaponConfig({ statOverride: 'con', magicBonus: 'x', dmgDieOverride: null, dmgTypeOverride: 'LAVE' }), auto);
    });
    test('dé de dégâts libre v3 rendu tel quel (jamais effacé)', () => {
        assert.equal(readWeaponConfig('{"dmgDieOverride":"1d8+1d6"}').dmgDieOverride, '1d8+1d6');
        assert.equal(readWeaponConfig({ dmgDieOverride: ' 2d4 + 1 ' }).dmgDieOverride, '2d4 + 1');
        assert.equal(readWeaponConfig({ dmgDieOverride: '1D8' }).dmgDieOverride, '1d8');
    });
    test('bonus magique borné', () => {
        assert.equal(readWeaponConfig({ magicBonus: 7 }).magicBonus, 3);
        assert.equal(readWeaponConfig({ magicBonus: '1' }).magicBonus, 1);
    });
});

describe('buildWeaponConfig', () => {
    test('produit la chaîne JSON au format v3', () => {
        const result = buildWeaponConfig({ statOverride: 'wis', magicBonus: 1, dmgDieOverride: '1D8', dmgTypeOverride: 'FORCE' });
        assert.equal(result.ok, true);
        assert.deepEqual(JSON.parse(result.value),
            { statOverride: 'wis', magicBonus: 1, dmgDieOverride: '1d8', dmgTypeOverride: 'FORCE' });
    });
    test('conserve les clés inconnues de l\'ancienne configuration', () => {
        const result = buildWeaponConfig({ statOverride: '', magicBonus: 0, dmgDieOverride: '', dmgTypeOverride: '' },
            '{"magicBonus":3,"custom":"ok"}');
        assert.deepEqual(JSON.parse(result.value),
            { magicBonus: 0, custom: 'ok', statOverride: '', dmgDieOverride: '', dmgTypeOverride: '' });
    });
    test('ancien dé libre v3 conservé quand il est laissé tel quel', () => {
        const previous = '{"statOverride":"","magicBonus":0,"dmgDieOverride":"1d8+1d6","dmgTypeOverride":""}';
        const form = { ...readWeaponConfig(previous), magicBonus: 2 };
        const result = buildWeaponConfig(form, previous);
        assert.equal(result.ok, true);
        assert.deepEqual(JSON.parse(result.value),
            { statOverride: '', magicBonus: 2, dmgDieOverride: '1d8+1d6', dmgTypeOverride: '' });
    });
    test('ancien dé libre v3 modifié : la nouvelle valeur doit être valide', () => {
        const previous = '{"dmgDieOverride":"1d8+1d6"}';
        const bad = buildWeaponConfig({ statOverride: '', magicBonus: 0, dmgDieOverride: '1d8+2d6', dmgTypeOverride: '' }, previous);
        assert.equal(bad.ok, false);
        assert.ok(bad.errors.dmgDieOverride);
        const cleared = buildWeaponConfig({ statOverride: '', magicBonus: 0, dmgDieOverride: '', dmgTypeOverride: '' }, previous);
        assert.equal(JSON.parse(cleared.value).dmgDieOverride, '');
    });
    test('erreurs de validation', () => {
        const result = buildWeaponConfig({ statOverride: 'con', magicBonus: 4, dmgDieOverride: '1d7', dmgTypeOverride: 'LAVE' });
        assert.equal(result.ok, false);
        assert.deepEqual(Object.keys(result.errors).sort(), ['dmgDieOverride', 'dmgTypeOverride', 'magicBonus', 'statOverride']);
    });
});

describe('bonus de combat', () => {
    test('selon la classe', () => {
        assert.deepEqual(buffsForClass('barbarian'), ['rage']);
        assert.deepEqual(buffsForClass('rogue'), ['sneakAttack']);
        assert.deepEqual(buffsForClass('ranger'), ['hunterMark']);
        assert.deepEqual(buffsForClass('wizard'), []);
        assert.deepEqual(buffsForClass(''), []);
    });
    test("un bonus hors de la classe actuelle n'est pas appliqué", () => {
        const buffs = { rage: true, sneakAttack: true, hunterMark: true };
        const none = { rage: false, sneakAttack: false, hunterMark: false, heavyWeaponMaster: false };
        assert.deepEqual(effectiveBuffs('barbarian', buffs), { ...none, rage: true });
        assert.deepEqual(effectiveBuffs('fighter', buffs), none);
        assert.deepEqual(effectiveBuffs('rogue', undefined), none);
    });
    test('Cogneur lourd : proposé seulement si le don est choisi à un niveau atteint', () => {
        const id = 'maitre_des_armes_lourdes_cogneur_lourd';
        assert.deepEqual(featBuffs({ char_level: '4', feat_4: id }), ['heavyWeaponMaster']);
        assert.deepEqual(featBuffs({ char_level: '<b>4</b>', feat_4: id }), ['heavyWeaponMaster']);
        assert.deepEqual(featBuffs({ char_level: '7', feat_8: id }), [], 'don prévu pour plus tard');
        assert.deepEqual(featBuffs({ char_level: '12', feat_4: 'alerte' }), []);
        assert.deepEqual(featBuffs(null), []);
        assert.deepEqual(buffsForCharacter('barbarian', { char_level: '4', feat_4: id }), ['rage', 'heavyWeaponMaster']);
        assert.deepEqual(buffsForCharacter('fighter', { char_level: '3' }), []);
    });
    test('Cogneur lourd : appliqué seulement avec le don, quelle que soit la classe', () => {
        const id = 'maitre_des_armes_lourdes_cogneur_lourd';
        const on = { heavyWeaponMaster: true };
        assert.equal(effectiveBuffs('fighter', on, { char_level: '4', feat_4: id }).heavyWeaponMaster, true);
        assert.equal(effectiveBuffs('fighter', on, { char_level: '4' }).heavyWeaponMaster, false);
        assert.equal(effectiveBuffs('fighter', on).heavyWeaponMaster, false, 'sans le personnage : classe seule');
    });
    test("ligne d'arme vide", () => {
        assert.equal(isBlankWeapon({ ...EMPTY_WEAPON }), true);
        assert.equal(isBlankWeapon({ ...EMPTY_WEAPON, name: '<br>' }), true);
        assert.equal(isBlankWeapon(null), true);
        assert.equal(isBlankWeapon({ ...EMPTY_WEAPON, name: 'Hachette' }), false);
        assert.equal(isBlankWeapon({ ...EMPTY_WEAPON, note: 'x4' }), false);
        assert.equal(isBlankWeapon({ ...EMPTY_WEAPON, dmg: '1d6' }), false, 'ancienne valeur v3 saisie à la main');
    });
    test('bascule sans modifier l\'objet d\'origine', () => {
        const before = { rage: true };
        assert.deepEqual(toggleBuff(before, 'rage'), { rage: false });
        assert.deepEqual(toggleBuff(before, 'hunterMark'), { rage: true, hunterMark: true });
        assert.deepEqual(toggleBuff(null, 'rage'), { rage: true });
        assert.deepEqual(before, { rage: true });
    });
});

describe('suppression / annulation', () => {
    test('supprime puis réinsère à la même place', () => {
        const list = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
        const removed = removeWeapon(list, 1);
        assert.deepEqual(removed.map(w => w.name), ['A', 'C']);
        assert.equal(list.length, 3);
        assert.deepEqual(restoreWeapon(removed, 1, list[1]).map(w => w.name), ['A', 'B', 'C']);
        assert.deepEqual(restoreWeapon([], 5, list[1]).map(w => w.name), ['B']);
    });
});
