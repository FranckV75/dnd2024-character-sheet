/**
 * TESTS UNITAIRES — CHARACTER.JS (statistiques dérivées D&D 2024)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    parseNumber,
    classSlug,
    hitDieForClass,
    spellSlotsFor,
    armorCategory,
    computeArmorClass,
    armorMagicBonus,
    armorCanBeMagic,
    armorBaseValue,
    armorLine,
    mediumArmorDexMax,
    computeSpellcasting,
    exhaustionEffects,
    exhaustionSeverity,
    sneakAttackDice,
    deriveCharacter,
    computeWeapon,
    renownTier,
    featSlotState
} from '../js/rules/character.js';

const MODS = { str: 3, dex: 2, con: 3, int: 0, wis: 1, cha: -1 };

describe('parseNumber : lecture des valeurs saisies librement', () => {
    test('Extrait le premier entier', () => {
        assert.equal(parseNumber('19'), 19);
        assert.equal(parseNumber('+3'), 3);
        assert.equal(parseNumber('-1'), -1);
        assert.equal(parseNumber('3?'), 3);
        assert.equal(parseNumber('<b>17</b>'), 17);
        assert.equal(parseNumber(12), 12);
    });

    test('Utilise la valeur par défaut si aucun nombre', () => {
        assert.equal(parseNumber('', 10), 10);
        assert.equal(parseNumber(null, 1), 1);
        assert.equal(parseNumber('abc', 5), 5);
    });
});

describe('Classes : identifiant et dé de vie', () => {
    test('Reconnaît les noms français, anglais et identifiants', () => {
        assert.equal(classSlug('Barbare'), 'barbarian');
        assert.equal(classSlug('Rôdeur'), 'ranger');
        assert.equal(classSlug('Warlock'), 'warlock');
        assert.equal(classSlug('Sorcier'), 'warlock');
        assert.equal(classSlug('Ensorceleur'), 'sorcerer');
        assert.equal(classSlug(''), '');
        assert.equal(classSlug('Inconnu'), '');
    });

    test('Dés de vie D&D 2024', () => {
        assert.equal(hitDieForClass('Barbare'), 'd12');
        assert.equal(hitDieForClass('Guerrier'), 'd10');
        assert.equal(hitDieForClass('Paladin'), 'd10');
        assert.equal(hitDieForClass('Rôdeur'), 'd10');
        assert.equal(hitDieForClass('Clerc'), 'd8');
        assert.equal(hitDieForClass('Sorcier'), 'd8');
        assert.equal(hitDieForClass('Magicien'), 'd6');
        assert.equal(hitDieForClass('Ensorceleur'), 'd6');
    });
});

describe('Emplacements de sorts (Manuel du joueur 2024)', () => {
    test('Paladin et Rôdeur ont 2 emplacements de niveau 1 dès le niveau 1', () => {
        assert.deepEqual(spellSlotsFor('Paladin', 1), { 1: 2 });
        assert.deepEqual(spellSlotsFor('Rôdeur', 1), { 1: 2 });
        assert.deepEqual(spellSlotsFor('Paladin', 5), { 1: 4, 2: 2 });
    });

    test('Lanceur complet', () => {
        assert.deepEqual(spellSlotsFor('Druide', 3), { 1: 4, 2: 2 });
        assert.deepEqual(spellSlotsFor('Magicien', 20), { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 });
    });

    test('Magie de pacte du Sorcier', () => {
        assert.deepEqual(spellSlotsFor('Sorcier', 1), { 1: 1 });
        assert.deepEqual(spellSlotsFor('Sorcier', 5), { 3: 2 });
        assert.deepEqual(spellSlotsFor('Sorcier', 17), { 5: 4 });
    });

    test('Non-lanceurs : aucun emplacement', () => {
        assert.deepEqual(spellSlotsFor('Barbare', 10), {});
        assert.deepEqual(spellSlotsFor('', 10), {});
    });
});

describe('Classe d\'Armure', () => {
    const armor = (name, type, ca, equipped = true) => ({ name, type, ca, equipped });

    test('Sans armure : 10 + DEX', () => {
        assert.equal(computeArmorClass({ armors: [], className: 'Magicien', mods: MODS, pb: 2 }).value, 12);
    });

    test('Défense sans armure du Barbare : 10 + DEX + CON, bouclier autorisé', () => {
        assert.equal(computeArmorClass({ armors: [], className: 'Barbare', mods: MODS, pb: 2 }).value, 15);
        const withShield = computeArmorClass({ armors: [armor('Bouclier', 'Bouclier', '+2')], className: 'Barbare', mods: MODS, pb: 2 });
        assert.equal(withShield.value, 17);
    });

    test('Défense sans armure du Moine : 10 + DEX + SAG, perdue avec un bouclier', () => {
        assert.equal(computeArmorClass({ armors: [], className: 'Moine', mods: MODS, pb: 2 }).value, 13);
        const withShield = computeArmorClass({ armors: [armor('Bouclier', 'Bouclier', '+2')], className: 'Moine', mods: MODS, pb: 2 });
        assert.equal(withShield.value, 14); // 10 + DEX + 2 (bouclier), sans la SAG
    });

    test('Armures légère, intermédiaire (DEX max 2) et lourde', () => {
        const dex4 = { ...MODS, dex: 4 };
        assert.equal(computeArmorClass({ armors: [armor('Armure de cuir', 'Légère', '11 + Dex')], mods: dex4, pb: 2 }).value, 15);
        assert.equal(computeArmorClass({ armors: [armor('Cuirasse', 'Interméd.', '14 + Dex (max 2)')], mods: dex4, pb: 2 }).value, 16);
        assert.equal(computeArmorClass({ armors: [armor('Harnois', 'Lourde', '18')], mods: dex4, pb: 2 }).value, 18);
    });

    test('Bouclier sans formation : aucun bonus de CA (PHB 2024)', () => {
        const res = computeArmorClass({ armors: [armor('Bouclier', 'Bouclier', '+2')], className: 'Magicien', mods: MODS, pb: 2, shieldTrained: false });
        assert.equal(res.value, 12);
        assert.match(res.source, /bouclier non maîtrisé/);
    });

    test('Un seul bouclier compte à la fois (le meilleur)', () => {
        const res = computeArmorClass({
            armors: [armor('Bouclier', 'Bouclier', '+2'), armor('Bouclier +1', 'Bouclier', '+3')],
            className: 'Guerrier', mods: MODS, pb: 2
        });
        assert.equal(res.value, 15); // 10 + DEX 2 + 3
    });

    test('Les armures non équipées sont ignorées', () => {
        assert.equal(computeArmorClass({ armors: [armor('Harnois', 'Lourde', '18', false)], className: 'Guerrier', mods: MODS, pb: 2 }).value, 12);
    });

    test('Types « Bonus » et « Maîtrise »', () => {
        const res = computeArmorClass({
            armors: [armor('Cotte de mailles', 'Lourde', '16'), armor('Anneau', 'Bonus', '+1'), armor('Défense', 'Maîtrise', '')],
            mods: MODS, pb: 3
        });
        assert.equal(res.value, 20);
    });

    test('Ancienne sauvegarde sans type : catégorie déduite du nom', () => {
        assert.equal(armorCategory({ name: 'Bouclier', ca: '+2' }), 'shield');
        assert.equal(armorCategory({ name: 'Cotte de mailles' }), 'heavy');
        assert.equal(armorCategory({ name: 'Objet inconnu' }), '');
    });

    test('Type explicite « none » : le nom ne compte pas, CA sans armure', () => {
        assert.equal(armorCategory({ name: 'Cotte de mailles', type: 'none' }), '');
        const res = computeArmorClass({
            armors: [{ name: 'Cotte de mailles', type: 'none', ca: '', equipped: true }],
            mods: MODS, pb: 2
        });
        assert.equal(res.value, 10 + MODS.dex);
        assert.equal(res.source, 'Sans armure');
    });
});

describe('Sorts, épuisement et attaque sournoise', () => {
    test('DD de sauvegarde = 8 + maîtrise + mod ; attaque = maîtrise + mod', () => {
        assert.deepEqual(computeSpellcasting('wis', MODS, 2), { ability: 'wis', dc: 11, attack: 3 });
        assert.equal(computeSpellcasting('none', MODS, 2), null);
        assert.equal(computeSpellcasting('', MODS, 2), null);
    });

    test('Épuisement D&D 2024 : -2 par niveau, -1,5 m par niveau, mort au niveau 6', () => {
        assert.deepEqual(exhaustionEffects(0), { level: 0, d20Penalty: -0, speedPenaltyM: 0, dead: false });
        assert.deepEqual(exhaustionEffects(3), { level: 3, d20Penalty: -6, speedPenaltyM: 4.5, dead: false });
        assert.equal(exhaustionEffects(6).dead, true);
        assert.equal(exhaustionEffects(9).level, 6);
    });

    test('Épuisement : gravité affichée comme la v3 (avertissement dès 3, danger dès 5)', () => {
        assert.deepEqual([0, 1, 2, 3, 4, 5, 6, '9', 'x'].map(exhaustionSeverity),
            ['', '', '', 'warning', 'warning', 'danger', 'danger', 'danger', '']);
    });

    test('Attaque sournoise : 1d6 tous les 2 niveaux (arrondi supérieur)', () => {
        assert.equal(sneakAttackDice(1), 1);
        assert.equal(sneakAttackDice(2), 1);
        assert.equal(sneakAttackDice(3), 2);
        assert.equal(sneakAttackDice(20), 10);
    });
});

describe('deriveCharacter : fiche complète à partir d\'une sauvegarde', () => {
    const record = {
        char_class: 'Barbare',
        char_level: '5',
        str_score: '19', dex_score: '16', con_score: '18', int_score: '10', wis_score: '12', cha_score: '11',
        str_save_prof: true, con_save_prof: true, dex_save_prof: null,
        skill_prof_athletics: true,
        skill_prof_perception: true,
        skill_exp_intimidation: true,
        spell_ability: 'none',
        fatigue_level: 1,
        prof_armor_shield: true,
        dynamic_armors: [{ name: 'Bouclier', type: 'Bouclier', ca: '+2', equipped: true }]
    };
    const d = deriveCharacter(record);

    test('Niveau, maîtrise, modificateurs', () => {
        assert.equal(d.level, 5);
        assert.equal(d.pb, 3);
        assert.deepEqual(d.mods, { str: 4, dex: 3, con: 4, int: 0, wis: 1, cha: 0 });
    });

    test('Jets de sauvegarde', () => {
        assert.deepEqual(d.saves.str, { proficient: true, bonus: 7 });
        assert.deepEqual(d.saves.dex, { proficient: false, bonus: 3 });
    });

    test('Compétences : maîtrise, Expertise (qui implique la maîtrise)', () => {
        assert.equal(d.skills.athletics.bonus, 7);
        assert.equal(d.skills.intimidation.proficient, true);
        assert.equal(d.skills.intimidation.bonus, 6);
        assert.equal(d.skills.stealth.bonus, 3);
    });

    test('Perception passive, initiative, CA, ressources, dé de vie', () => {
        assert.equal(d.passivePerception, 14);
        assert.equal(d.initiative, 3);
        assert.equal(d.armorClass.value, 19); // 10 + 3 + 4 + bouclier 2
        assert.equal(d.spellcasting, null);
        assert.deepEqual(d.classResource, { count: 3, label: 'Rages', reset: 'one' });
        assert.equal(d.hitDie, 'd12');
        assert.equal(d.exhaustion.d20Penalty, -2);
    });

    test('Sauvegarde vide : valeurs par défaut sûres', () => {
        const empty = deriveCharacter({});
        assert.equal(empty.level, 1);
        assert.equal(empty.scores.str, 10);
        assert.equal(empty.armorClass.value, 10);
        assert.equal(empty.passivePerception, 10);
    });
});

describe('computeWeapon : armes avec bonus de combat', () => {
    const greataxe = { name: 'Hache à deux mains', atkKey: 'FOR', baseDmg: '1d12 tran.', prop: 'Lourde, Deux mains', category: 'Guerre' };
    const dagger = { name: 'Dague', atkKey: 'DEX', baseDmg: '1d4 perf.', prop: 'Finesse, Légère', category: 'Courante' };
    const shortbow = { name: 'Arc court', atkKey: 'DEX', baseDmg: '1d6 perf.', prop: 'Munitions (24/96 m), Deux mains', category: 'Courante' };
    const stats = (classSlug, level = 5) => ({ mods: { str: 4, dex: 3, con: 2, int: 0, wis: 2, cha: 0 }, pb: 3, level, classSlug });

    test('Arme sans rattachement au manuel : pas de calcul', () => {
        assert.equal(computeWeapon({ name: 'Bâton maudit' }, stats('fighter')), null);
        assert.equal(computeWeapon({ atkKey: 'FOR', name: '' }, stats('fighter')), null);
    });

    test('Rage du Barbare : +2 aux dégâts des attaques de FOR uniquement', () => {
        assert.equal(computeWeapon(greataxe, stats('barbarian'), { rage: true }).damage.text, '1d12 +4 TRAN +2 (Rage)');
        assert.equal(computeWeapon(shortbow, stats('barbarian'), { rage: true }).damage.text, '1d6 +3 PERF');
        // Finesse : la FOR (+4) est meilleure que la DEX (+3), donc la Rage s'applique
        assert.equal(computeWeapon(dagger, stats('barbarian'), { rage: true }).damage.text, '1d4 +4 PERF +2 (Rage)');
    });

    test('Cogneur lourd : + bonus de maîtrise, armes Lourdes seulement', () => {
        const handaxe = { name: 'Hachette', atkKey: 'FOR', baseDmg: '1d6 tran.', prop: 'Légère, Lancer (6/18 m)', category: 'Courante' };
        assert.equal(computeWeapon(greataxe, stats('fighter'), { heavyWeaponMaster: true }).damage.text, '1d12 +4 TRAN +3 (Cogneur lourd)');
        assert.equal(computeWeapon(handaxe, stats('fighter'), { heavyWeaponMaster: true }).damage.text, '1d6 +4 TRAN');
        assert.equal(computeWeapon(greataxe, stats('barbarian'), { rage: true, heavyWeaponMaster: true }).damage.text,
            '1d12 +4 TRAN +2 (Rage) +3 (Cogneur lourd)');
    });

    test('Charge (Expert de la charge) : +1d8 aux armes de corps à corps seulement', () => {
        const handaxe = { name: 'Hachette', atkKey: 'FOR', baseDmg: '1d6 tran.', prop: 'Légère, Lancer (6/18 m)', category: 'Courante' };
        assert.equal(computeWeapon(greataxe, stats('fighter'), { charger: true }).damage.text, '1d12 +4 TRAN +1d8 (Charge)');
        assert.equal(computeWeapon(handaxe, stats('fighter'), { charger: true }).damage.text, '1d6 +4 TRAN +1d8 (Charge)');
        assert.equal(computeWeapon(shortbow, stats('fighter'), { charger: true }).damage.text, '1d6 +3 PERF');
        assert.equal(computeWeapon(greataxe, stats('barbarian'), { rage: true, heavyWeaponMaster: true, charger: true }).damage.text,
            '1d12 +4 TRAN +2 (Rage) +3 (Cogneur lourd) +1d8 (Charge)');
        assert.equal(computeWeapon(greataxe, stats('fighter'), { charger: false }).damage.text, '1d12 +4 TRAN');
    });

    test('Attaque sournoise : armes de finesse ou à distance', () => {
        assert.equal(computeWeapon(dagger, stats('rogue', 5), { sneakAttack: true }).damage.text, '1d4 +4 PERF +3d6 (Sournoise)');
        assert.equal(computeWeapon(greataxe, stats('rogue', 5), { sneakAttack: true }).damage.text, '1d12 +4 TRAN');
    });

    test('Arts martiaux du Moine : dé remplacé pour une arme courante non lourde', () => {
        assert.equal(computeWeapon(dagger, stats('monk', 5)).damage.text, '1d8 +4 PERF');
        assert.equal(computeWeapon(shortbow, stats('monk', 5)).damage.text, '1d6 +3 PERF');
        assert.equal(computeWeapon(greataxe, stats('monk', 5)).damage.text, '1d12 +4 TRAN');
    });

    test('Configuration : bonus magique et caractéristique imposée', () => {
        const res = computeWeapon({ ...greataxe, weaponConfig: '{"magicBonus":1,"statOverride":"cha"}' }, stats('warlock'));
        assert.equal(res.attack.text, 'CHA : +4');
        assert.equal(res.damage.text, '1d12 +1 TRAN');
    });
});

describe('Odyssée des Seigneurs Dragons : palier de renommée', () => {
    test('Paliers selon les points (identique à la v3)', () => {
        assert.equal(renownTier('0'), 'Inconnu');
        assert.equal(renownTier(1), 'Célébrité locale');
        assert.equal(renownTier('5'), 'Célébrité locale');
        assert.equal(renownTier('6'), 'Reconnaissance urbaine');
        assert.equal(renownTier(11), 'Idolâtré');
        assert.equal(renownTier(15), 'Culte');
        assert.equal(renownTier(19), 'Divin');
        assert.equal(renownTier(''), 'Inconnu');
    });
});

describe('featSlotState : emplacements de dons selon le niveau', () => {
    test('Niveau atteint : don choisi (actif) ou à choisir', () => {
        assert.equal(featSlotState(1, 4, 'sauvagerie_martiale'), 'active');
        assert.equal(featSlotState(4, 4, 'maitre_des_armes_lourdes_cogneur_lourd'), 'active');
        assert.equal(featSlotState(4, 4, ''), 'pending');
        assert.equal(featSlotState(1, 1, undefined), 'pending');
    });

    test('Niveau pas encore atteint : don prévu en avance ou emplacement à venir', () => {
        assert.equal(featSlotState(8, 4, 'robuste'), 'planned');
        assert.equal(featSlotState(8, 4, ''), 'upcoming');
        assert.equal(featSlotState(19, 18, null), 'upcoming');
        assert.equal(featSlotState(19, 19, ''), 'pending');
    });

    test('Niveau saisi librement (texte, HTML, vide) et choix vide ou espaces', () => {
        assert.equal(featSlotState(4, '<font color="#1a1a1a">4</font>', ''), 'pending');
        assert.equal(featSlotState(4, '3', 'robuste'), 'planned');
        // Niveau absent ou illisible : niveau 1, comme deriveCharacter
        assert.equal(featSlotState(1, '', ''), 'pending');
        assert.equal(featSlotState(4, 'abc', ''), 'upcoming');
        // Au-delà de 20 : ramené à 20
        assert.equal(featSlotState(19, 25, 'x'), 'active');
        assert.equal(featSlotState(8, 8, '   '), 'pending');
        assert.equal(featSlotState(8, 8, '<b></b>'), 'pending');
    });
});

describe('Armures et boucliers magiques (clé facultative « magic »)', () => {
    const magicArmor = (name, type, ca, magic, equipped = true) => ({ name, type, ca, equipped, magic });

    test('Bonus magique lu : 1, « 1 », « +1 » ; le reste vaut 0 (max +3)', () => {
        assert.equal(armorMagicBonus({ magic: 1 }), 1);
        assert.equal(armorMagicBonus({ magic: '2' }), 2);
        assert.equal(armorMagicBonus({ magic: '+3' }), 3);
        for (const bad of [0, 4, -1, '', 'x', null, undefined, 1.5, '1d4', true]) {
            assert.equal(armorMagicBonus({ magic: bad }), 0, String(bad));
        }
        assert.equal(armorMagicBonus(null), 0);
        assert.equal(armorMagicBonus({}), 0);
    });

    test('Armure portée +1 : la CA de l\'armure gagne 1 (légère, intermédiaire, lourde)', () => {
        const dex4 = { ...MODS, dex: 4 };
        assert.equal(computeArmorClass({ armors: [magicArmor('Armure de cuir', 'Légère', '11', 1)], mods: dex4, pb: 2 }).value, 16);
        assert.equal(computeArmorClass({ armors: [magicArmor('Cuirasse', 'Interméd.', '14', 2)], mods: dex4, pb: 2 }).value, 18);
        const plate = computeArmorClass({ armors: [magicArmor('Harnois', 'Lourde', '18', 3)], mods: dex4, pb: 2 });
        assert.equal(plate.value, 21);
        assert.equal(plate.source, 'Harnois (+3 magique)');
    });

    test('Bouclier +1 : +3 au lieu de +2, et le meilleur bouclier compte avec sa magie', () => {
        const res = computeArmorClass({ armors: [magicArmor('Bouclier', 'Bouclier', '+2', 1)], className: 'Guerrier', mods: MODS, pb: 2 });
        assert.equal(res.value, 15); // 10 + DEX 2 + 2 + 1
        assert.match(res.source, /bouclier \+1 magique/);
        const two = computeArmorClass({
            armors: [magicArmor('Bouclier', 'Bouclier', '+2', 2), magicArmor('Bouclier', 'Bouclier', '+3', undefined)],
            className: 'Guerrier', mods: MODS, pb: 2
        });
        assert.equal(two.value, 16); // un seul bouclier : 2 + 2 magique bat 3
    });

    test('Bouclier magique non maîtrisé : toujours sans effet', () => {
        const res = computeArmorClass({ armors: [magicArmor('Bouclier', 'Bouclier', '+2', 3)], className: 'Magicien', mods: MODS, pb: 2, shieldTrained: false });
        assert.equal(res.value, 12);
    });

    test('Barbare sans armure avec bouclier +1 ; armure magique non équipée ignorée', () => {
        assert.equal(computeArmorClass({ armors: [magicArmor('Bouclier', 'Bouclier', '+2', 1)], className: 'Barbare', mods: MODS, pb: 2 }).value, 18);
        assert.equal(computeArmorClass({ armors: [magicArmor('Harnois', 'Lourde', '18', 2, false)], className: 'Guerrier', mods: MODS, pb: 2 }).value, 12);
    });

    test('Types Bonus, Maîtrise et Standard : la clé « magic » est sans effet', () => {
        const res = computeArmorClass({
            armors: [magicArmor('Anneau', 'Bonus', '+1', 2), magicArmor('Défense', 'Maîtrise', '', 2), magicArmor('Truc', 'none', '5', 2)],
            className: 'Magicien', mods: MODS, pb: 2
        });
        assert.equal(res.value, 15); // 10 + 2 + 1 + 2
        assert.equal(armorCanBeMagic({ type: 'Bonus' }), false);
        assert.equal(armorCanBeMagic({ type: 'Bouclier' }), true);
        assert.equal(armorCanBeMagic({ type: 'none', name: 'Cotte de mailles' }), false); // « Standard / Aucun » explicite
        assert.equal(armorCanBeMagic({ name: 'Cotte de mailles' }), true); // ancienne sauvegarde sans type
    });

    test('Sans clé « magic », la CA est exactement celle d\'avant', () => {
        const armors = [magicArmor('Cotte de mailles', 'Lourde', '16'), magicArmor('Bouclier', 'Bouclier', '+2')];
        const res = computeArmorClass({ armors, className: 'Guerrier', mods: MODS, pb: 2 });
        assert.equal(res.value, 18);
        assert.equal(res.source, 'Cotte de mailles');
    });
});

describe('Colonne CA calculée : ce que chaque ligne apporte, et pourquoi', () => {
    const row = (name, type, ca, extra = {}) => ({ name, type, ca, equipped: true, ...extra });
    const dex3 = { ...MODS, dex: 3 };
    const ctx = { mods: dex3, pb: 2 };
    const M = '−';

    test('Base : nombre enregistré, sinon valeur du manuel pour un nom connu, sinon 0', () => {
        assert.equal(armorBaseValue({ name: 'Demi-plate', ca: '15' }), 15);
        assert.equal(armorBaseValue({ name: 'Demi-plate', ca: '' }), 15);
        assert.equal(armorBaseValue({ name: 'demi-plate' }), 15);
        assert.equal(armorBaseValue({ name: 'Bouclier', ca: '' }), 2);
        assert.equal(armorBaseValue({ name: 'Demi-plate', ca: '16' }), 16); // valeur enregistrée gardée
        assert.equal(armorBaseValue({ name: 'Cape de protection', ca: '+1' }), 1);
        assert.equal(armorBaseValue({ name: 'Cape de protection', ca: '' }), 0);
        assert.equal(armorBaseValue({ name: 'Harnois', ca: '<b>18</b>' }), 18);
    });

    test('Demi-plate +1 avec Dex +3 : 15 + 2 Dex (max 2) + 1 magique = 18', () => {
        const line = armorLine(row('Demi-plate', 'Interméd.', '15', { magic: 1 }), ctx);
        assert.equal(line.kind, 'body');
        assert.equal(line.value, 18);
        assert.equal(line.display, '18');
        assert.equal(line.formula, '15 + 2 Dex (max 2) + 1 magique = 18');
    });

    test('Légère avec Dex négative, lourde sans Dex, lourde magique', () => {
        assert.equal(armorLine(row('Armure de cuir', 'Légère', '11'), { mods: { ...MODS, dex: -1 }, pb: 2 }).formula, `11 ${M} 1 Dex = 10`);
        const plate = armorLine(row('Harnois', 'Lourde', '18'), ctx);
        assert.equal(plate.value, 18);
        assert.equal(plate.formula, '18 (armure lourde : sans la Dex)');
        assert.equal(armorLine(row('Harnois', 'Lourde', '18', { magic: 2 }), ctx).formula, '18 + 2 magique = 20 (armure lourde : sans la Dex)');
    });

    test('Bouclier +1 : « +3 », expliqué « +2 bouclier + 1 magique = +3 »', () => {
        const line = armorLine(row('Bouclier', 'Bouclier', '+2', { magic: 1 }), ctx);
        assert.equal(line.display, '+3');
        assert.equal(line.formula, '+2 bouclier + 1 magique = +3');
        assert.equal(armorLine(row('Bouclier', 'Bouclier', '+2'), ctx).formula, '+2 bouclier');
    });

    test('Bonus fixe, Maîtrise, Standard / Aucun', () => {
        assert.equal(armorLine(row('Cape de protection', 'Bonus', '+1'), ctx).display, '+1');
        assert.equal(armorLine(row('Défense', 'Maîtrise', ''), { mods: dex3, pb: 3 }).display, '+3');
        const none = armorLine(row('Truc', 'none', '5'), ctx);
        assert.equal(none.kind, 'none');
        assert.equal(none.value, null);
        assert.equal(none.display, '—');
    });

    test('Nom du manuel sans valeur enregistrée : la base du manuel compte dans la CA', () => {
        const res = computeArmorClass({ armors: [{ name: 'Cotte de mailles', equipped: true }], className: 'Guerrier', mods: dex3, pb: 2 });
        assert.equal(res.value, 16);
    });

    test('État de chaque ligne : comptée, non équipée, surpassée, bouclier non maîtrisé', () => {
        const res = computeArmorClass({
            armors: [
                row('Demi-plate', 'Interméd.', '15', { magic: 1 }),
                row('Cotte de mailles', 'Lourde', '16'),
                row('Bouclier', 'Bouclier', '+2', { magic: 1 }),
                row('Bouclier', 'Bouclier', '+2'),
                row('Cape de protection', 'Bonus', '+1'),
                row('Harnois', 'Lourde', '18', { equipped: false }),
                row('Bibelot', 'none', '')
            ],
            className: 'Guerrier', mods: dex3, pb: 2
        });
        assert.equal(res.value, 22); // 18 demi-plate + 3 bouclier + 1 cape
        assert.deepEqual(res.rows.map(r => r.status), ['counted', 'outdone', 'counted', 'outdone', 'counted', 'unequipped', 'none']);
        assert.match(res.rows[1].note, /Une seule armure compte : « Demi-plate »/);
        assert.match(res.rows[3].note, /Un seul bouclier compte/);
        assert.match(res.rows[5].note, /Non équipée/);

        const untrained = computeArmorClass({ armors: [row('Bouclier', 'Bouclier', '+2')], className: 'Magicien', mods: dex3, pb: 2, shieldTrained: false });
        assert.equal(untrained.rows[0].status, 'untrained');
        assert.equal(untrained.value, 13);
    });

    test('Maître des armures intermédiaires : Dex max 3 si Dextérité 16 ou plus (PHB 2024)', () => {
        assert.equal(mediumArmorDexMax([], 18), 2);
        assert.equal(mediumArmorDexMax(['maitre_des_armures_intermediaires'], 15), 2);
        assert.equal(mediumArmorDexMax(['maitre_des_armures_intermediaires'], 16), 3);
        const record = {
            char_class: 'Guerrier', char_level: '4', dex_score: '16', feat_4: 'maitre_des_armures_intermediaires',
            dynamic_armors: [row('Demi-plate', 'Interméd.', '15')]
        };
        const d = deriveCharacter(record);
        assert.equal(d.armorClass.value, 18);
        assert.equal(d.armorClass.rows[0].line.formula, '15 + 3 Dex (max 3) = 18');
        assert.equal(deriveCharacter({ ...record, feat_4: '' }).armorClass.value, 17);
        assert.equal(deriveCharacter({ ...record, char_level: '3' }).armorClass.value, 17); // don pas encore atteint
    });

    test('Relecture : un bouclier négatif est ramené à 0 (CA inchangée par rapport à avant)', () => {
        const r = computeArmorClass({ armors: [row('Bouclier maudit', 'Bouclier', '-1')], className: 'Guerrier', mods: MODS, pb: 2 });
        assert.equal(r.value, 12);
        assert.equal(r.rows[0].line.display, '+0');
    });

    test('Relecture : deux armures ou deux boucliers de même valeur ne disent pas « donne plus »', () => {
        const r = computeArmorClass({
            armors: [row('Harnois', 'Lourde', '18'), row('Harnois du nain', 'Lourde', '18'),
                row('Bouclier', 'Bouclier', '+2'), row('Écu', 'Bouclier', '+2'), row('Rondache', 'Bouclier', '+1')],
            className: 'Guerrier', mods: MODS, pb: 2
        });
        assert.equal(r.value, 20);
        assert.equal(r.rows[1].note, 'Une seule armure compte : « Harnois » est retenue (même CA).');
        assert.equal(r.rows[3].note, 'Un seul bouclier compte : « Bouclier » est retenu (même bonus).');
        assert.equal(r.rows[4].note, 'Un seul bouclier compte : « Bouclier » donne plus.');
    });

    test('Relecture : Moine avec bouclier, la perte de la Défense sans armure est expliquée', () => {
        const mods = { ...MODS, dex: 3, wis: 3 };
        const shield = [row('Bouclier', 'Bouclier', '+2')];
        const sans = computeArmorClass({ armors: [], className: 'Moine', mods, pb: 2 });
        assert.equal(sans.value, 16);
        const trained = computeArmorClass({ armors: shield, className: 'Moine', mods, pb: 2 });
        assert.equal(trained.value, 15);
        assert.equal(trained.source, 'Sans armure — Défense sans armure (Moine) perdue : bouclier en main');
        assert.match(trained.rows[0].note, /Défense sans armure \(Moine\) perdue avec un bouclier : 16 sans le bouclier\./);
        const untrained = computeArmorClass({ armors: shield, className: 'Moine', mods, pb: 2, shieldTrained: false });
        assert.equal(untrained.value, 13);
        assert.doesNotMatch(untrained.source, /sans effet/);
        assert.match(untrained.source, /bouclier non maîtrisé : aucun bonus/);
        assert.match(untrained.rows[0].note, /^Formation aux boucliers non cochée.*16 sans le bouclier\.$/);
        // Moine dont la Sagesse n'apporte rien : rien à expliquer
        const plain = computeArmorClass({ armors: shield, className: 'Moine', mods: { ...mods, wis: 0 }, pb: 2 });
        assert.equal(plain.source, 'Sans armure');
        assert.equal(plain.rows[0].note, '');
    });
});
