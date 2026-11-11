// =============================================================================
// IDENTITY.JS (règles) - Reconnaissance de la classe d'un personnage
//
// Une seule lecture du nom de classe pour toute la fiche (deriveCharacter, dons, emplacements de
// sorts, changement de classe) : identifiant anglais, nom anglais, nom français actuel ou ancien
// nom français (aliasesFr), sans tenir compte des majuscules ni des espaces autour.
// Ce module ne dépend d'aucune autre règle (feats.js et character.js l'importent tous deux).
//
// Sous-classe : subclassId (js/rules/class-features.js) est la lecture de deriveCharacter ; feats.js
// (subclassOf) et spells.js (sorts du Chevalier occulte et de l'Arnaqueur arcanique) ont encore leur
// propre comparaison (voir docs/ARCHITECTURE.md).
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';

/**
 * Identifiant interne d'une classe à partir de son nom (FR, EN ou identifiant).
 * Le texte n'est pas nettoyé du HTML : l'appelant passe un texte brut.
 * @param {string} className - ex. "Barbare", "Barbarian", "barbarian"
 * @returns {string} - ex. "barbarian", ou "" si inconnue
 */
export function classSlug(className) {
    if (!className) return '';
    const clean = className.toString().trim().toLowerCase();
    for (const [slug, cls] of Object.entries(DD_RULES.classes)) {
        if (slug === clean || DD_RULES.namesOf(cls).some((name) => name.toLowerCase() === clean)) {
            return slug;
        }
    }
    return '';
}
