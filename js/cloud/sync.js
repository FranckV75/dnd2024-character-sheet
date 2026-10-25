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
