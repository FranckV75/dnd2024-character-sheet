// =============================================================================
// Sous-classes, lot 1 : les capacités des 60 sous-classes en données, atteintes ou à venir
// (docs/etudes/SOUS_CLASSES.md). Textes relus dans le PHB 2024 anglais et le guide de l'Odyssée.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SUBCLASS_FEATURES } from '../js/data/subclass-features.js';
import { subclassFeatures, automationKind, SUBCLASS_AUTOMATION, SUBCLASS_LEVEL } from '../js/rules/subclass-features.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { deriveCharacter } from '../js/rules/character.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const FAMILIES = new Set(['calcul', 'bouton', 'rappel']);

describe('Données des capacités de sous-classe', () => {
    test('chaque sous-classe du menu a ses capacités, et seulement elles', () => {
        assert.deepEqual(Object.keys(SUBCLASS_FEATURES).sort(), Object.keys(DD_RULES.subclasses).sort());
    });

    test('chaque capacité : identifiant unique, niveau 3 à 20, nom, famille, texte', () => {
        for (const [key, list] of Object.entries(SUBCLASS_FEATURES)) {
            assert.ok(list.length >= 4, `${key} : au moins 4 capacités`);
            const ids = new Set();
            for (const feature of list) {
                assert.ok(!ids.has(feature.id), `${key}.${feature.id} en double`);
                ids.add(feature.id);
                assert.match(feature.id, /^[a-z0-9_]+$/, `${key}.${feature.id}`);
                assert.ok(Number.isInteger(feature.level) && feature.level >= SUBCLASS_LEVEL && feature.level <= 20, `${key}.${feature.id} : niveau ${feature.level}`);
                assert.ok(feature.name.trim(), `${key}.${feature.id} : nom`);
                assert.ok(FAMILIES.has(feature.family), `${key}.${feature.id} : famille ${feature.family}`);
                assert.ok(feature.text.length > 20, `${key}.${feature.id} : texte`);
                assert.doesNotMatch(feature.text, /<|>/, `${key}.${feature.id} : pas de HTML`);
                if (feature.optionOf) assert.ok(list.some(other => other.id === feature.optionOf), `${key}.${feature.id} : option d'une capacité connue`);
            }
            // Chaque sous-classe commence au niveau 3 (D&D 2024)
            assert.equal(Math.min(...list.map(f => f.level)), SUBCLASS_LEVEL, `${key} : première capacité au niveau 3`);
        }
    });

    test('Odyssée : les capacités du livre aux niveaux 1 et 2 sont ramenées au niveau 3 (décision de Franck)', () => {
        const prophecy = SUBCLASS_FEATURES.prophecy_domain;
        assert.ok(prophecy.filter(f => f.bookLevel === 1).every(f => f.level === 3));
        assert.equal(prophecy.find(f => f.bookLevel === 2)?.level, 3);
        // Les autres gardent le niveau du livre (Vapeurs régénératrices : 8)
        assert.ok(prophecy.some(f => f.level === 8 && !f.bookLevel));
        for (const list of Object.values(SUBCLASS_FEATURES)) {
            for (const f of list) if (f.bookLevel) assert.ok(f.bookLevel < SUBCLASS_LEVEL);
        }
    });

    test('ce que la fiche fait déjà : seulement des capacités qui existent', () => {
        for (const [key, map] of Object.entries(SUBCLASS_AUTOMATION)) {
            for (const id of Object.keys(map)) {
                assert.ok(SUBCLASS_FEATURES[key]?.some(f => f.id === id), `${key}.${id}`);
            }
        }
    });
});

describe('Capacités atteintes et à venir', () => {
    const hero = (extra) => deriveCharacter({ ...createDefaultCharacter(), ...extra });

    test('Korgul, Barbare Zélote niveau 4 : les deux capacités du niveau 3 atteintes', () => {
        const { subclass, reached, upcoming } = subclassFeatures(hero({ char_class: 'Barbare', char_subclass: 'Voie du Zélote', char_level: '4' }));
        assert.equal(subclass.name, 'Voie du Zélateur');
        assert.deepEqual(reached.map(f => f.level), [3, 3]);
        assert.ok(reached.some(f => /Fureur divine/.test(f.name)));
        assert.deepEqual(upcoming.map(f => f.level), [6, 10, 14]);
        assert.equal(automationKind(reached[0]), 'calc');
    });

    test('anciennes sauvegardes (noms d\'avant le Manuel français) : mêmes capacités, noms du livre', () => {
        // Sous-classe et classe enregistrées sous leur ancien nom ; les id ne changent pas
        const zealot = subclassFeatures(hero({ char_class: 'Barbare', char_subclass: 'Voie du Zélote', char_level: '6' }));
        assert.equal(zealot.subclass.key, 'path_of_the_zealot');
        assert.equal(zealot.reached.find(f => f.id === 'guerrier_des_dieux').name, 'Soldat des dieux');
        assert.equal(zealot.reached.find(f => f.id === 'focalisation_fanatique').name, 'Détermination fanatique');
        const fey = subclassFeatures(hero({ char_class: 'Sorcier', char_subclass: 'Patron Archifée', char_level: '6' }));
        assert.equal(fey.subclass.name, 'Protecteur Archifée');
        assert.deepEqual(fey.reached.filter(f => f.id === 'foulees_feeriques' || f.id === 'fuite_brumeuse').map(f => f.name),
            ['Foulée des fées', 'Échappatoire brumeuse']);
    });

    test('niveau 2 : tout est à venir ; sans sous-classe : rien', () => {
        assert.equal(subclassFeatures(hero({ char_class: 'Paladin', char_subclass: 'Serment de Dévotion', char_level: '2' })).reached.length, 0);
        assert.equal(subclassFeatures(hero({ char_class: 'Paladin', char_level: '5' })).subclass, null);
    });

    test('capacité déjà gérée : « Calculé » ou « En partie »', () => {
        const { reached } = subclassFeatures(hero({ char_class: 'Ensorceleur', char_subclass: 'Sorcellerie Draconique', char_level: '3' }));
        assert.equal(automationKind(reached.find(f => f.id === 'resilience_draconique')), 'calc');
        const odyssean = subclassFeatures(hero({ char_class: 'Roublard', char_subclass: "L'Odysséen", char_level: '3' })).reached;
        assert.equal(automationKind(odyssean.find(f => f.id === 'soldat_vagabond')), 'partial');
    });

    test('Philosophe de l\'Académie : les écoles sont rangées sous « École philosophique »', () => {
        const { reached } = subclassFeatures(hero({ char_class: 'Magicien', char_subclass: "Philosophe de l'Académie", char_level: '3' }));
        const school = reached.find(f => f.id === 'ecole_philosophique');
        assert.equal(school.options.length, 8);
        assert.ok(!reached.some(f => f.optionOf));
    });
});
