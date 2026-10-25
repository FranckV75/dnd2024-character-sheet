// =============================================================================
// CELL-TEXT.JS - Case de texte de tableau qui passe à la ligne (partagée)
//
// Les cases des tableaux (armes, armures, sorts) affichent le texte en entier :
// il passe à la ligne et la case s'agrandit en hauteur. La touche Entrée
// n'insère pas de saut de ligne (une case = une valeur), et un texte collé
// sur plusieurs lignes est remis sur une seule.
// La hauteur est recalculée : à la saisie, quand la largeur change (onglet
// affiché, rotation de la tablette), après chaque mise à jour de la fiche
// (fitCellTexts, appelé par main.js) et autour de l'impression.
// =============================================================================

import { el } from './dom.js';

const CLASS = 'cell-text';

/** Ajuste la hauteur d'une case à son contenu */
export function fitCellText(textarea) {
    if (!textarea.isConnected || textarea.offsetWidth === 0) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

/** Ajuste toutes les cases de `root` */
export function fitCellTexts(root = document) {
    for (const textarea of root.querySelectorAll(`textarea.${CLASS}`)) fitCellText(textarea);
}

const widths = new WeakMap();
const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver((entries) => {
        for (const { target, contentRect } of entries) {
            // Seulement quand la LARGEUR change (sinon la hauteur ajustée relancerait l'observateur)
            if (widths.get(target) !== contentRect.width) {
                widths.set(target, contentRect.width);
                fitCellText(target);
            }
        }
    })
    : null;

/**
 * Crée une case de texte extensible (remplace un <input type="text"> de tableau).
 * @param {Object} attrs - mêmes attributs que pour el() ; on.input reste appelé
 * @returns {HTMLTextAreaElement}
 */
export function cellText(attrs = {}) {
    const { class: className = '', on = {}, ...rest } = attrs;
    const textarea = el('textarea', {
        ...rest,
        rows: '1',
        class: `${className} ${CLASS}`.trim(),
        on: {
            ...on,
            input: (event) => {
                // Une seule ligne de valeur : les retours à la ligne collés deviennent des espaces
                if (textarea.value.includes('\n')) {
                    const caret = textarea.selectionStart;
                    textarea.value = textarea.value.replace(/\s*\n\s*/g, ' ');
                    textarea.setSelectionRange(caret, caret);
                }
                fitCellText(textarea);
                on.input?.(event);
            },
            keydown: (event) => {
                if (event.key === 'Enter') event.preventDefault();
                on.keydown?.(event);
            }
        }
    });
    resizeObserver?.observe(textarea);
    return textarea;
}

// Impression : la largeur de la page imprimée diffère de l'écran, la hauteur est
// laissée au navigateur (voir css/print.css), puis recalculée au retour
if (typeof window !== 'undefined') {
    window.addEventListener('beforeprint', () => {
        for (const textarea of document.querySelectorAll(`textarea.${CLASS}`)) textarea.style.height = '';
    });
    window.addEventListener('afterprint', () => fitCellTexts());
}
