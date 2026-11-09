/**
 * TESTS — EMPREINTES NORMALISÉES ET ONGLETS MULTIPLES (audit, lot B : SAV-1, SAV-2, SAV-6)
 *
 * Navigateur simulé comme main.js : la fiche est lue avec loadLocal (donc migrée) et enregistrée
 * avec sa base de synchronisation, sous les vraies clés (dd2024_char, dd2024_cloud_sync).
 *  - Un espace final, une caractéristique vidée… puis un rechargement ou une réponse perdue ne
 *    font plus poser « Ce personnage existe déjà en ligne » / « Deux versions différentes ».
 *  - Une base enregistrée par la v4.15.0 (empreintes de la fiche en mémoire) reste reconnue
 *    après la mise à jour, pour les 11 fiches de test : aucune question pour les joueurs.
 *  - Deux onglets : la fiche et la base reprises de l'autre onglet gardent la synchronisation
 *    cohérente (pas de faux conflit ensuite).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudSync, sheetFingerprint, SYNC_KEY } from '../js/cloud/controller.js';
import { fingerprint, syncStatusLabel } from '../js/cloud/sync.js';
import { createStore } from '../js/state/store.js';
import { loadLocal, saveLocal, STORAGE_KEYS } from '../js/state/persistence.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { planAdoption } from '../js/state/other-tab.js';
import { fakeSupabase } from './helpers/fake-supabase.js';
import { ALL_FIXTURES, readFixture } from './helpers/fixtures.js';

const U = { id: 'user-1', email: 'joueur@example.com' };
const T0 = '2026-10-20T10:00:00.000Z';
const sheet = (name, extra = {}) => ({ ...createDefaultCharacter(), char_name: name, ...extra });
const settle = async () => { for (let i = 0; i < 60; i++) await new Promise(r => setImmediate(r)); };

/** localStorage partagé par les onglets d'un même navigateur (getItem pour persistence.js, get pour le contrôleur) */
function browserStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
        getItem: (k) => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => data.set(k, String(v)),
        removeItem: (k) => data.delete(k),
        get: (k) => (data.has(k) ? data.get(k) : null),
        data
    };
}

/** Client dont la prochaine réponse (écriture arrivée) est perdue en route */
function lossy(db) {
    let lose = null;
    return {
        ...db,
        loseNext(op) { lose = op; },
        from() {
            const b = db.from();
            let op = 'select';
            const { insert, update } = b;
            b.insert = (p) => { op = 'insert'; return insert(p); };
            b.update = (p) => { op = 'update'; return update(p); };
            const then = b.then;
            b.then = (res, rej) => then.call(b, (r) => {
                if (lose === op) {
                    lose = null;
                    return res({ data: null, error: { message: 'Failed to fetch' } });
                }
                return res(r);
            }, rej);
            return b;
        }
    };
}

/** Un onglet ouvert : fiche lue comme main.js, enregistrée avec la base (persist) */
function openTab(db, storage) {
    const loaded = loadLocal(storage);
    const store = createStore(loaded ? loaded.character : createDefaultCharacter());
    const asked = [];
    const timers = [];
    let clock = Date.parse('2026-10-25T12:00:00.000Z');
    let sync;
    const persist = () => {
        saveLocal(store.get(), storage);
        storage.setItem(SYNC_KEY, JSON.stringify(sync.getBase()));
    };
    sync = createCloudSync({
        client: db, store, storage, persist,
        ui: { ask: (kind) => { asked.push(kind); return Promise.resolve(null); }, status: () => {} },
        now: () => new Date((clock += 1000)),
        setTimer: (fn) => { const t = { fn, active: true }; timers.push(t); return t; },
        clearTimer: (t) => { if (t) t.active = false; }
    });
    const runTimers = async () => {
        for (const t of timers.splice(0)) if (t.active) { t.active = false; t.fn(); }
        await settle();
    };
    return { store, sync, asked, persist, runTimers };
}

/** Navigateur dont la fiche `character` est liée à la version T0 en ligne (format v4.16) */
function linkedBrowser(character) {
    return browserStorage({
        [STORAGE_KEYS.character]: JSON.stringify(character),
        [SYNC_KEY]: JSON.stringify({
            name: character.char_name, userId: U.id, updatedAt: T0, hash: sheetFingerprint(character),
            sentHashes: [], detached: false, charHash: sheetFingerprint(character)
        })
    });
}

describe('SAV-1 : empreintes calculées sur la fiche normalisée', () => {
    test('Espace final, caractéristique vidée : même empreinte que la fiche relue', () => {
        const typed = sheet('Korgul', { gp: '12 ', heroic_inspiration: '1/3 ', str_score: '' });
        const reloaded = migrateCharacter(JSON.parse(JSON.stringify(typed))).character;
        assert.equal(sheetFingerprint(typed), sheetFingerprint(reloaded));
        assert.notEqual(fingerprint(typed), fingerprint(reloaded)); // l'ancienne empreinte les distinguait
        assert.notEqual(sheetFingerprint(typed), sheetFingerprint(sheet('Korgul', { gp: '13' })));
    });

    for (const [label, patch] of [['espace final', { gp: '12 ' }], ['Force vidée', { str_score: '' }], ['inspiration « 1/3 »', { heroic_inspiration: '1/3 ' }]]) {
        test(`${label} puis rechargement : la fiche reste liée, aucune question`, async () => {
            const k = sheet('Korgul');
            const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: k, updated_at: T0 }]);
            const storage = linkedBrowser(k);
            const first = openTab(db, storage);
            first.store.update(patch);
            first.persist();
            // Rechargement : la fiche est relue (et normalisée) avant la connexion
            const again = openTab(db, storage);
            assert.equal(again.sync.getBase().name, 'Korgul');
            await again.sync.setUser(U);
            again.store.update({ hp_temp: '1' });
            await again.runTimers();
            assert.deepEqual(again.asked, []);
            assert.equal(again.sync.getState().name, 'Korgul');
            assert.equal(again.sync.getState().dirty, false);
            assert.equal(db.table[0].data.hp_temp, '1');
        });

        test(`${label}, réponse d'envoi perdue puis nouvelle saisie : pas de faux conflit`, async () => {
            const k = sheet('Korgul');
            const db = lossy(fakeSupabase([{ user_id: U.id, name: 'Korgul', data: k, updated_at: T0 }]));
            const t = openTab(db, linkedBrowser(k));
            await t.sync.setUser(U);
            t.store.update(patch);
            // Force vidée : relue « 10 », comme en ligne → rien à envoyer, donc rien à perdre
            if (t.sync.getState().dirty) db.loseNext('update');
            await t.runTimers();
            t.store.update({ hp_temp: '2' });
            await t.runTimers();               // échec conditionnel : l'envoi perdu est reconnu
            await t.runTimers();               // puis la fiche est renvoyée
            assert.deepEqual(t.asked, []);
            assert.equal(t.sync.getState().dirty, false);
            assert.equal(db.table[0].data.hp_temp, '2');
        });
    }

    test('La valeur saisie n\'est pas modifiée dans la fiche (seule l\'empreinte est normalisée)', async () => {
        const k = sheet('Korgul');
        const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: k, updated_at: T0 }]);
        const t = openTab(db, linkedBrowser(k));
        await t.sync.setUser(U);
        t.store.update({ gp: '12 ' });
        await t.runTimers();
        assert.equal(t.store.get().gp, '12 ');
        assert.equal(db.table[0].data.gp, '12 ');
    });
});

describe('Mise à jour depuis la v4.15.0 : bases déjà enregistrées', () => {
    /** Navigateur tel que la v4.15.0 l'a laissé : base avec les empreintes de la fiche en mémoire */
    const v415Browser = (character, hash = fingerprint(character)) => browserStorage({
        [STORAGE_KEYS.character]: JSON.stringify(character),
        [SYNC_KEY]: JSON.stringify({
            name: character.char_name, userId: U.id, updatedAt: T0, hash, sentHashes: [hash], detached: false,
            charHash: fingerprint(character)
        })
    });

    for (const [name, url] of ALL_FIXTURES) {
        test(`${name} : fiche liée en v4.15.0 → toujours liée, à jour, aucune question`, async () => {
            // La v4.15.0 enregistrait la fiche lue (migrée) telle qu'en mémoire
            const character = { ...migrateCharacter(readFixture(url)).character, char_name: 'Korgul' };
            const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: character, updated_at: T0 }]);
            const t = openTab(db, v415Browser(character));
            assert.equal(t.sync.getBase().name, 'Korgul', 'lien gardé au chargement');
            await t.sync.setUser(U);
            assert.deepEqual(t.asked, []);
            assert.equal(t.sync.getState().name, 'Korgul');
            assert.equal(t.sync.getState().dirty, false);
            assert.equal(db.calls.filter(c => c.op !== 'select').length, 0, 'rien n\'est renvoyé');
            // Modification suivante : envoyée sans question
            t.store.update({ hp_current: '1' });
            await t.runTimers();
            assert.deepEqual(t.asked, []);
            assert.equal(db.table[0].data.hp_current, '1');
        });
    }

    test('Fiche v4.15.0 enregistrée avec un espace final (avant la correction) : lien gardé', async () => {
        const character = sheet('Korgul', { gp: '12 ' });
        const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: character, updated_at: T0 }]);
        const t = openTab(db, v415Browser(character));
        assert.equal(t.sync.getBase().name, 'Korgul');
        await t.sync.setUser(U);
        assert.deepEqual(t.asked, []);
        assert.equal(t.sync.getState().dirty, false);
    });

    test('Fiche v4.15.0 modifiée et pas encore envoyée : lien gardé, envoi sans question', async () => {
        const online = sheet('Korgul');
        const local = { ...online, hp_current: '3' };
        const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: online, updated_at: T0 }]);
        const t = openTab(db, v415Browser(local, fingerprint(online)));
        await t.sync.setUser(U);
        assert.deepEqual(t.asked, []);
        assert.equal(db.table[0].data.hp_current, '3');
    });

    test('Base enregistrée avec une AUTRE fiche : toujours oubliée (prudence inchangée)', () => {
        const storage = v415Browser(sheet('Korgul'));
        storage.setItem(STORAGE_KEYS.character, JSON.stringify(sheet('Iria')));
        const t = openTab(fakeSupabase([]), storage);
        assert.equal(t.sync.getBase().name, '');
    });
});

describe('SAV-2 : fiche et base reprises d\'un autre onglet', () => {
    /** Reprise telle que main.js la fait (checkOtherTabs) */
    function adopt(tab, storage, knownText, pendingKeys = []) {
        const plan = planAdoption({ storedText: storage.getItem(STORAGE_KEYS.character), knownText, current: tab.store.get(), pendingKeys });
        tab.store.replace(plan.character, { source: 'other-tab', stored: plan.stored, merged: plan.merged });
        return plan;
    }

    test('L\'autre onglet envoie en ligne : cet onglet reprend fiche et base, puis envoie sans faux conflit', async () => {
        const k = sheet('Korgul');
        const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: k, updated_at: T0 }]);
        const storage = linkedBrowser(k);
        const a = openTab(db, storage);
        const b = openTab(db, storage);
        await a.sync.setUser(U);
        await b.sync.setUser(U);
        const knownText = storage.getItem(STORAGE_KEYS.character);
        b.store.update({ hp_current: '5' });
        b.persist();
        await b.runTimers();                       // envoyé en ligne par B, base de B enregistrée
        adopt(a, storage, knownText);
        assert.equal(a.store.get().hp_current, '5');
        assert.equal(a.sync.getState().name, 'Korgul');
        assert.equal(a.sync.getState().dirty, false);
        a.store.update({ hp_temp: '2' });
        await a.runTimers();
        assert.deepEqual(a.asked, []);
        assert.equal(db.table[0].data.hp_temp, '2');
        assert.equal(db.table[0].data.hp_current, '5');
    });

    test('Base mise à jour par l\'autre onglet sans changer la fiche (adoptStoredBase)', async () => {
        const k = sheet('Korgul');
        const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: k, updated_at: T0 }]);
        const storage = linkedBrowser(k);
        const a = openTab(db, storage);
        const b = openTab(db, storage);
        await a.sync.setUser(U);
        await b.sync.setUser(U);
        const knownText = storage.getItem(STORAGE_KEYS.character);
        // B modifie et enregistre la fiche (base pas encore envoyée) ; A la reprend
        b.store.update({ hp_current: '5' });
        b.persist();
        adopt(a, storage, knownText);
        // B envoie en ligne : seule la base change dans le navigateur
        await b.runTimers();
        a.sync.adoptStoredBase(JSON.parse(storage.getItem(STORAGE_KEYS.character)));
        assert.equal(a.sync.getState().dirty, false);
        a.store.update({ hp_temp: '2' });
        await a.runTimers();
        assert.deepEqual(a.asked, []);
        assert.equal(db.table[0].data.hp_temp, '2');
    });

    test('Saisie en attente gardée par-dessus la fiche reprise : envoyée sans question', async () => {
        const k = sheet('Korgul');
        const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: k, updated_at: T0 }]);
        const storage = linkedBrowser(k);
        const a = openTab(db, storage);
        const b = openTab(db, storage);
        await a.sync.setUser(U);
        await b.sync.setUser(U);
        const knownText = storage.getItem(STORAGE_KEYS.character);
        a.store.update({ gp: '111' });               // pas encore enregistré dans A
        b.store.update({ sp: '222' });
        b.persist();
        await b.runTimers();
        const plan = adopt(a, storage, knownText, ['gp']);
        assert.equal(plan.merged, true);
        a.persist();                                 // main.js enregistre la fusion aussitôt
        await a.runTimers();
        assert.deepEqual(a.asked, []);
        assert.equal(db.table[0].data.gp, '111');
        assert.equal(db.table[0].data.sp, '222');
    });

    test('Base de l\'autre onglet enregistrée avec une autre fiche : plus de lien (prudence)', () => {
        const k = sheet('Korgul');
        const storage = linkedBrowser(k);
        const a = openTab(fakeSupabase([]), storage);
        const knownText = storage.getItem(STORAGE_KEYS.character);
        storage.setItem(STORAGE_KEYS.character, JSON.stringify(sheet('Iria')));
        adopt(a, storage, knownText);
        assert.equal(a.sync.getBase().name, '');
    });

    test('Reprise : aucune écriture dans le navigateur ni en ligne (pas de ping-pong)', async () => {
        const k = sheet('Korgul');
        const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: k, updated_at: T0 }]);
        const storage = linkedBrowser(k);
        const a = openTab(db, storage);
        await a.sync.setUser(U);
        const knownText = storage.getItem(STORAGE_KEYS.character);
        storage.setItem(STORAGE_KEYS.character, JSON.stringify({ ...k, hp_current: '6' }));
        const before = new Map(storage.data);
        adopt(a, storage, knownText);
        await a.runTimers();
        assert.deepEqual(storage.data, before);
        assert.equal(db.calls.filter(c => c.op !== 'select').length, 0);
    });
});

describe('SAV-6 : état affiché dans la barre', () => {
    const state = (extra) => ({ name: '', named: true, dirty: false, detached: false, pending: false, needsCheck: false, lastError: '', ...extra });

    test('Fiche sans nom : il faut un nom pour l\'enregistrer en ligne (jamais « à jour »)', () => {
        const { label, hint } = syncStatusLabel(state({ named: false }));
        assert.match(label, /nom/);
        assert.doesNotMatch(label, /à jour/);
        assert.match(hint, /navigateur seulement/);
        // Nom effacé sur une fiche liée : même avis
        assert.match(syncStatusLabel(state({ named: false, name: 'Korgul', dirty: true })).label, /donnez un nom/);
    });

    test('Fiche nommée : à jour, en cours d\'envoi, question, échec', () => {
        assert.equal(syncStatusLabel(state({ name: 'Korgul' })).label, 'fiche « Korgul » à jour en ligne');
        assert.equal(syncStatusLabel(state({ name: 'Korgul', dirty: true })).label, 'enregistrement en ligne…');
        assert.equal(syncStatusLabel(state({ pending: true, named: false })).label, 'une question attend votre réponse');
        assert.match(syncStatusLabel(state({ lastError: 'pas de connexion' })).label, /échec/);
        assert.match(syncStatusLabel(state({ detached: true })).label, /navigateur seulement/);
    });

    test('Nouveau nom tapé dans un autre onglet : la question y attend, pas « enregistrement en ligne »', () => {
        const { label, hint } = syncStatusLabel(state({ name: 'Korgul', dirty: true, renameElsewhere: true }));
        assert.match(label, /autre onglet/);
        assert.match(hint, /rechargez la page/);
    });

    test('Le contrôleur indique si la fiche a un nom', () => {
        const t = openTab(fakeSupabase([]), browserStorage());
        assert.equal(t.sync.getState().named, false);
        t.store.update({ char_name: 'Korgul' });
        assert.equal(t.sync.getState().named, true);
    });
});
