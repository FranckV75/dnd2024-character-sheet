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
// Options icon (titre) et actions[].icon : nom d'une icône dessinée de dom.js (moon, cloud...).
// Un titre ou un libellé qui commence par un émoji connu (« 📂 Importer ») reçoit l'icône
// dessinée équivalente : l'émoji est retiré du texte (et donc du nom lu par les lecteurs d'écran).
// =============================================================================

import { el, icon as drawIcon } from './dom.js';

/** Émojis de début de titre ou de libellé → icône dessinée (dom.js).
 *  Clés sans le sélecteur de présentation U+FE0F, retiré avant la recherche. */
const EMOJI_ICONS = new Map([
    ['📂', 'import'], ['📁', 'image'], ['⬇', 'export'], ['⬆', 'import'], ['📄', 'file-plus'],
    ['👤', 'user'], ['👥', 'users'], ['🔑', 'lock'], ['☁', 'cloud'], ['💾', 'scroll'],
    ['⚔', 'swords'], ['✏', 'feather'], ['📋', 'scroll'], ['⚠', 'warning'], ['🌙', 'moon'],
    ['🛏', 'bed'], ['🗑', 'trash']
]);
const VARIATION_SELECTOR = /\uFE0F/g;

/**
 * Sépare un émoji de tête connu du reste du texte.
 * @param {string} text
 * @param {string} [iconName] icône imposée par l'appelant
 * @returns {{ text: string, icon: string|null }}
 */
function splitIcon(text, iconName) {
    const label = String(text ?? '');
    const space = label.indexOf(' ');
    const name = space > 0 ? EMOJI_ICONS.get(label.slice(0, space).replace(VARIATION_SELECTOR, '')) : null;
    return name
        ? { text: label.slice(space + 1), icon: iconName || name }
        : { text: label, icon: iconName || null };
}

/** Contenu d'un titre ou d'un bouton : icône dorée (décorative) puis texte */
function iconAndText({ text, icon: name }) {
    return name ? [drawIcon(name), el('span', { class: 'btn-label', text })] : [text];
}

/**
 * @param {{ title: string, icon?: string, body?: Node|Node[], actions?: Array<{label: string, icon?: string, primary?: boolean, danger?: boolean, onClick?: () => (void|boolean)}>, wide?: boolean, onClose?: () => void }} options
 * @returns {() => void} Fonction qui ferme la fenêtre
 */
export function openModal({ title, icon, body = [], actions = [{ label: 'Fermer' }], wide = false, onClose }) {
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
        on: {
            click: () => {
                const result = action.onClick?.();
                if (result !== false) close();
            }
        }
    }, iconAndText(splitIcon(action.label, action.icon))));

    dialog.append(el('div', { class: 'modal-content' },
        el('div', { class: 'modal-head' },
            el('h2', { class: 'modal-title', id: titleId }, iconAndText(splitIcon(title, icon))),
            el('span', { class: 'modal-ornament', 'aria-hidden': 'true', text: '✦' })),
        el('div', { class: 'modal-body' }, body),
        el('div', { class: 'modal-actions' }, buttons)));

    // Boutons du contenu écrits en texte seul (« 📂 Choisir un fichier… ») : même traitement
    for (const button of dialog.querySelectorAll('.modal-body .btn')) {
        if (button.children.length > 0) continue;
        const parts = splitIcon(button.textContent);
        if (parts.icon) button.replaceChildren(...iconAndText(parts));
    }

    document.body.append(dialog);
    dialog.showModal();

    const firstInput = dialog.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
    (firstInput || buttons.find(b => b.classList.contains('btn-primary')) || buttons[0])?.focus();

    return close;
}

/**
 * Demande une confirmation.
 * @param {{ title: string, icon?: string, message: string, confirmLabel?: string, confirmIcon?: string, danger?: boolean }} options
 * @returns {Promise<boolean>}
 */
export function confirmModal({ title, icon, message, confirmLabel = 'Confirmer', confirmIcon, danger = false }) {
    return new Promise((resolve) => {
        let answered = false;
        openModal({
            title,
            // Une confirmation risquée n'apparaît jamais sans icône
            icon: icon || (danger ? 'warning' : undefined),
            body: el('p', { text: message }),
            actions: [
                { label: 'Annuler' },
                { label: confirmLabel, icon: confirmIcon, primary: !danger, danger, onClick: () => { answered = true; } }
            ],
            onClose: () => resolve(answered)
        });
    });
}
