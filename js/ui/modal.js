// =============================================================================
// MODAL.JS - Fenêtres de dialogue accessibles (partagées par toutes les fonctionnalités)
//
// Basé sur l'élément natif <dialog> : focus piégé, touche Échap, focus restauré.
// Usage :
//   const close = openModal({
//       title: 'Repos court',
//       body: el('p', { text: '...' }),            // Node ou tableau de Nodes
//       actions: [
//           { label: 'Annuler' },                   // ferme simplement
//           { label: 'Valider', primary: true, onClick: () => { ...; return false; } }
//       ]                                           // onClick qui renvoie false = ne pas fermer
//   });
// =============================================================================

import { el } from './dom.js';

/**
 * @param {{ title: string, body?: Node|Node[], actions?: Array<{label: string, primary?: boolean, danger?: boolean, onClick?: () => (void|boolean)}>, wide?: boolean, onClose?: () => void }} options
 * @returns {() => void} Fonction qui ferme la fenêtre
 */
export function openModal({ title, body = [], actions = [{ label: 'Fermer' }], wide = false, onClose }) {
    const previousFocus = document.activeElement;
    const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;

    const dialog = el('dialog', { class: wide ? 'modal modal-wide' : 'modal', 'aria-labelledby': titleId });

    // Nettoyage exécuté une seule fois, que la fenêtre soit fermée par un bouton
    // (close() ci-dessous) ou par le navigateur (touche Échap → événement 'close',
    // qui peut arriver en différé)
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        dialog.remove();
        onClose?.();
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };

    const close = () => {
        if (dialog.open) dialog.close();
        finish();
    };

    dialog.addEventListener('close', finish);

    // Clic sur le fond (en dehors du contenu) : ferme
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) close();
    });

    const buttons = actions.map(action => el('button', {
        type: 'button',
        class: ['btn', action.primary && 'btn-primary', action.danger && 'btn-danger'].filter(Boolean).join(' '),
        text: action.label,
        on: {
            click: () => {
                const result = action.onClick?.();
                if (result !== false) close();
            }
        }
    }));

    dialog.append(el('div', { class: 'modal-content' },
        el('h2', { class: 'modal-title', id: titleId, text: title }),
        el('div', { class: 'modal-body' }, body),
        el('div', { class: 'modal-actions' }, buttons)));

    document.body.append(dialog);
    dialog.showModal();

    const firstInput = dialog.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
    (firstInput || buttons.find(b => b.classList.contains('btn-primary')) || buttons[0])?.focus();

    return close;
}

/**
 * Demande une confirmation.
 * @param {{ title: string, message: string, confirmLabel?: string, danger?: boolean }} options
 * @returns {Promise<boolean>}
 */
export function confirmModal({ title, message, confirmLabel = 'Confirmer', danger = false }) {
    return new Promise((resolve) => {
        let answered = false;
        openModal({
            title,
            body: el('p', { text: message }),
            actions: [
                { label: 'Annuler' },
                { label: confirmLabel, primary: !danger, danger, onClick: () => { answered = true; } }
            ],
            onClose: () => resolve(answered)
        });
    });
}
