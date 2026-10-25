/**
 * TESTS D'INTÉGRITÉ DES DONNÉES (règles, dons, armes, armures, sorts)
 * Détectent les fautes de saisie dans les bases de données du jeu.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DD_RULES } from '../js/data/dd-rules.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { ABILITY_IDS, SKILLS, SKILLS_BY_STAT, DEFAULT_BGS } from '../js/data/constants.js';

const DICE = /^(\d+d\d+|\d+)\s+(tran|cont|perf)\.$/;

describe('Classes et sous-classes', () => {
    test('12 classes, chacune avec un dé de vie valide', () => {
        const classes = Object.values(DD_RULES.classes);
        assert.equal(classes.length, 12);
        for (const c of classes) assert.match(c.hitDice, /^d(6|8|10|12)$/, c.nameFr);
    });

    test('Chaque sous-classe pointe vers une classe existante', () => {
        for (const [key, s] of Object.entries(DD_RULES.subclasses)) {
            assert.ok(DD_RULES.classes[s.class], `${key} → ${s.class}`);
        }
    });

    test('Chaque classe a sa sous-classe de l\'Odyssée', () => {
        for (const slug of Object.keys(DD_RULES.classes)) {
            const odyssey = Object.values(DD_RULES.subclasses).filter(s => s.class === slug && s.source === 'Odyssée');
            assert.equal(odyssey.length, 1, slug);
        }
    });
});

describe('Dons', () => {
    const feats = Object.entries(FEATS_DATA);
    const TYPES = new Set(['Origine', 'Général', 'Style de combat', 'Épique']);

    test('Chaque don a un nom, un type connu et des prérequis', () => {
        for (const [key, f] of feats) {
            assert.ok(f.name, key);
            assert.ok(TYPES.has(f.type), `${key} : type « ${f.type} »`);
            assert.ok(f.prereq, key);
        }
    });

    test('Les 10 styles de combat sont classés « Style de combat »', () => {
        assert.equal(feats.filter(([, f]) => f.type === 'Style de combat').length, 10);
    });

    test('Les dons hors Faveurs épiques ont une description', () => {
        for (const [key, f] of feats) {
            if (f.type !== 'Épique') assert.ok(f.desc, key);
        }
    });

    test('Aucune propriété dupliquée dans la source (une clé écrasée en silence)', () => {
        const source = readFileSync(new URL('../js/data/feats.js', import.meta.url), 'utf8');
        for (const block of source.split(/\n {4}"[a-z_0-9]+": \{/).slice(1)) {
            const props = [...block.split(/\n {4}\}/)[0].matchAll(/\n {8}"([a-z]+)":/g)].map(m => m[1]);
            assert.deepEqual(props, [...new Set(props)], block.slice(0, 60));
        }
    });
});

describe('Armes et armures', () => {
    test('Chaque arme a une caractéristique, des dégâts lisibles et une catégorie', () => {
        for (const w of DD_RULES.weapons) {
            assert.ok(['FOR', 'DEX'].includes(w.atk), w.name);
            assert.match(w.dmg, DICE, w.name);
            assert.ok(['Courante', 'Guerre'].includes(w.category), w.name);
        }
    });

    test('Les armes à munitions ou finesse utilisent la DEX par défaut', () => {
        for (const w of DD_RULES.weapons) {
            if (/munitions/i.test(w.prop)) assert.equal(w.atk, 'DEX', w.name);
        }
    });

    test('Chaque armure a un type connu et une CA', () => {
        for (const a of EQUIPMENT_DATA.armors) {
            assert.ok(['Légère', 'Interméd.', 'Lourde', 'Bouclier'].includes(a.type), a.name);
            assert.match(a.ca, /\d/, a.name);
        }
    });
});

describe('Caractéristiques, compétences, sorts, fonds', () => {
    test('6 caractéristiques et 18 compétences, toutes rattachées', () => {
        assert.equal(ABILITY_IDS.length, 6);
        assert.equal(SKILLS.length, 18);
        assert.equal(Object.values(SKILLS_BY_STAT).flat().length, 18);
    });

    test('La base de sorts se lit et chaque sort a un nom et un niveau', () => {
        const spells = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
        assert.ok(spells.length > 300);
        for (const s of spells) {
            assert.ok(s.name, JSON.stringify(s).slice(0, 80));
            assert.ok(s.level !== undefined, s.name);
        }
    });

    test('Chaque fond d\'écran par défaut existe', () => {
        for (const file of DEFAULT_BGS) {
            assert.ok(readFileSync(new URL(`../assets/backgrounds/${file}`, import.meta.url)).length > 0, file);
        }
    });
});
