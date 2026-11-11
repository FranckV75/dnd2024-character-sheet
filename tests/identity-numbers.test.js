/**
 * Outils communs (lot D, rangement du code) : une seule reconnaissance du nom de classe
 * (js/rules/identity.js), un seul signed() et un seul rollDie() (js/rules/numbers.js).
 * Les anciennes copies sont reproduites ici pour vérifier que le résultat ne change pas.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classSlug } from '../js/rules/identity.js';
import { classSlug as classSlugFromCharacter, spellSlotsFor } from '../js/rules/character.js';
import { classOf } from '../js/rules/feats.js';
import { signed, rollDie } from '../js/rules/numbers.js';
import { rollDie as rollDieWildMagic } from '../js/rules/wild-magic.js';
import { signed as signedUi } from '../js/ui/dom.js';
import { DD_RULES } from '../js/data/dd-rules.js';

/** Ancienne recherche de getSpellSlots (dd-rules.js, avant le lot D) */
function oldSlotSlug(className) {
    const cleanName = className.toLowerCase().trim();
    for (const [key, cls] of Object.entries(DD_RULES.classes)) {
        if (key === cleanName || DD_RULES.namesOf(cls).some((name) => name.toLowerCase() === cleanName)) return key;
    }
    return null;
}

const CLASS_INPUTS = [
    ...Object.keys(DD_RULES.classes),
    ...Object.values(DD_RULES.classes).flatMap(c => DD_RULES.namesOf(c)),
    ...Object.values(DD_RULES.classes).flatMap(c => DD_RULES.namesOf(c).map(n => `  ${n.toUpperCase()} `)),
    'Sorcier', 'Inconnue', 'Guerrier ', ' ', 'Champion'
];

describe('Reconnaissance de la classe : une seule fonction', () => {
    test('character.js réexporte la fonction de identity.js', () => {
        assert.equal(classSlugFromCharacter, classSlug);
    });

    test('classOf (feats.js) = classSlug du texte nettoyé, HTML des anciennes sauvegardes compris', () => {
        for (const input of CLASS_INPUTS) assert.equal(classOf({ char_class: input }), classSlug(input.trim()), input);
        assert.equal(classOf({ char_class: '<b>Guerrier</b>' }), 'fighter');
        assert.equal(classOf({ char_class: 'Barde&nbsp;' }), 'bard');
        assert.equal(classOf({}), '');
        assert.equal(classOf(null), '');
    });

    test('noms français, anglais, identifiants et anciens noms (Sorcier → Occultiste)', () => {
        assert.equal(classSlug('Barbare'), 'barbarian');
        assert.equal(classSlug('Barbarian'), 'barbarian');
        assert.equal(classSlug('  wizard '), 'wizard');
        assert.equal(classSlug('Sorcier'), 'warlock');
        assert.equal(classSlug('Champion'), '');
        assert.equal(classSlug(''), '');
        assert.equal(classSlug(undefined), '');
    });

    test('emplacements de sorts : même classe reconnue qu\'avant, pour chaque nom et chaque niveau', () => {
        for (const input of CLASS_INPUTS.filter(s => s.trim())) {
            assert.equal(classSlug(input) || null, oldSlotSlug(input), input);
            for (const level of [1, 3, 5, 9, 20]) {
                const slug = oldSlotSlug(input);
                const expected = slug ? spellSlotsFor(slug, level) : {};
                assert.deepEqual(spellSlotsFor(input, level), expected, `${input} ${level}`);
            }
        }
        assert.deepEqual(spellSlotsFor('Guerrier', 3, 'eldritch_knight'), { 1: 2 });
        assert.deepEqual(spellSlotsFor('', 5), {});
        assert.deepEqual(spellSlotsFor('Magicien', 0), {});
        assert.deepEqual(DD_RULES.getSpellSlots('Magicien', 5), {}, 'getSpellSlots reçoit un identifiant');
        assert.deepEqual(DD_RULES.getSpellSlots('constructor', 5), {});
    });
});

describe('signed : un seul format « +3 / -1 »', () => {
    // Anciennes copies (lot D) : toutes donnaient le même texte pour un nombre
    const copies = [
        (n) => `${n >= 0 ? '+' : ''}${n}`,
        (n) => (n >= 0 ? `+${n}` : `${n}`),
        (n) => (n >= 0 ? `+${n}` : String(n))
    ];
    // weapon-masteries.js : identique pour un nombre fini (ses modificateurs le sont toujours)
    const masteries = (n) => `${n >= 0 ? '+' : '-'}${Math.abs(n)}`;
    const values = [-12, -5, -1, -0, 0, 1, 2, 3, 10, 30, 2.5];

    test('même texte que chaque ancienne copie', () => {
        for (const n of values) {
            for (const copy of copies) assert.equal(signed(n), copy(n), String(n));
            assert.equal(signed(n), masteries(n), String(n));
        }
        assert.equal(signed(3), '+3');
        assert.equal(signed(-1), '-1');
        assert.equal(signed(0), '+0');
    });

    test('l\'interface (dom.js) utilise la même fonction', () => {
        assert.equal(signedUi, signed);
    });
});

describe('rollDie : un seul lancer de dé', () => {
    test('wild-magic.js réexporte celui de numbers.js', () => {
        assert.equal(rollDieWildMagic, rollDie);
    });

    test('même résultat que l\'ancien lancer des dés de vie (js/ui/rest.js) pour chaque tirage', () => {
        const old = (faces, r) => Math.floor(r * faces) + 1;
        for (const faces of [6, 8, 10, 12]) {
            for (const r of [0, 0.1, 0.25, 0.5, 0.75, 0.999, 1 - 2 ** -53]) {
                assert.equal(rollDie(faces, () => r), old(faces, r), `d${faces} ${r}`);
            }
        }
    });
});
