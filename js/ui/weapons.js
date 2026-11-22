// =============================================================================
// WEAPONS.JS - Tableau des armes (édition, auto-complétion, filtres, configuration, bonus de combat)
//
// Données : character.dynamic_weapons (lignes au format v3, voir EMPTY_WEAPON) et
// character.combat_buffs { rage, sneakAttack, hunterMark, heavyWeaponMaster, charger }.
// Les valeurs d'attaque et de dégâts sont calculées (computeWeapon), jamais enregistrées.
// Rappels des dons par arme (Sauvagerie martiale, Sentinelle, Trancheur…) : weaponFeatNotes
// (js/rules/feat-effects.js), dans l'infobulle des dégâts et une ligne repliable sous l'arme,
// ouverte par une pastille placée à côté du bonus d'attaque.
// Botte d'arme reconnue dans la colonne « Botte d'arme » (findMastery, js/rules/weapon-masteries.js) :
// une pastille (livre), posée dans le coin bas droit de la case, ouvre la règle du manuel, les
// valeurs calculées pour l'arme et la capacité Bottes d'arme de la classe, fiche verrouillée
// ou non. Elle est hors du flux (position absolue) : elle ne rehausse jamais la ligne. La saisie
// n'est jamais réécrite : la pastille apparaît ou disparaît selon ce qui est écrit.
// Dégâts en plus écrits par le joueur (« +2d6 contre les dragons », réglage de l'arme, règles dans
// js/rules/weapon-extras.js) : « Toujours » = ajoutés au texte des dégâts ; « À allumer » = pastille
// dans une ligne sous l'arme (même aspect et même règle de verrou que Rage), dont l'état est rangé
// dans la ligne de l'arme (weaponConfig), jamais à part. Dans la case, chaque dégât en plus tient
// sur une ligne, abrégé avec « … » ; toucher la case écrit les dégâts en entier sous l'arme
// (toggleDamageDetail, weapons/damage.js), fiche verrouillée ou non.
// Les règles (filtres, remplissage depuis le manuel, validation) sont dans js/rules/weapons.js.
//
// Ce fichier est le chef d'orchestre : il pose la structure fixe (titre, filtres, tableau), lit et
// écrit la fiche, et redessine quand elle change. Le reste est dans js/ui/weapons/ :
//   shared.js         le contexte partagé (WeaponsContext), les colonnes, les petits textes
//   rows.js           les lignes : construction (buildRow) et réécriture (refreshRows)
//   damage.js         la case des dégâts, le détail sous l'arme, les pastilles « À allumer »
//   buffs.js          les bonus de combat (Rage…) et l'avertissement Rage en armure lourde
//   edit.js           ajouter, supprimer, annuler la suppression
//   config.js         la fenêtre « Configuration de l'arme » (roue dentée)
//   config-extras.js  sa rubrique « Dégâts en plus »
//   mastery.js        la fenêtre de la règle d'une botte d'arme
// Aucune variable partagée entre ces fichiers : l'état commun (lignes affichées, filtre, ligne en
// cours de saisie) est dans le contexte créé ici et passé à chaque fonction.
// =============================================================================

import { locateRow } from '../state/other-tab.js';
import { effectiveBuffs } from '../rules/weapons.js';
import { derivedOf } from './derived.js';
import { el, icon } from './dom.js';
import { isLocked } from './lock.js';
import { foldButton, bindFolding, applyFold } from './fold.js';
import { TEXT_COLUMNS, COLUMN_COUNT } from './weapons/shared.js';
import { createBuffs } from './weapons/buffs.js';
import { createWeaponEdits } from './weapons/edit.js';
import { buildRow, refreshRows } from './weapons/rows.js';

const FILTERS = [
    ['all', 'Toutes'],
    ['simple', 'Courantes'],
    ['martial', 'Guerre'],
    ['melee', 'Corps à corps'],
    ['ranged', 'Distance'],
    ['magic', 'Magiques']
];

/**
 * Structure fixe du tableau : titre et bonus de combat, filtres, tableau (en-têtes), bandeau
 * d'annulation et bouton d'ajout.
 * @param {HTMLElement} container - <section id="weapons-feature">
 * @param {{ buffsBox: HTMLElement, filterButtons: HTMLButtonElement[], tbody: HTMLElement, undoBox: HTMLElement, addButton: HTMLElement }} parts
 */
function buildFrame(container, { buffsBox, filterButtons, tbody, undoBox, addButton }) {
    container.replaceChildren(
        el('div', { class: 'weapons-head' },
            // Icône dorée devant le titre, comme les titres de index.html (data-icon, ornaments.js)
            // Pastille à chevron (fold.js) : replie le tableau ; le titre et les bonus de combat
            // (Rage…) restent, ils servent à chaque tour
            el('h3', { id: 'weapons-title', 'data-icon': 'swords' }, icon('swords'), 'Armes', foldButton('Armes')),
            buffsBox),
        el('div', { class: 'weapons-filters btn-segments', role: 'group', 'aria-label': 'Filtrer les armes affichées' },
            filterButtons),
        el('div', { class: 'table-scroll weapons-scroll' },
            el('table', { class: 'data-table weapons-table', 'aria-labelledby': 'weapons-title' },
                el('colgroup', {},
                    ['name', 'atk', 'dmg', 'prop', 'prof', 'ammo', 'note', 'actions']
                        .map(c => el('col', { class: `weapons-col-${c}` }))),
                el('thead', {}, el('tr', {},
                    el('th', { scope: 'col', text: 'Nom' }),
                    el('th', { scope: 'col', text: 'Bonus att.' }),
                    el('th', { scope: 'col', text: 'Dégâts' }),
                    TEXT_COLUMNS.map(c => (c.short
                        ? el('th', { scope: 'col', title: c.label },
                            el('span', { class: 'weapons-th-long', text: c.label }),
                            el('span', { class: 'weapons-th-short', 'aria-hidden': 'true', text: c.short }))
                        : el('th', { scope: 'col', text: c.label }))),
                    el('th', { scope: 'col', class: 'edit-only' }, el('span', { class: 'weapons-sr', text: 'Actions' })))),
                tbody)),
        undoBox,
        addButton);
}

/**
 * Cellule en cours de saisie : arme (contenu), colonne, sélection ; null si hors du tableau.
 * @param {import('./weapons/shared.js').WeaponRow[]} rows - lignes affichées
 * @param {Object[]} list - armes affichées (même ordre)
 */
function focusedCell(rows, list) {
    const active = document.activeElement;
    const index = rows.findIndex(r => r.tr.contains(active));
    if (index === -1) return null;
    const key = Object.keys(rows[index].inputs).find(k => rows[index].inputs[k] === active);
    if (!key) return null;
    return { weapon: list[index], index, key, start: active.selectionStart, end: active.selectionEnd };
}

/** Remet le curseur dans la même cellule de la même arme après reconstruction des lignes */
function restoreFocus(rows, cell, list) {
    if (!cell) return;
    const at = locateRow(list, cell.weapon, cell.index);
    const input = rows[at]?.inputs[cell.key];
    if (!input) return;
    input.focus();
    try {
        input.setSelectionRange(cell.start, cell.end);
    } catch {
        // champ sans sélection de texte
    }
}

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} app
 */
export function initWeapons({ root, store, setStatus }) {
    const container = root.querySelector('#weapons-feature');
    if (!container) return;

    // ---------------------------------------------------------------------
    // Lecture / écriture dans le store
    // ---------------------------------------------------------------------

    const weapons = () => {
        const list = store.get().dynamic_weapons;
        return Array.isArray(list) ? list : [];
    };

    function updateRow(index, makeRow) {
        const list = weapons();
        if (!list[index]) return;
        const next = makeRow(list[index]);
        if (next === list[index]) return;
        store.update({ dynamic_weapons: list.map((w, i) => (i === index ? next : w)) });
    }

    // ---------------------------------------------------------------------
    // Contexte partagé avec les morceaux de js/ui/weapons/ (voir shared.js)
    // ---------------------------------------------------------------------

    /** @type {import('./weapons/shared.js').WeaponsContext} */
    const ctx = {
        store,
        setStatus,
        rows: [],
        filter: 'all',
        pinnedRow: null,
        weapons,
        updateRow,
        refresh: () => refresh(store.get()),
        deleteWeapon: (index) => edits.deleteWeapon(index)
    };

    // ---------------------------------------------------------------------
    // Structure fixe
    // ---------------------------------------------------------------------

    const buffs = createBuffs(ctx);
    const edits = createWeaponEdits(ctx);
    const filterButtons = FILTERS.map(([value, label]) => el('button', {
        type: 'button', class: 'btn-chip', 'data-filter': value,
        'aria-pressed': String(value === ctx.filter), text: label,
        on: { click: () => setFilter(value) }
    }));
    const tbody = el('tbody');
    const emptyRow = el('tr', { class: 'weapons-empty' },
        el('td', { class: 'empty', colspan: String(COLUMN_COUNT) }));

    buildFrame(container, { buffsBox: buffs.element, filterButtons, tbody, undoBox: edits.undoBox, addButton: edits.addButton });
    container.dataset.foldKey = 'box:weapons';
    bindFolding(container);
    applyFold(container);

    function setFilter(value) {
        ctx.filter = value;
        for (const button of filterButtons) {
            button.setAttribute('aria-pressed', String(button.dataset.filter === value));
        }
        refresh(store.get());
    }

    // ---------------------------------------------------------------------
    // Verrouillage et rendu
    // ---------------------------------------------------------------------

    function rebuild(list) {
        for (const row of ctx.rows) row.detach();
        ctx.rows = list.map((_, i) => buildRow(ctx, i));
        tbody.replaceChildren(...ctx.rows.flatMap(r => [r.tr, r.extraTr, r.notesTr]), emptyRow);
        applyLockState();
    }

    function applyLockState() {
        const locked = isLocked();
        for (const row of ctx.rows) {
            for (const input of Object.values(row.inputs)) input.readOnly = locked;
        }
    }

    function refresh(character) {
        const derived = derivedOf(character);
        const active = effectiveBuffs(derived.classSlug, character.combat_buffs, character, derived);
        buffs.render(character, derived);
        const list = weapons();
        const visible = refreshRows(ctx, list, derived, active, character);

        emptyRow.hidden = visible > 0;
        const emptyText = list.length === 0
            ? "Aucune arme pour l'instant."
            : 'Aucune arme ne correspond à ce filtre.';
        if (emptyRow.firstElementChild.textContent !== emptyText) emptyRow.firstElementChild.textContent = emptyText;
    }

    /** Liste affichée (pour retrouver la cellule en cours de saisie quand une autre fiche arrive) */
    let shownList = [];

    function render(character, changedKeys, meta = {}) {
        const list = weapons();
        // Fiche reprise d'un autre onglet : les lignes restent (le champ en cours de saisie garde
        // le curseur) et la dernière suppression peut encore être annulée
        const otherTab = changedKeys === null && meta.source === 'other-tab';
        if (changedKeys === null && !otherTab) edits.hideUndo();
        const cell = otherTab ? focusedCell(ctx.rows, shownList) : null;
        const rebuilt = (changedKeys === null && !otherTab) || list.length !== ctx.rows.length;
        if (rebuilt) rebuild(list);
        refresh(character);
        if (rebuilt) restoreFocus(ctx.rows, cell, list);
        shownList = list;
    }

    document.addEventListener('dd:lockchange', () => {
        applyLockState();
        // Fiche verrouillée : plus de saisie, la ligne vide épinglée disparaît aussi
        if (isLocked()) ctx.pinnedRow = null;
        refresh(store.get());
    });
    store.subscribe(render);
    render(store.get(), null);
}
