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
    computeSpellcasting,
    exhaustionEffects,
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
