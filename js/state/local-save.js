// =============================================================================
// LOCAL-SAVE.JS - Enregistrement automatique dans le navigateur, plusieurs onglets (sans DOM)
//
// Écriture différée pendant la saisie (delay), mais jamais perdue : main.js la fait tout de
// suite quand la page est masquée (flush). Les données enregistrées EN MÊME TEMPS que la fiche
// (suivi de synchronisation en ligne) sont écrites juste après elle.
//
// Plusieurs onglets ouverts sur la fiche (voir js/state/other-tab.js) : la fiche enregistrée par
// un autre onglet est reprise ici (sans la réécrire), avec les données enregistrées avec elle.
// main.js appelle checkOtherTabs à chaque écriture d'un autre onglet (« storage ») et au retour
// sur l'onglet : Safari peut geler un onglet et manquer ces événements.
//
// Ordre des événements : le navigateur prévient d'une écriture clé par clé. Quand l'événement de
// la fiche arrive, les données enregistrées avec elle (écrites juste après) ne sont souvent pas
// encore visibles ici (mesuré dans Edge : 63 fois sur 64). Elles sont reprises à leur propre
// événement (onStoredChange) ; une fusion n'est donc jamais réenregistrée tout de suite, mais après
// le délai habituel, sinon elle effacerait le lien en ligne enregistré par l'autre onglet.
//
// Testé sans navigateur : tests/local-save.test.js.
// =============================================================================

import { planAdoption } from './other-tab.js';
import { canonicalJSON } from '../cloud/sync.js';
import { STORAGE_KEYS } from './persistence.js';

/** Fiche brute lue dans un texte enregistré (null si illisible) */
function parseStored(text) {
    try {
        const raw = JSON.parse(text || 'null');
        return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
    } catch {
        return null;
    }
}

/**
 * @param {{
 *   store: Object,
 *   storage: { getItem(key): string|null, setItem(key, value): void, removeItem(key): void },
 *   writeSheet: (character: Object) => boolean,   // enregistre la fiche (saveLocal)
 *   knownText?: string|null,                       // texte de la fiche lu au démarrage
 *   delay?: number,
 *   setTimer?: Function, clearTimer?: Function, now?: () => number,
 *   status?: { saved?(): void, changing?(): void, failed?(): void, message?(text: string): void }
 * }} deps
 */
export function createLocalSave({
    store, storage, writeSheet, knownText: bootText = null, delay = 600,
    setTimer = setTimeout, clearTimer = clearTimeout, now = () => performance.now(), status = {}
}) {
    const read = (key) => {
        try {
            return storage.getItem(key);
        } catch {
            return null;
        }
    };

    /** Texte de la fiche que cet onglet a lu ou écrit en dernier */
    let knownText = bootText;
    let saveTimer = null;
    /** Données enregistrées avec la fiche : clé → fonction qui donne la valeur */
    const savedWithCharacter = new Map();
    /** Clé → fonction appelée quand un autre onglet a changé cette donnée sans changer la fiche */
    const storedChangeHandlers = new Map();
    /** Clé → texte que cet onglet a lu ou écrit en dernier */
    const knownValues = new Map();
    /**
     * Champs modifiés dans cet onglet (other-tab.js) : clé → { before : valeur d'avant la saisie
     * (canonicalJSON), pending : pas encore enregistré, savedAt : instant de l'enregistrement }.
     */
    const ownEdits = new Map();
    /** Fiche telle qu'elle était avant la dernière modification (valeur « d'avant » des saisies) */
    let lastState = store.get();

    function saveNow() {
        clearTimer(saveTimer);
        saveTimer = null;
        if (!writeSheet(store.get())) {
            status.failed?.();
            return;
        }
        const savedAt = now();
        for (const edit of ownEdits.values()) {
            if (edit.pending) Object.assign(edit, { pending: false, savedAt });
        }
        knownText = read(STORAGE_KEYS.character);
        for (const [key, getValue] of savedWithCharacter) {
            try {
                storage.setItem(key, getValue());
            } catch {
                // Stockage plein : on efface l'ancienne valeur plutôt que de la laisser à côté
                // d'une fiche qui ne lui correspond plus
                try { storage.removeItem(key); } catch { /* stockage indisponible */ }
            }
            knownValues.set(key, read(key));
        }
        status.saved?.();
    }

    function schedule() {
        clearTimer(saveTimer);
        saveTimer = setTimer(saveNow, delay);
    }

    /**
     * Saisies de cet onglet à garder par-dessus la fiche d'un autre onglet : pas encore
     * enregistrées, ou enregistrées il y a moins de `delay` (l'autre onglet a pu écrire au même
     * instant sans les voir ; au-delà, il les a forcément reçues et sa fiche fait foi).
     */
    function editsToKeep() {
        const at = now();
        const pendingKeys = [];
        const recentEdits = [];
        for (const [key, edit] of ownEdits) {
            if (edit.pending) pendingKeys.push(key);
            else if (at - edit.savedAt < delay) recentEdits.push([key, edit.before]);
            else ownEdits.delete(key);
        }
        return { pendingKeys, recentEdits };
    }

    function checkOtherTabs() {
        const storedText = read(STORAGE_KEYS.character);
        const plan = planAdoption({ storedText, knownText, current: store.get(), ...editsToKeep() });
        if (plan.action === 'none') {
            // Fiche inchangée, mais une donnée associée a pu changer (envoi en ligne fait là-bas)
            for (const [key, onStoredChange] of storedChangeHandlers) {
                const value = read(key);
                if (value === knownValues.get(key)) continue;
                knownValues.set(key, value);
                onStoredChange(parseStored(storedText));
            }
            return plan;
        }
        knownText = storedText;
        // Texte illisible : la fiche de cet onglet est gardée (et réenregistrée à la prochaine saisie)
        if (plan.action === 'ignore') return plan;
        for (const key of savedWithCharacter.keys()) knownValues.set(key, read(key));
        clearTimer(saveTimer);
        saveTimer = null;
        if (plan.changed || plan.merged) {
            // Les saisies de cet onglet sont oubliées (abonné ci-dessous) : celles gardées sont remises après
            store.replace(plan.character, { source: 'other-tab', stored: plan.stored, merged: plan.merged });
        } else {
            ownEdits.clear();
            for (const onStoredChange of storedChangeHandlers.values()) onStoredChange(plan.stored);
        }
        if (plan.merged) {
            // Saisies gardées : enregistrées après le délai habituel (voir l'en-tête)
            for (const key of plan.kept) {
                ownEdits.set(key, { before: canonicalJSON(plan.adopted[key]), pending: true, savedAt: 0 });
            }
            schedule();
        }
        if (plan.dropped) status.message?.('⚠️ Autre personnage ouvert dans un autre onglet : la saisie en cours ici n\'a pas été gardée');
        else if (plan.changed) status.message?.('Fiche mise à jour depuis un autre onglet');
        return plan;
    }

    return {
        /**
         * Ajoute une donnée à enregistrer avec la fiche.
         * @param {string} key
         * @param {() => string} getValue
         * @param {(storedSheet: Object|null) => void} [onStoredChange] - un autre onglet a changé
         *        cette donnée sans changer la fiche (reçoit la fiche brute enregistrée)
         */
        saveWithCharacter(key, getValue, onStoredChange) {
            savedWithCharacter.set(key, getValue);
            knownValues.set(key, read(key));
            if (onStoredChange) storedChangeHandlers.set(key, onStoredChange);
        },
        /** Enregistre tout de suite la fiche (et les données associées) */
        saveNow,
        /** Écrit la sauvegarde en attente, s'il y en a une */
        flush() {
            if (saveTimer !== null) saveNow();
        },
        checkOtherTabs,
        /** L'écriture d'un autre onglet sur cette clé concerne la fiche (événement « storage ») */
        watches(key) {
            return key === null || key === STORAGE_KEYS.character || storedChangeHandlers.has(key);
        },
        /**
         * Branche l'enregistrement automatique. Appelé APRÈS l'initialisation des fonctionnalités :
         * un import est enregistré une fois que chacune a réagi (base en ligne remise à zéro…).
         */
        start() {
            lastState = store.get();
            store.subscribe((state, changedKeys, meta = {}) => {
                const previous = lastState;
                lastState = state;
                if (changedKeys === null) {
                    ownEdits.clear();
                    // Fiche reprise d'un autre onglet : déjà enregistrée là-bas (checkOtherTabs enregistre la fusion)
                    if (meta.source === 'other-tab') return;
                    // Import ou nouvelle fiche : enregistré immédiatement
                    saveNow();
                    return;
                }
                const at = now();
                for (const key of changedKeys) {
                    const edit = ownEdits.get(key);
                    // Saisie enregistrée il y a peu (peut-être pas encore vue ailleurs) : on garde la
                    // valeur d'avant la première saisie ; sinon nouvelle saisie, nouvelle valeur d'avant
                    if (edit && (edit.pending || at - edit.savedAt < delay)) edit.pending = true;
                    else ownEdits.set(key, { before: canonicalJSON(previous[key]), pending: true, savedAt: 0 });
                }
                status.changing?.();
                schedule();
            });
        }
    };
}
