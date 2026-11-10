// =============================================================================
// UPDATE-CHECK.JS - Comparaison de versions (fonctions pures, testées)
// Utilisé par js/ui/update.js : la page chargée (js/version.js) est-elle plus ancienne que le
// site en ligne (package.json) ?
// =============================================================================

/**
 * « 4.32.0 » → [4, 32, 0] ; null si le texte n'est pas une version (fichier abîmé, page d'erreur).
 * @param {unknown} text
 * @returns {number[]|null}
 */
export function parseVersion(text) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(text ?? '').trim());
    return match ? match.slice(1).map(Number) : null;
}

/**
 * La version en ligne est-elle plus récente que celle de la page ?
 * Version illisible d'un côté ou de l'autre : non (on ne recharge jamais sur un doute).
 * @param {unknown} remote
 * @param {unknown} local
 * @returns {boolean}
 */
export function isNewerVersion(remote, local) {
    const a = parseVersion(remote);
    const b = parseVersion(local);
    if (!a || !b) return false;
    for (let i = 0; i < 3; i += 1) {
        if (a[i] !== b[i]) return a[i] > b[i];
    }
    return false;
}

/**
 * Fichiers de l'application à recharger (même site, code et styles), sans doublon ni paramètre
 * d'adresse : ceux que le navigateur garde en mémoire et réutiliserait au rechargement.
 * @param {string[]} urls - adresses chargées par la page (performance.getEntriesByType('resource'))
 * @param {string} origin - origine de la page (location.origin)
 * @returns {string[]}
 */
export function appFilesToRefresh(urls, origin) {
    const files = new Set();
    for (const raw of urls) {
        let url;
        try {
            url = new URL(raw);
        } catch {
            continue;
        }
        if (url.origin !== origin || !/\.(js|css|html|json)$/i.test(url.pathname)) continue;
        files.add(url.origin + url.pathname);
    }
    return [...files];
}
