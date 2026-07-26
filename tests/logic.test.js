/**
 * TESTS UNITAIRES — LOGIC.JS (Règles & Calculs D&D 2024)
 * Exécuté via Node.js native test runner: `npm test`
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    calcMod,
    calculateProficiencyBonus,
    calculateSkillBonus,
    getClassResourceInfo,
    getWeaponConfig,
    resolveWeaponAttackStat,
    calcWeaponAttack,
    calcWeaponDamage,
    getRageBonus,
    isMartialArtsWeapon,
    getMartialArtsDie
} from '../js/logic.js';

describe('1. Modificateurs de caractéristiques (calcMod)', () => {
    test('Calcule correctement les modificateurs pour tous les scores (1-30)', () => {
        assert.equal(calcMod(1), -5);
        assert.equal(calcMod(8), -1);
        assert.equal(calcMod(9), -1);
        assert.equal(calcMod(10), 0);
        assert.equal(calcMod(11), 0);
        assert.equal(calcMod(12), 1);
        assert.equal(calcMod(14), 2);
        assert.equal(calcMod(18), 4);
        assert.equal(calcMod(20), 5);
        assert.equal(calcMod(30), 10);
    });
});

describe('2. Bonus de maîtrise par niveau (calculateProficiencyBonus)', () => {
    test('Respecte la progression officielle D&D 2024 (+2 à +6)', () => {
        assert.equal(calculateProficiencyBonus(1), 2);
        assert.equal(calculateProficiencyBonus(4), 2);
        assert.equal(calculateProficiencyBonus(5), 3);
        assert.equal(calculateProficiencyBonus(8), 3);
        assert.equal(calculateProficiencyBonus(9), 4);
        assert.equal(calculateProficiencyBonus(12), 4);
        assert.equal(calculateProficiencyBonus(13), 5);
        assert.equal(calculateProficiencyBonus(16), 5);
        assert.equal(calculateProficiencyBonus(17), 6);
        assert.equal(calculateProficiencyBonus(20), 6);
    });
});

describe('3. Bonus de compétences & Expertise (calculateSkillBonus)', () => {
    test('Sans maîtrise : modificateur brut', () => {
        assert.equal(calculateSkillBonus(3, false, false, 2), 3);
        assert.equal(calculateSkillBonus(-1, false, false, 3), -1);
    });

    test('Avec maîtrise : mod + bonus de maîtrise', () => {
        assert.equal(calculateSkillBonus(3, true, false, 2), 5);
        assert.equal(calculateSkillBonus(1, true, false, 4), 5);
    });

    test('Avec Expertise : mod + (2 * bonus de maîtrise)', () => {
        assert.equal(calculateSkillBonus(3, true, true, 2), 7);
        assert.equal(calculateSkillBonus(4, true, true, 3), 10);
        assert.equal(calculateSkillBonus(2, true, true, 6), 14);
    });
});

describe('4. Ressources de classe D&D 2024 (getClassResourceInfo)', () => {
    const mods = { str: 2, dex: 3, con: 2, int: 0, wis: 1, cha: 4 };

    test('Barbare : Paliers de Rages & récupération 1 pt au repos court (D&D 2024)', () => {
        assert.deepEqual(getClassResourceInfo(1, 'Barbare', mods), { count: 2, label: 'Rages', reset: 'one' });
        assert.deepEqual(getClassResourceInfo(3, 'Barbare', mods), { count: 3, label: 'Rages', reset: 'one' });
        assert.deepEqual(getClassResourceInfo(6, 'Barbare', mods), { count: 4, label: 'Rages', reset: 'one' });
        assert.deepEqual(getClassResourceInfo(12, 'Barbare', mods), { count: 5, label: 'Rages', reset: 'one' });
        assert.deepEqual(getClassResourceInfo(17, 'Barbare', mods), { count: 6, label: 'Rages', reset: 'one' });
    });

    test('Barde : Inspiration basée sur CHA, reset tous pts au niv 5 (Font of Inspiration)', () => {
        assert.deepEqual(getClassResourceInfo(3, 'Barde', mods), { count: 4, label: 'Inspiration Bardique', reset: 'none' });
        assert.deepEqual(getClassResourceInfo(5, 'Barde', mods), { count: 4, label: 'Inspiration Bardique', reset: 'all' });
    });

    test('Clerc : Conduit Divin', () => {
        assert.deepEqual(getClassResourceInfo(1, 'Clerc', mods), { count: 2, label: 'Conduit Divin', reset: 'one' });
        assert.deepEqual(getClassResourceInfo(6, 'Cleric', mods), { count: 3, label: 'Conduit Divin', reset: 'one' });
    });

    test('Moine : Points de Discipline (Ki) = niveau & reset "all"', () => {
        assert.deepEqual(getClassResourceInfo(1, 'Moine', mods), { count: 1, label: 'Points de Discipline (Ki)', reset: 'all' });
        assert.deepEqual(getClassResourceInfo(10, 'Monk', mods), { count: 10, label: 'Points de Discipline (Ki)', reset: 'all' });
    });

    test('Guerrier : Second Souffle paliers D&D 2024', () => {
        assert.deepEqual(getClassResourceInfo(1, 'Guerrier', mods), { count: 2, label: 'Second Souffle', reset: 'one' });
        assert.deepEqual(getClassResourceInfo(4, 'Fighter', mods), { count: 3, label: 'Second Souffle', reset: 'one' });
        assert.deepEqual(getClassResourceInfo(10, 'Guerrier', mods), { count: 4, label: 'Second Souffle', reset: 'one' });
    });
});

describe('5. Résolution de caractéristique d\'attaque d\'arme (resolveWeaponAttackStat)', () => {
    const mods = { str: 2, dex: 4, con: 1, int: 0, wis: 1, cha: 3 };

    test('Arme standard : utilise la caractéristique de base', () => {
        assert.deepEqual(resolveWeaponAttackStat('FOR', '', mods, ''), { stat: 'FOR', mod: 2 });
        assert.deepEqual(resolveWeaponAttackStat('DEX', '', mods, ''), { stat: 'DEX', mod: 4 });
    });

    test('Finesse : prend le meilleur entre FOR et DEX', () => {
        assert.deepEqual(resolveWeaponAttackStat('FOR', 'Finesse', mods, ''), { stat: 'DEX', mod: 4 });
    });

    test('Munitions : force l\'utilisation de DEX', () => {
        assert.deepEqual(resolveWeaponAttackStat('FOR', 'Munitions', mods, ''), { stat: 'DEX', mod: 4 });
    });

    test('Override manuel : a la priorité absolue sur les propriétés', () => {
        assert.deepEqual(resolveWeaponAttackStat('FOR', 'Finesse', mods, 'cha'), { stat: 'CHA', mod: 3 });
    });
});

describe('6. Calculs d\'Attaque et de Dégâts d\'armes (calcWeaponAttack / calcWeaponDamage)', () => {
    const mods = { str: 3, dex: 2, con: 0, int: 0, wis: 0, cha: 0 };

    test('calcWeaponAttack calcule le total d\'attaque et l\'infobulle', () => {
        const res = calcWeaponAttack('FOR', '', mods, 2, 1, '');
        assert.equal(res.text, 'FOR : +6');
        assert.ok(res.tooltip.includes('FOR (+3)'));
        assert.ok(res.tooltip.includes('Maitrise (+2)'));
        assert.ok(res.tooltip.includes('Magie (+1)'));
    });

    test('calcWeaponDamage calcule la formule de dégâts et le type', () => {
        const res = calcWeaponDamage('1d12 tran.', '', mods, 1, '', '', '', 'FOR', []);
        assert.equal(res.text, '1d12 +4 TRAN');
    });

    test('calcWeaponDamage gère les dégâts supplémentaires (extraDmg)', () => {
        const extra = [{ die: '1d6', type: 'Feu' }];
        const res = calcWeaponDamage('2d6 cont.', '', mods, 0, '', '', '', 'FOR', extra);
        assert.equal(res.text, '2d6 +3 CONT +1d6 (Feu)');
    });
});

describe('7. Règles Moine 2024 (Arts Martiaux)', () => {
    test('isMartialArtsWeapon : Arme Courante de mêlée sans la propriété Lourde', () => {
        assert.equal(isMartialArtsWeapon('Courante', false, ''), true);
        assert.equal(isMartialArtsWeapon('Courante', false, 'Finesse'), true);
        assert.equal(isMartialArtsWeapon('Courante', false, 'Lourde'), false);
        assert.equal(isMartialArtsWeapon('Courante', true, ''), false); // à distance = false
        assert.equal(isMartialArtsWeapon('Guerre', false, ''), false);
    });

    test('getMartialArtsDie : Dé de dégâts selon le niveau Moine D&D 2024', () => {
        assert.equal(getMartialArtsDie(1), '1d6');
        assert.equal(getMartialArtsDie(4), '1d6');
        assert.equal(getMartialArtsDie(5), '1d8');
        assert.equal(getMartialArtsDie(10), '1d8');
        assert.equal(getMartialArtsDie(11), '1d10');
        assert.equal(getMartialArtsDie(16), '1d10');
        assert.equal(getMartialArtsDie(17), '1d12');
        assert.equal(getMartialArtsDie(20), '1d12');
    });
});

describe('8. Bonus de Rage Barbare (getRageBonus)', () => {
    test('Calcule le bonus de dégâts de rage selon le niveau', () => {
        assert.equal(getRageBonus(1), 2);
        assert.equal(getRageBonus(8), 2);
        assert.equal(getRageBonus(9), 3);
        assert.equal(getRageBonus(15), 3);
        assert.equal(getRageBonus(16), 4);
        assert.equal(getRageBonus(20), 4);
    });
});

describe('9. Configuration personnalisée d\'arme (getWeaponConfig)', () => {
    test('Parse correctement un JSON valide dans dataset.weaponConfig', () => {
        const mockTr = { dataset: { weaponConfig: '{"magicBonus":"2","statOverride":"dex"}' } };
        const config = getWeaponConfig(mockTr);
        assert.deepEqual(config, { magicBonus: "2", statOverride: "dex" });
    });

    test('Retourne un objet vide si JSON invalide ou absent', () => {
        assert.deepEqual(getWeaponConfig({ dataset: {} }), {});
        assert.deepEqual(getWeaponConfig({ dataset: { weaponConfig: 'INVALID' } }), {});
    });
});
