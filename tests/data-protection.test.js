/**
 * TESTS — PROTECTION DES DONNÉES (audit, lot B)
 *  - SAV-5 : sauvegarde du navigateur illisible → copie de secours AVANT la fiche vierge
 *  - SAV-7 : un fichier JSON qui n'est pas une fiche est refusé, la fiche reste intacte
 *  - SAV-2 : fiche enregistrée par un autre onglet → reprise, saisies en attente gardées
 *  - normalizeCharacter : forme utilisée pour les empreintes (idempotente sur toutes les fiches)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadLocal, parseCharacterFile, serializeCharacter, characterName, BACKUP_KEY, STORAGE_KEYS } from '../js/state/persistence.js';
import { migrateCharacter, normalizeCharacter, isCharacterData, safeText } from '../js/state/migrate.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { planAdoption, locateRow } from '../js/state/other-tab.js';
import { deriveCharacter } from '../js/rules/character.js';
import { sheetFingerprint } from '../js/cloud/controller.js';
import { canonicalJSON } from '../js/cloud/sync.js';
import { ALL_FIXTURES, readFixture } from './helpers/fixtures.js';

function memoryStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
        getItem: (k) => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => data.set(k, String(v)),
        removeItem: (k) => data.delete(k),
        data
    };
}

const NOW = new Date('2026-11-09T10:00:00.000Z');

describe('SAV-5 : sauvegarde du navigateur illisible', () => {
    test('Le texte illisible est copié dans la copie de secours, puis une fiche vierge est ouverte', () => {
        const broken = '{"char_name":"Korgul","backstory":"tronqu';
        const storage = memoryStorage({ [STORAGE_KEYS.character]: broken });
        const result = loadLocal(storage, NOW);
        assert.equal(result.backupKey, BACKUP_KEY);
        assert.equal(storage.getItem(BACKUP_KEY), broken);
        // La sauvegarde d'origine n'est pas touchée à la lecture
        assert.equal(storage.getItem(STORAGE_KEYS.character), broken);
        assert.deepEqual(result.character, migrateCharacter({}).character);
        assert.equal(result.report.length, 1);
    });

    test('Texte JSON qui n\'est pas une fiche (tableau, null, texte) : même protection', () => {
        for (const text of ['[1,2]', 'null', '"Korgul"', '42']) {
            const storage = memoryStorage({ [STORAGE_KEYS.character]: text });
            const result = loadLocal(storage, NOW);
            assert.equal(result.backupKey, BACKUP_KEY, text);
            assert.equal(storage.getItem(BACKUP_KEY), text);
        }
    });

    test('Une copie de secours plus ancienne et différente n\'est jamais écrasée', () => {
        const storage = memoryStorage({ [STORAGE_KEYS.character]: '{oops', [BACKUP_KEY]: '{ancienne' });
        const result = loadLocal(storage, NOW);
        assert.equal(result.backupKey, `${BACKUP_KEY}_2026-11-09T10:00:00.000Z`);
        assert.equal(storage.getItem(BACKUP_KEY), '{ancienne');
        assert.equal(storage.getItem(result.backupKey), '{oops');
    });

    test('Même texte déjà copié (rechargement) : une seule copie', () => {
        const storage = memoryStorage({ [STORAGE_KEYS.character]: '{oops', [BACKUP_KEY]: '{oops' });
        assert.equal(loadLocal(storage, NOW).backupKey, BACKUP_KEY);
        assert.equal(storage.data.size, 2);
    });

    test('Copie impossible (stockage plein) : signalée (backupKey vide)', () => {
        const storage = memoryStorage({ [STORAGE_KEYS.character]: '{oops' });
        storage.setItem = () => { throw new Error('QuotaExceededError'); };
        assert.equal(loadLocal(storage, NOW).backupKey, '');
    });

    test('Sauvegarde lisible : aucune copie de secours', () => {
        const storage = memoryStorage({ [STORAGE_KEYS.character]: JSON.stringify(createDefaultCharacter()) });
        const result = loadLocal(storage, NOW);
        assert.equal(result.backupKey, undefined);
        assert.equal(storage.getItem(BACKUP_KEY), null);
    });
});

describe('SAV-7 : import d\'un fichier qui n\'est pas une fiche', () => {
    test('Fichier JSON quelconque refusé avec un message clair', () => {
        for (const text of ['{"name":"package","version":"1.0.0"}', '{}', '{"foo":1}', '{"__proto__":{"x":1}}']) {
            assert.throws(() => parseCharacterFile(text), /ne contient pas une fiche de personnage.*n'a pas été modifiée/, text);
        }
    });

    test('Fiche réduite au strict minimum acceptée (un seul champ connu)', () => {
        assert.equal(parseCharacterFile('{"char_name":"Korgul"}').character.char_name, 'Korgul');
        assert.equal(parseCharacterFile('{"str_score":"18"}').character.str_score, '18');
        assert.equal(parseCharacterFile('{"feat_6":"robuste"}').character.feat_6, 'robuste');
        assert.ok(isCharacterData({ hd_total: 'D12' }));
    });

    test('Fiche vierge exportée puis réimportée : acceptée', () => {
        assert.deepEqual(parseCharacterFile(serializeCharacter(createDefaultCharacter())).character, createDefaultCharacter());
    });

    for (const [name, url] of ALL_FIXTURES) {
        test(`Sauvegarde ${name} acceptée`, () => {
            assert.ok(isCharacterData(readFixture(url)));
            assert.doesNotThrow(() => parseCharacterFile(readFileSync(url, 'utf8')));
        });
    }
});

describe('Forme normalisée (empreintes de synchronisation)', () => {
    for (const [name, url] of ALL_FIXTURES) {
        test(`${name} : normaliser une fiche déjà lue ne la change pas (idempotence)`, () => {
            const loaded = migrateCharacter(readFixture(url)).character;
            assert.equal(canonicalJSON(normalizeCharacter(loaded)), canonicalJSON(loaded));
        });
    }

    test('Espace final, caractéristique vidée : même forme normalisée que la fiche relue', () => {
        const base = { ...createDefaultCharacter(), char_name: 'Korgul', gp: '12' };
        const typed = { ...base, gp: '12 ', str_score: '' };
        const reloaded = migrateCharacter(JSON.parse(JSON.stringify(typed))).character;
        assert.equal(canonicalJSON(normalizeCharacter(typed)), canonicalJSON(normalizeCharacter(reloaded)));
        // La fiche saisie n'est pas modifiée
        assert.equal(typed.gp, '12 ');
        assert.equal(typed.str_score, '');
    });
});

describe('SAV-2 : fiche enregistrée par un autre onglet', () => {
    const mine = { ...createDefaultCharacter(), char_name: 'Korgul', hp_current: '10', gp: '5' };
    const knownText = JSON.stringify(mine);

    test('Texte inchangé (ou absent) : rien à faire', () => {
        assert.deepEqual(planAdoption({ storedText: knownText, knownText, current: mine }), { action: 'none' });
        assert.deepEqual(planAdoption({ storedText: null, knownText, current: mine }), { action: 'none' });
    });

    test('Autre onglet : sa fiche est reprise (sans fusion)', () => {
        const other = { ...mine, hp_temp: '3' };
        const plan = planAdoption({ storedText: JSON.stringify(other), knownText, current: mine });
        assert.equal(plan.action, 'adopt');
        assert.equal(plan.changed, true);
        assert.equal(plan.merged, false);
        assert.equal(plan.character.hp_temp, '3');
        assert.equal(plan.character.hp_current, '10');
        assert.deepEqual(plan.stored, other);
    });

    test('Saisie en attente ici : gardée par-dessus, les autres champs viennent de l\'autre onglet', () => {
        const current = { ...mine, gp: '111' };          // tapé ici, pas encore enregistré
        const other = { ...mine, sp: '222' };             // enregistré par l'autre onglet
        const plan = planAdoption({ storedText: JSON.stringify(other), knownText, current, pendingKeys: new Set(['gp']) });
        assert.equal(plan.merged, true);
        assert.equal(plan.character.gp, '111');
        assert.equal(plan.character.sp, '222');
    });

    test('Même champ modifié des deux côtés : la saisie en attente de cet onglet l\'emporte', () => {
        const current = { ...mine, hp_current: '4' };
        const other = { ...mine, hp_current: '8' };
        const plan = planAdoption({ storedText: JSON.stringify(other), knownText, current, pendingKeys: ['hp_current'] });
        assert.equal(plan.character.hp_current, '4');
        assert.equal(plan.merged, true);
    });

    test('Saisie en attente identique à la fiche reprise : pas de fusion à réenregistrer', () => {
        const current = { ...mine, gp: '9' };
        const other = { ...mine, gp: '9' };
        const plan = planAdoption({ storedText: JSON.stringify(other), knownText, current, pendingKeys: ['gp'] });
        assert.equal(plan.merged, false);
        assert.equal(plan.changed, false);
    });

    test('Même contenu réécrit autrement (ordre des clés) : rien ne change à l\'écran', () => {
        const reordered = Object.fromEntries(Object.entries(mine).reverse());
        const plan = planAdoption({ storedText: JSON.stringify(reordered), knownText, current: mine });
        assert.equal(plan.action, 'adopt');
        assert.equal(plan.changed, false);
    });

    test('Texte illisible ou qui n\'est pas une fiche : ignoré, la fiche de cet onglet est gardée', () => {
        for (const text of ['{oops', '[]', '{"name":"package"}']) {
            assert.deepEqual(planAdoption({ storedText: text, knownText, current: mine }), { action: 'ignore' }, text);
        }
    });

    test('La fiche reprise passe par la migration (ancien format lisible)', () => {
        const plan = planAdoption({ storedText: JSON.stringify({ char_name: 'Iria', str_score: '' }), knownText, current: mine });
        assert.equal(plan.character.str_score, '10');
        assert.equal(plan.stored.str_score, '');
    });
});

describe('SAV-2 : saisies enregistrées au même instant dans deux onglets', () => {
    const mine = { ...createDefaultCharacter(), char_name: 'Korgul', pp: '0', hp_temp: '' };
    const knownText = JSON.stringify(mine);

    test('Saisie enregistrée à l\'instant, champ inchangé là-bas : gardée par-dessus', () => {
        const current = { ...mine, pp: '104' };
        const other = { ...mine, hp_temp: '14' };   // écrit sans avoir vu pp
        const plan = planAdoption({
            storedText: JSON.stringify(other), knownText: JSON.stringify(current), current,
            recentEdits: [['pp', canonicalJSON('0')]]
        });
        assert.equal(plan.merged, true);
        assert.deepEqual(plan.kept, ['pp']);
        assert.equal(plan.character.pp, '104');
        assert.equal(plan.character.hp_temp, '14');
    });

    test('Même champ changé là-bas aussi : la valeur de l\'autre onglet (plus récente) l\'emporte', () => {
        const current = { ...mine, pp: '104' };
        const other = { ...mine, pp: '7' };
        const plan = planAdoption({ storedText: JSON.stringify(other), knownText, current, recentEdits: [['pp', canonicalJSON('0')]] });
        assert.equal(plan.merged, false);
        assert.equal(plan.character.pp, '7');
    });

    test('Autre personnage ouvert là-bas (nom différent) : rien n\'est ajouté, la saisie est signalée', () => {
        const current = { ...mine, gp: '999' };
        const other = { ...createDefaultCharacter(), char_name: 'Iria' };
        const plan = planAdoption({ storedText: JSON.stringify(other), knownText, current, pendingKeys: ['gp'] });
        assert.equal(plan.merged, false);
        assert.equal(plan.dropped, true);
        assert.equal(plan.character.char_name, 'Iria');
        assert.equal(plan.character.gp, other.gp);
    });

    test('Nom en cours de saisie ici : c\'est la même fiche, la saisie est gardée', () => {
        const current = { ...mine, char_name: 'Korgul le Brave' };
        const other = { ...mine, sp: '3' };
        const plan = planAdoption({ storedText: JSON.stringify(other), knownText, current, pendingKeys: ['char_name'] });
        assert.equal(plan.dropped, false);
        assert.equal(plan.character.char_name, 'Korgul le Brave');
        assert.equal(plan.character.sp, '3');
    });
});

describe('Ligne de tableau retrouvée après une attente (locateRow)', () => {
    const a = { name: 'Hache' };
    const b = { name: 'Arc' };

    test('Même objet, ou même contenu après une reprise d\'un autre onglet (objets recopiés)', () => {
        assert.equal(locateRow([a, b], b, 1), 1);
        assert.equal(locateRow(structuredClone([a, b]), b, 1), 1);
        assert.equal(locateRow(structuredClone([b]), b, 1), 0);   // une ligne au-dessus a disparu
    });

    test('Ligne modifiée ou supprimée entre-temps : introuvable (-1), rien n\'est supprimé', () => {
        assert.equal(locateRow([a, { name: 'Arc long' }], b, 1), -1);
        assert.equal(locateRow([a], b, 1), -1);
        assert.equal(locateRow(null, b, 0), -1);
    });
});

describe('Fiche fabriquée : valeurs d\'un type inattendu', () => {
    const WEIRD = () => [5, true, {}, [], ['x'], { toString: 1 }, { toString: 1, valueOf: 1 }, [{ toString: 1 }], null, -3.5];
    const KEYS = [...Object.keys(createDefaultCharacter()), 'hd_total', 'hd_spent', 'profs_other'];
    const LIST_FIELDS = ['name', 'type', 'atkKey', 'baseDmg', 'prop', 'prof', 'category', 'lvl', 'weaponConfig', 'ca', 'note', 'c', 'prep'];

    /** Lecture, calculs, empreinte, nom : jamais d'erreur ; deux lectures donnent la même fiche */
    function readsSafely(data, label) {
        const character = migrateCharacter(data).character;
        assert.doesNotThrow(() => deriveCharacter(character), label);
        assert.doesNotThrow(() => sheetFingerprint(data), label);
        assert.doesNotThrow(() => characterName(character), label);
        assert.equal(canonicalJSON(migrateCharacter(character).character), canonicalJSON(character), label);
    }

    test('Chaque champ de la fiche, quelle que soit sa valeur', () => {
        for (const key of KEYS) for (const value of WEIRD()) readsSafely({ char_name: 'Piege', [key]: value }, `${key}=${JSON.stringify(value)}`);
    });

    test('Armes, armures, sorts : élément ou champ d\'un type inattendu (nom 5, objet, null…)', () => {
        for (const list of ['dynamic_weapons', 'dynamic_armors', 'dynamic_spells']) {
            for (const value of WEIRD()) {
                readsSafely({ char_name: 'Piege', [list]: [value] }, `${list}=[${JSON.stringify(value)}]`);
                for (const field of LIST_FIELDS) {
                    readsSafely({ char_name: 'Piege', [list]: [{ name: 'Hachette', [field]: value }] }, `${list}.${field}=${JSON.stringify(value)}`);
                }
            }
        }
    });

    test('Rien n\'est perdu : une liste ou un objet dans un champ texte devient son texte JSON', () => {
        const { character } = migrateCharacter({ char_name: 'Piege', backstory: { toString: 1 }, dynamic_armors: [{ name: { a: 1 } }] });
        assert.equal(character.backstory, '{"toString":1}');
        assert.equal(character.dynamic_armors[0].name, '{"a":1}');
        assert.equal(safeText({ toString: 1 }), '{"toString":1}');
        assert.equal(safeText(5), '5');
        assert.equal(safeText(null), '');
    });

    test('Sauvegarde du navigateur fabriquée (nom d\'arme 5) : relue sans erreur, l\'arme est gardée', () => {
        const text = JSON.stringify({ char_name: 'Piege', hp_current: '7', dynamic_weapons: [{ name: 5 }], dynamic_armors: [{ name: null }] });
        const loaded = loadLocal(memoryStorage({ [STORAGE_KEYS.character]: text }), NOW);
        assert.equal(loaded.backupKey, undefined);
        assert.equal(loaded.character.hp_current, '7');
        assert.equal(loaded.character.dynamic_weapons.length, 1);
    });

    test('Import d\'une telle fiche : accepté sans message technique', () => {
        const { character } = parseCharacterFile(JSON.stringify({ char_name: 'Piege', dynamic_weapons: [{ name: 5 }], backstory: { toString: 1 } }));
        assert.equal(character.char_name, 'Piege');
        assert.equal(typeof character.backstory, 'string');
    });

    test('Fiches réelles : aucun champ texte n\'y contient de liste ou d\'objet (leur forme normalisée ne change pas)', () => {
        for (const [name, url] of ALL_FIXTURES) {
            const raw = readFixture(url);
            for (const [key, value] of Object.entries(createDefaultCharacter())) {
                if (typeof value === 'string' && raw[key] !== null && typeof raw[key] === 'object') assert.fail(`${name} : ${key}`);
            }
        }
    });
});
