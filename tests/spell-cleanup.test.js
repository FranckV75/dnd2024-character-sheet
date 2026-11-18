/**
 * TESTS — BOUTON « RETIRER LES SORTS NON PRÉPARÉS » (js/rules/spell-preparation.js :
 * unpreparedCleanup, removeSpellRows)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    unpreparedCleanup, removeSpellRows, grantedSpellKeys, highestSlotLevel, prepareSpellRows, ownRowTexts
} from '../js/rules/spell-preparation.js';
import { findSpellByName, spellToRow } from '../js/rules/spells.js';
import { deriveCharacter } from '../js/rules/character.js';
import { EMPTY_SPELL } from '../js/state/schema.js';
import { SNAPSHOT_REASONS } from '../js/state/snapshots.js';

const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const db = Array.isArray(base) ? base : Object.values(base);
const spell = (name) => {
    const found = findSpellByName(db, name);
    assert.ok(found, name);
    return found;
};
/** Ligne telle que la fiche la remplit depuis la base (note = nom anglais) */
const row = (name, prep = false, extra = {}) => ({ ...spellToRow(spell(name), { ...EMPTY_SPELL }), prep, ...extra });

function deepFreeze(value) {
    if (value && typeof value === 'object') {
        Object.freeze(value);
        for (const inner of Object.values(value)) deepFreeze(inner);
    }
    return value;
}

/** Plan pour un personnage : mêmes arguments que l'interface (js/ui/spells/cleanup.js) */
function planFor(record, rows, skip = []) {
    const character = { ...record, dynamic_spells: rows };
    const d = deriveCharacter(character);
    return unpreparedCleanup(rows, db, {
        classSlug: d.classSlug, maxLevel: highestSlotLevel(d.spellSlots), granted: grantedSpellKeys(character, d), skip
    });
}
const names = (entries) => entries.map(entry => entry.name);
const NOTHING = { remove: [], noted: [] };

const CLERIC_5 = { char_class: 'Clerc', char_subclass: 'Domaine de la Vie', char_level: '5' };

describe('Retirer les sorts non préparés : quelles lignes partent', () => {
    test('Clerc : les sorts non préparés de sa liste, rangés par niveau puis par nom', () => {
        const rows = deepFreeze([
            row('Sanctuaire'), row('Injonction', true), row('Esprits gardiens'), row('Arme spirituelle'), row('Bouclier de la foi')
        ]);
        const plan = planFor(CLERIC_5, rows);
        assert.deepEqual(plan.remove.map(entry => [entry.name, entry.level, entry.index]), [
            ['Bouclier de la foi', 1, 4], ['Sanctuaire', 1, 0], ['Arme spirituelle', 2, 3], ['Esprits gardiens', 3, 2]
        ]);
        assert.deepEqual(plan.noted, []);
        // La ligne lue est rendue telle quelle (elle sert à vérifier que la fiche n'a pas changé)
        assert.equal(plan.remove[1].row, rows[0]);
    });

    test('Druide, Paladin et Rôdeur aussi ; nom anglais reconnu', () => {
        assert.deepEqual(names(planFor({ char_class: 'Druide', char_level: '3' }, [row('Soins')]).remove), ['Soins']);
        assert.deepEqual(names(planFor({ char_class: 'Paladin', char_level: '3' }, [row('Bouclier de la foi')]).remove), ['Bouclier de la foi']);
        assert.deepEqual(names(planFor({ char_class: 'Rôdeur', char_level: '3' }, [row('Soins')]).remove), ['Soins']);
        assert.deepEqual(names(planFor(CLERIC_5, [{ ...row('Sanctuaire'), name: 'SANCTUARY' }]).remove), ['SANCTUARY']);
    });

    test('Jamais proposé au Magicien (son livre), ni aux classes à liste fixe, ni sans classe', () => {
        const rows = [row('Détection de la magie'), row('Soins')];
        for (const record of [
            { char_class: 'Magicien', char_level: '5' }, { char_class: 'Barde', char_level: '5' },
            { char_class: 'Ensorceleur', char_level: '5' }, { char_class: 'Occultiste', char_level: '5' },
            { char_class: 'Guerrier', char_subclass: 'Chevalier occulte', char_level: '5' }, { char_class: '', char_level: '5' }
        ]) {
            assert.deepEqual(planFor(record, rows), NOTHING, record.char_class);
        }
        assert.deepEqual(unpreparedCleanup(rows, db), NOTHING);
        // Classe sans emplacement calculé : rien
        assert.deepEqual(unpreparedCleanup(rows, db, { classSlug: 'cleric', maxLevel: 0 }), NOTHING);
    });

    test('Ne part jamais : sort préparé, sort mineur, sort donné (toujours préparé)', () => {
        const rows = [
            row('Injonction', true), // préparé
            row('Flamme sacrée'), // sort mineur
            row('Lumière'), // sort mineur
            row('Bénédiction'), // Domaine de la Vie : toujours préparé
            { ...row('Soins'), name: 'Cure Wounds' }, // sort de domaine noté en anglais
            { ...row('Sanctuaire'), lvl: '' } // niveau vide (ancienne sauvegarde) : lu comme un sort mineur
        ];
        assert.deepEqual(planFor(CLERIC_5, rows), NOTHING);
        // Le même Clerc sans domaine : Bénédiction et Soins sont des sorts ordinaires
        assert.deepEqual(names(planFor({ char_class: 'Clerc', char_level: '5' }, rows).remove), ['Bénédiction', 'Cure Wounds']);
    });

    test('Ne part jamais : ligne vide, ligne en cours de saisie, valeur abîmée', () => {
        const rows = [{ ...EMPTY_SPELL }, { ...EMPTY_SPELL, lvl: '1', note: 'à compléter' }, row('Sanctuaire'), null, 'texte', row('Bouclier de la foi')];
        assert.deepEqual(names(planFor(CLERIC_5, rows).remove), ['Bouclier de la foi', 'Sanctuaire']);
        // Lignes en cours de saisie (focus, sort tout juste créé)
        assert.deepEqual(names(planFor(CLERIC_5, rows, [2]).remove), ['Bouclier de la foi']);
        assert.deepEqual(planFor(CLERIC_5, rows, [2, 5]), NOTHING);
        assert.deepEqual(unpreparedCleanup(null, db, { classSlug: 'cleric', maxLevel: 3 }), NOTHING);
    });

    test('En cas de doute, la ligne reste : sort inconnu, autre liste, autre niveau, niveau sans emplacement', () => {
        const rows = [
            { ...EMPTY_SPELL, lvl: '1', name: 'Sort maison de la table' }, // inconnu de la base
            row('Boule de feu'), // liste du Magicien (multiclassage, objet)
            row('Marque du chasseur'), // liste du Rôdeur
            { ...row('Sanctuaire'), lvl: '2' }, // niveau changé par le joueur
            row('Retour à la vie') // niveau 3 : pas d'emplacement de ce niveau au niveau 3
        ];
        assert.deepEqual(planFor({ char_class: 'Clerc', char_level: '3' }, rows), NOTHING);
        // Au niveau 5, Retour à la vie est un sort que la fenêtre « Préparer mes sorts » propose
        assert.deepEqual(names(planFor({ char_class: 'Clerc', char_level: '5' }, rows).remove), ['Retour à la vie']);
        // Base de sorts indisponible : rien
        assert.deepEqual(unpreparedCleanup([row('Sanctuaire')], [], { classSlug: 'cleric', maxLevel: 3 }), NOTHING);
        assert.deepEqual(unpreparedCleanup([row('Sanctuaire')], null, { classSlug: 'cleric', maxLevel: 3 }), NOTHING);
    });

    test("Note du joueur : ligne rangée à part ; le nom anglais mis par la fiche n'est pas une note", () => {
        const rows = [
            row('Sanctuaire'), // note « Sanctuary » (mise par la fiche)
            row('Bouclier de la foi', false, { note: 'shield of FAITH' }), // même nom, autre casse
            row('Arme spirituelle', false, { note: '' }), // note vidée
            row('Injonction', false, { note: 'Injonction' }), // nom français recopié
            row('Esprits gardiens', false, { note: 'Super contre les morts-vivants' }),
            row('Retour à la vie', false, { note: '<b>300 po</b> de diamants' })
        ];
        const plan = planFor({ char_class: 'Clerc', char_level: '5' }, rows);
        assert.deepEqual(names(plan.remove), ['Bouclier de la foi', 'Injonction', 'Sanctuaire', 'Arme spirituelle']);
        assert.deepEqual(plan.noted.map(entry => [entry.name, entry.level, entry.note, entry.written]), [
            ['Esprits gardiens', 3, 'Super contre les morts-vivants', ['note « Super contre les morts-vivants »']],
            ['Retour à la vie', 3, '300 po de diamants', ['note « 300 po de diamants »']]
        ]);
    });

    test('Colonne réécrite ou case cochée en plus par le joueur : ligne rangée à part, avec ce qui est écrit', () => {
        const rows = [
            row('Arme spirituelle', false, { range: '18 m - penser à la déplacer (action bonus)' }),
            row('Sanctuaire', false, { time: 'AB - garder pour Lydia !' }),
            row('Bouclier de la foi', false, { school: 'Abjur. (prêtée par Tom)' }),
            row('Soins', false, { c: true, r: true }),
            row('Esprits gardiens', false, { note: 'Contre les morts-vivants', range: 'moi' }),
            // Rien à perdre : même texte à la casse et à la ponctuation près, colonne vidée, case décochée
            row('Injonction', false, { time: 'ACTION', range: ' 18 M. ', school: '' }),
            row('Détection de la magie', false, { c: false, r: false, m: false }),
            // Ancienne ligne v3 : sans école ni cases, cellules avec balises
            { lvl: '1', name: '<b>Bénédiction</b>', time: 'Action', range: '9&nbsp;m', note: '<i>Bless</i>' }
        ];
        const plan = planFor({ char_class: 'Clerc', char_level: '5' }, rows);
        assert.deepEqual(names(plan.remove), ['Bénédiction', 'Détection de la magie', 'Injonction']);
        assert.deepEqual(plan.noted.map(entry => [entry.name, entry.note, entry.written]), [
            ['Bouclier de la foi', '', ['école « Abjur. (prêtée par Tom) »']],
            ['Sanctuaire', '', ["temps d'incantation « AB - garder pour Lydia ! »"]],
            ['Soins', '', ['case C cochée', 'case R cochée']],
            ['Arme spirituelle', '', ['portée « 18 m - penser à la déplacer (action bonus) »']],
            ['Esprits gardiens', 'Contre les morts-vivants', ['note « Contre les morts-vivants »', 'portée « moi »']]
        ]);
        // Une ligne telle que la fiche la remplit : rien d'écrit par le joueur
        const untouched = ownRowTexts(row('Sanctuaire'), spell('Sanctuaire'));
        assert.equal(untouched.length, 0);
        assert.equal(untouched.note, '');
        // Case cochée que la base coche aussi (Détection de la magie est un rituel avec concentration)
        assert.equal(ownRowTexts(row('Détection de la magie', false, { c: true, r: true }), spell('Détection de la magie')).length, 0);
    });

    test('Le sort ajouté par « Préparer mes sorts » puis décoché est de ceux qui partent', () => {
        const { rows } = prepareSpellRows([], spell('Sanctuaire'), db, EMPTY_SPELL);
        const unticked = rows.map(r => ({ ...r, prep: false }));
        assert.deepEqual(planFor(CLERIC_5, rows), NOTHING);
        assert.deepEqual(names(planFor(CLERIC_5, unticked).remove), ['Sanctuaire']);
    });
});

describe('Retirer les sorts non préparés : retrait', () => {
    test('Seules les lignes choisies partent ; les autres gardent leur ordre et leur contenu', () => {
        const rows = deepFreeze([row('Sanctuaire'), row('Injonction', true), row('Flamme sacrée'), row('Bouclier de la foi'), { ...EMPTY_SPELL }]);
        const plan = planFor(CLERIC_5, rows);
        const next = removeSpellRows(rows, plan.remove);
        assert.deepEqual(next, [rows[1], rows[2], rows[4]]);
        assert.equal(next[0], rows[1]);
        assert.equal(rows.length, 5);
        // Rien de choisi : rien ne part
        assert.deepEqual(removeSpellRows(rows, []), rows);
    });

    test("Fiche changée entre-temps : rien n'est retiré", () => {
        const rows = [row('Sanctuaire'), row('Bouclier de la foi')];
        const plan = planFor(CLERIC_5, rows);
        // Sort préparé depuis
        assert.equal(removeSpellRows([{ ...rows[0], prep: true }, rows[1]], plan.remove), null);
        // Note ajoutée depuis
        assert.equal(removeSpellRows([{ ...rows[0], note: 'à garder' }, rows[1]], plan.remove), null);
        // Ligne déplacée, liste raccourcie
        assert.equal(removeSpellRows([rows[1], rows[0]], plan.remove), null);
        assert.equal(removeSpellRows([rows[0]], plan.remove), null);
        assert.equal(removeSpellRows(null, plan.remove), null);
        // Même contenu, autre objet (fiche relue) : c'est bien la même ligne
        assert.deepEqual(removeSpellRows(rows.map(r => ({ ...r })), plan.remove), []);
    });

    test("Une ligne préparée n'est jamais retirée, même demandée", () => {
        const prepared = row('Sanctuaire', true);
        assert.equal(removeSpellRows([prepared], [{ index: 0, row: prepared }]), null);
    });

    test('État gardé avant le retrait : motif affiché dans « Revenir à… »', () => {
        assert.equal(SNAPSHOT_REASONS['spell-cleanup'], 'Avant le retrait des sorts non préparés');
    });
});
