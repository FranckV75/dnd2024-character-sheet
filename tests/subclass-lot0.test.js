// =============================================================================
// Sous-classes, lot 0 (docs/SOUS_CLASSES.md, section 4) : corrections du code existant.
// Règles relues : Odyssée des Seigneurs Dragons, guide du joueur (Voie du bouclier p. 46,
// L'Odysséen p. 52, style Hoplite p. 43, Collège de poésie épique) ; PHB 2024 (Draconic Resilience
// p. 148, College of Valor « Martial Training », Foe Slayer).
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { subclassId, shieldKeepsMartialArts } from '../js/rules/class-features.js';
import { deriveCharacter, computeWeapon, hunterMarkDie } from '../js/rules/character.js';
import { featEffects, grappleDC } from '../js/rules/feat-effects.js';
import { masteryDetails } from '../js/rules/weapon-masteries.js';
import { rowFromRulebookWeapon } from '../js/rules/weapons.js';
import { armorRowFromCatalogue } from '../js/rules/armors.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { EMPTY_WEAPON, createDefaultCharacter } from '../js/state/schema.js';

const weapon = (name) => rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name));
const armor = (name) => ({ ...armorRowFromCatalogue(EQUIPMENT_DATA.armors.find(a => a.name === name)), equipped: true });
const hero = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_level: '5', str_score: '10', dex_score: '16', con_score: '12', int_score: '10', wis_score: '14', cha_score: '12',
    ...extra
});
const shown = (row, character, buffs = {}) => {
    const result = computeWeapon(row, deriveCharacter(character), buffs);
    return { attack: result.attack.text, damage: result.damage.text };
};

describe('Moine, La Voie du bouclier (Odyssée) : Arts martiaux gardés avec un bouclier', () => {
    const monk = (subclass, level, shield) => hero({
        char_class: 'Moine', char_subclass: subclass, char_level: String(level), prof_armor_shield: true,
        dynamic_armors: shield ? [armor('Bouclier')] : []
    });

    test('règle : Moine de la Voie du bouclier, à partir du niveau 3 seulement', () => {
        assert.equal(shieldKeepsMartialArts({ classSlug: 'monk', subclass: 'way_of_the_shield_dancer', level: 3 }), true);
        assert.equal(shieldKeepsMartialArts({ classSlug: 'monk', subclass: 'way_of_the_shield_dancer', level: 2 }), false);
        assert.equal(shieldKeepsMartialArts({ classSlug: 'monk', subclass: 'warrior_of_shadow', level: 5 }), false);
    });

    test('Bâton avec un bouclier : même attaque et mêmes dégâts (Dextérité, dé d\'Arts martiaux) que sans bouclier', () => {
        const staff = weapon('Bâton');
        const without = shown(staff, monk('La Voie du bouclier', 5, false));
        assert.deepEqual(shown(staff, monk('La Voie du bouclier', 5, true)), without);
        // Un autre Moine perd ses Arts martiaux avec un bouclier (PHB 2024)
        assert.notDeepEqual(shown(staff, monk("Guerrier de l'Ombre", 5, true)), without);
    });

    test('bottes d\'armes et DD de Lutte : Dextérité gardée avec le bouclier', () => {
        const c = monk('La Voie du bouclier', 5, true);
        const d = deriveCharacter(c);
        assert.equal(grappleDC(d), 8 + 3 + 3);
        assert.equal(grappleDC(deriveCharacter(monk("Guerrier de l'Ombre", 5, true))), 8 + 0 + 3);
        const club = { ...weapon('Massue'), prof: 'Ralentissement' };
        const details = masteryDetails(club, c, d);
        assert.ok(details);
    });
});

describe("Roublard, L'Odysséen (Odyssée) : Lance et Trident comptent comme Finesse", () => {
    const rogue = (subclass, extra = {}) => hero({ char_class: 'Roublard', char_subclass: subclass, ...extra });

    test('attaque à la Dextérité avec une Lance, comme avec une Dague', () => {
        const c = rogue("L'Odysséen");
        assert.equal(shown(weapon('Lance'), c).attack, shown(weapon('Dague'), c).attack);
        // Un Voleur garde la Force pour la Lance
        assert.notEqual(shown(weapon('Lance'), rogue('Voleur')).attack, shown(weapon('Dague'), rogue('Voleur')).attack);
    });

    test('Attaque sournoise ajoutée avec le Trident', () => {
        assert.match(shown(weapon('Trident'), rogue("L'Odysséen"), { sneakAttack: true }).damage, /3d6/);
        assert.doesNotMatch(shown(weapon('Trident'), rogue('Voleur'), { sneakAttack: true }).damage, /3d6/);
    });

    test('Force gardée quand elle est meilleure que la Dextérité', () => {
        const strong = rogue("L'Odysséen", { str_score: '18', dex_score: '12' });
        const weak = rogue("L'Odysséen", { str_score: '12', dex_score: '18' });
        assert.match(shown(weapon('Lance'), strong).attack, /^FOR/);
        assert.match(shown(weapon('Lance'), weak).attack, /^DEX/);
    });
});

describe('Marque du chasseur : dé affiché sur le bouton', () => {
    test('1d6, puis 1d10 au niveau 20 du Rôdeur (Tueur d\'ennemis)', () => {
        assert.equal(hunterMarkDie({ level: 19, classSlug: 'ranger' }), '1d6');
        assert.equal(hunterMarkDie({ level: 20, classSlug: 'ranger' }), '1d10');
        assert.equal(hunterMarkDie({ level: 20, classSlug: 'paladin' }), '1d6');
    });
});

describe('Résistance draconique : PV max', () => {
    test('« dont +niveau » à reporter soi-même, rien avant le niveau 3', () => {
        const notes = featEffects(hero({ char_class: 'Ensorceleur', char_subclass: 'Sorcellerie Draconique' })).hpMax;
        const note = notes.find(n => n.featId === 'resilience_draconique');
        assert.equal(note.value, 5);
        assert.equal(note.manual, true);
        assert.match(note.text, /dont \+5 PV/);
        const low = featEffects(hero({ char_class: 'Ensorceleur', char_subclass: 'Sorcellerie Draconique', char_level: '2' })).hpMax;
        assert.ok(!low.some(n => n.featId === 'resilience_draconique'));
    });
});

describe('Formation aux armures donnée par la sous-classe : rappel près de la CA', () => {
    test('Collège de la Vaillance : cases Intermédiaires et Boucliers à cocher', () => {
        const notes = featEffects(hero({ char_class: 'Barde', char_subclass: 'Collège de la Vaillance' })).armorClass;
        const note = notes.find(n => n.featId === 'college_of_valor');
        assert.equal(note.check, true);
        assert.match(note.text, /« Intermédiaires » et « Boucliers »/);
        const ticked = featEffects(hero({ char_class: 'Barde', char_subclass: 'Collège de la Vaillance', prof_armor_med: true, prof_armor_shield: true })).armorClass;
        assert.ok(!ticked.some(n => n.featId === 'college_of_valor'));
    });

    test('Collège de poésie épique : armures intermédiaires au niveau 6 seulement', () => {
        const at = (level) => featEffects(hero({ char_class: 'Barde', char_subclass: 'Collège de poésie épique', char_level: String(level) })).armorClass;
        assert.ok(!at(5).some(n => n.featId === 'college_of_epic_muse'));
        assert.match(at(6).find(n => n.featId === 'college_of_epic_muse').text, /« Intermédiaires »/);
    });
});

describe('Collège de la Danse : le mot « dans » ne suffit plus', () => {
    test('saisie libre', () => {
        assert.equal(subclassId('Danse', 'bard'), 'college_of_dance');
        assert.equal(subclassId('Collège de la danse', 'bard'), 'college_of_dance');
        assert.equal(subclassId('Formé dans un collège', 'bard'), '');
    });
});

describe('Style de combat Hoplite (Odyssée)', () => {
    test('au catalogue des styles de combat', () => {
        assert.equal(FEATS_DATA.hoplite.type, 'Style de combat');
    });

    test('rappel de la Réaction, et bouclier demandé', () => {
        const without = featEffects(hero({ char_class: 'Guerrier', feat_2: 'hoplite' }))['featSlot:2'];
        assert.ok(without.some(n => /attaque d'opportunité/.test(n.text)));
        assert.ok(without.some(n => n.inactive && /bouclier/.test(n.text)));
        const shield = featEffects(hero({ char_class: 'Guerrier', feat_2: 'hoplite', prof_armor_shield: true, dynamic_armors: [armor('Bouclier')] }))['featSlot:2'];
        assert.ok(!shield.some(n => n.inactive));
    });
});
