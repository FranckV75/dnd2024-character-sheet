/**
 * TESTS — SUIVI DES ÉTATS (js/rules/conditions.js, js/data/conditions.js, clé « conditions »)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CONDITIONS } from '../js/data/conditions.js';
import { sanitizeConditions, activeConditions, toggleCondition, conditionReminders, CONDITIONS_KEY } from '../js/rules/conditions.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { V4_ONLY_KEYS, withoutV4State } from '../js/cloud/sync.js';
import { createDefaultCharacter } from '../js/state/schema.js';

describe('États : données', () => {
    test('Les 15 états du manuel français, dans son ordre alphabétique', () => {
        assert.deepEqual(CONDITIONS.map((c) => c.nameFr), [
            'À terre', 'Agrippé', 'Assourdi', 'Aveuglé', 'Charmé', 'Effrayé', 'Empoisonné', 'Entravé',
            'Épuisement', 'Étourdi', 'Inconscient', 'Invisible', 'Neutralisé', 'Paralysé', 'Pétrifié'
        ]);
    });

    test('Identifiants uniques, effets renseignés, états entraînés connus', () => {
        const ids = CONDITIONS.map((c) => c.id);
        assert.equal(new Set(ids).size, ids.length);
        for (const c of CONDITIONS) {
            assert.ok(c.effects.length > 0, c.id);
            for (const included of c.includes ?? []) assert.ok(ids.includes(included), `${c.id} → ${included}`);
        }
    });
});

describe('États : cocher et lire', () => {
    test('Fiche sans la clé (anciennes fiches) : aucun état', () => {
        assert.deepEqual(activeConditions(createDefaultCharacter()), []);
        assert.deepEqual(conditionReminders(createDefaultCharacter()), []);
    });

    test('Liste nettoyée : id inconnus, doublons, Épuisement et valeurs abîmées retirés ; ordre du manuel', () => {
        assert.deepEqual(sanitizeConditions(['prone', 'poisoned', 'prone', 'xyz', 3, null, 'exhaustion']), ['prone', 'poisoned']);
        assert.deepEqual(sanitizeConditions(['poisoned', 'blinded']), ['blinded', 'poisoned']);
        assert.deepEqual(sanitizeConditions('poisoned'), []);
        assert.deepEqual(sanitizeConditions({ poisoned: true }), []);
    });

    test('Cocher puis décocher', () => {
        let record = createDefaultCharacter();
        record = { ...record, ...toggleCondition(record, 'poisoned', true) };
        record = { ...record, ...toggleCondition(record, 'prone', true) };
        assert.deepEqual(record[CONDITIONS_KEY], ['prone', 'poisoned']);
        record = { ...record, ...toggleCondition(record, 'prone', false) };
        assert.deepEqual(record[CONDITIONS_KEY], ['poisoned']);
        record = { ...record, ...toggleCondition(record, 'poisoned', true) };
        assert.deepEqual(record[CONDITIONS_KEY], ['poisoned']);
    });

    test('L\'Épuisement et les id inconnus ne se cochent pas', () => {
        assert.deepEqual(toggleCondition({}, 'exhaustion', true), {});
        assert.deepEqual(toggleCondition({}, 'inconnu', true), {});
    });
});

describe('États : rappel des effets', () => {
    test('État coché : ses effets', () => {
        const [poisoned] = conditionReminders({ conditions: ['poisoned'] });
        assert.equal(poisoned.nameFr, 'Empoisonné');
        assert.equal(poisoned.checked, true);
        assert.match(poisoned.effects[0], /Désavantage/);
    });

    test('Inconscient entraîne Neutralisé et À terre (rappelés, non cochés)', () => {
        const reminders = conditionReminders({ conditions: ['unconscious'] });
        assert.deepEqual(reminders.map((r) => [r.nameFr, r.checked, r.impliedBy]), [
            ['À terre', false, ['Inconscient']],
            ['Inconscient', true, []],
            ['Neutralisé', false, ['Inconscient']]
        ]);
    });

    test('État coché et aussi entraîné : coché, avec sa source', () => {
        const reminders = conditionReminders({ conditions: ['incapacitated', 'stunned', 'paralyzed'] });
        const incapacitated = reminders.find((r) => r.id === 'incapacitated');
        assert.equal(incapacitated.checked, true);
        assert.deepEqual(incapacitated.impliedBy, ['Étourdi', 'Paralysé']);
    });

    test('Épuisement : rappelé avec les chiffres du niveau de la fiche', () => {
        assert.deepEqual(conditionReminders({ fatigue_level: 0 }), []);
        const [exhaustion] = conditionReminders({ fatigue_level: 3 });
        assert.equal(exhaustion.level, 3);
        assert.match(exhaustion.effects[0], /Niveau 3 : -6 aux tests de d20 et -4,5 m/);
        assert.match(conditionReminders({ fatigue_level: '6' })[0].effects[0], /mort/);
    });
});

describe('États : sauvegarde', () => {
    test('Clé propre à la v4 : ignorée de la comparaison avec l\'ancien site', () => {
        assert.ok(V4_ONLY_KEYS.includes(CONDITIONS_KEY));
        assert.ok(!(CONDITIONS_KEY in withoutV4State({ conditions: ['prone'] })));
    });

    test('Lecture d\'une fiche : clé absente laissée absente (empreinte en ligne inchangée)', () => {
        const { character } = migrateCharacter({ char_name: 'Korgul' });
        assert.ok(!(CONDITIONS_KEY in character));
    });

    test('Lecture d\'une fiche : liste nettoyée, valeur abîmée → aucun état', () => {
        assert.deepEqual(migrateCharacter({ conditions: ['prone', 'xyz', 'prone'] }).character.conditions, ['prone']);
        assert.deepEqual(migrateCharacter({ conditions: 'prone' }).character.conditions, []);
        assert.deepEqual(migrateCharacter({ conditions: null }).character.conditions, []);
    });
});

describe('États : corrections de la relecture', () => {
    test('Décocher Inconscient laisse À terre (on reste à terre en reprenant conscience)', () => {
        assert.deepEqual(toggleCondition({ conditions: ['unconscious'] }, 'unconscious', false), { conditions: ['prone'] });
        assert.deepEqual(toggleCondition({ conditions: ['prone', 'unconscious'] }, 'unconscious', false), { conditions: ['prone'] });
        // Décocher un état qui n'était pas coché ne fait rien apparaître
        assert.deepEqual(toggleCondition({ conditions: [] }, 'unconscious', false), { conditions: [] });
    });

    test('Fiche vierge où un état a été coché puis retiré : toujours vierge', async () => {
        const { isBlankCharacter } = await import('../js/cloud/controller.js');
        const { takeSnapshot } = await import('../js/state/snapshots.js');
        const blank = { ...createDefaultCharacter(), conditions: [] };
        assert.equal(isBlankCharacter(blank), true);
        assert.equal(isBlankCharacter({ ...createDefaultCharacter(), conditions: ['prone'] }), false);
        const storage = { data: new Map(), getItem(k) { return this.data.get(k) ?? null; }, setItem(k, v) { this.data.set(k, v); }, removeItem(k) { this.data.delete(k); } };
        assert.equal(takeSnapshot(blank, 'open', { storage }).why, 'blank');
        assert.equal(takeSnapshot({ ...createDefaultCharacter(), conditions: ['prone'] }, 'open', { storage }).saved, true);
    });
});
