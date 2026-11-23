// =============================================================================
// WEAPONS/SHARED.JS - Ce que les morceaux du tableau des armes ont en commun
//
// Le tableau des armes (js/ui/weapons.js) est découpé en morceaux (ce dossier). Ils ne partagent
// aucune variable : tout passe par un petit objet, le « contexte », créé une seule fois par
// initWeapons et donné à chaque fonction (WeaponsContext ci-dessous). Ici aussi : les colonnes du
// tableau et trois petites fonctions de texte (nom d'une arme dans une phrase, phrase qui tient
// dans la barre du haut).
// Ne lit et n'écrit rien : ni la fiche, ni la page.
// =============================================================================

import { stripHTML, safeText } from '../../state/migrate.js';
import { STATUS_ROOM } from '../../data/status-bar.js';

/**
 * Contexte du tableau des armes : l'état que les morceaux se partagent, et les quelques gestes
 * dont ils ont tous besoin. Créé par initWeapons (js/ui/weapons.js), jamais copié : `rows`,
 * `filter` et `pinnedRow` changent au fil de l'eau, on les lit toujours à travers lui.
 * @typedef {Object} WeaponsContext
 * @property {Object} store - la fiche (js/state/store.js) : seule source de vérité
 * @property {(message: string) => void} setStatus - écrit une phrase dans la barre du haut
 * @property {WeaponRow[]} rows - lignes affichées, une par arme de dynamic_weapons, dans le même
 *   ordre ; remplacé à chaque reconstruction du tableau (rebuild, js/ui/weapons.js)
 * @property {string} filter - filtre actif ('all', 'simple', 'martial', 'melee', 'ranged', 'magic')
 * @property {WeaponRow|null} pinnedRow - ligne en cours d'édition (le focus est dans l'une de ses
 *   cellules) : elle reste visible même si le filtre actif l'exclut, pour ne jamais cacher le
 *   champ où l'on tape. Le filtre lui est réappliqué quand le focus quitte la ligne.
 * @property {() => Object[]} weapons - liste des armes de la fiche (dynamic_weapons, [] si absente)
 * @property {(index: number, makeRow: (weapon: Object) => Object) => void} updateRow - remplace
 *   une arme dans la fiche (rien n'est écrit si makeRow rend la même ligne)
 * @property {() => void} refresh - réécrit le tableau et les bonus de combat depuis la fiche
 * @property {(index: number) => Promise<void>} deleteWeapon - supprime une arme, après
 *   confirmation si elle a un nom (js/ui/weapons/edit.js)
 */

/**
 * Une ligne du tableau : les éléments d'une arme et ce qui y est affiché (js/ui/weapons/rows.js).
 * @typedef {Object} WeaponRow
 * @property {HTMLTableRowElement} tr - ligne de l'arme
 * @property {Object<string, HTMLTextAreaElement>} inputs - cases de saisie : name, prop, prof, ammo, note
 * @property {ReturnType<typeof import('../magic.js').createMagicParts>} magic - pastille et décors d'arme magique
 * @property {HTMLButtonElement} pick - bouton ▾ après le nom (ligne sans nom) : liste des armes du manuel
 * @property {HTMLElement} atk - bonus d'attaque (calculé)
 * @property {HTMLElement} dmg - dégâts (calculés)
 * @property {HTMLButtonElement} configBtn
 * @property {HTMLButtonElement} deleteBtn
 * @property {HTMLButtonElement} notesBtn - pastille des rappels (dons, arme non maîtrisée)
 * @property {HTMLTableRowElement} notesTr - ligne repliable des rappels
 * @property {HTMLUListElement} notesList
 * @property {boolean} notesOpen
 * @property {string} notesSignature - derniers rappels écrits (rien n'est réécrit s'ils n'ont pas changé)
 * @property {HTMLButtonElement} masteryBtn - pastille de la botte d'arme
 * @property {HTMLTableRowElement} extraTr - ligne des pastilles « À allumer » et du détail des dégâts
 * @property {HTMLElement} extraPills
 * @property {HTMLElement} extraPrint - mention imprimée à la place des pastilles
 * @property {HTMLElement} extraDetail - dégâts écrits en entier
 * @property {boolean} detailOpen
 * @property {string|null} extraSignature - dernières pastilles écrites
 * @property {() => void} detach - retire l'auto-complétion du nom
 */

/** Colonnes de texte libre, dans l'ordre du tableau */
export const TEXT_COLUMNS = [
    { key: 'prop', label: 'Propriétés' },
    { key: 'prof', label: "Botte d'arme" },
    // Libellé court affiché sur tablette (colonne étroite), le libellé complet reste lu
    { key: 'ammo', label: 'Munitions', short: 'Mun.' },
    { key: 'note', label: 'Notes' }
];

export const COLUMN_COUNT = 8;

/** Texte d'une valeur enregistrée, sans le HTML des anciennes fiches */
export const plain = (value) => stripHTML(safeText(value));

/**
 * La barre du haut tient sur une ligne (591 px à 768 px, soit une centaine de caractères) : une
 * phrase qui cite l'arme n'y est écrite que si elle y tient, sinon sa version courte la remplace.
 */
export const fitStatus = (full, short) => (full.length <= STATUS_ROOM ? full : short);

/** Nom d'une arme dans une phrase : « Épée longue », ou « cette arme » sans nom */
export function weaponInSentence(weapon) {
    const name = plain(weapon?.name);
    return name ? `« ${name} »` : 'cette arme';
}
