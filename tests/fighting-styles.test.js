/**
 * TESTS UNITAIRES — STYLES DE COMBAT (lot 4 des dons actifs)
 * Player's Handbook 2024 anglais : Fighting Style (Guerrier niveau 1, Paladin et Rôdeur niveau 2,
 * Guerrier béni / Guerrier druidique à la place), Additional Fighting Style (Champion niveau 7),
 * dons « Fighting Style » p. 209-210 (Archery, Blind Fighting, Defense, Dueling, Great Weapon
 * Fighting, Interception, Protection, Thrown Weapon Fighting, Two-Weapon Fighting, Unarmed Fighting).
 * La fiche ne modifie jamais une valeur saisie : la CA et les armes sont calculées, le reste est rappelé.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { featSlots, reachedFeatIds, featSlotCounts, featSlotLevelFor, featSlotName, featName, hasFightingStyle } from '../js/rules/feats.js';
import { featEffects, weaponFeatNotes } from '../js/rules/feat-effects.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { effectiveBuffs, rowFromRulebookWeapon } from '../js/rules/weapons.js';
import { armorRowFromCatalogue } from '../js/rules/armors.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { EMPTY_WEAPON, createDefaultCharacter, STYLE_FEAT_SLOT } from '../js/state/schema.js';

const weapon = (name) => rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name));
const armor = (name) => ({ ...armorRowFromCatalogue(EQUIPMENT_DATA.armors.find(a => a.name === name)), equipped: true });

/** Guerrier niveau 5 (bonus de maîtrise +3), For 16, Dex 14 */
const hero = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_class: 'Guerrier', char_level: '5', str_score: '16', dex_score: '14', con_score: '14',
    ...extra
});
const slotTexts = (character, slot) => (featEffects(character)[`featSlot:${slot}`] ?? []).map(n => n.text);

describe('Emplacement « Style de combat » (feat_2) et style en plus du Champion (feat_7)', () => {
    test('Guerrier : acquis au niveau 1 ; Paladin et Rôdeur : au niveau 2 ; autres classes : non', () => {
        assert.equal(STYLE_FEAT_SLOT, 2);
        assert.equal(featSlotLevelFor(2, { char_class: 'Guerrier' }), 1);
        assert.equal(featSlotLevelFor(2, { char_class: 'Paladin' }), 2);
        assert.equal(featSlotName(2), 'style de combat');
        assert.deepEqual(reachedFeatIds(hero({ char_level: '1', feat_2: 'defense' })), ['defense']);
        assert.deepEqual(reachedFeatIds(hero({ char_class: 'Paladin', char_level: '1', feat_2: 'defense' })), []);
        assert.deepEqual(reachedFeatIds(hero({ char_class: 'Rôdeur', char_level: '2', feat_2: 'archerie' })), ['archerie']);
        assert.deepEqual(reachedFeatIds(hero({ char_class: 'Magicien', feat_2: 'defense' })), []);
        assert.equal(featSlotCounts(2, { char_class: 'Fighter' }), true);
        assert.equal(featSlotCounts(2, { char_class: 'Roublard' }), false);
    });

    test('Champion : un second style au niveau 7, pas pour une autre sous-classe', () => {
        const champion = hero({ char_level: '7', char_subclass: 'Champion', feat_2: 'defense', feat_7: 'archerie' });
        assert.deepEqual(featSlots(champion).map(s => [s.level, s.featId, s.reached]), [[2, 'defense', true], [7, 'archerie', true]]);
        assert.deepEqual(reachedFeatIds(hero({ char_level: '7', char_subclass: 'Maître de guerre', feat_7: 'archerie' })), []);
        assert.equal(featSlotName(7), 'niveau 7 (Champion)');
    });

    test('capacité Style de combat : Guerrier dès 1, Paladin et Rôdeur dès 2', () => {
        assert.equal(hasFightingStyle({ char_class: 'Guerrier', char_level: '1' }), true);
        assert.equal(hasFightingStyle({ char_class: 'Paladin', char_level: '1' }), false);
        assert.equal(hasFightingStyle({ char_class: 'Paladin', char_level: '2' }), true);
        assert.equal(hasFightingStyle({ char_class: 'Clerc', char_level: '8' }), false);
    });

    test('style pris dans un emplacement général sans la capacité : alerte de prérequis', () => {
        assert.ok(slotTexts(hero({ char_class: 'Magicien', feat_4: 'defense' }), 4).some(t => /^Prérequis : la capacité Style de combat/.test(t)));
        assert.ok(!slotTexts(hero({ feat_4: 'defense' }), 4).some(t => /^Prérequis/.test(t)));
    });

    test('même style deux fois : alerte « déjà pris » sous le second', () => {
        const texts = slotTexts(hero({ char_level: '7', char_subclass: 'Champion', feat_2: 'defense', feat_7: 'defense' }), 7);
        assert.ok(texts.some(t => /déjà pris au style de combat/.test(t)));
    });

    test('Guerrier béni / druidique à la place du style : nom, rappel, alerte si mauvaise classe', () => {
        const paladin = hero({ char_class: 'Paladin', char_level: '2', feat_2: 'guerrier_beni' });
        assert.equal(featName('guerrier_beni'), 'Guerrier béni');
        assert.ok(slotTexts(paladin, 2).some(t => /sorts mineurs de Clerc.*Charisme/.test(t)));
        assert.ok(!(featEffects(paladin)['featSlot:2'] ?? []).some(n => n.check));
        const wrong = hero({ char_class: 'Rôdeur', char_level: '2', feat_2: 'guerrier_beni' });
        assert.ok((featEffects(wrong)['featSlot:2'] ?? []).some(n => n.check && /option du Paladin/.test(n.text)));
    });
});

describe('Défense : +1 à la CA en armure', () => {
    test('compté dans la CA calculée avec une armure, pas sans', () => {
        const mail = [armor('Cotte de mailles')];
        const base = deriveCharacter(hero({ dynamic_armors: mail })).armorClass.value;
        const withStyle = deriveCharacter(hero({ feat_2: 'defense', dynamic_armors: mail })).armorClass;
        assert.equal(withStyle.value, base + 1);
        assert.ok(withStyle.parts.some(p => /Défense/.test(p.label) && p.value === '+1'));
        const naked = hero({ feat_2: 'defense' });
        assert.equal(deriveCharacter(naked).armorClass.value, deriveCharacter(hero()).armorClass.value);
        assert.ok(featEffects(naked).armorClass.every(n => n.inactive));
    });

    test('un bouclier seul ne suffit pas (il faut une armure)', () => {
        const shieldOnly = hero({ feat_2: 'defense', prof_armor_shield: true, dynamic_armors: [armor('Bouclier')] });
        const without = hero({ prof_armor_shield: true, dynamic_armors: [armor('Bouclier')] });
        assert.equal(deriveCharacter(shieldOnly).armorClass.value, deriveCharacter(without).armorClass.value);
    });
});

describe('Styles sur les armes', () => {
    test('Archerie : +2 à l\'attaque des armes à distance, pas des armes lancées de corps à corps', () => {
        const c = hero({ feat_2: 'archerie' });
        const d = deriveCharacter(c);
        const plain = deriveCharacter(hero());
        assert.match(computeWeapon(weapon('Arc court'), d).attack.text, /DEX : \+7/);
        assert.match(computeWeapon(weapon('Arc court'), plain).attack.text, /DEX : \+5/);
        assert.match(computeWeapon(weapon('Fléchette'), d).attack.text, /FOR : \+8/); // Finesse : For +3 meilleure
        assert.equal(computeWeapon(weapon('Dague'), d).attack.text, computeWeapon(weapon('Dague'), plain).attack.text);
        assert.match(computeWeapon(weapon('Arc court'), d).attack.tooltip, /Archerie \(\+2\)/);
    });

    test('Duel : bouton proposé avec le don ; +2 aux armes de corps à corps qui ne sont pas à Deux mains', () => {
        const c = hero({ feat_2: 'duel', combat_buffs: { dueling: true } });
        const d = deriveCharacter(c);
        const buffs = effectiveBuffs(d.classSlug, c.combat_buffs, c);
        assert.equal(buffs.dueling, true);
        assert.equal(effectiveBuffs(d.classSlug, c.combat_buffs, hero()).dueling, false);
        assert.match(computeWeapon(weapon('Épée longue'), d, buffs).damage.text, /\+2 \(Duel\)/);
        assert.doesNotMatch(computeWeapon(weapon('Hache à deux mains'), d, buffs).damage.text, /Duel/);
        assert.doesNotMatch(computeWeapon(weapon('Arc court'), d, buffs).damage.text, /Duel/);
    });

    test('Arme à deux mains : rappel sur les armes Deux mains et Polyvalentes, avec le dé à deux mains', () => {
        const c = hero({ feat_2: 'arme_a_deux_mains' });
        const longsword = weaponFeatNotes(weapon('Épée longue'), c).find(n => n.featId === 'arme_a_deux_mains');
        assert.match(longsword.text, /1 ou 2.*compte comme un 3.*1d10/);
        assert.ok(weaponFeatNotes(weapon('Hache à deux mains'), c).some(n => n.featId === 'arme_a_deux_mains'));
        assert.ok(!weaponFeatNotes(weapon('Dague'), c).some(n => n.featId === 'arme_a_deux_mains'));
    });

    test('Arme de lancer : dégâts lancés +2 calculés', () => {
        const c = hero({ feat_2: 'arme_de_lancer' });
        const dagger = weaponFeatNotes(weapon('Dague'), c).find(n => n.featId === 'arme_de_lancer');
        assert.match(dagger.text, /dégâts 1d4 \+3 PERF \+2 \(Arme de lancer\)/);
        const javelin = weaponFeatNotes(weapon('Javeline'), c).find(n => n.featId === 'arme_de_lancer');
        assert.match(javelin.text, /1d6 \+3 PERF \+2 \(Arme de lancer\)/);
        // Ancien dé libre (v3) : le +2 reste compté
        const legacy = { ...weapon('Javeline'), weaponConfig: JSON.stringify({ dmgDieOverride: '1d6 + 1d4' }) };
        assert.match(weaponFeatNotes(legacy, c).find(n => n.featId === 'arme_de_lancer').text, /1d6 \+ 1d4 \+3 PERF \+2 \(Arme de lancer\)/);
        assert.ok(!weaponFeatNotes(weapon('Épée longue'), c).some(n => n.featId === 'arme_de_lancer'));
    });

    test('Combat à deux armes : rappel sur les armes Légères, avec les dégâts', () => {
        const c = hero({ feat_2: 'combat_a_deux_armes' });
        const shortsword = weaponFeatNotes(weapon('Épée courte'), c).find(n => n.featId === 'combat_a_deux_armes');
        assert.match(shortsword.text, /garde le modificateur.*1d6 \+/);
        // Attaque en plus (action Bonus, seconde arme) : ni Duel ni Charge
        const both = hero({ feat_2: 'combat_a_deux_armes', feat_4: 'duel', feat_6: 'expert_de_la_charge', char_level: 6 });
        const derived = deriveCharacter(both);
        const off = weaponFeatNotes(weapon('Épée courte'), both, derived, { dueling: true, charger: true })
            .find(n => n.featId === 'combat_a_deux_armes');
        assert.doesNotMatch(off.text, /Duel|Charge/);
        assert.ok(!weaponFeatNotes(weapon('Épée longue'), c).some(n => n.featId === 'combat_a_deux_armes'));
    });
});

describe('Autres styles : rappels calculés', () => {
    test('Interception : 1d10 + bonus de maîtrise', () => {
        assert.ok(slotTexts(hero({ feat_2: 'interception' }), 2).some(t => /1d10 \+3/.test(t)));
    });

    test('Protection : en attente sans bouclier équipé', () => {
        const none = featEffects(hero({ feat_2: 'protection' }))['featSlot:2'];
        assert.ok(none.some(n => n.inactive));
        const shield = featEffects(hero({ feat_2: 'protection', prof_armor_shield: true, dynamic_armors: [armor('Bouclier')] }))['featSlot:2'];
        assert.ok(!shield.some(n => n.inactive));
    });

    test('Combat à mains nues : 1d6 / 1d8 + For', () => {
        assert.ok(slotTexts(hero({ feat_2: 'combat_a_mains_nues' }), 2).some(t => /1d6 \+3.*1d8 \+3/.test(t)));
    });
});

describe('Sauvegarde', () => {
    test('feat_2 et feat_7 : absentes d\'une fiche vierge, gardées par la migration, protégées de la v3', () => {
        const blank = createDefaultCharacter();
        assert.equal('feat_2' in blank, false);
        assert.equal('feat_7' in blank, false);
        const { character } = migrateCharacter({ char_class: 'Guerrier', feat_2: 'defense', feat_7: 'archerie' });
        assert.equal(character.feat_2, 'defense');
        assert.equal(character.feat_7, 'archerie');
        assert.ok(V4_ONLY_KEYS.includes('feat_2'));
        assert.ok(V4_ONLY_KEYS.includes('feat_7'));
    });
});
