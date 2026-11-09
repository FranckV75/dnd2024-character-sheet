// =============================================================================
// OTHER-TAB.JS - Fiche enregistrée par un autre onglet du même navigateur (fonction pure)
//
// Tous les onglets ouverts sur la fiche partagent la même sauvegarde du navigateur
// (dd2024_char). Chaque onglet garde sa copie en mémoire et réécrit toute la fiche à chaque
// modification : sans précaution, un onglet resté ouvert effacerait en silence ce qui a été
// tapé dans un autre. main.js compare donc le texte enregistré à celui que l'onglet a lu ou
// écrit en dernier (événement « storage », retour sur l'onglet) et, s'il a changé, reprend
// la fiche enregistrée.
//
// Saisies de cet onglet gardées par-dessus la fiche reprise :
//  - saisie pas encore enregistrée (enregistrement différé de 0,6 s) : toujours gardée. C'est
//    la saisie la plus récente, celle que le joueur voit à l'écran ; si le même champ (ou la
//    même liste : armes, sorts…) a aussi changé dans l'autre onglet, celle d'ici l'emporte ;
//  - saisie enregistrée à l'instant (moins de 0,6 s avant l'arrivée de l'autre fiche) :
//    l'autre onglet a écrit en même temps, sans l'avoir vue (deux enregistrements simultanés,
//    trois onglets ou plus). Elle est gardée si l'autre onglet n'a pas changé ce champ (il y a
//    encore la valeur d'avant la saisie) ; s'il l'a changé, sa valeur, plus récente, l'emporte.
//    Plus tard, l'autre onglet a forcément vu cette saisie : sa fiche fait foi.
// Ainsi deux saisies faites dans deux onglets sur des champs différents sont toutes deux
// gardées, même quand les onglets enregistrent au même instant.
//
// Autre personnage ouvert dans l'autre onglet (nom différent : import, chargement en ligne,
// nouvelle fiche) : rien n'est gardé par-dessus, une saisie d'ici ne doit jamais se retrouver
// dans la fiche d'un autre personnage. Elle est signalée (dropped).
// =============================================================================

import { migrateCharacter, isCharacterData } from './migrate.js';
import { characterName } from './persistence.js';
import { canonicalJSON } from '../cloud/sync.js';

/** Fiche brute lue dans un texte enregistré (null si illisible) */
function parseSheet(text) {
    try {
        const raw = JSON.parse(text ?? 'null');
        return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
    } catch {
        return null;
    }
}

/**
 * Que faire de la fiche enregistrée par un autre onglet ?
 * @param {{
 *   storedText: string|null,      // texte enregistré maintenant (dd2024_char)
 *   knownText: string|null,       // texte que cet onglet a lu ou écrit en dernier
 *   current: Object,              // fiche de cet onglet (store)
 *   pendingKeys?: Iterable<string>, // champs modifiés ici et pas encore enregistrés
 *   recentEdits?: Iterable<[string, string]> // champs enregistrés ici à l'instant →
 *                                 // canonicalJSON de leur valeur d'avant la saisie
 * }} s
 * @returns {{ action: 'none' }                       // rien n'a changé
 *   | { action: 'ignore' }                            // texte illisible : la fiche de cet onglet est gardée
 *   | { action: 'adopt', character: Object, adopted: Object, stored: Object, merged: boolean, changed: boolean,
 *       kept: string[], dropped: boolean }}
 *   character : fiche à afficher ; adopted : fiche de l'autre onglet (lue) ; stored : fiche brute enregistrée ;
 *   merged : des saisies de cet onglet ont été gardées par-dessus (kept, à enregistrer) ;
 *   changed : la fiche affichée change ; dropped : une saisie d'ici n'a pas été gardée
 *   (autre personnage ouvert dans l'autre onglet)
 */
export function planAdoption({ storedText, knownText, current, pendingKeys = [], recentEdits = [] }) {
    if (storedText === null || storedText === undefined || storedText === knownText) return { action: 'none' };
    let raw = null;
    try {
        raw = JSON.parse(storedText);
    } catch {
        raw = null;
    }
    if (!isCharacterData(raw)) return { action: 'ignore' };
    let adopted;
    try {
        adopted = migrateCharacter(raw).character;
    } catch {
        return { action: 'ignore' }; // valeur que la lecture ne sait pas convertir
    }
    const differs = (key) => Object.hasOwn(current, key) && canonicalJSON(current[key]) !== canonicalJSON(adopted[key]);
    const kept = {};
    for (const key of pendingKeys) {
        if (differs(key)) kept[key] = current[key];
    }
    for (const [key, before] of recentEdits) {
        if (!Object.hasOwn(kept, key) && differs(key) && canonicalJSON(adopted[key]) === before) kept[key] = current[key];
    }
    let keys = Object.keys(kept);
    let dropped = false;
    // Nom changé par l'autre onglet (pas par une saisie gardée ici) : autre personnage
    if (keys.length > 0 && !Object.hasOwn(kept, 'char_name')
        && characterName(adopted) !== characterName(parseSheet(knownText) ?? current)) {
        dropped = true;
        keys = [];
    }
    const merged = keys.length > 0;
    const character = merged ? { ...adopted, ...kept } : adopted;
    return {
        action: 'adopt', character, adopted, stored: raw, merged, kept: keys, dropped,
        changed: canonicalJSON(character) !== canonicalJSON(current)
    };
}

/**
 * Position actuelle d'une ligne de tableau (arme, armure) lue avant une attente (fenêtre de
 * confirmation, de réglages) : même objet ; sinon même contenu, de préférence à la même place
 * (fiche reprise d'un autre onglet entre-temps : les objets ont été recopiés). -1 si la ligne a
 * été modifiée ou supprimée entre-temps.
 * @param {Array} list - liste actuelle
 * @param {*} row - ligne lue avant l'attente
 * @param {number} index - sa position d'alors
 * @returns {number}
 */
export function locateRow(list, row, index) {
    if (!Array.isArray(list)) return -1;
    if (list[index] === row) return index;
    const same = list.indexOf(row);
    if (same !== -1) return same;
    const text = canonicalJSON(row);
    if (index >= 0 && index < list.length && canonicalJSON(list[index]) === text) return index;
    return list.findIndex(item => canonicalJSON(item) === text);
}
