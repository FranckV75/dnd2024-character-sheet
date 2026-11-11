// =============================================================================
// Lot A (4.15.0) : capacités de classe qui changent une valeur calculée, maîtrise des armes,
// Marque du chasseur au niveau 20, historique Marin. Règles vérifiées dans le Player's Handbook
// 2024 anglais : Aura of Protection (Paladin 6), Jack of All Trades (Bard 2), Draconic Resilience
// (Sorcerer 3), Dazzling Footwork (Bard 3, College of Dance), Foe Slayer (Ranger 20), maîtrises
// d'armes de chaque classe (tableaux « Core … Traits »), Martial Weapon Training, Sailor.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    subclassId, auraOfProtectionBonus, jackOfAllTradesBonus, unarmoredDefenseOptions, weaponCategory,
    weaponProficiency, weaponProficiencySetting, weaponProficiencyNote, classFeatureNotes, classWeaponProficiencyText
} from '../js/rules/class-features.js';
import { deriveCharacter, computeWeapon, computeArmorClass } from '../js/rules/character.js';
import { featEffects, weaponFeatNotes } from '../js/rules/feat-effects.js';
import { rowFromRulebookWeapon, readWeaponConfig, buildWeaponConfig } from '../js/rules/weapons.js';
import { calcWeaponAttack } from '../js/rules/logic.js';
import { armorRowFromCatalogue } from '../js/rules/armors.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { SKILLS } from '../js/data/constants.js';
import { EMPTY_WEAPON, createDefaultCharacter } from '../js/state/schema.js';

const weapon = (name, config) => {
    const row = rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name));
    return config ? { ...row, weaponConfig: JSON.stringify(config) } : row;
};
const armor = (name) => ({ ...armorRowFromCatalogue(EQUIPMENT_DATA.armors.find(a => a.name === name)), equipped: true });
const hero = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_level: '5', str_score: '10', dex_score: '14', con_score: '12', int_score: '10', wis_score: '12', cha_score: '16',
    ...extra
});
const attack = (row, character, buffs = {}) => computeWeapon(row, deriveCharacter(character), buffs).attack.text;

describe('Sous-classe reconnue (menu, nom anglais, ancienne saisie libre)', () => {
    test('nom français du menu, anglais, identifiant, sans accents ni majuscules', () => {
        assert.equal(subclassId('Sorcellerie Draconique', 'sorcerer'), 'draconic_sorcery');
        assert.equal(subclassId('sorcellerie draconique'), 'draconic_sorcery');
        assert.equal(subclassId('Draconic Sorcery', 'sorcerer'), 'draconic_sorcery');
        assert.equal(subclassId('draconic_sorcery'), 'draconic_sorcery');
        assert.equal(subclassId('<font size="5">Collège de la Danse</font>', 'bard'), 'college_of_dance');
        assert.equal(subclassId('COLLEGE DE LA DANSE', 'bard'), 'college_of_dance');
        assert.equal(subclassId('College of Dance'), 'college_of_dance');
    });

    test('saisie libre partielle des anciennes fiches', () => {
        assert.equal(subclassId('Draconique', 'sorcerer'), 'draconic_sorcery');
        assert.equal(subclassId('Danse', 'bard'), 'college_of_dance');
        assert.equal(subclassId('Vaillance', 'bard'), 'college_of_valor');
    });

    test("sous-classe d'une autre classe ou inconnue : ''", () => {
        assert.equal(subclassId('Sorcellerie Draconique', 'bard'), '');
        assert.equal(subclassId('Danse', 'sorcerer'), '');
        assert.equal(subclassId('Cœur Sauvage', 'barbarian'), '');
        assert.equal(subclassId('', 'bard'), '');
        assert.equal(subclassId(undefined), '');
    });
});

describe('Aura de protection (Paladin niveau 6)', () => {
    test('mod. de Charisme, minimum +1, à partir du niveau 6', () => {
        assert.equal(auraOfProtectionBonus({ classSlug: 'paladin', level: 6, mods: { cha: 3 } }), 3);
        assert.equal(auraOfProtectionBonus({ classSlug: 'paladin', level: 6, mods: { cha: 0 } }), 1);
        assert.equal(auraOfProtectionBonus({ classSlug: 'paladin', level: 6, mods: { cha: -1 } }), 1);
        assert.equal(auraOfProtectionBonus({ classSlug: 'paladin', level: 5, mods: { cha: 3 } }), 0);
        assert.equal(auraOfProtectionBonus({ classSlug: 'fighter', level: 20, mods: { cha: 3 } }), 0);
    });

    test('ajoutée aux six jets de sauvegarde calculés', () => {
        // Paladin 6 : bonus de maîtrise +3, Cha 16 (+3), Sag et Cha maîtrisées
        const d = deriveCharacter(hero({ char_class: 'Paladin', char_level: '6', wis_save_prof: true, cha_save_prof: true }));
        assert.equal(d.auraOfProtection, 3);
        assert.deepEqual(Object.fromEntries(Object.entries(d.saves).map(([id, s]) => [id, s.bonus])),
            { str: 3, dex: 5, con: 4, int: 3, wis: 7, cha: 9 });
        assert.equal(d.saves.str.aura, 3);
    });

    test('Paladin niveau 5 : rien ne change', () => {
        const d = deriveCharacter(hero({ char_class: 'Paladin', char_level: '5' }));
        assert.equal(d.saves.str.bonus, 0);
        assert.equal(d.saves.str.aura, 0);
    });

    test('mention sous chaque sauvegarde, avec le rappel Neutralisé', () => {
        const c = hero({ char_class: 'Paladin', char_level: '6' });
        const effects = featEffects(c);
        for (const id of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
            const [n] = effects[`saves.${id}`].filter(x => x.featId === 'aura_de_protection');
            assert.equal(n.value, 3);
            assert.equal(n.applied, true);
            assert.equal(n.classFeature, true);
            assert.match(n.text, /Neutralisé/);
        }
        // Niveau 18 : 9 m
        assert.match(featEffects(hero({ char_class: 'Paladin', char_level: '18' }))['saves.dex'][0].text, /9 m/);
        assert.deepEqual(featEffects(hero({ char_class: 'Paladin', char_level: '5' }))['saves.dex'], []);
    });
});

describe('Touche-à-tout (Barde niveau 2)', () => {
    test('moitié du bonus de maîtrise, arrondie à l\'inférieur', () => {
        assert.equal(jackOfAllTradesBonus({ classSlug: 'bard', level: 1, pb: 2 }), 0);
        assert.equal(jackOfAllTradesBonus({ classSlug: 'bard', level: 2, pb: 2 }), 1);
        assert.equal(jackOfAllTradesBonus({ classSlug: 'bard', level: 5, pb: 3 }), 1);
        assert.equal(jackOfAllTradesBonus({ classSlug: 'bard', level: 9, pb: 4 }), 2);
        assert.equal(jackOfAllTradesBonus({ classSlug: 'bard', level: 17, pb: 6 }), 3);
        assert.equal(jackOfAllTradesBonus({ classSlug: 'rogue', level: 17, pb: 6 }), 0);
    });

    test('compétences non maîtrisées seulement ; Perception passive ; pas l\'Initiative', () => {
        // Barde 5 : bonus de maîtrise +3, Touche-à-tout +1 ; Dex 14 (+2), Sag 12 (+1), Cha 16 (+3)
        const d = deriveCharacter(hero({
            char_class: 'Barde', skill_prof_performance: true, skill_exp_persuasion: true
        }));
        assert.equal(d.jackOfAllTrades, 1);
        assert.equal(d.skills.performance.bonus, 6); // 3 + 3, maîtrisée : pas de Touche-à-tout
        assert.equal(d.skills.persuasion.bonus, 9); // 3 + 6 (Expertise)
        assert.equal(d.skills.acrobatics.bonus, 3); // 2 + 1
        assert.equal(d.skills.perception.bonus, 2); // 1 + 1
        assert.equal(d.passivePerception, 12);
        assert.equal(d.initiative, 2);
        assert.equal(d.skills.performance.jack, 0);
        assert.equal(d.skills.acrobatics.jack, 1);
    });

    test('Perception maîtrisée : passive sans Touche-à-tout', () => {
        const d = deriveCharacter(hero({ char_class: 'Barde', skill_prof_perception: true }));
        assert.equal(d.passivePerception, 10 + 1 + 3);
    });

    test('mention sur chaque compétence non maîtrisée', () => {
        const effects = featEffects(hero({ char_class: 'Barde', skill_prof_performance: true }));
        assert.deepEqual(effects['skills.performance'], []);
        const [n] = effects['skills.perception'];
        assert.equal(n.featName, 'Touche-à-tout');
        assert.equal(n.value, 1);
        assert.match(n.text, /Perception passive/);
        assert.equal(SKILLS.filter(s => effects[`skills.${s.id}`].length).length, 17);
    });
});

describe('Défense sans armure de sous-classe (10 + Dex + Cha)', () => {
    const mods = { str: 0, dex: 2, con: 1, int: 0, wis: 1, cha: 3 };
    const ac = (extra) => computeArmorClass({ armors: [], mods, pb: 2, shieldTrained: true, level: 3, ...extra });

    test('options par classe et sous-classe', () => {
        assert.deepEqual(unarmoredDefenseOptions({ classSlug: 'sorcerer', subclass: 'draconic_sorcery', level: 3, mods })
            .map(o => [o.value, o.shieldAllowed]), [[15, true]]);
        assert.deepEqual(unarmoredDefenseOptions({ classSlug: 'sorcerer', subclass: 'draconic_sorcery', level: 2, mods }), []);
        assert.deepEqual(unarmoredDefenseOptions({ classSlug: 'bard', subclass: 'college_of_dance', level: 3, mods })
            .map(o => [o.value, o.shieldAllowed]), [[15, false]]);
        assert.deepEqual(unarmoredDefenseOptions({ classSlug: 'bard', subclass: 'college_of_lore', level: 3, mods }), []);
    });

    test('Résistance draconique : 10 + Dex + Cha, bouclier permis', () => {
        const draconic = ac({ className: 'Ensorceleur', subclass: 'draconic_sorcery' });
        assert.equal(draconic.value, 15);
        assert.equal(draconic.parts[0].label, 'Résistance draconique (Ensorceleur)');
        assert.equal(draconic.parts[0].formula, '10 + 2 Dex + 3 Cha = 15');
        const withShield = ac({ className: 'Ensorceleur', subclass: 'draconic_sorcery', armors: [armor('Bouclier')] });
        assert.equal(withShield.value, 17);
        // En armure : ne compte pas, signalée si elle donnait plus
        const armored = ac({ className: 'Ensorceleur', subclass: 'draconic_sorcery', armors: [armor('Armure matelassée')] });
        assert.equal(armored.value, 13); // 11 + 2 Dex
        assert.match(armored.notes.join(' '), /Résistance draconique \(Ensorceleur\) : 15 sans armure/);
    });

    test('Collège de la Danse : 10 + Dex + Cha, ni armure ni bouclier', () => {
        assert.equal(ac({ className: 'Barde', subclass: 'college_of_dance' }).value, 15);
        const withShield = ac({ className: 'Barde', subclass: 'college_of_dance', armors: [armor('Bouclier')] });
        // 10 + 2 + bouclier 2 = 14 ; la Danse perdue (15 sans le bouclier)
        assert.equal(withShield.value, 14);
        assert.match(withShield.notes.join(' '), /Défense sans armure \(Collège de la Danse\) perdue avec un bouclier : 15/);
        assert.match(withShield.source, /perdue : bouclier en main/);
        assert.equal(ac({ className: 'Barde', subclass: 'college_of_dance', level: 2 }).value, 12);
    });

    test('deriveCharacter lit la sous-classe et le niveau', () => {
        const c = hero({ char_class: 'Ensorceleur', char_subclass: 'Sorcellerie Draconique', char_level: '3' });
        assert.equal(deriveCharacter(c).subclass, 'draconic_sorcery');
        assert.equal(deriveCharacter(c).armorClass.value, 15);
        assert.equal(deriveCharacter({ ...c, char_level: '2' }).armorClass.value, 12);
    });

    test('Barbare et Moine inchangés', () => {
        assert.equal(ac({ className: 'Barbare' }).value, 13);
        assert.equal(ac({ className: 'Moine' }).value, 13);
        const monkShield = ac({ className: 'Moine', armors: [armor('Bouclier')] });
        assert.equal(monkShield.value, 14);
        assert.match(monkShield.notes.join(' '), /Défense sans armure \(Moine\) perdue avec un bouclier : 13/);
    });

    test('Moine, La Voie du bouclier (Odyssée) niveau 3 : Défense sans armure gardée avec un bouclier', () => {
        // Moine 5, Dex +3, Sag +3, bouclier : 10 + 3 + 3 + 2 = 18
        const m = { ...mods, dex: 3, wis: 3 };
        const withShield = (subclass, level) => ac({ className: 'Moine', subclass, level, mods: m, armors: [armor('Bouclier')] });
        const shieldMonk = withShield('way_of_the_shield_dancer', 5);
        assert.equal(shieldMonk.value, 18);
        assert.doesNotMatch(shieldMonk.source, /perdue/);
        assert.equal(shieldMonk.notes.some(n => /perdue/.test(n)), false);
        // Avant le niveau 3, ou une autre voie : perdue comme avant (10 + 3 + 2)
        assert.equal(withShield('way_of_the_shield_dancer', 2).value, 15);
        assert.equal(withShield('warrior_of_mercy', 5).value, 15);
        const c = hero({ char_class: 'Moine', char_subclass: 'La Voie du bouclier', char_level: '5' });
        assert.equal(deriveCharacter(c).subclass, 'way_of_the_shield_dancer');
    });
});

describe('Maîtrise des armes : bonus de maîtrise seulement avec une arme maîtrisée', () => {
    test('maîtrises d\'armes des classes (PHB 2024)', () => {
        const martial = ['barbarian', 'fighter', 'paladin', 'ranger'];
        for (const [slug, cls] of Object.entries(DD_RULES.classes)) {
            assert.ok(cls.weaponProf.includes('simple'), slug);
            assert.equal(cls.weaponProf.includes('martial'), martial.includes(slug), slug);
        }
        assert.deepEqual(DD_RULES.classes.monk.weaponProf, ['simple', 'martial-light']);
        assert.deepEqual(DD_RULES.classes.rogue.weaponProf, ['simple', 'martial-finesse', 'martial-light']);
        assert.equal(classWeaponProficiencyText('monk'), 'Moine : armes courantes et armes de guerre Légères');
        assert.equal(classWeaponProficiencyText('wizard'), 'Magicien : armes courantes seulement');
    });

    test('catégorie de la ligne', () => {
        assert.equal(weaponCategory(weapon('Dague')), 'simple');
        assert.equal(weaponCategory(weapon('Épée longue')), 'martial');
        assert.equal(weaponCategory(weapon('Attaque à mains nues')), 'unarmed');
        assert.equal(weaponCategory({ name: 'Lame maudite', category: '' }), '');
    });

    test('Moine : armes de guerre Légères seulement', () => {
        const stats = { classSlug: 'monk', level: 5 };
        assert.equal(weaponProficiency(weapon('Épée longue'), stats).proficient, false);
        assert.equal(weaponProficiency(weapon('Épée courte'), stats).proficient, true);
        assert.equal(weaponProficiency(weapon('Cimeterre'), stats).proficient, true);
        assert.equal(weaponProficiency(weapon('Rapière'), stats).proficient, false);
        assert.equal(weaponProficiency(weapon('Bâton'), stats).proficient, true);
    });

    test('Roublard : armes de guerre Finesse ou Légères', () => {
        const stats = { classSlug: 'rogue', level: 5 };
        assert.equal(weaponProficiency(weapon('Rapière'), stats).proficient, true);
        assert.equal(weaponProficiency(weapon('Fouet'), stats).proficient, true);
        assert.equal(weaponProficiency(weapon('Arbalète de poing'), stats).proficient, true);
        assert.equal(weaponProficiency(weapon('Épée longue'), stats).proficient, false);
        assert.equal(weaponProficiency(weapon('Arc long'), stats).proficient, false);
    });

    test('Magicien, Ensorceleur, Barde : armes courantes seulement', () => {
        for (const classSlug of ['wizard', 'sorcerer', 'bard']) {
            assert.equal(weaponProficiency(weapon('Épée longue'), { classSlug, level: 5 }).proficient, false, classSlug);
            assert.equal(weaponProficiency(weapon('Dague'), { classSlug, level: 5 }).proficient, true, classSlug);
        }
        const none = weaponProficiency(weapon('Épée longue'), { classSlug: 'wizard' });
        assert.equal(none.source, 'none');
    });

    test('Barbare, Guerrier, Paladin, Rôdeur : toutes les armes', () => {
        for (const classSlug of ['barbarian', 'fighter', 'paladin', 'ranger']) {
            assert.equal(weaponProficiency(weapon('Hache à deux mains'), { classSlug }).proficient, true, classSlug);
        }
    });

    test('don Formation aux armes de guerre ; Collège de la Vaillance au niveau 3', () => {
        const feat = weaponProficiency(weapon('Épée longue'), { classSlug: 'wizard', feats: ['formation_aux_armes_de_guerre'] });
        assert.deepEqual([feat.proficient, feat.source], [true, 'feat']);
        assert.equal(weaponProficiency(weapon('Épée longue'), { classSlug: 'bard', subclass: 'college_of_valor', level: 3 }).source, 'subclass');
        assert.equal(weaponProficiency(weapon('Épée longue'), { classSlug: 'bard', subclass: 'college_of_valor', level: 2 }).proficient, false);
    });

    test('Roublard L\'Odysséen (Odyssée) niveau 3 : le trident compte comme Finesse, donc maîtrisé', () => {
        const stats = { classSlug: 'rogue', subclass: 'the_odyssean', level: 5 };
        const trident = weaponProficiency(weapon('Trident'), stats);
        assert.deepEqual([trident.proficient, trident.source], [true, 'subclass']);
        assert.match(trident.text, /Odysséen/);
        assert.equal(weaponProficiency(weapon('Lance'), stats).proficient, true); // arme courante
        assert.equal(weaponProficiency(weapon('Lance d\'arçon'), stats).proficient, false);
        assert.equal(weaponProficiency(weapon('Épée longue'), stats).proficient, false);
        assert.equal(weaponProficiency(weapon('Trident'), { ...stats, level: 2 }).proficient, false);
        assert.equal(weaponProficiency(weapon('Trident'), { classSlug: 'rogue', subclass: 'thief', level: 5 }).proficient, false);
    });

    test('Clerc, Druide, Sorcier : maîtrise supposée (choix non enregistré), rappelée', () => {
        for (const classSlug of ['cleric', 'druid', 'warlock']) {
            const p = weaponProficiency(weapon('Épée longue'), { classSlug });
            assert.deepEqual([p.proficient, p.source], [true, 'assumed'], classSlug);
            assert.match(weaponProficiencyNote(p, 3), /Arme maîtrisée : Non/);
        }
    });

    test('choix prudents : classe inconnue, arme hors catalogue, Attaque à mains nues', () => {
        assert.equal(weaponProficiency(weapon('Épée longue'), { classSlug: '' }).proficient, true);
        assert.equal(weaponProficiency({ name: 'Lame maudite', atkKey: 'FOR', category: '' }, { classSlug: 'wizard' }).proficient, true);
        const fist = weaponProficiency(weapon('Attaque à mains nues'), { classSlug: 'wizard' });
        assert.deepEqual([fist.proficient, fist.source], [true, 'unarmed']);
    });

    test('réglage « Maîtrisée : oui / non » de la configuration de l\'arme', () => {
        assert.equal(weaponProficiencySetting(''), 'auto');
        assert.equal(weaponProficiencySetting('{"proficiency":"no"}'), 'no');
        assert.equal(weaponProficiencySetting('{"proficiency":"bof"}'), 'auto');
        const yes = weaponProficiency(weapon('Épée longue', { proficiency: 'yes' }), { classSlug: 'wizard' });
        assert.deepEqual([yes.proficient, yes.source], [true, 'setting']);
        const no = weaponProficiency(weapon('Épée longue', { proficiency: 'no' }), { classSlug: 'fighter' });
        assert.deepEqual([no.proficient, no.source], [false, 'setting']);
        // Même l'attaque à mains nues suit le réglage choisi
        assert.equal(weaponProficiency(weapon('Attaque à mains nues', { proficiency: 'no' }), { classSlug: 'monk' }).proficient, false);
    });

    test('attaque : Moine 5 avec une épée longue = +1 au lieu de +4', () => {
        // Moine 5 : For 12 (+1), Dex 16 (+3), bonus de maîtrise +3
        const monk = hero({ char_class: 'Moine', str_score: '12', dex_score: '16' });
        assert.equal(attack(weapon('Épée longue'), monk), 'FOR : +1');
        assert.equal(attack(weapon('Épée longue', { proficiency: 'yes' }), monk), 'FOR : +4');
        // Arme de Moine (Épée courte, Légère) : Dex + maîtrise
        assert.equal(attack(weapon('Épée courte'), monk), 'DEX : +6');
        const computed = computeWeapon(weapon('Épée longue'), deriveCharacter(monk));
        assert.match(computed.attack.tooltip, /sans maîtrise/);
        assert.equal(computed.proficiency.proficient, false);
        // Les dégâts ne changent pas (le bonus de maîtrise ne s'y ajoute jamais)
        assert.equal(computed.damage.text, computeWeapon(weapon('Épée longue', { proficiency: 'yes' }), deriveCharacter(monk)).damage.text);
    });

    test('calcWeaponAttack : sans maîtrise, pas de bonus de maîtrise', () => {
        const mods = { str: 3, dex: 1 };
        assert.equal(calcWeaponAttack('FOR', '', mods, 3, 0, '', [], false).text, 'FOR : +3');
        assert.match(calcWeaponAttack('FOR', '', mods, 3, 0, '', [], false).tooltip, /sans maîtrise \(bonus de maîtrise \+3 non compté\)/);
        assert.equal(calcWeaponAttack('FOR', '', mods, 3, 0, '').text, 'FOR : +6');
    });

    test('rappel sous l\'arme non maîtrisée (et botte d\'arme inutilisable)', () => {
        const monk = hero({ char_class: 'Moine' });
        const [n] = weaponFeatNotes(weapon('Épée longue'), monk);
        assert.equal(n.featId, 'sans_maitrise');
        assert.equal(n.check, true);
        assert.match(n.text, /bonus de maîtrise \(\+3\) n'est pas ajouté/);
        assert.match(n.text, /Moine : armes courantes et armes de guerre Légères/);
        assert.match(n.text, /botte d'arme ne s'utilise pas/);
        assert.match(n.text, /Arme maîtrisée : Oui/);
        assert.deepEqual(weaponFeatNotes(weapon('Épée courte'), monk), []);
        // Réglage « non » choisi : pas d'invitation à régler « oui »
        const forced = weaponFeatNotes(weapon('Épée longue', { proficiency: 'no' }), hero({ char_class: 'Guerrier' }))[0];
        assert.doesNotMatch(forced.text, /Arme maîtrisée : Oui/);
        assert.ok(featEffects({ ...monk, dynamic_weapons: [weapon('Épée longue')] })['weapon:0'].some(x => x.featId === 'sans_maitrise'));
    });
});

describe('Configuration de l\'arme : propriété facultative « proficiency » (weaponConfig)', () => {
    test('lue avec « auto » par défaut', () => {
        assert.equal(readWeaponConfig('').proficiency, 'auto');
        assert.equal(readWeaponConfig('{"proficiency":"yes"}').proficiency, 'yes');
        assert.equal(readWeaponConfig('{"proficiency":42}').proficiency, 'auto');
    });

    test('« auto » n\'écrit rien (format v3 inchangé) ; oui / non enregistrés', () => {
        const base = { statOverride: '', magicBonus: 0, dmgDieOverride: '', dmgTypeOverride: '' };
        assert.deepEqual(JSON.parse(buildWeaponConfig({ ...base, proficiency: 'auto' }).value), base);
        assert.deepEqual(JSON.parse(buildWeaponConfig(base).value), base);
        assert.equal(JSON.parse(buildWeaponConfig({ ...base, proficiency: 'no' }).value).proficiency, 'no');
        // Retour à « auto » : la propriété disparaît
        assert.equal('proficiency' in JSON.parse(buildWeaponConfig({ ...base, proficiency: 'auto' }, '{"proficiency":"no"}').value), false);
        assert.equal(buildWeaponConfig({ ...base, proficiency: 'peut-être' }).ok, false);
    });
});

describe('Marque du chasseur : Tueur d\'ennemis (Rôdeur niveau 20)', () => {
    const ranger = (level) => hero({ char_class: 'Rôdeur', char_level: String(level), dex_score: '16' });
    test('1d6 jusqu\'au niveau 19, 1d10 au niveau 20', () => {
        const bow = weapon('Arc long');
        assert.match(computeWeapon(bow, deriveCharacter(ranger(19)), { hunterMark: true }).damage.text, /1d6/);
        assert.match(computeWeapon(bow, deriveCharacter(ranger(20)), { hunterMark: true }).damage.text, /1d10/);
    });
});

describe('Historique Marin (PHB 2024 « Sailor ») : Acrobaties et Perception', () => {
    test('maîtrises de compétences', () => {
        assert.deepEqual(DD_RULES.backgrounds.sailor.skillProfs, ['acrobatics', 'perception']);
    });
});

describe('classFeatureNotes : rien pour une classe sans ces capacités', () => {
    test('Guerrier 20 : aucune note', () => {
        assert.deepEqual(classFeatureNotes(deriveCharacter(hero({ char_class: 'Guerrier', char_level: '20' }))), {});
    });
});
