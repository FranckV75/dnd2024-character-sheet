/**
 * Navigateur simulé avec plusieurs onglets ouverts sur la fiche (sans DOM) : vrai store, vrai
 * enregistrement automatique (js/state/local-save.js), vrai contrôleur de synchronisation, faux
 * Supabase et horloge simulée.
 *
 * Comme Chromium (mesuré dans Edge) : chaque onglet a sa propre vue du stockage, mise à jour clé
 * par clé quand l'événement « storage » de cette clé lui arrive (deliver). Quand l'événement de la
 * fiche est traité, les données écrites juste après (suivi en ligne) ne sont donc pas encore
 * visibles. Une valeur écrite par l'onglet lui-même après celle de l'événement n'est pas remplacée
 * (le navigateur garde la dernière écriture).
 */
import { createStore } from '../../js/state/store.js';
import { createLocalSave } from '../../js/state/local-save.js';
import { loadLocal, saveLocal, STORAGE_KEYS } from '../../js/state/persistence.js';
import { createDefaultCharacter } from '../../js/state/schema.js';
import { createCloudSync, SYNC_KEY } from '../../js/cloud/controller.js';

export const settle = async () => { for (let i = 0; i < 60; i++) await new Promise(r => setImmediate(r)); };

/** Promesse résolue plus tard (réponse à une question donnée au moment choisi par le test) */
export function deferred() {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
}

/**
 * @param {Object<string, string>} initial - contenu du stockage du navigateur
 */
export function createBrowser(initial = {}) {
    let seq = 0;
    const data = new Map(Object.entries(initial).map(([key, value]) => [key, { value: String(value), seq: 0 }]));
    const tabs = [];
    const queue = [];
    let time = 0;
    const timers = new Set();

    const clock = {
        now: () => time,
        setTimer: (fn, ms) => {
            const t = { fn, at: time + ms };
            timers.add(t);
            return t;
        },
        clearTimer: (t) => { timers.delete(t); }
    };

    /** Avance l'horloge : les minuteries arrivées à échéance s'exécutent (événements non livrés) */
    async function advance(ms) {
        const end = time + ms;
        for (;;) {
            const due = [...timers].filter(t => t.at <= end).sort((a, b) => a.at - b.at)[0];
            if (!due) break;
            time = due.at;
            timers.delete(due);
            due.fn();
            await settle();
        }
        time = end;
        await settle();
    }

    /** Livre les événements « storage » en attente, un par un, dans l'ordre des écritures */
    function deliverNow() {
        while (queue.length) {
            const ev = queue.shift();
            for (const t of tabs) {
                if (t === ev.from || t.closed) continue;
                const mine = t.view.get(ev.key);
                if (!mine || mine.seq < ev.seq) t.view.set(ev.key, { value: ev.value, seq: ev.seq });
                if (t.local.watches(ev.key)) t.local.checkOtherTabs();
            }
        }
    }

    async function deliver() {
        deliverNow();
        await settle();
        // Une reprise a pu provoquer d'autres écritures (envoi en ligne terminé…)
        if (queue.length) await deliver();
    }

    /**
     * @param {{ name: string, db?: Object, answers?: Object<string, *> }} opts - answers : réponse
     *        (ou fonction qui renvoie une promesse) par type de question
     */
    function openTab({ name, db = null, answers = {} }) {
        const view = new Map([...data].map(([key, entry]) => [key, { ...entry }]));
        const tab = { name, view, writes: [], asked: [], messages: [], closed: false };
        const storage = {
            getItem: (key) => view.get(key)?.value ?? null,
            setItem: (key, value) => {
                const entry = { value: String(value), seq: ++seq };
                view.set(key, entry);
                data.set(key, entry);
                tab.writes.push(key);
                queue.push({ from: tab, key, ...entry });
            },
            removeItem: (key) => {
                const entry = { value: null, seq: ++seq };
                view.set(key, entry);
                data.set(key, entry);
                queue.push({ from: tab, key, ...entry });
            }
        };
        const loaded = loadLocal(storage);
        const store = createStore(loaded ? loaded.character : createDefaultCharacter());
        const local = createLocalSave({
            store, storage,
            writeSheet: (character) => saveLocal(character, storage, new Date(Date.UTC(2026, 10, 9) + time)),
            knownText: storage.getItem(STORAGE_KEYS.character),
            delay: 600,
            setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: clock.now,
            status: { message: (m) => tab.messages.push(m) }
        });
        let sync = null;
        if (db) {
            sync = createCloudSync({
                client: db, store,
                storage: { get: storage.getItem },
                persist: () => local.saveNow(),
                ui: {
                    ask: (kind, details) => {
                        tab.asked.push(kind);
                        const answer = answers[kind];
                        return typeof answer === 'function' ? answer(details) : Promise.resolve(answer ?? null);
                    },
                    status: (m) => tab.messages.push(m)
                },
                setTimer: clock.setTimer, clearTimer: clock.clearTimer,
                now: () => new Date(Date.UTC(2026, 10, 9) + time + seq)
            });
            local.saveWithCharacter(SYNC_KEY, () => JSON.stringify(sync.getBase()), (raw) => sync.adoptStoredBase(raw));
        }
        local.start();
        Object.assign(tab, {
            store, local, sync, storage,
            /** Retour sur l'onglet (visibilitychange) : main.js puis account.js */
            async show() {
                local.checkOtherTabs();
                if (sync?.getState().user) sync.check();
                await settle();
            }
        });
        tabs.push(tab);
        return tab;
    }

    /** Fiche enregistrée (dernière écriture) */
    const stored = () => JSON.parse(data.get(STORAGE_KEYS.character)?.value ?? 'null');
    /** Base de synchronisation enregistrée */
    const storedBase = () => JSON.parse(data.get(SYNC_KEY)?.value ?? 'null');

    return { openTab, advance, deliver, deliverNow, stored, storedBase, clock, data };
}
