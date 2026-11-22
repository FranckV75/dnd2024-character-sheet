// =============================================================================
// STATUS-BAR.JS - Dernier message de la barre du haut (#save-status) lisible au doigt
//
// La barre coupe les messages trop longs par « … » (une ligne sur tablette menu replié, deux
// ailleurs, voir css/toolbar.css). Le texte entier était seulement dans l'infobulle (title),
// inaccessible au doigt. Quand le message est coupé :
//  - un petit chevron apparaît au bout du message : un bouton (aria-expanded) ;
//  - toucher le chevron ou le message l'affiche en entier, sur plusieurs lignes (la barre
//    s'agrandit d'autant) ; un nouveau toucher, ou le message suivant, le replie.
// Un message qui tient en entier ne change pas : ni chevron, ni toucher.
// #save-status reste la zone annoncée (role="status") : le bouton est à côté, pas autour.
// Branché par js/ui/toolbar.js.
// =============================================================================

import { el, icon } from './dom.js';

const LINE_CLASS = 'app-bar-status-line';
const CLIPPED_CLASS = 'is-clipped';
const EXPANDED_CLASS = 'is-expanded';

const LABEL_OPEN = 'Lire le message en entier';
const LABEL_CLOSE = 'Replier le message';
const TITLE_OPEN = 'Message coupé : toucher pour le lire en entier';

/**
 * Le texte d'un élément dépasse-t-il de sa boîte (coupé par « … » en largeur ou en hauteur) ?
 * Un pixel de marge : les arrondis de mise en page ne comptent pas comme un texte coupé.
 * @param {{ scrollWidth: number, clientWidth: number, scrollHeight: number, clientHeight: number }} box
 * @returns {boolean}
 */
export function isClipped({ scrollWidth, clientWidth, scrollHeight, clientHeight }) {
    return scrollWidth > clientWidth + 1 || scrollHeight > clientHeight + 1;
}

/** Branche le dépliage du dernier message de la barre (une seule fois) */
export function initStatusBar() {
    const status = document.getElementById('save-status');
    if (!status || !status.parentElement || status.parentElement.classList.contains(LINE_CLASS)) return;

    let expanded = false;

    const button = el('button', {
        type: 'button', class: 'status-more', id: 'btn-status-more',
        'aria-controls': 'save-status', 'aria-expanded': 'false', hidden: true,
        on: { click: () => setExpanded(!expanded) }
    }, icon('chevron'));

    // Message et chevron sur la même ligne (rangée à droite de la barre)
    const line = el('div', { class: LINE_CLASS });
    status.before(line);
    line.append(status, button);

    function render() {
        line.classList.toggle(EXPANDED_CLASS, expanded);
        button.setAttribute('aria-expanded', String(expanded));
        const label = expanded ? LABEL_CLOSE : LABEL_OPEN;
        button.setAttribute('aria-label', label);
        button.title = expanded ? LABEL_CLOSE : TITLE_OPEN;
    }

    /** Message coupé ? Mesuré sans le chevron (il prend un peu de place à la ligne) */
    function measure() {
        if (expanded) return;
        button.hidden = true;
        const clipped = status.textContent.trim() !== '' && isClipped(status);
        button.hidden = !clipped;
        line.classList.toggle(CLIPPED_CLASS, clipped);
    }

    function setExpanded(on) {
        expanded = Boolean(on) && !button.hidden; // rien à déplier si le message tient
        render();
        if (!expanded) measure();
    }

    // Toucher le message lui-même : même effet que le chevron (cible plus grande au doigt).
    // Pas quand on vient de sélectionner du texte à la souris.
    status.addEventListener('click', () => {
        if (button.hidden) return;
        const selection = typeof window.getSelection === 'function' ? window.getSelection() : null;
        if (selection && !selection.isCollapsed && status.contains(selection.anchorNode)) return;
        setExpanded(!expanded);
    });

    // Nouveau message : replié, puis mesuré
    new MutationObserver(() => setExpanded(false))
        .observe(status, { childList: true, characterData: true, subtree: true });

    // Place qui change (rotation, menu « Gestion » ouvert ou fermé : une ou deux lignes) :
    // nouvelle mesure ; si la largeur change, le message déplié se replie (il tient peut-être).
    let lastWidth = -1;
    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(() => {
            const width = line.clientWidth;
            if (expanded && width !== lastWidth && lastWidth !== -1) setExpanded(false);
            else measure();
            lastWidth = width;
        }).observe(line);
    }
    // Polices chargées après coup : le texte change de largeur
    document.fonts?.ready?.then(measure);

    render();
    measure();
}
