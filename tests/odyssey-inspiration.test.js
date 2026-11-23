/**
 * TESTS — PIÈCE « INSPIRATION HÉROÏQUE » (js/rules/odyssey.js, js/ui/odyssey.js)
 * Les points de Foi de l'Odyssée remplacent les « points de héros » du guide du MJ, pas
 * l'Inspiration héroïque : en mode Odyssée, chaque personnage la note avec une pièce à part sous
 * la case (clé facultative « odyssey_inspiration » : "1" = disponible ; absente = non disponible).
 * Mode coupé, la pièce remplace la case heroic_inspiration (0 ou 1), sans boutons − / +.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    ODYSSEY_MODE_KEY, ODYSSEY_INSPIRATION_KEY, ODYSSEY_INSPIRATION_LABEL,
    odysseyInspirationLit, odysseyInspirationSources, odysseyInspirationPatch, INSPIRATION_STATES,
    inspirationCoin, inspirationCoinPatch, odysseyInspirationMessage, odysseyInspirationHint, restInspirationSentence
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
const champion = (level, extra = {}) => sheet({ char_class: 'Guerrier', char_subclass: 'Champion', char_level: String(level), ...extra });

describe('Pièce « Inspiration héroïque » : où elle est, ce qu\'elle montre', () => {
    test('Mode Odyssée : sous les points de Foi pour TOUS les personnages (choix de Franck, 23/11/2026)', () => {
        for (const record of [sheet(), sheet({ char_species: 'Elfe', char_class: 'Magicien', char_level: '4' }), sheet({ char_species: 'Humain' }), champion(10)]) {
            assert.deepEqual(inspirationCoin(record), { place: 'faith', lit: false, readable: true });
            assert.deepEqual(inspirationCoin({ ...record, ...LIT }), { place: 'faith', lit: true, readable: true });
        }
        // Les points de Foi n'allument pas la pièce : ce sont deux choses à part
        assert.equal(inspirationCoin(sheet({ heroic_inspiration: '3/4' })).lit, false);
    });

    test('Mode coupé : la pièce remplace la case (0 ou 1) ; une vieille valeur « 3 » compte comme disponible', () => {
        assert.deepEqual(inspirationCoin(sheet({ ...OFF, heroic_inspiration: '' })), { place: 'alone', lit: false, readable: true });
        assert.deepEqual(inspirationCoin(sheet({ ...OFF, heroic_inspiration: '0' })), { place: 'alone', lit: false, readable: true });
        assert.deepEqual(inspirationCoin(sheet({ ...OFF, heroic_inspiration: '1' })), { place: 'alone', lit: true, readable: true });
        assert.deepEqual(inspirationCoin(sheet({ ...OFF, heroic_inspiration: 1 })), { place: 'alone', lit: true, readable: true });
        assert.equal(inspirationCoin(sheet({ ...OFF, heroic_inspiration: '3' })).lit, true);
        assert.equal(inspirationCoin(sheet({ ...OFF, heroic_inspiration: '1/1' })).lit, true);
        // La clé du mode Odyssée ne compte pas en mode coupé
        assert.equal(inspirationCoin(sheet({ ...OFF, ...LIT, heroic_inspiration: '0' })).lit, false);
    });

    test('Mode coupé, texte saisi à la main : pas de pièce, la case reste à corriger, jamais réécrite', () => {
        for (const value of ['1 (béni)', 'oui', '-1', 'abc']) {
            const record = sheet({ ...OFF, heroic_inspiration: value });
            assert.equal(inspirationCoin(record).readable, false, value);
            assert.deepEqual(inspirationCoinPatch(record, true), {}, value);
            assert.deepEqual(inspirationCoinPatch(record, false), {}, value);
        }
    });

    test('Toucher la pièce : la bonne clé dans chaque mode', () => {
        assert.deepEqual(inspirationCoinPatch(sheet(), true), { [ODYSSEY_INSPIRATION_KEY]: '1' });
        assert.deepEqual(inspirationCoinPatch(sheet(LIT), false), { [ODYSSEY_INSPIRATION_KEY]: undefined });
        assert.deepEqual(inspirationCoinPatch(sheet(OFF), true), { heroic_inspiration: '1' });
        assert.deepEqual(inspirationCoinPatch(sheet({ ...OFF, heroic_inspiration: '3' }), false), { heroic_inspiration: '0' });
        // Mode actif, les points de Foi ne sont jamais touchés par la pièce
        assert.ok(!('heroic_inspiration' in inspirationCoinPatch(sheet({ heroic_inspiration: '3/4' }), true)));
    });

    test('Mots sous la pièce : « Disponible » / « Non disponible » (ni oui / non)', () => {
        assert.deepEqual(INSPIRATION_STATES, { lit: 'Disponible', unlit: 'Non disponible' });
    });

    test('Mode coupé, aller-retour : la case revient à ce qu\'elle était (empreinte)', () => {
        const store = createStore(sheet({ ...OFF, heroic_inspiration: '0' }));
        const before = sheetFingerprint(store.get());
        store.update(inspirationCoinPatch(store.get(), true));
        assert.equal(store.get().heroic_inspiration, '1');
        store.update(inspirationCoinPatch(store.get(), false));
        assert.equal(sheetFingerprint(store.get()), before);
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
        assert.equal(odysseyInspirationLit(sheet({ [ODYSSEY_INSPIRATION_KEY]: 1 })), true);
    });

    test('Fiche fabriquée (valeur d\'un type inattendu) : lue sans erreur, bouton éteint, valeur gardée', () => {
        const WEIRD = [true, {}, [], ['1'], { toString: 1 }, { toString: 1, valueOf: 1 }, [{ toString: 1 }], -3.5];
        for (const value of WEIRD) {
            const label = JSON.stringify(value);
            const { character } = migrateCharacter(sheet({ char_species: 'Humain', [ODYSSEY_INSPIRATION_KEY]: value }));
            const derived = deriveCharacter(character);
            assert.equal(odysseyInspirationLit(character), false, label);
            assert.doesNotThrow(() => inspirationCoin(character), label);
            assert.doesNotThrow(() => odysseyInspirationHint(character, derived), label);
            assert.doesNotThrow(() => sheetFingerprint(character), label);
        }
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
            inspirationCoin(store.get());
            odysseyInspirationHint(store.get(), deriveCharacter(store.get()));
            assert.deepEqual(store.get(), character);
            assert.equal(sheetFingerprint(store.get()), before);
        });
    }
});

describe('Pièce « Inspiration héroïque » : phrases', () => {
    test('Infobulle : dit comment lire la pièce, dans les deux modes', () => {
        for (const record of [sheet(), sheet(OFF)]) {
            const hint = odysseyInspirationHint(record, deriveCharacter(record));
            assert.match(hint, /dorée, elle est disponible ; vide, non disponible/);
            assert.match(hint, /relancer un dé/);
        }
        assert.match(odysseyInspirationHint(sheet(), deriveCharacter(sheet())), /à part des points de Foi/);
        assert.doesNotMatch(odysseyInspirationHint(sheet(OFF), deriveCharacter(sheet(OFF))), /points de Foi/);
    });

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
        assert.match(odysseyInspirationMessage(false), /non disponible/);
        assert.match(odysseyInspirationMessage(true), /pièce/);
    });

    test('Repos long d\'un Humain : mode actif, la phrase dit où la noter ; mode coupé, inchangée', () => {
        assert.equal(restInspirationSentence(sheet()), 'Humain (Ingénieux) : vous gagnez l’Inspiration héroïque (pièce sous les Points de Foi).');
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

describe('Pièce « Inspiration héroïque » : interface', () => {
    const ui = readFileSync(new URL('../js/ui/odyssey.js', import.meta.url), 'utf8');
    const print = readFileSync(new URL('../css/print.css', import.meta.url), 'utf8');

    test('Bouton bascule (aria-pressed) qui explique ce qu\'il fait (barre du haut et infobulle)', () => {
        assert.match(ui, /'aria-pressed': 'false'/);
        // Tablette : une ligne ; ordinateur : la colonne étroite des messages (statusRoom, tests/odyssey.test.js)
        assert.match(ui, /odysseyInspirationMessage\(lit, statusRoom\(compact\.matches\)\)/);
        assert.match(ui, /button\.title = hint/);
    });

    test('Petits boutons − / + autour du titre (Points de Foi, renommée) ; cachés en mode coupé', () => {
        const counters = readFileSync(new URL('../js/ui/counters.js', import.meta.url), 'utf8');
        const stepperCss = readFileSync(new URL('../css/stepper.css', import.meta.url), 'utf8');
        const feats = readFileSync(new URL('../css/feats.css', import.meta.url), 'utf8');
        assert.match(counters, /key: 'heroic_inspiration'[^\n]*aroundLabel: true/);
        assert.match(counters, /key: 'glory_score'[^\n]*aroundLabel: true/);
        assert.doesNotMatch(counters, /key: 'fatigue_level'[^\n]*aroundLabel/);
        // .btn-icon et .inspiration-coin imposent leur display : l'attribut hidden seul ne suffit pas
        assert.match(stepperCss, /\.label-steps > \.step-btn\[hidden\] \{\s*display: none;/);
        assert.match(feats, /\.inspiration-coin\[hidden\] \{\s*display: none;/);
        assert.match(ui, /step\.hidden = alone/);
        assert.match(ui, /input\.hidden = alone && coin\.readable/);
    });

    test('Imprimée comme à l\'écran, sans fond ni halo', () => {
        assert.doesNotMatch(print, /inspiration-coin[^{]*\{\s*display: none/);
        // Plus fort que le halo de la pièce disponible (css/feats.css)
        assert.match(print, /\.inspiration-coin\[aria-pressed\] \.inspiration-face \{\s*box-shadow: none;/);
    });
});
