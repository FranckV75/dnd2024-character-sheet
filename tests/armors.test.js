/**
 * TESTS UNITAIRES — ARMORS.JS (armures D&D 2024)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    ARMOR_TYPES,
    searchArmorCatalogue,
    catalogueArmorClass,
    armorRowFromCatalogue,
    strengthRequirement,
    armorWarnings,
    armorTraining
} from '../js/rules/armors.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { EMPTY_ARMOR } from '../js/state/schema.js';

const byName = (name) => EQUIPMENT_DATA.armors.find(a => a.name === name);
const ALL = { light: true, medium: true, heavy: true, shield: true };

describe('ARMOR_TYPES', () => {
    test('valeurs identiques à la v3', () => {
        assert.deepEqual(ARMOR_TYPES.map(([v]) => v),
            ['none', 'Légère', 'Interméd.', 'Lourde', 'Bouclier', 'Bonus', 'Maîtrise']);
    });

    test('chaque type du catalogue existe dans la liste', () => {
        const values = new Set(ARMOR_TYPES.map(([v]) => v));
        for (const a of EQUIPMENT_DATA.armors) assert.ok(values.has(a.type), a.type);
    });
});

describe('searchArmorCatalogue', () => {
    test('insensible aux accents et à la casse', () => {
        const names = searchArmorCatalogue('ECAILLES').map(a => a.name);
        assert.deepEqual(names, ["Armure d'écailles"]);
    });

    test('les noms commençant par la recherche passent en premier', () => {
        const names = searchArmorCatalogue('cu').map(a => a.name);
        assert.equal(names[0], 'Cuirasse');
        assert.ok(names.includes('Armure de cuir'));
    });

    test('recherche vide : aucun résultat', () => {
        assert.deepEqual(searchArmorCatalogue('  '), []);
    });
});

describe('catalogueArmorClass', () => {
    test('armure légère / intermédiaire : nombre seul', () => {
        assert.equal(catalogueArmorClass(byName('Armure de cuir clouté')), '12');
        assert.equal(catalogueArmorClass(byName('Demi-plate')), '15');
    });

    test('armure lourde : valeur fixe', () => {
        assert.equal(catalogueArmorClass(byName('Harnois')), '18');
    });

    test('bouclier : préfixe +', () => {
        assert.equal(catalogueArmorClass(byName('Bouclier')), '+2');
    });
});

describe('armorRowFromCatalogue', () => {
    test('remplit type, CA, Force, discrétion, poids, prix', () => {
        const row = armorRowFromCatalogue(byName('Clibanion'));
        assert.deepEqual(row, {
            ...EMPTY_ARMOR,
            name: 'Clibanion', type: 'Lourde', ca: '17', str: '15', stealth: true,
            weight: '30 kg', price: '200 po'
        });
    });

    test('conserve le commentaire, l\'état équipé et les clés inconnues', () => {
        const row = armorRowFromCatalogue(byName('Bouclier'), { name: 'bou', comment: 'Blason', equipped: true, legacy: 1 });
        assert.equal(row.comment, 'Blason');
        assert.equal(row.equipped, true);
        assert.equal(row.legacy, 1);
        assert.equal(row.type, 'Bouclier');
        assert.equal(row.stealth, false);
    });
});

describe('strengthRequirement', () => {
    test('lit la Force minimale', () => {
        assert.equal(strengthRequirement('15'), 15);
        assert.equal(strengthRequirement('For 13'), 13);
        assert.equal(strengthRequirement('-'), 0);
        assert.equal(strengthRequirement(''), 0);
        assert.equal(strengthRequirement(undefined), 0);
    });
});

describe('armorTraining', () => {
    test('lit les cases de maîtrise', () => {
        assert.deepEqual(armorTraining({ prof_armor_light: true, prof_armor_shield: true }),
            { light: true, medium: false, heavy: false, shield: true });
    });
});

describe('armorWarnings', () => {
    const plate = { ...armorRowFromCatalogue(byName('Harnois')), equipped: true };
    const leather = { ...armorRowFromCatalogue(byName('Armure de cuir')), equipped: true };
    const shield = { ...armorRowFromCatalogue(byName('Bouclier')), equipped: true };

    test('rien à signaler pour une armure maîtrisée', () => {
        assert.deepEqual(armorWarnings([plate, shield], ALL, 15), [[], []]);
    });

    test('les armures non équipées sont ignorées', () => {
        const stored = { ...plate, equipped: false };
        assert.deepEqual(armorWarnings([stored, { ...stored }], {}, 8), [[], []]);
    });

    test('armure sans formation', () => {
        const [w] = armorWarnings([leather], { heavy: true }, 10);
        assert.equal(w.length, 1);
        assert.match(w[0], /non maîtrisée/);
    });

    test('bouclier sans formation : pas de bonus de CA', () => {
        const [, w] = armorWarnings([leather, shield], { light: true }, 10);
        assert.equal(w.length, 1);
        assert.match(w[0], /aucun bonus de CA/);
    });

    test('Force insuffisante : vitesse réduite de 3 m', () => {
        const [w] = armorWarnings([plate], ALL, 14);
        assert.equal(w.length, 1);
        assert.match(w[0], /15 requise/);
        assert.match(w[0], /3 m/);
        assert.deepEqual(armorWarnings([plate], ALL, 15), [[]]);
    });

    test('plusieurs armures portées', () => {
        const w = armorWarnings([plate, leather], ALL, 18);
        assert.ok(w[0].some(m => /Plusieurs armures/.test(m)));
        assert.ok(w[1].some(m => /Plusieurs armures/.test(m)));
    });

    test('plusieurs boucliers maniés', () => {
        const w = armorWarnings([shield, { ...shield }], ALL, 10);
        assert.ok(w.every(list => list.some(m => /Plusieurs boucliers/.test(m))));
    });

    test('type absent (ancienne sauvegarde) : déduit du nom', () => {
        const legacy = { name: 'Cotte de mailles', ca: '16', str: '13', equipped: true };
        const [w] = armorWarnings([legacy], {}, 10);
        assert.equal(w.length, 2);
    });

    test('bonus et maîtrise : jamais d\'avertissement', () => {
        const ring = { name: 'Anneau de protection', type: 'Bonus', ca: '1', equipped: true };
        const ward = { name: 'Garde', type: 'Maîtrise', equipped: true };
        assert.deepEqual(armorWarnings([ring, { ...ring }, ward], {}, 3), [[], [], []]);
    });

    test('entrées invalides', () => {
        assert.deepEqual(armorWarnings(undefined), []);
        assert.deepEqual(armorWarnings([null], ALL, 10), [[]]);
    });
});
