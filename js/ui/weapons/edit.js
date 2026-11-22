// =============================================================================
// WEAPONS/EDIT.JS - Ajouter une arme, la supprimer, annuler la suppression
//
// Gestes d'ÉDITION (sans effet fiche verrouillée) : le bouton « Ajouter une arme ou un sort
// mineur » sous le tableau, la corbeille de chaque ligne (confirmation si l'arme a un nom) et le
// bandeau « Annuler la suppression », affiché dix secondes. Écrit dynamic_weapons dans la fiche.
// =============================================================================

import { EMPTY_WEAPON } from '../../state/schema.js';
import { locateRow } from '../../state/other-tab.js';
import { isBlankWeapon, removeWeapon, restoreWeapon } from '../../rules/weapons.js';
import { el, setIconLabel } from '../dom.js';
import { confirmModal } from '../modal.js';
import { isLocked } from '../lock.js';
import { plain } from './shared.js';

const UNDO_DELAY_MS = 10000;

/**
 * @param {import('./shared.js').WeaponsContext} ctx
 * @returns {{ undoBox: HTMLElement, addButton: HTMLButtonElement, deleteWeapon(index: number): Promise<void>, hideUndo(): void }}
 *   undoBox et addButton : à poser sous le tableau ; hideUndo : la dernière suppression ne peut
 *   plus être annulée (autre fiche chargée)
 */
export function createWeaponEdits(ctx) {
    const { store, setStatus, weapons } = ctx;
    let undoTimer = null;
    let lastDeleted = null;

    const undoText = el('span');
    const undoBox = el('p', { class: 'weapons-undo edit-only', role: 'status', hidden: true },
        undoText,
        el('button', { type: 'button', class: 'btn-chip', text: 'Annuler la suppression', on: { click: undoDelete } }));
    const addButton = el('button', {
        type: 'button', class: 'add-row edit-only',
        on: { click: addWeapon }
    });
    setIconLabel(addButton, 'plus', 'Ajouter une arme ou un sort mineur');

    function addWeapon() {
        if (isLocked()) return;
        // Une ligne de saisie vide est déjà affichée : on y place le curseur plutôt que
        // d'ajouter une ligne vide de plus (qui serait masquée)
        const entry = ctx.rows.find((row, i) => !row.tr.hidden && isBlankWeapon(weapons()[i]));
        if (entry) {
            focusRowName(entry);
            return;
        }
        store.update({ dynamic_weapons: [...weapons(), { ...EMPTY_WEAPON }] });
        focusRowName(ctx.rows[ctx.rows.length - 1]);
    }

    async function deleteWeapon(index) {
        if (isLocked()) return;
        const row = weapons()[index];
        if (!row) return;
        const typed = plain(row.name).trim();
        // Comme pour les armures : une arme nommée n'est supprimée qu'après confirmation
        if (typed) {
            const ok = await confirmModal({
                title: "Supprimer l'arme",
                icon: 'trash',
                message: `Supprimer « ${typed} » du tableau des armes ?`,
                confirmLabel: 'Supprimer',
                confirmIcon: 'trash',
                danger: true
            });
            if (!ok || isLocked()) return;
        }
        // Le tableau a pu changer pendant la confirmation (ici ou dans un autre onglet) : on retire
        // la ligne demandée, retrouvée par son contenu
        const list = weapons();
        const at = locateRow(list, row, index);
        if (at === -1) {
            setStatus(`⚠️ « ${typed || 'Arme sans nom'} » a été modifiée entre-temps (autre onglet) : rien n'a été supprimé`);
            return;
        }
        index = at;
        const name = typed || 'sans nom';
        store.update({ dynamic_weapons: removeWeapon(list, index) });

        lastDeleted = { index, row };
        undoText.textContent = `Arme « ${name} » supprimée. `;
        undoBox.hidden = false;
        clearTimeout(undoTimer);
        undoTimer = setTimeout(hideUndo, UNDO_DELAY_MS);
        setStatus(`Arme « ${name} » supprimée`);

        (nearestVisibleRow(index)?.deleteBtn || addButton).focus();
    }

    /** Ligne affichée la plus proche de index (d'abord vers le bas, puis vers le haut) */
    function nearestVisibleRow(index) {
        for (let i = index; i < ctx.rows.length; i++) if (!ctx.rows[i].tr.hidden) return ctx.rows[i];
        for (let i = Math.min(index, ctx.rows.length) - 1; i >= 0; i--) if (!ctx.rows[i].tr.hidden) return ctx.rows[i];
        return null;
    }

    /** Donne le focus au nom d'une ligne, en la gardant visible quel que soit le filtre */
    function focusRowName(row) {
        if (!row) return;
        ctx.pinnedRow = row;
        ctx.refresh();
        row.inputs.name.focus();
    }

    function hideUndo() {
        clearTimeout(undoTimer);
        lastDeleted = null;
        undoBox.hidden = true;
    }

    function undoDelete() {
        if (!lastDeleted || isLocked()) return;
        const { index, row } = lastDeleted;
        hideUndo();
        const position = Math.max(0, Math.min(index, weapons().length));
        store.update({ dynamic_weapons: restoreWeapon(weapons(), index, row) });
        setStatus(`Arme « ${plain(row.name) || 'sans nom'} » rétablie`);
        focusRowName(ctx.rows[position]);
    }

    return { undoBox, addButton, deleteWeapon, hideUndo };
}
