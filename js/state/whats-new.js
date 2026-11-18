// =============================================================================
// WHATS-NEW.JS (règle) - Quelles « Nouveautés » montrer sur cet appareil ? (fonction pure, testée)
//
// L'appareil retient la dernière version dont les nouveautés ont été vues (localStorage,
// SEEN_VERSION_KEY : préférence d'appareil, jamais dans la fiche). Après une mise à jour, la
// fenêtre montre les versions sorties entre cette version et celle de la page.
//  - Aucune version retenue et aucune fiche enregistrée ici (vraie première visite) : rien à
//    montrer, la version est seulement retenue.
//  - Aucune version retenue mais une fiche déjà enregistrée ici (joueur qui avait la fiche avant
//    l'arrivée de cette fenêtre) : les nouveautés de la version installée, elles seules.
//  - Version retenue égale ou plus récente (retour à une ancienne page) : rien, et la version
//    retenue ne recule jamais.
// Utilisé par js/ui/whats-new.js. Comparaison de versions : js/state/update-check.js.
// =============================================================================

import { parseVersion } from './update-check.js';

/** Dernière version dont cet appareil a vu les nouveautés */
export const SEEN_VERSION_KEY = 'dd2024_seen_version';

/** Au plus tant de versions dans la fenêtre (les précédentes restent dans le mode d'emploi) */
export const MAX_NEWS_VERSIONS = 4;

/** < 0 si a est plus ancienne que b, 0 si égales, > 0 si plus récente */
function compareVersions(a, b) {
    for (let i = 0; i < 3; i += 1) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
}

/**
 * @param {Object} options
 * @param {ReadonlyArray<{ version: string, items: ReadonlyArray<string> }>} options.entries - js/data/whats-new.js
 * @param {unknown} options.lastSeen - version retenue sur l'appareil (null si aucune)
 * @param {unknown} options.current - version de la page (js/version.js)
 * @param {boolean} [options.returning] - une fiche était déjà enregistrée sur cet appareil
 * @returns {{ entries: Array<{ version: string, items: ReadonlyArray<string> }>, remember: boolean }}
 *   entries : versions à montrer, la plus récente d'abord ; remember : retenir « current »
 *   (tout de suite s'il n'y a rien à montrer, sinon à la fermeture de la fenêtre)
 */
export function newsToShow({ entries, lastSeen, current, returning = false }) {
    const now = parseVersion(current);
    if (!now) return { entries: [], remember: false };
    const seen = parseVersion(lastSeen);
    if (seen && compareVersions(seen, now) >= 0) return { entries: [], remember: false };

    const known = (entries ?? [])
        .map((entry) => ({ entry, parts: parseVersion(entry?.version) }))
        .filter(({ entry, parts }) => parts && Array.isArray(entry.items) && entry.items.length > 0)
        .sort((a, b) => compareVersions(b.parts, a.parts));

    let shown;
    if (seen) {
        shown = known.filter(({ parts }) => compareVersions(parts, seen) > 0 && compareVersions(parts, now) <= 0);
    } else if (returning) {
        shown = known.filter(({ parts }) => compareVersions(parts, now) === 0);
    } else {
        shown = [];
    }
    return { entries: shown.slice(0, MAX_NEWS_VERSIONS).map(({ entry }) => entry), remember: true };
}
