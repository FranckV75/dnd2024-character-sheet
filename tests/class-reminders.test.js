/**
 * TESTS — RAPPELS DES CAPACITÉS DE CLASSE PRÈS DES VALEURS (4.37.0)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacter } from '../js/rules/character.js';
import { classReminderNotes } from '../js/rules/class-reminders.js';
import { classFeatureNotes, classSpeedBonus } from '../js/rules/class-features.js';
import { CLASS_PROGRESSION } from '../js/data/class-progression.js';
import { SUBCLASS_FEATURES } from '../js/data/subclass-features.js';

const notes = (record) => classReminderNotes(deriveCharacter(record), record);
const mentions = (zone) => (zone ?? []).map((note) => note.mention);

describe('Barbare', () => {
    test('Sens du danger au niveau 2, Instinct sauvage au niveau 7', () => {
        assert.deepEqual(notes({ char_class: 'Barbare', char_level: '1' })['saves.dex'], undefined);
        const lvl7 = notes({ char_class: 'Barbare', char_level: '7' });
        assert.deepEqual(mentions(lvl7['saves.dex']), ['Avantage (Sens du danger)']);
        assert.deepEqual(mentions(lvl7.initiative), ['Avantage (Instinct sauvage)']);
    });

    test('Rage : rappels grisés tant que le bouton Rage est éteint', () => {
        const off = notes({ char_class: 'Barbare', char_level: '3' });
        assert.equal(off['saves.str'][0].inactive, true);
        assert.equal(off.armorClass[0].inactive, true);
        const on = notes({ char_class: 'Barbare', char_level: '3', combat_buffs: { rage: true } });
        assert.equal(on['saves.str'][0].inactive, undefined);
    });

    test('Puissance indomptable : minimum = valeur de Force ; Champion primitif : « dont +4 », saisie inchangée', () => {
        const record = { char_class: 'Barbare', char_level: '20', str_score: '22' };
        const zones = notes(record);
        assert.ok(mentions(zones['saves.str']).includes('Minimum 22'));
        const champion = zones['scores.con'][0];
        assert.equal(champion.manual, true);
        assert.match(champion.mention, /\+4 \(Champion primitif\)/);
        assert.equal(record.str_score, '22');
    });
});

describe('Autres classes', () => {
    test('Roublard 7 : Esquive totale et Savoir-faire sur les seules compétences maîtrisées', () => {
        const zones = notes({ char_class: 'Roublard', char_level: '7', skill_prof_stealth: true, skill_prof_acrobatics: true });
        assert.deepEqual(mentions(zones['saves.dex']), ['Esquive totale']);
        assert.ok(zones['skills.stealth']);
        assert.ok(zones['skills.acrobatics']);
        assert.equal(zones['skills.arcana'], undefined);
    });

    test('Roublard 15 : Esprit fuyant à cocher, seulement si la case manque', () => {
        const zones = notes({ char_class: 'Roublard', char_level: '15', wis_save_prof: true });
        assert.equal(zones['saves.wis'], undefined);
        assert.equal(zones['saves.cha'][0].check, true);
    });

    test('Moine 14 : Survivant discipliné sur les six sauvegardes non cochées', () => {
        const zones = notes({ char_class: 'Moine', char_level: '14', str_save_prof: true, dex_save_prof: true });
        const checks = Object.entries(zones).filter(([, list]) => list.some((note) => note.featId === 'survivant_discipline'));
        assert.deepEqual(checks.map(([zone]) => zone).sort(), ['saves.cha', 'saves.con', 'saves.int', 'saves.wis']);
    });

    test('Rôdeur 6 : Arpenteur (+3 m sans armure lourde, escalade et nage)', () => {
        assert.equal(classSpeedBonus({ classSlug: 'ranger', level: 6 }).value, 3);
        assert.equal(classSpeedBonus({ classSlug: 'ranger', level: 5 }), null);
        const record = { char_class: 'Rôdeur', char_level: '6' };
        assert.ok(mentions(classFeatureNotes(deriveCharacter(record), record).speed).includes('Escalade et nage = Vitesse'));
    });

    test('Sous-classe : Athlète accompli (Champion), Résistance aux sorts (Abjurateur) sur les six sauvegardes', () => {
        assert.ok(notes({ char_class: 'Guerrier', char_subclass: 'Champion', char_level: '3' })['skills.athletics']);
        const abjurer = notes({ char_class: 'Magicien', char_subclass: 'Abjurateur', char_level: '14' });
        assert.equal(Object.keys(abjurer).filter((zone) => zone.startsWith('saves.')).length, 6);
        assert.equal(notes({ char_class: 'Magicien', char_subclass: 'Abjurateur', char_level: '13' })['saves.str'], undefined);
    });

    test('Sans classe reconnue : aucun rappel', () => {
        assert.deepEqual(notes({}), {});
    });
});

describe('Noms et niveaux tirés des données', () => {
    test('Chaque rappel nomme une aptitude qui existe à ce niveau (classe ou sous-classe)', () => {
        const names = new Set([
            ...Object.values(CLASS_PROGRESSION).flatMap((c) => c.features.map((f) => f.name)),
            ...Object.values(SUBCLASS_FEATURES).flatMap((list) => list.map((f) => f.name))
        ]);
        const record = (cls, sub, level) => ({ char_class: cls, char_subclass: sub, char_level: String(level), combat_buffs: { rage: true } });
        const all = [
            record('Barbare', '', 20), record('Barde', '', 20), record('Druide', '', 20), record('Moine', '', 20),
            record('Paladin', 'Serment de dévotion', 20), record('Rôdeur', 'Vagabond féerique', 20), record('Roublard', '', 20),
            record('Guerrier', 'Champion', 20), record('Ensorceleur', 'Sorcellerie aberrante', 20),
            record('Occultiste', 'Protecteur Archifée', 20), record('Moine', 'La Voie du bouclier', 20), record('Magicien', 'Abjurateur', 20)
        ].flatMap((r) => Object.values(notes(r)).flat());
        assert.ok(all.length > 20);
        for (const note of all) assert.ok(names.has(note.featName), note.featName);
    });
});

describe('Relecture 4.37.0', () => {
    test('Charme mystique : rappel sur la Charisme seulement (déjà compté dans les compétences)', () => {
        const zones = notes({ char_class: 'Rôdeur', char_subclass: 'Vagabond féerique', char_level: '5', wis_score: '16' });
        assert.deepEqual(mentions(zones['scores.cha']), ['+3 (Charme mystique)']);
        assert.equal(zones['skills.persuasion'], undefined);
    });
});
