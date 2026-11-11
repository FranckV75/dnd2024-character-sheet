/**
 * TESTS — FICHIER PIÉGÉ ET MISE EN FORME INDISPONIBLE (audit, lot B : SEC-1, SEC-2)
 * Un texte riche ne garde aucun attribut data-* (il pourrait se faire passer pour un élément de
 * la fiche), et les noms lus dans un attribut (« __proto__ »…) ne désignent jamais une fonction
 * ou une icône héritée. Sans DOMPurify, les textes longs sont en lecture seule.
 */

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SANITIZE_CONFIGS, richTextAvailable, sanitizeRich, sanitizeRulesText } from '../js/ui/sanitize.js';
import { icon, sheetElements, RICH_FIELD } from '../js/ui/dom.js';
import { outputValue } from '../js/ui/sheet.js';
import { deriveCharacter } from '../js/rules/character.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { FEATS_DATA } from '../js/data/feats.js';

afterEach(() => {
    delete globalThis.DOMPurify;
});

describe('Réglages de DOMPurify', () => {
    for (const [name, config] of Object.entries(SANITIZE_CONFIGS)) {
        test(`${name} : ni data-* ni aria-*, aucun attribut data-* autorisé explicitement`, () => {
            assert.equal(config.ALLOW_DATA_ATTR, false);
            assert.equal(config.ALLOW_ARIA_ATTR, false);
            assert.ok(config.ALLOWED_ATTR.every(attr => !/^(data|aria)-/.test(attr)));
        });
    }

    test('Texte riche : seules les balises et attributs de mise en forme sont permis', () => {
        assert.deepEqual(SANITIZE_CONFIGS.rich.ALLOWED_ATTR, ['style', 'color', 'size']);
        assert.ok(!SANITIZE_CONFIGS.rich.ALLOWED_TAGS.includes('a'));
        assert.ok(!SANITIZE_CONFIGS.rich.ALLOWED_TAGS.includes('button'));
    });

    test('Les descriptions des dons n\'utilisent aucun attribut data-* (rien de légitime n\'est perdu)', () => {
        for (const [id, feat] of Object.entries(FEATS_DATA)) {
            assert.ok(!/\sdata-[a-z]/i.test(`${feat.desc ?? ''} ${feat.prereq ?? ''}`), id);
        }
    });

    test('Les deux nettoyages transmettent leur réglage à DOMPurify', () => {
        const seen = [];
        globalThis.DOMPurify = { sanitize: (html, config) => { seen.push(config); return html; } };
        sanitizeRich('<b>x</b>');
        sanitizeRulesText('<b>x</b>');
        assert.equal(seen[0], SANITIZE_CONFIGS.rich);
        assert.equal(seen[1], SANITIZE_CONFIGS.rules);
        assert.ok(seen.every(config => config.ALLOW_DATA_ATTR === false));
    });

    test('Même texte, même réglage : nettoyé une seule fois (frappe suivante, même résultat)', () => {
        let calls = 0;
        globalThis.DOMPurify = { sanitize: (html) => { calls++; return html.replace(/<script>.*<\/script>/g, ''); } };
        const dirty = '<b>Korgul</b><script>alert(1)</script>';
        assert.equal(sanitizeRich(dirty), '<b>Korgul</b>');
        assert.equal(sanitizeRich(dirty), '<b>Korgul</b>');
        assert.equal(calls, 1);
        // Autre réglage, autre texte : nouveau nettoyage
        sanitizeRulesText(dirty);
        sanitizeRich('<i>autre</i>');
        assert.equal(calls, 3);
    });

    test('DOMPurify remplacé (rechargé) : le texte est renettoyé par le nouveau', () => {
        globalThis.DOMPurify = { sanitize: () => 'ancien' };
        assert.equal(sanitizeRich('<b>x</b>'), 'ancien');
        globalThis.DOMPurify = { sanitize: () => 'nouveau' };
        assert.equal(sanitizeRich('<b>x</b>'), 'nouveau');
    });

    test('Mémoire bornée : un texte ancien est renettoyé après beaucoup d\'autres', () => {
        let calls = 0;
        globalThis.DOMPurify = { sanitize: (html) => { calls++; return html; } };
        for (let i = 0; i <= 200; i++) sanitizeRich(`texte ${i}`);
        assert.equal(calls, 201);
        sanitizeRich('texte 0');
        assert.equal(calls, 202);
        sanitizeRich('texte 200');
        assert.equal(calls, 202);
    });
});

describe('Mise en forme disponible ?', () => {
    test('DOMPurify absent : textes longs en lecture seule', () => {
        delete globalThis.DOMPurify;
        assert.equal(richTextAvailable(), false);
    });

    test('DOMPurify sans fonction sanitize (chargement incomplet) : indisponible', () => {
        globalThis.DOMPurify = {};
        assert.equal(richTextAvailable(), false);
    });

    test('DOMPurify chargé : disponible', () => {
        globalThis.DOMPurify = { sanitize: (html) => html };
        assert.equal(richTextAvailable(), true);
    });
});

describe('Noms lus dans un attribut (data-out)', () => {
    const character = { ...createDefaultCharacter(), char_level: '3' };
    const d = deriveCharacter(character);

    test('Valeur calculée connue', () => {
        assert.equal(outputValue('level', d, character), 3);
        assert.equal(outputValue('pb', d, character), '+2');
        assert.equal(outputValue('mod:str', d, character), '+0');
    });

    test('Rappel de la case « Maîtrises d\'armes » : une ligne par source, rien sans classe', () => {
        assert.equal(outputValue('classWeaponProfs', d, character), '');
        const cleric = { ...character, char_class: 'Clerc' };
        const lines = outputValue('classWeaponProfs', deriveCharacter(cleric), cleric).split('\n');
        assert.equal(lines.length, 2);
        assert.equal(lines[0], 'Par la classe (Clerc) : armes courantes.');
    });

    for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', '__proto__:x', '', 'inconnu']) {
        test(`« ${name} » : rien d'affiché, aucune erreur`, () => {
            assert.equal(outputValue(name, d, character), '');
        });
    }

    test('Valeur absente (undefined) : rien d\'affiché', () => {
        assert.equal(outputValue(undefined, d, character), '');
    });
});

describe('Noms lus dans un attribut (data-icon)', () => {
    const fakeDocument = {
        createElementNS: (_ns, tag) => ({
            tag, attrs: {}, children: [],
            setAttribute(key, value) { this.attrs[key] = value; },
            append(...nodes) { this.children.push(...nodes); }
        })
    };

    test('Icône connue : dessinée ; « __proto__ », « constructor » : icône vide, aucune erreur', () => {
        globalThis.document = fakeDocument;
        try {
            assert.ok(icon('star').children.length > 0);
            for (const name of ['__proto__', 'constructor', 'toString', 'inconnue', undefined]) {
                assert.equal(icon(name).children.length, 0, String(name));
            }
        } finally {
            delete globalThis.document;
        }
    });
});

describe('Éléments de la fiche (sheetElements)', () => {
    /** Nœud minimal : parentElement et closest(sélecteur), comme dans un navigateur */
    const node = (attrs, parent = null) => ({
        attrs, parentElement: parent,
        matches(selector) { return selector === RICH_FIELD && this.attrs['data-kind'] === 'rich'; },
        closest(selector) {
            for (let n = this; n; n = n.parentElement) if (n.matches(selector)) return n;
            return null;
        }
    });

    test('Un élément placé dans un texte saisi n\'est jamais un élément de la fiche', () => {
        const sheet = node({});
        const realOutput = node({ 'data-out': 'level' }, sheet);
        const richField = node({ 'data-field': 'backstory', 'data-kind': 'rich' }, sheet);
        const trap = node({ 'data-out': '__proto__' }, richField);
        const deepTrap = node({ 'data-out': 'pb' }, node({}, richField));
        const root = { querySelectorAll: () => [realOutput, richField, trap, deepTrap] };
        assert.deepEqual(sheetElements(root, '[data-out]'), [realOutput, richField]);
    });

    test('Le champ riche lui-même reste un élément de la fiche', () => {
        const sheet = node({});
        const richField = node({ 'data-field': 'backstory', 'data-kind': 'rich' }, sheet);
        const root = { querySelectorAll: () => [richField] };
        assert.deepEqual(sheetElements(root, '[data-field]'), [richField]);
    });
});
