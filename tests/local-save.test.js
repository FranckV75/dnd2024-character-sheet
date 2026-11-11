/**
 * TESTS — PLUSIEURS ONGLETS OUVERTS SUR LA FICHE (js/state/local-save.js, other-tab.js)
 * Navigateur simulé (tests/helpers/tabs.js) : vrai enregistrement automatique, vrai contrôleur
 * de synchronisation, faux Supabase, ordre des événements « storage » mesuré dans Edge.
 * Chaque scénario relevé par la relecture du lot B a son test.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser, deferred, settle } from './helpers/tabs.js';
import { fakeSupabase } from './helpers/fake-supabase.js';
import { sheetFingerprint, SYNC_KEY } from '../js/cloud/controller.js';
import { STORAGE_KEYS } from '../js/state/persistence.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { createLocalSave } from '../js/state/local-save.js';

const U = { id: 'user-1', email: 'joueur@example.com' };
const T0 = '2026-10-20T10:00:00.000Z';
const K = { ...createDefaultCharacter(), char_name: 'Korgul', hp_current: '12' };

/** Fiche « Korgul » enregistrée dans le navigateur et liée à sa version en ligne */
function linkedSetup() {
    const db = fakeSupabase([{ user_id: U.id, name: 'Korgul', data: K, updated_at: T0 }]);
    const browser = createBrowser({
        [STORAGE_KEYS.character]: JSON.stringify(K),
        [SYNC_KEY]: JSON.stringify({
            name: 'Korgul', userId: U.id, updatedAt: T0, hash: sheetFingerprint(K), sentHashes: [], detached: false, charHash: sheetFingerprint(K)
        })
    });
    return { db, browser };
}

const linkedName = (tab) => tab.sync.getState().name;

describe('Deux onglets : enregistrement dans le navigateur', () => {
    test('Saisies sur deux champs, l\'une après l\'autre : les deux sont gardées partout', async () => {
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(K) });
        const A = browser.openTab({ name: 'A' });
        const B = browser.openTab({ name: 'B' });
        A.store.update({ gp: '1' });
        await browser.advance(600);
        await browser.deliver();
        B.store.update({ sp: '2' });
        await browser.advance(600);
        await browser.deliver();
        assert.equal(browser.stored().gp, '1');
        assert.equal(browser.stored().sp, '2');
        assert.equal(A.store.get().sp, '2');
        assert.deepEqual(A.messages, ['Fiche mise à jour depuis un autre onglet', 'Fiche mise à jour depuis un autre onglet'].slice(0, A.messages.length));
    });

    test('Deux onglets qui enregistrent au même instant (onglets en arrière-plan) : aucune saisie perdue', async () => {
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(K) });
        const A = browser.openTab({ name: 'A' });
        const B = browser.openTab({ name: 'B' });
        A.store.update({ pp: '104' });
        B.store.update({ hp_temp: '14' });
        await browser.advance(600);       // les deux minuteries partent dans le même tic
        await browser.deliver();
        await browser.advance(600);
        await browser.deliver();
        for (const sheet of [browser.stored(), A.store.get(), B.store.get()]) {
            assert.equal(sheet.pp, '104');
            assert.equal(sheet.hp_temp, '14');
        }
    });

    test('Enregistrements simultanés répétés, quelques secondes plus tard : toujours aucune saisie perdue', async () => {
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(K) });
        const A = browser.openTab({ name: 'A' });
        const B = browser.openTab({ name: 'B' });
        for (const round of [1, 2, 3]) {
            for (let i = 0; i < 3; i++) {
                A.store.update({ pp: `${round}0${i}` });
                B.store.update({ hp_temp: `${round}${i}` });
                await browser.advance(300);
            }
            await browser.advance(300);   // les deux enregistrent dans le même tic
            await browser.deliver();
            await browser.advance(600);
            await browser.deliver();
            await browser.advance(4000);
            await browser.deliver();
            for (const sheet of [browser.stored(), A.store.get(), B.store.get()]) {
                assert.deepEqual([sheet.pp, sheet.hp_temp], [`${round}02`, `${round}2`], `tour ${round}`);
            }
        }
    });

    test('Trois onglets avec une saisie en attente chacun : les trois sont gardées', async () => {
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(K) });
        const A = browser.openTab({ name: 'A' });
        const B = browser.openTab({ name: 'B' });
        const C = browser.openTab({ name: 'C' });
        A.store.update({ cp: 'a1' });
        await browser.advance(100);
        B.store.update({ sp: 'b1' });
        C.store.update({ ep: 'c1' });
        await browser.advance(500);       // A enregistre
        await browser.deliver();          // B et C fusionnent (enregistrement différé)
        for (let round = 0; round < 4; round++) {
            await browser.advance(600);   // B et C enregistrent au même instant
            await browser.deliver();
        }
        for (const sheet of [browser.stored(), A.store.get(), B.store.get(), C.store.get()]) {
            assert.deepEqual([sheet.cp, sheet.sp, sheet.ep], ['a1', 'b1', 'c1']);
        }
    });

    test('Après accord des onglets : plus aucune écriture (pas de ping-pong)', async () => {
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(K) });
        const A = browser.openTab({ name: 'A' });
        const B = browser.openTab({ name: 'B' });
        A.store.update({ pp: '1' });
        B.store.update({ hp_temp: '2' });
        await browser.advance(600);
        await browser.deliver();
        await browser.advance(600);
        await browser.deliver();
        const before = A.writes.length + B.writes.length;
        await browser.advance(5000);
        await browser.deliver();
        assert.equal(A.writes.length + B.writes.length, before);
    });

    test('Valeur remise en arrière dans l\'autre onglet, après l\'avoir vue : l\'autre onglet fait foi', async () => {
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(K) });
        const A = browser.openTab({ name: 'A' });
        const B = browser.openTab({ name: 'B' });
        A.store.update({ inspiration: true });
        await browser.advance(600);
        await browser.deliver();
        assert.equal(B.store.get().inspiration, true);
        await browser.advance(100);
        B.store.update({ inspiration: false });   // décochée dans B juste après
        await browser.advance(600);
        await browser.deliver();
        assert.equal(A.store.get().inspiration, false);
        assert.equal(browser.stored().inspiration, false);
    });

    test('Autre personnage ouvert dans l\'autre onglet : la saisie en attente ici n\'y est pas ajoutée, et c\'est signalé', async () => {
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(K) });
        const A = browser.openTab({ name: 'A' });
        const B = browser.openTab({ name: 'B' });
        A.store.update({ gp: '999' });                 // pas encore enregistré
        B.store.replace({ ...createDefaultCharacter(), char_name: 'Iria', gp: '3' }); // import dans B
        await browser.deliver();
        assert.equal(A.store.get().char_name, 'Iria');
        assert.equal(A.store.get().gp, '3');
        await browser.advance(2000);
        await browser.deliver();
        assert.equal(browser.stored().gp, '3');
        assert.match(A.messages.at(-1), /Autre personnage ouvert dans un autre onglet/);
    });
});

describe('Deux onglets : lien avec le compte en ligne', () => {
    test('Saisies simultanées (fusion) : le lien en ligne est gardé, aucune question, tout est envoyé', async () => {
        const { db, browser } = linkedSetup();
        const A = browser.openTab({ name: 'A', db });
        const B = browser.openTab({ name: 'B', db });
        await A.sync.setUser(U);
        await B.sync.setUser(U);
        B.store.update({ sp: '222' });
        await browser.advance(300);
        A.store.update({ gp: '111' });                 // encore dans le délai d'A quand B enregistre
        await browser.advance(300);                    // B enregistre fiche puis base
        await browser.deliver();                       // A : fiche d'abord (base pas encore visible), puis base
        assert.equal(linkedName(A), 'Korgul');
        await browser.advance(600);                    // A enregistre la fusion
        await browser.deliver();
        assert.equal(browser.storedBase().name, 'Korgul');
        assert.equal(linkedName(B), 'Korgul');
        await browser.advance(3000);                   // envoi en ligne
        await browser.deliver();
        await browser.advance(3000);
        await browser.deliver();
        assert.deepEqual(A.asked, []);
        assert.deepEqual(B.asked, []);
        assert.equal(db.table.length, 1);
        assert.equal(db.table[0].data.gp, '111');
        assert.equal(db.table[0].data.sp, '222');
        assert.equal(browser.storedBase().name, 'Korgul');
    });

    test('Nom changé dans A : la question n\'est posée que dans A, B suit sans rien demander', async () => {
        const { db, browser } = linkedSetup();
        const answer = deferred();
        const A = browser.openTab({ name: 'A', db, answers: { rename: () => answer.promise } });
        const B = browser.openTab({ name: 'B', db, answers: { rename: 'rename' } });
        await A.sync.setUser(U);
        await B.sync.setUser(U);
        A.sync.setNameEditing(true);
        A.store.update({ char_name: 'Korgul2' });
        A.sync.nameCommitted();                        // champ quitté : question dans A
        await settle();
        assert.deepEqual(A.asked, ['rename']);
        await browser.advance(600);
        await browser.deliver();
        await B.show();                                // le joueur passe dans B sans répondre
        assert.equal(B.store.get().char_name, 'Korgul2');
        assert.deepEqual(B.asked, []);
        assert.equal(B.sync.getState().renameElsewhere, true);
        B.store.update({ gp: '5' });                   // saisie dans B pendant la question
        await browser.advance(600);
        await browser.deliver();
        answer.resolve('rename');                      // retour dans A : « Renommer »
        await settle();
        await browser.deliver();
        await browser.advance(3000);
        await browser.deliver();
        await B.show();
        await browser.advance(3000);
        await browser.deliver();
        assert.deepEqual(A.asked, ['rename']);
        assert.deepEqual(B.asked, []);
        assert.deepEqual(db.table.map(r => r.name), ['Korgul2']);
        assert.equal(db.table[0].data.gp, '5');
        assert.equal(linkedName(A), 'Korgul2');
        assert.equal(linkedName(B), 'Korgul2');
        assert.equal(B.sync.getState().renameElsewhere, false);
    });

    test('Création en ligne pendant laquelle l\'autre onglet enregistre : la fiche est liée, aucune question', async () => {
        const blank = { ...createDefaultCharacter(), hp_current: '3' };
        let hook = null;
        const db = fakeSupabase([], { onWrite: (op) => { if (op === 'insert' && hook) { const h = hook; hook = null; h(); } } });
        const browser = createBrowser({ [STORAGE_KEYS.character]: JSON.stringify(blank) });
        const A = browser.openTab({ name: 'A', db });
        const B = browser.openTab({ name: 'B', db });
        await A.sync.setUser(U);
        await B.sync.setUser(U);
        A.sync.setNameEditing(true);
        A.store.update({ char_name: 'Korgul' });
        await browser.advance(600);
        await browser.deliver();
        assert.equal(B.store.get().char_name, 'Korgul');
        // Pendant la création en ligne demandée par A, une saisie est enregistrée dans B
        hook = () => {
            B.store.update({ sp: '9' });
            B.local.saveNow();
            browser.deliverNow();
        };
        A.sync.nameCommitted();
        await settle();
        await browser.deliver();
        assert.equal(linkedName(A), 'Korgul');
        assert.equal(linkedName(B), 'Korgul');
        await browser.advance(3000);
        await browser.deliver();
        await browser.advance(3000);
        await browser.deliver();
        assert.deepEqual(A.asked, []);
        assert.deepEqual(B.asked, []);
        assert.equal(db.table.length, 1);
        assert.equal(db.table[0].data.sp, '9');
    });

    test('Une question ouverte dans A est abandonnée si B change le lien entre-temps', async () => {
        const { db, browser } = linkedSetup();
        const answer = deferred();
        const A = browser.openTab({ name: 'A', db, answers: { rename: () => answer.promise } });
        const B = browser.openTab({ name: 'B', db });
        await A.sync.setUser(U);
        await B.sync.setUser(U);
        A.sync.setNameEditing(true);
        A.store.update({ char_name: 'Korgul2' });
        A.sync.nameCommitted();
        await settle();
        assert.equal(A.sync.getState().pending, true);
        // B se détache du compte (« Ne rien faire » sur une autre question, par exemple)
        await browser.advance(600);
        await browser.deliver();
        await B.sync.remove('Korgul');     // B supprime le personnage du compte : lien retiré
        await settle();
        await browser.deliver();
        answer.resolve('rename');          // réponse tardive dans A : ignorée (question abandonnée)
        await settle();
        await browser.deliver();
        assert.deepEqual(db.table.map(r => r.name), []);
    });
});

describe('Stockage du navigateur plein (createLocalSave seul)', () => {
    /** Faux store et faux stockage : setItem échoue pour les clés de `full` */
    function setup({ sheetSaved = true, full = [] } = {}) {
        const sheet = { ...K };
        const store = { get: () => sheet, subscribe() {} };
        const data = new Map([['lien', 'ancien lien']]);
        const storage = {
            getItem: (key) => (data.has(key) ? data.get(key) : null),
            setItem(key, value) {
                if (full.includes(key)) throw new Error('QuotaExceededError');
                data.set(key, String(value));
            },
            removeItem: (key) => { data.delete(key); }
        };
        const calls = [];
        const status = { saved: () => calls.push('saved'), failed: () => calls.push('failed') };
        const save = createLocalSave({
            store, storage, writeSheet: () => sheetSaved, status,
            setTimer: () => 1, clearTimer: () => {}, now: () => 0
        });
        save.saveWithCharacter('lien', () => 'nouveau lien');
        return { save, data, calls };
    }

    test('fiche non enregistrée : « échec » signalé, les données associées ne sont pas touchées', () => {
        const { save, data, calls } = setup({ sheetSaved: false });
        save.saveNow();
        assert.deepEqual(calls, ['failed']);
        assert.equal(data.get('lien'), 'ancien lien');
    });

    test('donnée associée impossible à écrire : l\'ancienne valeur est effacée, pas laissée à côté de la nouvelle fiche', () => {
        const { save, data, calls } = setup({ full: ['lien'] });
        save.saveNow();
        assert.equal(data.has('lien'), false);
        assert.deepEqual(calls, ['saved']);
    });

    test('stockage disponible : la donnée associée est écrite après la fiche', () => {
        const { save, data, calls } = setup();
        save.saveNow();
        assert.equal(data.get('lien'), 'nouveau lien');
        assert.deepEqual(calls, ['saved']);
    });
});
