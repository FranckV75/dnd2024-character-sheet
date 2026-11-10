// =============================================================================
// BACKGROUND.JS (interface) - Bloc « Historique » de l'encadré « Espèce & historique »
//
// Ce que donne l'historique choisi en haut de la fiche (caractéristiques, don d'origine,
// compétences, outil, équipement), avec un repère « À vérifier » pour ce qui manque, et un
// bouton « Appliquer » (fiche déverrouillée) qui coche les compétences et remplit le don de
// niveau 1 s'il est vide, après confirmation. Règles : js/rules/background.js.
// =============================================================================

import { el, icon } from './dom.js';
import { confirmModal } from './modal.js';
import { foldButton, bindFolding, applyFolds } from './fold.js';
import { backgroundSummary, backgroundApplyPatch } from '../rules/background.js';

/** Clés qui changent le bloc */
const WATCHED = /^(char_background|feat_1|feat_choices|profs_tools|skill_prof_)/;

function lineItem(line) {
    return el('li', { class: 'origin-line', 'data-origin-line': line.id },
        el('span', { class: 'origin-line-label', text: line.label }),
        el('span', { class: 'origin-line-text', text: line.text }),
        line.check ? el('span', { class: 'origin-check' }, icon('warning'),
            el('span', { class: 'feat-tag', 'data-kind': 'check', text: 'À vérifier' }),
            el('span', { text: line.check })) : null);
}

/**
 * @param {{ root: HTMLElement, store: Object, setStatus?: Function }} ctx
 */
export function initBackground({ root, store, setStatus = () => {} }) {
    const container = root.querySelector('#background-info');
    if (!container) return;

    async function apply() {
        const character = store.get();
        const summary = backgroundSummary(character);
        if (!summary?.canApply) return;
        const ok = await confirmModal({
            title: `Historique : ${summary.name}`,
            icon: 'scroll',
            message: `La fiche va ${summary.applyText.join(' et ')}. Les caractéristiques et les outils ne changent pas.`,
            confirmLabel: 'Appliquer'
        });
        if (!ok) return;
        const patch = backgroundApplyPatch(store.get());
        if (Object.keys(patch).length) {
            store.update(patch);
            // Le bouton disparaît une fois tout appliqué : le focus revient au titre du bloc
            if (!container.contains(document.activeElement)) {
                (container.querySelector('.origin-apply button') ?? container.querySelector('.fold-toggle'))?.focus({ preventScroll: true });
            }
            setStatus(`Historique ${summary.name} appliqué.`);
        }
    }

    let rendered = null;
    const render = (character) => {
        const summary = backgroundSummary(character);
        const signature = JSON.stringify(summary);
        if (signature === rendered) return;
        rendered = signature;
        if (!summary) {
            container.replaceChildren();
            container.hidden = true;
            return;
        }
        container.replaceChildren(
            el('p', { class: 'subclass-title origin-title' }, icon('scroll'),
                el('span', { text: `Historique : ${summary.name}` }),
                foldButton(`Historique : ${summary.name}`)),
            el('ul', { class: 'origin-lines' }, summary.lines.map(lineItem)),
            summary.canApply ? el('p', { class: 'origin-apply edit-only' },
                el('button', {
                    type: 'button', class: 'btn-chip', 'aria-haspopup': 'dialog',
                    on: { click: apply }
                }, icon('plus'), el('span', { text: 'Appliquer à la fiche' })),
                el('small', { text: ` ${summary.applyText.join(' ; ')}.` })) : null
        );
        container.hidden = false;
        container.dataset.foldKey = 'origin:background';
        applyFolds(container);
    };
    bindFolding(container);
    render(store.get());
    store.subscribe((character, changedKeys) => {
        if (changedKeys === null || changedKeys.some((key) => WATCHED.test(key))) render(character);
    });
}
