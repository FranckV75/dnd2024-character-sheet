// =============================================================================
// STORE.JS - SOURCE UNIQUE DE VÉRITÉ DU PERSONNAGE
//
// L'interface lit le personnage ici et y écrit chaque modification ; elle ne
// sert jamais de stockage. Les abonnés (affichage, sauvegarde automatique...)
// sont prévenus à chaque changement.
// =============================================================================

import { createDefaultCharacter } from './schema.js';

/**
 * Crée un store indépendant (une seule instance est utilisée par l'application,
 * les tests en créent autant qu'ils veulent).
 * @param {Object} [initial]
 */
export function createStore(initial = createDefaultCharacter()) {
    let state = structuredClone(initial);
    const listeners = new Set();

    function notify(changedKeys) {
        for (const listener of listeners) {
            try {
                listener(state, changedKeys);
            } catch (e) {
                console.error('Erreur dans un abonné du store :', e);
            }
        }
    }

    return {
        /** @returns {Object} Le personnage courant (ne pas le modifier directement) */
        get() {
            return state;
        },

        /**
         * Met à jour un ou plusieurs champs.
         * @param {Object} patch - ex. { str_score: '16' }
         */
        update(patch) {
            if (!patch || typeof patch !== 'object') return;
            const changed = Object.keys(patch).filter(key => !Object.is(state[key], patch[key]));
            if (changed.length === 0) return;
            state = { ...state, ...structuredClone(patch) };
            notify(changed);
        },

        /**
         * Remplace tout le personnage (chargement, import, nouvelle fiche).
         * @param {Object} character
         */
        replace(character) {
            state = structuredClone(character);
            notify(null);
        },

        /**
         * @param {(state: Object, changedKeys: string[]|null) => void} listener
         *        changedKeys vaut null quand tout le personnage a été remplacé
         * @returns {() => void} Fonction de désabonnement
         */
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
}
