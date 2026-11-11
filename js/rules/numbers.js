// =============================================================================
// NUMBERS.JS (règles) - Petits outils sur les nombres, communs à toute la fiche
//  - signed : nombre écrit avec son signe (« +3 », « -1 », « +0 ») ;
//  - rollDie : lancer d'un dé, le hasard étant fourni par l'interface (règles pures et testables).
// =============================================================================

/**
 * Nombre écrit avec son signe : « +3 », « -1 », « +0 » (tiret ordinaire pour le moins).
 * @param {number} n
 * @returns {string}
 */
export const signed = (n) => (n >= 0 ? `+${n}` : String(n));

/**
 * Lancer d'un dé.
 * @param {number} faces
 * @param {() => number} rng - nombre dans [0, 1[ (hasard du navigateur, passé par l'interface)
 * @returns {number} entre 1 et faces
 */
export function rollDie(faces, rng) {
    if (typeof rng !== 'function') throw new TypeError('rollDie : source de hasard manquante');
    const n = Math.max(1, Math.trunc(Number(faces)) || 1);
    const r = Number(rng());
    const unit = Number.isFinite(r) ? Math.min(Math.max(r, 0), 1 - Number.EPSILON) : 0;
    return Math.min(n, 1 + Math.floor(unit * n));
}
