// =============================================================================
// SPELLS/ENTRY.JS - Saisie d'un sort : modification d'une ligne, ligne de saisie et brouillon
//
// La ligne de saisie (dernière ligne du tableau) n'existe pas dans la fiche : la première saisie
// qui a du contenu (texte, case C / R / M) y crée le sort, à la fin de dynamic_spells. Tant que
// le focus n'a pas quitté cette ligne, le sort créé est un « brouillon » : vidé, ou effacé par
// le bouton ✕, il est retiré de la fiche (qui revient à son état d'avant la saisie). Un sort
// validé n'est jamais supprimé ici.
//  - Lit : dynamic_spells (par g.spellsOf) et l'état de saisie du contexte (g.entryLevel,
//    g.draft, g.view.level).
//  - Écrit : dynamic_spells (store.update), g.entryLevel, g.draft, g.creatingFromEntry, et les
//    boutons ✕ / corbeille des lignes (g.rowEls).
// =============================================================================

import { EMPTY_SPELL } from '../../state/schema.js';
import { hasSpellContent, newSpellRow, rowLevel } from '../../rules/spells.js';
import { isLocked } from '../lock.js';

/** Bouton ✕ de la ligne de saisie : phrase courte dans la barre du haut quand on le touche (tablette) */
const CLEAR_HELP = 'Ligne de saisie remise à zéro ; vos autres sorts ne sont pas touchés.';

/**
 * Écrit une modification dans la ligne d'indice donné (ou crée le sort, depuis la ligne de saisie).
 * @param {import('./context.js').Grimoire} g
 * @param {number} index - indice dans dynamic_spells ; égal à sa longueur : la ligne de saisie
 * @param {Object} patch - clés v3 du sort à changer (lvl, name, c, prep…)
 */
export function editRow(g, index, patch) {
    const list = g.spellsOf();
    if (index === list.length) {
        // Ligne de saisie : le sort est créé à la première saisie qui a du contenu, au niveau
        // choisi dans la ligne ou à celui du filtre actif. Un niveau seul (liste, flèches du
        // clavier) est gardé pour la ligne, sans rien écrire dans la fiche.
        const chosenLevel = g.entryLevel ?? g.view.level;
        const row = { ...newSpellRow(EMPTY_SPELL, chosenLevel), ...patch };
        if (!hasSpellContent(row)) {
            if ('lvl' in patch) g.entryLevel = String(patch.lvl);
            syncClearButtons(g);
            return;
        }
        g.entryLevel = null;
        g.creatingFromEntry = true;
        try {
            g.store.update({ dynamic_spells: [...list, row] });
        } finally {
            g.creatingFromEntry = false;
        }
        g.draft = { index, json: JSON.stringify(g.spellsOf()[index]), level: 'lvl' in patch ? String(patch.lvl) : chosenLevel };
        syncClearButtons(g);
        return;
    }
    if (!list[index]) return;
    const next = list.slice();
    next[index] = { ...list[index], ...patch };
    g.store.update({ dynamic_spells: next });
    if (g.draft?.index === index) {
        g.draft.json = JSON.stringify(g.spellsOf()[index]);
        if ('lvl' in patch) g.draft.level = String(patch.lvl);
    }
}

/**
 * Bouton ✕ « Effacer la ligne » : la ligne de saisie revient à zéro (niveau « — », nom vide,
 * cases décochées). Si la saisie a déjà créé un sort dans la fiche, il est retiré seulement
 * s'il est encore le brouillon de cette saisie (le focus n'a pas quitté la ligne), le dernier
 * de la liste et tel que cette saisie l'a laissé : un sort validé n'est jamais supprimé.
 * @param {import('./context.js').Grimoire} g
 * @param {Object} r - éléments de la ligne
 */
export function clearEntry(g, r) {
    const list = g.spellsOf();
    const hadFocus = r.tr.contains(document.activeElement);
    r.detach.hide();
    g.tooltip.hide();
    if (r.index === list.length) {
        g.entryLevel = null;
        r.name.value = '';
        g.redraw();
    } else if (g.draft?.index === r.index) {
        const untouched = r.index === list.length - 1 && JSON.stringify(list[r.index]) === g.draft.json;
        g.draft = null;
        if (!untouched) {
            // La fiche a changé entre-temps (synchronisation) : rien n'est supprimé
            g.redraw();
            return;
        }
        g.entryLevel = null;
        g.store.update({ dynamic_spells: list.slice(0, r.index) });
        // La ligne redevient la ligne de saisie : le nom (qui garde peut-être le focus) est vidé
        r.name.value = '';
    } else {
        return;
    }
    g.setStatus(CLEAR_HELP);
    if (hadFocus && document.activeElement !== r.name && !r.tr.hidden) r.name.focus();
}

/**
 * Bouton ✕ : ligne de saisie dont le niveau a été changé, ou sort tout juste créé par la saisie
 * @param {import('./context.js').Grimoire} g
 */
export function syncClearButtons(g) {
    const count = g.spellsOf().length;
    for (const r of g.rowEls) {
        const show = !isLocked() && (r.index === count ? (g.entryLevel ?? g.view.level) !== g.view.level : g.draft?.index === r.index);
        r.clear.hidden = !show;
        r.del.hidden = show;
        r.tr.classList.toggle('is-touched', show);
    }
}

/**
 * Niveau qui limite la liste des sorts à parcourir : celui choisi sur la ligne (ligne de saisie,
 * sort tout juste créé), sinon le niveau noté (« 0 » des lignes vierges : non choisi), sinon la
 * pastille de niveau active ; '' : tous les niveaux permis.
 * @param {import('./context.js').Grimoire} g
 * @param {Object} r - éléments de la ligne
 * @returns {string}
 */
export function pickerLevelOf(g, r) {
    const list = g.spellsOf();
    if (r.index === list.length) return g.entryLevel ?? g.view.level;
    if (g.draft?.index === r.index) return g.draft.level;
    const level = rowLevel(list[r.index]);
    return level !== '0' ? level : g.view.level;
}

/**
 * Le focus quitte la ligne d'un sort créé depuis la ligne de saisie. Vidé entre-temps
 * (texte effacé, case décochée), ce sort est retiré : la fiche revient à son état d'avant
 * la saisie, sans ligne vide invisible. Seul ce sort-là est concerné, et seulement s'il
 * est resté tel que cette saisie l'a laissé (sinon la fiche a changé : rien n'est touché).
 * @param {import('./context.js').Grimoire} g
 * @param {number} index
 * @returns {boolean} vrai si le sort a été retiré (la fiche est alors déjà réaffichée)
 */
export function settleDraft(g, index) {
    if (!g.draft || g.draft.index !== index) return false;
    const list = g.spellsOf();
    const row = list[index];
    const untouched = index === list.length - 1 && JSON.stringify(row) === g.draft.json;
    g.draft = null;
    if (!untouched || hasSpellContent(row)) return false;
    g.store.update({ dynamic_spells: list.slice(0, index) });
    return true;
}
