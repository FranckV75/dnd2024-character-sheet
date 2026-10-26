/**
 * TESTS — SYNCHRONISATION EN LIGNE : décisions pures et accès à la table
 * (les scénarios complets sont dans cloud-controller.test.js)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    decideOnCheck, sameVersion, cloudName, isRename, friendlyError, fingerprint, canonicalJSON,
    isLegacyRowName, withoutV4State, newerVersion
} from '../js/cloud/sync.js';
import {
    listCharacters, fetchCharacter, insertCharacter, updateIfUnchanged, deleteCharacter, deleteIfUnchanged
} from '../js/cloud/repository.js';
import { fakeSupabase } from './helpers/fake-supabase.js';
import { characterName } from '../js/state/persistence.js';

const U = 'user-1';
const T0 = '2026-10-20T10:00:00.000Z';
const T1 = '2026-10-24T10:00:00.000Z';

describe('Décision lors d\'une vérification', () => {
    const base = { attachedName: 'Korgul', baseUpdatedAt: T0, dirty: false, detached: false, localIsBlank: false, localName: 'Korgul' };

    test('Fiche liée, rien de changé nulle part : rien à faire', () => {
        assert.deepEqual(decideOnCheck({ ...base, row: { updated_at: T0 } }), { action: 'none' });
    });

    test('Fiche liée et modifiée ici, inchangée en ligne : envoyer', () => {
        assert.deepEqual(decideOnCheck({ ...base, dirty: true, row: { updated_at: T0 } }), { action: 'push' });
    });

    test('Changée ailleurs, rien de nouveau ici : charger la version en ligne', () => {
        assert.deepEqual(decideOnCheck({ ...base, row: { updated_at: T1 } }), { action: 'load', name: 'Korgul' });
    });

    test('Changée ailleurs ET ici : conflit (demander)', () => {
        assert.deepEqual(decideOnCheck({ ...base, dirty: true, row: { updated_at: T1 } }), { action: 'conflict', name: 'Korgul' });
    });

    test('Supprimée en ligne : demander', () => {
        assert.deepEqual(decideOnCheck({ ...base, row: null }), { action: 'missing', name: 'Korgul' });
    });

    test('Fiche hors ligne volontairement : rien', () => {
        assert.deepEqual(decideOnCheck({ ...base, detached: true, dirty: true, row: { updated_at: T1 } }), { action: 'none' });
    });

    test('Fiche non liée : vierge → dernier personnage (à la connexion seulement) ; nommée → l\'ajouter ; sans nom → rien', () => {
        const free = { attachedName: '', baseUpdatedAt: null, dirty: true, detached: false, allowLatest: true };
        assert.deepEqual(decideOnCheck({ ...free, localIsBlank: true, localName: '', latest: { name: 'Iria' } }), { action: 'load-latest', name: 'Iria' });
        assert.deepEqual(decideOnCheck({ ...free, allowLatest: false, localIsBlank: true, localName: '', latest: { name: 'Iria' } }), { action: 'none' });
        assert.deepEqual(decideOnCheck({ ...free, localIsBlank: true, localName: '', latest: null }), { action: 'none' });
        assert.deepEqual(decideOnCheck({ ...free, localIsBlank: false, localName: 'Iria' }), { action: 'attach' });
        assert.deepEqual(decideOnCheck({ ...free, localIsBlank: false, localName: '' }), { action: 'none' });
    });
});

describe('Petites règles', () => {
    test('Même version malgré des formats de date différents', () => {
        assert.equal(sameVersion('2026-10-20T10:00:00.000Z', '2026-10-20T10:00:00+00:00'), true);
        assert.equal(sameVersion(T0, T1), false);
        assert.equal(sameVersion(null, T0), false);
    });

    test('Nom v3 sur plusieurs lignes : même nom que celui enregistré en ligne par la v3', () => {
        assert.equal(characterName({ char_name: 'Kor<br>gul' }), 'Kor gul');
        assert.equal(characterName({ char_name: '<div>Kor</div><div>gul</div>' }), 'Kor gul');
        assert.equal(characterName({ char_name: 'Korgul <b>Brise-Crâne</b>' }), 'Korgul Brise-Crâne');
    });

    test('Nom en ligne (sans troncature, comme la v3) et renommage', () => {
        assert.equal(cloudName('  Korgul  '), 'Korgul');
        assert.equal(cloudName('x'.repeat(200)).length, 200);
        assert.equal(isRename('Korgul', 'Korgul II'), true);
        assert.equal(isRename('', 'Korgul'), false);
    });

    test('Messages d\'erreur compréhensibles', () => {
        assert.equal(friendlyError(new TypeError('Failed to fetch')), 'pas de connexion Internet');
        assert.equal(friendlyError({ message: 'JWT expired' }), 'session expirée, reconnectez-vous');
        assert.match(friendlyError(new TypeError('Cannot read properties of null (reading \'id\')')), /erreur interne/);
        assert.equal(friendlyError({ message: '<b>Oops</b>' }), 'Oops');
    });
});

describe('Empreinte du contenu', () => {
    test('Indépendante de l\'ordre des clés (la base les réordonne)', () => {
        assert.equal(canonicalJSON({ b: 1, a: [{ d: 2, c: 3 }] }), canonicalJSON({ a: [{ c: 3, d: 2 }], b: 1 }));
        assert.equal(fingerprint({ b: 1, a: 2 }), fingerprint({ a: 2, b: 1 }));
    });

    test('Change dès qu\'une valeur change', () => {
        assert.notEqual(fingerprint({ hp: '9' }), fingerprint({ hp: '8' }));
        assert.notEqual(fingerprint({ list: [1, 2] }), fingerprint({ list: [2, 1] }));
    });
});

describe('Accès à la table characters', () => {
    const rows = () => [
        { user_id: U, name: 'Korgul', data: { char_name: 'Korgul' }, updated_at: T0 },
        { user_id: U, name: 'Iria', data: { char_name: 'Iria' }, updated_at: T1 },
        { user_id: 'autre', name: 'Korgul', data: { secret: true }, updated_at: T1 }
    ];
    const mine = (db, name) => db.table.find(r => r.user_id === U && r.name === name);

    test('Liste : seulement mes fiches, la plus récente en premier', async () => {
        assert.deepEqual((await listCharacters(fakeSupabase(rows()), U)).map(r => r.name), ['Iria', 'Korgul']);
    });

    test('Lecture par nom (jamais la fiche d\'un autre joueur), ou la plus récente', async () => {
        const db = fakeSupabase(rows());
        assert.deepEqual((await fetchCharacter(db, U, 'Korgul')).data, { char_name: 'Korgul' });
        assert.equal((await fetchCharacter(db, U)).name, 'Iria');
        assert.equal(await fetchCharacter(db, U, 'Inconnu'), null);
    });

    test('Création : refusée si le nom existe déjà (rien n\'est écrasé)', async () => {
        const db = fakeSupabase(rows());
        assert.deepEqual(await insertCharacter(db, U, 'Korgul', { hp: 1 }), { conflict: true });
        assert.equal(mine(db, 'Korgul').data.hp, undefined);
        const ok = await insertCharacter(db, U, 'Hedera', { hp: 7 }, new Date(T1));
        assert.equal(ok.ok, true);
        assert.ok(sameVersion(ok.updatedAt, T1), 'date renvoyée par la base (format +00:00)');
        assert.deepEqual(db.calls.at(-1).payload, { name: 'Hedera', data: { hp: 7 }, user_id: U, updated_at: T1 });
    });

    test('Création : la date retenue est celle fixée par la base', async () => {
        const db = fakeSupabase([], { serverClock: '2026-10-25T08:00:00.000Z' });
        const ok = await insertCharacter(db, U, 'Hedera', {}, new Date(T1));
        assert.equal(sameVersion(ok.updatedAt, T1), false);
        assert.ok(sameVersion(ok.updatedAt, mine(db, 'Hedera').updated_at));
    });

    test('Mise à jour conditionnelle : écrit seulement si la version connue est toujours en ligne', async () => {
        const db = fakeSupabase(rows());
        const now = new Date('2026-10-25T12:00:00.000Z');
        assert.equal(await updateIfUnchanged(db, U, 'Korgul', { hp: 9 }, T1, now), null);
        assert.equal(mine(db, 'Korgul').data.hp, undefined);
        assert.ok(sameVersion(await updateIfUnchanged(db, U, 'Korgul', { hp: 9 }, T0, now), now.toISOString()));
        assert.equal(mine(db, 'Korgul').data.hp, 9);
        assert.deepEqual(db.table.find(r => r.user_id === 'autre').data, { secret: true });
    });

    test('Suppression : seulement ma fiche, pas celle d\'un autre joueur du même nom', async () => {
        const db = fakeSupabase(rows());
        await deleteCharacter(db, U, 'Korgul');
        assert.deepEqual(db.table.map(r => `${r.user_id}/${r.name}`).sort(), ['autre/Korgul', 'user-1/Iria']);
    });

    test('Suppression conditionnelle : seulement si la version connue est toujours en ligne', async () => {
        const db = fakeSupabase(rows());
        assert.equal(await deleteIfUnchanged(db, U, 'Korgul', T1), false);
        assert.ok(mine(db, 'Korgul'));
        assert.equal(await deleteIfUnchanged(db, U, 'Korgul', T0), true);
        assert.equal(mine(db, 'Korgul'), undefined);
    });

    test('Erreurs réseau traduites', async () => {
        await assert.rejects(listCharacters(fakeSupabase(rows(), { fail: 'select' }), U), /pas de connexion Internet/);
    });
});

describe('Bascule depuis la v3 : noms, état de jeu, dates', () => {
    test('Nom de ligne v3 écrit autrement (mêmes lettres, espaces différents)', () => {
        assert.equal(isLegacyRowName('Korgul B rise-Crâne', 'Korgul Brise-Crâne'), true);
        assert.equal(isLegacyRowName('Kor gul', 'Korgul'), true);
        assert.equal(isLegacyRowName('Korgul', 'Korgul'), false, 'même nom : rien à faire');
        assert.equal(isLegacyRowName('Iria', 'Korgul'), false);
        assert.equal(isLegacyRowName('', 'Korgul'), false);
        assert.equal(isLegacyRowName('Korgul', ''), false);
    });

    test("Comparaison sans l'état de jeu propre à la v4", () => {
        const v4 = { char_name: 'Korgul', hp_current: '7', combat_buffs: { rage: true }, spell_slots_state: { 1: { used: 1 } } };
        assert.deepEqual(withoutV4State(v4), { char_name: 'Korgul', hp_current: '7' });
        assert.equal(v4.combat_buffs.rage, true, "objet d'origine intact");
        assert.deepEqual(withoutV4State(null), {});
    });

    test("Version la plus récente : plus de 5 s d'écart (règle de la v3)", () => {
        assert.equal(newerVersion(T1, T0), 'cloud');
        assert.equal(newerVersion(T0, T1), 'local');
        assert.equal(newerVersion('2026-10-24T10:00:04.000Z', T1), null, 'à moins de 5 s : même version');
        assert.equal(newerVersion('2026-10-24T10:00:00+00:00', T1), null, 'formats « Z » et « +00:00 »');
        assert.equal(newerVersion(null, T1), null);
        assert.equal(newerVersion(T1, 'pas une date'), null);
    });
});
