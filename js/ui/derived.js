// =============================================================================
// DERIVED.JS - Statistiques calculées partagées par les blocs de l'interface
//
// À chaque changement, une vingtaine de blocs (fiche, armes, armures, sorts, repos,
// sous-classe, espèce…) recalculaient chacun deriveCharacter() sur le même personnage :
// 7 fois par frappe. Le store ne modifie jamais un personnage en place (update et replace
// créent un nouvel objet) : le calcul est donc fait une fois par version du personnage et
// réutilisé. Le résultat est partagé : il ne doit pas être modifié (aucun bloc ne le fait).
// =============================================================================

import { deriveCharacter } from '../rules/character.js';

const cache = new WeakMap();

/**
 * deriveCharacter(character), calculé une seule fois pour un même objet personnage.
 * @param {Object} character - personnage du store (jamais modifié en place)
 * @returns {Object}
 */
export function derivedOf(character) {
    if (!character || typeof character !== 'object') return deriveCharacter(character);
    let derived = cache.get(character);
    if (!derived) {
        derived = deriveCharacter(character);
        cache.set(character, derived);
    }
    return derived;
}
