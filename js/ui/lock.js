// =============================================================================
// LOCK.JS - Mode verrouillé (« cadenas ») : évite les modifications accidentelles en jeu
//
// Verrouillé :
//  - les champs de construction du personnage (caractéristiques, classe, textes...)
//    deviennent non modifiables ;
//  - les champs de JEU restent modifiables (PV, jets contre la mort, ressources,
//    dés de vie, épuisement, inspiration, pièces, emplacements de sorts cochés) ;
//  - tout élément portant la classe .edit-only (boutons d'ajout/suppression...) est masqué ;
//  - le défilement et les infobulles continuent de fonctionner.
// L'état est mémorisé dans le navigateur (même clé que la v3) et signalé par
// l'attribut data-locked="true" sur <body> et l'événement 'dd:lockchange' sur document.
// =============================================================================

const STORAGE_KEY = 'dd2024_lock_mode';

const PLAY_FIELDS = new Set([
    'hp_current', 'hp_temp', 'hd_current', 'heroic_inspiration', 'fatigue_level',
    'ds_s1', 'ds_s2', 'ds_s3', 'ds_f1', 'ds_f2', 'ds_f3',
    'cp', 'sp', 'ep', 'gp', 'pp'
]);

/**
 * Le champ reste-t-il modifiable en mode verrouillé ?
 * @param {string} key - clé data-field
 * @returns {boolean}
 */
export function isPlayField(key) {
    return PLAY_FIELDS.has(key) || key.startsWith('class_res_');
}

export function isLocked() {
    return document.body.dataset.locked === 'true';
}

/**
 * Applique l'état verrouillé / déverrouillé aux champs data-field de `root`.
 * À rappeler après chaque reconstruction de champs (fait par sheet.js après le rendu).
 * @param {ParentNode} root
 */
export function applyLock(root = document) {
    const locked = isLocked();
    for (const field of root.querySelectorAll('[data-field]')) {
        const frozen = locked && !isPlayField(field.dataset.field) && field.dataset.play !== 'true';
        if (field.dataset.kind === 'rich') field.contentEditable = frozen ? 'false' : 'true';
        else if (field.tagName === 'SELECT' || field.type === 'checkbox' || field.type === 'radio') field.disabled = frozen;
        else field.readOnly = frozen;
    }
}

/**
 * @param {boolean} locked
 */
export function setLocked(locked) {
    document.body.dataset.locked = String(Boolean(locked));
    try {
        localStorage.setItem(STORAGE_KEY, String(Boolean(locked)));
    } catch {
        // Stockage indisponible : l'état ne sera pas mémorisé
    }
    applyLock(document);
    document.dispatchEvent(new CustomEvent('dd:lockchange', { detail: { locked: Boolean(locked) } }));
}

export function toggleLocked() {
    setLocked(!isLocked());
}

/** Restaure l'état mémorisé (à appeler une fois au démarrage, après la construction de la fiche) */
export function initLock() {
    let saved = 'false';
    try {
        saved = localStorage.getItem(STORAGE_KEY) || 'false';
    } catch {
        saved = 'false';
    }
    setLocked(saved === 'true');
}
