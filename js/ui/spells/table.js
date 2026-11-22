// =============================================================================
// SPELLS/TABLE.JS - Cadre du tableau des sorts : en-tête et tri, rangement des lignes, message
// « aucun sort » sous le tableau, bouton « Ajouter un sort »
//
// Le tri (Niv., Nom, École) ne change que l'affichage : l'ordre enregistré de dynamic_spells
// n'est jamais modifié. Ranger les lignes ne déplace jamais celle qui a le focus (elle le
// perdrait). Aucune ligne vide n'est ajoutée à la fiche : le bouton « Ajouter un sort » amène
// sur la ligne de saisie, toujours en bas du tableau.
//  - Lit : le tri et le filtre du contexte (g.view), les lignes construites (g.rowEls).
//  - Écrit : g.view.sort ; rien dans la fiche. Les lignes elles-mêmes : spells/rows.js ;
//    leur affichage d'ensemble (quelles lignes, dans quel ordre) : renderRows, js/ui/spells.js.
// =============================================================================

import { nextSort } from '../../rules/spells.js';
import { el, setIconLabel } from '../dom.js';
import { flash } from './context.js';

const SORT_COLUMNS = {
    lvl: { label: 'Niv.', title: 'niveau' },
    name: { label: 'Nom', title: 'nom' },
    school: { label: 'École', title: 'école' }
};

/**
 * @param {import('./context.js').Grimoire} g
 * @returns {{ tbody: HTMLElement, tableScroll: HTMLElement, emptyText: HTMLElement, addBtn: HTMLButtonElement,
 *   renderHeader(): void, placeRows(order: HTMLTableRowElement[]): void,
 *   renderEmpty(info: { anySpell: boolean, anyShown: boolean, combatEmpty: boolean, locked: boolean, hasGivenSpells: () => boolean }): void }}
 *   tableScroll : le tableau dans sa zone de défilement ; emptyText : message sous le tableau
 */
export function createSpellTable(g) {
    const { view, tooltip } = g;
    const sortButtons = {};
    const headCells = {};
    function sortHeader(col) {
        const button = el('button', {
            type: 'button', class: 'sort-btn',
            on: {
                click: () => {
                    view.sort = nextSort(view.sort, col);
                    tooltip.hide();
                    g.redraw();
                }
            }
        }, SORT_COLUMNS[col].label, el('span', { class: 'sort-icon', 'aria-hidden': 'true' }));
        sortButtons[col] = button;
        headCells[col] = el('th', { scope: 'col', class: `col-${col}`, 'aria-sort': 'none' }, button);
        return headCells[col];
    }

    const tbody = el('tbody');
    const table = el('table', { class: 'data-table spells-table', 'aria-label': 'Liste des sorts' },
        el('thead', {}, el('tr', {},
            el('th', { scope: 'col', class: 'col-prep' }, el('abbr', { title: 'Préparé', text: 'P' })),
            sortHeader('lvl'),
            sortHeader('name'),
            sortHeader('school'),
            el('th', { scope: 'col', class: 'col-time', text: 'Temps d\'incant.' }),
            el('th', { scope: 'col', class: 'col-range', text: 'Portée' }),
            el('th', { scope: 'col', class: 'col-crm' },
                el('abbr', { title: 'Concentration', text: 'C' }), ' / ',
                el('abbr', { title: 'Rituel', text: 'R' }), ' / ',
                el('abbr', { title: 'Composante matérielle', text: 'M' })),
            el('th', { scope: 'col', class: 'col-note', text: 'Notes' }),
            el('th', { scope: 'col', class: 'col-cast', 'aria-label': 'Lancer' }),
            el('th', { scope: 'col', class: 'col-del edit-only', 'aria-label': 'Supprimer' }))),
        tbody);
    const tableScroll = el('div', { class: 'table-scroll spells-scroll' }, table);
    tableScroll.addEventListener('scroll', tooltip.hide, { passive: true });
    // Message sous le tableau ; le conseil de saisie n'est pas imprimé
    const emptyMain = el('span');
    const emptyHint = el('span', { class: 'spells-empty-hint' });
    const emptyText = el('p', { class: 'spells-empty', hidden: true }, emptyMain, emptyHint);

    // Aucune ligne vide n'est ajoutée à la fiche : le bouton amène sur la ligne de saisie,
    // toujours en bas du tableau (le sort sera créé à la première frappe)
    const addBtn = el('button', {
        type: 'button', class: 'add-row edit-only',
        on: {
            click: () => {
                tooltip.hide();
                g.redraw();
                const entry = g.rowEls[g.spellsOf().length];
                if (!entry || entry.tr.hidden) return;
                entry.name.focus();
                flash(entry.tr, 'is-called');
            }
        }
    });
    setIconLabel(addBtn, 'plus', 'Ajouter un sort');

    function renderHeader() {
        for (const col of Object.keys(SORT_COLUMNS)) {
            const active = view.sort.col === col;
            const asc = view.sort.dir === 'asc';
            headCells[col].setAttribute('aria-sort', active ? (asc ? 'ascending' : 'descending') : 'none');
            sortButtons[col].querySelector('.sort-icon').textContent = active ? (asc ? '▲' : '▼') : '';
            sortButtons[col].title = active && !asc
                ? 'Revenir à l\'ordre du grimoire'
                : `Trier par ${SORT_COLUMNS[col].title}${active ? ' (ordre décroissant)' : ''}`;
        }
    }

    /**
     * Range les lignes dans l'ordre d'affichage. Déplacer un élément lui fait perdre le focus :
     * la ligne qui a le focus ne bouge donc jamais, les autres se rangent autour d'elle.
     * @param {HTMLTableRowElement[]} order
     */
    function placeRows(order) {
        const current = [...tbody.children];
        if (order.length === current.length && order.every((tr, i) => tr === current[i])) return;
        const anchor = order.find(tr => tr.parentNode === tbody && tr.contains(document.activeElement));
        if (!anchor) {
            tbody.append(...order);
            return;
        }
        const at = order.indexOf(anchor);
        anchor.before(...order.slice(0, at));
        anchor.after(...order.slice(at + 1));
    }

    /**
     * Message sous le tableau quand il n'y a rien à y montrer (aucun sort noté, aucun sort du
     * niveau filtré, aucun sort à lancer dans la vue au combat).
     * @param {{ anySpell: boolean, anyShown: boolean, combatEmpty: boolean, locked: boolean, hasGivenSpells: () => boolean }} info
     *        anySpell : au moins un sort noté ; anyShown : au moins une ligne à l'écran ;
     *        combatEmpty : sorts affichés, mais tous retirés par la vue au combat ;
     *        hasGivenSpells : des sorts de don, de sous-classe ou d'espèce sont affichés au-dessus
     */
    function renderEmpty({ anySpell, anyShown, combatEmpty, locked, hasGivenSpells }) {
        emptyMain.textContent = '';
        emptyHint.textContent = '';
        if (!anySpell) {
            // Sorts de dons affichés juste au-dessus : le message ne doit pas les contredire
            emptyMain.textContent = hasGivenSpells()
                ? 'Aucun autre sort noté.'
                : locked ? 'Aucun sort dans le grimoire.' : 'Aucun sort pour l\'instant.';
            // Vue au combat (réglage de l'appareil, retenu d'une fiche à l'autre) : pas de ligne
            // de saisie ni de bouton Ajouter, le message dit comment les retrouver
            if (!locked) {
                emptyHint.textContent = view.combat
                    ? ' Pour en ajouter, quittez la vue « Au combat » (bouton de la barre ci-dessus).'
                    : ' Tapez un nom dans la ligne ci-dessus : la saisie propose les sorts du manuel.';
            }
        } else if (!anyShown && view.combat) {
            emptyMain.textContent = view.level === '' ? 'Aucun sort mineur ni sort préparé.'
                : view.level === '0' ? 'Aucun sort mineur.' : `Aucun sort préparé de niveau ${view.level}.`;
        } else if (!anyShown) {
            emptyMain.textContent = view.level === '0' ? 'Aucun sort mineur.' : `Aucun sort de niveau ${view.level}.`;
        }
        emptyText.hidden = !emptyMain.textContent;
        // Message propre à la vue au combat : écran seulement (l'impression montre tous les sorts)
        emptyText.classList.toggle('is-combat-only', combatEmpty);
    }

    return { tbody, tableScroll, emptyText, addBtn, renderHeader, placeRows, renderEmpty };
}
