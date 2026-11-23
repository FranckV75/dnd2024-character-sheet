// =============================================================================
// SPELLS/CLEANUP.JS - Bouton « Retirer les sorts non préparés » (Clerc, Druide, Paladin, Rôdeur)
//
// Ces classes préparent dans toute leur liste par la fenêtre « Préparer mes sorts » : les sorts
// décochés restent au grimoire et s'y accumulent. Le bouton (sous le tableau, fiche déverrouillée,
// seulement s'il y a quelque chose à retirer) ouvre une fenêtre qui LISTE les lignes qui vont
// partir, puis les retire d'un coup.
//  - Quelles lignes : js/rules/spell-preparation.js (unpreparedCleanup). Jamais un sort préparé,
//    mineur ou donné, ni une ligne en cours de saisie ; en cas de doute, la ligne reste.
//  - Lignes où le joueur a écrit quelque chose à lui (note, colonne réécrite, case C / R / M cochée
//    en plus) : listées à part avec ce qu'il a écrit, décochées (gardées) par défaut.
//  - Sécurité : l'état d'avant est d'abord gardé dans « Revenir à… » (ctx.keepSnapshot) ; s'il ne
//    peut pas l'être (stockage plein ou indisponible), rien n'est retiré. Si la fiche a changé
//    pendant que la fenêtre était ouverte (synchronisation), rien n'est retiré non plus.
// Jamais proposé au Magicien (ses sorts non préparés sont son livre) ni aux classes à liste fixe.
// =============================================================================

import { el, icon } from '../dom.js';
import { openModal } from '../modal.js';
import { frenchSpaces } from '../help.js';
import { isLocked } from '../lock.js';
import { highestSlotLevel, grantedSpellKeys, unpreparedCleanup, removeSpellRows } from '../../rules/spell-preparation.js';

export const CLEANUP_LABEL = 'Retirer les sorts non préparés';
const CLEANUP_TITLE = 'Retirer du grimoire les sorts de votre classe que vous ne préparez plus (la liste vous est montrée avant)';

const plural = (count) => `${count} sort${count > 1 ? 's' : ''}`;
const removedText = (count) => `${plural(count)} retiré${count > 1 ? 's' : ''} du grimoire ; l'état d'avant est dans « Revenir à… ».`;

/**
 * @param {{ store: Object, setStatus: (message: string) => void, keepSnapshot?: (reason: string) => ({ saved: boolean, why?: string }|void),
 *   getSpellsDb: () => Object[], getSkip: () => number[] }} deps
 *   getSkip : indices des lignes en cours de saisie (jamais retirées)
 * @returns {{ button: HTMLButtonElement, render(character: Object, d: Object): void }}
 */
export function createCleanupButton({ store, setStatus, keepSnapshot, getSpellsDb, getSkip }) {
    const planOf = (character, d) => unpreparedCleanup(character.dynamic_spells, getSpellsDb(), {
        classSlug: d.classSlug, maxLevel: highestSlotLevel(d.spellSlots), granted: grantedSpellKeys(character, d, getSpellsDb()), skip: getSkip()
    });

    function open(d) {
        const plan = planOf(store.get(), d);
        if (plan.remove.length + plan.noted.length === 0) return;
        const extra = new Set();
        const chosen = () => [...plan.remove, ...plan.noted.filter(entry => extra.has(entry))];

        const line = (entry) => el('li', { class: 'prep-item' },
            el('span', { class: 'prep-text' }, el('span', { class: 'prep-name', text: entry.name }),
                el('small', { class: 'prep-note', text: `niveau ${entry.level}` })));
        const notedLine = (entry) => el('li', { class: 'prep-item' },
            el('label', { class: 'prep-label' },
                el('input', {
                    type: 'checkbox', class: 'round-check',
                    on: { change: (event) => {
                        if (event.target.checked) extra.add(entry);
                        else extra.delete(entry);
                        sync();
                    } }
                }),
                el('span', { class: 'prep-text' }, el('span', { class: 'prep-name', text: entry.name }),
                    el('small', { class: 'prep-note', text: frenchSpaces(`niveau ${entry.level} · écrit par vous : ${entry.written.join(', ')}`) }))));

        const count = el('p', { class: 'cleanup-count', role: 'status' });
        const body = [
            el('p', { text: frenchSpaces(plan.remove.length
                ? `Ces sorts non préparés vont quitter le grimoire. Rien d'autre ne change : vos sorts préparés, vos sorts mineurs et vos sorts donnés restent. Pour reprendre un sort plus tard, cochez-le dans « Préparer mes sorts ».`
                : `Aucun sort à retirer d'office. Rien d'autre ne change : vos sorts préparés, vos sorts mineurs et vos sorts donnés restent.`) }),
            plan.remove.length ? el('ul', { class: 'prep-items cleanup-list', 'aria-label': 'Sorts qui vont être retirés' }, plan.remove.map(line)) : null,
            plan.noted.length ? el('section', { class: 'prep-group cleanup-noted', 'aria-label': 'Sorts gardés parce que vous y avez écrit' },
                el('h3', { class: 'prep-level', text: 'Gardés : vous y avez écrit' }),
                el('p', { class: 'muted', text: 'Ces sorts non préparés restent au grimoire. Cochez ceux que vous voulez retirer aussi (ce que vous y avez écrit partira avec eux).' }),
                el('ul', { class: 'prep-items cleanup-list' }, plan.noted.map(notedLine))) : null,
            count,
            el('p', { class: 'muted', text: frenchSpaces("Sécurité : avant de retirer, la fiche garde l'état actuel dans « Revenir à… » (barre du haut, fiche déverrouillée).") })
        ].filter(Boolean);

        const confirm = () => {
            const picked = chosen();
            if (!picked.length) return false;
            const rows = removeSpellRows(store.get().dynamic_spells, picked);
            if (!rows) {
                setStatus("La fiche a changé entre-temps : aucun sort n'a été retiré. Rouvrez la fenêtre.");
                return true;
            }
            // État d'avant gardé (ou déjà présent dans la liste) : sinon rien n'est retiré
            const kept = keepSnapshot?.('spell-cleanup');
            if (!kept || (!kept.saved && kept.why !== 'same')) {
                setStatus("⚠️ L'état d'avant n'a pas pu être gardé dans « Revenir à… » : aucun sort n'a été retiré.");
                return true;
            }
            store.update({ dynamic_spells: rows });
            setStatus(removedText(picked.length));
            return true;
        };

        let unsubscribe = () => {};
        const close = openModal({
            title: CLEANUP_LABEL,
            icon: 'trash',
            wide: true,
            focusField: false,
            body,
            actions: [
                { label: 'Annuler', primary: true },
                { label: 'Retirer', icon: 'trash', danger: true, onClick: confirm }
            ],
            onClose: () => unsubscribe()
        });
        const confirmBtn = count.closest('dialog')?.querySelector('.modal-actions .btn-danger');
        const confirmLabel = confirmBtn?.querySelector('.btn-label');
        function sync() {
            const total = chosen().length;
            count.textContent = total ? `À retirer : ${plural(total)}.` : 'Rien à retirer pour le moment : cochez un sort ci-dessus, ou annulez.';
            if (confirmBtn) confirmBtn.disabled = total === 0;
            if (confirmLabel) confirmLabel.textContent = total ? `Retirer ${plural(total)}` : 'Retirer';
        }
        sync();
        // Fiche changée pendant que la fenêtre est ouverte (autre fiche, synchronisation des sorts) :
        // la liste montrée n'est plus sûre, la fenêtre se ferme sans rien retirer
        unsubscribe = store.subscribe((_, changedKeys) => {
            if (!changedKeys || changedKeys.includes('dynamic_spells')) close();
        });
    }

    let lastDerived = null;
    const button = el('button', {
        type: 'button', class: 'add-row edit-only spell-cleanup-btn', hidden: true, title: CLEANUP_TITLE,
        on: { click: () => { if (lastDerived) open(lastDerived); } }
    }, icon('trash'), el('span', { class: 'btn-label', text: CLEANUP_LABEL }));

    return {
        button,
        render(character, d) {
            lastDerived = d;
            const plan = isLocked() ? null : planOf(character, d);
            button.hidden = !plan || plan.remove.length + plan.noted.length === 0;
        }
    };
}
