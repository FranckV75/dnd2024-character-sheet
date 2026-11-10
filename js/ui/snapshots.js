// =============================================================================
// SNAPSHOTS.JS (interface) - Bouton « Revenir à… » de la barre Gestion
//
// Liste les sauvegardes de secours datées gardées sur l'appareil (js/state/snapshots.js) :
// date et heure, nom du personnage, niveau et classe, moment de la sauvegarde. Revenir à un état
// remplace la fiche comme un import (source 'snapshot') ; la fiche remplacée est gardée d'abord
// (main.js, store.beforeReplace), donc un retour en arrière s'annule de la même façon.
// Bouton masqué fiche verrouillée (edit-only), comme « Importer ».
// =============================================================================

import { el, icon, setIconLabel } from './dom.js';
import { openModal, confirmModal } from './modal.js';
import { readSnapshots, snapshotCharacter, formatSnapshotDate, SNAPSHOT_REASONS } from '../state/snapshots.js';

/** Résumé d'un état : « Niveau 5 · Barbare » */
function detailOf(entry) {
    return [entry.level && `Niveau ${entry.level}`, entry.cls].filter(Boolean).join(' · ');
}

/**
 * @param {{ store: Object, setStatus: (message: string) => void }} ctx
 */
export function initSnapshots({ store, setStatus }) {
    const group = document.querySelector('#toolbar-panel .btn-group');
    if (!group) return;
    const button = el('button', {
        type: 'button', class: 'btn edit-only', id: 'btn-snapshots',
        'aria-haspopup': 'dialog', title: 'Revenir à un état précédent de la fiche (sauvegardes de secours de cet appareil)',
        on: { click: () => openSnapshots(store, setStatus) }
    });
    setIconLabel(button, 'hourglass', 'Revenir à…');
    // Après « Importer » : les deux remplacent la fiche
    const importButton = group.querySelector('#btn-import');
    if (importButton) importButton.after(button);
    else group.append(button);
}

function openSnapshots(store, setStatus) {
    const entries = readSnapshots();
    const message = el('p', { class: 'toolbar-modal-msg', role: 'alert' });
    let close = () => {};

    async function restore(entry) {
        let character;
        try {
            ({ character } = snapshotCharacter(entry));
        } catch (error) {
            message.replaceChildren(icon('warning'), ` ${error.message}`);
            message.classList.add('is-error');
            return;
        }
        const when = formatSnapshotDate(entry.at);
        const ok = await confirmModal({
            title: 'Revenir à cet état ?',
            message: `La fiche actuelle sera remplacée par « ${entry.name || 'Sans nom'} » du ${when}. `
                + 'Elle est d\'abord gardée dans cette liste (sauf une fiche vierge) : vous pourrez y revenir. '
                + 'Connecté à votre compte : le retour y est enregistré comme une modification ordinaire '
                + '(une question est posée si la version en ligne a changé entre-temps).',
            confirmLabel: 'Revenir à cet état'
        });
        if (!ok) return;
        close();
        store.replace(character, { source: 'snapshot' });
        setStatus(`Fiche revenue au ${when}.`);
    }

    const list = el('ul', { class: 'account-list snapshot-list' },
        ...(entries.length ? entries.map((entry) => {
            const when = formatSnapshotDate(entry.at);
            const detail = detailOf(entry);
            return el('li', { class: 'account-item' },
                el('div', { class: 'account-item-text' },
                    el('strong', { text: `${when} — ${entry.name || 'Sans nom'}` }),
                    el('span', { class: 'muted', text: [detail, SNAPSHOT_REASONS[entry.reason] ?? SNAPSHOT_REASONS.replace].filter(Boolean).join(' · ') })),
                el('div', { class: 'account-item-actions' },
                    el('button', {
                        type: 'button', class: 'btn',
                        'aria-label': `Revenir à l'état du ${when} (${entry.name || 'sans nom'})`,
                        on: { click: () => { restore(entry); } }
                    }, icon('hourglass'), el('span', { class: 'btn-label', text: 'Revenir' }))));
        }) : [el('li', { class: 'muted', text: 'Aucune sauvegarde de secours pour le moment : la première est prise à la prochaine ouverture de la fiche.' })]));

    close = openModal({
        title: 'Revenir à…',
        icon: 'hourglass',
        wide: true,
        body: [
            el('p', { class: 'toolbar-modal-note', text: 'Les derniers états de la fiche, gardés sur cet appareil seulement : à chaque ouverture, avant un repos long et avant tout remplacement (import, nouvelle fiche, chargement depuis le compte).' }),
            list,
            message
        ],
        actions: [{ label: 'Fermer' }],
        focusField: false
    });
}
