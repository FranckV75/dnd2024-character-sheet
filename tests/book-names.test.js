/**
 * TESTS — NOMS DU MANUEL DES JOUEURS FRANÇAIS (4.47.0)
 * Les photos du manuel français font foi pour les noms (table des armes p. 215, listes de sorts du
 * Magicien p. 118-121, puis des sept autres classes). Une fiche déjà remplie avec l'ancien nom n'est pas réécrite : l'ancien nom
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
import { FEATS_DATA } from '../js/data/feats.js';
import { SUBCLASS_CHOICE_FIELDS } from '../js/data/subclass-choices.js';
import { SUBCLASS_FEATURES } from '../js/data/subclass-features.js';

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
        ['Œil du mage', 'Oeil du mage'],
        // Listes des autres classes (photos du ch. 3, comparées le 23/11/2026)
        ['Hérissement de projectiles', 'Invocation de projectiles'],
        ['Hérissement de projectiles', 'Hérissement'],
        ["Marche sur l'onde", "Marche sur l'eau"]
    ];

    for (const [book, old] of RENAMED) {
        test(`« ${book} » (ancien nom « ${old} »)`, () => {
            const spell = findSpellByName(db, book);
            assert.ok(spell, book);
            assert.equal(spellDisplayName(spell), book);
            assert.equal(findSpellByName(db, old), spell, old);
        });
    }

    test("École de la Sphère résiliente d'Otiluke : Abjuration (listes et description du manuel)", () => {
        assert.equal(findSpellByName(db, "Sphère résiliente d'Otiluke").school, 'Abjuration');
    });

    // Choix de Franck (23/11/2026) : là où le manuel se contredit, Évocation pour les deux
    test("École de la Sphère de feu : Évocation (listes de classe ; errata officiel d'octobre 2026)", () => {
        assert.equal(findSpellByName(db, 'Sphère de feu').school, 'Évocation');
    });

    test("École de l'Aura du croisé : Évocation (description du sort, pas la liste du Paladin)", () => {
        assert.equal(findSpellByName(db, 'Aura du croisé').school, 'Évocation');
    });

    test('Sort donné par un don (Télékinésiste) : nom du manuel', () => {
        assert.equal(FIXED_FEAT_SPELLS.mageHand[1], 'Main du mage');
        assert.ok(findSpellByName(db, FIXED_FEAT_SPELLS.mageHand[1]));
    });
});

// 4.47.1 : dons, espèces, aptitudes et outils relus sur les photos (23/11/2026). Seuls des libellés
// changent : les clés enregistrées (owl, ram, rev_see, rev_worm, comprehension, see…) restent.
describe('Dons et aptitudes : noms du manuel (4.47.1)', () => {
    const labels = (subclass, key) => Object.fromEntries(
        SUBCLASS_CHOICE_FIELDS[subclass].find(f => f.key === key).options);

    test('Dons : « Faveur de Résistance aux énergies », sous-titres et prérequis du manuel', () => {
        assert.equal(FEATS_DATA.faveur_de_resistance_aux_energies.name, 'Faveur de Résistance aux énergies');
        assert.ok(FEATS_DATA.guerisseur.desc.includes('<strong>Soigneur de bataille</strong>'));
        assert.ok(FEATS_DATA.initie_a_la_magie.desc.includes('<strong>Sort du 1er niveau</strong>'));
        assert.ok(FEATS_DATA.mage_de_guerre.desc.includes('<strong>Composante somatique</strong>'));
        assert.ok(FEATS_DATA.trancheur.desc.includes('<strong>Critique renforcé</strong>'));
        assert.ok(Object.values(FEATS_DATA).every(f => !/capacité (Sorts|Style)/.test(f.prereq ?? '')));
        // Dons d'origines : aucun prérequis dans le manuel (décision de Franck du 23/11/2026)
        assert.ok(Object.values(FEATS_DATA).filter(f => f.type === 'Origine').every(f => f.prereq === ''));
    });

    test("Tables présentées comme des aptitudes : nom de l'aptitude du livre, puis la table (décision de Franck)", () => {
        const name = (subclass, id) => SUBCLASS_FEATURES[subclass].find(f => f.id === id).name;
        assert.equal(name('fey_wanderer', 'don_de_la_feerie'), 'Sorts de Vagabond féerique (Présents de Féerie)');
        assert.equal(name('clockwork_sorcery', 'manifestations_de_l_ordre'), "Sorts mécaniques (Manifestations de l'ordre)");
    });

    test('Voie du Cœur sauvage : « Chouette » et « Coup de bélier »', () => {
        assert.equal(labels('path_of_the_wild_heart', 'aspect').owl, 'Chouette');
        assert.equal(labels('path_of_the_wild_heart', 'power').ram, 'Coup de bélier');
    });

    test('Révélation incarnée : « Perception de l\'invisible » et « Déplacement sinueux »', () => {
        assert.equal(labels('aberrant_sorcery', 'rev_see').on, "Perception de l'invisible");
        assert.equal(labels('aberrant_sorcery', 'rev_worm').on, 'Déplacement sinueux');
    });

    test('Troisième œil du Devin : noms des trois bénéfices', () => {
        const eye = labels('diviner', 'eye');
        assert.match(eye.darkvision, /^Vision dans le noir/);
        assert.match(eye.comprehension, /^Compréhension supérieure/);
        assert.equal(eye.see, "Détection de l'invisibilité");
    });

    test('Belluaire : « bête primitive » et « Frappe de la Bête »', () => {
        const companion = SUBCLASS_FEATURES.beast_master.find(f => f.id === 'compagnon_primordial');
        assert.match(companion.text, /bête primitive/);
        assert.match(companion.text, /Frappe de la Bête/);
        assert.ok(!/primordiale|Frappe de bête/.test(JSON.stringify(SUBCLASS_FEATURES.beast_master)));
    });
});
