/**
 * TESTS — RAGE SANS EFFET EN ARMURE LOURDE (PHB 2024, Barbare, Rage, p. 51)
 * La fiche ne touche jamais au bouton Rage : avec une armure lourde équipée, ses effets calculés
 * ne comptent pas et un avertissement est proposé (js/rules/rage.js).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { classReminderNotes } from '../js/rules/class-reminders.js';
import { subclassDefenseNotes } from '../js/rules/subclass-combat.js';
import { concentrationView } from '../js/rules/concentration.js';
import { masteryDetails } from '../js/rules/weapon-masteries.js';
import { effectiveBuffs, buffsForCharacter } from '../js/rules/weapons.js';
import {
    rageBlockedByArmor, rageInEffect, rageArmorWarning, RAGE_ARMOR_WARNING, RAGE_ARMOR_STATUS
} from '../js/rules/rage.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const PLATE = { name: 'Harnois', type: 'Lourde', ca: '18', equipped: true };
const BREASTPLATE = { name: 'Cuirasse', type: 'Intermédiaire', ca: '14', equipped: true };
const GREATAXE = { name: 'Hache à deux mains', atkKey: 'str', baseDmg: '1d12 tran.', prop: 'Lourde, Deux mains', prof: 'Enchaînement' };

const barbarian = (extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Barbare', char_level: '5', str_score: '18',
    combat_buffs: { rage: true }, ...extra
});
const damage = (record, weapon = GREATAXE) => {
    const d = deriveCharacter(record);
    return computeWeapon(weapon, d, effectiveBuffs(d.classSlug, record.combat_buffs, record, d)).damage.text;
};

describe('Règles de base (rage.js)', () => {
    test('armure lourde équipée seulement : une armure lourde rangée ou une armure intermédiaire ne bloquent rien', () => {
        assert.equal(rageBlockedByArmor(deriveCharacter(barbarian({ dynamic_armors: [PLATE] }))), true);
        assert.equal(rageBlockedByArmor(deriveCharacter(barbarian({ dynamic_armors: [{ ...PLATE, equipped: false }] }))), false);
        assert.equal(rageBlockedByArmor(deriveCharacter(barbarian({ dynamic_armors: [BREASTPLATE] }))), false);
        // Nom du manuel sans type choisi : reconnu comme armure lourde
        assert.equal(rageBlockedByArmor(deriveCharacter(barbarian({ dynamic_armors: [{ name: 'Harnois', equipped: true }] }))), true);
        assert.equal(rageBlockedByArmor(undefined), false);
    });

    test('Rage en cours : bouton allumé et pas d\'armure lourde', () => {
        const plate = barbarian({ dynamic_armors: [PLATE] });
        assert.equal(rageInEffect(plate, deriveCharacter(plate)), false);
        const free = barbarian();
        assert.equal(rageInEffect(free, deriveCharacter(free)), true);
        const off = barbarian({ combat_buffs: {} });
        assert.equal(rageInEffect(off, deriveCharacter(off)), false);
    });

    test('avertissement : Rage allumée, proposée, armure lourde équipée', () => {
        const plate = barbarian({ dynamic_armors: [PLATE] });
        const d = deriveCharacter(plate);
        assert.equal(rageArmorWarning(plate, d, buffsForCharacter(d.classSlug, plate, d)), RAGE_ARMOR_WARNING);
        assert.equal(rageArmorWarning(plate, d), RAGE_ARMOR_WARNING);
        // Bouton éteint, pas d'armure lourde, ou bouton non proposé (Guerrier) : rien
        const off = barbarian({ dynamic_armors: [PLATE], combat_buffs: {} });
        assert.equal(rageArmorWarning(off, deriveCharacter(off)), '');
        assert.equal(rageArmorWarning(barbarian(), deriveCharacter(barbarian())), '');
        const fighter = barbarian({ char_class: 'Guerrier', dynamic_armors: [PLATE] });
        const df = deriveCharacter(fighter);
        assert.equal(rageArmorWarning(fighter, df, buffsForCharacter(df.classSlug, fighter, df)), '');
        assert.equal(rageArmorWarning(fighter, df), '');
    });

    test('textes courts et en français', () => {
        assert.ok(RAGE_ARMOR_WARNING.length <= 40);
        assert.match(RAGE_ARMOR_STATUS, /armure lourde/);
    });
});

describe('Effets de la Rage non comptés en armure lourde', () => {
    test('dégâts : +2 (Rage) sans armure, rien avec le Harnois ; le bouton reste allumé', () => {
        assert.equal(damage(barbarian()), '1d12 +4 TRAN +2 (Rage)');
        const plate = barbarian({ dynamic_armors: [PLATE] });
        assert.equal(damage(plate), '1d12 +4 TRAN');
        assert.equal(plate.combat_buffs.rage, true);
        const d = deriveCharacter(plate);
        assert.equal(effectiveBuffs(d.classSlug, plate.combat_buffs, plate, d).rage, false);
        // computeWeapon revérifie, même avec des bonus bruts
        assert.equal(computeWeapon(GREATAXE, d, { rage: true }).damage.text, '1d12 +4 TRAN');
    });

    test('Fureur divine (Zélote) et Frénésie (Berserker) suivent la Rage', () => {
        const zealot = barbarian({ char_subclass: 'Voie du Zélote' });
        assert.match(damage(zealot), /Fureur divine/);
        assert.doesNotMatch(damage({ ...zealot, dynamic_armors: [PLATE] }), /Fureur divine|Rage/);
        const berserker = barbarian({ char_subclass: 'Voie du Berserker', combat_buffs: { rage: true, frenzy: true } });
        assert.match(damage(berserker), /Frénésie/);
        assert.doesNotMatch(damage({ ...berserker, dynamic_armors: [PLATE] }), /Frénésie|Rage/);
    });

    test('Enchaînement : la Rage n\'est pas ajoutée aux dégâts de la seconde créature', () => {
        const value = (record) => {
            const d = deriveCharacter(record);
            return masteryDetails(GREATAXE, record, d, effectiveBuffs(d.classSlug, record.combat_buffs, record, d)).values[0].value;
        };
        assert.match(value(barbarian()), /\+2/);
        assert.doesNotMatch(value(barbarian({ dynamic_armors: [PLATE] })), /\+2/);
    });

    test('rappels de classe (Avantage, Résistance, Rage implacable) grisés', () => {
        const zones = (record) => classReminderNotes(deriveCharacter(record), record);
        const free = zones(barbarian({ char_level: '11' }));
        assert.equal(free['saves.str'][0].inactive, undefined);
        assert.equal(free.armorClass[0].inactive, undefined);
        const plate = zones(barbarian({ char_level: '11', dynamic_armors: [PLATE] }));
        assert.equal(plate['saves.str'][0].inactive, true);
        assert.equal(plate.armorClass[0].inactive, true);
        assert.ok(plate.deathSaves.every((note) => note.inactive === true));
        // Rappels sans lien avec la Rage : inchangés
        assert.equal(plate['saves.dex'][0].inactive, undefined);
    });

    test('défenses de sous-classe liées à la Rage (Rage aveugle du Berserker) grisées', () => {
        const notes = (record) => subclassDefenseNotes(deriveCharacter(record), record).armorClass[0];
        const berserker = barbarian({ char_subclass: 'Voie du Berserker', char_level: '6' });
        assert.equal(notes(berserker).inactive, undefined);
        assert.equal(notes({ ...berserker, dynamic_armors: [PLATE] }).inactive, true);
    });

    test('Concentration : la Rage sans effet ne la rompt pas', () => {
        const record = barbarian({ concentration: 'Bénédiction', hp_current: '40', hp_max: '40' });
        assert.equal(concentrationView(record, deriveCharacter(record)).brokenBy, 'rage');
        const plate = { ...record, dynamic_armors: [PLATE] };
        assert.equal(concentrationView(plate, deriveCharacter(plate)).brokenBy, null);
    });
});
