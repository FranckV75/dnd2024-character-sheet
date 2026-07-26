// =============================================================================
// STORE.JS - GESTIONNAIRE D'ÉTAT CENTRALISÉ (D&D 2024 CHARACTER SHEET)
// =============================================================================

/**
 * État par défaut d'un personnage D&D 2024
 */
export const defaultCharacterState = {
    char_name: "",
    char_class: "",
    char_level: 1,
    char_species: "",
    char_subclass: "",
    char_background: "",
    char_size: "Moyenne",
    char_xp: 0,

    // Caractéristiques principales
    scores: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
    },

    // Maîtrises de sauvegardes
    savesProf: {
        str: false,
        dex: false,
        con: false,
        int: false,
        wis: false,
        cha: false
    },

    // Vitals & Stats dérivés
    ac: 10,
    initiative: 0,
    passive_perception: 10,
    speed: "9m",
    heroic_inspiration: false,

    // Points de vie & Dés de vie
    hp_current: 10,
    hp_max: 10,
    hp_temp: 0,
    hd_type: "d8",
    hd_current: 1,
    hd_max: 1,
    death_saves: {
        successes: [false, false, false],
        failures: [false, false, false]
    },

    // Fatigue D&D 2024
    fatigue_level: 0,

    // Alignement & Rôle
    alignment: "",
    traits_feats: "",
    class_features: "",
    companions: "",
    synergy: "",
    appearance: "",
    backstory: "",

    // Repos & Odyssée
    heroic_destiny: "",
    glory_score: 0,
    vanity_score: "",

    // Compétences, Outils, Langues
    skills: {},
    tools: {},
    languages: [],

    // Dons
    feats: {
        feat_1: "",
        feat_4: "",
        feat_8: "",
        feat_12: "",
        feat_16: "",
        feat_19: ""
    },

    // Équipement & Armures
    weapons: [],
    armors: [],
    prof_armor: {
        light: false,
        med: false,
        heavy: false,
        shield: false
    },

    // Sorts & Magie
    spell_ability: "none",
    spell_class_filter: "",
    spell_slots: {
        lvl1: { current: 0, max: 0 },
        lvl2: { current: 0, max: 0 },
        lvl3: { current: 0, max: 0 },
        lvl4: { current: 0, max: 0 },
        lvl5: { current: 0, max: 0 },
        lvl6: { current: 0, max: 0 },
        lvl7: { current: 0, max: 0 },
        lvl8: { current: 0, max: 0 },
        lvl9: { current: 0, max: 0 }
    },
    spells: []
};

// Instance courante de l'état
let currentState = JSON.parse(JSON.stringify(defaultCharacterState));
const listeners = new Set();

/**
 * Récupère une copie immuable de l'état actuel
 * @returns {Object}
 */
export function getState() {
    return JSON.parse(JSON.stringify(currentState));
}

/**
 * Met à jour l'état centralisé avec un objet partiel et notifie les abonnés
 * @param {Object} partialState
 * @param {Object} [options={ silent: false }]
 */
export function setState(partialState, options = {}) {
    if (!partialState || typeof partialState !== 'object') return;
    
    currentState = mergeState(currentState, partialState);

    if (!options.silent) {
        notifyListeners();
    }
}

/**
 * Réinitialise l'état au personnage vierge
 */
export function resetState() {
    currentState = JSON.parse(JSON.stringify(defaultCharacterState));
    notifyListeners();
}

/**
 * S'abonne aux changements d'état
 * @param {Function} listener 
 * @returns {Function} Unsubscribe function
 */
export function subscribe(listener) {
    if (typeof listener === 'function') {
        listeners.add(listener);
    }
    return () => listeners.delete(listener);
}

/**
 * Notifie tous les abonnés
 */
function notifyListeners() {
    const frozenState = getState();
    listeners.forEach(listener => {
        try {
            listener(frozenState);
        } catch (e) {
            console.error("Erreur dans un abonné du Store:", e);
        }
    });
}

/**
 * Fusionne récursivement deux objets d'état
 */
function mergeState(target, source) {
    const output = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = mergeState(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
    }
    return output;
}
