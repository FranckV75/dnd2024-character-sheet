/**
 * TESTS — LISTE DES ARMES À PARCOURIR (js/rules/weapon-picker.js, bouton ▾ du tableau des armes)
 * Groupes de la table des armes du Manuel des joueurs 2024 (photo du ch. 6, p. 215).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DD_RULES } from '../js/data/dd-rules.js';
import { WEAPON_PICKER_GROUPS, weaponPickerGroup, weaponPickerGroups } from '../js/rules/weapon-picker.js';
import { proposedWeapons, ODYSSEY_MODE_KEY } from '../js/rules/odyssey.js';

const names = (groups, id) => groups.find((group) => group.id === id)?.items.map((item) => item.weapon.name) ?? [];
const all = weaponPickerGroups(DD_RULES.weapons);

describe('Liste des armes : groupes du manuel', () => {
    test('Titres et ordre de la table des armes (manuel français)', () => {
        assert.deepEqual(WEAPON_PICKER_GROUPS.map((group) => group.title), [
            'Armes courantes de corps à corps', 'Armes courantes à distance',
            'Armes de guerre de corps à corps', 'Armes de guerre à distance', 'Sans arme'
        ]);
        assert.deepEqual(all.map((group) => group.id), WEAPON_PICKER_GROUPS.map((group) => group.id));
    });

    test('Toutes les armes du catalogue sont dans un groupe, une seule fois', () => {
        const listed = all.flatMap((group) => group.items.map((item) => item.weapon.name));
        assert.equal(listed.length, DD_RULES.weapons.length);
        assert.equal(new Set(listed).size, listed.length);
        for (const weapon of DD_RULES.weapons) assert.notEqual(weaponPickerGroup(weapon), null, weapon.name);
    });

    test('Effectifs du manuel : 10, 4, 18 et 6 armes (7 avec le Chakram de l\'Odyssée), puis l\'Attaque à mains nues', () => {
        assert.deepEqual(all.map((group) => group.items.length), [10, 4, 18, 7, 1]);
    });

    test('Armes qu\'on peut lancer : au corps à corps, comme dans le manuel ; la Fléchette à distance', () => {
        for (const name of ['Dague', 'Hachette', 'Javeline', 'Lance', 'Marteau léger']) assert.ok(names(all, 'simple-melee').includes(name), name);
        assert.ok(names(all, 'martial-melee').includes('Trident'));
        assert.deepEqual(names(all, 'simple-ranged'), ['Arbalète légère', 'Arc court', 'Fléchette', 'Fronde']);
        assert.deepEqual([...names(all, 'martial-ranged')].sort(),
            ['Arbalète de poing', 'Arbalète lourde', 'Arc long', 'Chakram', 'Mousquet', 'Pistolet', 'Sarbacane']);
        assert.deepEqual(names(all, 'unarmed'), ['Attaque à mains nues']);
    });

    test('Catégorie inconnue : hors de la liste, sans erreur', () => {
        assert.equal(weaponPickerGroup({ name: 'Arme bizarre', category: 'Exotique' }), null);
        assert.equal(weaponPickerGroup(null), null);
        assert.deepEqual(weaponPickerGroups(null), []);
        assert.deepEqual(weaponPickerGroups([{ name: 'X', category: 'Exotique' }]), []);
    });
});

describe('Liste des armes : saisie et armes déjà notées', () => {
    test('La saisie resserre la liste, sans accents ni majuscules ; groupes vides retirés', () => {
        const groups = weaponPickerGroups(DD_RULES.weapons, { query: 'EPEE' });
        assert.deepEqual(groups.map((group) => group.id), ['martial-melee']);
        assert.deepEqual(names(groups, 'martial-melee'), ['Épée à deux mains', 'Épée courte', 'Épée longue']);
        assert.deepEqual(weaponPickerGroups(DD_RULES.weapons, { query: 'arbal' }).map((group) => group.id), ['simple-ranged', 'martial-ranged']);
        assert.deepEqual(weaponPickerGroups(DD_RULES.weapons, { query: 'zzz' }), []);
    });

    test('Arme déjà dans le tableau : marquée, toujours choisissable (deux dagues)', () => {
        const groups = weaponPickerGroups(DD_RULES.weapons, { rows: [{ name: ' dague ' }, { name: '<b>Arc long</b>' }, { name: '' }] });
        const item = (id, name) => groups.find((group) => group.id === id).items.find((entry) => entry.weapon.name === name);
        assert.equal(item('simple-melee', 'Dague').noted, true);
        assert.equal(item('martial-ranged', 'Arc long').noted, true);
        assert.equal(item('simple-melee', 'Gourdin').noted, false);
        assert.ok(!('disabled' in item('simple-melee', 'Dague')));
    });

    test('Ancien nom « Frappe à mains nues » : l\'Attaque à mains nues est marquée', () => {
        const groups = weaponPickerGroups(DD_RULES.weapons, { rows: [{ name: 'Frappe à mains nues' }] });
        assert.equal(groups.find((group) => group.id === 'unarmed').items[0].noted, true);
    });

    test('Lignes de forme inattendue (fiche fabriquée) : lues sans erreur', () => {
        assert.doesNotThrow(() => weaponPickerGroups(DD_RULES.weapons, { rows: [null, 3, {}, { name: 12 }] }));
        assert.doesNotThrow(() => weaponPickerGroups(DD_RULES.weapons, { rows: 'abc' }));
    });
});

describe('Liste des armes : le Chakram et le mode Odyssée (proposedWeapons, js/rules/odyssey.js)', () => {
    const OFF = { [ODYSSEY_MODE_KEY]: 'off' };
    const listed = (record) => weaponPickerGroups(proposedWeapons(record)).flatMap((group) => group.items.map((item) => item.weapon.name));

    test('Mode actif (clé absente) : le Chakram est proposé, parmi les armes de guerre à distance', () => {
        assert.deepEqual(proposedWeapons({}), DD_RULES.weapons);
        assert.deepEqual(proposedWeapons({ dynamic_weapons: [] }).map((w) => w.name), DD_RULES.weapons.map((w) => w.name));
        assert.equal(weaponPickerGroup(DD_RULES.weapons.find((w) => w.name === 'Chakram')), 'martial-ranged');
        assert.deepEqual(names(weaponPickerGroups(proposedWeapons({}), { query: 'chak' }), 'martial-ranged'), ['Chakram']);
    });

    test('Mode coupé : le Chakram n\'est plus proposé ; toutes les armes du manuel le restent', () => {
        assert.ok(!listed(OFF).includes('Chakram'));
        assert.equal(listed(OFF).length, DD_RULES.weapons.length - 1);
        assert.deepEqual(weaponPickerGroups(proposedWeapons(OFF), { query: 'chakram' }), []);
    });

    test('Mode coupé, Chakram déjà noté (nom retouché, pluriel, HTML hérité) : il reste proposé, marqué ✓', () => {
        for (const name of ['Chakram', 'chakrams', '<b>Chakram +1</b>', 'Chakram de Penthésilée']) {
            const record = { ...OFF, dynamic_weapons: [{ name: 'Dague' }, { name }] };
            assert.ok(listed(record).includes('Chakram'), name);
        }
        const record = { ...OFF, dynamic_weapons: [{ name: 'Chakram' }] };
        const item = weaponPickerGroups(proposedWeapons(record), { rows: record.dynamic_weapons })
            .find((group) => group.id === 'martial-ranged').items.find((entry) => entry.weapon.name === 'Chakram');
        assert.equal(item.noted, true);
        // Une autre arme dont le nom contient le mot ne suffit pas ; lignes de forme inattendue lues sans erreur
        assert.ok(!listed({ ...OFF, dynamic_weapons: [{ name: 'Lame-chakram' }, null, 'abc'] }).includes('Chakram'));
        assert.ok(!listed({ ...OFF, dynamic_weapons: 'abc' }).includes('Chakram'));
    });
});

describe('Liste des armes : interface (js/ui/weapons/rows.js)', () => {
    const rows = readFileSync(new URL('../js/ui/weapons/rows.js', import.meta.url), 'utf8');

    test('Bouton ▾ : liste sans clavier, expliqué (infobulle, barre du haut), caché fiche verrouillée ou nom rempli', () => {
        assert.match(rows, /browse: \{ enabled: \(\) => !isLocked\(\), trigger: pick/);
        assert.match(rows, /title: PICK_TITLE/);
        assert.match(rows, /ctx\.setStatus\(PICK_HELP\)/);
        assert.match(rows, /row\.pick\.hidden = locked \|\| name !== ''/);
    });

    test('Liste et saisie du nom : armes proposées selon le mode Odyssée', () => {
        assert.match(rows, /weaponPickerGroups\(proposedWeapons\(ctx\.store\.get\(\)\), \{ query, rows \}\)/);
        assert.match(rows, /return proposedWeapons\(ctx\.store\.get\(\)\)\s+\.filter/);
        assert.doesNotMatch(rows, /DD_RULES\.weapons/);
    });

    test('Dégâts affichés pour chaque arme ; ✓ sans griser', () => {
        assert.match(rows, /detail: item\.weapon\.dmg/);
        assert.match(rows, /mark: item\.noted \? '✓' : ''/);
        assert.doesNotMatch(rows, /disabled: item\.noted/);
    });
});
