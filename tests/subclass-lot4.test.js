// =============================================================================
// Sous-classes, lot 4 : petits calculs (Initiative, compétences, armes, maîtrises à cocher,
// vitesses, coups critiques, chiffres des textes) — js/rules/subclass-calcs.js
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    bardicInspirationDie, monkFocusDC, martialArtsDieText, subclassInitiativeBonuses, subclassSkillBonus,
    danceUnarmedDie, subclassWeaponStat, criticalRange, subclassNotes, subclassWeaponNotes
} from '../js/rules/subclass-calcs.js';
import { subclassFeatures, automationKind } from '../js/rules/subclass-features.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { featEffects, weaponFeatNotes } from '../js/rules/feat-effects.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const record = (cls, subclass, level, extra = {}) => ({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level), ...extra
});
const hero = (...args) => deriveCharacter(record(...args));
const UNARMED = { name: 'Frappe à mains nues', atkKey: 'str', baseDmg: '1 C', prop: '' };
const feature = (d, id) => subclassFeatures(d).reached.find(f => f.id === id);

describe('Dés et DD communs', () => {
    test('dé d\'Inspiration bardique et dé d\'Arts martiaux selon le niveau', () => {
        assert.deepEqual([1, 4, 5, 9, 10, 14, 15, 20].map(bardicInspirationDie), ['d6', 'd6', 'd8', 'd8', 'd10', 'd10', 'd12', 'd12']);
        assert.deepEqual([1, 4, 5, 10, 11, 16, 17].map(martialArtsDieText), ['d6', 'd6', 'd8', 'd8', 'd10', 'd10', 'd12']);
    });

    test('DD du Moine : 8 + Sagesse + maîtrise', () => {
        assert.equal(monkFocusDC(hero('Moine', 'Guerrier de la Main Ouverte', 5, { wis_score: '16' })), 14);
    });
});

describe('Initiative', () => {
    test('Traqueur d\'ombre : + Sagesse (positive seulement) dans l\'Initiative calculée', () => {
        const d = hero('Rôdeur', "Traqueur d'Ombre", 3, { dex_score: '16', wis_score: '14' });
        assert.equal(d.initiative, 5);
        assert.equal(d.initiativeDetail, 'Dex +3, Sag +2');
        assert.equal(hero('Rôdeur', "Traqueur d'Ombre", 3, { dex_score: '16', wis_score: '8' }).initiative, 3);
        assert.equal(hero('Rôdeur', "Traqueur d'Ombre", 2, { dex_score: '16', wis_score: '14' }).initiative, 3);
        const notes = featEffects(record('Rôdeur', "Traqueur d'Ombre", 3, { wis_score: '14' }), d).initiative;
        assert.ok(notes.some(n => n.applied && n.value === 2));
    });

    test('L\'Odysséen niveau 13 : + Charisme', () => {
        assert.equal(hero('Roublard', "L'Odysséen", 13, { cha_score: '16' }).initiative, 3);
        assert.equal(hero('Roublard', "L'Odysséen", 12, { cha_score: '16' }).initiative, 0);
    });

    test('texte du bloc « Sous-classe » : « compté » seulement si le modificateur est positif', () => {
        const low = hero('Rôdeur', "Traqueur d'Ombre", 3, { wis_score: '8' });
        assert.match(feature(low, 'embusqueur_redoutable_bonus_d_initiative').automation.text, /-1 : rien d'ajouté/);
        const high = hero('Rôdeur', "Traqueur d'Ombre", 3, { wis_score: '14' });
        assert.match(feature(high, 'embusqueur_redoutable_bonus_d_initiative').automation.text, /\+2 compté/);
        const odyssean = hero('Roublard', "L'Odysséen", 13, { cha_score: '8' });
        assert.match(feature(odyssean, 'a_toute_epreuve').automation.text, /rien d'ajouté/);
    });

    test('Vigilant : l\'encadré du don reprend l\'Initiative calculée, bonus de sous-classe compris', () => {
        const r = record('Rôdeur', "Traqueur d'Ombre", 4, { dex_score: '16', wis_score: '14', feat_1: 'vigilant' });
        const d = deriveCharacter(r);
        assert.equal(d.initiative, 3 + 2 + 2);
        assert.ok(featEffects(r, d)['featSlot:1'].some(n => n.text.endsWith(`= +${d.initiative}.`)));
    });

    test('Champion et Assassin : Avantage rappelé (sans changer le chiffre)', () => {
        const champion = record('Guerrier', 'Champion', 3);
        assert.equal(deriveCharacter(champion).initiative, 0);
        assert.ok(featEffects(champion, deriveCharacter(champion)).initiative.some(n => n.featId === 'athlete_remarquable'));
        const assassin = record('Roublard', 'Assassin', 3);
        assert.ok(featEffects(assassin, deriveCharacter(assassin)).initiative.some(n => n.featId === 'assassinat'));
    });
});

describe('Compétences et maîtrises', () => {
    test('Errant féerique : Sagesse (minimum +1) aux compétences de Charisme seulement', () => {
        const d = hero('Rôdeur', 'Errant Féerique', 3, { wis_score: '16' });
        assert.equal(d.skills.persuasion.bonus, 3);
        assert.equal(d.skills.deception.bonus, 3);
        assert.equal(d.skills.insight.bonus, 3);
        assert.equal(d.skills.athletics.bonus, 0);
        assert.equal(hero('Rôdeur', 'Errant Féerique', 3, { wis_score: '8' }).skills.performance.bonus, 1);
        assert.equal(subclassSkillBonus(hero('Rôdeur', 'Chasseur', 3, { wis_score: '16' }), 'cha'), 0);
    });

    test('maîtrise donnée par la sous-classe : « À vérifier » tant que la case n\'est pas cochée', () => {
        const zones = (r) => subclassNotes(deriveCharacter(r), r);
        assert.ok(zones(record('Rôdeur', "Traqueur d'Ombre", 7))['saves.wis']?.[0].check);
        assert.equal(zones(record('Rôdeur', "Traqueur d'Ombre", 7, { wis_save_prof: true }))['saves.wis'], undefined);
        assert.equal(zones(record('Rôdeur', "Traqueur d'Ombre", 6))['saves.wis'], undefined);
        const mercy = zones(record('Moine', 'Guerrier de la Miséricorde', 3, { skill_exp_insight: true }));
        assert.equal(mercy['skills.insight'], undefined);
        assert.ok(mercy['skills.medicine'][0].check);
    });

    test('La Voie du bouclier : formation aux boucliers à cocher (CA)', () => {
        const r = record('Moine', 'La Voie du bouclier', 3);
        assert.ok(featEffects(r, deriveCharacter(r)).armorClass.some(n => n.featId === 'way_of_the_shield_dancer' && n.check));
        const ticked = { ...r, prof_armor_shield: true };
        assert.ok(!featEffects(ticked, deriveCharacter(ticked)).armorClass.some(n => n.featId === 'way_of_the_shield_dancer'));
        // L'Odysséen (Soldat vagabond) : même rappel pour un Roublard
        const rogue = record('Roublard', "L'Odysséen", 3);
        assert.ok(featEffects(rogue, deriveCharacter(rogue)).armorClass.some(n => n.featId === 'the_odyssean' && n.check));
    });
});

describe('Armes', () => {
    test('Collège de la Danse : Frappe à mains nues à la Dextérité avec le dé d\'Inspiration, sans armure', () => {
        const d = hero('Barde', 'Collège de la Danse', 5, { dex_score: '16', str_score: '10' });
        assert.equal(danceUnarmedDie(UNARMED, d), '1d8');
        const computed = computeWeapon(UNARMED, d);
        assert.match(computed.attack.text, /^DEX/);
        assert.match(computed.damage.text, /^1d8 \+3/);
        // Avec une armure, ou une Force plus haute : rien ne change
        const armored = hero('Barde', 'Collège de la Danse', 5, { dex_score: '16', dynamic_armors: [{ name: 'Armure de cuir', equipped: true, type: 'light' }] });
        assert.equal(armored.wornArmor.light || armored.wornArmor.medium || armored.wornArmor.heavy, true);
        assert.equal(danceUnarmedDie(UNARMED, armored), '');
        assert.equal(danceUnarmedDie(UNARMED, hero('Barde', 'Collège de la Danse', 5, { str_score: '16' })), '');
    });

    test('Collège de la Danse : un dé déjà aussi gros (don Combat à mains nues) est gardé', () => {
        const d = hero('Barde', 'Collège de la Danse', 3, { dex_score: '16', str_score: '10', feat_1: 'combat_a_mains_nues' });
        assert.match(computeWeapon(UNARMED, d).damage.text, /^1d6 \+3/);
    });

    test('Ascendance divine : Charisme pour le corps à corps quand il est meilleur ; Voie herculéenne : Force à l\'arc long', () => {
        const sword = { name: 'Épée longue', atkKey: 'str', baseDmg: '1d8 T', prop: 'Polyvalente' };
        assert.equal(subclassWeaponStat(sword, hero('Ensorceleur', 'Ascendance divine', 3, { cha_score: '16', str_score: '10' })), 'cha');
        assert.equal(subclassWeaponStat(sword, hero('Ensorceleur', 'Ascendance divine', 3, { cha_score: '12', str_score: '14' })), '');
        const bow = { name: 'Arc long', atkKey: 'dex', baseDmg: '1d8 P', prop: 'Munitions, Lourde, Deux mains' };
        assert.equal(subclassWeaponStat(bow, hero('Ensorceleur', 'Ascendance divine', 3, { cha_score: '16' })), '');
        assert.equal(subclassWeaponStat(bow, hero('Barbare', 'Voie Herculéenne', 6, { str_score: '18', dex_score: '12' })), 'str');
        assert.equal(subclassWeaponStat(bow, hero('Barbare', 'Voie Herculéenne', 5, { str_score: '18', dex_score: '12' })), '');
    });

    test('coup critique élargi : Champion 19, puis 18 au niveau 15 ; L\'Hoplite 19 au niveau 15', () => {
        assert.equal(criticalRange(hero('Guerrier', 'Champion', 3)).min, 19);
        assert.equal(criticalRange(hero('Guerrier', 'Champion', 15)).min, 18);
        assert.equal(criticalRange(hero('Guerrier', "L'Hoplite", 15)).min, 19);
        assert.equal(criticalRange(hero('Guerrier', "L'Hoplite", 14)), null);
        assert.equal(criticalRange(hero('Guerrier', 'Maître de Guerre', 20)), null);
        const sword = { name: 'Épée longue', atkKey: 'str', baseDmg: '1d8 T', prop: 'Polyvalente' };
        const champion = record('Guerrier', 'Champion', 3, { dynamic_weapons: [sword] });
        assert.match(weaponFeatNotes(sword, champion, deriveCharacter(champion)).at(-1).text, /19 ou 20/);
        assert.deepEqual(subclassWeaponNotes(sword, hero('Guerrier', '', 3)), []);
    });
});

describe('Vitesses, jets contre la mort, textes chiffrés', () => {
    test('Voleur : escalade ; Cercle de la Mer 6 : nage ; Gloire 7 : « dont +3 m » à reporter', () => {
        assert.equal(subclassNotes(hero('Roublard', 'Voleur', 3)).speed[0].featId, 'monte_en_l_air');
        assert.equal(subclassNotes(hero('Druide', 'Cercle de la Mer', 6)).speed[0].featId, 'affinite_aquatique');
        assert.equal(subclassNotes(hero('Druide', 'Cercle de la Mer', 5)).speed, undefined);
        const glory = subclassNotes(hero('Paladin', 'Serment de Gloire', 7)).speed[0];
        assert.deepEqual([glory.value, glory.manual], [3, true]);
    });

    test('Champion 18 : Avantage aux jets contre la mort, PV par tour = 5 + Con', () => {
        const note = subclassNotes(hero('Guerrier', 'Champion', 18, { con_score: '16' })).deathSaves[0];
        assert.match(note.text, /8 PV/);
    });

    test('textes : DD, dés et PV calculés avec les valeurs du personnage', () => {
        const openHand = hero('Moine', 'Guerrier de la Main Ouverte', 6, { wis_score: '16' });
        assert.match(feature(openHand, 'technique_de_la_main_ouverte').automation.text, /DD des sauvegardes : 14 /);
        assert.match(feature(openHand, 'plenitude_physique').automation.text, /1d8 \+3 .*3 fois/);
        const abjurer = hero('Magicien', 'Abjurateur', 5, { int_score: '18' });
        assert.match(feature(abjurer, 'protection_arcanique').automation.text, /: 14 /);
        const dance = hero('Barde', 'Collège de la Danse', 10);
        assert.match(feature(dance, 'jeu_de_jambes_eblouissant_degats_bardiques').automation.text, /1d10/);
        assert.equal(automationKind(feature(dance, 'jeu_de_jambes_eblouissant_degats_bardiques')), 'calc');
        const assassin = hero('Roublard', 'Assassin', 17, { dex_score: '20' });
        assert.match(feature(assassin, 'frappe_mortelle').automation.text, /DD 19 /);
    });
});
