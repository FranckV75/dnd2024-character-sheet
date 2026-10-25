/**
 * TESTS — SCÉNARIOS DE SYNCHRONISATION (contrôleur sans DOM)
 * Faux Supabase réaliste (dates « +00:00 », clés JSON triées), vrai store,
 * minuteries et questions simulées. Chaque scénario dangereux relevé lors des
 * deux relectures de l'étape 5 a son test.
 */

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudSync, SYNC_KEY } from '../js/cloud/controller.js';
import { fingerprint } from '../js/cloud/sync.js';
import { createStore } from '../js/state/store.js';
import { characterName } from '../js/state/persistence.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { fakeSupabase } from './helpers/fake-supabase.js';

const U = { id: 'user-1', email: 'joueur@example.com' };
const OTHER = { id: 'user-2', email: 'autre@example.com' };
const T0 = '2026-10-20T10:00:00.000Z';
const T1 = '2026-10-24T10:00:00.000Z';
const CHAR_KEY = 'test_char';

const sheet = (name, extra = {}) => ({ ...createDefaultCharacter(), char_name: name, ...extra });
const row = (name, data, updated_at, user_id = U.id) => ({ user_id, name, data, updated_at });
const settle = async () => { for (let i = 0; i < 40; i++) await new Promise(r => setImmediate(r)); };

function memoryStorage(initial = {}) {
    const map = new Map(Object.entries(initial));
    return { get: (k) => (map.has(k) ? map.get(k) : null), set: (k, v) => map.set(k, String(v)), map };
}

/** Navigateur où la fiche « name » (contenu data) est liée à la version T0 de l'utilisateur U */
const linkedStorage = (data, extra = {}) => memoryStorage({
    [SYNC_KEY]: JSON.stringify({
        name: data.char_name, userId: U.id, updatedAt: T0, hash: fingerprint(data), detached: false, ...extra
    })
});

/**
 * Un « onglet » : store + contrôleur. persist() enregistre la fiche ET la base ensemble,
 * comme main.js. answers : réponses successives aux questions.
 */
function tab({ db, storage = memoryStorage(), character = createDefaultCharacter(), answers = [] } = {}) {
    // Cas normal : la base a été enregistrée avec cette fiche (sauf si le test précise charHash)
    const savedBase = storage.get(SYNC_KEY);
    if (savedBase && !('charHash' in JSON.parse(savedBase))) {
        storage.set(SYNC_KEY, JSON.stringify({ ...JSON.parse(savedBase), charHash: fingerprint(character) }));
    }
    const store = createStore(character);
    const asked = [];
    const statuses = [];
    const timers = [];
    let clock = Date.parse('2026-10-25T12:00:00.000Z');
    let sync;
    sync = createCloudSync({
        client: db, store, storage,
        persist: () => {
            storage.set(CHAR_KEY, JSON.stringify(store.get()));
            storage.set(SYNC_KEY, JSON.stringify(sync.getBase()));
        },
        ui: {
            ask: (kind, data) => {
                asked.push({ kind, data });
                const answer = answers.length ? answers.shift() : null;
                return typeof answer === 'function' ? answer() : Promise.resolve(answer);
            },
            status: (message) => statuses.push(message)
        },
        now: () => new Date((clock += 1000)),
        setTimer: (fn) => { const t = { fn, active: true }; timers.push(t); return t; },
        clearTimer: (t) => { if (t) t.active = false; }
    });
    const runTimers = async () => {
        for (const t of timers.splice(0)) if (t.active) { t.active = false; t.fn(); }
        await settle();
    };
    /** Rechargement de la page : fiche et base relues depuis le stockage */
    const reload = (opts = {}) => tab({ db, storage, character: JSON.parse(storage.get(CHAR_KEY)), ...opts });
    const result = { db, store, sync, asked, statuses, runTimers, storage, reload };
    allTabs.push(result);
    return result;
}

/** Garde-fou : aucun scénario ne doit produire d'erreur interne (exception dans le contrôleur) */
const allTabs = [];
afterEach(() => {
    const internal = allTabs.splice(0).flatMap(t => t.statuses).filter(s => /erreur interne|Cannot read|is not a function/i.test(s));
    assert.deepEqual(internal, [], 'erreur interne du contrôleur');
});

const writes = (db) => db.calls.filter(c => c.op !== 'select');
const cloud = (db, name, user = U.id) => db.table.find(r => r.name === name && r.user_id === user);

describe('Connexion', () => {
    test('Fiche vierge : le personnage en ligne le plus récent est chargé (à la connexion seulement)', async () => {
        const db = fakeSupabase([row('Korgul', sheet('Korgul'), T0), row('Iria', sheet('Iria'), T1)]);
        const t = tab({ db });
        await t.sync.setUser(U);
        assert.equal(t.store.get().char_name, 'Iria');
        assert.equal(t.sync.getState().name, 'Iria');
        assert.equal(t.sync.getState().dirty, false);
        assert.deepEqual(writes(db), []);
    });

    test('Modification non envoyée avant fermeture : envoyée à la connexion suivante', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: { ...online, hp_current: '7' } });
        await t.sync.setUser(U);
        assert.equal(cloud(db, 'Korgul').data.hp_current, '7');
        assert.equal(t.sync.getState().dirty, false);
    });

    test('Modifiée ailleurs, rien de nouveau ici : la version en ligne est chargée sans question', async () => {
        const local = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '5' }), T1)]);
        const t = tab({ db, storage: linkedStorage(local), character: local });
        await t.sync.setUser(U);
        assert.equal(t.store.get().char_level, '5');
        assert.deepEqual(t.asked, []);
    });

    test('Modifiée ici ET ailleurs : question ; fermée sans choix → rien n\'est écrasé, fiche hors ligne', async () => {
        const base = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '5' }), T1)]);
        const t = tab({ db, storage: linkedStorage(base), character: { ...base, hp_current: '3' } });
        await t.sync.setUser(U);
        assert.equal(t.asked[0].kind, 'conflict');
        assert.equal(t.sync.getState().detached, true);
        t.store.update({ hp_current: '2' });
        await t.runTimers();
        assert.deepEqual(writes(db), []);
        assert.equal(cloud(db, 'Korgul').data.char_level, '5');
    });

    test('Sa propre écriture revenue (réponse perdue) : pas de faux conflit, simplement adoptée', async () => {
        const edited = sheet('Korgul', { hp_current: '9' });
        // La base locale date de T0, mais le serveur a déjà reçu exactement ce contenu (T1)
        const db = fakeSupabase([row('Korgul', edited, T1)]);
        const t = tab({ db, storage: linkedStorage(sheet('Korgul')), character: edited });
        await t.sync.setUser(U);
        assert.deepEqual(t.asked, []);
        assert.equal(t.sync.getState().dirty, false);
        assert.deepEqual(writes(db), []);
    });

    test('Échec réseau à la connexion : aucune écriture, nouvelle vérification possible ensuite', async () => {
        const local = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '5' }), T1)]);
        const t = tab({ db, storage: linkedStorage(local), character: local });
        db.failNext('select');
        await t.sync.setUser(U);
        assert.equal(t.sync.getState().needsCheck, true);
        assert.match(t.statuses.at(-1), /pas de connexion Internet/);
        await t.sync.check();
        assert.equal(t.sync.getState().needsCheck, false);
        assert.equal(t.store.get().char_level, '5');
    });

    test('Fiche liée au compte d\'une autre personne : jamais ajoutée ni chargée en douce', async () => {
        const local = sheet('Korgul', { hp_current: '1' });
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '9' }), T1, OTHER.id)]);
        const t = tab({ db, storage: linkedStorage(sheet('Korgul')), character: local });
        await t.sync.setUser(OTHER);
        assert.equal(t.sync.getState().detached, true);
        assert.equal(t.store.get().hp_current, '1');
        assert.deepEqual(writes(db), []);
    });
});

describe('Envoi des modifications', () => {
    test('Modification normale : mise à jour conditionnelle, y compris avec l\'heure fixée par le serveur', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)], { serverClock: '2026-10-25T08:00:00.000Z' });
        const t = tab({ db, storage: linkedStorage(online), character: online });
        await t.sync.setUser(U);
        t.store.update({ hp_current: '12' });
        await t.runTimers();
        t.store.update({ hp_current: '11' });
        await t.runTimers();
        assert.equal(cloud(db, 'Korgul').data.hp_current, '11');
        assert.deepEqual(t.asked, []);
        assert.equal(t.sync.getState().dirty, false);
    });

    test('Création puis modification avec l\'heure fixée par le serveur : pas de faux conflit', async () => {
        const db = fakeSupabase([], { serverClock: '2026-10-25T08:00:00.000Z' });
        const t = tab({ db });
        await t.sync.setUser(U);
        t.store.replace(sheet('Hedera'));
        await t.runTimers();
        t.store.update({ hp_current: '4' });
        await t.runTimers();
        assert.equal(cloud(db, 'Hedera').data.hp_current, '4');
        assert.deepEqual(t.asked, []);
    });

    test('Appareil resté ouvert : la version plus récente n\'est pas écrasée', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online });
        await t.sync.setUser(U);
        db.touch('Korgul', U.id, sheet('Korgul', { char_level: '6' }), T1);
        t.store.update({ hp_current: '1' });
        await t.runTimers();
        assert.equal(t.asked.at(-1).kind, 'conflict');
        assert.equal(cloud(db, 'Korgul').data.char_level, '6');
    });

    test('Conflit : « garder celle du navigateur » remplace ; une saisie pendant l\'envoi reste à envoyer', async () => {
        const online = sheet('Korgul');
        let t;
        const db = fakeSupabase([row('Korgul', online, T0)], {
            onWrite: (op) => { if (op === 'update' && t?.asked.length) t.store.update({ hp_temp: '5' }); }
        });
        t = tab({ db, storage: linkedStorage(online), character: online, answers: ['local'] });
        await t.sync.setUser(U);
        db.touch('Korgul', U.id, sheet('Korgul', { char_level: '6' }), T1);
        t.store.update({ hp_current: '1' });
        await t.runTimers();
        assert.equal(cloud(db, 'Korgul').data.hp_current, '1');
        assert.equal(t.sync.getState().dirty, true, 'la saisie faite pendant la requête n\'est pas marquée envoyée');
        await t.runTimers();
        assert.equal(cloud(db, 'Korgul').data.hp_temp, '5');
    });

    test('Supprimée ailleurs : question ; « remettre » la recrée', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online, answers: ['recreate'] });
        await t.sync.setUser(U);
        db.table.splice(0, 1);
        t.store.update({ hp_current: '4' });
        await t.runTimers();
        assert.equal(t.asked.at(-1).kind, 'missing');
        assert.equal(cloud(db, 'Korgul').data.hp_current, '4');
    });

    test('Déconnexion pendant une question : la réponse est ignorée, rien n\'est écrit', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)]);
        let t;
        t = tab({ db, storage: linkedStorage(online), character: online, answers: [() => { t.sync.setUser(null); return Promise.resolve('local'); }] });
        await t.sync.setUser(U);
        db.touch('Korgul', U.id, sheet('Korgul', { char_level: '6' }), T1);
        t.store.update({ hp_current: '1' });
        await t.runTimers();
        assert.equal(cloud(db, 'Korgul').data.char_level, '6');
        assert.ok(!t.statuses.some(s => /Cannot read/.test(s)));
    });
});

describe('Nouvelle fiche et import', () => {
    test('Nouvelle fiche : pas remplacée par le dernier personnage au retour sur l\'onglet', async () => {
        const db = fakeSupabase([row('Korgul', sheet('Korgul'), T0)]);
        const t = tab({ db, storage: linkedStorage(sheet('Korgul')), character: sheet('Korgul') });
        await t.sync.setUser(U);
        t.store.replace(createDefaultCharacter());       // « Nouvelle fiche »
        await t.sync.check();                            // retour sur l'onglet / réseau revenu
        assert.equal(t.store.get().char_name, '');
        assert.ok(!t.statuses.some(s => s.startsWith('⚠️')), 'aucune erreur');
        assert.deepEqual(t.asked, []);
    });

    test('Nouvelle fiche nommée comme un personnage existant : question, rien n\'est écrasé', async () => {
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '5' }), T0)]);
        const t = tab({ db, storage: linkedStorage(sheet('Korgul', { char_level: '5' })), character: sheet('Korgul', { char_level: '5' }) });
        await t.sync.setUser(U);
        t.store.replace(createDefaultCharacter());
        t.store.update({ char_name: 'Korgul' });
        await t.sync.nameCommitted();
        t.store.update({ hp_current: '1' });
        await t.runTimers();
        assert.equal(t.asked[0].kind, 'exists');
        assert.equal(cloud(db, 'Korgul').data.char_level, '5');
        assert.equal(t.sync.getState().detached, true);
    });

    test('Import d\'un fichier existant pendant qu\'un envoi attend : l\'envoi est annulé', async () => {
        const online = sheet('Korgul', { char_level: '5' });
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online });
        await t.sync.setUser(U);
        t.store.update({ hp_current: '9' });
        t.store.replace(sheet('Korgul', { char_level: '1' }));
        await t.runTimers();
        assert.equal(t.asked.at(-1).kind, 'exists');
        assert.equal(cloud(db, 'Korgul').data.char_level, '5');
        assert.deepEqual(writes(db).map(w => w.op), ['insert']);
    });

    test('Aucun envoi tant qu\'une question est ouverte', async () => {
        let answer;
        const online = sheet('Korgul', { char_level: '5' });
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online, answers: [() => new Promise(r => { answer = r; })] });
        await t.sync.setUser(U);
        t.store.replace(sheet('Korgul', { char_level: '1' }));
        await t.runTimers();
        assert.deepEqual(t.asked.map(a => a.kind), ['exists']);
        t.store.update({ hp_current: '2' });
        await t.runTimers();
        assert.equal(cloud(db, 'Korgul').data.char_level, '5');
        answer(null);
        await settle();
        assert.equal(cloud(db, 'Korgul').data.char_level, '5');
        assert.equal(t.sync.getState().detached, true);
        assert.deepEqual(db.calls.filter(c => c.op === 'update'), []);
    });

    test('Import d\'un fichier identique à la version en ligne : liée sans question', async () => {
        const online = sheet('Korgul', { char_level: '5' });
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db });
        await t.sync.setUser(U);
        t.store.replace({ ...online });
        await t.runTimers();
        assert.deepEqual(t.asked, []);
        assert.equal(t.sync.getState().name, 'Korgul');
    });

    test('Import : « remplacer la version en ligne » seulement si on le choisit', async () => {
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '5' }), T0)]);
        const t = tab({ db, answers: ['replace'] });
        await t.sync.setUser(U);
        t.store.replace(sheet('Korgul', { char_level: '1' }));
        await t.runTimers();
        assert.equal(cloud(db, 'Korgul').data.char_level, '1');
        assert.equal(t.sync.getState().name, 'Korgul');
    });
});

describe('Renommage', () => {
    const setupRename = (answers) => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0), row('Iria', sheet('Iria', { char_level: '9' }), T0)]);
        return tab({ db, storage: linkedStorage(online), character: online, answers });
    };

    test('Pendant la saisie du nom, un envoi programmé ne déclenche pas de renommage', async () => {
        const t = setupRename(['rename']);
        await t.sync.setUser(U);
        t.store.update({ hp_current: '5' });
        t.store.update({ char_name: 'Korgul l' });       // en train de taper
        await t.runTimers();
        assert.deepEqual(t.asked, []);
        assert.ok(!t.db.table.some(r => r.name === 'Korgul l'));
        t.store.update({ char_name: 'Korgul le Brave' });
        await t.sync.nameCommitted();                    // champ quitté
        assert.equal(t.asked[0].kind, 'rename');
        assert.ok(t.db.table.some(r => r.name === 'Korgul le Brave'));
    });

    test('Vers un nom déjà pris : refusé, ancien nom remis, rien n\'est écrasé', async () => {
        const t = setupRename([]);
        await t.sync.setUser(U);
        t.store.update({ char_name: 'Iria' });
        await t.sync.nameCommitted();
        assert.equal(t.asked[0].kind, 'rename-taken');
        assert.equal(t.store.get().char_name, 'Korgul');
        assert.equal(cloud(t.db, 'Iria').data.char_level, '9');
        assert.ok(cloud(t.db, 'Korgul'));
    });

    test('« Renommer » : nouvelle fiche créée puis ancienne supprimée', async () => {
        const t = setupRename(['rename']);
        await t.sync.setUser(U);
        t.store.update({ char_name: 'Korgul II' });
        await t.sync.nameCommitted();
        assert.deepEqual(t.db.table.map(r => r.name).sort(), ['Iria', 'Korgul II']);
        assert.equal(t.sync.getState().name, 'Korgul II');
    });

    test('« Renommer » : l\'ancienne fiche modifiée ailleurs entre-temps est conservée', async () => {
        const t = setupRename(['rename']);
        await t.sync.setUser(U);
        t.db.touch('Korgul', U.id, sheet('Korgul', { char_level: '7' }), T1);
        t.store.update({ char_name: 'Korgul II' });
        await t.sync.nameCommitted();
        assert.ok(cloud(t.db, 'Korgul'));
        assert.ok(cloud(t.db, 'Korgul II'));
    });

    test('« Créer une copie » : les deux existent', async () => {
        const t = setupRename(['copy']);
        await t.sync.setUser(U);
        t.store.update({ char_name: 'Korgul (copie)' });
        await t.sync.nameCommitted();
        assert.ok(cloud(t.db, 'Korgul'));
        assert.ok(cloud(t.db, 'Korgul (copie)'));
    });

    test('Fenêtre fermée sans choix : ancien nom remis et la modification en attente est envoyée', async () => {
        const t = setupRename([null]);
        await t.sync.setUser(U);
        t.store.update({ hp_current: '5' });
        t.store.update({ char_name: 'Kor' });
        await t.sync.nameCommitted();
        assert.equal(t.store.get().char_name, 'Korgul');
        await t.runTimers();
        assert.equal(cloud(t.db, 'Korgul').data.hp_current, '5');
        assert.ok(!cloud(t.db, 'Kor'));
    });

    test('Nom très long (fiche v3) : pas de question en boucle', async () => {
        const longName = `Korgul ${'x'.repeat(150)}`;
        const db = fakeSupabase([row(longName, sheet(longName), T0)]);
        const t = tab({ db });
        await t.sync.setUser(U);
        t.store.update({ hp_current: '3' });
        await t.runTimers();
        assert.deepEqual(t.asked, []);
        assert.equal(cloud(db, longName).data.hp_current, '3');
    });
});

describe('Deux onglets dans le même navigateur', () => {
    test('L\'onglet A (Korgul) et l\'onglet B (Iria) : après rechargement, aucun mélange des personnages', async () => {
        const korgul = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', korgul, T0), row('Iria', sheet('Iria', { char_level: '9' }), T0)]);
        const storage = linkedStorage(korgul);
        storage.set(CHAR_KEY, JSON.stringify(korgul));
        const a = tab({ db, storage, character: korgul });
        const b = tab({ db, storage, character: korgul });
        await a.sync.setUser(U);
        await b.sync.setUser(U);
        await b.sync.open('Iria');                       // B ouvre Iria (enregistré : Iria + sa base)
        a.store.update({ hp_current: '4' });             // A modifie Korgul…
        await a.runTimers();                             // …et l'envoie (enregistre : Korgul + sa base)
        const r = a.reload();
        await r.sync.setUser(U);
        r.store.update({ hp_temp: '1' });
        await r.runTimers();
        assert.equal(cloud(db, 'Iria').data.char_level, '9', 'Iria intacte');
        assert.equal(cloud(db, 'Korgul').data.char_name, 'Korgul');
        assert.equal(cloud(db, 'Korgul').data.char_level, '1', 'Korgul n\'a pas reçu les données d\'Iria');
        assert.equal(r.store.get().char_name, 'Korgul');
        assert.equal(cloud(db, 'Korgul').data.hp_temp, '1');
    });

    test('Onglet resté sur une ancienne version : son envoi est refusé, question posée', async () => {
        const korgul = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', korgul, T0)]);
        const storage = linkedStorage(korgul);
        const a = tab({ db, storage, character: korgul });
        const b = tab({ db, storage, character: korgul });
        await a.sync.setUser(U);
        await b.sync.setUser(U);
        a.store.update({ char_level: '6' });
        await a.runTimers();
        b.store.update({ hp_current: '2' });
        await b.runTimers();
        assert.equal(b.asked.at(-1).kind, 'conflict');
        assert.equal(cloud(db, 'Korgul').data.char_level, '6');
    });
});

describe('Mes personnages', () => {
    test('Ouvrir alors que la fiche n\'est pas en ligne (même nom, gardée hors ligne) : question', async () => {
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '5' }), T0)]);
        const t = tab({ db });
        await t.sync.setUser(U);
        t.store.replace(sheet('Korgul', { hp_current: '3' }));
        await t.runTimers();                             // « existe déjà » → fermée → hors ligne
        assert.equal(t.sync.getState().detached, true);
        await t.sync.open('Korgul');
        assert.equal(t.asked.at(-1).kind, 'replace-unsynced');
        assert.equal(t.store.get().hp_current, '3');
    });

    test('Ouvrir depuis une fiche liée et à jour : sans question', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0), row('Iria', sheet('Iria'), T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online });
        await t.sync.setUser(U);
        await t.sync.open('Iria');
        assert.deepEqual(t.asked, []);
        assert.equal(t.store.get().char_name, 'Iria');
    });

    test('Supprimer le personnage ouvert : la fiche reste, et n\'est pas renvoyée en ligne au rechargement', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const storage = linkedStorage(online);
        const t = tab({ db, storage, character: online });
        await t.sync.setUser(U);
        await t.sync.remove('Korgul');
        assert.equal(db.table.length, 0);
        assert.equal(t.store.get().char_name, 'Korgul');
        const again = t.reload();
        await again.sync.setUser(U);
        again.store.update({ hp_current: '1' });
        await again.runTimers();
        assert.equal(db.table.length, 0);
        assert.equal(again.sync.getState().detached, true);
    });

    test('Remettre en ligne une fiche gardée hors ligne', async () => {
        const storage = memoryStorage({ [SYNC_KEY]: JSON.stringify({ name: '', userId: U.id, updatedAt: null, hash: '', detached: true }) });
        const db = fakeSupabase([]);
        const t = tab({ db, storage, character: sheet('Hedera') });
        await t.sync.setUser(U);
        assert.equal(db.table.length, 0);
        await t.sync.reattach();
        assert.equal(db.table[0].name, 'Hedera');
    });

    test('Chargement d\'une fiche v3 au nom mis en forme : nom aligné, pas « modifiée »', async () => {
        const v3 = { ...sheet(''), char_name: '<div>Kor</div><div>gul</div>' };
        const db = fakeSupabase([row('Kor gul', v3, T0)]);
        const t = tab({ db });
        await t.sync.setUser(U);
        assert.equal(characterName(t.store.get()), 'Kor gul');
        assert.equal(t.sync.getState().dirty, false);
    });
});

describe('Changement de fiche pendant une opération en ligne', () => {
    test('« Nouvelle fiche » pendant un envoi : la fiche vierge n\'est pas liée à Korgul, Korgul intact', async () => {
        const korgul = sheet('Korgul', { char_level: '7' });
        let t;
        let replaced = false;
        const db = fakeSupabase([row('Korgul', korgul, T0)], {
            onWrite: (op) => { if (op === 'update' && !replaced) { replaced = true; t.store.replace(createDefaultCharacter()); } }
        });
        t = tab({ db, storage: linkedStorage(korgul), character: korgul, answers: ['rename'] });
        await t.sync.setUser(U);
        t.store.update({ hp_current: '6' });
        await t.runTimers();                         // envoi de Korgul… pendant lequel on fait « Nouvelle fiche »
        assert.equal(t.sync.getState().name, '');
        t.store.update({ char_name: 'Zed' });
        await t.sync.nameCommitted();
        assert.ok(!t.asked.some(a => a.kind === 'rename'), 'aucune question de renommage');
        assert.equal(cloud(db, 'Korgul').data.char_level, '7', 'Korgul intact en ligne');
        assert.ok(cloud(db, 'Zed'), 'la nouvelle fiche est créée sous son propre nom');
    });

    test('Import pendant un envoi : les données importées ne vont jamais dans Korgul', async () => {
        const korgul = sheet('Korgul', { char_level: '7' });
        let t;
        let replaced = false;
        const db = fakeSupabase([row('Korgul', korgul, T0), row('Bob', sheet('Bob', { char_level: '2' }), T0)], {
            onWrite: (op) => { if (op === 'update' && !replaced) { replaced = true; t.store.replace(sheet('Bob', { char_level: '3' })); } }
        });
        t = tab({ db, storage: linkedStorage(korgul), character: korgul });
        await t.sync.setUser(U);
        t.store.update({ hp_current: '6' });
        await t.runTimers();
        await t.sync.check();
        assert.equal(cloud(db, 'Korgul').data.char_name, 'Korgul');
        assert.equal(cloud(db, 'Bob').data.char_level, '2', 'Bob en ligne non remplacé sans accord');
    });

    test('« Nouvelle fiche » pendant la vérification : pas de question sur Korgul, Korgul intact', async () => {
        const korgul = sheet('Korgul', { hp_current: '9' });
        let t;
        let replaced = false;
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '6' }), T1)], {
            onSelect: () => { if (t && !replaced && t.sync.getState().user) { replaced = true; t.store.replace(createDefaultCharacter()); } }
        });
        t = tab({ db, storage: linkedStorage(sheet('Korgul')), character: korgul, answers: ['local'] });
        await t.sync.setUser(U);
        assert.deepEqual(t.asked, []);
        assert.equal(cloud(db, 'Korgul').data.char_level, '6');
        assert.equal(t.store.get().char_name, '');
    });

    test('Fiche enregistrée sans correspondre à sa base (autre onglet, ancien site) : le lien est oublié', async () => {
        const db = fakeSupabase([row('Korgul', sheet('Korgul', { char_level: '7' }), T0), row('Bob', sheet('Bob', { char_level: '2' }), T0)]);
        const korgulHash = fingerprint(sheet('Korgul', { char_level: '7' }));
        const storage = memoryStorage({
            [SYNC_KEY]: JSON.stringify({ name: 'Korgul', userId: U.id, updatedAt: T0, hash: korgulHash, detached: false, charHash: korgulHash })
        });
        const t = tab({ db, storage, character: sheet('Bob', { char_level: '4' }) });  // la fiche enregistrée est Bob
        await t.sync.setUser(U);
        assert.equal(t.asked[0]?.kind, 'exists', 'question prudente sur Bob, pas de renommage de Korgul');
        assert.equal(cloud(db, 'Korgul').data.char_level, '7');
        assert.equal(cloud(db, 'Bob').data.char_level, '2');
    });

    test('Changement de compte pendant un envoi : rien n\'est lié ni copié dans l\'autre compte', async () => {
        const korgul = sheet('Korgul');
        let t;
        let switched = false;
        const db = fakeSupabase([row('Korgul', korgul, T0)], {
            onWrite: (op) => { if (op === 'update' && !switched) { switched = true; t.sync.setUser(OTHER); } }
        });
        t = tab({ db, storage: linkedStorage(korgul), character: korgul, answers: ['recreate'] });
        await t.sync.setUser(U);
        t.store.update({ hp_current: '6' });
        await t.runTimers();
        assert.ok(!db.table.some(r => r.user_id === OTHER.id), 'rien dans le compte de l\'autre personne');
    });
});

describe('Saisie du nom et retours sur l\'onglet', () => {
    test('Nom à moitié tapé au moment d\'un retour sur l\'onglet : ni renommage ni création', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online });
        await t.sync.setUser(U);
        t.sync.setNameEditing(true);
        t.store.update({ char_name: 'Ko' });
        await t.sync.check();
        assert.deepEqual(t.asked, []);
        assert.ok(!cloud(db, 'Ko'));
        t.store.replace(createDefaultCharacter());
        t.sync.setNameEditing(true);
        t.store.update({ char_name: 'Ze' });
        await t.sync.check();
        await t.runTimers();
        assert.ok(!cloud(db, 'Ze'), 'pas de création sous un nom en cours de saisie');
    });

    test('Sa propre sauvegarde revenue puis nouvelles modifications : pas de faux conflit', async () => {
        const online = sheet('Korgul');
        let lose = true;
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online });
        await t.sync.setUser(U);
        // L'envoi arrive au serveur mais la réponse est perdue (iPad mis en veille)
        const realFrom = db.from;
        db.from = () => {
            const b = realFrom();
            const realThen = b.then;
            b.then = (res, rej) => realThen.call(b, (out) => {
                if (lose && db.calls.at(-1)?.op === 'update') { lose = false; return rej(new TypeError('Failed to fetch')); }
                return res(out);
            }, rej);
            return b;
        };
        t.store.update({ hp_current: '5' });
        await t.runTimers();
        db.from = realFrom;
        t.store.update({ hp_temp: '2' });              // nouvelle modification
        await t.runTimers();                           // refusé (version en ligne = notre envoi perdu) → base reprise
        await t.runTimers();                           // renvoi automatique suivant
        assert.ok(!t.asked.some(a => a.kind === 'conflict'), 'pas de faux conflit');
        assert.equal(cloud(db, 'Korgul').data.hp_current, '5');
        assert.equal(cloud(db, 'Korgul').data.hp_temp, '2');
    });
});

describe('Robustesse', () => {
    test('Une erreur d\'affichage ne bloque pas la synchronisation', async () => {
        const online = sheet('Korgul');
        const db = fakeSupabase([row('Korgul', online, T0)]);
        const t = tab({ db, storage: linkedStorage(online), character: online });
        const originalError = console.error;
        console.error = () => {};
        let thrown = 0;
        t.sync.onChange(() => { if (thrown++ < 3) throw new Error('affichage'); });
        await t.sync.setUser(U);
        t.store.update({ hp_current: '4' });
        await t.runTimers();
        console.error = originalError;
        assert.equal(cloud(db, 'Korgul').data.hp_current, '4');
    });

    test('Actions de « Mes personnages » sans connexion : message clair, pas d\'erreur', async () => {
        const t = tab({ db: fakeSupabase([]), character: sheet('Korgul') });
        await t.sync.open('Iria');
        await t.sync.remove('Iria');
        assert.ok(t.statuses.length > 0 && t.statuses.every(s => /Connectez-vous/.test(s)));
    });
});
