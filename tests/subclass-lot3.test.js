// =============================================================================
// Sous-classes, lot 3 : sorts toujours préparés de toutes les sous-classes (domaines, cercles,
// patrons, Rôdeur, Ensorceleur, Glamour, Magicien, Cœur sauvage…) — docs/SOUS_CLASSES.md.
// Tables relues dans le PHB 2024 anglais (et le guide de l'Odyssée pour ses sous-classes).
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { subclassSpells, subclassFeatures, automationKind, SUBCLASS_AUTOMATION } from '../js/rules/subclass-features.js';
import { SUBCLASS_SPELLS } from '../js/data/subclass-spells.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { deriveCharacter } from '../js/rules/character.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const db = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const hero = (cls, subclass, level, extra = {}) => deriveCharacter({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level), ...extra
});

describe('Données des sorts de sous-classe', () => {
    test('33 sous-classes, chaque sort dans la base de sorts (nom, niveau, rituel)', () => {
        // 33e : Philosophe de l'Académie (Amis du Sophisme, lot 7)
        assert.equal(Object.keys(SUBCLASS_SPELLS).length, 33);
        for (const [subclass, rows] of Object.entries(SUBCLASS_SPELLS)) {
            assert.ok(DD_RULES.subclasses[subclass], subclass);
            for (const [classLevel, vo, name, level, flag = '', options] of rows) {
                assert.ok(Number.isInteger(classLevel) && classLevel >= 3 && classLevel <= 20, `${subclass} ${vo}`);
                const entry = db.find(s => s.vo === vo);
                assert.ok(entry, `${vo} absent de data/spells.json`);
                // Nom du Manuel des joueurs français ; s'il diffère du premier nom de la base (celui
                // que le grimoire enregistre), ce dernier est dans aka pour reconnaître le sort noté
                assert.ok([name, ...(options?.aka ?? [])].includes(entry.name.split('|')[0]), `${vo} : ${name}`);
                assert.equal(entry.level, level, vo);
                assert.equal(entry.ritual === true, flag === 'R', `${vo} : rituel`);
                assert.ok(['', 'R'].includes(flag), `${vo} : repère ${flag}`);
                if (options) assert.deepEqual(Object.keys(options).filter(k => !['note', 'group', 'aka'].includes(k)), [], vo);
            }
        }
    });

    test('chaque liste est annoncée par une capacité « Calculé » ou « En partie » qui renvoie au bloc', () => {
        for (const subclass of Object.keys(SUBCLASS_SPELLS)) {
            const entries = Object.values(SUBCLASS_AUTOMATION[subclass] ?? {});
            // (texte calculé : lu pour un personnage de niveau 20)
            const read = (entry) => (typeof entry.text === 'function' ? entry.text({ subclass, level: 20, pb: 6, mods: {} }) : entry.text);
            assert.ok(entries.some(entry => /Sorts de sous-classe/.test(read(entry))), subclass);
        }
    });

    test('un sort n\'arrive pas avant que la classe puisse le lancer (lanceurs complets : niveau 2n − 1)', () => {
        const full = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard']);
        for (const [subclass, rows] of Object.entries(SUBCLASS_SPELLS)) {
            if (!full.has(DD_RULES.subclasses[subclass].class)) continue;
            for (const [classLevel, vo, , level] of rows) {
                assert.ok(level === 0 || classLevel >= 2 * level - 1, `${subclass} : ${vo} (sort ${level}) au niveau ${classLevel}`);
            }
        }
    });
});

describe('Sorts de sous-classe atteints', () => {
    test('Domaine de la Vie niveau 5 : 6 sorts, 4 à venir', () => {
        const { reached, upcoming } = subclassSpells(hero('Clerc', 'Domaine de la Vie', 5));
        assert.deepEqual(reached.map(s => s.vo), ['Aid', 'Bless', 'Cure Wounds', 'Lesser Restoration', 'Mass Healing Word', 'Revivify']);
        assert.equal(upcoming.length, 4);
    });

    test('Cercle de la Terre : quatre terrains de 6 sorts, rangés par groupe', () => {
        const rows = SUBCLASS_SPELLS.circle_of_the_land;
        const groups = [...new Set(rows.map(row => row[5]?.group))];
        assert.deepEqual(groups, ['Aride', 'Polaire', 'Tempérée', 'Tropicale']);
        for (const group of groups) assert.equal(rows.filter(row => row[5].group === group).length, 6, group);
        const { reached } = subclassSpells(hero('Druide', 'Cercle de la Terre', 3));
        assert.equal(reached.length, 12);
        assert.ok(reached.every(s => s.group));
    });

    test('Cœur sauvage : seulement en rituel, avec la Sagesse (note sous le sort)', () => {
        const { reached, upcoming } = subclassSpells(hero('Barbare', 'Voie du Cœur Sauvage', 3));
        assert.deepEqual(reached.map(s => [s.name, s.ritual]), [['Perception bestiale', true], ['Communication avec les animaux', true]]);
        assert.ok(reached.every(s => /rituel/.test(s.note)));
        assert.deepEqual(upcoming.map(s => s.classLevel), [10]);
    });

    test('Patron céleste : deux sorts mineurs (niveau 0) avec les sorts de niveau 1 et 2', () => {
        const { reached } = subclassSpells(hero('Sorcier', 'Patron Céleste', 3));
        assert.deepEqual(reached.filter(s => s.level === 0).map(s => s.vo), ['Light', 'Sacred Flame']);
    });

    test('capacité de sorts : « Calculé » ; capacité avec un reste : « En partie »', () => {
        const goo = subclassFeatures(hero('Sorcier', 'Patron Grand Ancien', 10)).reached;
        assert.equal(automationKind(goo.find(f => f.id === 'sorts_du_grand_ancien')), 'calc');
        assert.equal(automationKind(goo.find(f => f.id === 'malefice_occulte')), 'partial');
        // Ensorceleur draconique : la Résistance draconique (lot 0) est gardée à côté des sorts
        const draconic = subclassFeatures(hero('Ensorceleur', 'Sorcellerie Draconique', 3)).reached;
        assert.equal(automationKind(draconic.find(f => f.id === 'resilience_draconique')), 'calc');
        assert.equal(automationKind(draconic.find(f => f.id === 'sorts_draconiques')), 'calc');
    });
});
