/**
 * TESTS — LISTE DES ARMURES À PARCOURIR (js/rules/armor-picker.js, bouton ▾ du tableau des armures)
 * Groupes de la table « Armures » du Manuel des joueurs 2024 (photo du ch. 6, p. 219).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { ARMOR_PICKER_GROUPS, armorPickerGroup, armorPickerGroups } from '../js/rules/armor-picker.js';

const names = (groups, id) => groups.find((group) => group.id === id)?.items.map((item) => item.armor.name) ?? [];
const all = armorPickerGroups(EQUIPMENT_DATA.armors);

describe('Liste des armures : groupes du manuel', () => {
    test('Titres et ordre de la table des armures (manuel français)', () => {
        assert.deepEqual(ARMOR_PICKER_GROUPS.map((group) => group.title),
            ['Armures légères', 'Armures intermédiaires', 'Armures lourdes', 'Boucliers']);
        assert.deepEqual(all.map((group) => group.id), ['light', 'medium', 'heavy', 'shield']);
    });

    test('Les armures de la table, dans son ordre, une seule fois', () => {
        assert.deepEqual(names(all, 'light'), ['Armure matelassée', 'Armure de cuir', 'Armure de cuir clouté']);
        assert.deepEqual(names(all, 'medium'), ['Armure de peaux', 'Chemise de mailles', "Armure d'écailles", 'Cuirasse', 'Demi-plate']);
        assert.deepEqual(names(all, 'heavy'), ['Broigne', 'Cotte de mailles', 'Clibanion', 'Harnois']);
        assert.deepEqual(names(all, 'shield'), ['Bouclier']);
        const listed = all.flatMap((group) => group.items);
        assert.equal(listed.length, EQUIPMENT_DATA.armors.length);
        for (const armor of EQUIPMENT_DATA.armors) assert.notEqual(armorPickerGroup(armor), null, armor.name);
    });

    test('Valeurs de la table du manuel (CA, Force, Discrétion, poids, prix)', () => {
        const row = (name) => EQUIPMENT_DATA.armors.find((armor) => armor.name === name);
        assert.deepEqual(row('Armure matelassée'), { name: 'Armure matelassée', type: 'Légère', ca: '11 + Dex', str: '-', stealth: true, weight: '4 kg', price: '5 po' });
        assert.deepEqual([row('Cotte de mailles').str, row('Clibanion').str, row('Harnois').str], ['13', '15', '15']);
        assert.equal(row('Demi-plate').ca, '15 + Dex (max 2)');
        assert.equal(row('Bouclier').ca, '+2');
        assert.equal(row('Cuirasse').stealth, false);
    });

    test('Type inconnu : hors de la liste, sans erreur', () => {
        assert.equal(armorPickerGroup({ name: 'Anneau', type: 'Bonus' }), null);
        assert.equal(armorPickerGroup(null), null);
        assert.deepEqual(armorPickerGroups(null), []);
        assert.deepEqual(armorPickerGroups([{ name: 'Cape', type: 'Bonus' }]), []);
    });
});

describe('Liste des armures : saisie et armures déjà notées', () => {
    test('La saisie resserre la liste, sans accents ni majuscules ; groupes vides retirés', () => {
        const groups = armorPickerGroups(EQUIPMENT_DATA.armors, { query: 'MAILLES' });
        assert.deepEqual(groups.map((group) => group.id), ['medium', 'heavy']);
        assert.deepEqual(names(armorPickerGroups(EQUIPMENT_DATA.armors, { query: 'ecaill' }), 'medium'), ["Armure d'écailles"]);
        assert.deepEqual(armorPickerGroups(EQUIPMENT_DATA.armors, { query: 'zzz' }), []);
    });

    test('Armure déjà dans le tableau : marquée, toujours choisissable', () => {
        const groups = armorPickerGroups(EQUIPMENT_DATA.armors, { rows: [{ name: ' cotte de mailles ' }, { name: '<b>Bouclier</b>' }, { name: '' }] });
        const item = (id, name) => groups.find((group) => group.id === id).items.find((entry) => entry.armor.name === name);
        assert.equal(item('heavy', 'Cotte de mailles').noted, true);
        assert.equal(item('shield', 'Bouclier').noted, true);
        assert.equal(item('heavy', 'Harnois').noted, false);
        assert.ok(!('disabled' in item('heavy', 'Cotte de mailles')));
    });

    test('Lignes de forme inattendue (fiche fabriquée) : lues sans erreur', () => {
        assert.doesNotThrow(() => armorPickerGroups(EQUIPMENT_DATA.armors, { rows: [null, 3, {}, { name: 12 }] }));
        assert.doesNotThrow(() => armorPickerGroups(EQUIPMENT_DATA.armors, { rows: 'abc' }));
    });
});

describe('Liste des armures : interface (js/ui/armors.js)', () => {
    const ui = readFileSync(new URL('../js/ui/armors.js', import.meta.url), 'utf8');

    test('Bouton ▾ : liste sans clavier, expliqué (infobulle, barre du haut), caché fiche verrouillée ou nom rempli', () => {
        assert.match(ui, /browse: \{ enabled: \(\) => !isLocked\(\), trigger: controls\.pick/);
        assert.match(ui, /title: PICK_TITLE/);
        assert.match(ui, /setStatus\(PICK_HELP\)/);
        assert.match(ui, /controls\.pick\.hidden = locked \|\| textOf\(row\.name\)\.trim\(\) !== ''/);
    });

    test('CA affichée pour chaque armure ; ✓ sans griser ; saisie libre toujours possible', () => {
        assert.match(ui, /detail: `CA \$\{item\.armor\.ca\}`/);
        assert.match(ui, /mark: item\.noted \? '✓' : ''/);
        assert.doesNotMatch(ui, /disabled: item\.noted/);
        // Le nom reste une case de texte libre (anneau, cape, sort…)
        assert.match(ui, /name: \{ aria: 'Nom de l\\'armure' \}/);
    });
});
