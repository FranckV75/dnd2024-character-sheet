// =============================================================================
// CELL-TEXT.JS - Case de texte de tableau qui passe à la ligne (partagée)
//
// Les cases des tableaux (armes, armures, sorts) affichent le texte en entier :
// il passe à la ligne et la case s'agrandit en hauteur. La touche Entrée
// n'insère pas de saut de ligne (une case = une valeur), et un texte collé
// sur plusieurs lignes est remis sur une seule.
// La hauteur est recalculée : à la saisie, quand la largeur change (onglet
// affiché, rotation de la tablette), quand les marges intérieures ou la taille du
// texte changent (ligne de saisie des sorts devenue un sort), après chaque mise à jour de la fiche
// (fitCellTexts, appelé par main.js) et autour de l'impression.
// =============================================================================

import { el } from './dom.js';

const CLASS = 'cell-text';

/**
 * Dernier ajustement de chaque case : texte, largeur, marges intérieures et taille du texte.
 * Les marges comptent : sur tablette, la ligne de saisie des sorts a des marges de 12,5 px
 * qu'elle perd en devenant un sort, sans que son texte ni sa largeur changent.
 * (Le chargement des polices et l'impression réajustent tout.)
 * Lu juste après offsetWidth, qui a déjà calculé les styles : la lecture ne coûte presque rien.
 */
const fitted = new WeakMap();
function fitKey(textarea) {
    const width = textarea.offsetWidth;
    const style = typeof getComputedStyle === 'function' ? getComputedStyle(textarea) : null;
    const box = style
        ? `${style.paddingTop}|${style.paddingBottom}|${style.fontSize}|${style.lineHeight}`
        : '';
    return `${width}|${box}|${textarea.value}`;
}

/** Ajuste la hauteur d'une case à son contenu */
export function fitCellText(textarea) {
    if (!textarea.isConnected || textarea.offsetWidth === 0) return;
    // Lu avant d'écrire : relire la largeur après coup forcerait une mise en page de plus
    const key = fitKey(textarea);
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    fitted.set(textarea, key);
}

/**
 * Ajuste toutes les cases de `root`, par lots : on lit tout, puis on écrit tout.
 * Alterner lecture et écriture case par case forçait le navigateur à recalculer
 * la mise en page à chaque case (environ 7 fois plus lent sur l'onglet Combat).
 * Après une mise à jour de la fiche, seules les cases dont le texte, la largeur, les marges
 * intérieures ou la taille du texte ont changé sont réajustées : remettre toutes les hauteurs à « auto » à chaque frappe forçait une mise
 * en page complète en plus (environ 9 ms par lettre sur une tablette lente).
 * @param {ParentNode} [root]
 * @param {{ all?: boolean }} [options] - all : réajuster toutes les cases (polices, impression)
 */
export function fitCellTexts(root = document, { all = false } = {}) {
    const visible = [...root.querySelectorAll(`textarea.${CLASS}`)]
        .filter((textarea) => textarea.isConnected && textarea.offsetWidth !== 0);
    const stale = visible.map((textarea) => [textarea, fitKey(textarea)])
        .filter(([textarea, key]) => all || fitted.get(textarea) !== key);
    if (stale.length === 0) return;
    for (const [textarea] of stale) textarea.style.height = 'auto';
    const heights = stale.map(([textarea]) => textarea.scrollHeight);
    stale.forEach(([textarea, key], i) => {
        textarea.style.height = `${heights[i]}px`;
        fitted.set(textarea, key);
    });
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
    window.addEventListener('afterprint', () => fitCellTexts(document, { all: true }));
    // Police chargée après le premier ajustement : les hauteurs changent sans changement de texte
    document.fonts?.addEventListener?.('loadingdone', () => fitCellTexts(document, { all: true }));
}
