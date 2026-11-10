/**
 * TESTS — SAUVEGARDES DE SECOURS DATÉES (js/state/snapshots.js) et crochet store.beforeReplace
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    takeSnapshot, readSnapshots, saveFreeingSnapshots, snapshotCharacter, formatSnapshotDate,
    reasonForReplace, SNAPSHOTS_KEY, MAX_SNAPSHOTS, SNAPSHOT_REASONS
} from '../js/state/snapshots.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { createStore } from '../js/state/store.js';
import { saveLocal, loadLocal, STORAGE_KEYS } from '../js/state/persistence.js';

/** Stockage simulé ; quota : nombre maximal de caractères pour l'ensemble des valeurs */
function fakeStorage(initial = {}, quota = Infinity) {
    const data = new Map(Object.entries(initial));
    const size = () => [...data.values()].reduce((n, v) => n + v.length, 0);
    return {
        data,
        getItem: (key) => (data.has(key) ? data.get(key) : null),
        setItem(key, value) {
            const text = String(value);
            const before = data.get(key);
            data.set(key, text);
            if (size() > quota) {
                if (before === undefined) data.delete(key); else data.set(key, before);
                throw new Error('QuotaExceededError');
            }
        },
        removeItem: (key) => data.delete(key)
    };
}

const korgul = (extra = {}) => ({ ...createDefaultCharacter(), char_name: 'Korgul', char_level: '5', char_class: 'Barbare', ...extra });
const at = (minutes) => new Date(Date.UTC(2026, 10, 10, 12, minutes));

describe('Sauvegardes de secours : ajout', () => {
    test('Un état est gardé avec sa date, son moment, le nom, le niveau et la classe', () => {
        const storage = fakeStorage();
        assert.deepEqual(takeSnapshot(korgul(), 'open', { storage, now: at(0) }), { saved: true });
        const [entry] = readSnapshots(storage);
        assert.equal(entry.at, at(0).toISOString());
        assert.equal(entry.reason, 'open');
        assert.equal(entry.name, 'Korgul');
        assert.equal(entry.level, '5');
        assert.equal(entry.cls, 'Barbare');
        assert.deepEqual(JSON.parse(entry.text), korgul());
    });

    test('Un état identique au plus récent n\'est pas ajouté (ouvrir la fiche plusieurs fois)', () => {
        const storage = fakeStorage();
        takeSnapshot(korgul(), 'open', { storage, now: at(0) });
        assert.deepEqual(takeSnapshot(korgul(), 'open', { storage, now: at(5) }), { saved: false, why: 'same' });
        assert.equal(readSnapshots(storage).length, 1);
        assert.equal(readSnapshots(storage)[0].at, at(0).toISOString());
    });

    test('Fiche vierge (même avec un réglage de fond ou de thème) : jamais gardée', () => {
        const storage = fakeStorage();
        assert.equal(takeSnapshot(createDefaultCharacter(), 'open', { storage }).why, 'blank');
        const themed = { ...createDefaultCharacter(), _visual_prefs: { theme: 'dark', opacity: '0.9' } };
        assert.equal(takeSnapshot(themed, 'new', { storage }).why, 'blank');
        assert.equal(storage.getItem(SNAPSHOTS_KEY), null);
    });

    test(`Au plus ${MAX_SNAPSHOTS} états : les plus anciens partent, le plus récent est en tête`, () => {
        const storage = fakeStorage();
        for (let i = 0; i < MAX_SNAPSHOTS + 3; i++) takeSnapshot(korgul({ hp_current: String(i) }), 'open', { storage, now: at(i) });
        const list = readSnapshots(storage);
        assert.equal(list.length, MAX_SNAPSHOTS);
        assert.equal(JSON.parse(list[0].text).hp_current, String(MAX_SNAPSHOTS + 2));
        assert.equal(JSON.parse(list.at(-1).text).hp_current, '3');
    });

    test('Place limitée : les plus anciens partent pour respecter la limite de caractères', () => {
        const storage = fakeStorage();
        const size = JSON.stringify(korgul({ hp_current: '1' })).length;
        for (let i = 0; i < 5; i++) takeSnapshot(korgul({ hp_current: String(i) }), 'open', { storage, now: at(i), maxChars: size * 3 + 10 });
        assert.equal(readSnapshots(storage).length, 3);
    });

    test('Fiche trop grosse pour la limite : rien n\'est écrit, les anciens états restent', () => {
        const storage = fakeStorage();
        takeSnapshot(korgul(), 'open', { storage, now: at(0) });
        assert.equal(takeSnapshot(korgul({ notes: 'x'.repeat(5000) }), 'open', { storage, maxChars: 4000 }).why, 'too-big');
        assert.equal(readSnapshots(storage).length, 1);
    });

    test('Stockage plein : les plus anciens sont retirés jusqu\'à ce que le nouvel état passe', () => {
        const one = JSON.stringify([{ at: at(0).toISOString(), reason: 'open', name: 'Korgul', level: '5', cls: 'Barbare', text: JSON.stringify(korgul({ hp_current: '10' })) }]).length;
        const storage = fakeStorage({}, one * 3);
        for (let i = 0; i < 6; i++) takeSnapshot(korgul({ hp_current: String(10 + i) }), 'open', { storage, now: at(i) });
        const kept = readSnapshots(storage).map((entry) => JSON.parse(entry.text).hp_current);
        assert.ok(kept.length >= 1 && kept.length < 6);
        // Les plus récents, dans l'ordre, sans trou : seuls les plus anciens sont partis
        assert.deepEqual(kept, ['15', '14', '13', '12', '11', '10'].slice(0, kept.length));
    });

    test('Stockage plein même pour un seul état : rien de cassé, la fiche reste enregistrée', () => {
        const storage = fakeStorage({ [STORAGE_KEYS.character]: JSON.stringify(korgul()) }, JSON.stringify(korgul()).length + 50);
        assert.deepEqual(takeSnapshot(korgul({ hp_current: '1' }), 'open', { storage }), { saved: false, why: 'storage' });
        assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.character)), korgul());
    });

    test('Contenu déjà dans la liste (même ancien) : pas de doublon, rien n\'est poussé dehors', () => {
        const storage = fakeStorage();
        for (let i = 0; i < MAX_SNAPSHOTS; i++) takeSnapshot(korgul({ hp_current: String(i) }), 'open', { storage, now: at(i) });
        const before = readSnapshots(storage);
        // Retour à l'état « 3 », puis réouverture de la fiche sur cet état
        assert.equal(takeSnapshot(korgul({ hp_current: '3' }), 'open', { storage, now: at(30) }).why, 'same');
        assert.deepEqual(readSnapshots(storage), before);
    });

    test('Seuls les réglages d\'affichage changent (thème, fond) : pas de nouvel état', () => {
        const storage = fakeStorage();
        takeSnapshot(korgul({ _visual_prefs: { theme: 'light' } }), 'open', { storage, now: at(0) });
        assert.equal(takeSnapshot(korgul({ _visual_prefs: { theme: 'dark' } }), 'open', { storage, now: at(1) }).why, 'same');
        assert.equal(readSnapshots(storage).length, 1);
    });

    test('Stockage indisponible (lecture et écriture refusées) : aucune erreur', () => {
        const broken = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('SecurityError'); } };
        assert.deepEqual(readSnapshots(broken), []);
        assert.equal(takeSnapshot(korgul(), 'open', { storage: broken }).saved, false);
        assert.deepEqual(saveFreeingSnapshots(() => false, broken), { saved: false, dropped: 0 });
        assert.equal(takeSnapshot(korgul(), 'open', { storage: null }).saved, false);
    });

    test('Moment inconnu : rangé comme « remplacement de la fiche »', () => {
        const storage = fakeStorage();
        takeSnapshot(korgul(), 'bizarre', { storage });
        assert.equal(readSnapshots(storage)[0].reason, 'replace');
        assert.ok(SNAPSHOT_REASONS.replace);
    });
});

describe('Sauvegardes de secours : lecture', () => {
    test('Liste abîmée ou d\'un autre format : liste vide ou états abîmés ignorés', () => {
        assert.deepEqual(readSnapshots(fakeStorage({ [SNAPSHOTS_KEY]: '{pas du json' })), []);
        assert.deepEqual(readSnapshots(fakeStorage({ [SNAPSHOTS_KEY]: '{"a":1}' })), []);
        const storage = fakeStorage({
            [SNAPSHOTS_KEY]: JSON.stringify([null, 3, { at: 'pas une date', text: '{}' }, { at: at(0).toISOString(), text: '{"char_name":"A"}', name: 7, reason: 'constructor' }])
        });
        const list = readSnapshots(storage);
        assert.equal(list.length, 1);
        assert.equal(list[0].name, '');
        assert.equal(list[0].reason, 'replace');
    });

    test('Un nouvel état s\'ajoute même après une liste abîmée', () => {
        const storage = fakeStorage({ [SNAPSHOTS_KEY]: 'abîmé' });
        assert.equal(takeSnapshot(korgul(), 'open', { storage }).saved, true);
        assert.equal(readSnapshots(storage).length, 1);
    });

    test('Retour à un état : la fiche est relue comme un fichier importé (anciens formats convertis)', () => {
        const storage = fakeStorage();
        takeSnapshot(korgul({ hp_current: '7' }), 'long-rest', { storage });
        const { character } = snapshotCharacter(readSnapshots(storage)[0]);
        assert.equal(character.char_name, 'Korgul');
        assert.equal(character.hp_current, '7');
    });

    test('État illisible : message en français, aucune fiche fabriquée', () => {
        assert.throws(() => snapshotCharacter({ text: '{abîmé' }), /fiche valide/);
        assert.throws(() => snapshotCharacter({ text: '{"x":1}' }), /fiche de personnage/);
        assert.throws(() => snapshotCharacter(null), /fiche valide/);
    });

    test('Date lisible à l\'heure de l\'appareil', () => {
        assert.equal(formatSnapshotDate(new Date(2026, 10, 10, 9, 5).toISOString()), '10/11/2026 à 9 h 05');
        assert.equal(formatSnapshotDate('n\'importe quoi'), '');
    });

});

describe('Sauvegardes de secours : la fiche passe avant', () => {
    /** Sauvegarde de la fiche dans le stockage simulé (comme saveLocal) */
    const saver = (storage, character) => () => {
        try {
            storage.setItem(STORAGE_KEYS.character, JSON.stringify(character));
            return true;
        } catch {
            return false;
        }
    };
    const filled = (quota) => {
        const storage = fakeStorage({}, quota);
        for (let i = 0; i < 4; i++) takeSnapshot(korgul({ hp_current: String(i) }), 'open', { storage, now: at(i) });
        return storage;
    };
    const used = (storage) => [...storage.data.values()].reduce((n, v) => n + v.length, 0);

    test('Place suffisante : rien n\'est retiré', () => {
        const storage = filled(Infinity);
        assert.deepEqual(saveFreeingSnapshots(saver(storage, korgul()), storage), { saved: true, dropped: 0 });
        assert.equal(readSnapshots(storage).length, 4);
    });

    test('Stockage plein : la fiche est enregistrée, les plus récents états sont remis', () => {
        const probe = filled(Infinity);
        const sheetSize = JSON.stringify(korgul({ notes: 'x'.repeat(2000) })).length;
        const storage = filled(used(probe) + sheetSize - 3000);
        const big = korgul({ notes: 'x'.repeat(2000) });
        const result = saveFreeingSnapshots(saver(storage, big), storage);
        assert.equal(result.saved, true);
        assert.ok(result.dropped >= 1 && result.dropped < 4);
        assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.character)), big);
        const kept = readSnapshots(storage).map((entry) => JSON.parse(entry.text).hp_current);
        assert.deepEqual(kept, ['3', '2', '1', '0'].slice(0, kept.length));
    });

    test('La fiche ne tient même pas sans eux : les états sont remis tels quels, rien de perdu', () => {
        const storage = filled(Infinity);
        const before = storage.getItem(SNAPSHOTS_KEY);
        const tight = fakeStorage(Object.fromEntries(storage.data), used(storage) + 10);
        const huge = korgul({ notes: 'x'.repeat(used(storage) * 2) });
        assert.deepEqual(saveFreeingSnapshots(saver(tight, huge), tight), { saved: false, dropped: 0 });
        assert.equal(tight.getItem(SNAPSHOTS_KEY), before);
    });

    test('Aucun état gardé : simple échec', () => {
        const storage = fakeStorage({}, 10);
        assert.deepEqual(saveFreeingSnapshots(saver(storage, korgul()), storage), { saved: false, dropped: 0 });
    });
});

describe('Sauvegardes de secours : sans effet sur la fiche enregistrée', () => {
    test('Clé à part : la fiche du navigateur se lit et s\'enregistre comme avant', () => {
        const storage = fakeStorage();
        saveLocal(korgul(), storage);
        takeSnapshot(korgul({ hp_current: '3' }), 'open', { storage });
        const loaded = loadLocal(storage);
        assert.equal(loaded.character.char_name, 'Korgul');
        assert.equal(loaded.backupKey, undefined);
        assert.ok(!(SNAPSHOTS_KEY in loaded.character));
    });

    test('Moment d\'un remplacement selon sa source', () => {
        assert.equal(reasonForReplace('file'), 'import');
        assert.equal(reasonForReplace('new'), 'new');
        assert.equal(reasonForReplace('cloud'), 'cloud');
        assert.equal(reasonForReplace('snapshot'), 'restore');
        assert.equal(reasonForReplace(undefined), 'replace');
    });
});

describe('store.beforeReplace', () => {
    test('Reçoit la fiche remplacée et la source, avant les abonnés', () => {
        const store = createStore(korgul());
        const seen = [];
        store.beforeReplace((current, meta) => seen.push(['avant', current.char_name, meta.source]));
        store.subscribe((state) => seen.push(['après', state.char_name]));
        store.replace({ ...korgul(), char_name: 'Autre' }, { source: 'file' });
        assert.deepEqual(seen, [['avant', 'Korgul', 'file'], ['après', 'Autre']]);
    });

    test('Une erreur du crochet n\'empêche jamais le remplacement', () => {
        const store = createStore(korgul());
        const original = console.error;
        console.error = () => {};
        try {
            store.beforeReplace(() => { throw new Error('boum'); });
            store.replace({ ...korgul(), char_name: 'Autre' });
        } finally {
            console.error = original;
        }
        assert.equal(store.get().char_name, 'Autre');
    });

    test('Retrait du crochet', () => {
        const store = createStore(korgul());
        let calls = 0;
        const off = store.beforeReplace(() => { calls += 1; });
        store.replace(korgul());
        off();
        store.replace(korgul());
        assert.equal(calls, 1);
    });
});
