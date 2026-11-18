// =============================================================================
// EXAMPLES.JS (état) - Fiche complète d'un personnage d'exemple (sans DOM, testé)
//
// Les personnages d'exemple (js/data/examples.js) sont des sauvegardes partielles : ils passent
// par la même conversion qu'un fichier importé (migrateCharacter), qui ajoute les champs absents
// et normalise les valeurs. Chaque appel rend une copie neuve : la fiche ouverte ne partage rien
// avec les données du dépôt.
// Un exemple s'ouvre avec store.replace(fiche, { source: EXAMPLE_SOURCE }) :
//  - la fiche remplacée est d'abord gardée dans « Revenir à… » (main.js, js/state/snapshots.js) ;
//  - la fiche d'exemple n'est liée à aucun personnage en ligne et n'est pas envoyée au compte
//    (js/cloud/controller.js : « gardée dans ce navigateur seulement », jusqu'à
//    « Enregistrer en ligne »).
// =============================================================================

import { EXAMPLE_CHARACTERS } from '../data/examples.js';
import { migrateCharacter } from './migrate.js';

/** Source d'un remplacement de la fiche par un personnage d'exemple (store.replace, meta.source) */
export const EXAMPLE_SOURCE = 'example';

/**
 * Personnages d'exemple proposés, sans leur fiche.
 * @returns {Array<{ id: string, title: string, subtitle: string, pitch: string }>}
 */
export function listExamples() {
    return EXAMPLE_CHARACTERS.map(({ id, title, subtitle, pitch }) => ({ id, title, subtitle, pitch }));
}

/**
 * Fiche complète d'un personnage d'exemple, prête à être ouverte.
 * @param {string} id
 * @returns {Object|null} null si l'identifiant est inconnu
 */
export function exampleCharacter(id) {
    const example = EXAMPLE_CHARACTERS.find((entry) => entry.id === id);
    if (!example) return null;
    return migrateCharacter(structuredClone(example.character)).character;
}
