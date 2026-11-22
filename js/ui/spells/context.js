// =============================================================================
// SPELLS/CONTEXT.JS - Contexte du grimoire : ce que les morceaux du tableau des sorts partagent
//
// initSpells (js/ui/spells.js) crée UN objet de contexte, ici, et le passe en premier argument à
// chaque morceau du tableau (entry.js, picker.js, rows.js, table.js, cast.js, book.js, notice.js).
// C'est le seul état partagé : rien de global, rien sur window. L'objet vit le temps de la page.
//  - Services : la fiche (store), la barre du haut (setStatus), l'infobulle des sorts.
//  - Affichage : filtre de niveau, tri, vue « au combat » (view), jamais écrits dans la fiche.
//  - Saisie en cours : niveau choisi dans la ligne de saisie, sort tout juste créé (brouillon).
// Il lit le réglage « au combat » de l'appareil (prefs.js) et n'écrit rien lui-même.
// =============================================================================

import { motionOff } from '../motion-pref.js';
import { createSpellTooltip } from './tooltip.js';
import { readCombatView } from './prefs.js';

/**
 * @typedef {Object} Grimoire
 * @property {Object} store - source de vérité de la fiche (js/state/store.js)
 * @property {(message: string) => void} setStatus - message dans la barre du haut
 * @property {{ level: string, sort: { col: string|null, dir: string }, combat: boolean }} view -
 *   filtre de niveau ('' : tous), tri du tableau, vue « au combat » : affichage seulement
 * @property {Object} tooltip - infobulle des sorts (spells/tooltip.js), partagée par le tableau
 *   et les sorts donnés
 * @property {Object[]} spellsDb - base de sorts (data/spells.json) ; vide tant qu'elle n'est pas
 *   chargée (initSpells la pose une fois lue)
 * @property {Object[]} rowEls - un élément par ligne de dynamic_spells (même indice), plus la
 *   ligne de saisie, toujours le dernier élément (indice = nombre de lignes enregistrées) ;
 *   chaque élément est l'objet « r » construit par createRow (spells/rows.js)
 * @property {boolean} creatingFromEntry - vrai pendant la création d'un sort depuis la ligne de
 *   saisie (voir renderRows, js/ui/spells.js)
 * @property {string|null} entryLevel - niveau choisi dans la ligne de saisie avant d'y écrire
 *   (null : celui du filtre actif)
 * @property {{ index: number, json: string, level: string }|null} draft - sort créé depuis la
 *   ligne de saisie, tant que le focus ne l'a pas quittée (json : sa dernière version écrite ici,
 *   voir settleDraft ; level : niveau choisi sur la ligne, '' si aucun, qui limite la liste des
 *   sorts à parcourir)
 * @property {() => Object[]} spellsOf - lignes enregistrées (dynamic_spells), [] si illisible
 * @property {() => void} redraw - réaffiche tout le grimoire en rangeant les lignes (filtre et
 *   tri réappliqués) ; posée par initSpells une fois les morceaux assemblés
 */

/**
 * @param {{ store: Object, setStatus: (message: string) => void }} deps
 * @returns {Grimoire}
 */
export function createGrimoireContext({ store, setStatus }) {
    return {
        store,
        setStatus,
        view: { level: '', sort: { col: null, dir: 'asc' }, combat: readCombatView() },
        tooltip: createSpellTooltip({ store }),
        spellsDb: [],
        rowEls: [],
        creatingFromEntry: false,
        entryLevel: null,
        draft: null,
        spellsOf: () => {
            const list = store.get().dynamic_spells;
            return Array.isArray(list) ? list : [];
        },
        redraw: () => {}
    };
}

/** Bref éclat doré (ligne de saisie appelée, grimoire ouvert) ; rien si les animations sont limitées */
export function flash(node, className) {
    if (!node || motionOff()) return;
    node.classList.remove(className);
    void node.offsetWidth; // relance l'animation si elle est déjà en cours
    node.classList.add(className);
    node.addEventListener('animationend', () => node.classList.remove(className), { once: true });
}
