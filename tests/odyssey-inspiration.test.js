/**
 * TESTS — INSPIRATION HÉROÏQUE EN MODE ODYSSÉE (js/rules/odyssey.js, js/ui/odyssey.js)
 * Les points de Foi de l'Odyssée remplacent les « points de héros » du guide du MJ, pas
 * l'Inspiration héroïque : un Humain (Ingénieux) ou un Champion niveau 10+ la note avec un bouton
 * à part sous la case. Clé facultative « odyssey_inspiration » : "1" = allumée ; absente = éteinte.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    ODYSSEY_MODE_KEY, ODYSSEY_INSPIRATION_KEY, ODYSSEY_INSPIRATION_LABEL,
    odysseyInspirationLit, odysseyInspirationSources, odysseyInspirationUseful, odysseyInspirationPatch,
    odysseyInspirationMessage, odysseyInspirationHint, restInspirationSentence
} from '../js/rules/odyssey.js';
import { STATUS_ROOM, STATUS_ROOM_NARROW } from '../js/data/status-bar.js';
import { createDefaultCharacter, OPTIONAL_KEY_DEFAULTS } from '../js/state/schema.js';
import { deriveCharacter } from '../js/rules/character.js';
import { planLongRest } from '../js/rules/rest.js';
import { V4_ONLY_KEYS, withoutV4State, comparableWithV3 } from '../js/cloud/sync.js';
import { isBlankCharacter, sheetFingerprint } from '../js/cloud/controller.js';
import { migrateCharacter, normalizeCharacter } from '../js/state/migrate.js';
import { parseCharacterFile, serializeCharacter } from '../js/state/persistence.js';
import { createStore } from '../js/state/store.js';
import { isPlayField } from '../js/ui/lock.js';
import { ALL_FIXTURES, readFixture } from './helpers/fixtures.js';

const sheet = (extra = {}) => ({ ...createDefaultCharacter(), char_name: 'Test', ...extra });
const OFF = { [ODYSSEY_MODE_KEY]: 'off' };
const LIT = { [ODYSSEY_INSPIRATION_KEY]: '1' };
const useful = (record) => odysseyInspirationUseful(record, deriveCharacter(record));
const champion = (level, extra = {}) => sheet({ char_class: 'Guerrier', char_subclass: 'Champion', char_level: String(level), ...extra });

describe('Inspiration héroïque (mode Odyssée) : quand le bouton sert', () => {
    test('Humain : oui (trait Ingénieux), quelle que soit la classe', () => {
        assert.equal(useful(sheet({ char_species: 'Humain', char_class: 'Clerc', char_level: '4' })), true);
        assert.equal(useful(sheet({ char_species: 'Human' })), true);
        assert.equal(useful(sheet({ char_species: '<b>Humain</b>' })), true);
    });

    test('Champion : à partir du niveau 10 (Héros du champ d\'honneur)', () => {
        assert.equal(useful(champion(10)), true);
        assert.equal(useful(champion(14)), true);
        assert.equal(useful(champion(9)), false);
        // Autre sous-classe du Guerrier, même niveau : non
        assert.equal(useful(sheet({ char_class: 'Guerrier', char_subclass: 'Maître de guerre', char_level: '10' })), false);
    });

    test('Elfe Magicien : non ; allumé, il reste visible (jamais caché allumé)', () => {
        const elf = sheet({ char_species: 'Elfe', char_class: 'Magicien', char_level: '4' });
        assert.equal(useful(elf), false);
        assert.equal(useful({ ...elf, ...LIT }), true);
    });

    test('Mode coupé : jamais (la case elle-même est l\'Inspiration héroïque), même allumé', () => {
        assert.equal(useful(sheet({ ...OFF, char_species: 'Humain' })), false);
        assert.equal(useful(champion(10, OFF)), false);
        assert.equal(useful(sheet({ ...OFF, ...LIT })), false);
    });

    test('Sources dites dans l\'infobulle', () => {
        const human = sheet({ char_species: 'Humain' });
        assert.deepEqual(odysseyInspirationSources(human, deriveCharacter(human)).length, 1);
        assert.match(odysseyInspirationHint(human, deriveCharacter(human)), /Humain \(Ingénieux\)/);
        const both = champion(10, { char_species: 'Humain' });
        assert.equal(odysseyInspirationSources(both, deriveCharacter(both)).length, 2);
        assert.match(odysseyInspirationHint(both, deriveCharacter(both)), /Champion \(Héros du champ d'honneur\)/);
        // Règle du manuel 2024 : on relance un dé, on ne gagne pas l'avantage
        assert.match(odysseyInspirationHint(human, deriveCharacter(human)), /relancer un dé/);
        assert.doesNotMatch(odysseyInspirationHint(human, deriveCharacter(human)), /avantage/i);
    });
});

describe('Inspiration héroïque (mode Odyssée) : valeur enregistrée', () => {
    test('Lecture : "1" allumée ; absente, vide ou autre chose : éteinte', () => {
        assert.equal(odysseyInspirationLit(sheet(LIT)), true);
        assert.equal(odysseyInspirationLit(sheet({ [ODYSSEY_INSPIRATION_KEY]: ' 1 ' })), true);
        assert.equal(odysseyInspirationLit(sheet()), false);
        assert.equal(odysseyInspirationLit(sheet({ [ODYSSEY_INSPIRATION_KEY]: '' })), false);
        assert.equal(odysseyInspirationLit(sheet({ [ODYSSEY_INSPIRATION_KEY]: '0' })), false);
        assert.equal(odysseyInspirationLit({}), false);
        assert.equal(odysseyInspirationLit(null), false);
    });

    test('Valeur par défaut déclarée dans schema.js, mais jamais dans la fiche vierge', () => {
        assert.equal(OPTIONAL_KEY_DEFAULTS[ODYSSEY_INSPIRATION_KEY], '');
        assert.ok(!(ODYSSEY_INSPIRATION_KEY in createDefaultCharacter()));
        assert.ok(!(ODYSSEY_INSPIRATION_KEY in migrateCharacter({ char_name: 'Korgul' }).character));
    });

    test('Allumer écrit "1" ; éteindre retire la clé (la fiche redevient celle d\'avant)', () => {
        assert.deepEqual(odysseyInspirationPatch(true), { [ODYSSEY_INSPIRATION_KEY]: '1' });
        const store = createStore(sheet({ char_species: 'Humain' }));
        const before = sheetFingerprint(store.get());
        const saved = serializeCharacter(store.get());
        store.update(odysseyInspirationPatch(true));
        assert.equal(odysseyInspirationLit(store.get()), true);
        assert.notEqual(sheetFingerprint(store.get()), before);
        store.update(odysseyInspirationPatch(false));
        assert.equal(odysseyInspirationLit(store.get()), false);
        assert.equal(sheetFingerprint(store.get()), before);
        assert.equal(serializeCharacter(store.get()), saved);
    });

    test('Clé propre à la v4 : ignorée de la comparaison avec l\'ancien site, gardée par la lecture', () => {
        assert.ok(V4_ONLY_KEYS.includes(ODYSSEY_INSPIRATION_KEY));
        assert.ok(!(ODYSSEY_INSPIRATION_KEY in withoutV4State(sheet(LIT))));
        assert.deepEqual(comparableWithV3(normalizeCharacter(sheet(LIT))), comparableWithV3(normalizeCharacter(sheet())));
        assert.equal(migrateCharacter(sheet(LIT)).character[ODYSSEY_INSPIRATION_KEY], '1');
        assert.deepEqual(migrateCharacter(sheet(LIT)).report, []);
        const back = parseCharacterFile(serializeCharacter(migrateCharacter(sheet(LIT)).character)).character;
        assert.equal(odysseyInspirationLit(back), true);
    });

    test('Fiche vierge : le bouton seul ne la rend pas « à garder » (comme le mode Odyssée)', () => {
        assert.equal(isBlankCharacter({ ...createDefaultCharacter(), ...LIT }), true);
    });

    test('Champ de jeu : utilisable fiche verrouillée', () => {
        assert.equal(isPlayField(ODYSSEY_INSPIRATION_KEY), true);
    });

    for (const [name, url] of ALL_FIXTURES) {
        test(`${name} : sans la clé, rien ne change (lecture, empreinte, bouton éteint)`, () => {
            const { character } = migrateCharacter(readFixture(url));
            assert.ok(!(ODYSSEY_INSPIRATION_KEY in character));
            assert.equal(odysseyInspirationLit(character), false);
            const before = sheetFingerprint(character);
            const store = createStore(character);
            odysseyInspirationUseful(store.get(), deriveCharacter(store.get()));
            assert.deepEqual(store.get(), character);
            assert.equal(sheetFingerprint(store.get()), before);
        });
    }
});

describe('Inspiration héroïque (mode Odyssée) : phrases', () => {
    test('Barre du haut : une ligne sur tablette, dit quoi faire', () => {
        for (const lit of [true, false]) {
            const message = odysseyInspirationMessage(lit);
            assert.ok(message.length <= STATUS_ROOM, `${message.length} : ${message}`);
            assert.ok(message.startsWith(ODYSSEY_INSPIRATION_LABEL), message);
        }
        for (const lit of [true, false]) {
            const narrow = odysseyInspirationMessage(lit, STATUS_ROOM_NARROW);
            assert.ok(narrow.length <= STATUS_ROOM_NARROW, `${narrow.length} : ${narrow}`);
        }
        assert.match(odysseyInspirationMessage(true), /relancer un dé/);
        assert.match(odysseyInspirationMessage(false), /éteint/);
    });

    test('Repos long d\'un Humain : mode actif, la phrase dit où la noter ; mode coupé, inchangée', () => {
        assert.equal(restInspirationSentence(sheet()), 'Humain (Ingénieux) : vous gagnez l’Inspiration héroïque (bouton sous les Points de Foi).');
        assert.equal(restInspirationSentence(sheet(OFF)), 'Humain (Ingénieux) : vous gagnez l’Inspiration héroïque.');
    });

    test('Repos long : rien n\'est allumé tout seul (ni la case, ni le bouton)', () => {
        const human = sheet({ char_species: 'Humain', hp_max: '20', hp_current: '10' });
        const plan = planLongRest(human);
        assert.equal(plan.summary.heroicInspiration, true);
        assert.ok(!(ODYSSEY_INSPIRATION_KEY in plan.patch));
        assert.ok(!('heroic_inspiration' in plan.patch));
    });
});

describe('Inspiration héroïque (mode Odyssée) : interface', () => {
    const ui = readFileSync(new URL('../js/ui/odyssey.js', import.meta.url), 'utf8');
    const print = readFileSync(new URL('../css/print.css', import.meta.url), 'utf8');

    test('Bouton bascule (aria-pressed) qui explique ce qu\'il fait (barre du haut et infobulle)', () => {
        assert.match(ui, /'aria-pressed': 'false'/);
        // Tablette : une ligne ; ordinateur : la colonne étroite des messages (statusRoom, tests/odyssey.test.js)
        assert.match(ui, /odysseyInspirationMessage\(lit, statusRoom\(compact\.matches\)\)/);
        assert.match(ui, /toggle\.title = hint/);
    });

    test('Imprimé seulement allumé', () => {
        assert.match(print, /\.faith-inspiration\[aria-pressed="false"\] \{\s*display: none;/);
    });
});
