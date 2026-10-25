// =============================================================================
// SPELLS.JS - Chargement à la demande de la base de sorts (data/spells.json, ~450 Ko)
//
// Format d'un sort : { name, vo, level, school, castTime, range, duration,
//                      components, concentration, ritual, classes: ['bard', ...], desc }
// =============================================================================

let cache = null;

/**
 * @returns {Promise<Array<Object>>} Liste des sorts (tableau vide si le chargement échoue)
 */
export function loadSpells() {
    if (!cache) {
        cache = fetch(new URL('../../data/spells.json', import.meta.url))
            .then(response => (response.ok ? response.json() : []))
            .catch(() => []);
    }
    return cache;
}
