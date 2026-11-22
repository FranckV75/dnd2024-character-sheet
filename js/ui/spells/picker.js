// =============================================================================
// SPELLS/PICKER.JS - Liste des sorts d'une ligne du tableau : suggestions pendant la frappe du
// nom, et liste à parcourir (nom vide touché, ou bouton ▾ sans ouvrir le clavier virtuel)
//
// Le choix remplit la ligne depuis la base de sorts (spellToRow) ; sur la ligne de saisie, il
// crée le sort. Choisi avec le bouton ▾ sans être entré dans la ligne, le choix est validé tout
// de suite : le sort se range à sa place et une nouvelle ligne de saisie apparaît dessous.
//  - Lit : la base de sorts (g.spellsDb), la fiche (classe, liste de sorts choisie, sorts déjà
//    notés), le niveau qui limite la liste (entry.js : pickerLevelOf).
//  - Écrit : la ligne, par editRow (entry.js) ; g.draft (brouillon validé par le bouton ▾).
// Règles : js/rules/spells.js (recherche) et js/rules/spell-picker.js (liste rangée par niveau).
// =============================================================================

import { derivedOf } from '../derived.js';
import { spellDisplayName, effectiveSpellClass, searchSpells, spellToRow } from '../../rules/spells.js';
import { spellPickerGroups, pickerMaxLevel } from '../../rules/spell-picker.js';
import { el, icon } from '../dom.js';
import { attachAutocomplete } from '../autocomplete.js';
import { isLocked } from '../lock.js';
import { editRow, pickerLevelOf } from './entry.js';

/** Bouton ▾ (liste des sorts sans clavier virtuel) : infobulle (souris), puis phrase courte dans
 *  la barre du haut quand on le touche (tablette) */
const PICK_TITLE = 'Choisir dans la liste des sorts (sans ouvrir le clavier)';
const PICK_HELP = 'Liste des sorts : touchez-en un pour remplir la ligne (✓ : déjà noté, grisé).';

/**
 * Bouton ▾ : liste des sorts à parcourir, sans focus sur le nom (pas de clavier virtuel).
 * @param {import('./context.js').Grimoire} g
 * @param {Object} r - éléments de la ligne (r.detach est posé ensuite par attachSpellPicker)
 * @returns {HTMLButtonElement}
 */
export function createPickButton(g, r) {
    return el('button', {
        type: 'button', class: 'spell-pick', title: PICK_TITLE, 'aria-label': 'Choisir dans la liste des sorts', hidden: true,
        on: {
            mousedown: (event) => event.preventDefault(),
            click: () => {
                g.tooltip.hide();
                r.detach.open();
                if (r.pick.getAttribute('aria-expanded') === 'true') g.setStatus(PICK_HELP);
            }
        }
    }, icon('chevron'));
}

/** Sorts proposés : toute la liste rangée par niveau (browse), ou ceux qui répondent à la frappe */
function pickerItems(g, r, query, browse) {
    const character = g.store.get();
    const derivedNow = derivedOf(character);
    const classSlug = effectiveSpellClass(character.spell_class_filter, derivedNow.classSlug, derivedNow.subclass);
    if (browse) {
        const groups = spellPickerGroups(g.spellsDb, {
            classSlug, query,
            level: pickerLevelOf(g, r),
            maxLevel: pickerMaxLevel(derivedNow.classSlug, derivedNow.spellSlots),
            // Le sort de cette ligne elle-même ne compte pas comme « déjà noté »
            rows: g.spellsOf().filter((_, i) => i !== r.index)
        });
        return groups.flatMap(group => [
            { header: group.title },
            ...group.items.map(item => ({
                label: item.name,
                detail: item.noted ? 'déjà noté' : item.spell.school,
                mark: item.noted ? '✓' : '',
                disabled: item.noted,
                value: item.spell
            }))
        ]);
    }
    return searchSpells(g.spellsDb, query, { classSlug, limit: 12 }).map(spell => ({
        label: spellDisplayName(spell),
        detail: `niv. ${spell.level} · ${spell.school}`,
        value: spell
    }));
}

/** Sort choisi dans la liste : la ligne est remplie (ligne de saisie : le sort est créé) */
function fillRow(g, r, item, fromTrigger) {
    const list = g.spellsOf();
    // Bouton ▾ utilisé au clavier : il garde le focus (il disparaît une fois le nom rempli)
    const pickFocused = document.activeElement === r.pick;
    // Ligne de saisie (sort pas encore créé) : le choix crée le sort
    const isEntry = r.index === list.length;
    const row = isEntry ? {} : list[r.index];
    if (!row) return;
    const filled = spellToRow(item.value, row);
    editRow(g, r.index, filled);
    r.name.value = filled.name;
    // Choisi avec le bouton ▾, sans être entré dans la ligne : le choix est validé
    // (le sort se range à sa place, une nouvelle ligne de saisie apparaît dessous)
    if (fromTrigger && (pickFocused || !r.tr.contains(document.activeElement))) {
        if (g.draft?.index === r.index) g.draft = null;
        if (pickFocused) r.pick.blur();
        g.redraw();
        if (isEntry) g.setStatus(`${filled.name} : ajouté au grimoire.`);
        // Au clavier : le focus passe au bouton ▾ de la nouvelle ligne de saisie
        const next = g.rowEls[g.spellsOf().length];
        if (pickFocused && next && !next.tr.hidden && !next.pick.hidden) next.pick.focus();
    }
}

/**
 * Branche l'auto-complétion sur le nom de la ligne (r.name) et son bouton ▾ (r.pick).
 * @param {import('./context.js').Grimoire} g
 * @param {Object} r - éléments de la ligne
 * @returns {Function} fonction qui détache la liste (avec .open() et .hide(), voir autocomplete.js)
 */
export function attachSpellPicker(g, r) {
    return attachAutocomplete(r.name, {
        minChars: 2,
        maxItems: 12,
        // Nom vide touché, ou bouton ▾ : toute la liste de sorts, rangée par niveau
        browse: { enabled: () => !isLocked() && g.spellsDb.length > 0, trigger: r.pick },
        getItems: (query, { browse = false } = {}) => pickerItems(g, r, query, browse),
        onSelect: (item, { fromTrigger = false } = {}) => fillRow(g, r, item, fromTrigger)
    });
}
