/**
 * TESTS — NOMS DU MANUEL DES JOUEURS FRANÇAIS (4.47.0)
 * Les photos du manuel français font foi pour les noms (table des armes p. 215, listes de sorts du
 * Magicien p. 118-120). Une fiche déjà remplie avec l'ancien nom n'est pas réécrite : l'ancien nom
 * reste reconnu (calcul de l'arme, ✓ de la liste, sort retrouvé dans la base).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DD_RULES, RENAMED_WEAPONS } from '../js/data/dd-rules.js';
import { findRulebookWeapon, migrateCharacter } from '../js/state/migrate.js';
import { weaponPickerGroups } from '../js/rules/weapon-picker.js';
import { isPolearm } from '../js/rules/feat-effects.js';
import { findSpellByName, spellDisplayName } from '../js/rules/spells.js';
import { FIXED_FEAT_SPELLS } from '../js/data/feat-spells.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const db = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));

describe('Armes : « Bâton de combat » (et non « Bâton »)', () => {
    test('Nom et propriétés du manuel', () => {
        const names = DD_RULES.weapons.map(w => w.name);
        assert.ok(names.includes('Bâton de combat'));
        assert.ok(!names.includes('Bâton'));
        assert.match(DD_RULES.weapons.find(w => w.name === "Lance d'arçon").prop, /Deux mains \(sauf à cheval\)/);
    });

    test('Chaque ancien nom mène à une arme du catalogue', () => {
        for (const [old, now] of Object.entries(RENAMED_WEAPONS)) {
            assert.ok(DD_RULES.weapons.some(w => w.name.toLowerCase() === now), `${old} → ${now}`);
        }
    });

    test('Une ligne « Bâton » déjà enregistrée : reconnue, rattachée au manuel, jamais renommée', () => {
        assert.equal(findRulebookWeapon('Bâton')?.name, 'Bâton de combat');
        assert.equal(findRulebookWeapon('bâtons')?.name, 'Bâton de combat');
        assert.equal(findRulebookWeapon('Bâton de combat')?.name, 'Bâton de combat');
        // Ancienne sauvegarde sans données de calcul : rattachée, nom gardé
        const { character } = migrateCharacter({ ...createDefaultCharacter(), dynamic_weapons: [{ name: 'Bâton', atk: '+4', dmg: '1d6+2' }] });
        assert.equal(character.dynamic_weapons[0].name, 'Bâton');
        assert.equal(character.dynamic_weapons[0].baseDmg, '1d6 cont.');
        assert.ok(isPolearm({ name: 'Bâton' }));
        assert.ok(isPolearm({ name: 'Bâton de combat' }));
    });

    test('Liste des armes : une ligne « Bâton » met la ✓ sur « Bâton de combat »', () => {
        const items = weaponPickerGroups(DD_RULES.weapons, { rows: [{ name: 'Bâton' }] }).flatMap(g => g.items);
        assert.equal(items.find(i => i.weapon.name === 'Bâton de combat').noted, true);
        assert.equal(items.filter(i => i.noted).length, 1);
    });
});

describe('Sorts : noms du manuel affichés, anciens noms reconnus', () => {
    // [nom du manuel (affiché), ancien nom de la base (AideDD)]
    const RENAMED = [
        ['Main du mage', 'Main de mage'],
        ['Armure du mage', 'Armure de mage'],
        ['Aspersion acide', "Aspersion d'acide"],
        ['Faux amis', 'Amis'],
        ['Verrou magique', 'Verrou arcanique'],
        ['Terreur', 'Peur'],
        ['Présence royale de Yolane', 'Présence royale de Yolande'],
        ['Possession', 'Urne magique'],
        ['Œil du mage', 'Oeil du mage']
    ];

    for (const [book, old] of RENAMED) {
        test(`« ${book} » (ancien nom « ${old} »)`, () => {
            const spell = findSpellByName(db, book);
            assert.ok(spell, book);
            assert.equal(spellDisplayName(spell), book);
            assert.equal(findSpellByName(db, old), spell, old);
        });
    }

    test('Sort donné par un don (Télékinésiste) : nom du manuel', () => {
        assert.equal(FIXED_FEAT_SPELLS.mageHand[1], 'Main du mage');
        assert.ok(findSpellByName(db, FIXED_FEAT_SPELLS.mageHand[1]));
    });
});
