// =============================================================================
// SYNC.JS - Décisions de synchronisation (fonctions pures, testées)
//
// Principe : pour chaque personnage, le navigateur retient la version en ligne
// qu'il connaît (date updated_at) et l'empreinte du contenu à ce moment-là.
// « Modifiée » = l'empreinte actuelle diffère. On ne remplace jamais une version
// en ligne qui a changé ailleurs sans demander, ni la fiche du navigateur si
// elle contient des modifications non envoyées.
// =============================================================================

const time = (iso) => {
    const t = Date.parse(iso || '');
    return Number.isFinite(t) ? t : null;
};

/**
 * Deux dates updated_at désignent-elles la même version ? (formats possibles :
 * « …Z » envoyé par la fiche, « …+00:00 » renvoyé par la base)
 */
export function sameVersion(a, b) {
    const ta = time(a);
    const tb = time(b);
    return ta !== null && ta === tb;
}

/** JSON aux clés triées (la base PostgreSQL réordonne les clés des objets JSON) */
export function canonicalJSON(value) {
    if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.keys(value).sort().filter(k => value[k] !== undefined)
            .map(k => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(',')}}`;
    }
    return JSON.stringify(value ?? null);
}

/**
 * Empreinte courte du contenu d'une fiche (FNV-1a 32 bits sur le JSON canonique).
 * @param {Object} character
 * @returns {string}
 */
export function fingerprint(character) {
    const text = canonicalJSON(character);
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return `${hash.toString(16)}-${text.length}`;
}

/**
 * Que faire lors d'une vérification (connexion, retour sur l'onglet, retour du réseau) ?
 *
 * @param {{
 *   attachedName: string,       // personnage en ligne auquel la fiche est liée ('' = aucun)
 *   baseUpdatedAt: string|null, // version en ligne connue
 *   dirty: boolean,             // contenu modifié depuis le dernier envoi / chargement
 *   detached: boolean,          // l'utilisateur a choisi de garder cette fiche hors ligne
 *   localIsBlank: boolean,      // fiche vierge
 *   localName: string,          // nom actuel de la fiche
 *   allowLatest: boolean,       // seulement à la connexion : une fiche vierge peut recevoir le dernier personnage
 *   row: {updated_at: string}|null|undefined, // version en ligne du personnage lié (null = n'existe plus)
 *   latest: {name: string}|null|undefined     // personnage en ligne le plus récent
 * }} s
 * @returns {{ action: 'none'|'push'|'load'|'conflict'|'missing'|'load-latest'|'attach', name?: string }}
 */
export function decideOnCheck(s) {
    if (s.detached) return { action: 'none' };

    if (s.attachedName) {
        if (s.row === null) return { action: 'missing', name: s.attachedName };
        if (!s.row) return { action: 'none' };
        if (sameVersion(s.row.updated_at, s.baseUpdatedAt)) {
            return s.dirty ? { action: 'push' } : { action: 'none' };
        }
        // Changée ailleurs (autre appareil, autre onglet, v3)
        return s.dirty ? { action: 'conflict', name: s.attachedName } : { action: 'load', name: s.attachedName };
    }

    // Fiche non liée à un personnage en ligne
    if (s.localIsBlank) {
        return s.allowLatest && s.latest ? { action: 'load-latest', name: s.latest.name } : { action: 'none' };
    }
    if (s.localName) return { action: 'attach' };
    return { action: 'none' };
}

/**
 * Nom à utiliser pour la fiche en ligne : le nom du personnage sans mise en forme
 * (même longueur que la v3, sans troncature). Vide = pas d'envoi en ligne.
 * @param {string} name - déjà nettoyé (characterName())
 * @returns {string}
 */
export function cloudName(name) {
    return String(name || '').trim();
}

/**
 * Un renommage est-il en cours ? (le nom saisi diffère du personnage lié)
 */
export function isRename(attachedName, currentName) {
    return Boolean(attachedName) && Boolean(currentName) && attachedName !== currentName;
}

/**
 * Nom de ligne écrit par la v3 pour la même fiche ? La v3 nommait la ligne d'après le texte
 * affiché du champ Nom, où une mise en forme posée au milieu d'un mot ajoutait un espace
 * (« Korgul B rise-Crâne » pour « Korgul B<i>rise</i>-Crâne ») : mêmes lettres, espaces différents.
 * @param {string} legacyName - nom exact enregistré par la v3 (dd2024_active_char_name)
 * @param {string} name - nom calculé par la v4
 * @returns {boolean}
 */
export function isLegacyRowName(legacyName, name) {
    const a = String(legacyName || '').trim();
    const b = String(name || '').trim();
    return Boolean(a) && Boolean(b) && a !== b && a.replace(/\s+/g, '') === b.replace(/\s+/g, '');
}

/** État de jeu propre à la v4 (bonus de combat, emplacements de sorts) : la v3 l'efface en enregistrant */
export const V4_ONLY_KEYS = Object.freeze(['combat_buffs', 'spell_slots_state']);

/**
 * Fiche sans l'état de jeu propre à la v4, pour comparer avec une version écrite par la v3.
 * @param {Object} character
 * @returns {Object}
 */
export function withoutV4State(character) {
    const copy = { ...(character || {}) };
    for (const key of V4_ONLY_KEYS) delete copy[key];
    return copy;
}

/** Écart en dessous duquel deux dates sont considérées comme la même version (règle de la v3) */
export const SAME_TIME_MS = 5000;

/**
 * Laquelle des deux versions est la plus récente (plus de 5 s d'écart, comme la v3) ?
 * @param {string|null} cloudUpdatedAt
 * @param {string|null} localSavedAt
 * @returns {'cloud'|'local'|null} null si les dates sont proches ou illisibles
 */
export function newerVersion(cloudUpdatedAt, localSavedAt) {
    const cloud = time(cloudUpdatedAt);
    const local = time(localSavedAt);
    if (cloud === null || local === null) return null;
    if (cloud > local + SAME_TIME_MS) return 'cloud';
    if (local > cloud + SAME_TIME_MS) return 'local';
    return null;
}

/**
 * Erreur réseau ou serveur → message compréhensible.
 * @param {*} error
 * @returns {string}
 */
export function friendlyError(error) {
    const raw = String(error?.message || error || '').replace(/<[^>]*>/g, '');
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
        return 'pas de connexion Internet';
    }
    if (/jwt|token|not authenticated|401/i.test(raw)) return 'session expirée, reconnectez-vous';
    if (/cannot read properties|undefined is not|is not a function/i.test(raw)) {
        return 'erreur interne de synchronisation (rien n\'a été écrasé)';
    }
    return raw || 'erreur inconnue';
}
